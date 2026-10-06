/**
 * PATCH /api/orders/[id]/approve
 * Staff duyệt đơn: pending → confirmed (trừ kho).
 * Auth: staff only.
 *
 * KHÔNG tạo link PayOS ở đây: giá lúc này còn tạm tính. Khách bấm
 * "Thanh toán ngay" ở trang đơn hàng → /api/orders/[id]/payos/create mới tạo link,
 * đúng số tiền còn nợ (cọc trước, tất toán sau).
 */

import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedProfile } from '@/lib/data/profile'
import { getOrderStatusRow, StatusError, transitionOrderStatus } from '@/lib/data/orders-status'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getAuthenticatedProfile()

  if (!profile || (profile.role !== 'sales' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized — staff only' }, { status: 401 })
  }

  try {
    const order = await getOrderStatusRow(resolvedParams.id)

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot approve order with status: ${order.status}. Only pending orders can be approved.` },
        { status: 400 }
      )
    }
    if (!order.total_amount || Number(order.total_amount) <= 0) {
      return NextResponse.json({ error: 'Order total amount must be greater than 0' }, { status: 400 })
    }

    const updated = await transitionOrderStatus({
      order,
      nextStatus: 'confirmed',
      notes: `Staff ${profile.full_name || profile.id} duyệt đơn`,
      changedBy: profile.id,
      role: profile.role,
    })

    return NextResponse.json({
      success: true,
      orderId: updated.id,
      status: updated.status,
      message: 'Đơn hàng đã được duyệt và sẵn sàng thanh toán',
    })
  } catch (error) {
    if (error instanceof StatusError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[Approve] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
