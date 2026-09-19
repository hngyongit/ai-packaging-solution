import { redirect } from 'next/navigation'
import { type Metadata } from 'next'

import { getBoxStyles } from '@/lib/data/boxes'
import { getAuthenticatedProfile } from '@/lib/data/profile'
import { listSavedProducts } from '@/lib/data/saved-products'
import { getActiveProductOptions } from '@/lib/data/products'

import { CustomSpecForm } from './custom-spec-form'
import { SavedProfileCards } from './saved-profile-cards'

export const metadata: Metadata = { title: 'Thùng theo yêu cầu - AI Carton Packaging' }
export const dynamic = 'force-dynamic'

export default async function CustomPage() {
  const profile = await getAuthenticatedProfile()
  if (!profile) redirect('/login')

  const [saved, products, boxStyles] = await Promise.all([
    listSavedProducts(profile.id).catch((error) => {
      console.error('Custom page saved profiles error:', error)
      return []
    }),
    getActiveProductOptions().catch(() => []),
    getBoxStyles(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Thùng theo yêu cầu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.full_name ? `Chào ${profile.full_name}. ` : ''}
          Chọn mẫu đã lưu hoặc tự nhập quy cách — cả hai đều thêm vào giỏ như một sản phẩm.
        </p>
      </div>

      <SavedProfileCards profiles={saved} />
      <CustomSpecForm products={products} boxStyles={boxStyles} />
    </div>
  )
}
