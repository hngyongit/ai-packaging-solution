import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  ArrowClockwise,
  CalendarCheck,
  CheckCircle,
  ClipboardText,
  CurrencyCircleDollar,
  Factory,
  MapPin,
  Package,
  SealCheck,
  Truck,
} from '@phosphor-icons/react/dist/ssr'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ORDER_STATUS_SEQUENCE,
  canCustomerCancelOrder,
  canReorderOrder,
  formatCurrency,
  formatDateTime,
  getCurrentProfile,
  getCustomerOrderById,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  toNumber,
  type CustomerOrderDetail,
  type OrderStatus,
} from '@/lib/data/orders'
import { cn } from '@/lib/utils'
import { CancelOrderButton } from '../cancel-order-button'
import { PaymentBadge, StatusBadge } from '../order-ui'

type OrderDetailPageProps = {
  params: { id: string }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  if (!UUID_PATTERN.test(params.id)) notFound()

  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const order = await getCustomerOrderById(profile.id, params.id)
  if (!order) notFound()

  const fee = toNumber(order.delivery_fee)
  const itemTotal = order.order_items.reduce((sum, item) => sum + toNumber(item.subtotal), 0)
  const canReorder = canReorderOrder(order.status)
  const canCancel = canCustomerCancelOrder(order.status)

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div>
          <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách đơn hàng
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">Theo dõi tiến độ yêu cầu</h1>
          <p className="mt-4 text-sm text-gray-600">
            Mã yêu cầu: <span className="font-semibold text-gray-950">#{order.order_code}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">Tạo lúc {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <OrderProgressTimeline order={order} />

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">{item.product_code}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{formatDimensions(item.dimensions)}</p>
                      {item.notes ? <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p> : null}
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">Số lượng {item.quantity}</p>
                      <p className="font-medium text-foreground">{formatCurrency(item.subtotal)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)} / sản phẩm</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Tiền hàng" value={formatCurrency(itemTotal)} />
              <SummaryRow label="Phí giao hàng" value={formatCurrency(fee)} />
              <SummaryRow label="Tiền cọc" value={formatCurrency(order.deposit_amount)} />
              <div className="h-px bg-border" />
              <SummaryRow label="Tổng cộng" value={formatCurrency(order.total_amount)} strong />
              <SummaryRow label="Thanh toán" value={getPaymentMethodLabel(order.payment_method)} />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Liên hệ và giao nhận</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <CalendarCheck className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium text-foreground">{order.contact_name ?? 'Chưa có tên liên hệ'}</p>
                  <p className="text-muted-foreground">{order.contact_phone ?? 'Chưa có số điện thoại'}</p>
                  <p className="text-muted-foreground">{order.contact_email ?? 'Chưa có email'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium text-foreground">{formatDeliveryMethod(order.delivery_method)}</p>
                  <p className="text-muted-foreground">{order.delivery_address ?? 'Chưa có địa chỉ giao hàng'}</p>
                </div>
              </div>
              {order.notes ? <p className="rounded-lg bg-gray-50 p-3 text-muted-foreground">{order.notes}</p> : null}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
            {canReorder ? (
              <Link href={`/dashboard/reorder?id=${order.id}`} className={cn(buttonVariants({ size: 'lg' }))}>
                <ArrowClockwise className="h-4 w-4" />
                Đặt lại
              </Link>
            ) : null}
            <Link href="/dashboard/orders" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Tất cả đơn hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderProgressTimeline({ order }: { order: CustomerOrderDetail }) {
  const statuses = ORDER_STATUS_SEQUENCE.filter((status): status is Exclude<OrderStatus, 'cancelled'> => status !== 'cancelled')
  const activeStatus =
    order.status === 'cancelled'
      ? [...order.order_status_history].reverse().find((history) => history.to_status !== 'cancelled')?.to_status ?? 'pending'
      : order.status
  const activeIndex = Math.max(statuses.indexOf(activeStatus as Exclude<OrderStatus, 'cancelled'>), 0)

  return (
    <Card className="mx-auto w-full max-w-5xl rounded-lg border-gray-200 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
      <CardContent className="px-4 py-8 sm:px-8">
        <div className="overflow-x-auto pb-1">
          <ol className="grid min-w-[760px] grid-cols-7">
            {statuses.map((status, index) => {
              const isPast = order.status !== 'cancelled' && index < activeIndex
              const isCurrent = order.status !== 'cancelled' && index === activeIndex
              const isReached = isPast || isCurrent
              const event = order.order_status_history.find((history) => history.to_status === status)
              const label = getOrderStatusLabel(status)
              const dateLabel = event?.created_at
                ? formatTimelineDate(event.created_at)
                : status === 'pending'
                  ? formatTimelineDate(order.created_at)
                  : 'Đang chờ'

              return (
                <li key={status} className="relative flex flex-col items-center px-2 text-center">
                  {index < statuses.length - 1 ? (
                    <span
                      className={cn(
                        'absolute left-1/2 top-4 h-0.5 w-full',
                        index < activeIndex && order.status !== 'cancelled' ? 'bg-gray-950' : 'bg-gray-200'
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-white',
                      isPast && 'border-gray-950 bg-gray-950 text-white',
                      isCurrent && 'border-blue-600 text-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]',
                      !isReached && 'border-gray-200 text-gray-400'
                    )}
                  >
                    {renderTimelineIcon(status)}
                  </span>
                  <span
                    className={cn(
                      'mt-3 max-w-28 text-xs font-semibold leading-4',
                      isPast && 'text-gray-950',
                      isCurrent && 'text-blue-600',
                      !isReached && 'text-gray-500'
                    )}
                  >
                    {label}
                  </span>
                  <span className={cn('mt-1 text-[11px] leading-4', isCurrent ? 'text-blue-600' : 'text-gray-500')}>
                    {dateLabel}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
        {order.status === 'cancelled' ? (
          <p className="mt-5 text-center text-sm font-medium text-red-600">
            Đơn hàng đã hủy vào {formatTimelineDate(order.updated_at)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function renderTimelineIcon(status: OrderStatus) {
  const className = 'h-4 w-4'

  switch (status) {
    case 'pending':
      return <CheckCircle className={className} weight="bold" />
    case 'staff_review':
      return <Package className={className} weight="bold" />
    case 'confirmed':
      return <ClipboardText className={className} weight="bold" />
    case 'deposit_paid':
      return <CurrencyCircleDollar className={className} weight="bold" />
    case 'production':
      return <Factory className={className} weight="bold" />
    case 'completed':
      return <SealCheck className={className} weight="bold" />
    case 'delivered':
      return <Truck className={className} weight="bold" />
    case 'cancelled':
      return <CheckCircle className={className} weight="bold" />
  }
}

function formatTimelineDate(value: string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value))
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(strong && 'text-lg font-semibold text-foreground')}>{value}</span>
    </div>
  )
}

function formatDimensions(dimensions: Record<string, unknown> | null) {
  if (!dimensions) return 'Chưa có kích thước'
  const length = dimensions.length
  const width = dimensions.width
  const height = dimensions.height
  if (!length || !width || !height) return 'Kích thước tùy chỉnh'
  return `${length} x ${width} x ${height} cm`
}

function formatDeliveryMethod(method: string | null) {
  if (method === 'delivery') return 'Giao hàng'
  if (method === 'pickup') return 'Nhận tại xưởng'
  return 'Chưa chọn phương thức giao nhận'
}
