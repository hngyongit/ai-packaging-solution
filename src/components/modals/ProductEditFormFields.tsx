'use client'

import { useRef } from 'react'
import { UploadSimple } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const FLUTE_OPTIONS = [
  { value: '3-layer-b', label: '3 lớp (sóng B)' },
  { value: '3-layer-e', label: '3 lớp (sóng E)' },
  { value: '5-layer-bc', label: '5 lớp (sóng BC)' },
  { value: '5-layer-eb', label: '5 lớp (sóng EB)' },
] as const

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

export function ProductFluteSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <ProductField label="Loại sóng" htmlFor="product-flute">
      <select
        id="product-flute"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {FLUTE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </ProductField>
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
