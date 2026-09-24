import Link from 'next/link'
import { redirect } from 'next/navigation'

import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { getCurrentProfile, formatCurrency } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'
import { listConsultations } from '@/lib/data/consultations-list'
import { listOrders } from '@/lib/data/orders-list'
import { getMonthRevenue, countOpenConsultations } from '@/lib/data/revenue'
import { StatCard } from './stat-card'
import {
  WarningCircle,
  ArrowRight,
  MagnifyingGlass,
  ShoppingCart,
  Package,
} from '@phosphor-icons/react/dist/ssr'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatItem {
  title: string
  value: string | number
  href: string
  icon: 'chat' | 'package' | 'trend' | 'warning'
  color: 'amber' | 'blue' | 'emerald' | 'red'
}

interface ActionShortcut {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}

// ---------------------------------------------------------------------------
// Helper: time-based greeting
// ---------------------------------------------------------------------------

function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buổi sáng'
  if (hour < 18) return 'Buổi chiều'
  return 'Buối tối'
}

function formatDate() {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date())
}

// ---------------------------------------------------------------------------
// Server Component
// ---------------------------------------------------------------------------

export default async function StaffDashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  try {
    assertStaff(profile)
  } catch (error) {
    if (error instanceof ProductAdminError) redirect('/dashboard')
    throw error
  }

  const firstName = profile.full_name?.trim().split(' ').pop()
  const greeting = getTimeGreeting()
  const today = formatDate()

  // Parallel fetches — load perPage=5 for recent tables
  const [
    pendingReviews,
    todayOrders,
    monthRevenue,
    openIssues,
    recentConsultations,
    recentOrders,
  ] = await Promise.all([
    listConsultations({ statuses: ['ai_processed'], sortBy: 'created_at', sortOrder: 'desc' }),
    listOrders(profile, new URLSearchParams()),
    getMonthRevenue(),
    countOpenConsultations(),
    listConsultations({ sortBy: 'created_at', sortOrder: 'desc', perPage: 5 }),
    listOrders(profile, new URLSearchParams({ limit: '5' })),
  ])

  const statItems: StatItem[] = [
    {
      title: 'Chờ xem xét',
      value: pendingReviews.pagination.total,
      href: '/staff/consultations?status=ai_processed',
      icon: 'chat',
      color: 'amber',
    },
    {
      title: 'Đơn hôm nay',
      value: todayOrders.data.length,
      href: '/staff/orders',
      icon: 'package',
      color: 'blue',
    },
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(monthRevenue),
      href: '/staff/orders?sort=created_at:desc',
      icon: 'trend',
      color: 'emerald',
    },
    {
      title: 'Vấn đề mở',
      value: openIssues,
      href: '/staff/consultations',
      icon: 'warning',
      color: 'red',
    },
  ]

  const actionShortcuts: ActionShortcut[] = [
    {
      title: 'Quản lý tư vấn',
      description: 'Xem và xử lý yêu cầu tư vấn',
      href: '/staff/consultations',
      icon: <MagnifyingGlass className="h-5 w-5 text-blue-600" />,
    },
    {
      title: 'Xử lý đơn hàng',
      description: 'Kiểm tra và phê duyệt đơn hàng',
      href: '/staff/orders',
      icon: <ShoppingCart className="h-5 w-5 text-amber-600" />,
    },
    {
      title: 'Quản lý sản phẩm',
      description: 'Danh mục, giá và tồn kho',
      href: '/staff/products',
      icon: <Package className="h-5 w-5 text-emerald-600" />,
    },
  ]

  return (
    <div className="space-y-8">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950">
          {greeting}, {firstName || 'bạn'}
          <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-gray-400">
            {today}
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Tổng quan hoạt động bán hàng hôm nay.</p>
      </div>

      {/* ── Alert Banner ─────────────────────────────────────── */}
      {pendingReviews.pagination.total > 0 && (
        <Link
          href="/staff/consultations?status=ai_processed"
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
        >
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Có {pendingReviews.pagination.total} tư vấn cần xem xét</p>
            <p className="text-sm text-amber-700">AI đã phân tích xong — bạn cần kiểm tra và phê duyệt trước khi gửi báo giá.</p>
          </div>
        </Link>
      )}

      {/* ── Stats Cards ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      {/* ── Action Shortcuts ─────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-950">Thao tác nhanh</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {actionShortcuts.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition-colors group-hover:bg-blue-50">
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-950">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Consultations ─────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-950">Tư vấn gần đây</h2>
          {recentConsultations.data.length > 0 ? (
            <Link
              href="/staff/consultations"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        {recentConsultations.data.length === 0 ? (
          <EmptyState
            title="Chưa có tư vấn nào"
            description="Các yêu cầu tư vấn mới sẽ hiển thị ở đây."
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sản phẩm
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                    Kích thước
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentConsultations.data.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {c.customer_name || <span className="text-gray-400 italic">Ẩn danh</span>}
                      {c.customer_email && (
                        <span className="ml-1 block max-w-[180px] truncate text-gray-400">{c.customer_email}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {c.product_type}
                      {c.box_style && (
                        <span className="ml-1 text-xs text-gray-400">— {c.box_style}</span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
                      {(() => {
                        const dims = c.ai_suggested_dimensions
                          ? `${c.ai_suggested_dimensions.length}×${c.ai_suggested_dimensions.width}×${c.ai_suggested_dimensions.height}`
                          : c.product_length
                            ? `${c.product_length}×${c.product_width}×${c.product_height}`
                            : null
                        return dims || '—'
                      })()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={c.status as any} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        timeZone: 'Asia/Ho_Chi_Minh',
                      }).format(new Date(c.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Recent Orders ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-950">Đơn hàng gần đây</h2>
          {recentOrders.data.length > 0 ? (
            <Link
              href="/staff/orders"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        {recentOrders.data.length === 0 ? (
          <EmptyState
            title="Chưa có đơn hàng nào"
            description="Các đơn hàng mới sẽ hiển thị ở đây."
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Khách hàng
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Trạng thái
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.data.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono font-medium text-gray-900">
                      <Link href={`/staff/orders/${o.id}`} className="hover:text-blue-600 transition-colors">
                        {o.order_code}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {o.contact_name || o.customer?.full_name || '—'}
                      {(o.contact_phone || o.customer?.phone) && (
                        <span className="ml-1 block max-w-[160px] truncate text-gray-400">
                          {o.contact_phone || o.customer?.phone}
                        </span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
                      {o.items?.map((item: any) => item.product_name).join(', ') || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={o.status as any} />
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 sm:table-cell">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        timeZone: 'Asia/Ho_Chi_Minh',
                      }).format(new Date(o.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
