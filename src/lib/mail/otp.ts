import { createHash, randomInt } from 'crypto'

import { getMailFrom, getMailTransporter, getSiteUrl, mailLayout } from './transport'

// OTP xác minh email tự gửi qua Gmail SMTP thường (App Password) — thay cho
// Supabase Confirm email vì built-in SMTP của Supabase không gửi được cho khách lạ.
// Supabase dashboard phải BẬT autoconfirm để /signup không gọi SMTP nữa.

const OTP_TTL_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS = 5

export function newOtpCode() {
  // 6 chữ số, phân phối đều (randomInt loại bias của modulo).
  return randomInt(100000, 1000000).toString()
}

export function hashOtp(userId: string, code: string) {
  return createHash('sha256').update(`${userId}:${code}`).digest('hex')
}

export const otpPolicy = { OTP_TTL_MINUTES, RESEND_COOLDOWN_SECONDS, MAX_ATTEMPTS }

export async function sendOtpEmail(to: string, code: string) {
  const site = getSiteUrl()
  await getMailTransporter().sendMail({
    from: getMailFrom(),
    to,
    subject: 'Mã xác minh tài khoản AI Carton',
    html: mailLayout(`
      <p>Bạn vừa đăng ký tài khoản tại <a href="${site}">${site}</a>. Nhập mã này để kích hoạt:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0;text-align:center">${code}</p>
      <p style="color:#666">Mã hết hạn sau ${OTP_TTL_MINUTES} phút. Nếu bạn không đăng ký, bỏ qua email này.</p>
    `),
  })
}
