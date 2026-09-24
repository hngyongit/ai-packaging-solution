/**
 * POST /api/consultations/:id/request-review
 * Public endpoint — no auth required (như /api/ai/recommend).
 * Uses ai_processed status + review_requested flag instead of new DB constraint.
 * 
 * Note: Currently returns success without DB mutation (option 2 from plan).
 * Frontend manages reviewRequested state locally. Staff sees all ai_processed
 * consultations in their list. A future migration can add review_requested column.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Validate consultation exists and is ai_processed
  const admin = await createAdminClient()

  const { data: consultation, error: fetchError } = await admin
    .from('consultations')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !consultation) {
    return NextResponse.json({ error: 'Không tìm thấy tư vấn.' }, { status: 404 })
  }

  if (consultation.status !== 'ai_processed') {
    return NextResponse.json(
      { error: 'Chỉ yêu cầu review khi AI đã xử lý xong.' },
      { status: 400 }
    )
  }

  // TODO: When ready, add migration for review_requested BOOLEAN column:
  //   ALTER TABLE consultations ADD COLUMN review_requested BOOLEAN DEFAULT false;
  //   CREATE INDEX idx_consultations_review_requested ON consultations(review_requested) WHERE status = 'ai_processed';
  // Then uncomment below:
  // const { error: updateError } = await admin
  //   .from('consultations')
  //   .update({ review_requested: true })
  //   .eq('id', id)

  return NextResponse.json({ success: true })
}
