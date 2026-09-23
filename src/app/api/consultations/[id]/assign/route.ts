import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { assignConsultation } from '@/lib/data/consultations-list'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthenticatedProfile(request)
  if (!profile || !['sales', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { userId } = body as { userId?: string }

  if (!userId) {
    return NextResponse.json({ error: 'Thiếu user ID.' }, { status: 400 })
  }

  await assignConsultation(id, userId).catch(() => {
    return NextResponse.json({ error: 'Không thể phân công.' }, { status: 500 })
  })

  return NextResponse.json({ success: true })
}
