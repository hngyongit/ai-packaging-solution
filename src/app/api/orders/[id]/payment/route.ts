import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getOutstandingAmount, orderRequiresDeposit } from '@/lib/data/order-payment'

// Xem / đổi phương thức thanh toán của đơn.
// bank_transfer KHÔNG dùng minh chứng tải lên — khách trả qua PayOS
// (/api/orders/[id]/payos/create), webhook xác nhận.

type UserRole = 'customer' | 'sales' | 'admin'
type PaymentMethod = 'cod' | 'bank_transfer'

type Profile = { id: string; role: UserRole }

type PaymentOrder = {
  id: string
  order_code: string
  customer_id: string
  status: string
  total_amount: number | string | null
  deposit_amount: number | string | null
  payment_method: PaymentMethod | null
  payment_status: string | null
  contact_phone: string | null
  updated_at: string
}

const PAYMENT_SELECT = `
  id, order_code, customer_id, status, total_amount, deposit_amount,
  payment_method, payment_status, contact_phone, updated_at
`

// Đổi phương thức chỉ khi đơn chưa thu đồng nào và chưa vào sản xuất.
const EDITABLE_STATUSES = ['pending', 'staff_review', 'confirmed', 'deposit_paid']

const paymentSchema = z.object({
  paymentMethod: z.enum(['cod', 'bank_transfer']),
})

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function isStaff(profile: Profile) {
  return profile.role === 'sales' || profile.role === 'admin'
}

function getPaymentDetails(order: PaymentOrder) {
  return {
    orderId: order.id,
    orderCode: order.order_code,
    orderStatus: order.status,
    paymentMethod: order.payment_method ?? 'cod',
    paymentStatus: order.payment_status ?? 'unpaid',
    totalAmount: Number(order.total_amount ?? 0),
    depositAmount: Number(order.deposit_amount ?? 0),
    requiresDeposit: orderRequiresDeposit(order),
    outstandingAmount: getOutstandingAmount(order),
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
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single<Profile>()
  if (error || !profile) return null
  return profile
}

async function getOrder(id: string) {
  const admin = await createAdminClient()
  return admin.from('orders').select(PAYMENT_SELECT).eq('id', id).single<PaymentOrder>()
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return errorResponse('Invalid order id', 400)

    const profile = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const { data: order, error } = await getOrder(id.data)
    if (error?.code === 'PGRST116' || !order) return errorResponse('Order not found', 404)
    if (!isStaff(profile) && order.customer_id !== profile.id) return errorResponse('Forbidden', 403)

    return NextResponse.json({ data: getPaymentDetails(order) })
  } catch (error) {
    console.error('Order payment GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return errorResponse('Invalid order id', 400)

    const profile = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const parsed = paymentSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid payment details', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data: order, error } = await getOrder(id.data)
    if (error?.code === 'PGRST116' || !order) return errorResponse('Order not found', 404)
    if (order.customer_id !== profile.id) return errorResponse('Forbidden', 403)

    if (order.payment_status === 'paid' || order.payment_status === 'deposit_paid') {
      return errorResponse('Đơn đã ghi nhận thanh toán, không đổi được phương thức', 409)
    }
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return errorResponse('Order is not editable in its current status', 409)
    }

    const admin = await createAdminClient()
    const { data: updatedOrder, error: updateError } = await admin
      .from('orders')
      .update({
        payment_method: parsed.data.paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('status', order.status)
      .select(PAYMENT_SELECT)
      .single<PaymentOrder>()

    if (updateError) {
      if (updateError.code === 'PGRST116') return errorResponse('Payment state changed; retry request', 409)
      throw updateError
    }

    return NextResponse.json({
      data: {
        ...getPaymentDetails(updatedOrder),
        message:
          parsed.data.paymentMethod === 'cod'
            ? 'Đã chọn COD. Đơn vị vận chuyển thu hộ khi giao hàng.'
            : 'Đã chọn chuyển khoản. Thanh toán qua PayOS ở trang đơn hàng.',
      },
    })
  } catch (error) {
    console.error('Order payment POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
