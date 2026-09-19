import { NextResponse } from 'next/server'

import { getCartCount } from '@/lib/data/cart'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// Đếm riêng cho badge navbar — nhẹ hơn GET /api/cart (không cần product).

export async function GET() {
  const profile = await getAuthenticatedProfile()
  if (!profile) return NextResponse.json({ count: 0 })
  const count = await getCartCount(profile.id).catch(() => 0)
  return NextResponse.json({ count })
}
