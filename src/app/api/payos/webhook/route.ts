/**
 * POST /api/payos/webhook
 * PayOS callback handler — verify checksum, update order payment status.
 * Public endpoint (no auth required, called from PayOS servers).
 */

import { NextRequest, NextResponse } from 'next/server'
import { handlePayOSWebhook } from '@/lib/payos/webhook'

export async function POST(req: NextRequest) {
  // Get raw body for signature verification (PayOS computes HMAC over raw POST body)
  const rawBody = await req.text()
  
  // Parse body based on content type
  const contentType = req.headers.get('content-type') || ''
  let body: Record<string, any>
  
  try {
    if (contentType.includes('application/json')) {
      body = JSON.parse(rawBody)
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse form-urlencoded to object
      body = Object.fromEntries(new URLSearchParams(rawBody))
    } else {
      // Default: try JSON first, then form-urlencoded
      try {
        body = JSON.parse(rawBody)
      } catch {
        body = Object.fromEntries(new URLSearchParams(rawBody))
      }
    }
    
    console.log('[PayOS Webhook] 📥 Raw body:', rawBody)
    console.log('[PayOS Webhook] 📥 Parsed body:', JSON.stringify(body, null, 2))
    console.log('[PayOS Webhook] Body keys:', Object.keys(body))
    
    return await handlePayOSWebhook(body, rawBody)
  } catch (error) {
    console.error('[PayOS Webhook] ❌ Error parsing request:', error)
    return NextResponse.json({ status: 'Failure', message: 'Invalid request body' }, { status: 400 })
  }
}
