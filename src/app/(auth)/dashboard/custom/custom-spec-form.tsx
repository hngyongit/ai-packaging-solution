'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lightning, Plus } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAddToCart, type CartPayload } from '@/components/cart/use-add-to-cart'
import { type BoxStyleRecord } from '@/lib/data/boxes'
import { type ProductOption } from '@/features/products/types'
import { formatCurrency } from '@/lib/utils'
import { formatLayers } from '@/features/products/utils'

// "Tự nhập quy cách" — không cần qua tư vấn vẫn tạo được dòng custom.
// Sản phẩm cơ sở chỉ là NEO GIÁ (base_price) vì DB chưa có hàm giá theo thể tích;
// staff chốt lại đơn giá khi duyệt đơn. Giá không bao giờ lấy từ client.

const manualSchema = z.object({
  productId: z.string().uuid('Chọn sản phẩm cơ sở'),
  length: z.coerce.number().positive('Nhập chiều dài (cm)').max(9999),
  width: z.coerce.number().positive('Nhập chiều rộng (cm)').max(9999),
  height: z.coerce.number().positive('Nhập chiều cao (cm)').max(9999),
  layers: z.coerce.number().int().positive('Chọn số lớp').max(9),
  quantity: z.coerce.number().int().positive('Nhập số lượng').max(1_000_000),
  boxStyleId: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
})

type ManualValues = z.infer<typeof manualSchema>

const SELECT_CLASS =
  'h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function CustomSpecForm({
  products,
  boxStyles,
}: {
  products: ProductOption[]
  boxStyles: BoxStyleRecord[]
}) {
  const { status, error, add, buyNow } = useAddToCart()
  const form = useForm<ManualValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      productId: products[0]?.id ?? '',
      length: 32,
      width: 22,
      height: 18,
      layers: 3,
      quantity: 500,
      boxStyleId: '',
      notes: '',
    },
  })
  const { register, handleSubmit, formState, watch } = form
  const values = watch()
  const anchor = products.find((product) => product.id === values.productId) ?? null
  const busy = status === 'saving' || products.length === 0

  function payload(next: ManualValues) {
    return {
      kind: 'custom' as const,
      productId: next.productId,
      quantity: next.quantity,
      custom: {
        length: next.length,
        width: next.width,
        height: next.height,
        layers: next.layers,
        boxStyleId: next.boxStyleId || undefined,
        notes: next.notes || undefined,
        productName: `Thùng theo yêu cầu ${next.length}×${next.width}×${next.height} cm`,
        productCode: `CUS-${anchor?.code ?? 'NEW'}`,
      },
    }
  }

  const submitWith = (action: (body: CartPayload) => Promise<unknown>) =>
    handleSubmit((next) => void action(payload(next)))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-950">Tự nhập quy cách</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Đã biết sẵn thông số? Nhập vào rồi thêm giỏ hoặc mua ngay, không cần tư vấn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quy cách thùng</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              label="Sản phẩm cơ sở (neo giá tạm tính)"
              required
              error={formState.errors.productId?.message}
            >
              <select className={SELECT_CLASS} {...register('productId')}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {formatCurrency(product.basePrice)}/thùng · {formatLayers(product.availableLayers)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Dài (cm)" required error={formState.errors.length?.message}>
              <Input type="number" min={1} className="h-8" {...register('length')} />
            </Field>
            <Field label="Rộng (cm)" required error={formState.errors.width?.message}>
              <Input type="number" min={1} className="h-8" {...register('width')} />
            </Field>
            <Field label="Cao (cm)" required error={formState.errors.height?.message}>
              <Input type="number" min={1} className="h-8" {...register('height')} />
            </Field>
          </div>

          <Field label="Số lớp" required error={formState.errors.layers?.message}>
            <select className={SELECT_CLASS} {...register('layers')}>
              {[3, 5].map((layers) => (
                <option key={layers} value={layers}>
                  {layers} lớp
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kiểu thùng">
            <select className={SELECT_CLASS} {...register('boxStyleId')}>
              <option value="">Không chọn</option>
              {boxStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Số lượng (thùng)" required error={formState.errors.quantity?.message}>
            <Input type="number" min={1} step={1} className="h-8" {...register('quantity')} />
          </Field>

          <div className="md:col-span-2">
            <Field label="Ghi chú" error={formState.errors.notes?.message}>
              <Textarea rows={2} {...register('notes')} placeholder="VD: in 1 màu 2 mặt, đựng ly sứ có foam" />
            </Field>
          </div>

          <p className="text-xs text-gray-500 md:col-span-2">
            Tạm tính{' '}
            {formatCurrency((anchor?.basePrice ?? 0) * (Number(values.quantity) || 0))} · nhân viên xác nhận đơn
            giá cuối cùng sau khi nhận đơn.
          </p>

          <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              disabled={busy}
              onClick={submitWith(add)}
            >
              <Plus className="h-4 w-4" />
              {status === 'added' ? 'Đã thêm vào giỏ' : busy ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </Button>
            <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={submitWith(buyNow)}>
              <Lightning className="h-4 w-4" />
              Mua ngay
            </Button>
          </div>
          {status === 'error' && <p className="text-xs text-red-600 md:col-span-2">{error}</p>}
          {products.length === 0 && (
            <p className="text-xs text-amber-700 md:col-span-2">Chưa có sản phẩm cơ sở nào trong danh mục.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
