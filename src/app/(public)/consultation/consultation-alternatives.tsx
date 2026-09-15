'use client'

import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'

import type { AIRecommendation } from '@/lib/ai/types'

const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

/**
 * Block "lựa chọn khác" dùng chung cho panel kết quả (compact) và trang kết quả.
 * Một bản duy nhất để hai màn không lệch giá/copy với nhau.
 */
export function Alternatives({
  alternatives,
  compact = false,
}: {
  alternatives: AIRecommendation['alternatives']
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  if (alternatives.length === 0) return null

  return (
    <div className={compact ? 'rounded-lg border border-gray-200' : 'overflow-hidden rounded-lg border border-gray-200 bg-white'}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          compact
            ? 'flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50'
            : 'flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50'
        }
      >
        {compact ? `Lựa chọn khác (${alternatives.length})` : `Xem các lựa chọn khác (${alternatives.length})`}
        <CaretDown className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={compact ? 'space-y-2 border-t border-gray-200 p-3' : 'space-y-3 border-t border-gray-200 p-4'}>
          {alternatives.map((alt, index) => (
            <div
              key={index}
              className={
                compact
                  ? 'flex items-center justify-between text-xs'
                  : 'flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm'
              }
            >
              <div className={compact ? 'font-medium text-gray-800' : ''}>
                <p className={compact ? '' : 'font-medium text-gray-900'}>{alt.boxType}</p>
                {compact ? null : <p className="text-gray-500">Carton {alt.layers} lớp</p>}
              </div>
              <div className={compact ? 'text-gray-500' : 'text-right text-sm'}>
                {compact ? (
                  <>
                    {vnd(alt.estimatedUnitPriceMin)}-{vnd(alt.estimatedUnitPriceMax)} ·{' '}
                    {Math.round(alt.confidence * 100)}%
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-blue-600">
                      {vnd(alt.estimatedUnitPriceMin)}-{vnd(alt.estimatedUnitPriceMax)}
                    </p>
                    <p className="text-gray-500">{Math.round(alt.confidence * 100)}% khớp</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
