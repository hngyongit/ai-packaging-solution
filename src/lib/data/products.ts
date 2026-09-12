import { createClient } from "@/lib/supabase/server"

import { type ProductOption } from "@/app/(public)/order/order-types"
import { type CatalogProduct, type ProductDimensions } from "@/features/products/types"

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

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, code, name, description, category, box_type, min_dimensions, max_dimensions, available_layers, base_price, unit"
    )
    .eq("is_active", true)
    .order("base_price", { ascending: true })

  if (error) throw error

  return (data ?? []).map((product) => ({
    id: String(product.id),
    code: String(product.code),
    name: String(product.name),
    description: product.description ? String(product.description) : null,
    category: String(product.category),
    boxType: String(product.box_type),
    maxDimensions: parseDimensions(product.max_dimensions),
    availableLayers: Array.isArray(product.available_layers)
      ? product.available_layers.map(Number)
      : [],
    basePrice: Number(product.base_price ?? 0),
    unit: String(product.unit ?? "unit"),
  }))
}
