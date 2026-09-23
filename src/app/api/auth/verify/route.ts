import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { hashOtp, otpPolicy } from '@/lib/mail/otp'

// Xác minh OTP: so mã (hash, không so chuỗi thô), đúng thì đánh dấu verified
// và đồng bộ email_confirmed_at của auth.users cho sạch dữ liệu về sau.

const bodySchema = z.object({ code: z.string().regex(/^\d{6}$/) })

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Mã phải gồm 6 chữ số' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: record } = await admin
    .from('email_verifications')
    .select('code_hash, expires_at, attempts, verified_at')
    .eq('user_id', user.id)
    .single()

  const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status })

  if (!record) return fail('Chưa có mã xác minh. Hãy gửi mã mới.')
  if (record.verified_at) return NextResponse.json({ ok: true, already: true })
  if (new Date(record.expires_at).getTime() < Date.now()) return fail('Mã đã hết hạn. Hãy gửi mã mới.')
  if (record.attempts >= otpPolicy.MAX_ATTEMPTS) return fail('Nhập sai quá nhiều lần. Hãy gửi mã mới.', 429)

  if (record.code_hash !== hashOtp(user.id, parsed.data.code)) {
    await admin
      .from('email_verifications')
      .update({ attempts: record.attempts + 1 })
      .eq('user_id', user.id)
    return fail('Mã không đúng.')
  }

  await admin
    .from('email_verifications')
    .update({ verified_at: new Date().toISOString(), attempts: 0 })
    .eq('user_id', user.id)
  // Autoconfirm đã đặt flag này true từ lúc signup; gọi lại để chủ đích đúng nghĩa.
  await admin.auth.admin.updateUserById(user.id, { email_confirm: true })

  return NextResponse.json({ ok: true })
}
