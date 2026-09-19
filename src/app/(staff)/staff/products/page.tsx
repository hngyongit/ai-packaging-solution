import { redirect } from 'next/navigation'

import { assertStaff, listAllProducts, ProductAdminError } from '@/lib/data/products-admin'
import { getCurrentProfile } from '@/lib/data/orders'

import { StaffProductsTable, type StaffProductRow } from './products-table'

export const dynamic = 'force-dynamic'

export default async function StaffProductsPage() {
  const profile = await getCurrentProfile()
  try {
    assertStaff(profile)
  } catch (error) {
    if (error instanceof ProductAdminError) {
      if (error.status === 401) redirect('/login')
      redirect('/dashboard')
    }
    throw error
  }

  const rows = (await listAllProducts()) as unknown as StaffProductRow[]
  return <StaffProductsTable products={rows} />
}
