import { Package, Plus, Trash } from '@phosphor-icons/react'
import { type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { Field } from './form-field'
import { type OrderFormValues } from './order-schema'
import { type ProductOption } from './order-types'
import { formatCurrency, getDefaultLayer } from './order-utils'

export function OrderItems({
  items,
  products,
  productById,
  errors,
  register,
  setValue,
  addItem,
  removeItem,
}: {
  items: OrderFormValues['items']
  products: ProductOption[]
  productById: Map<string, ProductOption>
  errors?: FieldErrors<OrderFormValues>['items']
  register: UseFormRegister<OrderFormValues>
  setValue: UseFormSetValue<OrderFormValues>
  addItem: () => void
  removeItem: (index: number) => void
}) {
  return (
    <Card className="rounded-lg border-gray-200">
      <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Sản phẩm carton</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={addItem} disabled={products.length === 0}>
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => {
          const selectedProduct = productById.get(item.productId)
          const itemErrors = errors?.[index]

          return (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Package className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-950">Sản phẩm {index + 1}</p>
                    <p className="text-xs text-gray-500">
                      {selectedProduct ? formatCurrency(selectedProduct.basePrice) : 'Chọn sản phẩm'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  aria-label="Xóa sản phẩm"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sản phẩm" required error={itemErrors?.productId?.message}>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    {...register(`items.${index}.productId`)}
                    onChange={(event) => {
                      const product = productById.get(event.target.value)
                      setValue(`items.${index}.productId`, event.target.value)
                      setValue(`items.${index}.layers`, getDefaultLayer(product))
                    }}
                  >
                    <option value="">Chọn sản phẩm</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code} / {product.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Số lượng" required error={itemErrors?.quantity?.message}>
                  <Input type="number" min={1} {...register(`items.${index}.quantity`)} />
                </Field>
                <Field label="Dài (cm)" required error={itemErrors?.length?.message}>
                  <Input type="number" min={1} step="0.1" {...register(`items.${index}.length`)} />
                </Field>
                <Field label="Rộng (cm)" required error={itemErrors?.width?.message}>
                  <Input type="number" min={1} step="0.1" {...register(`items.${index}.width`)} />
                </Field>
                <Field label="Cao (cm)" required error={itemErrors?.height?.message}>
                  <Input type="number" min={1} step="0.1" {...register(`items.${index}.height`)} />
                </Field>
                <Field label="Số lớp" required error={itemErrors?.layers?.message}>
                  <Input type="number" min={1} {...register(`items.${index}.layers`)} />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[12rem_1fr]">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    {...register(`items.${index}.hasPrinting`)}
                  />
                  Cần in ấn
                </label>
                <Field label="Ghi chú sản phẩm" error={itemErrors?.itemNotes?.message}>
                  <Input {...register(`items.${index}.itemNotes`)} />
                </Field>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
