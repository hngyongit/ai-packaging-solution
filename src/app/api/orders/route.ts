import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { DEPOSIT_PERCENTAGE, DEPOSIT_THRESHOLD } from '@/lib/config/pricing'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type Profile = {
  id: string
  role: 'customer' | 'sales' | 'admin'
  full_name: string | null
  phone: string | null
}

type Product = {
  id: string
  code: string
  name: string
  base_price: number | string | null
  is_active: boolean
}

type SupabaseMaybeError = {
  code?: string
} | null

type OrderItemInsert = {
  order_id: string
  product_id: string
  product_name: string
  product_code: string
  dimensions: z.infer<typeof dimensionsSchema>
  printing_specs: Record<string, unknown> | null
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
}

const ORDER_SELECT = `
  *,
  order_items (*),
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
    product_type
  )
`

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

const dimensionsSchema = z.object({
  length: z.coerce.number().positive(),
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  layers: z.coerce.number().int().positive().optional(),
})

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  dimensions: dimensionsSchema,
  printingSpecs: z.record(z.unknown()).optional(),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().trim().max(1000).optional(),
})

const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  items: z.array(orderItemSchema).min(1),
  paymentMethod: z.enum(['cod', 'bank_transfer']).default('cod'),
  contactName: z.string().trim().min(1).max(120),
  contactPhone: z.string().trim().regex(/^\d{10}$/),
  contactEmail: z.string().trim().email(),
  deliveryMethod: z.literal('delivery').default('delivery'),
  deliveryAddress: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(1000).optional(),
})

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

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

function generateOrderCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `ORD-${date}-${suffix}`
}

function isNotFoundError(error: SupabaseMaybeError) {
  return error?.code === 'PGRST116'
}

async function getAuthenticatedProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { userId: null, profile: null }

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, full_name, phone')
    .eq('id', user.id)
    .single<Profile>()

  return { userId: user.id, profile }
}

export async function GET(request: NextRequest) {
  try {
    const { profile } = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const admin = await createAdminClient()
    const { searchParams } = new URL(request.url)
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
        return errorResponse('Invalid status', 400)
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

    const { data, count, error } = await query
      .order(sort.field, { ascending: sort.ascending })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await getAuthenticatedProfile()
    if (!profile) return errorResponse('Unauthorized', 401)

    const json = await request.json().catch(() => null)
    const parsed = createOrderSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data
    const customerId = body.customerId ?? profile.id
    if (!isStaff(profile) && customerId !== profile.id) return errorResponse('Forbidden', 403)

    const admin = await createAdminClient()
    const { data: customer, error: customerError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', customerId)
      .single()
    if (customerError && !isNotFoundError(customerError)) throw customerError
    if (!customer) return errorResponse('Customer not found', 404)

    if (body.consultationId) {
      const { data: consultation, error: consultationError } = await admin
        .from('consultations')
        .select('id, customer_id')
        .eq('id', body.consultationId)
        .single<{ id: string; customer_id: string | null }>()
      if (consultationError && !isNotFoundError(consultationError)) throw consultationError
      if (!consultation) return errorResponse('Consultation not found', 404)
      if (consultation.customer_id && consultation.customer_id !== customerId) return errorResponse('Forbidden', 403)
    }

    const productIds = Array.from(new Set(body.items.map((item) => item.productId)))
    const { data: products, error: productError } = await admin
      .from('products')
      .select('id, code, name, base_price, is_active')
      .in('id', productIds)
      .returns<Product[]>()
    if (productError) throw productError
    if (!products || products.length !== productIds.length) return errorResponse('Product not found', 404)

    const productsById = new Map(products.map((product) => [product.id, product]))
    const orderItems = body.items.map((item) => {
      const product = productsById.get(item.productId)
      if (!product || !product.is_active) throw new Error(`Unavailable product: ${item.productId}`)
      const unitPrice = Number(product.base_price)
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Unpriced product: ${product.id}`)
      const subtotal = unitPrice * item.quantity

      return {
        product,
        input: item,
        unitPrice,
        subtotal,
      }
    })

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    const depositAmount =
      totalAmount >= DEPOSIT_THRESHOLD ? Math.round((totalAmount * DEPOSIT_PERCENTAGE) / 100) : 0

    const orderPayload = {
      order_code: generateOrderCode(),
      customer_id: customerId,
      status: 'pending',
      consultation_id: body.consultationId ?? null,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      deposit_threshold: DEPOSIT_THRESHOLD,
      payment_method: body.paymentMethod,
      payment_status: 'unpaid',
      contact_name: body.contactName,
      contact_phone: body.contactPhone,
      contact_email: body.contactEmail,
      delivery_method: body.deliveryMethod,
      delivery_address: body.deliveryAddress,
      delivery_fee: 0,
      notes: body.notes ?? null,
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert(orderPayload)
      .select('*')
      .single<{ id: string }>()
    if (orderError) throw orderError

    const itemPayload: OrderItemInsert[] = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_code: item.product.code,
      dimensions: item.input.dimensions,
      printing_specs: item.input.printingSpecs ?? null,
      quantity: item.input.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
      notes: item.input.notes ?? null,
    }))

    const { error: itemError } = await admin.from('order_items').insert(itemPayload)
    if (itemError) {
      await admin.from('orders').delete().eq('id', order.id)
      throw itemError
    }

    await admin.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      changed_by: profile.id,
      notes: 'Order created',
    })

    const { data: createdOrder, error: fetchError } = await admin
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', order.id)
      .single()
    if (fetchError) throw fetchError

    return NextResponse.json({ data: createdOrder }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    const message = error instanceof Error ? error.message : ''
    if (message.startsWith('Unavailable product')) return errorResponse('Product not found', 404)
    if (message.startsWith('Unpriced product')) return errorResponse('Product is missing a price', 400)
    return errorResponse('Internal server error', 500)
  }
}
