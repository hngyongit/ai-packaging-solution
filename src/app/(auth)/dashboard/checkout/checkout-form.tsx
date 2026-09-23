'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { AddressPicker } from '@/components/checkout/address-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { notifyCartUpdated } from '@/components/cart/cart-events'
import { type AddressRow } from '@/lib/data/addresses'
import { type CartLine, type StockIssue } from '@/lib/data/cart'

import {
  CheckoutEmpty,
  CheckoutFormShell,
  CheckoutSuccess,
  StockIssues,
  type CreatedCheckoutOrder,
} from './checkout-parts'

// Form giữ logic (schema + submit + state lỗi); khung trình bày ở checkout-parts.tsx
// để mỗi file dưới limit component của AGENT.md.

// Chỉ còn paymentMethod + ghi chú. addressId là state riêng của AddressPicker
// (một nguồn duy nhất), tên/SĐT/email/địa chỉ lấy từ DB phía server.
const checkoutSchema = z.object({
  paymentMethod: z.enum(['cod', 'bank_transfer', 'payos']),
  notes: z.string().trim().max(1000).optional(),
})

type CheckoutValues = z.infer<typeof checkoutSchema>

function translateCheckoutError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('unauthorized')) return 'Vui lòng đăng nhập trước khi tiếp tục.'
  if (normalized.includes('forbidden')) return 'Bạn không có quyền thực hiện thao tác này.'
  if (normalized.includes('internal')) return 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.'
  return message
}

export function CheckoutForm({
  lines,
  addresses,
  initialAddressId,
}: {
  lines: CartLine[]
  addresses: AddressRow[]
  initialAddressId: string
}) {
  const [serverError, setServerError] = useState('')
  const [issues, setIssues] = useState<StockIssue[]>([])
  const [createdOrder, setCreatedOrder] = useState<CreatedCheckoutOrder | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod')
  const [addressId, setAddressId] = useState(initialAddressId)

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (line.product?.basePrice ?? 0) * line.quantity, 0),
    [lines]
  )

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'cod', notes: '' },
  })
  const { register, handleSubmit, formState } = form

  useEffect(() => {
    if (createdOrder) window.scrollTo({ top: 0 })
  }, [createdOrder])

  async function onSubmit(values: CheckoutValues) {
    setServerError('')
    setIssues([])
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItemIds: lines.map((line) => line.id),
        paymentMethod: values.paymentMethod,
        addressId,
        notes: values.notes,
      }),
    })
    const body = (await response.json().catch(() => null)) as
      | { data?: CreatedCheckoutOrder; error?: string; issues?: StockIssue[] }
      | null

    // 409 kèm issues = vượt tồn kho → hiện từng dòng, không mất dữ liệu đã nhập.
    if (response.status === 409 && body?.issues) {
      setIssues(body.issues)
      return
    }
    if (!response.ok) {
      setServerError(translateCheckoutError(body?.error ?? 'Không thể tạo đơn hàng'))
      return
    }
    notifyCartUpdated()
    const method = values.paymentMethod
    setSelectedPaymentMethod(method)
    setCreatedOrder(body?.data ?? null)
  }

  if (createdOrder) return <CheckoutSuccess order={createdOrder} paymentMethod={selectedPaymentMethod} />
  if (lines.length === 0) return <CheckoutEmpty />

  const chosen = addresses.find((row) => row.id === addressId) ?? null

  return (
    <CheckoutFormShell
      total={total}
      lines={lines}
      submitting={formState.isSubmitting}
      onSubmit={handleSubmit((values) => {
        if (!addressId) {
          setServerError('Vui lòng thêm địa chỉ giao hàng trước khi đặt.')
          return
        }
        void onSubmit(values)
      })}      alerts={
        <>
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{serverError}</div>
          )}
          <StockIssues issues={issues} />
        </>
      }
      contact={
        <>
          <Card>
            <CardHeader>
              <CardTitle>Địa chỉ giao hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressPicker
                initialAddresses={addresses}
                value={addressId}
                onChange={setAddressId}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thanh toán và ghi chú</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Phương thức thanh toán" required>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register('paymentMethod')}
                >
                  <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  <option value="payos">Thanh toán qua PayOS</option>
                </select>
              </Field>
              <Field label="Người nhận">
                <p className="h-8 py-1.5 text-sm text-gray-700">{chosen?.recipient_name ?? '—'}</p>
              </Field>
              <div className="md:col-span-2">
                <Field label="Ghi chú cho đơn">
                  <Textarea rows={3} {...register('notes')} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </>
      }
    />
  )
}
