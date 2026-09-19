import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertStaff, ProductAdminError, updateProduct } from '@/lib/data/products-admin'
import { getAuthenticatedProfile } from '@/lib/data/profile'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  category: z.string().optional(),
  boxType: z.string().optional(),
  maxDimensions: z
    .object({ length: z.number().positive(), width: z.number().positive(), height: z.number().positive() })
    .optional(),
  availableLayers: z.array(z.number().int().positive()).min(1).optional(),
  basePrice: z.number().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertStaff(await getAuthenticatedProfile())
    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })

    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
    }

    await updateProduct(id.data, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ProductAdminError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Products PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
