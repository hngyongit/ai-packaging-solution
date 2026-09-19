import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { deleteAddress, saveAddress, setDefaultAddress } from '@/lib/data/addresses'
import { OrderError } from '@/lib/data/orders-create'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// Sửa / đặt mặc định / xoá một địa chỉ — chỉ đúng chủ sở hữu.

// Toàn bộ field bắt buộc khi sửa (không merge từng phần) — form client luôn gửi
// đủ nên đơn giản hơn; riêng isDefault gửi một mình thì đổi default thuần tuý.
const patchSchema = z.object({
  label: z.string().trim().min(1).max(60),
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, 'Số điện thoại phải đủ 10 chữ số'),
  email: z.string().trim().email(),
  address: z.string().trim().min(1).max(500),
  isDefault: z.boolean().optional(),
})

async function authed(params: { id: string }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) throw new OrderError('Unauthorized', 401)
  const id = z.string().uuid().safeParse(params.id)
  if (!id.success) throw new OrderError('Invalid address id', 400)
  return { customerId: profile.id, id: id.data }
}

function fail(error: unknown) {
  if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('Address API error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { customerId, id } = await authed(params)
    const json = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!json) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })

    // Chỉ bật default, không sửa nội dung.
    if (json.isDefault === true && Object.keys(json).length === 1) {
      await setDefaultAddress(customerId, id)
      return NextResponse.json({ ok: true })
    }

    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ item: await saveAddress({ customerId, id, ...parsed.data }) })
  } catch (error) {
    return fail(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { customerId, id } = await authed(params)
    await deleteAddress(customerId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return fail(error)
  }
}
