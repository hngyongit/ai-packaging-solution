import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ORDER_STATUS_LABELS } from '@/lib/config/constants'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type OrderStatus = keyof typeof ORDER_STATUS_LABELS
type UserRole = 'customer' | 'sales' | 'admin'

type Profile = {
  id: string
  role: UserRole
}

type OrderStatusRow = {
  id: string
  customer_id: string
  status: OrderStatus
  updated_at: string
}

type SupabaseMaybeError = {
  code?: string
} | null

const orderStatusSchema = z.enum(
  Object.keys(ORDER_STATUS_LABELS) as [OrderStatus, ...OrderStatus[]]
)

const patchStatusSchema = z.object({
  status: orderStatusSchema,
  notes: z.string().trim().max(1000).optional(),
})

const STAFF_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['staff_review', 'cancelled'],
  staff_review: ['confirmed', 'cancelled'],
  confirmed: ['deposit_paid', 'production', 'cancelled'],
  deposit_paid: ['production', 'cancelled'],
  production: ['completed', 'cancelled'],
  completed: ['delivered'],
  delivered: [],
  cancelled: [],
}

const CUSTOMER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['cancelled'],
  staff_review: [],
  confirmed: [],
  deposit_paid: [],
  production: [],
  completed: [],
  delivered: [],
  cancelled: [],
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function isStaff(profile: Profile) {
  return profile.role === 'sales' || profile.role === 'admin'
}

function isNotFoundError(error: SupabaseMaybeError) {
  return error?.code === 'PGRST116'
}

function getAllowedTransitions(profile: Profile, currentStatus: OrderStatus) {
  return isStaff(profile)
    ? STAFF_TRANSITIONS[currentStatus]
    : CUSTOMER_TRANSITIONS[currentStatus]
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
  return admin
    .from('orders')
    .select('id, customer_id, status, updated_at')
    .eq('id', id)
    .single<OrderStatusRow>()
}

function canViewOrder(profile: Profile, order: OrderStatusRow) {
  return isStaff(profile) || order.customer_id === profile.id
}

function getStatusMetadata(profile: Profile, order: OrderStatusRow) {
  const allowedTransitions = getAllowedTransitions(profile, order.status)

  return {
    status: order.status,
    label: ORDER_STATUS_LABELS[order.status],
    updatedAt: order.updated_at,
    allowedStatuses: Object.keys(ORDER_STATUS_LABELS),
    allowedTransitions,
    canUpdate: allowedTransitions.length > 0,
  }
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
    if (!canViewOrder(profile, order)) return errorResponse('Forbidden', 403)

    const admin = await createAdminClient()
    const { data: history, error: historyError } = await admin
      .from('order_status_history')
      .select('id, from_status, to_status, changed_by, notes, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })
    if (historyError) throw historyError

    return NextResponse.json({
      data: {
        orderId: order.id,
        ...getStatusMetadata(profile, order),
        history: history ?? [],
      },
    })
  } catch (error) {
    console.error('Order status GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = z.string().uuid().safeParse(params.id)
    if (!id.success) return errorResponse('Invalid order id', 400)

    const profile = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const json = await request.json().catch(() => null)
    const parsed = patchStatusSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid status', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await getOrder(id.data)
    if (orderError && !isNotFoundError(orderError)) throw orderError
    if (!order) return errorResponse('Order not found', 404)
    if (!canViewOrder(profile, order)) return errorResponse('Forbidden', 403)

    const nextStatus = parsed.data.status
    if (nextStatus === order.status) {
      return NextResponse.json({
        data: {
          orderId: order.id,
          ...getStatusMetadata(profile, order),
        },
      })
    }

    const allowedTransitions = getAllowedTransitions(profile, order.status)
    if (!allowedTransitions.includes(nextStatus)) {
      if (!isStaff(profile) && STAFF_TRANSITIONS[order.status].includes(nextStatus)) {
        return errorResponse('Forbidden', 403)
      }
      const statusCode = allowedTransitions.length === 0 ? 409 : 400
      return errorResponse('Invalid status transition', statusCode)
    }

    const admin = await createAdminClient()
    const { data: updatedOrder, error: updateError } = await admin
      .from('orders')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('status', order.status)
      .select('id, customer_id, status, updated_at')
      .single<OrderStatusRow>()

    if (updateError) {
      if (isNotFoundError(updateError)) return errorResponse('Order status changed; retry update', 409)
      throw updateError
    }

    const { error: historyError } = await admin.from('order_status_history').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: nextStatus,
      changed_by: profile.id,
      notes: parsed.data.notes ?? null,
    })
    if (historyError) throw historyError

    return NextResponse.json({
      data: {
        orderId: updatedOrder.id,
        ...getStatusMetadata(profile, updatedOrder),
      },
    })
  } catch (error) {
    console.error('Order status PATCH error:', error)
    return errorResponse('Internal server error', 500)
  }
}
