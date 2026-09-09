import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { DEPOSIT_PERCENTAGE, DEPOSIT_THRESHOLD } from '@/lib/config/pricing'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { canReorderOrder } from '@/lib/data/order-shared'

type Profile = {
  id: string
  role: 'customer' | 'sales' | 'admin'
  full_name: string | null
  phone: string | null
}

type SourceOrder = {
  id: string
  order_code: string
  customer_id: string
  status: string | null
  payment_method: 'cod' | 'bank_transfer' | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  delivery_method: string | null
  delivery_address: string | null
  notes: string | null
  order_items: SourceOrderItem[]
}

type SourceOrderItem = {
  id: string
  product_id: string | null
  product_name: string
  product_code: string
  dimensions: Record<string, unknown>
  printing_specs: Record<string, unknown> | null
  quantity: number
  notes: string | null
}

type Product = {
  id: string
  code: string
  name: string
  base_price: number | string | null
  is_active: boolean
}

type CopiedItem = {
  sourceItemId: string
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  subtotal: number
}

type SkippedItem = {
  sourceItemId: string
  productId: string | null
  productName: string
  reason: string
}

type ReorderItemInsert = {
  product_id: string
  product_name: string
  product_code: string
  dimensions: Record<string, unknown>
  printing_specs: Record<string, unknown> | null
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
}

type SupabaseMaybeError = {
  code?: string
} | null

const ORDER_SELECT = `
  id,
  order_code,
  customer_id,
  status,
  payment_method,
  contact_name,
  contact_phone,
  contact_email,
  delivery_method,
  delivery_address,
  notes,
  order_items (
    id,
    product_id,
    product_name,
    product_code,
    dimensions,
    printing_specs,
    quantity,
    notes
  )
`

const CREATED_ORDER_SELECT = `
  *,
  order_items (*)
`

const quantityOverrideSchema = z.object({
  sourceItemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
})

const reorderSchema = z.object({
  orderId: z.string().uuid(),
  quantityOverrides: z.array(quantityOverrideSchema).optional(),
  paymentMethod: z.enum(['cod', 'bank_transfer']).optional(),
  notes: z.string().trim().max(1000).optional(),
})

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function isNotFoundError(error: SupabaseMaybeError) {
  return error?.code === 'PGRST116'
}

function generateOrderCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `ORD-${date}-${suffix}`
}

function toMoney(value: number | string | null) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

async function getAuthenticatedCustomer() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { profile: null, status: 401 }

  const admin = await createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, full_name, phone')
    .eq('id', user.id)
    .single<Profile>()

  if (profileError || !profile) return { profile: null, status: 401 }
  if (profile.role !== 'customer') return { profile: null, status: 403 }

  return { profile, status: 200 }
}

function getQuantity(
  sourceItem: SourceOrderItem,
  overrides: Map<string, number>
) {
  return overrides.get(sourceItem.id) ?? sourceItem.quantity
}

function buildReorderItems(
  sourceOrder: SourceOrder,
  productsById: Map<string, Product>,
  quantityOverrides: Map<string, number>
) {
  const copiedItems: CopiedItem[] = []
  const skippedItems: SkippedItem[] = []
  const insertItems: ReorderItemInsert[] = []

  for (const sourceItem of sourceOrder.order_items) {
    if (!sourceItem.product_id) {
      skippedItems.push({
        sourceItemId: sourceItem.id,
        productId: null,
        productName: sourceItem.product_name,
        reason: 'Original item is not linked to a current product',
      })
      continue
    }

    const product = productsById.get(sourceItem.product_id)
    if (!product || !product.is_active) {
      skippedItems.push({
        sourceItemId: sourceItem.id,
        productId: sourceItem.product_id,
        productName: sourceItem.product_name,
        reason: 'Product is no longer available',
      })
      continue
    }

    const unitPrice = toMoney(product.base_price)
    if (unitPrice <= 0) {
      skippedItems.push({
        sourceItemId: sourceItem.id,
        productId: sourceItem.product_id,
        productName: sourceItem.product_name,
        reason: 'Product does not have a current price',
      })
      continue
    }

    const quantity = getQuantity(sourceItem, quantityOverrides)
    const subtotal = unitPrice * quantity

    copiedItems.push({
      sourceItemId: sourceItem.id,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantity,
      unitPrice,
      subtotal,
    })

    insertItems.push({
      product_id: product.id,
      product_name: product.name,
      product_code: product.code,
      dimensions: sourceItem.dimensions,
      printing_specs: sourceItem.printing_specs,
      quantity,
      unit_price: unitPrice,
      subtotal,
      notes: sourceItem.notes,
    })
  }

  return { copiedItems, skippedItems, insertItems }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, status } = await getAuthenticatedCustomer()
    if (!profile) return errorResponse(status === 403 ? 'Forbidden' : 'Unauthorized', status)

    const json = await request.json().catch(() => null)
    const parsed = reorderSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid reorder details', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const admin = await createAdminClient()
    const { data: sourceOrder, error: sourceError } = await admin
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', parsed.data.orderId)
      .single<SourceOrder>()

    if (sourceError && !isNotFoundError(sourceError)) throw sourceError
    if (!sourceOrder) return errorResponse('Source order not found', 404)
    if (sourceOrder.customer_id !== profile.id) return errorResponse('Forbidden', 403)
    if (!canReorderOrder(sourceOrder.status)) return errorResponse('Order is not completed yet', 409)
    if (sourceOrder.order_items.length === 0) return errorResponse('Source order has no items', 409)

    const overrides = new Map(
      (parsed.data.quantityOverrides ?? []).map((item) => [item.sourceItemId, item.quantity])
    )
    const sourceItemIds = new Set(sourceOrder.order_items.map((item) => item.id))
    const hasUnknownOverride = Array.from(overrides.keys()).some((id) => !sourceItemIds.has(id))
    if (hasUnknownOverride) return errorResponse('Quantity override references an unknown order item', 400)

    const productIds = Array.from(
      new Set(
        sourceOrder.order_items
          .map((item) => item.product_id)
          .filter((productId): productId is string => Boolean(productId))
      )
    )

    let products: Product[] = []
    if (productIds.length > 0) {
      const { data, error: productError } = await admin
        .from('products')
        .select('id, code, name, base_price, is_active')
        .in('id', productIds)
        .returns<Product[]>()
      if (productError) throw productError
      products = data ?? []
    }

    const productsById = new Map(products.map((product) => [product.id, product]))
    const { copiedItems, skippedItems, insertItems } = buildReorderItems(
      sourceOrder,
      productsById,
      overrides
    )

    if (insertItems.length === 0) {
      return NextResponse.json(
        { error: 'No available items to reorder', skippedItems },
        { status: 409 }
      )
    }

    const totalAmount = copiedItems.reduce((sum, item) => sum + item.subtotal, 0)
    const depositAmount =
      totalAmount >= DEPOSIT_THRESHOLD ? Math.round((totalAmount * DEPOSIT_PERCENTAGE) / 100) : 0

    const { data: newOrder, error: orderError } = await admin
      .from('orders')
      .insert({
        order_code: generateOrderCode(),
        customer_id: profile.id,
        status: 'pending',
        consultation_id: null,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        deposit_threshold: DEPOSIT_THRESHOLD,
        payment_method: parsed.data.paymentMethod ?? sourceOrder.payment_method ?? 'cod',
        payment_status: 'unpaid',
        payment_proof_url: null,
        contact_name: sourceOrder.contact_name ?? profile.full_name,
        contact_phone: sourceOrder.contact_phone ?? profile.phone,
        contact_email: sourceOrder.contact_email,
        delivery_method: sourceOrder.delivery_method ?? 'pickup',
        delivery_address: sourceOrder.delivery_address,
        delivery_fee: 0,
        notes: parsed.data.notes ?? sourceOrder.notes,
      })
      .select('id')
      .single<{ id: string }>()
    if (orderError) throw orderError

    const { error: itemError } = await admin.from('order_items').insert(
      insertItems.map((item) => ({
        ...item,
        order_id: newOrder.id,
      }))
    )
    if (itemError) {
      await admin.from('orders').delete().eq('id', newOrder.id)
      throw itemError
    }

    const { error: historyError } = await admin.from('order_status_history').insert({
      order_id: newOrder.id,
      from_status: null,
      to_status: 'pending',
      changed_by: profile.id,
      notes: `Reordered from ${sourceOrder.order_code}`,
    })
    if (historyError) {
      await admin.from('orders').delete().eq('id', newOrder.id)
      throw historyError
    }

    const { data: createdOrder, error: fetchError } = await admin
      .from('orders')
      .select(CREATED_ORDER_SELECT)
      .eq('id', newOrder.id)
      .single()
    if (fetchError) throw fetchError

    return NextResponse.json(
      {
        data: {
          sourceOrderId: sourceOrder.id,
          sourceOrderCode: sourceOrder.order_code,
          order: createdOrder,
          copiedItems,
          skippedItems,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Reorder POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
