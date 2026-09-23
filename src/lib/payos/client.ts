/**
 * PayOS client — create payment link, verify webhook checksum.
 * Uses Node.js native 'crypto' module (no external dependencies).
 * 
 * Env vars required:
 *   PAYOS_CLIENT_ID     — from PayOS Dashboard
 *   PAYOS_API_KEY       — admin API key
 *   PAYOS_CHECKSUM_KEY  — checksum key for webhook verification
 */

import { createHmac } from 'node:crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PayOSPaymentResult {
  paymentUrl: string
  payosPaymentId: string
}

export interface PayOSWebhookPayload {
  transactionId: string
  orderCode: number
  amount: number
  description: string
  discountAmount?: number
  channel: string
  accountName?: string
  email?: string
  createdAt: string
  updatedAt: string
  status: 'cancelled' | 'paid'
  webhookChecksum: string
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getClientId(): string {
  const v = process.env.PAYOS_CLIENT_ID
  if (!v) throw new Error('PAYOS_CLIENT_ID is not set')
  return v
}

function getApiKey(): string {
  const v = process.env.PAYOS_API_KEY
  if (!v) throw new Error('PAYOS_API_KEY is not set')
  return v
}

function getChecksumKey(): string {
  const v = process.env.PAYOS_CHECKSUM_KEY
  if (!v) throw new Error('PAYOS_CHECKSUM_KEY is not set')
  return v
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate HMAC-SHA256 signature for PayOS API request.
 * Signature = HMAC-SHA256(sortedQueryString, checksumKey)
 */
function signBody(body: Record<string, string | number | boolean | null>): string {
  const sorted = Object.entries(body)
    .filter(([, v]) => v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  
  const queryString = sorted.map(([k, v]) => `${k}=${v}`).join('&')
  return createHmac('sha256', getChecksumKey())
    .update(queryString)
    .digest('hex')
}

/**
 * Verify webhook checksum from PayOS.
 * Payload must contain webhookChecksum field.
 */
export function verifyWebhookChecksum(payload: PayOSWebhookPayload): boolean {
  const provided = payload.webhookChecksum
  // Remove the checksum field before signing
  const { webhookChecksum: _, ...rest } = payload
  const computed = signBody(rest as Record<string, string | number | boolean | null>)
  return computed === provided
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a payment link via PayOS API v2.
 *
 * PayOS expects:
 *   Headers: X-ClientId, X-API-Key, X-Paysignature (HMAC-SHA256 of request body)
 *   Body: only business fields (orderCode, amount, description, cancelUrl, returnUrl)
 *
 * Reference: https://docs.payos.vn/api-and-operation/creating-payment-request
 */
export async function createPaymentLink(
  orderCode: number,
  totalAmount: number,
  description: string,
  returnUrl: string
): Promise<PayOSPaymentResult> {
  const baseUrl = 'https://api-merchant.payos.vn/v2/payment-requests'

  // Build the exact body that PayOS expects — NO clientId, apiKey, or checksum here
  const requestBody = JSON.stringify({
    orderCode,
    amount: Math.round(totalAmount),
    description,
    cancelUrl: returnUrl,
    returnUrl,
  })

  // Generate HMAC-SHA256 signature of the raw request body
  const checksum = createHmac('sha256', getChecksumKey())
    .update(requestBody)
    .digest('hex')

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ClientId': getClientId(),
      'X-API-Key': getApiKey(),
      'X-Paysignature': checksum,
    },
    body: requestBody,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    let err: { message?: string; code?: string } = { message: errText }
    try {
      err = JSON.parse(errText)
    } catch {}
    throw new Error(`PayOS createPaymentLink failed (${res.status}): ${err.message || err.code || res.statusText} — ${errText.slice(0, 200)}`)
  }

  const result = await res.json() as {
    success: boolean
    data?: { transactionId: string; paymentUrl: string }
    message?: string
  }

  if (!result.success || !result.data?.paymentUrl) {
    throw new Error(`PayOS returned error: ${result.message || 'no paymentUrl'}`)
  }

  return {
    paymentUrl: result.data.paymentUrl,
    payosPaymentId: result.data.transactionId ?? String(orderCode),
  }
}
