import { type AIProvider, type ProductOption } from './types'
import { MockProvider } from './providers/mock'
import { OpenAIProvider } from './providers/openai'

export function getAIProvider(): AIProvider {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey || apiKey === 'your_ai_box_api_key') return new MockProvider()
  return new OpenAIProvider(apiKey)
}

export type { AIProvider, AIRecommendation, RecommendInput, ProductOption } from './types'