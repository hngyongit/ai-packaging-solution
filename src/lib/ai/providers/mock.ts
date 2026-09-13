import { BOX_STYLE_LABELS, type AIProvider, type AIRecommendation, type BoxStyle, type ProductOption, type RecommendInput } from '../types'

const BUFFER_CM = 2
const DEFAULT_BOX_STYLE: BoxStyle = 'rsc_a1'
const AIR_BAG_PER_SIDE_CM = 2 // Túi khí bọc mỗi phía — cộng 2× cho mỗi chiều.

function pickProduct(catalog: ProductOption[], input: RecommendInput): ProductOption | undefined {
  if (catalog.length === 0) return undefined
  const heavy = input.weightGrams >= 3000
  const candidates = heavy
    ? catalog.filter((p) => p.availableLayers.includes(5))
    : catalog.filter((p) => p.availableLayers.includes(3))
  return candidates[0] ?? catalog[0]
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export class MockProvider implements AIProvider {
  readonly name = 'mock'

  async recommend(input: RecommendInput, catalog: ProductOption[]): Promise<AIRecommendation> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const product = pickProduct(catalog, input)
    const layers = input.weightGrams >= 3000 ? 5 : 3
    const basePrice = product?.basePrice ?? 0
    const minPrice = layerFactor(layers) * basePrice * 0.9
    const maxPrice = layerFactor(layers) * basePrice * 1.15
    const unitMin = round2(minPrice)
    const unitMax = round2(maxPrice)

    const boxStyleId: BoxStyle = input.boxStyle ?? DEFAULT_BOX_STYLE

    // Nếu khách ghi yêu cầu thêm (notes), mock ưu tiên bọc xốp/túi khí để dễ nhận thấy.
    const needsAirBag = input.weightGrams >= 3000 || Boolean(input.notes?.toLowerCase().includes('vỡ') || input.notes?.includes('xốp'))
    const protection = needsAirBag
      ? {
          level: 'heavy' as const,
          material: 'Túi khí (air bubble)',
          howToWrap: 'Bọc túi khí quanh 6 mặt sản phẩm rồi lót thêm 1 lớp giấy ở đáy thùng.',
          thicknessCm: AIR_BAG_PER_SIDE_CM,
        }
      : {
          level: 'light' as const,
          material: 'Giấy kraft / giấy vụn',
          howToWrap: 'Lót giấy kraft ở đáy và xung quanh để chống xước, giữ sản phẩm không xê dịch.',
          thicknessCm: 0,
        }
    // Kích thước thùng tính CẢ độ dày bọc: sản phẩm + buffer + 2 × thickness (bọc 2 phía).
    const withBuffer = (dim: number) => round2(dim + BUFFER_CM + 2 * protection.thicknessCm)

    return {
      boxType: `Thùng carton ${layers} lớp`,
      boxStyle: BOX_STYLE_LABELS[boxStyleId],
      boxStyleId,
      boxStyleImageUrl: null, // Route hợp imageUrl từ DB theo boxStyleId.
      layers,
      fluteType: layers === 5 ? 'BC-flute' : 'B-flute',
      suggestedProductId: product?.id ?? null,
      outerDimensions: {
        length: withBuffer(input.lengthCm),
        width: withBuffer(input.widthCm),
        height: withBuffer(input.heightCm),
      },
      packagingProtection: protection,
      materialDescription: layers === 5
        ? `Carton ${layers} lớp, sóng BC, phù hợp hàng cần bảo vệ chắc chắn.`
        : `Carton ${layers} lớp, sóng B, tối ưu chi phí cho hàng nhẹ.`,
      estimatedUnitPriceMin: unitMin,
      estimatedUnitPriceMax: unitMax,
      estimatedTotalMin: round2(unitMin * input.desiredQuantity),
      estimatedTotalMax: round2(unitMax * input.desiredQuantity),
      moq: 500,
      printingRecommendation: input.hasPrinting
        ? `In ${input.printFaces === '4_sides' ? '2 mặt chính + 2 mặt phụ' : '2 mặt chính'}${
            input.hasDesignFile ? '' : ' — khách chưa có file thiết kế, cần gửi logo để lên mockup.'
          }`
        : 'Không in — thùng trơn, tiết kiệm chi phí.',
      leadTimeDays: 18,
      advice: input.notes
        ? `Đã cân nhắc yêu cầu thêm của bạn: "${input.notes}". ${protection.level === 'heavy' ? 'Nên bọc túi khí/xốp quanh sản phẩm trước khi cho vào thùng.' : 'Nên lót giấy để tránh xước trong thùng.'}`
        : input.weightGrams >= 3000
          ? 'Hàng trên 3kg nên dùng thùng 5 lớp và bọc túi khí quanh sản phẩm để chống va đập khi vận chuyển.'
          : 'Hàng nhẹ dùng thùng 3 lớp vừa đủ, tiết kiệm chi phí; nên lót giấy để tránh xước trong thùng.',
      confidence: 0.92,
      alternatives: catalog.slice(1, 3).map((alt) => ({
        boxType: alt.name,
        layers: alt.availableLayers[0] ?? layers,
        estimatedUnitPriceMin: round2(alt.basePrice * 0.9),
        estimatedUnitPriceMax: round2(alt.basePrice * 1.15),
        confidence: 0.7,
      })),
    }
  }
}

function layerFactor(layers: number) {
  return layers >= 5 ? 1.15 : 1
}