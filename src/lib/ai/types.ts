import { type ProductOption } from '@/app/(public)/order/order-types'

// Kiểu dáng thùng khách chọn trong form — bên dưới là toàn bộ lựa chọn hợp lệ.
export const BOX_STYLES = ['rsc_a1', 'am_duong', 'mailer', 'cod_shipping', 'branded'] as const
export type BoxStyle = (typeof BOX_STYLES)[number]

export const BOX_STYLE_LABELS: Record<BoxStyle, string> = {
  rsc_a1: 'Thùng carton đối khẩu – RSC / A1',
  am_duong: 'Thùng carton âm dương',
  mailer: 'Thùng carton nắp gài / Mailer Box',
  cod_shipping: 'Thùng carton chuyên ship COD',
  branded: 'Thùng carton in thương hiệu',
}

// Customer does not specify carton specs — AI decides layers/flute from product
// dimensions & weight.
export type RecommendInput = {
  productType: string
  boxStyle: BoxStyle
  lengthCm: number
  widthCm: number
  heightCm: number
  weightGrams: number
  desiredQuantity: number
  hasPrinting: boolean
  printFaces?: '2_main' | '4_sides'
  hasDesignFile?: boolean
}

export type RecommendationAlternative = {
  boxType: string
  layers: number
  estimatedUnitPriceMin: number
  estimatedUnitPriceMax: number
  confidence: number
}

export type AIRecommendation = {
  boxType: string
  boxStyle: string
  layers: number
  fluteType: string
  suggestedProductId: string | null
  outerDimensions: { length: number; width: number; height: number }
  materialDescription: string
  estimatedUnitPriceMin: number
  estimatedUnitPriceMax: number
  estimatedTotalMin: number
  estimatedTotalMax: number
  moq: number
  printingRecommendation: string
  leadTimeDays: number
  advice: string
  confidence: number
  alternatives: RecommendationAlternative[]
}

export type { ProductOption }

export interface AIProvider {
  readonly name: string
  recommend(input: RecommendInput, catalog: ProductOption[]): Promise<AIRecommendation>
}