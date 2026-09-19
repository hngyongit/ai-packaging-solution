import { ORDER_STATUS_LABELS } from '@/lib/config/constants'

import { createAdminClient } from '@/lib/supabase/server'
import { deductStockOnConfirm, restockOnCancel } from './orders-stock'

// Máy trạng thái đơn hàng — tách khỏi route handler để handler giữ <80 dòng.

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS
export type UserRole = 'customer' | 'sales' | 'admin'

export type OrderStatusRow = {
  id: string
  customer_id: string
  status: OrderStatus
  updated_at: string
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
  completed: ['delivered'],
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
    .select('id, customer_id, status, updated_at')
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

  return updated
}

export function validateTransition(role: UserRole, order: OrderStatusRow, nextStatus: OrderStatus): void {
  const allowed = getAllowedTransitions(role, order.status)
  if (allowed.includes(nextStatus)) return
  if (!isStaffRole(role) && STAFF_TRANSITIONS[order.status].includes(nextStatus)) {
    throw new StatusError('Forbidden', 403)
  }
  throw new StatusError('Invalid status transition', allowed.length === 0 ? 409 : 400)
}
