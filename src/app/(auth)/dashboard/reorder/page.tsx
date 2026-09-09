import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

import { canReorderOrder, getCurrentProfile, getCustomerOrderById, getCustomerOrders } from '@/lib/data/orders'
import ReorderForm from './reorder-form'

type ReorderPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function ReorderPage({ searchParams }: ReorderPageProps) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const rawId = getParam(searchParams.id)
  if (rawId && !UUID_PATTERN.test(rawId)) notFound()

  if (profile.role !== 'customer') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Đặt lại</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Tính năng đặt lại chỉ dành cho tài khoản khách hàng.
        </div>
      </div>
    )
  }

  const [selectedOrder, recent] = await Promise.all([
    rawId ? getCustomerOrderById(profile.id, rawId) : Promise.resolve(null),
    getCustomerOrders(profile.id, { historyOnly: true, limit: 8 }),
  ])

  if (rawId && !selectedOrder) notFound()
  if (selectedOrder && !canReorderOrder(selectedOrder.status)) notFound()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách đơn hàng
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đặt lại</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo đơn hàng mới từ đơn cũ, dùng giá hiện tại do server tính lại.
          </p>
        </div>
      </div>

      <ReorderForm key={selectedOrder?.id ?? 'recent'} selectedOrder={selectedOrder} recentOrders={recent.orders} />
    </div>
  )
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
