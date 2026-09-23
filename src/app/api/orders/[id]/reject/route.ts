/**
 * POST /api/orders/[id]/reject/route.ts
 * Staff rejects/cancels an order.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getCurrentProfile()
  
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    assertStaff(profile)
  } catch (error) {
    if (error instanceof ProductAdminError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw error
  }

  const orderId = resolvedParams.id

  try {
    const admin = await createAdminClient()

    // Get current order
    const { data: order, error: fetchError } = await admin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only allow cancel from certain statuses (not yet in production/completed)
    const blockedStatuses = ['completed', 'delivered', 'cancelled']
    if (blockedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot reject order from status: ${order.status}` },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const { error: updateError } = await admin
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to reject order:', updateError)
      return NextResponse.json({ error: 'Failed to reject order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status: 'cancelled',
      message: 'Đã từ chối đơn hàng',
    })
  } catch (error) {
    console.error('Reject order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
