import { type NextRequest, NextResponse } from 'next/server'

import { createOrderSchema, createOrderWithItems, OrderError, type OrderItemInput } from '@/lib/data/orders-create'
import { listOrders, OrderListError } from '@/lib/data/orders-list'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// Route handler mỏng: validate → gọi lib/data → trả response (API_RULES).
// Logic tạo đơn dùng chung với /api/checkout qua createOrderWithItems().

export async function GET(request: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    return NextResponse.json(await listOrders(profile, searchParams))
  } catch (error) {
    if (error instanceof OrderListError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = createOrderSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data
    const createdOrder = await createOrderWithItems(
      {
        customerId: body.customerId ?? profile.id,
        items: body.items as OrderItemInput[],
        paymentMethod: body.paymentMethod,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        deliveryMethod: body.deliveryMethod,
        deliveryAddress: body.deliveryAddress,
        consultationId: body.consultationId,
        notes: body.notes,
      },
      profile
    )

    return NextResponse.json({ data: createdOrder }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
