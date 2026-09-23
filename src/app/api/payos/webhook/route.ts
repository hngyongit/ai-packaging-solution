/**
 * POST /api/payos/webhook
 * PayOS callback handler — verify checksum, update order payment status.
 * Public endpoint (no auth required, called from PayOS servers).
 */

import { NextRequest, NextResponse } from 'next/server'
import { handlePayOSWebhook } from '@/lib/payos/webhook'

export async function POST(req: NextRequest) {
  return await handlePayOSWebhook(req)
}
