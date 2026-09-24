/**
 * PATCH /api/orders/[id]/approve
 * Staff duyệt đơn hàng: pending → confirmed, tạo PayOS link nếu cần.
 * Auth: staff only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { transitionOrderStatus } from '@/lib/data/orders-status'
import { createPaymentLink } from '@/lib/payos/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getAuthenticatedProfile()

  if (!profile || (profile.role !== 'sales' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized — staff only' }, { status: 401 })
  }

  try {
    const admin = await createAdminClient()

    // Get order
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('*')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate order is in editable status
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot approve order with status: ${order.status}. Only pending orders can be approved.` },
        { status: 400 }
      )
    }

    // Validate total_amount > 0
    if (!order.total_amount || Number(order.total_amount) <= 0) {
      return NextResponse.json({ error: 'Order total amount must be greater than 0' }, { status: 400 })
    }

    // Transition: pending → confirmed
    const updated = await transitionOrderStatus({
      order: {
        id: order.id,
        customer_id: order.customer_id,
        status: order.status,
        updated_at: order.updated_at,
      },
      nextStatus: 'confirmed',
      notes: `Staff ${profile.full_name || profile.id} duyệt đơn`,
      changedBy: profile.id,
      role: profile.role,
    })

    // Create PayOS payment link for the order
    let payosPaymentId: string | null = null
    try {
      // Generate unique order code for PayOS (timestamp-based, min 6 digits)
      const orderCode = Math.floor(Date.now() / 1000) % 100000 + 100000

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const returnUrl = `${origin}/dashboard/orders/${order.id}?payment=redirected`

      const { paymentUrl, payosPaymentId: pid } = await createPaymentLink(
        orderCode,
        Number(order.total_amount),
        `Don hang ${order.order_code}`,
        returnUrl
      )

      // Save payos_payment_id AND orderCode to order
      await admin
        .from('orders')
        .update({
          payos_payment_id: pid,
          payos_order_code: orderCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      payosPaymentId = pid

      console.log(`[Approve] PayOS link created for order ${order.id}:`, {
        paymentUrl,
        payosPaymentId: pid,
      })
    } catch (payosError: any) {
      console.error('[Approve] Failed to create PayOS link:', payosError.message)
      // Don't fail the approval — just log the error
      // Order is still approved, staff can create PayOS link manually later
    }

    return NextResponse.json({
      success: true,
      orderId: updated.id,
      status: updated.status,
      payosPaymentId,
      message: 'Đơn hàng đã được duyệt và sẵn sàng thanh toán qua PayOS',
    })
  } catch (error) {
    console.error('[Approve] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
