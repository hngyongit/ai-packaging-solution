/**
 * POST /api/orders/from-consultation/route.ts
 * Create an order from a consultation, pre-filled with consultation data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data/orders'

const schema = z.object({
  consultationId: z.string().uuid(),
  contactName: z.string().trim().min(1).max(120),
  contactPhone: z.string().trim().regex(/^\d{10}$/),
  contactEmail: z.string().trim().email(),
  deliveryAddress: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(['cod', 'bank_transfer']).default('cod'),
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

  const { consultationId, contactName, contactPhone, contactEmail, deliveryAddress, notes, paymentMethod } = parsed.data

  try {
    const admin = await createAdminClient()

    // Get consultation to verify ownership and get product details
    const { data: consultation, error: consultError } = await admin
      .from('consultations')
      .select('*, customer_id, ai_recommendation, ai_suggested_dimensions, desired_quantity, product_type')
      .eq('id', consultationId)
      .eq('customer_id', profile.id)
      .single()

    if (consultError || !consultation) {
      return NextResponse.json({ error: 'Consultation not found or access denied' }, { status: 404 })
    }

    // Chỉ cho phép tạo đơn từ ai_processed (khách tự tạo) hoặc quoted/staff_reviewed (staff tạo giúp)
    if (!['ai_processed', 'quoted', 'staff_reviewed'].includes(consultation.status)) {
      return NextResponse.json({ error: 'Không thể tạo đơn từ trạng thái tư vấn này' }, { status: 400 })
    }

    // Parse AI recommendation for dimensions
    const r = consultation.ai_recommendation as any
    const dims = consultation.ai_suggested_dimensions

    // Generate order code
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
    const orderCode = `ORD-${date}-${suffix}`

    // Calculate estimated total (use AI suggested quantity if available)
    const quantity = consultation.desired_quantity ?? 10
    const unitPriceMin = r?.estimatedUnitPriceMin ?? 0
    const unitPriceMax = r?.estimatedUnitPriceMax ?? 0
    const estimatedTotal = (unitPriceMin + unitPriceMax) / 2 * quantity

    // Create order with pending status
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        order_code: orderCode,
        customer_id: profile.id,
        consultation_id: consultationId,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        delivery_address: deliveryAddress,
        notes: notes,
        payment_method: paymentMethod,
        total_amount: estimatedTotal,
        status: 'pending',
        delivery_fee: 0, // Will be calculated later
        deposit_amount: 0,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Update consultation status to converted
    await admin
      .from('consultations')
      .update({
        status: 'converted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultationId)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderCode: order.order_code,
    })
  } catch (error) {
    console.error('Create order from consultation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
