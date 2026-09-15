import { getActiveProductOptions } from '@/lib/data/products'
import { getPrintHandoff } from '@/lib/mockup/handoff'

import { OrderForm } from './order-form'

export const dynamic = 'force-dynamic'

export default async function OrderPage({
  searchParams,
}: {
  searchParams: { consultation?: string }
}) {
  const products = await getActiveProductOptions().catch((error) => {
    console.error('Order page products error:', error)
    return []
  })
  // Null khi id sai/không phải tư vấn của khách này — form vẫn đặt hàng bình thường.
  const printHandoff = await getPrintHandoff(searchParams.consultation)

  return <OrderForm products={products} printHandoff={printHandoff} />
}
