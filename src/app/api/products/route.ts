import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertStaff, createProduct, listAllProducts, ProductAdminError } from '@/lib/data/products-admin'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// Danh mục + tồn kho — chỉ staff (kiểm tra role tường minh, service client).

const productSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  category: z.string(),
  boxType: z.string(),
  minDimensions: z
    .object({ length: z.number().positive(), width: z.number().positive(), height: z.number().positive() })
    .nullable()
    .optional(),
  maxDimensions: z.object({ length: z.number().positive(), width: z.number().positive(), height: z.number().positive() }),
  availableLayers: z.array(z.number().int().positive()).min(1),
  basePrice: z.number().nonnegative(),
  unit: z.string().trim().max(20).default('unit'),
  stockQuantity: z.number().int().nonnegative().nullable(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().nullable().optional(),
})

export async function GET() {
  try {
    assertStaff(await getAuthenticatedProfile())
    return NextResponse.json({ items: await listAllProducts() })
  } catch (error) {
    if (error instanceof ProductAdminError) return NextResponse.json({ error: error.message }, { status: error.status })
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    assertStaff(await getAuthenticatedProfile())
    const parsed = productSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
    }
    return NextResponse.json(await createProduct(parsed.data), { status: 201 })
  } catch (error) {
    if (error instanceof ProductAdminError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
