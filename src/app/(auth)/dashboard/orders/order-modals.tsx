"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { OrderForm } from "@/app/(public)/order/order-form"
import { type ProductOption } from "@/app/(public)/order/order-types"
import { PrintPreviewStrip } from "@/components/order/print-preview-strip"
import { buttonVariants } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  canCustomerCancelOrder,
  canReorderOrder,
  formatCurrency,
  formatDateTime,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  type CustomerOrder,
} from "@/lib/data/order-shared"
import { cn } from "@/lib/utils"
import { CancelOrderButton } from "./cancel-order-button"

type OrdersUrlModalsProps = {
  products: ProductOption[]
  selectedOrder: CustomerOrder | null
}

export function OrdersUrlModals({ products, selectedOrder }: OrdersUrlModalsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function closeModal() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("modal")
    params.delete("orderId")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const createOpen = searchParams.get("modal") === "create"
  const detailOpen = Boolean(selectedOrder && searchParams.get("orderId"))

  return (
    <>
      <CreateOrderModal products={products} open={createOpen} onOpenChange={(open) => !open && closeModal()} />
      {selectedOrder ? (
        <OrderQuickViewModal order={selectedOrder} open={detailOpen} onOpenChange={(open) => !open && closeModal()} />
      ) : null}
    </>
  )
}

function OrderQuickViewModal({
  order,
  open,
  onOpenChange,
}: {
  order: CustomerOrder
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const canReorder = canReorderOrder(order.status)
  const canCancel = canCustomerCancelOrder(order.status)

  return (
    <Modal
      size="lg"
      title={order.order_code}
      description={`Tạo lúc ${formatDateTime(order.created_at)}`}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {canCancel ? <CancelOrderButton orderId={order.id} orderCode={order.order_code} /> : null}
          {canReorder ? (
            <Link href={`/dashboard/reorder?id=${order.id}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Đặt lại
            </Link>
          ) : null}
          <Link href={`/dashboard/orders/${order.id}`} className={cn(buttonVariants({ size: "lg" }))}>
            Theo dõi tiến độ yêu cầu
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Tổng tiền" value={formatCurrency(order.total_amount)} />
          <Metric label="Tiền cọc" value={formatCurrency(order.deposit_amount)} />
          <Metric label="Thanh toán" value={getPaymentMethodLabel(order.payment_method)} />
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-950">Sản phẩm</h3>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-950">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.product_code}</p>
                    <p className="mt-1 text-sm text-gray-600">{formatDimensions(item.dimensions)}</p>
                    <div className="mt-2">
                      <PrintPreviewStrip item={item} />
                    </div>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-sm text-gray-600">Số lượng {item.quantity}</p>
                    <p className="font-medium text-gray-950">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <InfoBlock
            label="Liên hệ"
            value={[order.contact_name, order.contact_phone, order.contact_email].filter(Boolean).join(" / ") || "Chưa có thông tin"}
          />
          <InfoBlock
            label="Giao nhận"
            value={`${formatDeliveryMethod(order.delivery_method)}${order.delivery_address ? ` / ${order.delivery_address}` : ""}`}
          />
        </section>

        {order.notes ? <p className="rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-950">{order.notes}</p> : null}
      </div>
    </Modal>
  )
}

function CreateOrderModal({
  products,
  open,
  onOpenChange,
}: {
  products: ProductOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Modal
      size="xl"
      title="Tạo đơn hàng"
      description="Chọn quy cách carton, thông tin liên hệ và gửi đơn để nhân viên duyệt."
      contentClassName="bg-gray-50"
      open={open}
      onOpenChange={onOpenChange}
    >
      <OrderForm products={products} variant="modal" />
    </Modal>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-950">{value}</p>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-gray-700">{value}</p>
    </div>
  )
}

function PaymentBadge({ status }: { status: string | null | undefined }) {
  const className =
    status === "paid" || status === "deposit_paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-gray-200 bg-gray-50 text-gray-700"

  return <span className={cn("inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium", className)}>{getPaymentStatusLabel(status)}</span>
}

function formatDimensions(dimensions: Record<string, unknown> | null) {
  if (!dimensions) return "Chưa có kích thước"
  const length = dimensions.length
  const width = dimensions.width
  const height = dimensions.height
  if (!length || !width || !height) return "Kích thước tùy chỉnh"
  return `${length} x ${width} x ${height} cm`
}

function formatDeliveryMethod(method: string | null) {
  if (method === "delivery") return "Giao hàng"
  if (method === "pickup") return "Nhận tại xưởng"
  return "Chưa chọn phương thức giao nhận"
}
