'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ProductBoxTypeSelect,
  ProductCategorySelect,
  ProductCodeField,
  ProductDimensionsFields,
  ProductField,
  ProductImageField,
  ProductLayersSelect,
  ProductStockField,
} from '@/components/modals/ProductEditFormFields'
import type { ProductDimensions } from '@/features/products/types'

export type EditableProduct = {
  id: string
  code: string
  name: string
  category: string
  boxType: string
  dimensions?: ProductDimensions | null
  basePrice?: number | null
  description?: string | null
  imageUrl?: string | null
  stockQuantity?: number | null
  availableLayers?: number[]
  isActive?: boolean
}

export type ProductEditPayload = {
  code: string
  name: string
  category: string
  boxType: string
  dimensions: ProductDimensions
  availableLayers: number[]
  basePrice: number
  description: string
  stockQuantity: number | null
  image: File | null
}

type FormState = {
  code: string
  name: string
  category: string
  boxType: string
  layers: string
  length: string
  width: string
  height: string
  basePrice: string
  stockQuantity: string
  description: string
  image: File | null
}

function buildInitialForm(product?: EditableProduct | null): FormState {
  return {
    code: product?.code ?? '',
    name: product?.name ?? '',
    category: product?.category ?? 'carton-3-layer',
    boxType: product?.boxType ?? 'regular-slotted',
    layers: [...(product?.availableLayers ?? [3])].sort((a, b) => a - b).join(','),
    length: product?.dimensions ? String(product.dimensions.length) : '',
    width: product?.dimensions ? String(product.dimensions.width) : '',
    height: product?.dimensions ? String(product.dimensions.height) : '',
    basePrice: product?.basePrice ? String(product.basePrice) : '',
    stockQuantity: product?.stockQuantity != null ? String(product.stockQuantity) : '',
    description: product?.description ?? '',
    image: null,
  }
}

/** Chặn trước khi gọi API — message tiếng Việt hiển thị ngay trong drawer. */
function validateForm(form: FormState): string | null {
  const [length, width, height] = [Number(form.length), Number(form.width), Number(form.height)]
  const stock = form.stockQuantity.trim() === '' ? null : Number(form.stockQuantity)
  if (!form.code.trim()) return 'Vui lòng nhập mã sản phẩm.'
  if (!form.name.trim()) return 'Vui lòng nhập tên sản phẩm.'
  if (!(length > 0) || !(width > 0) || !(height > 0)) return 'Kích thước phải lớn hơn 0.'
  if (!(Number(form.basePrice) > 0)) return 'Đơn giá phải lớn hơn 0.'
  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
    return 'Tồn kho phải là số nguyên không âm (hoặc để trống).'
  }
  return null
}

export function ProductEditDrawer({
  product,
  open,
  onOpenChange,
  onSubmit,
}: {
  product?: EditableProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: ProductEditPayload) => Promise<void> | void
}) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(product))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [resetKey, setResetKey] = useState('')

  const currentKey = `${open}:${product?.id ?? 'new'}`
  if (currentKey !== resetKey) {
    setResetKey(currentKey)
    setForm(buildInitialForm(product))
    setError('')
  }

  const previewUrl = form.image ? URL.createObjectURL(form.image) : (product?.imageUrl ?? null)
  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }))
  const close = () => {
    if (!isSaving) onOpenChange(false)
  }

  async function handleSave() {
    const invalid = validateForm(form)
    if (invalid) return setError(invalid)

    setIsSaving(true)
    setError('')
    try {
      await onSubmit({
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category,
        boxType: form.boxType,
        dimensions: { length: Number(form.length), width: Number(form.width), height: Number(form.height) },
        availableLayers: form.layers.split(',').map(Number),
        basePrice: Number(form.basePrice),
        description: form.description.trim(),
        stockQuantity: form.stockQuantity.trim() === '' ? null : Number(form.stockQuantity),
        image: form.image,
      })
      close()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu sản phẩm')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-gray-950/45 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-open:opacity-100" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex justify-end">
          <Dialog.Popup className="flex h-dvh w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl outline-none transition-transform data-closed:translate-x-full data-open:translate-x-0">
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-5 py-4">
              <Dialog.Close
                aria-label="Quay lại"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Dialog.Close>
              <Dialog.Title className="text-base font-semibold text-gray-950 sm:text-lg">
                {product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
              </Dialog.Title>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <ProductCodeField value={form.code} onChange={(code) => patch({ code })} />
              <ProductField label="Tên sản phẩm" htmlFor="product-name">
                <Input id="product-name" value={form.name} onChange={(event) => patch({ name: event.target.value })} placeholder="VD: Thùng carton 3 lớp A4" />
              </ProductField>

              <div className="grid grid-cols-2 gap-3">
                <ProductCategorySelect value={form.category} onChange={(category) => patch({ category })} />
                <ProductBoxTypeSelect value={form.boxType} onChange={(boxType) => patch({ boxType })} />
              </div>

              <ProductLayersSelect value={form.layers} onChange={(layers) => patch({ layers })} />

              <ProductDimensionsFields
                values={{ length: form.length, width: form.width, height: form.height }}
                onChange={(key, value) => patch({ [key]: value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <ProductField label="Đơn giá cơ bản (đ/thùng)" htmlFor="product-price">
                  <Input id="product-price" type="number" min={0} step={100} value={form.basePrice} onChange={(event) => patch({ basePrice: event.target.value })} placeholder="0" />
                </ProductField>
                <ProductStockField value={form.stockQuantity} onChange={(stockQuantity) => patch({ stockQuantity })} />
              </div>

              <ProductField label="Mô tả" htmlFor="product-description">
                <Textarea id="product-description" rows={3} value={form.description} onChange={(event) => patch({ description: event.target.value })} placeholder="Mô tả ngắn về sản phẩm" />
              </ProductField>

              <ProductImageField previewUrl={previewUrl} onSelect={(image) => patch({ image })} />

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-gray-200 px-5 py-4">
              <Button type="button" variant="outline" size="lg" className="flex-1" disabled={isSaving} onClick={close}>
                Hủy
              </Button>
              <Button type="button" size="lg" className="flex-1" disabled={isSaving} onClick={handleSave}>
                <FloppyDisk className="h-4 w-4" />
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
