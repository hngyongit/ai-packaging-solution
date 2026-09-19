import { createAdminClient } from '@/lib/supabase/server'

import { printPositionLabel } from '@/lib/config/print-positions'
import { getConsultation } from './consultations'

// Mẫu thùng đã lưu từ phiên tư vấn AI (saved_products) — profile tái sử dụng ở /order.

/** custom_dimensions JSONB — đủ để dựng lại dòng đơn khi import. */
export type SavedDimensions = {
  length: number
  width: number
  height: number
  layers: number | null
  fluteType: string | null
  quantity: number | null
}

export type SavedProductRow = {
  id: string
  name: string
  product_id: string | null
  custom_dimensions: SavedDimensions | null
  printing_specs: {
    hasPrinting?: boolean
    printPositionLabel?: string | null
    mockupUrl?: string | null
    dielineUrl?: string | null
  } | null
  logo_url: string | null
  notes: string | null
  box_style_id: string | null
  source_consultation_id: string | null
  created_at: string
}

export class SavedProductError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export async function listSavedProducts(userId: string): Promise<SavedProductRow[]> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('saved_products')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new SavedProductError(error.message, 500)
  return (data ?? []) as SavedProductRow[]
}

/**
 * Lưu kết quả tư vấn (custom_dimensions + specs từ ai_recommendation) thành mẫu.
 * Đồng thời gán lại chủ sở hữu cho consultation ẩn danh để provenance khớp.
 */
export async function saveCustomProfile(input: {
  userId: string
  name: string
  consultationId: string
  notes?: string
}): Promise<{ id: string }> {
  const admin = await createAdminClient()

  const consultation = await getConsultation(input.consultationId)
  if (!consultation) throw new SavedProductError('Không tìm thấy phiên tư vấn.', 404)
  if (consultation.customer_id && consultation.customer_id !== input.userId) {
    throw new SavedProductError('Phiên tư vấn không thuộc về bạn.', 403)
  }

  const rec = consultation.ai_recommendation
  if (!rec?.outerDimensions) throw new SavedProductError('Tư vấn chưa có kết quả AI để lưu.', 422)

  // Tư vấn ẩn danh → nhận chủ khi lưu (plan Phase 3).
  if (!consultation.customer_id) {
    await admin.from('consultations').update({ customer_id: input.userId }).eq('id', consultation.id)
  }

  const { data, error } = await admin
    .from('saved_products')
    .insert({
      customer_id: input.userId,
      name: input.name,
      product_id: rec.suggestedProductId ?? consultation.ai_suggested_product_id ?? null,
      custom_dimensions: {
        length: rec.outerDimensions.length,
        width: rec.outerDimensions.width,
        height: rec.outerDimensions.height,
        layers: rec.layers ?? null,
        fluteType: rec.fluteType ?? null,
        quantity: consultation.desired_quantity,
      },
      printing_specs: {
        hasPrinting: Boolean(consultation.has_printing),
        printPositionLabel: consultation.print_faces ? printPositionLabel(consultation.print_faces) : null,
        mockupUrl: consultation.mockup_url ?? null,
        dielineUrl: consultation.dieline_url ?? null,
      },
      logo_url: consultation.logo_url,
      notes: input.notes ?? null,
      box_style_id: rec.boxStyleId ?? null,
      source_consultation_id: consultation.id,
    })
    .select('id')
    .single()

  // 23505 = UNIQUE(customer_id, name) → trùng tên, khách đổi tên khác.
  if (error) {
    if (error.code === '23505') throw new SavedProductError('Bạn đã có mẫu trùng tên này.', 409)
    throw new SavedProductError(error.message, 500)
  }
  return { id: data.id }
}

export async function deleteSavedProduct(userId: string, id: string): Promise<void> {  const admin = await createAdminClient()
  const { error, count } = await admin
    .from('saved_products')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('customer_id', userId)
  if (error) throw new SavedProductError(error.message, 500)
  if (!count) throw new SavedProductError('Không tìm thấy mẫu đã lưu.', 404)
}
