export type ProductOption = {
  id: string
  code: string
  name: string
  description: string | null
  basePrice: number
  availableLayers: number[]
}

export type UploadResult = {
  url: string
  path: string
}

export type CreatedOrder = {
  id: string
  order_code: string
  total_amount: number | string | null
  deposit_amount: number | string | null
  status: string
}
