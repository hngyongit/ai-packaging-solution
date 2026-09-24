/**
 * Consultations data functions for staff — list, detail, transitions, assign, notes, convert.
 * Uses Supabase admin client (bypasses RLS) so staff can query all consultations.
 */

import { createAdminClient } from '@/lib/supabase/server'
import type { AIRecommendation } from '@/lib/ai/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsultationListFilter = {
  page?: number
  perPage?: number
  status?: string
  statuses?: string[]
  assignedTo?: string // undefined = all
  search?: string
  sortBy?: 'created_at' | 'status' | 'contact_name'
  sortOrder?: 'asc' | 'desc'
}

export type ConsultationRowWithCustomer = {
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
  purchase_frequency: string | null
  delivery_deadline: string | null
  reference_image_url: string | null
  preferred_layers: number | null
  flute_type: string | null
  mockup_url: string | null
  dieline_url: string | null
  mockup_requests: number | null
  ai_recommendation: AIRecommendation | null
  ai_suggested_product_id: string | null
  ai_suggested_dimensions: { length: number; width: number; height: number } | null
  ai_suggested_layers: number | null
  ai_confidence: number | null
  ai_processed_at: string | null
  created_at: string
  updated_at: string
  // Joined fields:
  customer_id: string | null
  customer_name: string | null // profiles.full_name
  customer_phone: string | null // profiles.phone
  customer_email: string | null // auth.users.email (via join)
  assigned_to: string | null // profiles.id
  assigned_name: string | null // profiles.full_name (assigned)
  sales_notes: string | null
}

export type PaginationInfo = {
  total: number
  page: number
  perPage: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Helper: build PostgREST select string with profile joins
// ---------------------------------------------------------------------------

const CONSULTATION_SELECT = `
  *,
  customer:profiles!consultations_customer_id_fkey (
    id,
    full_name,
    phone
  ),
  assignee:profiles!consultations_assigned_to_fkey (
    id,
    full_name
  )
`

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/** Lấy danh sách để staff xem */
export async function listConsultations(
  filter: ConsultationListFilter
): Promise<{ data: ConsultationRowWithCustomer[]; pagination: PaginationInfo }> {
  const admin = await createAdminClient()
  const page = filter.page ?? 1
  const perPage = filter.perPage ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  const sortBy = filter.sortBy ?? 'created_at'
  const sortOrder = filter.sortOrder ?? 'desc'

  let query = admin.from('consultations').select(CONSULTATION_SELECT, { count: 'exact' })

  // Status filter
  if (filter.status) {
    query = query.eq('status', filter.status)
  } else if (filter.statuses && filter.statuses.length > 0) {
    query = query.in('status', filter.statuses)
  }

  // Assignment filter
  if (filter.assignedTo) {
    query = query.eq('assigned_to', filter.assignedTo)
  } else {
    // When no assignment filter, show both assigned and unassigned
    query = query.or('assigned_to.is.null,assigned_to.not.is.null')
  }

  // Search
  if (filter.search) {
    const term = `%${filter.search}%`
    query = query.or(
      `product_type.ilike.${term},notes.ilike.${term},customer.full_name.ilike.${term}`
    )
  }

  // Sort
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Pagination
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to list consultations: ${error.message}`)
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / perPage)

  return {
    data: (data as unknown as ConsultationRowWithCustomer[]) ?? [],
    pagination: { total, page, perPage, totalPages },
  }
}

/** Lấy chi tiết consultation + join customer info */
export async function getConsultationFull(id: string): Promise<ConsultationRowWithCustomer | null> {
  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('consultations')
    .select(CONSULTATION_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to get consultation: ${error.message}`)
  }

  if (!data) return null

  // Normalize joined fields
  const row = data as unknown as ConsultationRowWithCustomer
  row.customer_name = (data as any)?.customer?.full_name ?? null
  row.customer_phone = (data as any)?.customer?.phone ?? null
  row.customer_email = (data as any)?.customer?.email ?? null
  row.assigned_name = (data as any)?.assignee?.full_name ?? null

  return row
}

/** Chuyển status với CAS (optimistic concurrency) */
export async function updateConsultationStatus(
  id: string,
  fromStatus: string,
  toStatus: string
): Promise<{ success: boolean; conflict?: boolean }> {
  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('consultations')
    .update({ status: toStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', fromStatus)
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to update consultation status: ${error.message}`)
  }

  // Nếu không có row nào được update → conflict (optimistic lock)
  if (!data) {
    return { success: false, conflict: true }
  }

  return { success: true }
}

/** Gán nhân viên */
export async function assignConsultation(id: string, userId: string): Promise<void> {
  const admin = await createAdminClient()

  const { error } = await admin
    .from('consultations')
    .update({ assigned_to: userId, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to assign consultation: ${error.message}`)
  }
}

/** Thêm sales notes */
export async function addSalesNotes(id: string, notes: string): Promise<void> {
  const admin = await createAdminClient()

  const { error } = await admin
    .from('consultations')
    .update({ sales_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to save sales notes: ${error.message}`)
  }
}

/** Convert consultation thành order (business action quan trọng) */
export async function convertConsultationToOrder(
  consultationId: string,
  orderId: string // ID của order vừa tạo
): Promise<void> {
  const admin = await createAdminClient()

  const { error } = await admin
    .from('consultations')
    .update({
      status: 'converted',
      assigned_to: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultationId)
    .in('status', ['quoted', 'staff_reviewed'])

  if (error) {
    throw new Error(`Failed to convert consultation to order: ${error.message}`)
  }
}
