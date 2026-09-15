import { NextRequest, NextResponse } from 'next/server'

import { getBoxStyleMap, getBoxStyles } from '@/lib/data/boxes'
import { getConsultation, requestMockupSlot, updateMockupAssets } from '@/lib/data/consultations'
import { CloudinaryNotConfigured } from '@/lib/cloudinary/upload'
import { generatePrintMockup } from '@/lib/mockup/generate'
import { readMockupForm, resolveMockupRequest } from '@/lib/mockup/request'

// Hạn mức chi phí thật: mỗi tư vấn chỉ gen tối đa N ảnh AI (mockup_requests trong DB).
const MAX_MOCKUP_REQUESTS = 3

export async function POST(request: NextRequest) {
  // Khuôn bế đã upload (nếu tới được bước đó) — AI fail vẫn phải trả về cho client.
  const saved = { dieline: null as { logoUrl: string; dielineUrl: string } | null }
  try {
    const parsed = await readMockupForm(request)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })

    const consultation = parsed.fields.consultationId
      ? await getConsultation(parsed.fields.consultationId)
      : null
    const resolved = resolveMockupRequest(parsed.fields, parsed.logo, consultation)
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

    const input = resolved.request
    const claimed = await requestMockupSlot(input.consultationId, MAX_MOCKUP_REQUESTS)
    if (!claimed) {
      return NextResponse.json(
        { error: `Đã đạt giới hạn ${MAX_MOCKUP_REQUESTS} lần tạo mockup cho tư vấn này` },
        { status: 429 },
      )
    }

    const style = getBoxStyleMap(await getBoxStyles())[input.boxStyleId]
    if (!style?.mockupUrl) {
      return NextResponse.json({ error: 'Kiểu thùng này chưa có ảnh mockup gốc' }, { status: 500 })
    }

    // Khuôn bế tính xong là lưu ngay: AI fail vẫn còn file cho xưởng + client hiện lại.
    const generated = await generatePrintMockup({
      consultationId: input.consultationId,
      boxStyleId: input.boxStyleId,
      boxStyleLabel: style.label,
      baseImageUrl: style.mockupUrl,
      logo: input.logo,
      printPosition: input.printPosition,
      dimsCm: input.dimsCm,
      layers: input.layers,
      onDielineReady: async (assets) => {
        saved.dieline = assets
        await updateMockupAssets(input.consultationId, {
          printFaces: input.printPosition,
          logoUrl: assets.logoUrl,
          dielineUrl: assets.dielineUrl,
        })
      },
    })

    await updateMockupAssets(input.consultationId, {
      printFaces: input.printPosition,
      logoUrl: generated.logoUrl,
      mockupUrl: generated.mockupUrl,
      dielineUrl: generated.dielineUrl,
    })

    return NextResponse.json(
      {
        logoUrl: generated.logoUrl,
        mockupUrl: generated.mockupUrl,
        dielineUrl: generated.dielineUrl,
        printPosition: input.printPosition,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof CloudinaryNotConfigured) {
      return NextResponse.json({ error: 'Chưa cấu hình Cloudinary để lưu mockup' }, { status: 503 })
    }
    console.error('AI mockup error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Không tạo được mockup',
        // Đã kịp lưu khuôn bế → client hiện "Khuôn bế" + cho xem lại, không mất trắng.
        ...(saved.dieline ? { dielineUrl: saved.dieline.dielineUrl, logoUrl: saved.dieline.logoUrl } : {}),
      },
      { status: 502 },
    )
  }
}
