export const DEPOSIT_THRESHOLD = 5_000_000 // VND
export const DEPOSIT_PERCENTAGE = 50 // %
export const VAT_PERCENTAGE = 10 // %

// Bậc chiết khấu theo số lượng. Giá cuối cùng luôn do nhân viên xác nhận
// sau khi xem xét yêu cầu cụ thể của khách hàng.
export const VOLUME_TIERS = [
  { minQty: 100, maxQty: 499, discountPercent: 0 },
  { minQty: 500, maxQty: 1999, discountPercent: 5 },
  { minQty: 2000, maxQty: 9999, discountPercent: 10 },
  { minQty: 10000, maxQty: null, discountPercent: 15 },
] as const

export type VolumeTier = (typeof VOLUME_TIERS)[number]
