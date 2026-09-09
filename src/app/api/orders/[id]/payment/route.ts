import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ORDER_STATUS_LABELS } from '@/lib/config/constants'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type UserRole = 'customer' | 'sales' | 'admin'
type PaymentMethod = 'cod' | 'bank_transfer'
type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid'
type OrderStatus = keyof typeof ORDER_STATUS_LABELS

type Profile = {
  id: string
  role: UserRole
}

type PaymentOrder = {
  id: string
  order_code: string
  customer_id: string
  status: OrderStatus
  total_amount: number | string | null
  deposit_amount: number | string | null
  deposit_threshold: number | string | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus | null
  payment_proof_url: string | null
  contact_phone: string | null
  updated_at: string
}

type SupabaseMaybeError = {
  code?: string
} | null

const PAYABLE_ORDER_STATUSES: OrderStatus[] = ['pending', 'staff_review', 'confirmed']
const PAYMENT_SELECT = `
  id,
  order_code,
  customer_id,
  status,
  total_amount,
  deposit_amount,
  deposit_threshold,
  payment_method,
  payment_status,
  payment_proof_url,
  contact_phone,
  updated_at
`

const BANK_TRANSFER_DETAILS = {
  bankName: 'Vietcombank',
  accountNumber: '0123 456 789',
  accountName: 'CONG TY TNHH BAO BI ABC',
}

const paymentSchema = z
  .object({
    paymentMethod: z.enum(['cod', 'bank_transfer']),
    paymentProofUrl: z.string().trim().url().optional(),
  })
  .superRefine((value, context) => {
    if (value.paymentMethod === 'bank_transfer' && !value.paymentProofUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentProofUrl'],
        message: 'Payment proof URL is required for bank transfer',
      })
    }
  })

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function isStaff(profile: Profile) {
  return profile.role === 'sales' || profile.role === 'admin'
}

function isNotFoundError(error: SupabaseMaybeError) {
  return error?.code === 'PGRST116'
}

function toMoney(value: number | string | null) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function getPayableAmount(order: PaymentOrder) {
  const totalAmount = toMoney(order.total_amount)
  const depositAmount = toMoney(order.deposit_amount)
  const depositThreshold = toMoney(order.deposit_threshold)

  if (depositAmount > 0 && totalAmount >= depositThreshold) return depositAmount
  return totalAmount
}

function getTransferReference(order: PaymentOrder) {
  return `${order.order_code}${order.contact_phone ? ` - ${order.contact_phone}` : ''}`
}

function getPaymentDetails(order: PaymentOrder) {
  const payableAmount = getPayableAmount(order)
  const paymentMethod = order.payment_method ?? 'cod'
  const paymentStatus = order.payment_status ?? 'unpaid'
  const isBankTransfer = paymentMethod === 'bank_transfer'

  return {
    orderId: order.id,
    orderCode: order.order_code,
    orderStatus: order.status,
    paymentMethod,
    paymentStatus,
    totalAmount: toMoney(order.total_amount),
    depositAmount: toMoney(order.deposit_amount),
    payableAmount,
    paymentProofUrl: order.payment_proof_url,
    requiresStaffVerification: isBankTransfer && Boolean(order.payment_proof_url),
    isPayable: paymentStatus === 'unpaid' && PAYABLE_ORDER_STATUSES.includes(order.status),
    bankTransfer:
      isBankTransfer || paymentStatus === 'unpaid'
        ? {
            ...BANK_TRANSFER_DETAILS,
            amount: payableAmount,
            transferReference: getTransferReference(order),
          }
        : null,
    updatedAt: order.updated_at,
  }
}

async function getAuthenticatedProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const admin = await createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single<Profile>()

  if (profileError || !profile) return null
  return profile
}

async function getOrder(id: string) {
  const admin = await createAdminClient()
  return admin.from('orders').select(PAYMENT_SELECT).eq('id', id).single<PaymentOrder>()
}

function canViewPayment(profile: Profile, order: PaymentOrder) {
  return isStaff(profile) || order.customer_id === profile.id
}

function canSubmitPayment(profile: Profile, order: PaymentOrder) {
  return order.customer_id === profile.id
}

function getNonPayableReason(order: PaymentOrder) {
  if (order.payment_status === 'paid' || order.payment_status === 'deposit_paid') {
    return 'Order already has a recorded payment'
  }

  if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
    return 'Order is not payable in its current status'
  }

  if (order.payment_method === 'bank_transfer' && order.payment_proof_url) {
    return 'Payment proof already submitted'
  }

  return null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return errorResponse('Invalid order id', 400)

    const profile = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const { data: order, error: orderError } = await getOrder(id.data)
    if (orderError && !isNotFoundError(orderError)) throw orderError
    if (!order) return errorResponse('Order not found', 404)
    if (!canViewPayment(profile, order)) return errorResponse('Forbidden', 403)

    return NextResponse.json({ data: getPaymentDetails(order) })
  } catch (error) {
    console.error('Order payment GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return errorResponse('Invalid order id', 400)

    const profile = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const json = await request.json().catch(() => null)
    const parsed = paymentSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid payment details', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await getOrder(id.data)
    if (orderError && !isNotFoundError(orderError)) throw orderError
    if (!order) return errorResponse('Order not found', 404)
    if (!canSubmitPayment(profile, order)) return errorResponse('Forbidden', 403)

    const nonPayableReason = getNonPayableReason(order)
    if (nonPayableReason) return errorResponse(nonPayableReason, 409)

    const admin = await createAdminClient()
    const paymentMethod = parsed.data.paymentMethod
    const paymentProofUrl =
      paymentMethod === 'bank_transfer' ? parsed.data.paymentProofUrl ?? null : null

    let updateQuery = admin
      .from('orders')
      .update({
        payment_method: paymentMethod,
        payment_proof_url: paymentProofUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('status', order.status)
      .select(PAYMENT_SELECT)

    updateQuery = order.payment_status
      ? updateQuery.eq('payment_status', order.payment_status)
      : updateQuery.is('payment_status', null)

    updateQuery = order.payment_proof_url
      ? updateQuery.eq('payment_proof_url', order.payment_proof_url)
      : updateQuery.is('payment_proof_url', null)

    const { data: updatedOrder, error: updateError } = await updateQuery.single<PaymentOrder>()

    if (updateError) {
      if (isNotFoundError(updateError)) return errorResponse('Payment state changed; retry request', 409)
      throw updateError
    }

    return NextResponse.json({
      data: {
        ...getPaymentDetails(updatedOrder),
        message:
          paymentMethod === 'cod'
            ? 'COD selected. Payment will be collected on delivery.'
            : 'Payment proof submitted. Staff verification is required before payment is marked paid.',
      },
    })
  } catch (error) {
    console.error('Order payment POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
