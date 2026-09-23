/**
 * GET /api/orders/[id]/payos/status
 * Check PayOS payment status for an order.
 * Auth: customer or staff.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getAuthenticatedProfile(_req)

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = resolvedParams.id

  try {
    const admin = await createAdminClient()

    const { data: order, error: fetchError } = await admin
      .from('orders')
      .select('id, order_code, total_amount, payment_status, payos_payment_id, status, customer_id')
      .eq('id', orderId)
      .maybeSingle()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Customer can only check their own orders
    if (profile.role !== 'sales' && profile.role !== 'admin') {
      if (order.customer_id !== profile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderCode: order.order_code,
      totalAmount: Number(order.total_amount ?? 0),
      paymentStatus: order.payment_status,
      payosPaymentId: order.payos_payment_id,
      orderStatus: order.status,
    })

  } catch (error) {
    console.error('[PayOS Status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
