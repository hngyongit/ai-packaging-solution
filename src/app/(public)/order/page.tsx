import { getActiveProductOptions } from '@/lib/data/products'

import { OrderForm } from './order-form'

export const dynamic = 'force-dynamic'

export default async function OrderPage() {
  const products = await getActiveProductOptions().catch((error) => {
    console.error('Order page products error:', error)
    return []
  })

  return <OrderForm products={products} />
}
