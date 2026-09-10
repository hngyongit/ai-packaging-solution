import Link from 'next/link'
import { ArrowRight, Clock, Package, Receipt } from '@phosphor-icons/react/dist/ssr'

import { buttonVariants } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import {
  canCustomerCancelOrder,
  canReorderOrder,
  formatCurrency,
  formatDateTime,
  getItemSummary,
  getOrderProgress,
  getPaymentStatusLabel,
  type CustomerOrder,
} from '@/lib/data/order-shared'
import { CancelOrderButton } from './cancel-order-button'

export { StatusBadge }

type SearchParams = Record<string, string | string[] | undefined>

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'staff_review', label: 'Đang duyệt' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'production', label: 'Đang sản xuất' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export const HISTORY_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'delivered', label: 'Đã giao' },
]

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function buildHref(pathname: string, params: SearchParams, updates: Record<string, string | number | null>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    const current = getParam(value)
    if (current) query.set(key, current)
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === '') query.delete(key)
    else query.set(key, String(value))
  }

  const queryString = query.toString()
  return queryString ? `${pathname}?${queryString}` : pathname
}

export function PaymentBadge({ status }: { status: string | null | undefined }) {
  const className =
    status === 'paid' || status === 'deposit_paid'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-gray-200 bg-gray-50 text-gray-700'

  return (
    <span
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        className
      )}
    >
      {getPaymentStatusLabel(status)}
    </span>
  )
}

export function OrdersToolbar({
  pathname,
  searchParams,
  activeStatus,
  placeholder = 'Tìm theo mã đơn hàng',
  filters = FILTERS,
}: {
  pathname: string
  searchParams: SearchParams
  activeStatus?: string | null
  placeholder?: string
  filters?: { value: string; label: string }[]
}) {
  const search = getParam(searchParams.search) ?? ''

  return (
    <div className="space-y-3">
      <form action={pathname} className="flex flex-col gap-2 sm:flex-row">
        {activeStatus ? <input type="hidden" name="status" value={activeStatus} /> : null}
        <input
          name="search"
          defaultValue={search}
          placeholder={placeholder}
          className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-sm md:text-sm"
        />
        <button className={cn(buttonVariants({ size: 'lg' }), 'sm:w-auto')} type="submit">
          Tìm kiếm
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <Link
            key={filter.value || 'all'}
            href={buildHref(pathname, searchParams, { status: filter.value || null, page: null })}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm transition-colors',
              (activeStatus ?? '') === filter.value
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function OrderCard({
  order,
  pathname = '/dashboard/orders',
  searchParams = {},
  showReorder = false,
}: {
  order: CustomerOrder
  pathname?: string
  searchParams?: SearchParams
  showReorder?: boolean
}) {
  const progress = getOrderProgress(order.status)
  const canReorder = showReorder && canReorderOrder(order.status)
  const canCancel = canCustomerCancelOrder(order.status)

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            {order.order_code}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDateTime(order.created_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="h-4 w-4" />
              {getItemSummary(order)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn('h-full rounded-full', order.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600')}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Tổng tiền</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(order.total_amount)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCancel ? <CancelOrderButton orderId={order.id} orderCode={order.order_code} /> : null}
            {canReorder ? (
              <Link
                href={`/dashboard/reorder?id=${order.id}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
              >
                Đặt lại
              </Link>
            ) : null}
            <Link
              href={buildHref(pathname, searchParams, { orderId: order.id, modal: null })}
              className={cn(buttonVariants({ size: 'lg' }))}
              scroll={false}
            >
              Chi tiết
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrdersPagination({
  pathname,
  searchParams,
  page,
  totalPages,
}: {
  pathname: string
  searchParams: SearchParams
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={buildHref(pathname, searchParams, { page: Math.max(page - 1, 1) })}
        aria-disabled={page <= 1}
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), page <= 1 && 'pointer-events-none opacity-50')}
      >
        Trước
      </Link>
      <p className="text-sm text-muted-foreground">
        Trang {page} / {totalPages}
      </p>
      <Link
        href={buildHref(pathname, searchParams, { page: Math.min(page + 1, totalPages) })}
        aria-disabled={page >= totalPages}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          page >= totalPages && 'pointer-events-none opacity-50'
        )}
      >
        Sau
      </Link>
    </div>
  )
}

export function OrdersEmptyState({
  title,
  description,
  actionHref = '/order',
  actionLabel = 'Tạo đơn hàng',
}: {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}) {
  return <EmptyState title={title} description={description} actionHref={actionHref} actionLabel={actionLabel} />
}

export function OrdersErrorState() {
  return (
    <ErrorState
      title="Không thể tải danh sách đơn hàng"
      description="Vui lòng làm mới trang hoặc thử lại sau."
    />
  )
}
