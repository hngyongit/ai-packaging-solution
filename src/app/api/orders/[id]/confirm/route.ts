/**
 * POST /api/orders/[id]/confirm/route.ts
 * Staff confirms order and transitions to production status.
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

    // Only allow confirm from certain statuses
    const allowedStatuses = ['pending', 'staff_review', 'confirmed', 'deposit_paid']
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot confirm order from status: ${order.status}` },
        { status: 400 }
      )
    }

    // Determine target status based on current status
    let targetStatus: string
    if (order.status === 'deposit_paid') {
      targetStatus = 'production'
    } else {
      targetStatus = 'confirmed'
    }

    // Update order status
    const { error: updateError } = await admin
      .from('orders')
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to confirm order:', updateError)
      return NextResponse.json({ error: 'Failed to confirm order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status: targetStatus,
      message: targetStatus === 'production' 
        ? 'Đã xác nhận & chuyển sang sản xuất' 
        : 'Đã xác nhận đơn hàng',
    })
  } catch (error) {
    console.error('Confirm order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
