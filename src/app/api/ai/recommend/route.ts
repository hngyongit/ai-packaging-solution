import { NextRequest, NextResponse } from 'next/server'

import { getAIProvider } from '@/lib/ai'
import { BOX_STYLES, type BoxStyle } from '@/lib/ai/types'
import { getBoxStyleMap, getBoxStyles } from '@/lib/data/boxes'
import { consultationInputSchema, createConsultation, updateAIRecommendation } from '@/lib/data/consultations'
import { getActiveProductOptions } from '@/lib/data/products'
import { getAuthenticatedProfile } from '@/lib/data/profile'

function isBoxStyle(value: string | null | undefined): value is BoxStyle {
  return BOX_STYLES.some((s) => s === value)
}

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

    const profile = await getAuthenticatedProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await createConsultation(parsed.data, profile.id)

    const provider = getAIProvider()
    let recommendation = await provider.recommend(parsed.data, catalog)

    // Enrich ảnh preview + mockup theo kiểu thùng (AI chọn hoặc mặc định RSC/A1).
    const boxMap = getBoxStyleMap(await getBoxStyles())
    const boxStyleId = isBoxStyle(recommendation.boxStyleId) ? recommendation.boxStyleId : 'rsc_a1'
    const box = boxMap[boxStyleId]
    recommendation = {
      ...recommendation,
      boxStyleId,
      boxStyleImageUrl: box?.previewUrl ?? null,
    }

    await updateAIRecommendation(id, recommendation)

    return NextResponse.json({ consultationId: id, recommendation }, { status: 201 })
  } catch (error) {
    console.error('AI recommend error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}