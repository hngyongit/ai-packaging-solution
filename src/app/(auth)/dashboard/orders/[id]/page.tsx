import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  ArrowClockwise,
  CalendarCheck,
  MapPin,
} from '@phosphor-icons/react/dist/ssr'
import { headers } from 'next/headers'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PrintPreviewStrip } from '@/components/order/print-preview-strip'
import { StatusTimeline } from '@/components/ui/status-timeline'
import {
  canCustomerCancelOrder,
  canReorderOrder,
  formatCurrency,
  formatDateTime,
  getCurrentProfile,
  getCustomerOrderById,
  getOrderByIdPublic,
  getPaymentMethodLabel,
  toNumber,
} from '@/lib/data/orders'
import { cn } from '@/lib/utils'
import { CancelOrderButton } from '../cancel-order-button'
import { PaymentBadge, StatusBadge } from '../order-ui'
import { PayNowButton } from './pay-now-button'
import { PayOSRedirectHandler } from './payos-redirect-handler'

type OrderDetailPageProps = {
  params: { id: string }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  if (!UUID_PATTERN.test(params.id)) notFound()

  const profile = await getCurrentProfile()
  
  // For PayOS callback redirects (no auth), fetch order directly without profile check
  const headersList = await headers()
  const isPayOSCallback = headersList.get('x-payos-callback') === 'true' || 
    typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('status') === 'PAID'
  
  let order = null
  if (profile) {
    order = await getCustomerOrderById(profile.id, params.id)
  } else if (isPayOSCallback) {
    // Fallback: try to fetch order without auth for PayOS callback
    order = await getOrderByIdPublic(params.id)
  }
  
  if (!order) notFound()

  const fee = toNumber(order.delivery_fee)
  const itemTotal = order.order_items.reduce((sum, item) => sum + toNumber(item.subtotal), 0)
  const canReorder = profile ? canReorderOrder(order.status) : false
  const canCancel = profile ? canCustomerCancelOrder(order.status) : false

  return (
    <div className="space-y-6">
      {/* Auto-reload when PayOS redirects back with PAID status */}
      <PayOSRedirectHandler />

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
          <StatusTimeline order={order} />

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">{item.product_code}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{formatDimensions(item.dimensions)}</p>
                      {item.notes ? <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p> : null}
                      <div className="mt-3">
                        <PrintPreviewStrip item={item} size="md" />
                      </div>
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
            {/* PayOS payment button — only show for unpaid orders */}
            {order.payment_status !== 'paid' && Number(order.total_amount ?? 0) > 0 ? (
              <PayNowButton orderId={order.id} paymentStatus={order.payment_status} />
            ) : null}
            {canCancel ? <CancelOrderButton orderId={order.id} orderCode={order.order_code} /> : null}
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
