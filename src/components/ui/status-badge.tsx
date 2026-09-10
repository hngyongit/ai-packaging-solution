import { getOrderStatusLabel, type OrderStatus } from '@/lib/data/order-shared'
import { cn } from '@/lib/utils'

function getStatusClassName(status: OrderStatus) {
  if (status === 'cancelled') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'completed' || status === 'delivered') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'production' || status === 'deposit_paid') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        getStatusClassName(status)
      )}
    >
      {getOrderStatusLabel(status)}
    </span>
  )
}
