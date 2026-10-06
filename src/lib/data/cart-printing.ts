import { z } from 'zod'

import { printPositionLabel } from '@/lib/config/print-positions'

import { admin } from './cart'

// Thông số in của MỘT dòng giỏ. Tách khỏi cart.ts vì file đó đã sát giới hạn
// 300 dòng của lib/data (docs/DEVELOPMENT_GUIDE §4.1) và đây là một mối quan tâm
// riêng: cart_items.has_printing + printing_specs.
//
// Giỏ là nơi DUY NHẤT khách bật in cho hàng kho (mua thẳng từ /shop) — trước đây
// chỉ dòng custom sinh từ tư vấn/mẫu mới có in. Dùng chung cổng auth `admin()`
// export từ cart.ts (cùng một quy ước: admin client + lọc customer_id tường minh).

// .url() một mình nhận MỌI scheme (kể cả javascript:) → ép https cho khớp
// readAssetUrl ở order-shared.ts, nơi bỏ qua mọi URL không phải https.
const httpsUrl = z.string().url().max(500).startsWith('https://')

export const printingSpecSchema = z.object({
  hasPrinting: z.boolean(),
  printPosition: z.enum(['2_main', '4_sides', '1_top']).optional(),
  logoUrl: httpsUrl.optional(),
  dielineUrl: httpsUrl.optional(),
  dielineName: z.string().trim().max(120).optional(),
})

export type PrintingSpecInput = z.infer<typeof printingSpecSchema>

/**
 * Shape lưu trong cart_items.printing_specs — giữ đúng key cũ mà
 * order-shared.getPrintPositionLabel / getDielineUrl và PrintPreviewStrip đang đọc,
 * nên màn đơn hàng + màn staff không phải sửa.
 *
 * printPositionLabel do SERVER suy ra: client không spoof được nhãn hiển thị cho xưởng.
 */
export function toStoredSpec(input: PrintingSpecInput): Record<string, unknown> {
  if (!input.hasPrinting) return {}
  return {
    hasPrinting: true,
    ...(input.printPosition ? { printPosition: input.printPosition } : {}),
    printPositionLabel: input.printPosition ? printPositionLabel(input.printPosition) : null,
    // fileUrl = bí danh cũ của logoUrl (custom-spec.ts ghi cùng key này).
    ...(input.logoUrl ? { logoUrl: input.logoUrl, fileUrl: input.logoUrl } : {}),
    ...(input.dielineUrl ? { dielineUrl: input.dielineUrl } : {}),
    ...(input.dielineName ? { dielineName: input.dielineName } : {}),
  }
}

/**
 * Ghi thông số in cho một dòng giỏ — cả hàng kho lẫn hàng theo yêu cầu (khác
 * setCartCustomSpec vốn chỉ áp cho kind='custom'). Tắt in → xoá sạch printing_specs
 * để buildCheckoutItems không forward dữ liệu cũ sang đơn.
 */
export async function setCartPrinting(input: {
  customerId: string
  cartItemId: string
  printing: PrintingSpecInput
}): Promise<void> {
  const db = await admin()
  if (!db) throw new Error('Unauthorized')
  const { error } = await db
    .from('cart_items')
    .update({
      has_printing: input.printing.hasPrinting,
      printing_specs: input.printing.hasPrinting ? toStoredSpec(input.printing) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.cartItemId)
    .eq('customer_id', input.customerId)
  if (error) throw new Error(`Failed to update printing: ${error.message}`)
}
