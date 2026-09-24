/**
 * PATCH /api/orders/[id]/price
 * Staff điều chỉnh giá đơn hàng (unit_price, subtotal).
 * Auth: staff only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'

const priceAdjustmentSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      unitPrice: z.coerce.number().positive(),
    })
  ),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getAuthenticatedProfile()

  if (!profile || (profile.role !== 'sales' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized — staff only' }, { status: 401 })
  }

  const parsed = priceAdjustmentSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { items } = parsed.data

  try {
    const admin = await createAdminClient()

    // Get order + items
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', resolvedParams.id)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate order is in editable status
    if (!['pending', 'staff_review'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot adjust price for order with status: ${order.status}` },
        { status: 400 }
      )
    }

    // Validate all itemIds belong to this order
    const existingItemIds = new Set(order.order_items?.map((item: any) => item.id) || [])
    for (const item of items) {
      if (!existingItemIds.has(item.itemId)) {
        return NextResponse.json({ error: `Item ${item.itemId} not found in order` }, { status: 400 })
      }
    }

    // Update each item's unit_price
    const updates: Array<{ itemId: string; unitPrice: number }> = []
    let newTotal = 0

    for (const adjustment of items) {
      const existingItem = order.order_items.find((item: any) => item.id === adjustment.itemId)
      if (!existingItem) continue

      const newSubtotal = Number(existingItem.quantity) * adjustment.unitPrice
      newTotal += newSubtotal

      await admin
        .from('order_items')
        .update({
          unit_price: adjustment.unitPrice,
          subtotal: newSubtotal,
        })
        .eq('id', adjustment.itemId)

      updates.push({ itemId: adjustment.itemId, unitPrice: adjustment.unitPrice })
    }

    // Recalculate order total_amount
    const { error: updateOrderError } = await admin
      .from('orders')
      .update({
        total_amount: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateOrderError) {
      console.error('[Price Adjustment] Failed to update order total:', updateOrderError.message)
      return NextResponse.json({ error: 'Failed to update order total' }, { status: 500 })
    }

    // Log history entry
    await admin.from('order_status_history').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: order.status, // stays same — price adjustment, not status change
      changed_by: profile.id,
      notes: `Staff điều chỉnh giá: ${items.length} dòng | Tổng mới: ${newTotal.toLocaleString('vi-VN')}đ`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount: newTotal,
      updatedItems: updates,
    })
  } catch (error) {
    console.error('[Price Adjustment] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
