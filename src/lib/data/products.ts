import { createClient } from "@/lib/supabase/server"

import { type StockOption } from "@/lib/ai/types"
import {
  type CatalogProduct,
  type ProductDimensions,
  type ProductOption,
} from "@/features/products/types"

function parseDimensions(value: unknown): ProductDimensions | null {
  if (!value || typeof value !== "object") return null
  const d = value as Record<string, unknown>
  const length = Number(d.length)
  const width = Number(d.width)
  const height = Number(d.height)
  if (
    !Number.isFinite(length) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null
  }
  return { length, width, height }
}

export async function getActiveProductOptions(): Promise<ProductOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, code, name, description, base_price, available_layers")
    .eq("is_active", true)
    .order("base_price", { ascending: true })

  if (error) throw error

  return (data ?? []).map((product) => ({
    id: String(product.id),
    code: String(product.code),
    name: String(product.name),
    description: product.description ? String(product.description) : null,
    basePrice: Number(product.base_price ?? 0),
    availableLayers: Array.isArray(product.available_layers)
      ? product.available_layers.map(Number)
      : [],
  }))
}

// Hàng có sẵn trong kho (stock_quantity NOT NULL) — nguyên liệu cho trang shop,
// giỏ hàng và bộ tìm kiếm tư vấn kho.
export type CartProduct = {
  id: string
  code: string
  name: string
  description: string | null
  category: string
  boxType: string
  maxDimensions: ProductDimensions | null
  availableLayers: number[]
  basePrice: number
  unit: string
  stockQuantity: number | null
  isActive: boolean
  imageUrl: string | null
}

const PRODUCT_COLUMNS =
  "id, code, name, description, category, box_type, max_dimensions, available_layers, base_price, unit, stock_quantity, is_active, image_url"

// supabase-js chưa có Database type cho products → đọc qua Record, ép kiểu một chỗ.
export function toCartProduct(product: Record<string, unknown>): CartProduct {
  return {
    id: String(product.id),
    code: String(product.code),
    name: String(product.name),
    description: product.description ? String(product.description) : null,
    category: String(product.category),
    boxType: String(product.box_type),
    maxDimensions: parseDimensions(product.max_dimensions),
    availableLayers: Array.isArray(product.available_layers)
      ? (product.available_layers as unknown[]).map(Number)
      : [],
    basePrice: Number(product.base_price ?? 0),
    unit: String(product.unit ?? "unit"),
    stockQuantity: product.stock_quantity === null ? null : Number(product.stock_quantity),
    isActive: Boolean(product.is_active),
    imageUrl: product.image_url ? String(product.image_url) : null,
  }
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("base_price", { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => toCartProduct(row as unknown as Record<string, unknown>))
}

/**
 * Danh sách hàng có sẵn trong kho (stock_quantity NOT NULL) — cho trang shop,
 * giỏ hàng và bộ tìm kiếm tư vấn kho. NULL = gia công theo yêu cầu, không trừ kho.
 * ponytail: nâng cấp khi có generated Database type thì bỏ được Record cast.
 */
export async function getStockedProducts(): Promise<CartProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .not("stock_quantity", "is", null)
    .order("base_price", { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => toCartProduct(row as unknown as Record<string, unknown>))
}

export async function getCartProductById(productId: string): Promise<CartProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", productId)
    .maybeSingle()

  if (error) throw error
  return data ? toCartProduct(data as unknown as Record<string, unknown>) : null
}

/**
 * Nguyên liệu cho bộ tìm kiếm thùng có sẵn: chỉ dòng còn/đã theo dõi kho
 * (stock_quantity NOT NULL). stockQuantity 0 vẫn đưa vào để AI gắn cờ "tạm hết".
 */
export async function getStockOptions(): Promise<StockOption[]> {
  const stocked = await getStockedProducts()
  return stocked.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    availableLayers: product.availableLayers,
    maxDimensions: product.maxDimensions,
    stockQuantity: product.stockQuantity ?? 0,
  }))
}
