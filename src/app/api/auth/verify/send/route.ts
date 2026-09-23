import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { hashOtp, newOtpCode, otpPolicy, sendOtpEmail } from '@/lib/mail/otp'

// Gửi (hoặc gửi lại) OTP xác minh email cho user ĐANG ĐĂNG NHẬP.
// Supabase autoconfirm BẬT → GoTrue không tự gửi mail; luồng này thay thế.

const bodySchema = z.object({ email: z.string().email() })

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // Không tồn tại session khác chủ email → chống spam hộp thư người khác.
  if (!user || user.email?.toLowerCase() !== parsed.data.email.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()

  const { data: existing } = await admin
    .from('email_verifications')
    .select('created_at')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    const ageSeconds = (Date.now() - new Date(existing.created_at).getTime()) / 1000
    if (ageSeconds < otpPolicy.RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Vui lòng đợi ${Math.ceil(otpPolicy.RESEND_COOLDOWN_SECONDS - ageSeconds)} giây trước khi gửi lại` },
        { status: 429 },
      )
    }
  }

  const code = newOtpCode()
  const { error: upsertError } = await admin.from('email_verifications').upsert(
    {
      user_id: user.id,
      code_hash: hashOtp(user.id, code),
      expires_at: new Date(Date.now() + otpPolicy.OTP_TTL_MINUTES * 60_000).toISOString(),
      attempts: 0,
      verified_at: null,
    },
    { onConflict: 'user_id' },
  )
  if (upsertError) {
    console.error('OTP upsert failed:', upsertError.message)
    return NextResponse.json({ error: 'Không thể chuẩn bị mã xác minh' }, { status: 500 })
  }

  try {
    await sendOtpEmail(user.email, code)
  } catch (sendError) {
    console.error('OTP email failed:', sendError instanceof Error ? sendError.message : sendError)
    await admin.from('email_verifications').delete().eq('user_id', user.id)
    return NextResponse.json({ error: 'Không gửi được email. Thử lại sau ít phút.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, ttl_minutes: otpPolicy.OTP_TTL_MINUTES })
}
