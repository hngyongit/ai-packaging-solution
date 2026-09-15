import { createClient } from '@/lib/supabase/server'

import { getConsultation } from '@/lib/data/consultations'
import { printPositionLabel } from '@/lib/config/print-positions'

// Handoff từ màn kết quả AI sang form đặt hàng.
export type PrintHandoff = {
  consultationId: string
  productOptionId: string | null
  dims: { length: number; width: number; height: number } | null
  /** Kiểu thùng AI chọn — đơn hàng phải biết để xưởng tái tạo khuôn bế. */
  boxStyleId: string | null
  quantity: number | null
  layers: number | null
  logoUrl: string | null
  mockupUrl: string | null
  dielineUrl: string | null
  printPositionLabel: string | null
}

/**
 * getConsultation dùng service key (bypass RLS) nên PHẢI tự chặn ở đây:
 * chỉ chủ tư vấn (hoặc tư vấn ẩn danh — customer_id NULL, coi id như capability)
 * mới được xem logo/mockup của tư vấn đó.
 */
export async function getPrintHandoff(consultationId: string | undefined): Promise<PrintHandoff | null> {
  if (!consultationId || !isUuid(consultationId)) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const consultation = await getConsultation(consultationId).catch((error) => {
    console.error('Handoff consultation lookup failed:', error)
    return null
  })
  if (!consultation) return null
  if (consultation.customer_id && consultation.customer_id !== user?.id) return null

  return {
    consultationId: consultation.id,
    productOptionId: consultation.ai_suggested_product_id,
    dims: consultation.ai_suggested_dimensions,
    boxStyleId: consultation.ai_recommendation?.boxStyleId ?? consultation.box_style,
    quantity: consultation.desired_quantity,
    layers: consultation.ai_suggested_layers,
    logoUrl: consultation.logo_url,
    mockupUrl: consultation.mockup_url ?? null,
    dielineUrl: consultation.dieline_url ?? null,
    printPositionLabel: consultation.print_faces ? printPositionLabel(consultation.print_faces) : null,
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string | undefined): value is string {
  return Boolean(value && UUID_RE.test(value))
}
