/**
 * POST /api/orders/[id]/payos/create
 * Tạo link PayOS cho số tiền khách còn nợ (cọc, hoặc phần còn lại sau cọc).
 * Auth: customer sở hữu đơn.
 *
 * PayOS là cơ chế thi hành của bank_transfer (và của khoản cọc bắt buộc với
 * đơn lớn, kể cả COD) — không phải một phương thức thanh toán riêng.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { canPayViaPayOS, getOutstandingAmount, orderRequiresDeposit } from '@/lib/data/order-payment'
import { createPaymentLink, getPaymentLink } from '@/lib/payos/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getAuthenticatedProfile(req)

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = resolvedParams.id

  try {
    const admin = await createAdminClient()

    const { data: order, error: fetchError } = await admin
      .from('orders')
      .select('id, order_code, status, total_amount, deposit_amount, payment_status, payment_method, payos_payment_id, payos_checkout_url, customer_id')
      .eq('id', orderId)
      .maybeSingle()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.customer_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cổng điều kiện đứng TRƯỚC nhánh tái dùng link: đơn đã huỷ / đã tất toán /
    // chưa tới bước thu tiền thì không được nhận lại link cũ.
    if (!canPayViaPayOS(order)) {
      if (order.payment_status === 'paid') {
        return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
      }
      if (getOutstandingAmount(order) <= 0) {
        return NextResponse.json({ error: 'Không còn khoản nào cần thanh toán' }, { status: 400 })
      }
      return NextResponse.json(
        { error: 'Đơn chưa được chốt giá. Vui lòng chờ nhân viên xác nhận.' },
        { status: 400 }
      )
    }

    // Link cũ có thể đã hết hạn hoặc bị huỷ. Hỏi PayOS trước khi tạo link mới:
    // còn dùng được thì trả lại chính link đó, chết rồi thì xoá để đi tiếp.
    if (order.payos_payment_id) {
      const link = await getPaymentLink(order.payos_payment_id)
      const stillOpen =
        link && (link.status === 'PENDING' || link.status === 'PROCESSING') && order.payos_checkout_url

      if (stillOpen) {
        return NextResponse.json({
          paymentUrl: order.payos_checkout_url,
          payosPaymentId: order.payos_payment_id,
          amount: getOutstandingAmount(order),
          isDeposit: orderRequiresDeposit(order) && (order.payment_status ?? 'unpaid') === 'unpaid',
          reused: true,
        })
      }

      await admin
        .from('orders')
        .update({ payos_payment_id: null, payos_order_code: null, payos_amount: null, payos_checkout_url: null })
        .eq('id', orderId)
    }

    // Thu cọc trước, tất toán sau — đúng số tiền của từng bước.
    const amount = getOutstandingAmount(order)
    const isDeposit = orderRequiresDeposit(order) && (order.payment_status ?? 'unpaid') === 'unpaid'

    // orderCode phải duy nhất theo thời gian; cộng thêm 4 số cuối id đơn để tránh trùng.
    const orderCode = Number(`${Math.floor(Date.now() / 1000) % 1000000}${parseInt(orderId.replace(/\D/g, '').slice(-2) || '0', 10)}`)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const returnUrl = `${siteUrl}/dashboard/orders/${orderId}?payment=redirected`

    const description = isDeposit
      ? `Coc don ${order.order_code}`
      : `Thanh toan ${order.order_code}`

    const { paymentUrl, payosPaymentId } = await createPaymentLink(
      orderCode,
      amount,
      description,
      returnUrl
    )

    const { error: updateError } = await admin
      .from('orders')
      .update({
        payos_payment_id: payosPaymentId,
        payos_order_code: orderCode,
        payos_amount: amount,
        payos_checkout_url: paymentUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('[PayOS Create] Failed to save payment reference:', updateError.message)
      return NextResponse.json({ error: 'Failed to save payment reference' }, { status: 500 })
    }

    return NextResponse.json({ paymentUrl, payosPaymentId, amount, isDeposit })
  } catch (error) {
    console.error('[PayOS Create] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
