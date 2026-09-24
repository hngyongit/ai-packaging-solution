import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  HISTORY_STATUSES,
  type CustomerOrder,
  type CustomerProfile,
  type OrderStatusHistory,
  isOrderStatus,
} from './order-shared'

export {
  canCustomerCancelOrder,
  canReorderOrder,
  HISTORY_STATUSES,
  ORDER_STATUS_SEQUENCE,
  formatCurrency,
  formatDateTime,
  getItemSummary,
  getOrderProgress,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  isOrderStatus,
  parsePage,
  toNumber,
} from './order-shared'
export type {
  CustomerOrder,
  CustomerOrderDetail,
  CustomerProfile,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  PaymentMethod,
  PaymentStatus,
} from './order-shared'

export type OrdersQuery = {
  page?: number
  limit?: number
  status?: string | null
  search?: string | null
  historyOnly?: boolean
}

const ORDER_LIST_SELECT = `
  id,
  order_code,
  customer_id,
  status,
  total_amount,
  deposit_amount,
  payment_method,
  payment_status,
  contact_name,
  contact_phone,
  contact_email,
  delivery_method,
  delivery_address,
  delivery_fee,
  notes,
  created_at,
  updated_at,
  order_items (
    id,
    product_id,
    product_name,
    product_code,
    dimensions,
    printing_specs,
    quantity,
    unit_price,
    subtotal,
    notes
  )
`

export async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const admin = await createAdminClient()
  const { data, error: profileError } = await admin
    .from('profiles')
    .select('id, role, full_name, phone')
    .eq('id', user.id)
    .single<CustomerProfile>()

  if (profileError || !data) return null
  return data
}

function normalizeSearch(value: string | null | undefined) {
  return value?.replace(/[%_,()*"']/g, ' ').trim() ?? ''
}

export async function getCustomerOrders(profileId: string, input: OrdersQuery = {}) {
  const page = Math.max(input.page ?? 1, 1)
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50)
  const from = (page - 1) * limit
  const to = from + limit - 1
  const status = isOrderStatus(input.status) ? input.status : null
  const search = normalizeSearch(input.search)

  const admin = await createAdminClient()
  let query = admin
    .from('orders')
    .select(ORDER_LIST_SELECT, { count: 'exact' })
    .eq('customer_id', profileId)

  if (input.historyOnly) query = query.in('status', [...HISTORY_STATUSES])
  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(
      `order_code.ilike.%${search}%,contact_name.ilike.%${search}%,contact_phone.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    orders: (data ?? []) as CustomerOrder[],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  }
}

const IN_PROGRESS_STATUSES = ['pending', 'staff_review', 'confirmed', 'deposit_paid', 'production'] as const

export async function getCustomerDashboardStats(profileId: string) {
  const admin = await createAdminClient()

  const [totalResult, inProgressResult, savedResult] = await Promise.all([
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', profileId),
    admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', profileId)
      .in('status', [...IN_PROGRESS_STATUSES]),
    admin.from('saved_products').select('id', { count: 'exact', head: true }).eq('customer_id', profileId),
  ])

  if (totalResult.error) throw totalResult.error
  if (inProgressResult.error) throw inProgressResult.error
  if (savedResult.error) throw savedResult.error

  return {
    totalOrders: totalResult.count ?? 0,
    inProgressOrders: inProgressResult.count ?? 0,
    savedProducts: savedResult.count ?? 0,
  }
}

export async function getCustomerOrderById(profileId: string, orderId: string) {
  const admin = await createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select(ORDER_LIST_SELECT)
    .eq('id', orderId)
    .eq('customer_id', profileId)
    .maybeSingle<CustomerOrder>()

  if (error) throw error
  if (!order) return null

  const { data: history, error: historyError } = await admin
    .from('order_status_history')
    .select('id, from_status, to_status, notes, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })
    .returns<OrderStatusHistory[]>()

  if (historyError) throw historyError

  return {
    ...order,
    order_status_history: history ?? [],
  }
}

/** Fetch order by ID without requiring customer_id match — used for PayOS callbacks when auth is missing. */
export async function getOrderByIdPublic(orderId: string) {
  const admin = await createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select(ORDER_LIST_SELECT)
    .eq('id', orderId)
    .maybeSingle<CustomerOrder>()

  if (error) throw error
  if (!order) return null

  const { data: history, error: historyError } = await admin
    .from('order_status_history')
    .select('id, from_status, to_status, notes, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })
    .returns<OrderStatusHistory[]>()

  if (historyError) throw historyError

  return {
    ...order,
    order_status_history: history ?? [],
  }
}
