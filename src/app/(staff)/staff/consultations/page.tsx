import Link from 'next/link'
import { redirect } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ConsultationStatusBadge } from '@/components/ui/consultation-status-badge'
import { getCurrentProfile } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'
import { listConsultations } from '@/lib/data/consultations-list'
import { formatDateTime } from '@/lib/data/order-shared'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const CONSULTATION_STATUS_FILTERS = [
  ['', 'Tất cả'],
  ['ai_processed', 'Chờ xem xét'],
  ['staff_reviewed', 'Đã duyệt'],
  ['quoted', 'Đang báo giá'],
  ['converted', 'Đã chuyển thành đơn'],
  ['closed', 'Đã đóng'],
] as const

function getConsultationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Chờ AI',
    ai_processed: 'AI xử lý xong',
    pending_review: 'Chờ review',
    staff_reviewed: 'Nhân viên duyệt',
    quoted: 'Đã báo giá',
    converted: 'Đã chuyển đơn',
    closed: 'Đã đóng',
    cancelled: 'Đã hủy',
  }
  return labels[status] ?? status
}

export default async function StaffConsultationsPage({
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
  const search = typeof searchParams.search === 'string' ? searchParams.search : ''
  if (search) params.set('search', search)
  const page = typeof searchParams.page === 'string' ? searchParams.page : '1'
  params.set('page', page)

  const { data: consultations, pagination } = await listConsultations({
    status: status || undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: parseInt(page) || 1,
    perPage: 20,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-950">Tư vấn</h1>
        <p className="mt-1 text-sm text-gray-500">Duyệt và hỗ trợ khách hàng qua tư vấn.</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {CONSULTATION_STATUS_FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/staff/consultations?status=${value}` : '/staff/consultations'}
            className={cn(
              buttonVariants({ size: 'sm', variant: (status || '') === value ? 'default' : 'outline' }),
              'rounded-full'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Search bar */}
      <form action="/staff/consultations" method="get" className="flex gap-2">
        <input
          type="text"
          name="search"
          placeholder="Tìm theo sản phẩm, tên..."
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
            href={`/staff/consultations${status ? `?status=${status}` : ''}`}
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'shrink-0')}
          >
            Xóa
          </Link>
        )}
      </form>

      {consultations.length === 0 ? (
        <EmptyState
          title="Không có tư vấn nào"
          description="Các yêu cầu tư vấn từ khách hàng sẽ xuất hiện tại đây."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã TV</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sản phẩm</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Liên hệ</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Người xử lý</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tạo lúc</th>
                  <th scope="col" className="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {consultations.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {c.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.product_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {c.customer_name ?? '—'}
                      {c.customer_phone ? <span className="block text-xs text-gray-500">{c.customer_phone}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <ConsultationStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {c.assigned_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(c.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/staff/consultations/${c.id}`}
                        className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                      >
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
            <Link
              href={`/staff/consultations?${qs(status, search, pagination.page - 1)}`}
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
              href={`/staff/consultations?${qs(status, search, pagination.page + 1)}`}
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

function qs(status: string, search: string, page: number) {
  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  return params.toString()
}