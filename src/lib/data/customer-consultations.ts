/**
 * Consultations data functions for customer — list own consultations.
 */

import { createClient } from '@/lib/supabase/server'
import type { AIRecommendation } from '@/lib/ai/types'

export type CustomerConsultationRow = {
  id: string
  status: string
  product_type: string
  box_style: string | null
  product_length: number | null
  product_width: number | null
  product_height: number | null
  product_weight: number | null
  desired_quantity: number | null
  has_printing: boolean | null
  print_faces: string | null
  logo_url: string | null
  notes: string | null
  sales_notes: string | null
  ai_recommendation: AIRecommendation | null
  ai_suggested_dimensions: { length: number; width: number; height: number } | null
  ai_confidence: number | null
  created_at: string
}

// Simple select without joins — RLS handles ownership via customer_id
const CONSULTATION_SELECT = `
  id,
  status,
  product_type,
  box_style,
  product_length,
  product_width,
  product_height,
  product_weight,
  desired_quantity,
  has_printing,
  print_faces,
  logo_url,
  notes,
  sales_notes,
  ai_recommendation,
  ai_suggested_dimensions,
  ai_confidence,
  created_at
`

export async function listCustomerConsultations(
  customerId: string,
  filter?: { status?: string; page?: number; perPage?: number }
): Promise<{ data: CustomerConsultationRow[]; pagination: { total: number; page: number; totalPages: number } }> {
  const supabase = await createClient()
  const page = filter?.page ?? 1
  const perPage = filter?.perPage ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('consultations')
    .select(CONSULTATION_SELECT, { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter?.status) {
    query = query.eq('status', filter.status)
  }

  const { data, error, count } = await query
  if (error) {
    console.error('listCustomerConsultations DB error:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to list customer consultations: ${error.message}`)
  }

  console.log('listCustomerConsultations result:', {
    customerId,
    rowCount: data?.length ?? 0,
    total: count,
    sampleRow: data?.[0] ? { id: data[0].id, status: data[0].status, product_type: data[0].product_type } : null,
  })

  const total = count ?? 0
  return {
    data: (data as unknown as CustomerConsultationRow[]) ?? [],
    pagination: { total, page, totalPages: Math.ceil(total / perPage) },
  }
}

export async function getConsultationById(id: string): Promise<CustomerConsultationRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consultations')
    .select(CONSULTATION_SELECT)
    .eq('id', id)
    .single()
  if (error) {
    console.error('getConsultationById DB error:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to get consultation: ${error.message}`)
  }
  return (data as unknown as CustomerConsultationRow) ?? null
}
