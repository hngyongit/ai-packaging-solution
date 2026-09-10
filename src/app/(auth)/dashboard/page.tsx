import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowClockwise,
  ArrowRight,
  BookmarkSimple,
  MagnifyingGlass,
  Package,
  Spinner,
} from '@phosphor-icons/react/dist/ssr'

import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  formatCurrency,
  getCurrentProfile,
  getCustomerDashboardStats,
  getCustomerOrders,
  getItemSummary,
  type CustomerOrder,
} from '@/lib/data/orders'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  let stats: { totalOrders: number; inProgressOrders: number; savedProducts: number } | null = null
  let recentOrders: CustomerOrder[] = []

  try {
    const [statsResult, ordersResult] = await Promise.all([
      getCustomerDashboardStats(profile.id),
      getCustomerOrders(profile.id, { limit: 5 }),
    ])
    stats = statsResult
    recentOrders = ordersResult.orders
  } catch (error) {
    console.error('Dashboard data error:', error)
  }

  const firstName = profile.full_name?.trim().split(' ').pop()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Xin chào, {firstName || 'bạn'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Chào mừng trở lại</p>
      </div>

      {!stats ? (
        <ErrorState />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard
              icon={<Package className="h-5 w-5 text-blue-600" />}
              label="Tổng đơn hàng"
              value={stats.totalOrders}
            />
            <StatsCard
              icon={<Spinner className="h-5 w-5 text-amber-500" />}
              label="Đang xử lý"
              value={stats.inProgressOrders}
            />
            <StatsCard
              icon={<BookmarkSimple className="h-5 w-5 text-emerald-600" />}
              label="Sản phẩm đã lưu"
              value={stats.savedProducts}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              <MagnifyingGlass className="h-4 w-4" />
              Tư vấn mới
            </Link>
            <Link
              href="/dashboard/reorder"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowClockwise className="h-4 w-4" />
              Đặt lại
            </Link>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Package className="h-4 w-4" />
              Theo dõi đơn
            </Link>
          </div>

          {/* Recent Orders */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Đơn hàng gần đây</h2>
              {recentOrders.length > 0 ? (
                <Link
                  href="/dashboard/orders"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Xem tất cả
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState
                title="Bạn chưa có đơn hàng nào"
                description="Hãy bắt đầu tư vấn để nhận đề xuất đóng gói phù hợp."
                actionHref="/consultation"
                actionLabel="Bắt đầu tư vấn"
                className="py-16"
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Mã đơn hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Ngày đặt
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Số tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          <Link href={`/dashboard/orders/${order.id}`} className="hover:text-blue-600">
                            #{order.order_code}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {getItemSummary(order)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatOrderDate(order.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function StatsCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value))
}
