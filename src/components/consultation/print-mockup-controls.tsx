'use client'

import { useEffect, useState } from 'react'
import { ImageSquare, UploadSimple } from '@phosphor-icons/react'

import { Field, RadioGroup } from '@/components/consultation/fields'
import { PRINT_POSITION_LABELS, printPositionsForBoxStyle } from '@/lib/config/print-positions'

// Control in ấn dùng chung: form mockup ở /consultation VÀ form in trong giỏ hàng.
// Nằm ở components/ (không phải trong một route group) vì app/ không import chéo
// giữa các route group — cùng lý do Field được dời ra components/ui.

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
 * Chọn file: giữ object URL để xem ngay trước khi upload (server chưa có file).
 * onFile(null) khi khách xoá lựa chọn.
 */
function AssetPicker({
  label,
  hint,
  accept,
  savedUrl,
  savedName,
  onFile,
}: {
  label: string
  hint: string
  accept: string
  savedUrl?: string | null
  savedName?: string | null
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
    <Field label={label} required>
      <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-600 transition hover:border-blue-400 hover:bg-blue-50">
        <UploadSimple className="h-5 w-5 shrink-0 text-blue-600" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-gray-900">
            {selected ? selected.file.name : savedName ? savedName : hint}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {selected || savedName ? 'Bấm để chọn file khác' : 'Bấm để chọn file'}
          </span>
        </span>
        {shown && (
          <span className="ml-auto h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt={label} className="h-full w-full object-contain" />
          </span>
        )}
        <input
          className="sr-only"
          type="file"
          accept={accept}
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

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'

export function LogoPicker({
  savedUrl,
  onFile,
}: {
  savedUrl?: string | null
  onFile: (file: File | null) => void
}) {
  return (
    <AssetPicker
      label="Logo / hình in"
      hint="Tải ảnh logo lên"
      accept={IMAGE_ACCEPT}
      savedUrl={savedUrl}
      onFile={onFile}
    />
  )
}

/**
 * File SVG khuôn bế khách tự dựng (đã có hình in đúng vị trí) — xưởng bế/in thẳng.
 * Chỉ nhận .svg: đây là file kỹ thuật, không phải ảnh minh hoạ.
 */
export function DielinePicker({
  savedUrl,
  savedName,
  onFile,
}: {
  savedUrl?: string | null
  savedName?: string | null
  onFile: (file: File | null) => void
}) {
  return (
    <AssetPicker
      label="File khuôn bế (SVG)"
      hint="Tải file SVG khuôn bế"
      accept="image/svg+xml,.svg"
      savedUrl={savedUrl}
      savedName={savedName}
      onFile={onFile}
    />
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
