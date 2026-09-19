import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getAuthenticatedProfile } from '@/lib/data/profile'
import { ensureDefaultAddress, listAddresses, saveAddress, type AddressInput } from '@/lib/data/addresses'
import { OrderError } from '@/lib/data/orders-create'

// Địa chỉ liên hệ + giao hàng của khách — đăng nhập bắt buộc.

const addressSchema = z.object({
  label: z.string().trim().min(1).max(60),
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, 'Số điện thoại phải đủ 10 chữ số'),
  email: z.string().trim().email(),
  address: z.string().trim().min(1).max(500),
  isDefault: z.boolean().optional(),
})

function fail(error: unknown) {
  if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('Address API error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function GET() {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ items: await listAddresses(profile.id) })
  } catch (error) {
    return fail(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = addressSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
    }
    const input: AddressInput = { customerId: profile.id, ...parsed.data }
    return NextResponse.json({ item: await saveAddress(input) }, { status: 201 })
  } catch (error) {
    return fail(error)
  }
}

/** Dựng địa chỉ đầu tiên từ hồ sơ khi khách chưa có địa chỉ nào. */
export async function PUT() {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ item: await ensureDefaultAddress(profile.id) })
  } catch (error) {
    return fail(error)
  }
}
