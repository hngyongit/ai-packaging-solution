import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CalendarCheck, MapPin } from '@phosphor-icons/react/dist/ssr'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatusTimeline } from '@/components/ui/status-timeline'
import { formatCurrency, formatDateTime, getPaymentMethodLabel, toNumber } from '@/lib/data/order-shared'
import { getStaffOrderById } from '@/lib/data/orders-list'
import { getCurrentProfile } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'
import { getStatusMetadata } from '@/lib/data/orders-status'
import { cn } from '@/lib/utils'

import { StaffOrderActions } from './staff-order-actions'

export const dynamic = 'force-dynamic'

type OrderItemRow = {
  id: string
  product_name: string
  product_code: string
  quantity: number
  unit_price: number | string
  subtotal: number | string
  dimensions: Record<string, unknown> | null
  is_custom?: boolean | null
  product: { stock_quantity: number | null } | null
}

export default async function StaffOrderDetailPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile()
  try {
    assertStaff(profile)
  } catch (error) {
    if (error instanceof ProductAdminError) redirect(error.status === 401 ? '/login' : '/dashboard')
    throw error
  }

  const order = await getStaffOrderById(params.id).catch(() => null)
  if (!order) notFound()

  const metadata = getStatusMetadata(profile.role, { ...order, status: order.status })
  const items: OrderItemRow[] = order.order_items ?? []
  const itemTotal = items.reduce((sum: number, item) => sum + toNumber(item.subtotal), 0)
  const stockSummary = summarizeStock(items)

  return (
    <div className="space-y-6">
      <Link href="/staff/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Danh sách đơn hàng
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">#{order.order_code}</h1>
          <p className="mt-1 text-sm text-gray-500">Tạo lúc {formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="font-mono text-xs text-gray-500">{item.product_code}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDims(item.dimensions)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{item.quantity} thùng</p>
                    <p className="text-xs text-gray-500">{formatCurrency(toNumber(item.subtotal))}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <StatusTimeline order={order} />
        </div>

        <div className="space-y-6">
          <StaffOrderActions
            orderId={order.id}
            status={order.status}
            stockSummary={stockSummary}
            allowedTransitions={metadata.allowedTransitions}
          />

          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Tiền hàng" value={formatCurrency(itemTotal)} />
              <Row label="Phí giao hàng" value={formatCurrency(toNumber(order.delivery_fee))} />
              <Row label="Cọc" value={formatCurrency(toNumber(order.deposit_amount))} />
              <div className="h-px bg-gray-200" />
              <Row label="Tổng cộng" value={formatCurrency(toNumber(order.total_amount))} strong />
              <Row label="Thanh toán" value={getPaymentMethodLabel(order.payment_method)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Khách hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{order.contact_name ?? '—'}</p>
                  <p className="text-gray-500">{order.contact_phone ?? '—'}</p>
                  <p className="text-gray-500">{order.contact_email ?? '—'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-gray-500">{order.delivery_address ?? 'Chưa có địa chỉ'}</p>
              </div>
              {order.notes ? <p className="rounded-lg bg-gray-50 p-3 text-gray-600">{order.notes}</p> : null}
            </CardContent>
          </Card>

          <Link href="/staff/products" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
            Quản lý tồn kho
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className={cn('text-gray-900', strong && 'text-base font-semibold')}>{value}</span>
    </div>
  )
}

function formatDims(dimensions: Record<string, unknown> | null) {
  if (!dimensions) return 'Chưa có kích thước'
  const { length, width, height } = dimensions as { length?: number; width?: number; height?: number }
  if (!length || !width || !height) return 'Kích thước tùy chỉnh'
  return `${length} × ${width} × ${height} cm`
}

/** Dòng nào là hàng kho (trừ kho khi chốt)? Cờ is_custom do app ghi khi tạo đơn. */
function summarizeStock(items: OrderItemRow[]) {
  const stockLines = items.filter((item) => !item.is_custom && item.product?.stock_quantity != null)
  return { stockCount: stockLines.length, stockQty: stockLines.reduce((sum, item) => sum + item.quantity, 0) }
}
