import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { canEnterProduction, getOutstandingAmount, orderRequiresDeposit } from '@/lib/data/order-payment'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Admin client (service role) — webhook không có session, phải bypass RLS.
const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
})

/**
 * PayOS v2 KHÔNG gửi `status`: kết quả giao dịch nằm ở `data.code` ("00" = thành công),
 * `code`/`success` ngoài envelope chỉ nói webhook giao được. Payload phẳng (bản cũ) thì
 * kết quả nằm ở `status`. Đọc mã trong cùng trước, thiếu mới rơi ra ngoài.
 */
export function isPaymentSucceeded(body: Record<string, any>, payload: Record<string, any>) {
  // Mã trong cùng là mã giao dịch — có thì chỉ tin nó, không để success ngoài envelope ghi đè.
  if (payload.code !== undefined) return payload.code === '00'
  if (payload.status !== undefined) return payload.status === 'paid' || payload.status === 'completed'
  return body.code === '00' || body.success === true
}

/**
 * Xử lý callback từ PayOS.
 *
 * PayOS gửi dạng lồng:
 *   { code: "00", desc, success: true, data: { orderCode, amount, paymentLinkId, reference, ... },
 *     signature: hmacsha256(checksumKey, queryString của data) }
 * Chữ ký tính trên các field ĐÃ SẮP XẾP của `data`, không phải JSON lồng.
 * Mã giao dịch nằm ở `data.reference` — payload v2 không có `status`.
 *
 * Ghi nhận thanh toán:
 *   - Đối chiếu số tiền với payos_amount đã lưu lúc tạo link (chống ghi thiếu).
 *   - Chưa cọc mà đơn phải cọc → lần trả này là CỌC (deposit_paid).
 *   - Đã cọc → lần trả này tất toán (paid).
 *   - Chỉ chuyển sang production khi canEnterProduction() cho phép.
 */
export async function handlePayOSWebhook(body: Record<string, any>, rawBody?: string) {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || ''
  if (!checksumKey) {
    console.error('[PayOS Webhook] PAYOS_CHECKSUM_KEY not configured')
    return NextResponse.json({ status: 'Failure', message: 'Server configuration error' }, { status: 500 })
  }

  const signature = body.signature || ''
  const payload: any = body.data || body

  // PayOS ký trên chính object `data`; nếu không có `data` thì bỏ các field điều khiển.
  let flatBody: Record<string, any>
  if (body.data && typeof body.data === 'object') {
    flatBody = { ...body.data }
  } else {
    const { signature: _s, webhookChecksum: _w, success: _ok, ...rest } = body
    flatBody = rest
  }

  const queryString = Object.entries(flatBody)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('&')

  const computed = createHmac('sha256', checksumKey).update(queryString).digest('hex')
  if (computed !== signature) {
    console.error('[PayOS Webhook] Checksum verification failed', { rawBody })
    return NextResponse.json({ status: 'Failure', message: 'Invalid checksum' }, { status: 400 })
  }

  const { orderCode, amount, status, paymentLinkId, reference } = payload
  // PayOS v2 gửi mã giao dịch ở `reference`; `transactionId` chỉ có ở payload phẳng cũ.
  const transactionId: string | undefined = payload.transactionId || reference

  // Tìm đơn: paymentLinkId (khớp payos_payment_id lúc tạo) → payos_order_code → transactionId.
  let orderData: any = null
  if (paymentLinkId) {
    orderData = (await supabase.from('orders').select('*').eq('payos_payment_id', paymentLinkId).maybeSingle()).data
  }
  if (!orderData && orderCode) {
    orderData = (await supabase.from('orders').select('*').eq('payos_order_code', orderCode).maybeSingle()).data
  }
  if (!orderData && transactionId) {
    orderData = (await supabase.from('orders').select('*').eq('payos_payment_id', transactionId).maybeSingle()).data
  }

  if (!orderData) {
    console.warn('[PayOS Webhook] Order not found', { orderCode, transactionId })
    return NextResponse.json({ status: 'Success', message: 'Order not found' }, { status: 200 })
  }

  const orderId = orderData.id

  // Link bị huỷ/hết hạn → mở lại đường tạo link mới, không đụng trạng thái đơn.
  if (status === 'cancelled' || status === 'failed') {
    await supabase
      .from('orders')
      .update({
        payos_payment_id: null,
        payos_order_code: null,
        payos_amount: null,
        payos_checkout_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    return NextResponse.json({ status: 'Success', message: 'Payment link cancelled' }, { status: 200 })
  }

  if (!isPaymentSucceeded(body, payload)) {
    return NextResponse.json(
      { status: 'Success', message: `Ignored: code=${payload.code ?? body.code}` },
      { status: 200 }
    )
  }

  // Idempotency — PayOS có thể retry. Đã tất toán thì không ghi lại.
  if (orderData.payment_status === 'paid') {
    return NextResponse.json({ status: 'Success', message: 'Already settled' }, { status: 200 })
  }

  const paidAmount = Number(amount ?? 0)
  const expectedAmount = Number(orderData.payos_amount ?? 0)
  if (expectedAmount > 0 && paidAmount < expectedAmount) {
    console.error('[PayOS Webhook] Amount mismatch — không ghi nhận', {
      orderId, paidAmount, expectedAmount,
    })
    return NextResponse.json({ status: 'Failure', message: 'Amount mismatch' }, { status: 400 })
  }

  // Lần trả này là cọc hay tất toán? Cọc chỉ khi CHƯA thu gì.
  const isDepositPayment = orderRequiresDeposit(orderData) && (orderData.payment_status ?? 'unpaid') === 'unpaid'
  const nextPaymentStatus = isDepositPayment ? 'deposit_paid' : 'paid'

  const updated = {
    ...orderData,
    payment_status: nextPaymentStatus,
  }

  // Cập nhật tiền. Xoá payos_payment_id để lần thu tiếp theo (phần còn lại) tạo được link mới.
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: nextPaymentStatus,
      payos_transaction_id: transactionId ?? null,
      payos_payment_id: null,
      payos_amount: null,
      payos_checkout_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('[PayOS Webhook] Failed to record payment', updateError)
    return NextResponse.json({ status: 'Failure', message: 'Failed to update order' }, { status: 500 })
  }

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    from_status: orderData.status,
    to_status: orderData.status,
    changed_by: null,
    notes: isDepositPayment
      ? `Đã nhận cọc qua PayOS — ${paidAmount.toLocaleString('vi-VN')}đ (Transaction: ${transactionId})`
      : `Đã thanh toán qua PayOS — ${paidAmount.toLocaleString('vi-VN')}đ (Transaction: ${transactionId})`,
  })

  // Đủ điều kiện (cọc xong nếu đơn phải cọc) → vào sản xuất.
  const remaining = getOutstandingAmount(updated)
  if (canEnterProduction(updated) && ['confirmed', 'deposit_paid'].includes(orderData.status)) {
    const { error: transitionError } = await supabase
      .from('orders')
      .update({ status: 'production', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', orderData.status)

    if (transitionError) {
      console.error('[PayOS Webhook] Auto-transition to production failed', transitionError)
    } else {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        from_status: orderData.status,
        to_status: 'production',
        changed_by: null,
        notes: 'Tự động chuyển sản xuất sau khi thanh toán',
      })
    }
  }

  return NextResponse.json(
    { status: 'Success', data: { orderId, paymentStatus: nextPaymentStatus, remainingAmount: remaining } },
    { status: 200 }
  )
}
