import { formatCurrency, getPaymentMethodLabel, toNumber, type PaymentMethod } from '@/lib/data/order-shared'
import { getOutstandingAmount, orderRequiresDeposit } from '@/lib/data/order-payment'

import { getMailFrom, getMailTransporter, getSiteUrl, mailLayout } from './transport'

// Mail thông báo tiến độ đơn. Khách phải biết CHÍNH XÁC bước tiếp theo là gì —
// chờ tiếp, hay vào trả tiền — nên nội dung bám theo luật thanh toán, không
// hardcode "chuyển khoản thì trả ngay".

export type OrderMailData = {
  id: string
  order_code: string
  status: string
  total_amount: number | string | null
  deposit_amount: number | string | null
  payment_method: string | null
  payment_status: string | null
  contact_email: string | null
  contact_name: string | null
}

/** Nhãn nút + câu hướng dẫn cho bước kế tiếp của khách. */
export function getOrderNextStep(order: OrderMailData) {
  const outstanding = getOutstandingAmount(order)
  // Cọc chỉ còn thiếu khi CHƯA thu gì. Đã cọc hoặc đã trả đủ thì không đòi lại.
  const needsDeposit = orderRequiresDeposit(order) && (order.payment_status ?? 'unpaid') === 'unpaid'

  if (order.status === 'cancelled') {
    return { cta: 'Xem đơn hàng', note: 'Đơn đã được hủy. Nếu cần hỗ trợ, liên hệ lại với chúng tôi.' }
  }
  if (needsDeposit) {
    return {
      cta: 'Đặt cọc ngay',
      note: `Đơn từ mức quy định phải đặt cọc ${formatCurrency(outstanding)} trước khi sản xuất${
        order.payment_method === 'cod' ? ', kể cả khi chọn COD. Phần còn lại thu khi giao hàng' : ''
      }.`,
    }
  }
  if (order.payment_status === 'deposit_paid' && outstanding > 0) {
    return {
      cta: 'Thanh toán phần còn lại',
      note: `Đã nhận cọc. Còn lại ${formatCurrency(outstanding)} — ${
        order.payment_method === 'cod'
          ? 'thanh toán khi nhận hàng.'
          : 'thanh toán qua PayOS khi bạn thuận tiện.'
      }`,
    }
  }
  // COD không cọc: outstanding = 0 vì không thu trước, KHÔNG phải đã trả đủ.
  if (order.payment_method === 'cod') {
    return {
      cta: 'Xem đơn hàng',
      note: 'Đơn thanh toán khi nhận hàng (COD). Bạn không cần trả trước — đơn vị vận chuyển thu hộ khi giao.',
    }
  }
  if (outstanding <= 0) {
    return { cta: 'Xem đơn hàng', note: 'Đơn đã được thanh toán đủ. Chúng tôi sẽ thông báo khi đơn hoàn thành.' }
  }
  return {
    cta: 'Thanh toán ngay',
    note: `Vui lòng thanh toán ${formatCurrency(outstanding)} qua PayOS để chúng tôi bắt đầu sản xuất.`,
  }
}

function orderRows(order: OrderMailData) {
  const rows: Array<[string, string]> = [
    ['Mã đơn hàng', order.order_code],
    ['Tổng tiền hàng', formatCurrency(order.total_amount)],
    ['Phương thức', getPaymentMethodLabel(order.payment_method as PaymentMethod | null)],
  ]
  const deposit = toNumber(order.deposit_amount)
  if (deposit > 0) rows.push(['Tiền cọc', formatCurrency(deposit)])
  if (order.payment_status === 'deposit_paid' || order.payment_status === 'paid') {
    rows.push([
      'Đã thanh toán',
      order.payment_status === 'paid' ? 'Đủ' : `Cọc ${formatCurrency(deposit)}`,
    ])
  }
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 0;color:#666">${label}</td><td style="padding:4px 0;text-align:right;font-weight:600">${value}</td></tr>`
    )
    .join('')
}

export function renderOrderEmail(order: OrderMailData, heading: string, intro: string) {
  const site = getSiteUrl()
  const link = `${site}/dashboard/orders/${order.id}`
  const step = getOrderNextStep(order)

  return mailLayout(`
    <p>Xin chào ${order.contact_name || 'bạn'},</p>
    <p>${intro}</p>
    <h3 style="margin:20px 0 8px">${heading}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${orderRows(order)}</table>
    <p style="margin:20px 0 8px;padding:12px;background:#f5f5f5;border-radius:8px;font-size:14px">${step.note}</p>
    <p style="margin:20px 0">
      <a href="${link}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">${step.cta}</a>
    </p>
    <p style="color:#666;font-size:13px">Hoặc xem tại <a href="${link}">${link}</a></p>
  `)
}

/**
 * Gửi mail thông báo đơn. KHÔNG BAO GIỜ throw — mail hỏng không được làm hỏng
 * giao dịch đã commit (staff vừa xác nhận đơn xong mà API trả 500 là vô lý).
 */
export async function sendOrderEmail(
  order: OrderMailData,
  heading: string,
  intro: string
): Promise<boolean> {
  if (!order.contact_email) {
    console.warn('[Order Email] Đơn không có email liên hệ, bỏ qua:', order.order_code)
    return false
  }
  try {
    await getMailTransporter().sendMail({
      from: getMailFrom(),
      to: order.contact_email,
      subject: `${heading} — ${order.order_code}`,
      html: renderOrderEmail(order, heading, intro),
    })
    return true
  } catch (error) {
    console.error('[Order Email] Gửi thất bại:', order.order_code, error)
    return false
  }
}
