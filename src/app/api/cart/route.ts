import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { addToCart, type AddToCartRequest } from '@/lib/data/cart-add'
import { getCart, getCartCount } from '@/lib/data/cart'
import { OrderError } from '@/lib/data/orders-create'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// Giỏ hàng theo user — đăng nhập bắt buộc (RLS cart_items: auth.uid() = customer_id).
// resolve spec + validate nằm ở lib/data/cart-add, route chỉ HTTP.

const addSchema = z.object({
  productId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().max(1_000_000).optional(),
  hasPrinting: z.boolean().default(false),
  printingSpecs: z.record(z.unknown()).optional(),
  kind: z.enum(['stock', 'custom']).default('stock'),
  consultationId: z.string().uuid().optional(),
  savedProductId: z.string().uuid().optional(),
  custom: z.unknown().optional(),
})

export async function GET() {
  const profile = await getAuthenticatedProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ items: await getCart(profile.id) })
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = addSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
    }

    const input: AddToCartRequest = { customerId: profile.id, ...parsed.data }
    const { id } = await addToCart(input)
    return NextResponse.json({ id, count: await getCartCount(profile.id) }, { status: 201 })
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
