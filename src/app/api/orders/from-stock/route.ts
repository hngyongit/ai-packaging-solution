/**
 * POST /api/orders/from-stock/route.ts
 * Create an order directly from a stock match (no consultation needed).
 * Customer fills contact info → order created as 'pending' → staff reviews + approves.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data/orders'

const schema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
  contactName: z.string().trim().min(1).max(120),
  contactPhone: z.string().trim().regex(/^\d{10}$/),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
  deliveryAddress: z.string().trim().min(1).max(500).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { productId, quantity, contactName, contactPhone, contactEmail, deliveryAddress, notes } = parsed.data

  try {
    const admin = await createAdminClient()

    // Get product details
    const { data: product, error: productError } = await admin
      .from('products')
      .select('*, box_styles(name, dimensions)')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate order code
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
    const orderCode = `ORD-${date}-${suffix}`

    // Use product's unit_price as estimated total
    const unitPrice = (product as any).unit_price ?? 0
    const estimatedTotal = unitPrice * quantity

    // Create order with pending status
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        order_code: orderCode,
        customer_id: profile.id,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail || null,
        delivery_address: deliveryAddress || null,
        notes: notes || null,
        total_amount: estimatedTotal,
        payment_status: 'unpaid',
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[From Stock] Order creation error:', orderError)
      return NextResponse.json({ error: 'Không thể tạo đơn hàng' }, { status: 500 })
    }

    // Create order items
    const items = [
      {
        order_id: order.id,
        product_id: productId,
        product_name: product.name,
        product_code: (product as any).code,
        quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * quantity,
      },
    ]

    const { error: itemError } = await admin.from('order_items').insert(items)
    if (itemError) {
      console.error('[From Stock] Item creation error:', itemError)
      return NextResponse.json({ error: 'Không thể tạo chi tiết đơn hàng' }, { status: 500 })
    }

    return NextResponse.json({ orderId: order.id, orderCode })
  } catch (error) {
    console.error('[From Stock] Unexpected error:', error)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}
