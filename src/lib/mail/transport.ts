import nodemailer, { type Transporter } from 'nodemailer'

// Gmail SMTP thường (App Password) — dùng chung cho OTP và thông báo đơn hàng.
// Port 465 (implicit SSL) để khỏi lỗi STARTTLS handshake hay gặp ở mạng datacenter.

let transporter: Transporter | null = null

export function getMailTransporter(): Transporter {
  if (!transporter) {
    const user = process.env.GMAIL_ADDRESS
    const pass = process.env.GMAIL_APP_PASSWORD
    if (!user || !pass) throw new Error('Thiếu GMAIL_ADDRESS / GMAIL_APP_PASSWORD')
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: pass.replace(/\s+/g, '') },
    })
  }
  return transporter
}

export function getMailFrom() {
  return `"AI Carton" <${process.env.GMAIL_ADDRESS}>`
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

/** Khung HTML dùng chung để mọi mail trông cùng một hệ. */
export function mailLayout(bodyHtml: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 16px">AI Carton</h2>
      ${bodyHtml}
    </div>`
}
