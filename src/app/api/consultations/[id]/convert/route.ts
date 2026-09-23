/**
 * POST /api/consultations/[id]/convert
 * Staff-only endpoint: convert a consultation into an order.
 * Steps:
 * 1. Get consultation full data via getConsultationFull(id)
 * 2. Build order item from AI recommendation
 * 3. Call createOrderWithItems() → returns order ID
 * 4. Call convertConsultationToOrder(id, orderId)
 * 5. Return { success: true, orderId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { getConsultationFull, convertConsultationToOrder } from '@/lib/data/consultations-list'
import { createOrderWithItems, OrderError } from '@/lib/data/orders-create'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthenticatedProfile(request)
  if (!profile || !['sales', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
  }

  const { id } = await params

  // Step 1: Get consultation full data
  const consultation = await getConsultationFull(id).catch(() => null)
  if (!consultation) {
    return NextResponse.json({ error: 'Không tìm thấy tư vấn.' }, { status: 404 })
  }

  // Validate status allows conversion
  if (!['quoted', 'staff_reviewed'].includes(consultation.status)) {
    return NextResponse.json(
      { error: `Không thể chuyển từ trạng thái "${consultation.status}".` },
      { status: 400 }
    )
  }

  // Step 2: Build order item from AI recommendation
  const ai = consultation.ai_recommendation as any
  const dims = consultation.ai_suggested_dimensions ?? { length: 0, width: 0, height: 0 }
  const quantity = consultation.desired_quantity ?? ai?.moq ?? 1

  const orderItem = {
    productId: ai?.suggestedProductId ?? '',
    dimensions: {
      length: dims.length ?? 30,
      width: dims.width ?? 20,
      height: dims.height ?? 15,
      boxStyleId: ai?.boxStyleId ?? undefined,
    },
    printingSpecs: consultation.has_printing
      ? {
          mockupUrl: consultation.mockup_url ?? undefined,
          logoUrl: consultation.logo_url ?? undefined,
          printFaces: consultation.print_faces ?? undefined,
        }
      : undefined,
    quantity,
    isCustom: true,
    itemName: consultation.product_type,
    notes: consultation.notes ?? undefined,
  }

  // Determine customer ID: use consultation's customer_id or the staff's choice
  const customerId = consultation.customer_id ?? profile.id

  // Step 3: Build CreateOrderInput
  const createInput = {
    customerId,
    consultationId: id,
    items: [orderItem],
    paymentMethod: 'cod' as const,
    contactName: consultation.customer_name ?? 'Khách hàng',
    contactPhone: consultation.customer_phone ?? '',
    contactEmail: '',
    deliveryMethod: 'delivery' as const,
    deliveryAddress: '',
    notes: consultation.sales_notes ?? consultation.notes ?? undefined,
  }

  let result: Record<string, unknown>
  try {
    result = await createOrderWithItems(createInput, profile)
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Không thể tạo đơn hàng.' }, { status: 500 })
  }

  // Step 4: Mark consultation as converted
  try {
    await convertConsultationToOrder(id, result.id as string)
  } catch {
    // Best-effort: order was created but consultation mark failed
    // The order still exists; manual fix can be done in DB
  }

  // Step 5: Return success with order ID
  return NextResponse.json({
    success: true,
    orderId: result.id,
    orderCode: (result as any).order_code,
  })
}
