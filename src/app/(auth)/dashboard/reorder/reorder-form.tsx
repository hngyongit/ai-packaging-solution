'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowClockwise, CheckCircle, WarningCircle } from '@phosphor-icons/react'

import { Button, buttonVariants } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/textarea'
import {
  formatCurrency,
  formatDateTime,
  getItemSummary,
  getPaymentMethodLabel,
  toNumber,
  type CustomerOrder,
  type CustomerOrderDetail,
  type PaymentMethod,
} from '@/lib/data/order-shared'
import { cn } from '@/lib/utils'

type ReorderFormProps = {
  selectedOrder: CustomerOrderDetail | null
  recentOrders: CustomerOrder[]
}

type ReorderResult = {
  data?: {
    order: {
      id: string
      order_code: string
      total_amount: number | string
    }
    copiedItems: {
      sourceItemId: string
      productName: string
      quantity: number
      subtotal: number
    }[]
    skippedItems: {
      sourceItemId: string
      productName: string
      reason: string
    }[]
  }
  error?: string
  skippedItems?: {
    sourceItemId: string
    productName: string
    reason: string
  }[]
}

export default function ReorderForm({ selectedOrder, recentOrders }: ReorderFormProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () =>
      selectedOrder?.order_items.reduce<Record<string, number>>((values, item) => {
        values[item.id] = item.quantity
        return values
      }, {}) ?? {}
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(selectedOrder?.payment_method ?? 'cod')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ReorderResult | null>(null)

  const estimatedTotal = useMemo(() => {
    if (!selectedOrder) return 0
    return selectedOrder.order_items.reduce((sum, item) => {
      const quantity = quantities[item.id] ?? item.quantity
      return sum + toNumber(item.unit_price) * quantity
    }, 0)
  }, [quantities, selectedOrder])

  if (!selectedOrder) {
    return (
      <div className="space-y-4">
        {recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <Card key={order.id} className="rounded-lg">
              <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{order.order_code}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(order.created_at)} - {getItemSummary(order)}
                  </p>
                  <p className="mt-1 text-sm font-medium">{formatCurrency(order.total_amount)}</p>
                </div>
                <Link href={`/dashboard/reorder?id=${order.id}`} className={cn(buttonVariants({ size: 'lg' }), 'w-fit')}>
                  Chọn
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-12 text-center">
            <p className="font-medium text-foreground">Chưa có đơn hàng trước đó</p>
            <p className="mt-1 text-sm text-muted-foreground">Hãy tạo một đơn hàng trước, sau đó bạn có thể đặt lại từ đơn đó.</p>
            <Link href="/order" className={cn(buttonVariants({ size: 'lg' }), 'mt-5')}>
              Tạo đơn hàng
            </Link>
          </div>
        )}
      </div>
    )
  }

  async function submitReorder() {
    if (!selectedOrder) return

    setSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          paymentMethod,
          notes: notes.trim() || undefined,
          quantityOverrides: selectedOrder.order_items.map((item) => ({
            sourceItemId: item.id,
            quantity: quantities[item.id] ?? item.quantity,
          })),
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as ReorderResult
      setResult({
        ...payload,
        error: payload.error ? translateReorderError(payload.error) : undefined,
      })
    } catch {
      setResult({ error: 'Không thể tạo đơn đặt lại. Vui lòng thử lại.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Sản phẩm từ {selectedOrder.order_code}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedOrder.order_items.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_120px] sm:items-start">
                  <div>
                    <p className="font-medium text-foreground">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">{item.product_code}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{formatCurrency(item.unit_price)} / sản phẩm</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`qty-${item.id}`}>Số lượng</Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min={1}
                      value={quantities[item.id] ?? item.quantity}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: Number.isInteger(value) && value > 0 ? value : 1,
                        }))
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Tóm tắt đặt lại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Đơn gốc</p>
              <p className="font-medium text-foreground">{selectedOrder.order_code}</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(selectedOrder.created_at)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="cod">{getPaymentMethodLabel('cod')}</option>
                <option value="bank_transfer">{getPaymentMethodLabel('bank_transfer')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Điều chỉnh thêm cho đơn đặt lại này"
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Tổng tạm tính</span>
                <span className="font-semibold text-foreground">{formatCurrency(estimatedTotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Giá cuối cùng sẽ được server tính lại theo dữ liệu hiện tại.</p>
            </div>

            <Button className="w-full" onClick={submitReorder} disabled={submitting}>
              <ArrowClockwise className="h-4 w-4" />
              {submitting ? 'Đang tạo...' : 'Tạo đơn đặt lại'}
            </Button>
          </CardContent>
        </Card>

        {result?.data ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Đã tạo đơn đặt lại: {result.data.order.order_code}</p>
                <p>Tổng tiền: {formatCurrency(result.data.order.total_amount)}</p>
                <Link href={`/dashboard/orders/${result.data.order.id}`} className="mt-2 inline-block underline">
                  Xem đơn hàng
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {result?.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <WarningCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">{result.error}</p>
                {(result.skippedItems ?? []).map((item) => (
                  <p key={item.sourceItemId}>
                    {item.productName}: {translateReorderError(item.reason)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function translateReorderError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('unauthorized')) return 'Vui lòng đăng nhập trước khi tiếp tục.'
  if (normalized.includes('forbidden')) return 'Bạn không có quyền đặt lại đơn hàng này.'
  if (normalized.includes('source order not found')) return 'Không tìm thấy đơn hàng gốc.'
  if (normalized.includes('no available items')) return 'Không còn sản phẩm khả dụng để đặt lại.'
  if (normalized.includes('not linked')) return 'Sản phẩm gốc không còn liên kết với danh mục hiện tại.'
  if (normalized.includes('no longer available')) return 'Sản phẩm không còn khả dụng.'
  if (normalized.includes('current price')) return 'Sản phẩm chưa có giá hiện tại.'
  if (normalized.includes('quantity override')) return 'Số lượng đặt lại không hợp lệ.'
  if (normalized.includes('internal')) return 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.'
  return message
}
