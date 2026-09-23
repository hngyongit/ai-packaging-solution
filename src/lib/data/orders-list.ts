import { createAdminClient } from '@/lib/supabase/server'
import { type Profile } from './profile'

// Trích từ GET /api/orders cũ để route handler giữ <80 dòng.

const ORDER_STATUSES = [
  'pending',
  'staff_review',
  'confirmed',
  'deposit_paid',
  'production',
  'completed',
  'delivered',
  'cancelled',
] as const

const SORT_FIELDS = new Set(['created_at', 'updated_at', 'order_code', 'status', 'total_amount'])

const ORDER_SELECT = `
  *,
  order_items (*, product:products!order_items_product_id_fkey (stock_quantity)),
  customer:profiles!orders_customer_id_fkey (
    id,
    full_name,
    phone,
    company_name,
    address
  ),
  consultation:consultations!orders_consultation_id_fkey (
    id,
    status,
    product_type,
    product_description,
    product_weight,
    notes,
    sales_notes,
    ai_recommendation,
    ai_confidence
  )
`

function isStaff(profile: Profile) {
  return profile.role === 'sales' || profile.role === 'admin'
}

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

function getSort(searchParams: URLSearchParams) {
  const rawSort = searchParams.get('sort') ?? 'created_at:desc'
  const [field, direction] = rawSort.split(':')
  return {
    field: SORT_FIELDS.has(field) ? field : 'created_at',
    ascending: direction === 'asc',
  }
}

export class OrderListError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export async function listOrders(profile: Profile, searchParams: URLSearchParams) {
  const admin = await createAdminClient()
  const page = parsePositiveInt(searchParams.get('page'), 1, 10_000)
  const limit = parsePositiveInt(searchParams.get('limit'), 20, 100)
  const from = (page - 1) * limit
  const to = from + limit - 1
  const status = searchParams.get('status')
  const search = searchParams.get('search')?.trim()
  const sort = getSort(searchParams)

  let query = admin.from('orders').select(ORDER_SELECT, { count: 'exact' })

  if (!isStaff(profile)) query = query.eq('customer_id', profile.id)
  if (status) {
    if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      throw new OrderListError('Invalid status', 400)
    }
    query = query.eq('status', status)
  }
  if (search) {
    const term = search.replace(/[%_,]/g, ' ').trim()
    if (term) {
      query = query.or(
        `order_code.ilike.%${term}%,contact_name.ilike.%${term}%,contact_phone.ilike.%${term}%,contact_email.ilike.%${term}%`
      )
    }
  }

  const { data, count, error } = await query.order(sort.field, { ascending: sort.ascending }).range(from, to)
  if (error) throw error

  return {
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }
}

/** Một đơn cho màn staff — kèm items + history; service client, quyền chặn ở route/page. */
export async function getStaffOrderById(orderId: string) {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select(`${ORDER_SELECT}, order_status_history (*)`)
    .eq('id', orderId)
    .maybeSingle()
  if (error) throw error
  return data
}
