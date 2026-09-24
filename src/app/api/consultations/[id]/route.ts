import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { createAdminClient } from '@/lib/supabase/server'

const CONSULTATION_SELECT = `
  id, customer_id, status, product_type, box_style, product_length, product_width,
  product_height, product_weight, desired_quantity, has_printing,
  print_faces, logo_url, notes, sales_notes, ai_recommendation,
  ai_suggested_dimensions, ai_confidence, created_at
`

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Use admin client to bypass RLS (we check ownership manually)
    const admin = await createAdminClient()
    const { data: consultation, error } = await admin
      .from('consultations')
      .select(CONSULTATION_SELECT)
      .eq('id', id)
      .single()

    if (error || !consultation) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Debug logging
    console.log('[Consultation API] Debug:', {
      consultationId: consultation.id,
      consultationCustomerId: consultation.customer_id,
      profileId: profile.id,
      profileRole: profile.role,
      isMatch: consultation.customer_id === profile.id,
      isNull: consultation.customer_id === null,
    })

    // RLS: customer chỉ xem được consultation của mình
    // Allow if customer_id matches OR if customer_id is NULL (legacy data before fix)
    const isOwner = consultation.customer_id === profile.id || consultation.customer_id === null
    if (profile.role === 'customer' && !isOwner) {
      console.warn('[Consultation API] Forbidden:', {
        customerId: consultation.customer_id,
        requestedBy: profile.id,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(consultation)
  } catch (error) {
    console.error('GET /api/consultations/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
