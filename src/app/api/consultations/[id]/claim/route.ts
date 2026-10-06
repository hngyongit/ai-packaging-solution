import { type NextRequest, NextResponse } from 'next/server'

import { claimConsultation } from '@/lib/data/consultations'
import { getAuthenticatedProfile } from '@/lib/data/profile'

/**
 * Gán tư vấn ẩn danh cho user vừa đăng nhập, để bước sau (thêm giỏ / đặt hàng)
 * qua được guard sở hữu. Gọi ngay sau khi login trong modal, trước khi retry.
 * Tư vấn đã có chủ → claimed = false, không phải lỗi.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    return NextResponse.json({ claimed: await claimConsultation(id, profile.id) })
  } catch (error) {
    console.error('Claim consultation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
