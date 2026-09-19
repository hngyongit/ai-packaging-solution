import { createAdminClient, createClient } from '@/lib/supabase/server'

import { type OrderItemInput, OrderError } from './orders-create'
import { type CartProduct, toCartProduct } from './products'
import { type CustomSpec } from './custom-spec'

// Giỏ hàng theo user — đăng nhập bắt buộc (RLS: auth.uid() = customer_id).
// Route dùng admin client + lọc customer_id tường minh theo quy ước orders.ts.
//
// Hai loại dòng: 'stock' = hàng kho (một dòng mỗi SKU, trừ kho khi chốt đơn),
// 'custom' = thùng theo yêu cầu (mỗi lần thêm một dòng riêng, product_id chỉ là
// neo giá nên KHÔNG trừ kho — see order_items.is_custom).

export type CartKind = 'stock' | 'custom'

export type CartLine = {
  id: string
  customer_id: string
  /** Neo giá: hàng custom vẫn phải trỏ vào một sản phẩm cơ sở (NOT NULL ở DB). */
  product_id: string
  kind: CartKind
  custom: CustomSpec | null
  saved_product_id: string | null
  quantity: number
  has_printing: boolean
  printing_specs: Record<string, unknown> | null
  product: CartProduct | null
}

export type CartInput = {
  customerId: string
  kind?: CartKind
  productId: string
  savedProductId?: string | null
  custom?: CustomSpec | null
  quantity?: number
  hasPrinting?: boolean
  printingSpecs?: Record<string, unknown> | null
}

export type StockIssue = {
  productCode: string
  productName: string
  requested: number
  available: number
}

async function admin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? createAdminClient() : null
}

const CART_SELECT = `
  id, customer_id, product_id, kind, custom, saved_product_id, quantity, has_printing, printing_specs,
  product:products ( id, code, name, description, category, box_type, max_dimensions,
                     available_layers, base_price, unit, stock_quantity, is_active, image_url )
`

type RawCartRow = {
  id: string
  customer_id: string
  product_id: string
  kind: CartKind
  custom: Record<string, unknown> | null
  saved_product_id: string | null
  quantity: number
  has_printing: boolean
  printing_specs: Record<string, unknown> | null
  product: Record<string, unknown> | null
}

function toCartLine(row: RawCartRow): CartLine {
  return {
    id: row.id,
    customer_id: row.customer_id,
    product_id: row.product_id,
    kind: row.kind ?? 'stock',
    custom: row.custom ? (row.custom as unknown as CustomSpec) : null,
    saved_product_id: row.saved_product_id,
    quantity: row.quantity,
    has_printing: row.has_printing,
    printing_specs: row.printing_specs,
    product: row.product ? toCartProduct(row.product) : null,
  }
}

type DbClient = NonNullable<Awaited<ReturnType<typeof admin>>>

function cartValues(input: CartInput, quantity: number) {
  return {
    quantity,
    kind: input.kind ?? 'stock',
    custom: input.custom ?? null,
    saved_product_id: input.savedProductId ?? null,
    has_printing: input.hasPrinting ?? false,
    printing_specs: input.printingSpecs ?? null,
    updated_at: new Date().toISOString(),
  }
}

async function findCartItem(db: DbClient, customerId: string, productId: string) {
  const { data } = await db
    .from('cart_items')
    .select('id, quantity')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .eq('kind', 'stock')
    .maybeSingle<{ id: string; quantity: number }>()
  return data
}

/**
 * Cộng dồn vào dòng có trước. UPDATE điều kiện theo quantity để hai request
 * không ghi đè mất phần của nhau; thua thì đọc lại và thử tiếp (max 3 lần).
 * ponytail: đủ cho mức bấm nhanh của người dùng; nâng cấp thành RPC khi có đấu
 * tranh thật.
 */
export async function mergeQuantity(
  db: DbClient,
  existing: { id: string; quantity: number },
  input: CartInput
): Promise<string> {
  let current = existing
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await db
      .from('cart_items')
      .update(cartValues(input, current.quantity + (input.quantity ?? 1)))
      .eq('id', current.id)
      .eq('quantity', current.quantity)
    if (!error) return current.id

    const reread = await db.from('cart_items').select('id, quantity').eq('id', current.id).maybeSingle<{ id: string; quantity: number }>()
    if (!reread.data) throw new Error(`Failed to update cart: ${error.message}`)
    current = reread.data
  }
  throw new Error('Failed to update cart: quantity keeps changing')
}

export async function getCart(customerId: string): Promise<CartLine[]> {
  const db = await admin()
  if (!db) return []
  const { data, error } = await db.from('cart_items').select(CART_SELECT).eq('customer_id', customerId).order('created_at')
  if (error) throw new Error(`Failed to fetch cart: ${error.message}`)
  return (data as unknown as RawCartRow[]).map(toCartLine)
}

export async function getCartCount(customerId: string): Promise<number> {
  const db = await admin()
  if (!db) return 0
  const { count, error } = await db
    .from('cart_items')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
  if (error) throw new Error(`Failed to count cart: ${error.message}`)
  return count ?? 0
}

/**
 * Thêm vào giỏ. Hàng kho: cộng dồn vào dòng SKU đã có (UNIQUE một phần).
 * Hàng custom: luôn tạo dòng mới vì mỗi quy cách là một line riêng.
 */
export async function upsertCartItem(input: CartInput): Promise<{ id: string }> {
  const db = await admin()
  if (!db) throw new Error('Unauthorized')
  const kind = input.kind ?? 'stock'

  if (!input.productId) throw new OrderError('Thiếu sản phẩm cơ sở để tính giá', 400)
  if (kind === 'stock') {
    const existing = await findCartItem(db, input.customerId, input.productId)
    if (existing) return { id: await mergeQuantity(db, existing, input) }
  }

  const { data, error } = await db
    .from('cart_items')
    .insert({
      customer_id: input.customerId,
      product_id: input.productId,
      ...cartValues(input, input.quantity ?? 1),
    })
    .select('id')
    .single<{ id: string }>()

  // Hai cú bấm cùng lúc trên hàng kho: một insert thắng, bên kia dính UNIQUE → cộng dồn lại.
  if (error?.code === '23505' && kind === 'stock' && input.productId) {
    const raced = await findCartItem(db, input.customerId, input.productId)
    if (raced) return { id: await mergeQuantity(db, raced, input) }
  }
  if (error) throw new Error(`Failed to add to cart: ${error.message}`)
  return { id: data.id }
}

export async function setCartQuantity(input: { customerId: string; cartItemId: string; quantity: number }): Promise<void> {
  const db = await admin()
  if (!db) throw new Error('Unauthorized')
  const { error } = await db
    .from('cart_items')
    .update({ quantity: input.quantity, updated_at: new Date().toISOString() })
    .eq('id', input.cartItemId)
    .eq('customer_id', input.customerId)
  if (error) throw new Error(`Failed to update quantity: ${error.message}`)
}

/** Chỉnh quy cách của một dòng custom ngay trong giỏ. */
export async function setCartCustomSpec(input: { customerId: string; cartItemId: string; custom: CustomSpec }): Promise<void> {
  const db = await admin()
  if (!db) throw new Error('Unauthorized')
  const { error } = await db
    .from('cart_items')
    .update({ custom: input.custom, updated_at: new Date().toISOString() })
    .eq('id', input.cartItemId)
    .eq('customer_id', input.customerId)
    .eq('kind', 'custom')
  if (error) throw new Error(`Failed to update custom spec: ${error.message}`)
}

export async function removeCartItem(input: { customerId: string; cartItemId: string }): Promise<void> {
  const db = await admin()
  if (!db) throw new Error('Unauthorized')
  const { error } = await db.from('cart_items').delete().eq('id', input.cartItemId).eq('customer_id', input.customerId)
  if (error) throw new Error(`Failed to remove cart item: ${error.message}`)
}

/**
 * Validate tồn kho cho các dòng được chọn để checkout. Dòng custom bỏ qua vì
 * product_id của nó chỉ là neo giá (không trừ kho — order_items.is_custom).
 */
export async function assertStockAvailable(customerId: string, cartItemIds: string[]): Promise<{ lines: CartLine[]; issues: StockIssue[] }> {
  const db = await admin()
  if (!db) throw new Error('Unauthorized')
  const { data, error } = await db
    .from('cart_items')
    .select(CART_SELECT)
    .eq('customer_id', customerId)
    .in('id', cartItemIds)
  if (error) throw new Error(`Failed to validate cart: ${error.message}`)

  const lines = (data as unknown as RawCartRow[]).map(toCartLine)
  const issues: StockIssue[] = []
  for (const line of lines) {
    if (line.kind === 'custom') continue
    const p = line.product
    if (!p || !p.isActive) {
      if (p) issues.push({ productCode: p.code, productName: p.name, requested: line.quantity, available: 0 })
      continue
    }
    if (p.stockQuantity !== null && line.quantity > p.stockQuantity) {
      issues.push({ productCode: p.code, productName: p.name, requested: line.quantity, available: p.stockQuantity })
    }
  }
  return { lines, issues }
}

export async function clearCartItems(customerId: string, cartItemIds: string[]): Promise<void> {
  const db = await admin()
  if (!db) throw new Error('Unauthorized')
  const { error } = await db.from('cart_items').delete().eq('customer_id', customerId).in('id', cartItemIds)
  if (error) throw new Error(`Failed to clear cart: ${error.message}`)
}

/**
 * Dòng giỏ hàng → order_items input.
 * Hàng kho lấy quy cách chuẩn của sản phẩm; hàng custom lấy đúng spec trên dòng
 * và đánh dấu is_custom để RPC trừ kho bỏ qua.
 */
export function buildCheckoutItems(lines: CartLine[]): OrderItemInput[] {
  return lines.map((line) => {
    if (line.kind === 'custom') {
      const spec = line.custom
      if (!spec) throw new OrderError('Dòng hàng theo yêu cầu thiếu quy cách', 400)
      return {
        productId: line.product_id,
        dimensions: {
          length: spec.length,
          width: spec.width,
          height: spec.height,
          layers: spec.layers,
          boxStyleId: spec.boxStyleId,
        },
        printingSpecs: line.has_printing ? (line.printing_specs ?? { hasPrinting: true }) : undefined,
        quantity: line.quantity,
        notes: spec.notes,
        isCustom: true,
        itemName: spec.productName,
        itemCode: spec.productCode,
      }
    }

    const max = line.product?.maxDimensions
    if (!max) throw new OrderError(`Sản phẩm ${line.product?.code ?? line.product_id} thiếu quy cách`, 400)
    return {
      productId: line.product_id,
      dimensions: { length: max.length, width: max.width, height: max.height, layers: line.product?.availableLayers[0] },
      printingSpecs: line.has_printing ? (line.printing_specs ?? { hasPrinting: true }) : undefined,
      quantity: line.quantity,
    }
  })
}
