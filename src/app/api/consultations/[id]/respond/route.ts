/**
 * POST /api/consultations/[id]/respond/route.ts
 * Staff responds to a consultation:
 *   - approve → status becomes 'quoted' (customer can create order)
 *   - revise  → status becomes 'pending_review' (customer edits & resubmits)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/data/orders'

const respondSchema = z.object({
  action: z.enum(['approve', 'revise']),
  notes: z.string().trim().max(1000).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'sales' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.formData()
  const parsed = respondSchema.safeParse({
    action: body.get('action'),
    notes: body.get('notes')?.toString(),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { action, notes } = parsed.data
  const consultationId = resolvedParams.id

  try {
    const admin = await createAdminClient()

    // Get current consultation
    const { data: consultation, error: fetchError } = await admin
      .from('consultations')
      .select('id, status')
      .eq('id', consultationId)
      .single()

    if (fetchError || !consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    // Can only respond from ai_processed or staff_reviewed
    if (!['ai_processed', 'staff_reviewed'].includes(consultation.status)) {
      return NextResponse.json({ error: 'Cannot respond from current status' }, { status: 400 })
    }

    // Determine target status based on action
    let targetStatus: string
    if (action === 'approve') {
      targetStatus = 'quoted'
    } else {
      // revise → send back to customer for editing
      targetStatus = 'pending_review'
    }

    // Update consultation
    const updateData: Record<string, unknown> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    }

    // Add notes if provided
    if (notes) {
      const { data: current } = await admin
        .from('consultations')
        .select('sales_notes')
        .eq('id', consultationId)
        .single()

      const existingNotes = (current as any)?.sales_notes ?? ''
      updateData['sales_notes'] = existingNotes
        ? `${existingNotes}\n\n[${new Date().toLocaleString('vi-VN')}] Nhân viên: ${notes}`
        : notes
    }

    const { error: updateError } = await admin
      .from('consultations')
      .update(updateData)
      .eq('id', consultationId)

    if (updateError) {
      console.error('Failed to respond to consultation:', updateError)
      return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status: targetStatus,
      message: action === 'approve'
        ? 'Đã duyệt tư vấn — khách hàng có thể tạo đơn hàng'
        : 'Đã gửi yêu cầu điều chỉnh cho khách hàng',
    })
  } catch (error) {
    console.error('Respond consultation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
