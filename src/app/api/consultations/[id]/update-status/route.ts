import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { updateConsultationStatus } from '@/lib/data/consultations-list'

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
  const { fromStatus, toStatus } = body as { fromStatus?: string; toStatus?: string }

  if (!fromStatus || !toStatus) {
    return NextResponse.json({ error: 'Thiếu thông tin.' }, { status: 400 })
  }

  const result = await updateConsultationStatus(id, fromStatus, toStatus).catch(() => ({ success: false }))

  if (!result.success) {
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái. Có thể trạng thái đã thay đổi.' }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}
