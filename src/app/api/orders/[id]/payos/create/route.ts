/**
 * POST /api/orders/[id]/payos/create
 * Create a PayOS payment link for an order.
 * Auth: customer only (owner of the order).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { createPaymentLink } from '@/lib/payos/client'

// Statuses that allow payment
const PAYABLE_STATUSES = ['pending', 'staff_review', 'confirmed', 'deposit_paid'] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getAuthenticatedProfile(req)

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = resolvedParams.id

  try {
    const admin = await createAdminClient()

    // Get order with customer_id check
    const { data: order, error: fetchError } = await admin
      .from('orders')
      .select('id, order_code, status, total_amount, payment_status, payos_payment_id, customer_id')
      .eq('id', orderId)
      .maybeSingle()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Customer can only pay their own orders
    if (order.customer_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Already paid?
    if (order.payment_status === 'paid') {
      console.log('[PayOS Create] Rejected: order already paid')
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
    }

    // Must have total_amount
    if (!order.total_amount || Number(order.total_amount) <= 0) {
      console.log('[PayOS Create] Rejected: total_amount =', order.total_amount)
      return NextResponse.json({ error: 'Order total not set' }, { status: 400 })
    }

    // Check if already has a PayOS payment link (don't create duplicate)
    if (order.payos_payment_id) {
      console.log('[PayOS Create] Rejected: payos_payment_id already exists')
      return NextResponse.json({
        error: 'Payment link already exists',
        existingPaymentId: order.payos_payment_id,
      }, { status: 409 })
    }

    // Validate payable status
    console.log('[PayOS Create] Debug:', {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: order.payment_status,
      totalAmount: order.total_amount,
      payosPaymentId: order.payos_payment_id,
      customerIdMatch: order.customer_id === profile.id,
      isPayableStatus: PAYABLE_STATUSES.includes(order.status as (typeof PAYABLE_STATUSES)[number]),
    })
    if (!PAYABLE_STATUSES.includes(order.status as (typeof PAYABLE_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Cannot create payment link for order status: ${order.status}` },
        { status: 400 }
      )
    }

    // Generate unique order code for PayOS (timestamp-based, min 6 digits)
    const orderCode = Math.floor(Date.now() / 1000) % 100000 + 100000

    // Create payment link
    const returnUrl = `${req.headers.get('origin')}/dashboard/orders/${orderId}?payment=redirected`
    const { paymentUrl, payosPaymentId } = await createPaymentLink(
      orderCode,
      Number(order.total_amount),
      `Don hang ${order.order_code}`,
      returnUrl
    )

    // Save payos_payment_id to order
    const { error: updateError } = await admin
      .from('orders')
      .update({ payos_payment_id: payosPaymentId })
      .eq('id', orderId)

    if (updateError) {
      console.error('[PayOS Create] Failed to save payos_payment_id:', updateError.message)
      return NextResponse.json({ error: 'Failed to save payment reference' }, { status: 500 })
    }

    return NextResponse.json({ paymentUrl, payosPaymentId })

  } catch (error) {
    console.error('[PayOS Create] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
