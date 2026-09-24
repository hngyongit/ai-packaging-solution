import { DEPOSIT_PERCENTAGE, DEPOSIT_THRESHOLD } from '@/lib/config/pricing'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Toàn bộ logic tạo đơn (trước đây nằm trong POST /api/orders ~140 dòng).
// /api/orders và /api/checkout đều gọi đây → một đường duy nhất, không phân kỳ
// giá / snapshot / lịch sử giữa form custom và giỏ hàng.

export const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        dimensions: z.object({
          length: z.coerce.number().positive(),
          width: z.coerce.number().positive(),
          height: z.coerce.number().positive(),
          layers: z.coerce.number().int().positive().optional(),
          // Kiểu thùng từ tư vấn AI — zod strip key chưa khai báo nên phải mở ở đây.
          boxStyleId: z.string().trim().max(40).optional(),
        }),
        printingSpecs: z.record(z.unknown()).optional(),
        quantity: z.coerce.number().int().positive(),
        notes: z.string().trim().max(1000).optional(),
        /** true = gia công theo yêu cầu: giữ product_id làm neo giá nhưng không trừ kho. */
        isCustom: z.boolean().optional(),
        /** Snapshot tên/mã hiển thị cho dòng custom (SKU gốc chỉ để tính giá). */
        itemName: z.string().trim().max(200).optional(),
        itemCode: z.string().trim().max(60).optional(),
      })
    )
    .min(1),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'payos']).default('cod'),
  contactName: z.string().trim().min(1).max(120),
  contactPhone: z.string().trim().regex(/^\d{10}$/),
  contactEmail: z.string().trim().email(),
  deliveryMethod: z.literal('delivery').default('delivery'),
  deliveryAddress: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(1000).optional(),
})

export type OrderItemInput = z.infer<typeof createOrderSchema>['items'][number]

export type CreateOrderInput = {
  customerId: string
  consultationId?: string
  items: OrderItemInput[]
  paymentMethod: 'cod' | 'bank_transfer' | 'payos'
  contactName: string
  contactPhone: string
  contactEmail: string
  deliveryMethod: 'delivery'
  deliveryAddress: string
  notes?: string
}

export class OrderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

type Profile = { id: string; role: 'customer' | 'sales' | 'admin' }
type Product = { id: string; code: string; name: string; base_price: number | string | null; is_active: boolean }

const ORDER_SELECT = `
  *,
  order_items (*),
  customer:profiles!orders_customer_id_fkey (
    id,
    full_name,
    phone,
    company_name,
    default_address
  ),
  consultation:consultations!orders_consultation_id_fkey (
    id,
    status,
    product_type
  )
`

function generateOrderCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `ORD-${date}-${suffix}`
}

export async function createOrderWithItems(
  input: CreateOrderInput,
  profile: Profile
): Promise<Record<string, unknown>> {
  const admin = await createAdminClient()
  const isStaff = profile.role === 'sales' || profile.role === 'admin'
  const customerId = input.customerId
  if (!isStaff && customerId !== profile.id) throw new OrderError('Forbidden', 403)

  const { data: customer } = await admin.from('profiles').select('id').eq('id', customerId).maybeSingle()
  if (!customer) throw new OrderError('Customer not found', 404)

  if (input.consultationId) {
    const { data: consultation } = await admin
      .from('consultations')
      .select('id, customer_id')
      .eq('id', input.consultationId)
      .maybeSingle<{ id: string; customer_id: string | null }>()
    if (!consultation) throw new OrderError('Consultation not found', 404)
    if (consultation.customer_id && consultation.customer_id !== customerId) throw new OrderError('Forbidden', 403)
  }

  const productIds = Array.from(new Set(input.items.map((item) => item.productId)))
  const { data: products, error: productError } = await admin
    .from('products')
    .select('id, code, name, base_price, is_active')
    .in('id', productIds)
    .returns<Product[]>()
  if (productError) throw productError
  if (!products || products.length !== productIds.length) throw new OrderError('Product not found', 404)

  const productsById = new Map(products.map((product) => [product.id, product]))
  const orderItems = input.items.map((item) => {
    const product = productsById.get(item.productId)
    if (!product || !product.is_active) throw new OrderError('Product not found', 404)
    const unitPrice = Number(product.base_price)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new OrderError('Product is missing a price', 400)
    return { product, input: item, unitPrice, subtotal: unitPrice * item.quantity }
  })

  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const depositAmount =
    totalAmount >= DEPOSIT_THRESHOLD ? Math.round((totalAmount * DEPOSIT_PERCENTAGE) / 100) : 0

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      order_code: generateOrderCode(),
      customer_id: customerId,
      status: 'pending',
      consultation_id: input.consultationId ?? null,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      deposit_threshold: DEPOSIT_THRESHOLD,
      payment_method: input.paymentMethod,
      payment_status: 'unpaid',
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      contact_email: input.contactEmail,
      delivery_method: input.deliveryMethod,
      delivery_address: input.deliveryAddress,
      delivery_fee: 0,
      notes: input.notes ?? null,
    })
    .select('id')
    .single<{ id: string }>()
  if (orderError) throw orderError

  const { error: itemError } = await admin.from('order_items').insert(
    orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.input.itemName ?? item.product.name,
      product_code: item.input.itemCode ?? item.product.code,
      dimensions: item.input.dimensions,
      printing_specs: item.input.printingSpecs ?? null,
      quantity: item.input.quantity,
      is_custom: item.input.isCustom ?? false,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
      notes: item.input.notes ?? null,
    }))
  )
  if (itemError) {
    await admin.from('orders').delete().eq('id', order.id)
    throw itemError
  }

  const { error: historyError } = await admin.from('order_status_history').insert({
    order_id: order.id,
    from_status: null,
    to_status: 'pending',
    changed_by: profile.id,
    notes: 'Order created',
  })
  if (historyError) throw historyError

  const { data: createdOrder, error: fetchError } = await admin
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', order.id)
    .single()
  if (fetchError) throw fetchError

  return createdOrder as unknown as Record<string, unknown>
}
