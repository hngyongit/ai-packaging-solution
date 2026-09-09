import { type ProductOption } from './order-types'

export function formatCurrency(value: number | string | null) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function getDefaultLayer(product?: ProductOption) {
  return product?.availableLayers[0] ?? 3
}
