/**
 * PayOS Webhook handler — idempotent, verifies checksum, updates order.
 * 
 * Called by PayOS after customer completes payment.
 * Must be idempotent: PayOS may retry if we don't return 200 quickly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookChecksum, type PayOSWebhookPayload } from './client'

// Status transitions allowed on successful payment
const PAID_STATUSES = ['pending', 'staff_review', 'confirmed', 'deposit_paid'] as const

/**
 * Handle PayOS webhook — exported for reuse in route handler.
 */
export async function handlePayOSWebhook(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as PayOSWebhookPayload
    
    // 1. Verify signature
    if (!verifyWebhookChecksum(body)) {
      console.error('[PayOS Webhook] Checksum verification failed')
      return NextResponse.json({ status: 'Failure', message: 'Invalid checksum' }, { status: 400 })
    }

    // 2. Only process paid events
    if (body.status !== 'paid') {
      console.log(`[PayOS Webhook] Ignoring non-paid event: ${body.status}`)
      return NextResponse.json({ status: 'Success' }, { status: 200 })
    }

    // 3. Find order by payos_payment_id (orderCode)
    const admin = await createAdminClient()
    const orderCode = Number(body.orderCode)
    
    const { data: orders, error: fetchError } = await admin
      .from('orders')
      .select('id, status, total_amount, payos_payment_id, payment_status')
      .eq('payos_payment_id', String(orderCode))
      .maybeSingle()

    if (fetchError) {
      console.error('[PayOS Webhook] Failed to find order:', fetchError.message)
      return NextResponse.json({ status: 'Failure', message: 'Database error' }, { status: 500 })
    }

    if (!orders) {
      console.warn(`[PayOS Webhook] Order not found for orderCode=${orderCode}`)
      return NextResponse.json({ status: 'Success' }, { status: 200 }) // Don't retry unknown orders
    }

    // 4. Idempotency check — already paid?
    if (orders.payment_status === 'paid') {
      console.log(`[PayOS Webhook] Order ${orders.id} already paid, skipping`)
      return NextResponse.json({ status: 'Success' }, { status: 200 })
    }

    // 5. Amount verification
    if (Number(orders.total_amount ?? 0) !== body.amount) {
      console.error(
        `[PayOS Webhook] Amount mismatch: order=${orders.total_amount}, webhook=${body.amount}`,
        `Order ID: ${orders.id}`
      )
      // Don't auto-update — let staff handle it manually
      return NextResponse.json({ status: 'Success' }, { status: 200 })
    }

    // 6. Update order — set payment_status = 'paid', payment_method = 'payos'
    const now = new Date().toISOString()
    const { error: updateError } = await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_method: 'payos',
        updated_at: now,
      })
      .eq('id', orders.id)

    if (updateError) {
      console.error('[PayOS Webhook] Failed to update order:', updateError.message)
      return NextResponse.json({ status: 'Failure', message: 'Update failed' }, { status: 500 })
    }

    // 7. Auto-transition: if order is confirmed/deposit_paid → move to production
    if (['confirmed', 'deposit_paid'].includes(orders.status)) {
      await admin
        .from('orders')
        .update({ status: 'production', updated_at: now })
        .eq('id', orders.id)

      await admin.from('order_status_history').insert({
        order_id: orders.id,
        from_status: orders.status,
        to_status: 'production',
        notes: `Tự động chuyển sang sản xuất — đơn đã thanh toán qua PayOS`,
        changed_by: null,
        created_at: now,
      })

      console.log(`[PayOS Webhook] Auto-transitioned order ${orders.id} → production`)
    }

    // 8. Log payment confirmation in order_status_history as info-only record
    await admin.from('order_status_history').insert({
      order_id: orders.id,
      from_status: orders.status,
      to_status: orders.status, // stays same — payment confirmation, not status change
      notes: `Đã thanh toán qua PayOS — Transaction: ${body.transactionId}`,
      changed_by: null,
      created_at: now,
    })

    console.log(`[PayOS Webhook] ✅ Order ${orders.id} marked as paid`)
    return NextResponse.json({ status: 'Success' }, { status: 200 })

  } catch (error) {
    console.error('[PayOS Webhook] Unexpected error:', error)
    return NextResponse.json(
      { status: 'Failure', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
