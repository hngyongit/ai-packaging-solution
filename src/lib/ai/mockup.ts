// Gen ảnh mockup qua ai-box. Tài liệu quan trọng nhất ở đây:
//  - /v1/images/generations BỎ QUA ảnh input → bắt buộc /v1/images/edits.
//  - Ảnh input phải nằm trong input.messages[].content (JSON native); để content
//    ở top-level thì request vẫn 200 nhưng ra ảnh tạo mới từ prompt.
//  - parameters.size chỉ có hiệu lực ở JSON native.
//  - Lỗi model có thể về HTTP 200 với body.error → phải soi body.
//  - data[].url hết hạn sau 24h → tải bytes về lưu Cloudinary ngay.

const IMAGE_ENDPOINT_PATH = '/images/edits'

export type MockupGenInput = {
  baseImageUrl: string
  logoUrl: string
  prompt: string
  size: string
  seed: number
}

function imagesBaseUrl(): string {
  const raw = process.env.AI_BASE_URL ?? 'https://api.ai-box.vn/v1'
  const trimmed = raw.replace(/\/+$/, '')
  // AI_BASE_URL đã chứa /v1 (dùng cho OpenAI SDK) — đừng ghép thành /v1/v1.
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
}

export function mockupEndpoint(): string {
  return `${imagesBaseUrl()}${IMAGE_ENDPOINT_PATH}`
}

export function isImageConfigured(): boolean {
  const key = process.env.AI_API_KEY
  return Boolean(key && key !== 'your_ai_box_api_key')
}

export class ImageApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'ImageApiError'
  }
}

/**
 * Gọi ai-box edits, trả PNG buffer. Ném ImageApiError nếu model báo lỗi,
 * không nhận đủ ảnh input, hoặc thiếu url.
 */
export async function generateMockupImage(input: MockupGenInput): Promise<{ buffer: Buffer; requestId: string | null }> {
  const apiKey = process.env.AI_API_KEY
  if (!isImageConfigured()) throw new ImageApiError('Chưa cấu hình AI_API_KEY cho tạo mockup')
  const model = process.env.AI_IMAGE_MODEL ?? 'qwen-image-3.0'

  const response = await fetch(mockupEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ image: input.baseImageUrl }, { image: input.logoUrl }, { text: input.prompt }],
          },
        ],
      },
      parameters: { n: 1, size: input.size, seed: input.seed, watermark: false },
    }),
    signal: AbortSignal.timeout(180_000),
  })

  const body = (await response.json().catch(() => null)) as ImageEditsResponse | null
  if (!response.ok) {
    throw new ImageApiError(body?.error?.message ?? `HTTP ${response.status}`, response.status)
  }
  // Lỗi model vẫn có thể về 200 → check body.error trước khi lấy ảnh.
  if (body?.error?.message) throw new ImageApiError(body.error.message, response.status)

  const usage = body?.metadata?.usage
  if (usage && typeof usage.input_image_count === 'number' && usage.input_image_count < 2) {
    throw new ImageApiError('AI không nhận đủ ảnh đầu vào (input_image_count < 2)')
  }
  const url = body?.data?.[0]?.url
  if (!url || !url.startsWith('https://')) throw new ImageApiError('AI không trả về ảnh')

  return { buffer: await downloadAsBuffer(url), requestId: body?.metadata?.request_id ?? null }
}

// ── Thuần: size / seed / prompt (check được bằng selfcheck, không I/O) ──────

const ROUND = 16
const MIN_AREA = 512 * 512
const MAX_AREA = 2048 * 2048
const round16 = (v: number) => Math.max(ROUND, Math.round(v / ROUND) * ROUND)

/**
 * Khổ ảnh ra (W*H) lấy cảm hứng từ tỷ lệ mặt thùng, kẹp trong giới hạn px của
 * qwen-image. Tổng px không đổi (~1024²) để ảnh lớn/khỏ đều tốn cùng nhóm giá.
 */
export function mockupSizeFromDims(dimsCm: { length: number; width: number; height: number }): string {
  const ratio = clamp(dimsCm.length / Math.max(1, dimsCm.height), 1, 2.5)
  const area = clamp(ratio * 1024 * 1024, MIN_AREA, MAX_AREA)
  const w = round16(Math.sqrt(area * ratio))
  const h = round16(Math.sqrt(area / ratio))
  return `${w}*${h}`
}

/** Seed cố định theo kiểu thùng → cùng prompt ra cùng phong cách mỗi lần gen. */
export function mockupSeed(boxStyleId: string): number {
  let h = 2166136261
  for (let i = 0; i < boxStyleId.length; i++) {
    h ^= boxStyleId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % 2147483647
}

const FACES_PHRASE: Record<string, string> = {
  '2_main': 'the two long side faces',
  '4_sides': 'all four side faces (two long + two short)',
  '1_top': 'the top face only',
}

/**
 * Prompt tiếng Anh, phong cách khoá cứng: thumbnail nền trắng, carton kraft nâu.
 * Dùng "keep the box shape/construction" (sửa ảnh A), KHÔNG dùng "keep the subject
 * exactly the same" — cụm đó khiến model bê nguyên ảnh gốc, không in logo.
 */
export function buildMockupPrompt(args: {
  boxStyleLabel: string
  dimsCm: { length: number; width: number; height: number }
  printPosition: string
}): string {
  const faces = FACES_PHRASE[args.printPosition] ?? 'the main side faces'
  const { length, width, height } = args.dimsCm
  return [
    `Image A is a reference photo of a ${args.boxStyleLabel}. Image B is the customer's brand logo/artwork to print onto the box.`,
    `Create a clean product-photography thumbnail of this same box style, shown as a fully assembled closed box.`,
    `Pure white seamless studio background, natural brown kraft corrugated cardboard, soft even studio lighting, gentle contact shadow under the box, three-quarter front view, sharp focus, centered, generous white margin.`,
    `The box proportions must match a real box measuring ${length} cm long x ${width} cm wide x ${height} cm high — reproduce these face ratios faithfully so the customer can judge the size.`,
    `Print the logo from Image B on ${faces}, centered on each printed face, as a flat print directly on the cardboard with correct perspective and no background plate behind it. Keep the logo's colors and shape unchanged.`,
    `Do not change the box shape, flaps, seams or construction from Image A. Do not add any other text, graphics, hands, labels or watermarks.`,
  ].join(' ')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

type ImageEditsResponse = {
  data?: { url?: string }[]
  metadata?: { usage?: { input_image_count?: number }; request_id?: string }
  error?: { message?: string; code?: string }
}

/** Link ảnh AI hết hạn sau 24h → tải ngay, có trần dung lượng. */
export async function downloadAsBuffer(url: string, maxBytes = 15 * 1024 * 1024): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new ImageApiError(`Không tải được ảnh từ AI (HTTP ${response.status})`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength === 0) throw new ImageApiError('Ảnh AI trả về rỗng')
  if (bytes.byteLength > maxBytes) throw new ImageApiError('Ảnh AI vượt giới hạn dung lượng')
  return Buffer.from(bytes)
}
