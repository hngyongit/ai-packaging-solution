import Link from 'next/link'
import { redirect } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getCurrentProfile } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'
import { listCustomers } from '@/lib/data/customers'
import { formatCurrency, formatDateTime } from '@/lib/data/order-shared'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function StaffCustomersPage({
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

  const search = typeof searchParams.search === 'string' ? searchParams.search : ''
  const page = typeof searchParams.page === 'string' ? searchParams.page : '1'

  const { data: customers, pagination } = await listCustomers(
    parseInt(page) || 1,
    20,
    search || undefined
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-950">Khách hàng</h1>
        <p className="mt-1 text-sm text-gray-500">Quản lý thông tin khách hàng.</p>
      </div>

      {/* Search bar */}
      <form action="/staff/customers" method="get" className="flex gap-2">
        <input
          type="text"
          name="search"
          placeholder="Tìm theo tên, SĐT, công ty..."
          defaultValue={search}
          className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}
        >
          Tìm
        </button>
        {search && (
          <Link
            href="/staff/customers"
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'shrink-0')}
          >
            Xóa
          </Link>
        )}
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title="Không có khách hàng nào"
          description="Khách hàng mới sẽ xuất hiện tại đây."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tên</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SĐT</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Công ty</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Đơn hàng</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Doanh thu</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Đơn cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {c.full_name ?? '—'}
                      {c.email ? <span className="block text-xs text-gray-500">{c.email}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.company_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(c.total_spent)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.last_order_at ? formatDateTime(c.last_order_at) : '—'}
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
            <Link
              href={`/staff/customers?${qs(search, pagination.page - 1)}`}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Trước
            </Link>
          )}
          <span className="text-gray-500">
            Trang {pagination.page}/{pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages && (
            <Link
              href={`/staff/customers?${qs(search, pagination.page + 1)}`}
              className="text-blue-600 hover:text-blue-700"
            >
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function qs(search: string, page: number) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  return params.toString()
}