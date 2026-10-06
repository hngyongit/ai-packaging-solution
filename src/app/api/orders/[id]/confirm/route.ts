/**
 * POST /api/orders/[id]/confirm
 * Staff chốt đơn: pending/staff_review → confirmed (trừ kho).
 * Đơn đã cọc (deposit_paid) → production.
 *
 * Đi qua transitionOrderStatus để dùng chung máy trạng thái: CAS, ghi history,
 * trừ kho khi confirmed, và CHẶN vào production nếu đơn phải cọc mà chưa cọc.
 */

import { NextRequest, NextResponse } from 'next/server'

import { getCurrentProfile } from '@/lib/data/orders'
import { getOrderStatusRow, isStaffRole, StatusError, transitionOrderStatus } from '@/lib/data/orders-status'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getCurrentProfile()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const order = await getOrderStatusRow(resolvedParams.id)

    const allowedStatuses = ['pending', 'staff_review', 'confirmed', 'deposit_paid']
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot confirm order from status: ${order.status}` },
        { status: 400 }
      )
    }

    const nextStatus = order.status === 'deposit_paid' ? 'production' : 'confirmed'

    const updated = await transitionOrderStatus({
      order,
      nextStatus,
      notes: `Staff ${profile.full_name || profile.id} xác nhận đơn`,
      changedBy: profile.id,
      role: profile.role,
    })

    return NextResponse.json({
      success: true,
      status: updated.status,
      message:
        nextStatus === 'production' ? 'Đã xác nhận & chuyển sang sản xuất' : 'Đã xác nhận đơn hàng',
    })
  } catch (error) {
    if (error instanceof StatusError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Confirm order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
