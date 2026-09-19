import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { removeCartItem, setCartCustomSpec, setCartQuantity } from '@/lib/data/cart'
import { customSpecSchema } from '@/lib/data/custom-spec'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// quantity cho mọi loại dòng; custom chỉ dùng cho dòng 'custom' (chỉnh quy cách
// ngay trong giỏ).
const patchSchema = z.object({
  quantity: z.coerce.number().int().positive().max(1_000_000).optional(),
  custom: customSpecSchema.optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return NextResponse.json({ error: 'Invalid cart item id' }, { status: 400 })

    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
    }
    const { quantity, custom } = parsed.data
    if (!custom && !quantity) return NextResponse.json({ error: 'Không có thay đổi nào' }, { status: 400 })
    if (custom) await setCartCustomSpec({ customerId: profile.id, cartItemId: id.data, custom })
    if (quantity) await setCartQuantity({ customerId: profile.id, cartItemId: id.data, quantity })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Cart PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return NextResponse.json({ error: 'Invalid cart item id' }, { status: 400 })

    await removeCartItem({ customerId: profile.id, cartItemId: id.data })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
