import { createHash, randomInt } from 'crypto'
import nodemailer, { type Transporter } from 'nodemailer'

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

let transporter: Transporter | null = null

function getTransporter() {
  if (!transporter) {
    const user = process.env.GMAIL_ADDRESS
    const pass = process.env.GMAIL_APP_PASSWORD
    if (!user || !pass) throw new Error('Thiếu GMAIL_ADDRESS / GMAIL_APP_PASSWORD')
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      // 465 = implicit SSL — chọn port này để khỏi lỗi STARTTLS handshake hay gặp
      // ở mạng datacenter (chính là kiểu lỗi đã gây 504 với Supabase SMTP).
      port: 465,
      secure: true,
      auth: { user, pass: pass.replace(/\s+/g, '') },
    })
  }
  return transporter
}

export async function sendOtpEmail(to: string, code: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  await getTransporter().sendMail({
    from: `"AI Carton" <${process.env.GMAIL_ADDRESS}>`,
    to,
    subject: 'Mã xác minh tài khoản AI Carton',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px">AI Carton</h2>
        <p>Bạn vừa đăng ký tài khoản tại <a href="${site}">${site}</a>. Nhập mã này để kích hoạt:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0;text-align:center">${code}</p>
        <p style="color:#666">Mã hết hạn sau ${OTP_TTL_MINUTES} phút. Nếu bạn không đăng ký, bỏ qua email này.</p>
      </div>`,
  })
}
