import { type VolumeTier } from '@/lib/config/pricing'
import { type ProductDimensions } from './types'

export function getTierUnitPrice(
  basePrice: number,
  discountPercent: number
): number {
  const discounted = basePrice * (1 - discountPercent / 100)
  return Math.round(discounted / 100) * 100
}

export function formatDimensions(d: ProductDimensions | null): string {
  if (!d) return '—'
  return `${d.length} × ${d.width} × ${d.height} cm`
}

export function formatLayers(layers: number[]): string {
  if (layers.length === 0) return '—'
  return `${layers.join(', ')} lớp`
}

export function formatQtyRange(tier: VolumeTier): string {
  const min = tier.minQty.toLocaleString('vi-VN')
  if (tier.maxQty === null) return `≥ ${min}`
  return `${min} – ${tier.maxQty.toLocaleString('vi-VN')}`
}
