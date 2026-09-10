import { NextRequest, NextResponse } from 'next/server'

import { getAIProvider } from '@/lib/ai'
import { consultationInputSchema, createConsultation, updateAIRecommendation } from '@/lib/data/consultations'
import { getActiveProductOptions } from '@/lib/data/products'

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null)
    const parsed = consultationInputSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const catalog = await getActiveProductOptions()
    if (catalog.length === 0) {
      return NextResponse.json({ error: 'No products available' }, { status: 404 })
    }

    const { id } = await createConsultation(parsed.data)

    const provider = getAIProvider()
    const recommendation = await provider.recommend(parsed.data, catalog)
    await updateAIRecommendation(id, recommendation)

    return NextResponse.json({ consultationId: id, recommendation }, { status: 201 })
  } catch (error) {
    console.error('AI recommend error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}