import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Use admin client with service role key to bypass RLS
const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
})

/**
 * Handle PayOS payment webhook
 * 
 * PayOS sends nested format:
 * {
 *   code: "00",
 *   desc: "Thành công",
 *   data: { orderCode, amount, description, transactionId, ... },
 *   signature: hmacsha256(secretKey, flat_query_string)
 * }
 * 
 * Signature is computed over FLATTENED fields (outer + inner merged), NOT nested JSON.
 */
export async function handlePayOSWebhook(body: Record<string, any>, rawBody?: string) {
  console.log('[PayOS Webhook] 📥 Received callback')
  console.log('[PayOS Webhook] Body keys:', Object.keys(body))
  
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || ''
  if (!checksumKey) {
    console.error('[PayOS Webhook] ❌ PAYOS_CHECKSUM_KEY not configured')
    return NextResponse.json({ status: 'Failure', message: 'Server configuration error' }, { status: 500 })
  }
  
  // Extract signature and data
  const signature = body.signature || ''
  let payload: any = body.data || body
  
  console.log('[PayOS Webhook] Payload type:', typeof payload)
  console.log('[PayOS Webhook] Payload keys:', Object.keys(payload || {}))
  
  // Build query string for verification (exclude signature/webhookChecksum/success)
  // PayOS computes signature over FLATTENED fields inside data object ONLY
  let flatBody: Record<string, any> = {}
  if (body.data && typeof body.data === 'object') {
    // Use only the data object fields for signature
    flatBody = { ...body.data }
  } else {
    const { signature: _, webhookChecksum: __, success: ___, ...rest } = body
    flatBody = rest
  }
  
  const sorted = Object.entries(flatBody)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
  const queryString = sorted.map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join('&')
  console.log('[PayOS Webhook] 🔐 Query string for signature:', queryString)
  const computed = createHmac('sha256', checksumKey)
    .update(queryString)
    .digest('hex')
  
  if (computed !== signature) {
    console.error('[PayOS Webhook] ❌ Checksum verification failed')
    console.error('[PayOS Webhook] Expected:', computed)
    console.error('[PayOS Webhook] Got:', signature)
    console.error('[PayOS Webhook] Query string:', queryString)
    console.error('[PayOS Webhook] Raw body:', rawBody)
    return NextResponse.json({ status: 'Failure', message: 'Invalid checksum' }, { status: 400 })
  }
  
  console.log('[PayOS Webhook] ✅ Checksum verified successfully')
  
  // Extract payment info from payload
  const { orderCode, amount, description, transactionId, status, payChargeUrl, cancelAmount, paymentLinkId } = payload
  
  console.log('[PayOS Webhook] Payment details:', { orderCode, amount, status, description })
  
  // Find order by payos_payment_id, payos_order_code, or order_code substring
  let orderData: any = null
  let orderError: any = null
  
  // Strategy 1: Try payos_payment_id first (most reliable - matches paymentLinkId from PayOS)
  if (paymentLinkId) {
    console.log('[PayOS Webhook] 🔍 Looking up by payos_payment_id:', paymentLinkId)
    const result = await supabase
      .from('orders')
      .select('*')
      .eq('payos_payment_id', paymentLinkId)
      .maybeSingle()
    
    orderData = result.data
    orderError = result.error
    
    if (orderError) {
      console.error('[PayOS Webhook] ❌ Error looking up by payos_payment_id:', orderError)
    } else if (orderData) {
      console.log('[PayOS Webhook] ✅ Found order by payos_payment_id:', orderData.id)
    }
  }
  
  // Strategy 2: Try payos_order_code (requires migration to be run)
  if (!orderData && orderCode) {
    console.log('[PayOS Webhook] 🔍 Looking up by payos_order_code:', orderCode)
    const result = await supabase
      .from('orders')
      .select('*')
      .eq('payos_order_code', orderCode)
      .maybeSingle()
    
    orderData = result.data
    orderError = result.error
    
    if (orderError) {
      console.error('[PayOS Webhook] ❌ Error looking up by payos_order_code:', orderError)
    } else if (orderData) {
      console.log('[PayOS Webhook] ✅ Found order by payos_order_code:', orderData.id)
    }
  }
  
  // Strategy 3: Try transactionId fallback
  if (!orderData && transactionId) {
    console.log('[PayOS Webhook] 🔍 Looking up by payos_payment_id (transactionId):', transactionId)
    const result = await supabase
      .from('orders')
      .select('*')
      .eq('payos_payment_id', transactionId)
      .maybeSingle()
    
    orderData = result.data
    orderError = result.error
    
    if (orderError) {
      console.error('[PayOS Webhook] ❌ Error looking up by payos_payment_id:', orderError)
    } else if (orderData) {
      console.log('[PayOS Webhook] ✅ Found order by payos_payment_id:', orderData.id)
    }
  }
  
  // Strategy 3: Try order_code as substring fallback
  if (!orderData && description) {
    console.log('[PayOS Webhook] 🔍 Looking up by order_code in description:', description)
    const result = await supabase
      .from('orders')
      .select('*')
      .ilike('order_code', `%${description}%`)
      .maybeSingle()
    
    orderData = result.data
    orderError = result.error
    
    if (orderError) {
      console.error('[PayOS Webhook] ❌ Error looking up by order_code:', orderError)
    } else if (orderData) {
      console.log('[PayOS Webhook] ✅ Found order by order_code:', orderData.id)
    }
  }
  
  if (!orderData) {
    console.warn('[PayOS Webhook] ⚠️ Order not found for payment:', { orderCode, transactionId, description })
    return NextResponse.json({ 
      status: 'Success', 
      message: 'Order not found, will retry',
      data: { orderCode }
    }, { status: 200 })
  }
  
  const orderId = orderData.id
  const currentStatus = orderData.status
  
  console.log('[PayOS Webhook] 💾 Updating order', orderId, 'from', currentStatus, 'to', status)
  
  // Update order status based on PayOS status
  let newStatus: string = currentStatus
  
  if (status === 'paid' || status === 'completed') {
    newStatus = 'confirmed'
  } else if (status === 'pending') {
    newStatus = 'pending'
  } else if (status === 'cancelled' || status === 'failed') {
    newStatus = 'cancelled'
  }
  
  // Update the order
  const updateResult = await supabase
    .from('orders')
    .update({
      status: newStatus,
      payos_order_code: orderCode,
      payos_payment_id: transactionId,
      payos_transaction_id: transactionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
  
  if (updateResult.error) {
    console.error('[PayOS Webhook] ❌ Failed to update order status:', updateResult.error)
    return NextResponse.json({ status: 'Failure', message: 'Failed to update order' }, { status: 500 })
  }
  
  console.log('[PayOS Webhook] ✅ Order', orderId, 'updated to status:', newStatus)
  
  // Auto-transition: confirmed → production after successful payment
  if (newStatus === 'confirmed') {
    console.log('[PayOS Webhook] 🔄 Auto-transitioning order', orderId, 'from confirmed to production')
    const transitionResult = await supabase
      .from('orders')
      .update({
        status: 'production',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (transitionResult.error) {
      console.error('[PayOS Webhook] ❌ Failed to auto-transition order:', transitionResult.error)
    } else {
      console.log('[PayOS Webhook] ✅ Order', orderId, 'auto-transitioned to production')
    }
  }
  
  return NextResponse.json({ 
    status: 'Success', 
    message: 'Payment processed successfully',
    data: { 
      orderCode, 
      orderId, 
      status: newStatus,
      transactionId 
    }
  }, { status: 200 })
}
