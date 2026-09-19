import Link from 'next/link'
import { redirect } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { getCurrentProfile } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'
import { listOrders } from '@/lib/data/orders-list'
import { toNumber, formatCurrency, formatDateTime } from '@/lib/data/order-shared'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STAFF_FILTERS = [
  ['', 'Tất cả'],
  ['pending', 'Chờ xử lý'],
  ['staff_review', 'Đang duyệt'],
  ['confirmed', 'Đã chốt'],
  ['production', 'Đang sản xuất'],
] as const

export default async function StaffOrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  try {
    assertStaff(profile)
  } catch (error) {
    if (error instanceof ProductAdminError) redirect('/dashboard')
    throw error
  }

  const params = new URLSearchParams()
  const status = typeof searchParams.status === 'string' ? searchParams.status : ''
  if (status) params.set('status', status)
  const page = typeof searchParams.page === 'string' ? searchParams.page : '1'
  params.set('page', page)

  const { data: orders, pagination } = await listOrders(profile, params)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-950">Đơn hàng</h1>
        <p className="mt-1 text-sm text-gray-500">Chốt đơn để trừ tồn kho và đưa sang sản xuất.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STAFF_FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/staff/orders?status=${value}` : '/staff/orders'}
            className={cn(
              buttonVariants({ size: 'sm', variant: (status || '') === value ? 'default' : 'outline' }),
              'rounded-full'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng"
          description="Đơn từ giỏ hàng và form đặt hàng sẽ xuất hiện tại đây."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã đơn</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Khách hàng</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Tổng tiền</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tạo lúc</th>
                  <th scope="col" className="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.order_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {order.contact_name ?? '—'}
                      {order.contact_phone ? <span className="block text-xs text-gray-500">{order.contact_phone}</span> : null}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(toNumber(order.total_amount))}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/staff/orders/${order.id}`} className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}>
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {pagination.page > 1 && (
            <Link href={`/staff/orders?${qs(status, pagination.page - 1)}`} className="text-blue-600 hover:text-blue-700">
              ← Trước
            </Link>
          )}
          <span className="text-gray-500">
            Trang {pagination.page}/{pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages && (
            <Link href={`/staff/orders?${qs(status, pagination.page + 1)}`} className="text-blue-600 hover:text-blue-700">
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function qs(status: string, page: number) {
  return new URLSearchParams({ ...(status ? { status } : {}), page: String(page) }).toString()
}
