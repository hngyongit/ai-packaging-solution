'use client'

import { PriceEditor } from './price-editor'

interface PriceEditorWrapperProps {
  items: Array<{
    id: string
    product_name: string
    product_code: string
    quantity: number
    unit_price: number | string
    subtotal: number | string
  }>
  orderId: string
  currentTotal: number
}

/**
 * Wrapper Client Component cho PriceEditor để tránh lỗi
 * "Event handlers cannot be passed to Client Component props"
 */
export function PriceEditorWrapper({ items, orderId, currentTotal }: PriceEditorWrapperProps) {
  return <PriceEditor items={items} orderId={orderId} currentTotal={currentTotal} />
}
