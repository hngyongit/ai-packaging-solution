import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { listSavedProducts, SavedProductError, saveCustomProfile } from '@/lib/data/saved-products'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// Mẫu thùng đã lưu từ tư vấn AI — đăng nhập bắt buộc.

const saveSchema = z.object({
  consultationId: z.string().uuid(),
  name: z.string().trim().min(1, 'Đặt tên cho mẫu').max(100),
  notes: z.string().trim().max(500).optional(),
})

export async function GET() {
  const profile = await getAuthenticatedProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ items: await listSavedProducts(profile.id) })
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = saveSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
    }

    const result = await saveCustomProfile({ ...parsed.data, userId: profile.id })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof SavedProductError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Saved-products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
