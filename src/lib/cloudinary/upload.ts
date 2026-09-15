import { createHmac } from 'node:crypto'

// Upload ký chữ ký phía server (server-only). Không đọc env lúc module-load để
// import được trong test; thiếu cấu hình → ném lỗi rõ ràng cho route dịch ra 500.
export class CloudinaryNotConfigured extends Error {
  constructor() {
    super('Cloudinary is not configured')
    this.name = 'CloudinaryNotConfigured'
  }
}

function credentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new CloudinaryNotConfigured()
  return { cloudName, apiKey, apiSecret }
}

export type UploadInput = {
  body: Buffer | string
  folder: string
  filename: string
}

/**
 * Upload lên Cloudinary, một trong hai chế độ:
 * - Đặt CLOUDINARY_UPLOAD_PRESET (preset unsigned, folder ép trong preset) → gửi preset, không ký.
 * - Không đặt → signed upload: HMAC-SHA1 trên `folder/public_id/timestamp` đã sort.
 *   (Tài khoản mới của Cloudinary có thể từ chối chữ ký v1 dù basic auth hợp lệ —
 *   khi đó tạo preset unsigned trong console là đường an toàn.)
 */
export async function uploadToCloudinary(input: UploadInput): Promise<{ secureUrl: string; publicId: string }> {
  const { cloudName, apiKey, apiSecret } = credentials()
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET

  const form = new FormData()
  const blob = typeof input.body === 'string' ? new Blob([input.body]) : new Blob([new Uint8Array(input.body)])
  form.append('file', blob, input.filename)
  form.append('api_key', apiKey)
  if (preset) {
    // Unsigned chỉ được gửi nhóm param cho phép (public_id/overwrite bị cấm →
    // Cloudinary tự sinh public_id, lấy từ response). Folder vẫn gửi được.
    form.append('upload_preset', preset)
    form.append('folder', input.folder)
  } else {
    const publicId = `${input.folder}/${input.filename}`
    const timestamp = Math.floor(Date.now() / 1000)
    const toSign = [`folder=${input.folder}`, `public_id=${publicId}`, `timestamp=${timestamp}`].sort().join('&')
    form.append('timestamp', String(timestamp))
    form.append('signature', createHmac('sha1', apiSecret).update(toSign).digest('hex'))
    form.append('folder', input.folder)
    form.append('public_id', publicId)
    form.append('overwrite', 'true')
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60_000),
  })
  const json = (await response.json().catch(() => null)) as {
    secure_url?: string
    public_id?: string
    error?: { message?: string }
  } | null
  if (!response.ok || !json?.secure_url) {
    throw new Error(`Cloudinary upload failed: ${json?.error?.message ?? `HTTP ${response.status}`}`)
  }
  return { secureUrl: json.secure_url, publicId: json.public_id ?? '' }
}
