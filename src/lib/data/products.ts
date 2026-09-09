import { createClient } from "@/lib/supabase/server"

import { type ProductOption } from "@/app/(public)/order/order-types"

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
