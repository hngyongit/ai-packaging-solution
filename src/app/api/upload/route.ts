import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient, createClient } from '@/lib/supabase/server'

type Profile = {
  id: string
  role: 'customer' | 'sales' | 'admin'
}

type UploadPurpose = 'logo' | 'reference' | 'payment-proof' | 'order-file'

type UploadConfig = {
  bucket: 'logos' | 'order-files'
  folder: string
  maxSize: number
  public: boolean
  mimeTypes: Set<string>
  extensions: Set<string>
}

type SupabaseMaybeError = {
  code?: string
} | null

const MB = 1024 * 1024
const IMAGE_MIME_TYPE_VALUES = ['image/jpeg', 'image/png', 'image/webp']
const DESIGN_MIME_TYPE_VALUES = [
  ...IMAGE_MIME_TYPE_VALUES,
  'application/pdf',
  'application/postscript',
  'application/illustrator',
  'application/vnd.adobe.illustrator',
]
const IMAGE_MIME_TYPES = new Set(IMAGE_MIME_TYPE_VALUES)
const DESIGN_MIME_TYPES = new Set(DESIGN_MIME_TYPE_VALUES)

const UPLOAD_CONFIG: Record<UploadPurpose, UploadConfig> = {
  logo: {
    bucket: 'logos',
    folder: 'logos',
    maxSize: 10 * MB,
    public: true,
    mimeTypes: DESIGN_MIME_TYPES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'ai', 'eps']),
  },
  reference: {
    bucket: 'logos',
    folder: 'references',
    maxSize: 10 * MB,
    public: true,
    mimeTypes: DESIGN_MIME_TYPES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'ai', 'eps']),
  },
  'payment-proof': {
    bucket: 'order-files',
    folder: 'payment-proofs',
    maxSize: 5 * MB,
    public: false,
    mimeTypes: IMAGE_MIME_TYPES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
  },
  'order-file': {
    bucket: 'order-files',
    folder: 'artwork',
    maxSize: 10 * MB,
    public: false,
    mimeTypes: DESIGN_MIME_TYPES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'ai', 'eps']),
  },
}

const purposeSchema = z.enum(['logo', 'reference', 'payment-proof', 'order-file'])
const orderScopedPurposes = new Set<UploadPurpose>(['payment-proof', 'order-file'])

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function isStaff(profile: Profile) {
  return profile.role === 'sales' || profile.role === 'admin'
}

function isNotFoundError(error: SupabaseMaybeError) {
  return error?.code === 'PGRST116'
}

function getExtension(filename: string) {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/)
  return match?.[1] ?? ''
}

function getSafeBaseName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, '')
  const normalized = withoutExtension
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 60)

  return normalized || 'upload'
}

function getStoragePath(profile: Profile, purpose: UploadPurpose, filename: string) {
  const config = UPLOAD_CONFIG[purpose]
  const extension = getExtension(filename)
  const safeName = getSafeBaseName(filename)
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`

  return `${config.folder}/${profile.id}/${uniqueName}`
}

async function getAuthenticatedProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const admin = await createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single<Profile>()

  if (profileError || !profile) return null
  return profile
}

async function canUploadForOrder(profile: Profile, orderId: string) {
  const admin = await createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, customer_id')
    .eq('id', orderId)
    .single<{ id: string; customer_id: string }>()

  if (error && !isNotFoundError(error)) throw error
  if (!order) return { allowed: false, status: 404, error: 'Order not found' }
  if (!isStaff(profile) && order.customer_id !== profile.id) {
    return { allowed: false, status: 403, error: 'Forbidden' }
  }

  return { allowed: true, status: 200, error: null }
}

function validateFile(file: File, config: UploadConfig) {
  if (file.size <= 0) return { error: 'File is empty', status: 400 }
  if (file.size > config.maxSize) return { error: 'File is too large', status: 413 }
  if (!config.mimeTypes.has(file.type)) return { error: 'Unsupported file type', status: 415 }

  const extension = getExtension(file.name)
  if (!extension || !config.extensions.has(extension)) {
    return { error: 'Unsupported file extension', status: 415 }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return errorResponse('Content-Type must be multipart/form-data', 400)
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return errorResponse('Missing file', 400)

    const purposeResult = purposeSchema.safeParse(formData.get('purpose') ?? 'order-file')
    if (!purposeResult.success) return errorResponse('Invalid upload purpose', 400)

    const purpose = purposeResult.data
    const config = UPLOAD_CONFIG[purpose]
    const validationError = validateFile(file, config)
    if (validationError) return errorResponse(validationError.error, validationError.status)

    const orderIdValue = formData.get('orderId')
    if (orderScopedPurposes.has(purpose)) {
      const orderId = z.string().uuid().safeParse(orderIdValue)
      if (!orderId.success) return errorResponse('A valid orderId is required for this upload', 400)

      const access = await canUploadForOrder(profile, orderId.data)
      if (!access.allowed) return errorResponse(access.error ?? 'Forbidden', access.status)
    }

    const admin = await createAdminClient()
    const path = getStoragePath(profile, purpose, file.name)
    const { error: uploadError } = await admin.storage.from(config.bucket).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) throw uploadError

    let url: string | null = null
    if (config.public) {
      const { data } = admin.storage.from(config.bucket).getPublicUrl(path)
      url = data.publicUrl
    } else {
      const { data, error: signedUrlError } = await admin.storage
        .from(config.bucket)
        .createSignedUrl(path, 60 * 60)

      if (signedUrlError) throw signedUrlError
      url = data.signedUrl
    }

    return NextResponse.json({
      success: true,
      file: {
        url,
        path,
        bucket: config.bucket,
        name: file.name,
        storedName: path.split('/').pop(),
        type: file.type,
        size: file.size,
        purpose,
        isPublic: config.public,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse('Upload failed', 500)
  }
}
