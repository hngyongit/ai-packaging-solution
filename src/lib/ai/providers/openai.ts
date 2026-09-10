import OpenAI from 'openai'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

import { type AIProvider, type AIRecommendation, type ProductOption, type RecommendInput } from '../types'

const recommendationSchema = z.object({
  boxType: z.string(),
  boxStyle: z.string(),
  layers: z.number().int().positive(),
  fluteType: z.string(),
  suggestedProductId: z.string().nullable().optional(),
  outerDimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  materialDescription: z.string(),
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

function loadContext(): string {
  return readFileSync(join(process.cwd(), 'src/lib/ai/context.md'), 'utf8')
}

function buildSystemPrompt(): string {
  return `${loadContext()}\n\nKhách chọn trước KIỂU DÁNG thùng — trường boxStyle trong input, tôn trọng lựa chọn này cho các trường boxStyle/boxType trong output. Số lớp và sóng carton thì do bạn quyết định từ kích thước & trọng lượng sản phẩm. Đây là danh mục sản phẩm của xưởng (dạng JSON). Bạn PHẢI chọn sản phẩm từ đây, chỉ dùng id thật:\n`
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
      estimatedTotalMin: num(parsed.estimatedTotalMin, parsed.estimatedUnitPriceMin * input.desiredQuantity),
      estimatedTotalMax: num(parsed.estimatedTotalMax, parsed.estimatedUnitPriceMax * input.desiredQuantity),
    }
  }
}

function num(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : round2(fallback)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}