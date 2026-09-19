import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ORDER_STATUS_LABELS } from '@/lib/config/constants'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import {
  getOrderHistory,
  getOrderStatusRow,
  getStatusMetadata,
  isStaffRole,
  StatusError,
  transitionOrderStatus,
  validateTransition,
  type OrderStatus,
} from '@/lib/data/orders-status'

// Máy trạng thái đơn — logic nằm ở lib/data/orders-status, route chỉ HTTP.

const orderStatusSchema = z.enum(Object.keys(ORDER_STATUS_LABELS) as [OrderStatus, ...OrderStatus[]])
const patchStatusSchema = z.object({
  status: orderStatusSchema,
  notes: z.string().trim().max(1000).optional(),
})

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

async function loadAuthorized(params: { id: string }, request?: NextRequest) {
  const id = z.string().uuid().safeParse(params.id)
  if (!id.success) throw new StatusError('Invalid order id', 400)

  const profile = await getAuthenticatedProfile()
  if (!profile) throw new StatusError('Unauthorized', 401)

  const order = await getOrderStatusRow(id.data)
  if (!isStaffRole(profile.role) && order.customer_id !== profile.id) {
    throw new StatusError('Forbidden', 403)
  }
  return { profile, order, body: request ? patchStatusSchema.safeParse(await request.json().catch(() => null)) : null }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile, order } = await loadAuthorized(params)
    const history = await getOrderHistory(order.id)
    return NextResponse.json({ data: { orderId: order.id, ...getStatusMetadata(profile.role, order), history } })
  } catch (error) {
    if (error instanceof StatusError) return errorResponse(error.message, error.status)
    console.error('Order status GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { profile, order, body } = await loadAuthorized(params, request)
    if (!body?.success) {
      return NextResponse.json({ error: 'Missing or invalid status', details: body?.error.flatten() }, { status: 400 })
    }

    const next = body.data.status
    if (next !== order.status) validateTransition(profile.role, order, next)
    const updated =
      next === order.status
        ? order
        : await transitionOrderStatus({ order, nextStatus: next, notes: body.data.notes, changedBy: profile.id, role: profile.role })

    return NextResponse.json({ data: { orderId: updated.id, ...getStatusMetadata(profile.role, updated) } })
  } catch (error) {
    if (error instanceof StatusError) return errorResponse(error.message, error.status)
    console.error('Order status PATCH error:', error)
    return errorResponse('Internal server error', 500)
  }
}
