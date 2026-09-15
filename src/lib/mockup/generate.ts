import { build, render, BOX_STYLE_TO_DIELINE } from '@/lib/dieline/index'
import { fitArtwork, printPlacements } from '@/lib/dieline/print-faces'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'
import { buildMockupPrompt, generateMockupImage, mockupSeed, mockupSizeFromDims } from '@/lib/ai/mockup'
import { imageAspectRatio } from '@/lib/images/dimensions'
import type { MockupLogoInput } from './request'

const LOGO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

// Điều độ gen mockup: khuôn bế có hình in (luôn tính được) + ảnh AI (tốn tiền).
// Dieline upload TRƯỚC để dù AI lỗi vẫn còn file cho xưởng/khách xem.

export type GenerateMockupInput = {
  consultationId: string
  boxStyleId: string
  boxStyleLabel: string
  /** Ảnh mockup gốc của kiểu thùng (Cloudinary) — ảnh A đưa cho AI. */
  baseImageUrl: string
  logo: MockupLogoInput
  printPosition: string
  dimsCm: { length: number; width: number; height: number }
  layers: number
  /**
   * Báo ngay khi khuôn bế đã upload xong — AI có lỗi thì route vẫn persist + trả
   * URL này cho client hiện "Khuôn bế" (đừng vứt kết quả miễn phí vì bước tốn tiền fail).
   */
  onDielineReady?: (assets: { logoUrl: string; dielineUrl: string }) => void | Promise<void>
}

export type GeneratedMockup = {
  logoUrl: string
  dielineUrl: string
  mockupUrl: string
  size: string
  requestId: string | null
}

const MAX_FETCH_BYTES = 10 * 1024 * 1024

export async function generatePrintMockup(input: GenerateMockupInput): Promise<GeneratedMockup> {
  const folder = `mockups/${input.consultationId}`
  const logo = await resolveLogo(input.logo, folder)
  const aspect = imageAspectRatio(logo.bytes, logo.mime) ?? 1
  const dataUri = `data:${logo.mime};base64,${logo.bytes.toString('base64')}`

  const model = build({
    type: BOX_STYLE_TO_DIELINE[input.boxStyleId] ?? 'rsc',
    D: round(input.dimsCm.length * 10),
    C: round(input.dimsCm.height * 10),
    R: round(input.dimsCm.width * 10),
    t: input.layers >= 5 ? 5 : 3,
  })
  const rects = printPlacements(model, input.printPosition).map((r) => fitArtwork(r, aspect))
  const { svg } = render(
    { type: model.type, D: model.input.D, C: model.input.C, R: model.input.R, t: model.input.t },
    { artwork: { src: dataUri, rects } },
  )

  const dieline = await uploadToCloudinary({ body: svg, folder, filename: `${input.printPosition}-dieline` })
  await input.onDielineReady?.({ logoUrl: logo.url, dielineUrl: dieline.secureUrl })

  const size = mockupSizeFromDims(input.dimsCm)
  const { buffer, requestId } = await generateMockupImage({
    baseImageUrl: input.baseImageUrl,
    logoUrl: logo.url,
    prompt: buildMockupPrompt({
      boxStyleLabel: input.boxStyleLabel,
      dimsCm: input.dimsCm,
      printPosition: input.printPosition,
    }),
    size,
    seed: mockupSeed(input.boxStyleId),
  })
  const mockup = await uploadToCloudinary({ body: buffer, folder, filename: `${input.printPosition}-mockup` })

  return { logoUrl: logo.url, dielineUrl: dieline.secureUrl, mockupUrl: mockup.secureUrl, size, requestId }
}

type ResolvedLogo = { url: string; bytes: Buffer; mime: string }

async function resolveLogo(logo: MockupLogoInput, folder: string): Promise<ResolvedLogo> {
  if ('upload' in logo) {
    // Logo tự re-host sang Cloudinary: tư vấn chạy không cần đăng nhập nên không
    // dùng /api/upload (yêu cầu session), và AI cần URL công khai ổn định.
    const uploaded = await uploadToCloudinary({ body: logo.upload.bytes, folder, filename: 'logo' })
    return { url: uploaded.secureUrl, bytes: logo.upload.bytes, mime: logo.upload.mime }
  }
  const { bytes, mime } = await fetchImage(logo.url)
  if (!LOGO_MIME_TYPES.has(mime)) throw new Error('Logo lưu trữ không phải ảnh PNG/JPG/WEBP')
  return { url: logo.url, bytes, mime }
}

async function fetchImage(url: string): Promise<{ bytes: Buffer; mime: string }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Không tải được file logo (HTTP ${response.status})`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_FETCH_BYTES) throw new Error('File logo rỗng hoặc vượt 10MB')
  const mime = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  return { bytes: Buffer.from(bytes), mime }
}

const round = (v: number) => Math.round(v * 10) / 10
