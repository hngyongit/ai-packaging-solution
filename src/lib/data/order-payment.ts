/**
 * Luật thanh toán của đơn hàng — MỘT nguồn duy nhất cho cả server lẫn UI.
 *
 * Phương thức:
 *   - cod            → không thu trước. Đơn vị vận chuyển thu hộ toàn bộ khi giao.
 *   - bank_transfer  → khách chuyển khoản qua PayOS (PayOS là CƠ CHẾ thi hành,
 *                      không phải phương thức riêng).
 *
 * Cọc:
 *   total ≥ DEPOSIT_THRESHOLD → phải cọc DEPOSIT_PERCENTAGE% trước khi sản xuất,
 *   kể cả đơn COD. Đây là lớp chống rủi ro cho đơn lớn, không phải phí vận chuyển.
 *
 * payment_status: unpaid → deposit_paid → paid
 *   deposit_paid = đã thu cọc, còn nợ phần sau.
 */

import { DEPOSIT_PERCENTAGE, DEPOSIT_THRESHOLD } from '@/lib/config/pricing'
import { toNumber } from '@/lib/data/order-shared'

export type PayableOrder = {
  payment_method?: string | null
  payment_status?: string | null
  total_amount?: number | string | null
  deposit_amount?: number | string | null
}

/** Cọc bắt buộc khi đơn đạt ngưỡng và có tiền cọc. */
export function orderRequiresDeposit(order: Pick<PayableOrder, 'total_amount' | 'deposit_amount'>) {
  return toNumber(order.deposit_amount) > 0 && toNumber(order.total_amount) >= DEPOSIT_THRESHOLD
}

/**
 * Số tiền phải trả ở lần thanh toán kế tiếp.
 * Chưa cọc → thu cọc (nếu có); đã cọc → thu phần còn lại; COD không cọc → 0.
 */
export function getOutstandingAmount(order: PayableOrder) {
  const total = toNumber(order.total_amount)
  const deposit = toNumber(order.deposit_amount)
  const status = order.payment_status ?? 'unpaid'

  if (status === 'paid') return 0
  if (status === 'deposit_paid') return Math.max(total - deposit, 0)
  // Chưa cọc: COD không cọc thì không thu gì; bank_transfer thu cọc nếu có, không thì thu cả đơn.
  if (status === 'unpaid' && order.payment_method === 'cod' && !orderRequiresDeposit(order)) return 0
  return orderRequiresDeposit(order) ? deposit : total
}

/**
 * Có được tạo link PayOS không.
 *
 * Chỉ từ `confirmed` trở lên: staff phải xác nhận đơn và chốt giá TRƯỚC, rồi
 * khách mới nhận mail mời thanh toán. Thu tiền trên giá tạm tính là thu sai số —
 * kể cả tiền cọc, vì cọc tính theo % của giá cuối.
 *
 * Ngoại lệ duy nhất: đơn đã cọc rồi (payment_status='deposit_paid') thì phần
 * còn lại vẫn phải chờ chốt giá, nhưng trạng thái đơn thường đã qua confirmed.
 */
export function canPayViaPayOS(order: PayableOrder & { status: string | null }) {
  const status = order.status ?? ''
  if (getOutstandingAmount(order) <= 0) return false
  return ['confirmed', 'deposit_paid', 'production'].includes(status)
}

/**
 * Đã đủ điều kiện vào sản xuất chưa.
 * Đơn phải cọc mà chưa cọc → chặn; cọc rồi thì phần còn lại thu khi giao (COD)
 * hoặc qua PayOS (bank_transfer).
 */
export function canEnterProduction(
  order: Pick<PayableOrder, 'total_amount' | 'deposit_amount' | 'payment_status'>
) {
  if (order.payment_status === 'paid') return true
  if (orderRequiresDeposit(order)) return order.payment_status === 'deposit_paid'
  return true
}

/** Thông điệp chặn — dùng chung cho API và UI để không lệch chữ. */
export const DEPOSIT_REQUIRED_MESSAGE = `Đơn từ ${DEPOSIT_THRESHOLD.toLocaleString('vi-VN')}đ phải đặt cọc ${DEPOSIT_PERCENTAGE}% trước khi sản xuất.`
