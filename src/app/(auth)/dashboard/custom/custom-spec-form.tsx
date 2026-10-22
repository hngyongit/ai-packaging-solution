'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lightning, Plus, Ruler } from '@phosphor-icons/react'

import { useAddToCart, type CartPayload } from '@/components/cart/use-add-to-cart'
import { PriceEstimateNotice } from '@/components/commerce/price-estimate-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { formatLayers } from '@/features/products/utils'
import { type ProductOption } from '@/features/products/types'
import { type BoxStyleRecord } from '@/lib/data/boxes'
import { formatCurrency } from '@/lib/utils'

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
  'h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function CustomSpecForm({
  products,
  boxStyles,
}: {
  products: ProductOption[]
  boxStyles: BoxStyleRecord[]
}) {
  const [open, setOpen] = useState(false)
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
    <>
      <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Ruler className="h-5 w-5" weight="duotone" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-950">Tự nhập quy cách</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Đã biết sẵn kích thước? Nhập thông số để thêm vào giỏ hoặc mua ngay mà không cần chờ tư vấn.
              </p>
            </div>
          </div>
          <Button type="button" size="lg" className="shrink-0" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nhập quy cách
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        size="xl"
        title="Tự nhập quy cách thùng"
        description="Nhập kích thước, số lớp và số lượng để xem giá tạm tính trước khi đặt hàng."
        contentClassName="sm:px-6"
      >
        <form className="grid gap-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <div className="md:col-span-2">
            <Field label="Sản phẩm cơ sở (neo giá tạm tính)" required error={formState.errors.productId?.message}>
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
              <Input type="number" min={1} className="h-10" {...register('length')} />
            </Field>
            <Field label="Rộng (cm)" required error={formState.errors.width?.message}>
              <Input type="number" min={1} className="h-10" {...register('width')} />
            </Field>
            <Field label="Cao (cm)" required error={formState.errors.height?.message}>
              <Input type="number" min={1} className="h-10" {...register('height')} />
            </Field>
          </div>

          <Field label="Số lớp" required error={formState.errors.layers?.message}>
            <select className={SELECT_CLASS} {...register('layers')}>
              {[3, 5].map((layers) => <option key={layers} value={layers}>{layers} lớp</option>)}
            </select>
          </Field>

          <Field label="Kiểu thùng">
            <select className={SELECT_CLASS} {...register('boxStyleId')}>
              <option value="">Không chọn</option>
              {boxStyles.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
            </select>
          </Field>

          <Field label="Số lượng (thùng)" required error={formState.errors.quantity?.message}>
            <Input type="number" min={1} step={1} className="h-10" {...register('quantity')} />
          </Field>

          <div className="md:col-span-2">
            <Field label="Ghi chú" error={formState.errors.notes?.message}>
              <Textarea rows={3} {...register('notes')} placeholder="VD: in 1 màu 2 mặt, đựng ly sứ có foam" />
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Tạm tính</span>
              <strong className="text-lg text-slate-950">
                {formatCurrency((anchor?.basePrice ?? 0) * (Number(values.quantity) || 0))}
              </strong>
            </div>
            <PriceEstimateNotice compact />
          </div>

          {status === 'error' && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          {products.length === 0 && (
            <p className="text-sm text-amber-700 md:col-span-2">Chưa có sản phẩm cơ sở nào trong danh mục.</p>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 md:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={submitWith(buyNow)}>
              <Lightning className="h-4 w-4" />
              Mua ngay
            </Button>
            <Button type="button" disabled={busy} onClick={submitWith(add)}>
              <Plus className="h-4 w-4" />
              {status === 'added' ? 'Đã thêm vào giỏ' : busy ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
