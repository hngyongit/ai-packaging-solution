'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FLUTE_OPTIONS,
  ProductDimensionsFields,
  ProductField,
  ProductFluteSelect,
  ProductImageField,
} from '@/components/modals/ProductEditFormFields'
import type { ProductDimensions } from '@/features/products/types'

export type EditableProduct = {
  id: string
  name: string
  fluteType?: string | null
  dimensions?: ProductDimensions | null
  basePrice?: number | null
  description?: string | null
  imageUrl?: string | null
}

export type ProductEditPayload = {
  name: string
  fluteType: string
  dimensions: ProductDimensions
  basePrice: number
  description: string
  image: File | null
}

type ProductEditDrawerProps = {
  product?: EditableProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: ProductEditPayload) => Promise<void> | void
}

type FormState = {
  name: string
  fluteType: string
  length: string
  width: string
  height: string
  basePrice: string
  description: string
  image: File | null
}

function buildInitialForm(product?: EditableProduct | null): FormState {
  return {
    name: product?.name ?? '',
    fluteType: product?.fluteType ?? FLUTE_OPTIONS[0].value,
    length: product?.dimensions ? String(product.dimensions.length) : '',
    width: product?.dimensions ? String(product.dimensions.width) : '',
    height: product?.dimensions ? String(product.dimensions.height) : '',
    basePrice: product?.basePrice ? String(product.basePrice) : '',
    description: product?.description ?? '',
    image: null,
  }
}

export function ProductEditDrawer({ product, open, onOpenChange, onSubmit }: ProductEditDrawerProps) {
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

  const isEdit = Boolean(product)
  const previewUrl = form.image ? URL.createObjectURL(form.image) : (product?.imageUrl ?? null)

  function patch(values: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...values }))
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return
    onOpenChange(nextOpen)
  }

  async function handleSave() {
    const length = Number(form.length)
    const width = Number(form.width)
    const height = Number(form.height)
    const basePrice = Number(form.basePrice)

    if (!form.name.trim()) return setError('Vui lòng nhập tên sản phẩm.')
    if (!(length > 0) || !(width > 0) || !(height > 0)) return setError('Kích thước phải lớn hơn 0.')
    if (!(basePrice > 0)) return setError('Đơn giá phải lớn hơn 0.')

    setIsSaving(true)
    setError('')

    try {
      await onSubmit({
        name: form.name.trim(),
        fluteType: form.fluteType,
        dimensions: { length, width, height },
        basePrice,
        description: form.description.trim(),
        image: form.image,
      })
      handleOpenChange(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu sản phẩm')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
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
                {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
              </Dialog.Title>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <ProductField label="Tên sản phẩm" htmlFor="product-name">
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="VD: Thùng carton 3 lớp A4"
                />
              </ProductField>

              <ProductFluteSelect value={form.fluteType} onChange={(fluteType) => patch({ fluteType })} />

              <ProductDimensionsFields
                values={{ length: form.length, width: form.width, height: form.height }}
                onChange={(key, value) => patch({ [key]: value })}
              />

              <ProductField label="Đơn giá cơ bản (đ/hộp)" htmlFor="product-price">
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  step={100}
                  value={form.basePrice}
                  onChange={(event) => patch({ basePrice: event.target.value })}
                  placeholder="0"
                />
              </ProductField>

              <ProductField label="Mô tả" htmlFor="product-description">
                <Textarea
                  id="product-description"
                  value={form.description}
                  onChange={(event) => patch({ description: event.target.value })}
                  rows={3}
                  placeholder="Mô tả ngắn về sản phẩm"
                />
              </ProductField>

              <ProductImageField previewUrl={previewUrl} onSelect={(image) => patch({ image })} />

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-gray-200 px-5 py-4">
              <Button type="button" variant="outline" size="lg" className="flex-1" disabled={isSaving} onClick={() => handleOpenChange(false)}>
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
