import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { addSalesNotes } from '@/lib/data/consultations-list'

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
  const { notes } = body as { notes?: string }

  if (!notes) {
    return NextResponse.json({ error: 'Thiếu ghi chú.' }, { status: 400 })
  }

  await addSalesNotes(id, notes).catch(() => {
    return NextResponse.json({ error: 'Không thể lưu ghi chú.' }, { status: 500 })
  })

  return NextResponse.json({ success: true })
}
