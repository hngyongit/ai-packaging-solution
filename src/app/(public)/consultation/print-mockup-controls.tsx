'use client'

import { useEffect, useState } from 'react'
import { ImageSquare, UploadSimple } from '@phosphor-icons/react'

import { Field, RadioGroup } from './consultation-fields'
import { PRINT_POSITION_LABELS, printPositionsForBoxStyle } from '@/lib/config/print-positions'

export function PrintPositionField({
  boxStyleId,
  value,
  onChange,
}: {
  boxStyleId?: string
  value: string
  onChange: (next: string) => void
}) {
  const positions = printPositionsForBoxStyle(boxStyleId)
  return (
    <Field label="Vị trí in" required>
      <RadioGroup
        value={value}
        onChange={onChange}
        options={positions.map((position) => ({ value: position, label: PRINT_POSITION_LABELS[position] }))}
      />
    </Field>
  )
}

/**
 * Chọn logo: giữ object URL để xem ngay trước khi gen (server chưa có file).
 * onFile(null) khi khách xoá lựa chọn.
 */
export function LogoPicker({
  savedUrl,
  onFile,
}: {
  savedUrl?: string | null
  onFile: (file: File | null) => void
}) {
  const [selected, setSelected] = useState<{ file: File; previewUrl: string } | null>(null)

  useEffect(() => {
    // Blob URL phải thu gom khi đổi/hủy file, nếu không rò rỉ bộ nhớ cả phiên.
    const url = selected?.previewUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [selected])

  const shown = selected?.previewUrl ?? savedUrl ?? null
  return (
    <Field label="Logo / hình in" required>
      <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-600 transition hover:border-blue-400 hover:bg-blue-50">
        <UploadSimple className="h-5 w-5 shrink-0 text-blue-600" />
        <span className="min-w-0">
          <span className="block font-medium text-gray-900">
            {selected ? selected.file.name : savedUrl ? 'Đổi logo khác' : 'Tải ảnh logo lên'}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">PNG, JPG hoặc WEBP, tối đa 10MB</span>
        </span>
        {shown && (
          <span className="ml-auto h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt="Logo đã chọn" className="h-full w-full object-contain" />
          </span>
        )}
        <input
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            const next = file ? { file, previewUrl: URL.createObjectURL(file) } : null
            setSelected(next)
            onFile(next?.file ?? null)
          }}
        />
      </label>
    </Field>
  )
}

export function MockupPreview({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-md border border-gray-100 bg-gray-50">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <a href={url} target="_blank" rel="noreferrer" className="block h-full w-full">
            <img src={url} alt={label} className="h-full w-full object-contain" loading="lazy" />
          </a>
        ) : (
          <div className="flex h-full items-center justify-center gap-1 text-xs text-gray-400">
            <ImageSquare className="h-4 w-4" />
            Chưa có
          </div>
        )}
      </div>
      <p className="mt-1 text-[11px] text-gray-500">{label}</p>
    </div>
  )
}
