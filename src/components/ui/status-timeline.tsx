import {
  CheckCircle,
  ClipboardText,
  CurrencyCircleDollar,
  Factory,
  Package,
  SealCheck,
  Truck,
} from '@phosphor-icons/react/dist/ssr'

import { Card, CardContent } from '@/components/ui/card'
import {
  ORDER_STATUS_SEQUENCE,
  getOrderStatusLabel,
  type CustomerOrderDetail,
  type OrderStatus,
} from '@/lib/data/order-shared'
import { cn } from '@/lib/utils'

const TIMELINE_STATUSES = ORDER_STATUS_SEQUENCE.filter(
  (status): status is Exclude<OrderStatus, 'cancelled'> => status !== 'cancelled'
)

export function StatusTimeline({ order }: { order: CustomerOrderDetail }) {
  const activeStatus =
    order.status === 'cancelled'
      ? [...order.order_status_history].reverse().find((history) => history.to_status !== 'cancelled')?.to_status ??
        'pending'
      : order.status
  const activeIndex = Math.max(TIMELINE_STATUSES.indexOf(activeStatus as Exclude<OrderStatus, 'cancelled'>), 0)

  return (
    <Card className="mx-auto w-full max-w-5xl rounded-lg border-gray-200 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
      <CardContent className="px-4 py-8 sm:px-8">
        <div className="overflow-x-auto pb-1">
          <ol className="grid min-w-[760px] grid-cols-7">
            {TIMELINE_STATUSES.map((status, index) => {
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
                  {index < TIMELINE_STATUSES.length - 1 ? (
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
