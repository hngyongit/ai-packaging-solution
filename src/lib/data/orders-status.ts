import { ORDER_STATUS_LABELS } from '@/lib/config/constants'

import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderEmail, type OrderMailData } from '@/lib/mail/order-mail'
import { canEnterProduction, DEPOSIT_REQUIRED_MESSAGE } from './order-payment'
import { deductStockOnConfirm, restockOnCancel } from './orders-stock'

// Máy trạng thái đơn hàng — tách khỏi route handler để handler giữ <80 dòng.

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS
export type UserRole = 'customer' | 'sales' | 'admin'

export type OrderStatusRow = {
  id: string
  customer_id: string
  status: OrderStatus
  updated_at: string
  total_amount?: number | string | null
  deposit_amount?: number | string | null
  payment_status?: string | null
}

/** Tiêu đề + lời dẫn mail theo trạng thái mới. Chỉ gửi ở các mốc khách cần biết. */
const ORDER_MAIL_COPY: Partial<Record<OrderStatus, { heading: string; intro: string }>> = {
  confirmed: {
    heading: 'Đơn hàng đã được xác nhận',
    intro: 'Nhân viên đã kiểm tra và chốt giá cho đơn của bạn. Bước tiếp theo nằm dưới đây.',
  },
  deposit_paid: {
    heading: 'Đã nhận tiền cọc',
    intro: 'Chúng tôi đã nhận được tiền cọc và sẽ bắt đầu chuẩn bị sản xuất.',
  },
  production: {
    heading: 'Đơn hàng đang được sản xuất',
    intro: 'Xưởng đã bắt đầu sản xuất đơn của bạn.',
  },
  completed: {
    heading: 'Đơn hàng đã hoàn thành',
    intro: 'Đơn của bạn đã sản xuất xong và chuẩn bị được giao.',
  },
  delivering: {
    heading: 'Đơn hàng đang được giao',
    intro:
      'Đơn của bạn đã rời xưởng và đang trên đường tới bạn. Khi nhận được hàng, bạn có thể vào trang đơn hàng để xác nhận đã nhận.',
  },
  delivered: {
    heading: 'Đơn hàng đã được giao',
    intro: 'Đơn của bạn đã được giao. Cảm ơn bạn đã tin dùng AI Carton.',
  },
  cancelled: {
    heading: 'Đơn hàng đã được hủy',
    intro: 'Đơn của bạn đã được hủy. Nếu đây là nhầm lẫn, hãy liên hệ lại với chúng tôi.',
  },
}

export class StatusError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const STAFF_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // Staff chốt trực tiếp từ pending — "Xác nhận & chốt giá" 1 bước cho đơn giỏ hàng.
  pending: ['staff_review', 'confirmed', 'cancelled'],
  staff_review: ['confirmed', 'cancelled'],
  confirmed: ['deposit_paid', 'production', 'cancelled'],
  deposit_paid: ['production', 'cancelled'],
  production: ['completed', 'cancelled'],
  completed: ['delivering'],
  // Khách tự bấm "đã nhận hàng", hoặc staff chốt khi ĐVVC báo giao xong.
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
}

const CUSTOMER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['cancelled'],
  staff_review: [],
  confirmed: [],
  deposit_paid: [],
  production: [],
  completed: [],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function isStaffRole(role: UserRole) {
  return role === 'sales' || role === 'admin'
}

function getAllowedTransitions(role: UserRole, currentStatus: OrderStatus) {
  return isStaffRole(role) ? STAFF_TRANSITIONS[currentStatus] : CUSTOMER_TRANSITIONS[currentStatus]
}

export function getStatusMetadata(role: UserRole, order: OrderStatusRow) {
  const allowedTransitions = getAllowedTransitions(role, order.status)
  return {
    status: order.status,
    label: ORDER_STATUS_LABELS[order.status],
    updatedAt: order.updated_at,
    allowedStatuses: Object.keys(ORDER_STATUS_LABELS),
    allowedTransitions,
    canUpdate: allowedTransitions.length > 0,
  }
}

export async function getOrderStatusRow(id: string): Promise<OrderStatusRow> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('id, customer_id, status, updated_at, total_amount, deposit_amount, payment_status')
    .eq('id', id)
    .maybeSingle<OrderStatusRow>()
  if (error) throw error
  if (!data) throw new StatusError('Order not found', 404)
  return data
}

export async function getOrderHistory(orderId: string) {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('order_status_history')
    .select('id, from_status, to_status, changed_by, notes, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/**
 * CAS chuyển trạng thái + history + móc kho:
 * confirmed → deduct (fail → hoàn tác status, trả 409), cancelled → restock.
 */
export async function transitionOrderStatus(input: {
  order: OrderStatusRow
  nextStatus: OrderStatus
  notes?: string
  changedBy: string
  role: UserRole
}): Promise<OrderStatusRow> {
  const { order, nextStatus } = input
  const admin = await createAdminClient()

  // Phòng thủ nhiều lớp: route gọi thẳng hàm này cũng không nhảy được qua cọc.
  if (nextStatus === 'production' && !canEnterProduction(order)) {
    throw new StatusError(DEPOSIT_REQUIRED_MESSAGE, 409)
  }

  const { data: updated, error: updateError } = await admin
    .from('orders')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('status', order.status)
    .select('id, customer_id, status, updated_at')
    .single<OrderStatusRow>()

  if (updateError) {
    // PGRST116 = CAS thua (đơn đổi trạng thái giữa chừng).
    if (updateError.code === 'PGRST116') throw new StatusError('Order status changed; retry update', 409)
    throw updateError
  }

  await admin.from('order_status_history').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: nextStatus,
    changed_by: input.changedBy,
    notes: input.notes ?? null,
  })

  if (nextStatus === 'confirmed') {
    const stockError = await deductStockOnConfirm(order.id)
    if (stockError) {
      // RPC atomic → không trừ gì; hoàn status + ghi history để đơn không kẹt.
      await admin
        .from('orders')
        .update({ status: order.status, updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('status', 'confirmed')
      await admin.from('order_status_history').insert({
        order_id: order.id,
        from_status: 'confirmed',
        to_status: order.status,
        changed_by: input.changedBy,
        notes: `Hoàn tác: ${stockError.message}`,
      })
      throw new StatusError(stockError.message, 409)
    }
  }

  if (nextStatus === 'cancelled') {
    await restockOnCancel(order.id)
  }

  await notifyCustomer(admin, order.id, nextStatus)

  return updated
}

/**
 * Mail cho khách ở mốc đổi trạng thái. Chạy SAU khi giao dịch đã commit và
 * không bao giờ throw — SMTP chết không được biến một lần xác nhận thành lỗi 500.
 * Lỗi gửi ghi vào order_status_history để staff còn biết mà gọi lại khách.
 */
async function notifyCustomer(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  orderId: string,
  nextStatus: OrderStatus
) {
  const copy = ORDER_MAIL_COPY[nextStatus]
  if (!copy) return

  const { data: order } = await admin
    .from('orders')
    .select(
      'id, order_code, status, total_amount, deposit_amount, payment_method, payment_status, contact_email, contact_name'
    )
    .eq('id', orderId)
    .maybeSingle<OrderMailData>()

  if (!order) return

  const sent = await sendOrderEmail(order, copy.heading, copy.intro)
  if (!sent && order.contact_email) {
    await admin.from('order_status_history').insert({
      order_id: orderId,
      from_status: nextStatus,
      to_status: nextStatus,
      changed_by: null,
      notes: `Không gửi được mail thông báo tới ${order.contact_email}`,
    })
  }
}

export function validateTransition(role: UserRole, order: OrderStatusRow, nextStatus: OrderStatus): void {
  const allowed = getAllowedTransitions(role, order.status)
  if (!allowed.includes(nextStatus)) {
    if (!isStaffRole(role) && STAFF_TRANSITIONS[order.status].includes(nextStatus)) {
      throw new StatusError('Forbidden', 403)
    }
    throw new StatusError('Invalid status transition', allowed.length === 0 ? 409 : 400)
  }

  // Đơn lớn phải cọc trước khi vào sản xuất — bất kể phương thức thanh toán.
  if (nextStatus === 'production' && !canEnterProduction(order)) {
    throw new StatusError(DEPOSIT_REQUIRED_MESSAGE, 409)
  }
}
