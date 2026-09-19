import { type RecommendInput, type StockMatch, type StockOption } from './types'

// Điểm xếp hạng thùng có sẵn theo nhu cầu khách — thuần deterministic, dùng cho
// MockProvider và làm nền cho OpenAIProvider (AI chỉ viết `reason` bằng lời).

/** Sản phẩm + dung sai 2cm mỗi chiều phải lọt lòng thùng (thùng có sẵn không may đo). */
const FIT_BUFFER_CM = 2

function fits(product: StockOption, input: RecommendInput): boolean {
  const d = product.maxDimensions
  if (!d) return false
  return (
    input.lengthCm + FIT_BUFFER_CM <= d.length &&
    input.widthCm + FIT_BUFFER_CM <= d.width &&
    input.heightCm + FIT_BUFFER_CM <= d.height
  )
}

function bestLayer(layers: number[], min: number): number | null {
  const ok = layers.filter((l) => l >= min)
  return ok.length > 0 ? Math.min(...ok) : null
}

function needsHeavy(input: RecommendInput): boolean {
  return input.weightGrams >= 3000
}

function volumeScore(product: StockOption, input: RecommendInput): number {
  const d = product.maxDimensions
  if (!d) return 0
  const need = input.lengthCm * input.widthCm * input.heightCm
  const have = d.length * d.width * d.height
  if (have < need) return 0
  // Thùng sát cỡ điểm cao nhất; thùng quá lớn lãng phí carton → điểm thấp.
  const ratio = need / have
  if (ratio >= 0.5) return 1
  if (ratio >= 0.25) return 0.6
  return 0.3
}

function stockScore(product: StockOption, input: RecommendInput): number {
  if (product.stockQuantity <= 0) return 0
  if (product.stockQuantity >= input.desiredQuantity) return 1
  return product.stockQuantity / input.desiredQuantity
}

function priceScore(product: StockOption, cheapest: number, dearest: number): number {
  if (dearest <= cheapest) return 1
  return (dearest - product.basePrice) / (dearest - cheapest)
}

export function scoreStock(
  input: RecommendInput,
  catalog: StockOption[],
  limit = 3
): StockMatch[] {
  const heavy = needsHeavy(input)
  const minLayers = heavy ? 5 : 3
  const prices = catalog.map((p) => p.basePrice)
  const cheapest = prices.length > 0 ? Math.min(...prices) : 0
  const dearest = prices.length > 0 ? Math.max(...prices) : 0

  return catalog
    .filter((product) => fits(product, input))
    .map((product) => {
      const layer = bestLayer(product.availableLayers, minLayers)
      // Không có lớp đủ dày cho hàng nặng → vẫn bán được nhưng trừ nặng điểm.
      const layerScore = layer === null ? (heavy ? 0.15 : 0.5) : 1
      const layersChosen = layer ?? Math.max(...product.availableLayers)
      const confidence = Math.round(
        (0.4 * volumeScore(product, input) + 0.2 * stockScore(product, input) + 0.15 * priceScore(product, cheapest, dearest) + 0.25 * layerScore) * 100
      ) / 100
      const suggestedQuantity = Math.min(input.desiredQuantity, product.stockQuantity)

      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        reason: buildReason(product, input, layersChosen, heavy, suggestedQuantity),
        confidence,
        availableStock: product.stockQuantity,
        suggestedQuantity,
        unitPrice: product.basePrice,
        outOfStock: product.stockQuantity <= 0,
        maxDimensions: product.maxDimensions,
        availableLayers: product.availableLayers,
      }
    })
    .sort((a, b) => b.confidence - a.confidence || a.unitPrice - b.unitPrice)
    .slice(0, limit)
}

function buildReason(
  product: StockOption,
  input: RecommendInput,
  layers: number,
  heavy: boolean,
  suggestedQuantity: number
): string {
  const d = product.maxDimensions
  const parts: string[] = []
  if (d) parts.push(`lòng thùng ${d.length}×${d.width}×${d.height}cm chứa vừa sản phẩm ${input.lengthCm}×${input.widthCm}×${input.heightCm}cm`)
  parts.push(heavy ? `carton ${layers} lớp chịu tải cho hàng ${Math.round(input.weightGrams / 100) / 10}kg` : `carton ${layers} lớp phù hợp hàng nhẹ`)
  if (suggestedQuantity < input.desiredQuantity) {
    parts.push(`kho còn ${suggestedQuantity.toLocaleString('vi-VN')} thùng, thiếu ${input.desiredQuantity} — nhận một phần hoặc đặt gia công phần còn lại`)
  } else {
    parts.push(`đủ ${input.desiredQuantity.toLocaleString('vi-VN')} thùng trong kho, giao ngay`)
  }
  return `Mã ${product.code}: ${parts.join(', ')}.`
}

/**
 * Ghép lý do AI viết tay vào kết quả deterministic; id không có trong danh sách
 * hoặc ngoài catalog thì giữ nguyên (AI hallucinate → không tin).
 */
export function applyReasons(matches: StockMatch[], reasons: Record<string, string>): StockMatch[] {
  return matches.map((match) => {
    const text = reasons[match.productId] ?? reasons[match.productCode]
    return text ? { ...match, reason: text } : match
  })
}
