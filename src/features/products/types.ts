export type ProductDimensions = {
  length: number
  width: number
  height: number
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
}
