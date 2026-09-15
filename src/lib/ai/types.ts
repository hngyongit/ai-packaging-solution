import { type ProductOption } from '@/app/(public)/order/order-types'

// Kiểu dáng thùng khách chọn trong form — bên dưới là toàn bộ lựa chọn hợp lệ.
// Box style is OPTIONAL: khi bỏ trống, AI tự quyết định (mặc định đối khẩu RSC/A1).
export const BOX_STYLES = ['rsc_a1', 'am_duong', 'mailer'] as const
export type BoxStyle = (typeof BOX_STYLES)[number]

export const BOX_STYLE_LABELS: Record<BoxStyle, string> = {
  rsc_a1: 'Thùng carton đối khẩu - RSC / A1',
  am_duong: 'Thùng carton âm dương',
  mailer: 'Thùng carton nắp gài / Mailer Box',
}

// Customer does not specify carton specs — AI decides layers/flute from product
// dimensions & weight.
export type RecommendInput = {
  productType: string
  boxStyle?: BoxStyle
  lengthCm: number
  widthCm: number
  heightCm: number
  weightGrams: number
  desiredQuantity: number
  hasPrinting: boolean
  // Khách ghi thêm yêu cầu/điều kiện (≤100 chữ) — AI phải cân nhắc như một phần input.
  notes?: string
}

export type RecommendationAlternative = {
  boxType: string
  layers: number
  estimatedUnitPriceMin: number
  estimatedUnitPriceMax: number
  confidence: number
}

// Bọc bảo vệ sản phẩm bên trong thùng — AI tự quyết định từ loại/trọng lượng/độ
// dễ vỡ. thicknessCm là độ dày cộng thêm VÀO MỖI CHIỀU của thùng (bọc cả 2 phía
// nên kích thước thùng = sản phẩm + buffer + 2 × thicknessCm).
export type PackagingProtection = {
  level: 'none' | 'light' | 'heavy'
  material: string // Vật liệu chính: túi khí, giấy kraft, xốp mút...
  howToWrap: string // Cách bọc/quấn bảo vệ ngắn gọn
  thicknessCm: number // Độ dày thêm mỗi chiều (0 khi level = none)
}

export type AIRecommendation = {
  boxType: string
  boxStyle: string
  boxStyleId: BoxStyle | null
  boxStyleImageUrl: string | null
  layers: number
  fluteType: string
  suggestedProductId: string | null
  outerDimensions: { length: number; width: number; height: number }
  materialDescription: string
  packagingProtection: PackagingProtection
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