'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from '@phosphor-icons/react'

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
  ProductMinDimensionsFields,
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
  minDimensions?: ProductDimensions | null
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
  minDimensions: ProductDimensions | null
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
  minLength: string
  minWidth: string
  minHeight: string
  basePrice: string
  stockQuantity: string
  description: string
  image: File | null
}

const INITIAL_FORM: FormState = {
  code: '',
  name: '',
  category: 'carton-3-layer',
  boxType: 'regular-slotted',
  layers: '3',
  length: '',
  width: '',
  height: '',
  minLength: '',
  minWidth: '',
  minHeight: '',
  basePrice: '',
  stockQuantity: '',
  description: '',
  image: null,
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
    minLength: product?.minDimensions ? String(product.minDimensions.length) : '',
    minWidth: product?.minDimensions ? String(product.minDimensions.width) : '',
    minHeight: product?.minDimensions ? String(product.minDimensions.height) : '',
    basePrice: product?.basePrice ? String(product.basePrice) : '',
    stockQuantity: product?.stockQuantity != null ? String(product.stockQuantity) : '',
    description: product?.description ?? '',
    image: null,
  }
}

/** Validate form — tất cả field bắt buộc điền trừ ảnh. Min phải < max (nếu có cả 2). */
function validateForm(form: FormState): string | null {
  const [length, width, height] = [Number(form.length), Number(form.width), Number(form.height)]
  const minLen = Number(form.minLength) || null
  const minWid = Number(form.minWidth) || null
  const minHei = Number(form.minHeight) || null
  const hasMinDims = !!(minLen && minWid && minHei)
  const stock = form.stockQuantity.trim() === '' ? null : Number(form.stockQuantity)

  // --- Bắt buộc điền đầy đủ ---
  if (!form.code.trim()) return 'Vui lòng nhập mã sản phẩm.'
  if (!form.name.trim()) return 'Vui lòng nhập tên sản phẩm.'
  if (!(length > 0) || !(width > 0) || !(height > 0)) return 'Kích thước tối đa phải lớn hơn 0.'
  if (!(Number(form.basePrice) > 0)) return 'Đơn giá phải lớn hơn 0.'
  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
    return 'Tồn kho phải là số nguyên ≥ 0 (hoặc để trống).'
  }
  // Min dimensions: nếu điền 1 chiều thì phải điền đủ 3 chiều
  if ((minLen || minWid || minHei) && !(minLen && minWid && minHei)) {
    return 'Nếu nhập kích thước tối thiểu, cần điền đủ Dài / Rộng / Cao.'
  }
  // Min < Max validation
  if (hasMinDims) {
    if (minLen >= length) return 'Dài tối thiểu phải nhỏ hơn dài tối đa.'
    if (minWid >= width) return 'Rộng tối thiểu phải nhỏ hơn rộng tối đa.'
    if (minHei >= height) return 'Cao tối thiểu phải nhỏ hơn cao tối đa.'
  }
  return null
}

/** Map key dimension → trường form tương ứng */
const MAX_DIM_FIELD_MAP: Record<string, keyof FormState> = { length: 'length', width: 'width', height: 'height' }
const MIN_DIM_FIELD_MAP: Record<string, keyof FormState> = { length: 'minLength', width: 'minWidth', height: 'minHeight' }

export function ProductEditModal({
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
  const patch = (field: keyof FormState, value: string | File | null) => setForm((prev) => ({ ...prev, [field]: value }))
  const close = () => {
    if (!isSaving) onOpenChange(false)
  }

  async function handleSave() {
    const invalid = validateForm(form)
    if (invalid) return setError(invalid)

    setIsSaving(true)
    setError('')
    try {
      // Build minDimensions — nullable nếu không điền
      const minDims: ProductDimensions | null = (() => {
        const l = Number(form.minLength) || null
        const w = Number(form.minWidth) || null
        const h = Number(form.minHeight) || null
        return (l && w && h) ? { length: l, width: w, height: h } : null
      })()

      await onSubmit({
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category,
        boxType: form.boxType,
        minDimensions: minDims,
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
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center">
          <Dialog.Popup className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl outline-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <Dialog.Title className="text-base font-semibold text-gray-950 sm:text-lg">
                {product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Đóng"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="max-h-[calc(100dvh-240px)] space-y-5 overflow-y-auto px-6 py-5">
              <ProductCodeField value={form.code} onChange={(code) => patch('code', code)} />
              <ProductField label="Tên sản phẩm" htmlFor="product-name">
                <Input id="product-name" value={form.name} onChange={(event) => patch('name', event.target.value)} placeholder="VD: Thùng carton 3 lớp A4" />
              </ProductField>

              <div className="grid grid-cols-2 gap-3">
                <ProductCategorySelect value={form.category} onChange={(category) => patch('category', category)} />
                <ProductBoxTypeSelect value={form.boxType} onChange={(boxType) => patch('boxType', boxType)} />
              </div>

              <ProductLayersSelect value={form.layers} onChange={(layers) => patch('layers', layers)} />

              {/* Kích thước tối đa — bắt buộc điền */}
              <ProductDimensionsFields
                values={{ length: form.length, width: form.width, height: form.height }}
                onChange={(key, value) => patch(MAX_DIM_FIELD_MAP[key], value)}
              />

              {/* Kích thước tối thiểu — tùy chọn (nhập đủ hoặc bỏ trống hết) */}
              <ProductMinDimensionsFields
                values={{ length: form.minLength, width: form.minWidth, height: form.minHeight }}
                onChange={(key, value) => patch(MIN_DIM_FIELD_MAP[key], value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <ProductField label="Đơn giá cơ bản (đ/thùng)" htmlFor="product-price">
                  <Input id="product-price" type="number" min={0} step={100} value={form.basePrice} onChange={(event) => patch('basePrice', event.target.value)} placeholder="Bắt buộc" />
                </ProductField>
                <ProductStockField value={form.stockQuantity} onChange={(stockQuantity) => patch('stockQuantity', stockQuantity)} />
              </div>

              <ProductField label="Mô tả" htmlFor="product-description">
                <Textarea id="product-description" rows={3} value={form.description} onChange={(event) => patch('description', event.target.value)} placeholder="Mô tả ngắn về sản phẩm" />
              </ProductField>

              <ProductImageField previewUrl={previewUrl} onSelect={(image) => patch('image', image)} />

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-2 border-t border-gray-200 px-6 py-4">
              <Button type="button" variant="outline" size="lg" className="flex-1" disabled={isSaving} onClick={close}>
                Hủy
              </Button>
              <Button type="button" size="lg" className="flex-1" disabled={isSaving} onClick={handleSave}>
                Lưu sản phẩm
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
