import { z } from 'zod'

import { printPositionLabel } from '@/lib/config/print-positions'

import { type ConsultationRow } from './consultations'
import { type SavedProductRow } from './saved-products'

// Quy cách của một dòng "theo yêu cầu" — bộ thông số AI trả về sau tư vấn
// (kích thước, số lớp, kiểu thùng) hoặc khách tự nhập. In ấn KHÔNG nằm ở đây:
// dùng cột has_printing / printing_specs sẵn có của cart_items.
//
// Giá luôn lấy từ sản phẩm cơ sở (product_id của dòng) phía server — spec không
// chứa giá để client không quyết định được số tiền.

export type CustomSpec = {
  length: number
  width: number
  height: number
  layers?: number
  boxStyleId?: string
  /** Tên hiển thị trên dòng giỏ, VD "Thùng theo yêu cầu 320×220×180". */
  productName: string
  /** Mã hiển thị; custom không có mã SKU nên dẫn từ nguồn (mẫu đã lưu / tư vấn). */
  productCode: string
  notes?: string
}

export const customSpecSchema = z.object({
  length: z.coerce.number().positive('Nhập chiều dài (cm)').max(9999),
  width: z.coerce.number().positive('Nhập chiều rộng (cm)').max(9999),
  height: z.coerce.number().positive('Nhập chiều cao (cm)').max(9999),
  layers: z.coerce.number().int().positive().optional(),
  boxStyleId: z.string().trim().max(40).optional(),
  productName: z.string().trim().min(1).max(200),
  productCode: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).optional(),
})

export type CustomCartItem = {
  /** Sản phẩm cơ sở — neo giá + để xưởng biết nền carton nào. */
  productId: string
  spec: CustomSpec
  hasPrinting: boolean
  printingSpecs: Record<string, unknown> | null
  savedProductId?: string | null
  /** Số lượng khách khai khi tư vấn / lưu mẫu — client không gửi thì dùng cái này. */
  quantity?: number | null
}

function dimsLabel(length: number, width: number, height: number) {
  return `${length}×${width}×${height} cm`
}

/**
 * Kết quả tư vấn → line custom. Cùng logic itemFromHandoff cũ nhưng chạy phía
 * server để thêm giỏ thẳng từ màn kết quả AI.
 */
export function customFromConsultation(
  consultation: ConsultationRow,
  fallbackProductId?: string | null
): CustomCartItem | null {
  const productId = consultation.ai_suggested_product_id ?? fallbackProductId ?? null
  if (!productId) return null

  const dims = consultation.ai_suggested_dimensions ?? consultation.ai_recommendation?.outerDimensions
  if (!dims) return null
  const layers = consultation.ai_suggested_layers ?? consultation.ai_recommendation?.layers
  const boxStyleId = consultation.ai_recommendation?.boxStyleId ?? consultation.box_style ?? undefined
  const hasPrinting = Boolean(consultation.mockup_url || consultation.has_printing)

  return {
    productId,
    spec: {
      ...dims,
      layers,
      boxStyleId: boxStyleId ?? undefined,
      productName: `Thùng theo yêu cầu ${dimsLabel(dims.length, dims.width, dims.height)}`,
      productCode: `CUS-${consultation.id.slice(0, 6).toUpperCase()}`,
    },
    hasPrinting,
    printingSpecs: hasPrinting
      ? {
          hasPrinting,
          fileUrl: consultation.logo_url ?? null,
          printPositionLabel: consultation.print_faces ? printPositionLabel(consultation.print_faces) : null,
          mockupUrl: consultation.mockup_url ?? null,
          dielineUrl: consultation.dieline_url ?? null,
        }
      : null,
    quantity: consultation.desired_quantity ?? undefined,
  }
}

/** Mẫu đã lưu (saved_products) → line custom. Giữ lại mockup/dieline của mẫu. */
export function customFromSaved(saved: SavedProductRow, fallbackProductId?: string | null): CustomCartItem | null {
  const productId = saved.product_id ?? fallbackProductId ?? null
  const dims = saved.custom_dimensions
  if (!productId || !dims?.length || !dims.width || !dims.height) return null
  const specs = saved.printing_specs
  const hasPrinting = Boolean(specs?.hasPrinting)

  return {
    productId,
    savedProductId: saved.id,
    spec: {
      length: dims.length,
      width: dims.width,
      height: dims.height,
      layers: dims.layers ?? undefined,
      boxStyleId: saved.box_style_id ?? undefined,
      productName: saved.name,
      productCode: `CUS-${saved.id.slice(0, 6).toUpperCase()}`,
      notes: saved.notes ?? undefined,
    },
    hasPrinting,
    printingSpecs: hasPrinting || specs?.mockupUrl
      ? {
          hasPrinting,
          fileUrl: saved.logo_url ?? specs?.mockupUrl ?? null,
          printPositionLabel: specs?.printPositionLabel ?? null,
          mockupUrl: specs?.mockupUrl ?? null,
          dielineUrl: specs?.dielineUrl ?? null,
        }
      : null,
    quantity: dims.quantity ?? undefined,
  }
}
