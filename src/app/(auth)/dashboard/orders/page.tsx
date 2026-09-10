import Link from 'next/link'
import { redirect } from 'next/navigation'

import { buttonVariants } from '@/components/ui/Button'
import { getCurrentProfile, getCustomerOrderById, getCustomerOrders, isOrderStatus, parsePage } from '@/lib/data/orders'
import { getActiveProductOptions } from '@/lib/data/products'
import { cn } from '@/lib/utils'
import { OrdersUrlModals } from './order-modals'
import { buildHref, OrderCard, OrdersEmptyState, OrdersErrorState, OrdersPagination, OrdersToolbar } from './order-ui'

type OrdersPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = searchParams
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const activeStatus = isOrderStatus(getParam(params.status)) ? getParam(params.status) : null

  try {
    const { orders, pagination } = await getCustomerOrders(profile.id, {
      page: parsePage(params.page),
      status: activeStatus,
      search: getParam(params.search),
      limit: 10,
    })
    const products = await getActiveProductOptions()
    const orderId = getParam(params.orderId)
    const selectedOrder = orderId && UUID_PATTERN.test(orderId) ? await getCustomerOrderById(profile.id, orderId) : null

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Đơn hàng của tôi</h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi đơn hàng đóng gói và trạng thái thanh toán.</p>
          </div>
          <Link
            href={buildHref('/dashboard/orders', params, { modal: 'create', orderId: null })}
            className={cn(buttonVariants({ size: 'lg' }), 'w-fit')}
            scroll={false}
          >
            Tạo đơn hàng
          </Link>
        </div>

        <OrdersToolbar pathname="/dashboard/orders" searchParams={params} activeStatus={activeStatus} />

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} pathname="/dashboard/orders" searchParams={params} />
            ))}
          </div>
        ) : (
          <OrdersEmptyState
            title="Chưa có đơn hàng"
            description="Các đơn hàng bạn tạo từ form đặt hàng hoặc đặt lại sẽ xuất hiện tại đây."
          />
        )}

        <OrdersPagination
          pathname="/dashboard/orders"
          searchParams={params}
          page={pagination.page}
          totalPages={pagination.totalPages}
        />

        <OrdersUrlModals products={products} selectedOrder={selectedOrder} />
      </div>
    )
  } catch (error) {
    console.error('Dashboard orders page error:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đơn hàng của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi đơn hàng đóng gói và trạng thái thanh toán.</p>
        </div>
        <OrdersErrorState />
      </div>
    )
  }
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
