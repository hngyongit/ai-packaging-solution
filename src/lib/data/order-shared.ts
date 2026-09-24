export const ORDER_STATUS_SEQUENCE = [
  'pending',
  'staff_review',
  'confirmed',
  'deposit_paid',
  'production',
  'completed',
  'delivered',
  'cancelled',
] as const

export const HISTORY_STATUSES = ['completed', 'delivered'] as const

const ORDER_STATUS_DISPLAY: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  staff_review: 'Đang duyệt',
  confirmed: 'Đã xác nhận',
  deposit_paid: 'Đã đặt cọc',
  production: 'Đang sản xuất',
  completed: 'Hoàn thành',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

export type OrderStatus = (typeof ORDER_STATUS_SEQUENCE)[number]
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid'
export type PaymentMethod = 'cod' | 'bank_transfer' | 'payos'

/** Human-readable label for payment method */
export function getPaymentMethodLabel(method: PaymentMethod | null | undefined): string {
  if (!method) return 'Chưa chọn'
  const labels: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    payos: 'Thanh toán qua PayOS',
  }
  return labels[method] ?? method
}

export type CustomerProfile = {
  id: string
  role: 'customer' | 'sales' | 'admin'
  full_name: string | null
  phone: string | null
}

export type OrderItem = {
  id: string
  product_id: string | null
  product_name: string
  product_code: string
  dimensions: Record<string, unknown> | null
  printing_specs: Record<string, unknown> | null
  quantity: number
  unit_price: number | string
  subtotal: number | string
  notes: string | null
}

export type OrderStatusHistory = {
  id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  notes: string | null
  created_at: string
}

export type CustomerOrder = {
  id: string
  order_code: string
  customer_id: string
  status: OrderStatus
  total_amount: number | string
  deposit_amount: number | string | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  delivery_method: string | null
  delivery_address: string | null
  delivery_fee: number | string | null
  notes: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

export type CustomerOrderDetail = CustomerOrder & {
  order_status_history: OrderStatusHistory[]
}

export function isOrderStatus(value: string | null | undefined): value is OrderStatus {
  return ORDER_STATUS_SEQUENCE.includes(value as OrderStatus)
}

export function canReorderOrder(status: string | null | undefined) {
  return status === 'completed' || status === 'delivered'
}

export function canCustomerCancelOrder(status: string | null | undefined) {
  return status === 'pending'
}

export function getOrderStatusLabel(status: string | null | undefined) {
  if (!status) return 'Không xác định'
  return isOrderStatus(status) ? ORDER_STATUS_DISPLAY[status] : status.replace(/_/g, ' ')
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'paid':
      return 'Đã thanh toán'
    case 'deposit_paid':
      return 'Đã đặt cọc'
    case 'unpaid':
      return 'Chưa thanh toán'
    default:
      return 'Không xác định'
  }
}

export function toNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

export function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(toNumber(value))
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value))
}

/** Ảnh mockup AI + khuôn bế có hình in, lưu trong order_items.printing_specs (JSONB). */
export function getMockupUrl(item: Pick<OrderItem, 'printing_specs'>) {
  return readAssetUrl(item.printing_specs?.mockupUrl)
}

export function getDielineUrl(item: Pick<OrderItem, 'printing_specs'>) {
  return readAssetUrl(item.printing_specs?.dielineUrl)
}

export function getPrintPositionLabel(item: Pick<OrderItem, 'printing_specs'>) {
  const value = item.printing_specs?.printPositionLabel
  return typeof value === 'string' && value ? value : null
}

function readAssetUrl(value: unknown) {
  return typeof value === 'string' && value.startsWith('https://') ? value : null
}

export function getItemSummary(order: Pick<CustomerOrder, 'order_items'>) {
  if (order.order_items.length === 0) return 'Chưa có sản phẩm'

  const first = order.order_items[0]
  const extra = order.order_items.length - 1
  const suffix = extra > 0 ? ` +${extra} sản phẩm khác` : ''

  return `${first.product_name} x${first.quantity}${suffix}`
}

export function getOrderProgress(status: OrderStatus) {
  if (status === 'cancelled') return 100
  const index = ORDER_STATUS_SEQUENCE.filter((item) => item !== 'cancelled').indexOf(status)
  if (index < 0) return 0
  return Math.round(((index + 1) / (ORDER_STATUS_SEQUENCE.length - 1)) * 100)
}

export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw)
  return Number.isInteger(page) && page > 0 ? page : 1
}
