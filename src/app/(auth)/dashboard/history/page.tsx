import { redirect } from 'next/navigation'

import { getCurrentProfile, getCustomerOrders, parsePage } from '@/lib/data/orders'
import {
  HISTORY_FILTERS,
  OrderCard,
  OrdersEmptyState,
  OrdersErrorState,
  OrdersPagination,
  OrdersToolbar,
} from '../orders/order-ui'

type HistoryPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const requestedStatus = getParam(searchParams.status)
  const activeStatus = requestedStatus === 'completed' || requestedStatus === 'delivered' ? requestedStatus : null

  try {
    const { orders, pagination } = await getCustomerOrders(profile.id, {
      page: parsePage(searchParams.page),
      status: activeStatus,
      search: getParam(searchParams.search),
      historyOnly: true,
      limit: 10,
    })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch sử đơn hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">Xem lại các đơn hàng đã hoàn thành hoặc đã giao.</p>
        </div>

        <OrdersToolbar
          pathname="/dashboard/history"
          searchParams={searchParams}
          activeStatus={activeStatus}
          placeholder="Tìm đơn hàng đã hoàn thành"
          filters={HISTORY_FILTERS}
        />

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} showReorder />
            ))}
          </div>
        ) : (
          <OrdersEmptyState
            title="Chưa có lịch sử đơn hàng"
            description="Đơn hàng đã hoàn thành hoặc đã giao sẽ xuất hiện tại đây."
            actionHref="/dashboard/orders"
            actionLabel="Xem đơn hàng hiện tại"
          />
        )}

        <OrdersPagination
          pathname="/dashboard/history"
          searchParams={searchParams}
          page={pagination.page}
          totalPages={pagination.totalPages}
        />
      </div>
    )
  } catch (error) {
    console.error('Order history page error:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch sử đơn hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">Xem lại các đơn hàng đã hoàn thành hoặc đã giao.</p>
        </div>
        <OrdersErrorState />
      </div>
    )
  }
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
