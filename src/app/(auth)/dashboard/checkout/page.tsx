import { redirect } from 'next/navigation'
import { type Metadata } from 'next'

import { ensureDefaultAddress, listAddresses } from '@/lib/data/addresses'
import { getCart } from '@/lib/data/cart'
import { getAuthenticatedProfile } from '@/lib/data/profile'

import { CheckoutForm } from './checkout-form'

export const metadata: Metadata = { title: 'Thanh toán - AI Carton Packaging' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { items?: string }
}) {
  const profile = await getAuthenticatedProfile()
  if (!profile) redirect('/login')

  const cart = await getCart(profile.id).catch((error) => {
    console.error('Checkout page cart error:', error)
    return []
  })

  // `?items=` = các dòng giỏ được chọn ở trang cart. Bỏ id lạ/không thuộc giỏ.
  const requested = (searchParams.items ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  const selected = requested.length > 0 ? cart.filter((line) => requested.includes(line.id)) : cart

  // Chưa có địa chỉ nào → thử dựng một cái từ hồ sơ để khách khỏi nhập lại.
  await ensureDefaultAddress(profile.id).catch((error) => console.error('ensureDefaultAddress:', error))
  const addresses = await listAddresses(profile.id).catch(() => [])
  const initialAddressId = addresses.find((row) => row.is_default)?.id ?? addresses[0]?.id ?? ''

  return <CheckoutForm lines={selected} addresses={addresses} initialAddressId={initialAddressId} />
}
