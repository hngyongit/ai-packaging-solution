import Link from 'next/link'
import { redirect } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentProfile } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'
import { listConsultations } from '@/lib/data/consultations-list'
import { listOrders } from '@/lib/data/orders-list'
import { getMonthRevenue, countOpenConsultations } from '@/lib/data/revenue'
import { formatCurrency } from '@/lib/data/order-shared'
import { cn } from '@/lib/utils'
import { StatCard } from './stat-card'

export const dynamic = 'force-dynamic'

interface StatItem {
  title: string
  value: string | number
  href: string
  icon: 'chat' | 'package' | 'trend' | 'warning'
  color: 'amber' | 'blue' | 'emerald' | 'red'
}

export default async function StaffDashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  try {
    assertStaff(profile)
  } catch (error) {
    if (error instanceof ProductAdminError) redirect('/dashboard')
    throw error
  }

  // Parallel fetches
  const [pendingReviews, todayOrders, monthRevenue, openIssues] = await Promise.all([
    listConsultations({ statuses: ['ai_processed'], sortBy: 'created_at', sortOrder: 'desc' }),
    listOrders(profile, new URLSearchParams()),
    getMonthRevenue(),
    countOpenConsultations(),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-500">Dashboard quản lý nhân viên.</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/staff/consultations"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'w-full')}
            >
              Quản lý tư vấn
            </Link>
            <Link
              href="/staff/orders"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'w-full')}
            >
              Xử lý đơn hàng
            </Link>
            <Link
              href="/staff/products"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'w-full')}
            >
              Quản lý sản phẩm
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}