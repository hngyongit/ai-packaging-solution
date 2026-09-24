/**
 * PayOS client — create payment link, verify webhook checksum.
 * Uses @payos/node SDK for reliable API v2 integration.
 * 
 * Env vars required:
 *   PAYOS_CLIENT_ID     — from PayOS Dashboard
 *   PAYOS_API_KEY       — admin API key
 *   PAYOS_CHECKSUM_KEY  — checksum key for webhook verification
 */

import { PayOS } from '@payos/node'
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

function getPayOS(): PayOS {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim()
  const apiKey = process.env.PAYOS_API_KEY?.trim()
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim()

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error('PAYOS environment variables not set')
  }

  // SDK constructor accepts an options object (not positional args)
  return new PayOS({ clientId, apiKey, checksumKey })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify webhook checksum from PayOS.
 * Signature = HMAC-SHA256(sortedQueryString, checksumKey)
 */
export function verifyWebhookChecksum(payload: PayOSWebhookPayload): boolean {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim()
  if (!checksumKey) return false

  const provided = payload.webhookChecksum
  // Remove the checksum field before signing
  const { webhookChecksum: _, ...rest } = payload
  
  const sorted = Object.entries(rest)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))

  const queryString = sorted.map(([k, v]) => `${k}=${v}`).join('&')
  const computed = createHmac('sha256', checksumKey)
    .update(queryString)
    .digest('hex')

  return computed === provided
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a payment link via PayOS API v2 using official SDK.
 * 
 * SDK handles all signature generation correctly.
 * 
 * Reference: https://docs.payos.vn/
 */
export async function createPaymentLink(
  orderCode: number,
  totalAmount: number,
  description: string,
  returnUrl: string
): Promise<PayOSPaymentResult> {
  // Round to integer (PayOS requires integer amount)
  const roundedAmount = Math.round(totalAmount)

  // Validate inputs
  if (roundedAmount <= 0) {
    throw new Error(`Invalid total amount: ${totalAmount}`)
  }
  if (!returnUrl.startsWith('http')) {
    throw new Error(`Invalid returnUrl: ${returnUrl}. Must start with http(s)://`)
  }
  // PayOS requires description max 25 characters — truncate if needed
  const maxDescLength = 25
  const truncatedDescription = description.length > maxDescLength
    ? description.slice(0, maxDescLength)
    : description

  console.log('[PayOS] Creating payment link via SDK:', {
    orderCode,
    amount: roundedAmount,
    description,
    returnUrl: returnUrl.slice(0, 100),
  })

  const payos = getPayOS()

  try {
    // Use official PayOS SDK v2 method: payos.paymentRequests.create()
    const result = await payos.paymentRequests.create({
      orderCode,
      amount: roundedAmount,
      description: truncatedDescription,
      cancelUrl: returnUrl,
      returnUrl,
    })

    console.log('[PayOS] Payment link created successfully:', {
      paymentLinkId: result.paymentLinkId,
      hasCheckoutUrl: !!result.checkoutUrl,
    })

    return {
      paymentUrl: result.checkoutUrl || '',
      payosPaymentId: result.paymentLinkId || String(orderCode),
    }
  } catch (error: any) {
    console.error('[PayOS] createPaymentLink FAILED:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.response?.data,
      orderId: orderCode,
      amount: roundedAmount,
    })
    throw new Error(
      `PayOS createPaymentLink failed: ${error.message} — ${JSON.stringify(error.response?.data || {})}`
    )
  }
}