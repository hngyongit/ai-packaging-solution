export const SITE_NAME = 'AI Carton Packaging'
export const SITE_DESCRIPTION = 'Giải pháp đóng gói thông minh — Báo giá AI trong 30 giây'

export const APP_URLS = {
  consultation: '/consultation',
  about: '/about',
  pricing: '/pricing',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  profile: '/dashboard/profile',
  orders: '/dashboard/orders',
  staff: '/staff',
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  staff_review: 'Đang xem xét',
  confirmed: 'Đã xác nhận',
  deposit_paid: 'Đã đặt cọc',
  production: 'Đang sản xuất',
  completed: 'Hoàn thành',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
} as const