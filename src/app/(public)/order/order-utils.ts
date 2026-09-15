import type { PrintHandoff } from '@/lib/mockup/handoff'

import { emptyItem, type OrderFormValues } from './order-schema'
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

/** Dòng đầu tiên trong form lấy theo tư vấn AI; các dòng khác dùng giá trị mặc định. */
export function defaultItems(products: ProductOption[], handoff: PrintHandoff | null) {
  if (handoff) return [itemFromHandoff(handoff, products)]
  return [{ ...emptyItem, productId: products[0]?.id ?? '', layers: getDefaultLayer(products[0]) }]
}

/** Dòng đầu tiên trong form lấy theo tư vấn AI; các dòng khác dùng giá trị mặc định. */
export function itemFromHandoff(handoff: PrintHandoff, products: ProductOption[]): OrderFormValues['items'][number] {
  const product = products.find((candidate) => candidate.id === handoff.productOptionId) ?? products[0]
  return {
    ...emptyItem,
    productId: product?.id ?? '',
    quantity: handoff.quantity ?? emptyItem.quantity,
    length: handoff.dims?.length ?? emptyItem.length,
    width: handoff.dims?.width ?? emptyItem.width,
    height: handoff.dims?.height ?? emptyItem.height,
    layers: handoff.layers ?? getDefaultLayer(product),
    boxStyleId: handoff.boxStyleId ?? undefined,
    hasPrinting: Boolean(handoff.mockupUrl),
  }
}

/**
 * Mockup/dieline là bằng chứng khách đã duyệt — gửi kèm cả khi khách bỏ chọn in
 * ở dòng này, để xưởng không làm lại từ đầu.
 */
export function printingSpecsFor(
  hasPrinting: boolean,
  uploaded: { url: string; path: string } | null,
  handoff: PrintHandoff | null,
) {
  if (!hasPrinting && !handoff?.mockupUrl) return undefined
  return {
    hasPrinting,
    fileUrl: uploaded?.url ?? handoff?.logoUrl ?? null,
    filePath: uploaded?.path ?? null,
    printPositionLabel: handoff?.printPositionLabel ?? null,
    mockupUrl: handoff?.mockupUrl ?? null,
    dielineUrl: handoff?.dielineUrl ?? null,
  }
}
