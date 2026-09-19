import OpenAI from 'openai'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

import { applyReasons, scoreStock } from '../stock-match'
import { BOX_STYLES, type AIProvider, type AIRecommendation, type BoxStyle, type PackagingProtection, type ProductOption, type RecommendInput, type StockMatch, type StockOption } from '../types'

const packagingProtectionSchema = z.object({
  level: z.enum(['none', 'light', 'heavy']),
  material: z.string(),
  howToWrap: z.string(),
  thicknessCm: z.number().min(0).max(20),
})

const recommendationSchema = z.object({
  boxType: z.string(),
  boxStyle: z.string(),
  boxStyleId: z.string().nullable().optional(),
  layers: z.number().int().positive(),
  fluteType: z.string(),
  suggestedProductId: z.string().nullable().optional(),
  outerDimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  materialDescription: z.string(),
  packagingProtection: packagingProtectionSchema,
  estimatedUnitPriceMin: z.number().nonnegative(),
  estimatedUnitPriceMax: z.number().nonnegative(),
  estimatedTotalMin: z.number().nonnegative(),
  estimatedTotalMax: z.number().nonnegative(),
  moq: z.number().nonnegative(),
  printingRecommendation: z.string(),
  leadTimeDays: z.number().nonnegative(),
  advice: z.string(),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(
    z.object({
      boxType: z.string(),
      layers: z.number().int().positive(),
      estimatedUnitPriceMin: z.number().nonnegative(),
      estimatedUnitPriceMax: z.number().nonnegative(),
      confidence: z.number().min(0).max(1),
    })
  ),
})

function isBoxStyle(value: string | null | undefined): value is BoxStyle {
  return !!value && BOX_STYLES.some((s) => s === value)
}

function loadContext(): string {
  return readFileSync(join(process.cwd(), 'src/lib/ai/context.md'), 'utf8')
}

function buildSystemPrompt(): string {
  return `${loadContext()}\n\nKhách CÓ THỂ chọn trước kiểu dáng thùng (boxStyle trong input, tùy chọn; chỉ nhận rsc_a1 | am_duong | mailer). Nếu có, tôn trọng và dùng đúng. Nếu thiếu, mặc định rsc_a1 (thùng đối khẩu RSC/A1) trừ khi sản phẩm cần kiểu khác. Trả boxStyleId là một trong 3 id thật trên. Số lớp và sóng carton do bạn quyết định từ kích thước và trọng lượng sản phẩm. packagingProtection (bọc/bảo vệ phía trong thùng): tự quyết định từ loại sản phẩm, trọng lượng và độ dễ vỡ. Hàng dễ vỡ (thủy tinh, gốm sứ, điện tử) luôn cần bọc — mặc định túi khí hoặc xốp mút, level heavy; hàng nhẹ thông thường chỉ lót giấy để chống xước, level light; hàng rất chắc không cần, level none. Kích thước thùng outerDimensions PHẢI TÍNH CẢ độ dày bọc: kích thước sản phẩm + dung sai 1–3cm + 2 × thicknessCm (bọc cả hai phía mỗi chiều). howToWrap viết ngắn gọn cách quấn/bọc thực tế bằng tiếng Việt. Nếu input có trường notes (yêu cầu thêm của khách, ≤100 chữ), hãy ưu tiên đáp ứng các yêu cầu đó (vật liệu bọc, kiểu thùng, in ấn, giao hàng...) — đây là ý khách, nếu không khả thi thì nêu lý do trong advice. Đây là danh mục sản phẩm của xưởng (dạng JSON). Bạn PHẢI chọn sản phẩm từ đây, chỉ dùng id thật:\n`
}

function buildUserPrompt(input: RecommendInput, catalog: ProductOption[]): string {
  return JSON.stringify({ input, catalog })
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private readonly client: OpenAI
  private readonly model: string

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.AI_BASE_URL ?? 'https://api.ai-box.vn/v1',
    })
    this.model = process.env.AI_MODEL ?? 'deepseek-v4-flash-0731'
  }

  async recommend(input: RecommendInput, catalog: ProductOption[]): Promise<AIRecommendation> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input, catalog) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('AI returned empty response')

    const parsed = recommendationSchema.parse(JSON.parse(raw) as unknown)

    return {
      ...parsed,
      suggestedProductId: parsed.suggestedProductId ?? null,
      // boxStyleId/boxStyleImageUrl: route validate id + tra imageUrl từ DB.
      boxStyleId: isBoxStyle(parsed.boxStyleId) ? parsed.boxStyleId : null,
      boxStyleImageUrl: null,
      estimatedTotalMin: num(parsed.estimatedTotalMin, parsed.estimatedUnitPriceMin * input.desiredQuantity),
      estimatedTotalMax: num(parsed.estimatedTotalMax, parsed.estimatedUnitPriceMax * input.desiredQuantity),
    }
  }

  async matchStock(input: RecommendInput, catalog: StockOption[]): Promise<StockMatch[]> {
    // thứ hạng/số liệu lấy từ scoreStock (deterministic, không cho AI bịa số);
    // AI chỉ viết lại `reason` cho tự nhiên theo đúng ý khách.
    const matches = scoreStock(input, catalog)
    if (matches.length === 0) return matches

    const reasonsSchema = z.object({
      reasons: z.array(z.object({ productId: z.string(), reason: z.string().min(10) })),
    })

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là tư vấn bán hàng carton. Với nhu cầu của khách và các mẫu thùng có sẵn đã được chọn ở dưới, viết lại trường reason cho TỪNG mẫu bằng tiếng Việt: 1–2 câu tự nhiên, gọi tên khách, nói vì sao mẫu này hợp (kích thước, số lớp, tồn kho, giá). KHÔNG thay đổi con số, KHÔNG thêm mẫu mới. Trả JSON đúng dạng {"reasons":[{"productId":"...","reason":"..."}]} với productId lấy nguyên văn từ danh sách.',
          },
          { role: 'user', content: JSON.stringify({ input, matches }) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      })

      const raw = completion.choices[0]?.message?.content
      if (!raw) return matches
      const parsed = reasonsSchema.parse(JSON.parse(raw) as unknown)
      return applyReasons(
        matches,
        Object.fromEntries(parsed.reasons.map((r) => [r.productId, r.reason]))
      )
    } catch {
      // AI lỗi → vẫn trả kết quả deterministic, không chặn trang tư vấn.
      return matches
    }
  }
}

function num(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : round2(fallback)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}