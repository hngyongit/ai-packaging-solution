'use client'

import type { FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type CartLine, type StockIssue } from '@/lib/data/cart'
import { formatCurrency } from '@/lib/utils'

export type CreatedCheckoutOrder = {
  id: string
  order_code: string
  total_amount: number | string | null
  payment_method: string | null
}

/** Màn hình cảm ơn sau khi đặt. */
export function CheckoutSuccess({ order }: { order: CreatedCheckoutOrder }) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-blue-600" weight="fill" />
        <h1 className="mt-4 text-2xl font-semibold text-gray-950">Đã nhận đơn hàng</h1>
        <p className="mt-2 text-sm text-gray-600">
          Đơn hàng đang chờ nhân viên duyệt và xác nhận tồn kho. Kho chỉ trừ khi đơn được chốt.
        </p>
        <dl className="mt-6 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">Mã đơn hàng</dt>
            <dd className="mt-1 font-semibold text-gray-950">{order.order_code}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Tổng tạm tính</dt>
            <dd className="mt-1 font-semibold text-gray-950">
              {formatCurrency(Number(order.total_amount ?? 0))}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/orders" className={buttonVariants()}>
            Xem đơn hàng của tôi
          </Link>
          <Link href="/shop" className={buttonVariants({ variant: 'outline' })}>
            Tiếp tục mua hàng
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

/** ?items= không còn dòng nào (giỏ đã đổi) — quay lại chọn lại. */
export function CheckoutEmpty() {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-950">Không có sản phẩm nào để thanh toán</h1>
        <p className="mt-2 text-sm text-gray-600">Giỏ hàng của bạn đã thay đổi. Hãy chọn lại sản phẩm.</p>
        <Link href="/dashboard/cart" className={buttonVariants({ className: 'mt-6' })}>
          Về giỏ hàng
        </Link>
      </CardContent>
    </Card>
  )
}

/** Cờ báo lỗi tồn kho 409 từ /api/checkout. */
export function StockIssues({ issues }: { issues: StockIssue[] }) {
  if (issues.length === 0) return null
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">Một số sản phẩm vượt tồn kho. Vui lòng giảm số lượng.</p>
      <ul className="mt-2 space-y-1">
        {issues.map((issue) => (
          <li key={issue.productCode}>
            {issue.productName}: đã đặt {issue.requested.toLocaleString('vi-VN')}, kho còn{' '}
            {issue.available.toLocaleString('vi-VN')}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Khung 2 cột: trái = cảnh báo + form liên hệ, phải = tóm tắt đơn. */
export function CheckoutFormShell({
  onSubmit,
  alerts,
  contact,
  lines,
  total,
  submitting,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  alerts: React.ReactNode
  contact: React.ReactNode
  lines: CartLine[]
  total: number
  submitting: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" noValidate>
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/cart"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Về giỏ hàng
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Thanh toán</h1>
        </div>
        {alerts}
        {contact}
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="divide-y">
              {lines.map((line) => (
                <li key={line.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-950">
                        {line.kind === 'custom' ? line.custom?.productName : line.product?.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {line.quantity.toLocaleString('vi-VN')} thùng × {formatCurrency(line.product?.basePrice ?? 0)}
                        {line.kind === 'custom' ? ' · Theo yêu cầu' : ''}
                        {line.has_printing ? ' · Có in ấn' : ''}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-gray-950">
                      {formatCurrency((line.product?.basePrice ?? 0) * line.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm text-gray-600">Tạm tính</span>
              <span className="text-base font-semibold text-gray-950">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-gray-500">
              Giá chưa gồm VAT. Nhân viên xác nhận đơn giá cuối cùng trước khi sản xuất.
            </p>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Đặt hàng'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
