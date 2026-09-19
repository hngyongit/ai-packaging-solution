'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Lightning, Plus } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useAddToCart } from '@/components/cart/use-add-to-cart'
import { formatDimensions, formatLayers } from '@/features/products/utils'
import { type StockMatch } from '@/lib/ai/types'

/**
 * Một mẫu thùng kho AI đề xuất + nút thêm giỏ (dùng chung API với trang /shop).
 * Số lượng mặc định = suggestedQuantity đã kẹp theo tồn kho thật.
 */
export function StockMatchCard({ match, rank }: { match: StockMatch; rank: number }) {
  const [quantity, setQuantity] = useState(Math.max(match.suggestedQuantity, 1))
  const { status, error, add, buyNow } = useAddToCart()
  const maxStock = match.availableStock
  const payload = { productId: match.productId, quantity }
  const busy = match.outOfStock || status === 'saving' || !(quantity > 0)

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-gray-500">
            <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700">
              {rank}
            </span>
            {match.productCode}
          </p>
          <h3 className="mt-1 truncate text-sm font-semibold text-gray-950">{match.productName}</h3>
        </div>
        <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-700">
          Độ khớp {Math.round(match.confidence * 100)}%
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-gray-600">{match.reason}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 sm:grid-cols-4">
        <div>
          <dt className="uppercase tracking-wide">Lòng thùng</dt>
          <dd className="mt-0.5 font-medium text-gray-900">
            {match.maxDimensions ? formatDimensions(match.maxDimensions) : '—'}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Số lớp</dt>
          <dd className="mt-0.5 font-medium text-gray-900">{formatLayers(match.availableLayers)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Còn kho</dt>
          <dd
            className={`mt-0.5 font-medium ${match.outOfStock ? 'text-red-700' : match.availableStock <= 100 ? 'text-amber-700' : 'text-emerald-700'}`}
          >
            {match.availableStock.toLocaleString('vi-VN')} thùng
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Đơn giá</dt>
          <dd className="mt-0.5 font-medium text-gray-900">{formatCurrency(match.unitPrice)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <label className="sr-only" htmlFor={`stock-qty-${match.productId}`}>
          Số lượng
        </label>
        <Input
          id={`stock-qty-${match.productId}`}
          type="number"
          min={1}
          max={maxStock || undefined}
          step={1}
          value={quantity}
          disabled={match.outOfStock}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="h-8 w-24"
        />
        <Button size="sm" className="flex-1" disabled={busy} onClick={() => void add(payload)}>
          {status === 'added' ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Đã thêm
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {status === 'saving' ? 'Đang thêm...' : match.outOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
            </>
          )}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void buyNow(payload)}>
          <Lightning className="h-4 w-4" />
          Mua ngay
        </Button>
      </div>

      {status === 'error' && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!match.outOfStock && quantity > maxStock && (
        <p className="mt-2 text-xs text-amber-700">
          Vượt tồn kho — giảm xuống {maxStock.toLocaleString('vi-VN')} hoặc{' '}
          <Link href="/consultation" className="font-medium underline">
            đặt gia công phần thiếu
          </Link>
          .
        </p>
      )}
    </article>
  )
}
