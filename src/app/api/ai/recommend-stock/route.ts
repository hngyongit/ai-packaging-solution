import { NextRequest, NextResponse } from 'next/server'

import { getAIProvider } from '@/lib/ai'
import { consultationInputSchema, createConsultation } from '@/lib/data/consultations'
import { getStockOptions } from '@/lib/data/products'

/**
 * Tư vấn mua thùng CÓ SẴN: xếp hạng SKU trong kho theo nhu cầu khách.
 * Tạo consultation (lead) để bộ phận bán nhìn thấy yêu cầu, nhưng KHÔNG ghi
 * vào ai_recommendation — cột đó mang shape riêng cho trang kết quả thùng theo
 * yêu cầu. Kết quả xếp hạng là transient (tồn kho thay đổi liên tục) nên trả
 * thẳng cho client, không lưu.
 */
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

    const catalog = await getStockOptions()
    if (catalog.length === 0) {
      return NextResponse.json({ error: 'No stocked products available' }, { status: 404 })
    }

    const { id } = await createConsultation(parsed.data)
    const matches = await getAIProvider().matchStock(parsed.data, catalog)

    return NextResponse.json({ consultationId: id, matches }, { status: 201 })
  } catch (error) {
    console.error('AI recommend-stock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
