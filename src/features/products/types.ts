export type ProductDimensions = {
  length: number
  width: number
  height: number
}

/** Sản phẩm cơ sở cho dropdown (neo giá của line custom, chọn SKU khi tư vấn). */
export type ProductOption = {
  id: string
  code: string
  name: string
  description: string | null
  basePrice: number
  availableLayers: number[]
}

export type CatalogProduct = {
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
  /** null = không theo dõi tồn kho (gia công theo yêu cầu). */
  stockQuantity: number | null
}
