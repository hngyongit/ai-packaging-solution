'use client'

import { Trash } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type CartLine } from '@/lib/data/cart'
import { formatCurrency } from '@/lib/utils'
import { formatDimensions, formatLayers } from '@/features/products/utils'

import { CustomEditTrigger } from './custom-line-editor'

type CartLineRowProps = {
  line: CartLine
  checked: boolean
  busy: boolean
  onToggle: () => void
  onQuantity: (quantity: number) => void
  onRemove: () => void
  onEditCustom?: () => void
}

/** Tên hiển thị của dòng: custom dùng spec, hàng kho dùng tên sản phẩm. */
function lineName(line: CartLine) {
  if (line.kind === 'custom') return line.custom?.productName ?? 'Thùng theo yêu cầu'
  return line.product?.name ?? 'Sản phẩm không còn tồn tại'
}

/** Vượt tồn kho: chỉ dòng hàng kho (stock NOT NULL) và qty > stock. */
export function lineOverStock(line: CartLine) {
  if (line.kind === 'custom') return false
  return line.product?.stockQuantity != null && line.quantity > line.product.stockQuantity
}

export function CartLineRow({ line, checked, busy, onToggle, onQuantity, onRemove, onEditCustom }: CartLineRowProps) {
  const isCustom = line.kind === 'custom'
  const stock = line.product?.stockQuantity ?? null
  const over = lineOverStock(line)
  const spec = line.custom

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4">
      <input
        type="checkbox"
        aria-label={`Chọn ${lineName(line)}`}
        className="mt-2 h-4 w-4 shrink-0 accent-blue-600"
        checked={checked}
        disabled={busy}
        onChange={onToggle}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-gray-500">{isCustom ? spec?.productCode : line.product?.code ?? '—'}</p>
            <p className="truncate text-sm font-medium text-gray-950">{lineName(line)}</p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-gray-950">
            {formatCurrency((line.product?.basePrice ?? 0) * line.quantity)}
          </p>
        </div>

        <p className="mt-1 text-xs text-gray-500">
          {isCustom && spec
            ? `${formatDimensions({ length: spec.length, width: spec.width, height: spec.height })}`
            : line.product?.maxDimensions
              ? `≤ ${formatDimensions(line.product.maxDimensions)}`
              : 'Quy cách liên hệ'}
          {' · '}
          {isCustom ? `${spec?.layers ?? '—'} lớp` : formatLayers(line.product?.availableLayers ?? [])}
          {' · '}
          {formatCurrency(line.product?.basePrice ?? 0)}/thùng
        </p>

        {isCustom ? (
          <p className="mt-1 inline-flex h-5 items-center rounded-full border border-gray-300 bg-gray-50 px-2 text-xs font-medium text-gray-700">
            Theo yêu cầu
          </p>
        ) : null}
        {line.has_printing && (
          <p className="mt-1 inline-flex h-5 items-center rounded-full border border-blue-200 bg-blue-50 px-2 text-xs font-medium text-blue-700">
            Có in ấn
          </p>
        )}

        {isCustom || stock === null ? (
          <p className="mt-2 text-xs text-gray-500">Gia công theo yêu cầu — không giới hạn tồn kho.</p>
        ) : (
          <p className={`mt-2 text-xs ${over ? 'text-red-600' : 'text-emerald-700'}`}>
            {over
              ? `Vượt tồn kho — chỉ còn ${stock.toLocaleString('vi-VN')} thùng.`
              : `Còn ${stock.toLocaleString('vi-VN')} thùng trong kho.`}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min={1}
            step={1}
            aria-label={`Số lượng ${lineName(line)}`}
            defaultValue={line.quantity}
            disabled={busy}
            className="h-8 w-24"
            onBlur={(event) => {
              const next = Number(event.target.value)
              if (next >= 1 && next !== line.quantity) onQuantity(next)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
          {isCustom && onEditCustom ? <CustomEditTrigger onClick={onEditCustom} /> : null}
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onRemove}
            aria-label={`Xoá ${lineName(line)} khỏi giỏ`}
          >
            <Trash className="h-4 w-4" />
            Xoá
          </Button>
        </div>
      </div>
    </div>
  )
}
