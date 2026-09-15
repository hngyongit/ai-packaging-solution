import { isImageConfigured } from '@/lib/ai/mockup'
import { BOX_STYLES, type AIRecommendation } from '@/lib/ai/types'
import type { ConsultationRow } from '@/lib/data/consultations'
import { isPrintPositionForBoxStyle } from '@/lib/config/print-positions'

export type MockupRequestError = { error: string; status: number }

export type LogoUpload = { bytes: Buffer; filename: string; mime: string }

/** Logo gửi lên 2 dạng: URL đã có (bấm "Thử lại") hoặc file khách vừa chọn. */
export type MockupLogoInput = { url: string } | { upload: LogoUpload }

export type ResolvedMockupRequest = {
  consultationId: string
  logo: MockupLogoInput
  printPosition: string
  boxStyleId: string
  dimsCm: { length: number; width: number; height: number }
  layers: number
}

export type MockupRequestResult = { request: ResolvedMockupRequest } | MockupRequestError

const UUID_RE = /^[0-9a-f-]{36}$/i
const DEFAULT_BOX_STYLE = 'rsc_a1'
const MAX_LOGO_BYTES = 10 * 1024 * 1024
// Model ảnh chỉ đọc được raster — PDF/AI/EPS không đưa vào được nên chặn ngay đây.
const LOGO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

/**
 * Đọc multipart: file là tuỳ chọn (client có thể gửi lại logoUrl đã có).
 * Trả về lỗi HTTP để route khỏi phải chứa logic.
 */
export async function readMockupForm(request: Request): Promise<
  | { fields: { consultationId: string; printPosition: string; logoUrl: string }; logo: MockupLogoInput }
  | MockupRequestError
> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail('Nội dung upload không hợp lệ', 400)
  }

  const text = (key: string) => {
    const value = form.get(key)
    return typeof value === 'string' ? value.trim() : ''
  }
  const fields = {
    consultationId: text('consultationId'),
    printPosition: text('printPosition'),
    logoUrl: text('logoUrl'),
  }

  const file = form.get('file')
  if (file instanceof File && file.size > 0) {
    if (!LOGO_MIME_TYPES.has(file.type)) {
      return fail('Logo phải là ảnh PNG, JPG hoặc WEBP', 415)
    }
    if (file.size > MAX_LOGO_BYTES) return fail('File logo vượt 10MB', 413)
    const bytes = Buffer.from(await file.arrayBuffer())
    return { fields, logo: { upload: { bytes, filename: file.name, mime: file.type } } }
  }

  if (!fields.logoUrl) return fail('Vui lòng chọn ảnh logo trước', 400)
  const logoError = validateAssetUrl(fields.logoUrl)
  if (logoError) return fail(logoError, 400)
  return { fields, logo: { url: fields.logoUrl } }
}

/**
 * Validate consultation + input một chỗ. AIRecommendation là JSON do model trả
 * nên phải soi lại từng field trước khi dùng.
 */
export function resolveMockupRequest(
  fields: { consultationId: string; printPosition: string },
  logo: MockupLogoInput,
  consultation: ConsultationRow | null,
): MockupRequestResult {
  if (!UUID_RE.test(fields.consultationId)) return fail('consultationId không hợp lệ', 400)
  if (!consultation) return fail('Không tìm thấy tư vấn', 404)
  if (consultation.status !== 'ai_processed') return fail('AI chưa trả kết quả cho tư vấn này', 409)
  if (!consultation.has_printing) return fail('Tư vấn này không có in ấn', 400)
  if (!isImageConfigured()) return fail('Chưa cấu hình AI tạo mockup (AI_API_KEY)', 503)

  const recommendation = consultation.ai_recommendation
  const boxStyleId = resolveBoxStyleId(recommendation)
  if (!isPrintPositionForBoxStyle(boxStyleId, fields.printPosition)) {
    return fail('Vị trí in không hợp lệ với kiểu thùng này', 400)
  }

  const dimsCm = readDims(recommendation, consultation)
  if (!dimsCm) return fail('Thiếu kích thước thùng để tạo mockup', 409)

  return {
    request: {
      consultationId: fields.consultationId,
      logo,
      printPosition: fields.printPosition,
      boxStyleId,
      dimsCm,
      layers: recommendation?.layers ?? consultation.ai_suggested_layers ?? 3,
    },
  }
}

function fail(error: string, status: number): MockupRequestError {
  return { error, status }
}

function resolveBoxStyleId(recommendation: AIRecommendation | null): string {
  const id = recommendation?.boxStyleId
  return id && BOX_STYLES.includes(id) ? id : DEFAULT_BOX_STYLE
}

function readDims(
  recommendation: AIRecommendation | null,
  consultation: ConsultationRow,
): ResolvedMockupRequest['dimsCm'] | null {
  const source = recommendation?.outerDimensions ?? consultation.ai_suggested_dimensions
  if (!source) return null
  const { length, width, height } = source
  if (![length, width, height].every((v) => typeof v === 'number' && v > 0)) return null
  return { length, width, height }
}

/**
 * Chống SSRF: logoUrl client gửi lại chỉ được trỏ về storage của chính app.
 * ponytail: allowlist hostname cố định; so khớp CLOUDINARY_CLOUD_NAME /
 * NEXT_PUBLIC_SUPABASE_URL nếu nhiều môi trường dùng chung code này.
 */
function validateAssetUrl(value: string): string | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return 'URL logo không hợp lệ'
  }
  if (url.protocol !== 'https:') return 'URL logo phải là https'
  const host = url.hostname
  const allowed = host.endsWith('.supabase.co') || host === 'res.cloudinary.com'
  return allowed ? null : 'URL logo không thuộc storage được phép'
}
