import { redirect } from 'next/navigation'
import { type Metadata } from 'next'

import { getCart } from '@/lib/data/cart'
import { getAuthenticatedProfile } from '@/lib/data/profile'

import { CartView } from './cart-view'

export const metadata: Metadata = { title: 'Giỏ hàng - AI Carton Packaging' }
export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const profile = await getAuthenticatedProfile()
  if (!profile) redirect('/login')

  const lines = await getCart(profile.id).catch((error) => {
    console.error('Cart page fetch error:', error)
    return []
  })

  return <CartView initialLines={lines} fullName={profile.full_name} />
}
