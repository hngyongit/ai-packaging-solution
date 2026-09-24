import { createAdminClient } from '@/lib/supabase/server'

import { type Profile } from './profile'

// Quản lý danh mục + tồn kho cho staff — mọi thao tác đi qua service client kèm
// kiểm tra role tường minh (RLS products chỉ cho public SELECT + admin ALL).

export class ProductAdminError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export function assertStaff(profile: Profile | null): asserts profile is Profile {
  if (!profile) throw new ProductAdminError('Unauthorized', 401)
  if (profile.role !== 'sales' && profile.role !== 'admin') {
    throw new ProductAdminError('Bạn không có quyền quản lý danh mục.', 403)
  }
}

const CATEGORIES = ['carton-3-layer', 'carton-5-layer', 'corrugated', 'custom'] as const
const BOX_TYPES = ['regular-slotted', 'half-slotted', 'full-overlap', 'die-cut', 'custom'] as const

export type ProductInput = {
  code: string
  name: string
  description?: string | null
  category: string
  boxType: string
  minDimensions?: { length: number; width: number; height: number } | null
  maxDimensions: { length: number; width: number; height: number }
  availableLayers: number[]
  basePrice: number
  unit: string
  stockQuantity: number | null
  isActive: boolean
  imageUrl?: string | null
}

export async function listAllProducts() {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('products')
    .select('id, code, name, description, category, box_type, min_dimensions, max_dimensions, available_layers, base_price, unit, stock_quantity, is_active, image_url')
    .order('code', { ascending: true })
  if (error) throw new ProductAdminError(error.message, 500)
  return data ?? []
}

export async function createProduct(input: ProductInput): Promise<{ id: string }> {
  validate(input)
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('products')
    .insert(toRow(input))
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') throw new ProductAdminError('Mã sản phẩm đã tồn tại.', 409)
    throw new ProductAdminError(error.message, 500)
  }
  return { id: data.id }
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  if (input.category || input.boxType) validate(input as ProductInput)
  const admin = await createAdminClient()
  const { error } = await admin.from('products').update(toRow(input)).eq('id', id)
  if (error) throw new ProductAdminError(error.message, 500)
}

function toRow(input: Partial<ProductInput>) {
  return {
    ...(input.code !== undefined ? { code: input.code } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.boxType !== undefined ? { box_type: input.boxType } : {}),
    ...(input.minDimensions !== undefined ? { min_dimensions: input.minDimensions } : {}),
    ...(input.maxDimensions !== undefined ? { max_dimensions: input.maxDimensions } : {}),
    ...(input.availableLayers !== undefined ? { available_layers: input.availableLayers } : {}),
    ...(input.basePrice !== undefined ? { base_price: input.basePrice } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.stockQuantity !== undefined ? { stock_quantity: input.stockQuantity } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    ...(input.imageUrl !== undefined ? { image_url: input.imageUrl } : {}),
    updated_at: new Date().toISOString(),
  }
}

function validate(input: Partial<ProductInput>) {
  if (input.category && !CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])) {
    throw new ProductAdminError('Nhóm sản phẩm không hợp lệ.', 400)
  }
  if (input.boxType && !BOX_TYPES.includes(input.boxType as (typeof BOX_TYPES)[number])) {
    throw new ProductAdminError('Kiểu thùng không hợp lệ.', 400)
  }
  if (input.stockQuantity !== undefined && input.stockQuantity !== null && (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0)) {
    throw new ProductAdminError('Tồn kho phải là số nguyên ≥ 0.', 400)
  }
  if (input.basePrice !== undefined && !(input.basePrice >= 0)) {
    throw new ProductAdminError('Đơn giá không hợp lệ.', 400)
  }
}
