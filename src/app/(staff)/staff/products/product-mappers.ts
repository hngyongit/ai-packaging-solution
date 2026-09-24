import { type EditableProduct } from '@/components/modals/ProductEditModal'

// Serialize từ DB (snake_case, DECIMAL có thể là string) cho bảng staff + map
// sang drawer model. Tách khỏi products-table.tsx để component <200 dòng.

export type DbProductRow = {
  id: string
  code: string
  name: string
  description: string | null
  category: string
  box_type: string
  min_dimensions: { length: number; width: number; height: number } | null
  max_dimensions: { length: number; width: number; height: number } | null
  available_layers: number[] | null
  base_price: string | number | null
  stock_quantity: number | null
  is_active: boolean
  image_url: string | null
}

export function toEditable(row: DbProductRow): EditableProduct {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    boxType: row.box_type,
    minDimensions: row.min_dimensions,
    dimensions: row.max_dimensions,
    basePrice: row.base_price != null ? Number(row.base_price) : null,
    description: row.description,
    imageUrl: row.image_url,
    stockQuantity: row.stock_quantity,
    availableLayers: row.available_layers ?? [],
    isActive: row.is_active,
  }
}

/** Tải ảnh qua /api/upload (purpose=reference — bucket public) rồi trả URL. */
export async function uploadProductImage(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('purpose', 'reference')
  const response = await fetch('/api/upload', { method: 'POST', body })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error ?? 'Tải ảnh thất bại')
  return result.file.url as string
}
