import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ChatCircle } from '@phosphor-icons/react/dist/ssr'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentProfile } from '@/lib/data/orders'
import { listCustomerConsultations, type CustomerConsultationRow } from '@/lib/data/customer-consultations'
import { ConsultationCard } from './consultation-card'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type Params = { searchParams?: Record<string, string | string[] | undefined> }

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | string[] | undefined) {
  const p = Number(getParam(value))
  return p > 0 ? p : 1
}

function getStatusLabel(status: string) {
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

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ AI' },
  { value: 'ai_processed', label: 'AI xử lý xong' },
  { value: 'pending_review', label: 'Chờ review' },
  { value: 'staff_reviewed', label: 'Nhân viên duyệt' },
  { value: 'quoted', label: 'Đã báo giá' },
  { value: 'converted', label: 'Đã chuyển đơn' },
  { value: 'closed', label: 'Đã đóng' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const

export default async function CustomerConsultationsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const resolved = await searchParams
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'customer') redirect('/dashboard')

  const statusFilter = getParam(resolved?.searchParams?.status) ?? ''
  const page = parsePage(resolved?.searchParams?.page)

  let consultations: CustomerConsultationRow[] = []
  let pagination: { total: number; page: number; totalPages: number } = { total: 0, page: 1, totalPages: 1 }
  let error: string | null = null

  try {
    console.log('[Consultations Page] Loading for profile:', profile.id, 'role:', profile.role)
    const result = await listCustomerConsultations(profile.id, {
      status: statusFilter || undefined,
      page,
      perPage: 10,
    })
    console.log('[Consultations Page] Result:', result)
    consultations = result.data
    pagination = result.pagination
  } catch (e) {
    console.error('[Consultations Page] Error loading:', e)
    error = e instanceof Error ? e.message : 'Không thể tải danh sách tư vấn'
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Quay lại dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lịch sử tư vấn</h1>
        <p className="mt-1 text-sm text-gray-500">Theo dõi trạng thái các yêu cầu tư vấn của bạn.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/consultations${f.value ? `?status=${f.value}` : ''}`}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              (f.value === statusFilter)
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {consultations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <ChatCircle className="h-12 w-12 text-gray-300" weight="light" />
              <div>
                <p className="font-medium text-gray-700">Chưa có tư vấn nào</p>
                <p className="text-sm text-gray-500">
                  Hãy thử đặt thùng theo yêu cầu để được tư vấn!
                </p>
              </div>
              <Link href="/shop" className={cn(buttonVariants({ size: 'sm' }))}>
                Bắt đầu tư vấn
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <ConsultationCard key={c.id} c={c} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/consultations?page=${p}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
