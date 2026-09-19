'use client'

import { useRef } from 'react'
import { UploadSimple } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ProductField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  )
}

const DIMENSION_LABELS = { length: 'Dài', width: 'Rộng', height: 'Cao' } as const
type DimensionKey = keyof typeof DIMENSION_LABELS

export function ProductDimensionsFields({
  values,
  onChange,
}: {
  values: Record<DimensionKey, string>
  onChange: (key: DimensionKey, value: string) => void
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="block text-sm font-medium text-gray-700">Kích thước mặc định (cm)</legend>
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((key) => (
          <label key={key} className="space-y-1">
            <span className="text-xs text-gray-500">{DIMENSION_LABELS[key]}</span>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={values[key]}
              onChange={(event) => onChange(key, event.target.value)}
              placeholder="0"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export const CATEGORY_OPTIONS = [
  { value: 'carton-3-layer', label: 'Carton 3 lớp' },
  { value: 'carton-5-layer', label: 'Carton 5 lớp' },
  { value: 'corrugated', label: 'Sóng giấy khác' },
  { value: 'custom', label: 'Gia công theo yêu cầu' },
] as const

const LAYER_OPTIONS = [
  { value: '3', label: '3 lớp' },
  { value: '5', label: '5 lớp' },
  { value: '3,5', label: '3 và 5 lớp' },
] as const

/** products.available_layers INT[] — select gọn 3 phương án xưởng hay dùng. */
export function ProductLayersSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <ProductField label="Số lớp carton" htmlFor="product-layers">
      <select
        id="product-layers"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {LAYER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </ProductField>
  )
}

const BOX_TYPE_OPTIONS = [
  { value: 'regular-slotted', label: 'Đối khẩu (RSC)' },
  { value: 'half-slotted', label: 'Nửa đối khẩu' },
  { value: 'full-overlap', label: 'Chồng kín' },
  { value: 'die-cut', label: 'Bế theo khuôn' },
  { value: 'custom', label: 'Khác' },
] as const

export function ProductCodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <ProductField label="Mã sản phẩm" htmlFor="product-code">
      <Input
        id="product-code"
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        placeholder="VD: CTN-3L-A4"
        className="font-mono"
      />
    </ProductField>
  )
}

export function ProductCategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <ProductField label="Nhóm hàng" htmlFor="product-category">
      <select
        id="product-category"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </ProductField>
  )
}

export function ProductBoxTypeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <ProductField label="Kiểu thùng" htmlFor="product-box-type">
      <select
        id="product-box-type"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {BOX_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </ProductField>
  )
}

/**
 * Tồn kho: để TRỐNG = không theo dõi kho (hàng gia công theo yêu cầu),
 * nhập số = hàng có sẵn, hệ thống tự trừ khi staff chốt đơn.
 */
export function ProductStockField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <ProductField label="Tồn kho (thùng)" htmlFor="product-stock">
      <Input
        id="product-stock"
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Trống = không theo dõi kho"
      />
      <p className="text-xs text-gray-500">Bỏ trống với hàng gia công; nhập số với hàng có sẵn trong kho.</p>
    </ProductField>
  )
}

export function ProductImageField({ previewUrl, onSelect }: { previewUrl: string | null; onSelect: (file: File | null) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-1">
      <p className="block text-sm font-medium text-gray-700">Hình ảnh</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of staff-uploaded image */}
          <img
            src={previewUrl}
            alt="Xem trước hình ảnh sản phẩm"
            className="h-32 w-full rounded-lg border border-gray-200 bg-gray-50 object-cover"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <UploadSimple className="h-4 w-4" />
            Đổi ảnh
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
        >
          <UploadSimple className="h-5 w-5" />
          Chọn ảnh (JPG, PNG, WebP)
        </button>
      )}
    </div>
  )
}
