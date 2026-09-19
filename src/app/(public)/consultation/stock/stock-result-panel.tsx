'use client'

import Link from 'next/link'
import { Package } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { type StockMatch } from '@/lib/ai/types'

import { StockMatchCard } from './stock-match-card'

export type StockResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; matches: StockMatch[] }

/** Panel kết quả bên phải — cùng shell với LiveResultPanel của trang tư vấn custom. */
export function StockResultPanel({ result, onRetry }: { result: StockResult; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <Package className="h-4 w-4 text-blue-600" weight="duotone" />
          Mẫu thùng có sẵn
        </p>
        <StatusBadge status={result.status} />
      </div>

      <div className="flex-1 space-y-3 p-4">
        {result.status === 'idle' && <IdleState />}
        {result.status === 'loading' && <LoadingState />}
        {result.status === 'error' && <ErrorState message={result.message} onRetry={onRetry} />}
        {result.status === 'ready' &&
          (result.matches.length === 0 ? (
            <NoMatchState />
          ) : (
            <>
              {result.matches.map((match, index) => (
                <StockMatchCard key={match.productId} match={match} rank={index + 1} />
              ))}
              <p className="pt-1 text-center text-xs text-gray-500">
                Cần mẫu khác?{' '}
                <Link href="/shop" className="font-medium text-blue-600 hover:text-blue-700">
                  Xem tất cả hàng trong kho
                </Link>
              </p>
            </>
          ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: StockResult['status'] }) {
  const styles =
    status === 'ready'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'loading'
        ? 'bg-blue-100 text-blue-800'
        : status === 'error'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-600'
  const label = status === 'ready' ? 'Hoàn tất' : status === 'loading' ? 'Đang tìm' : status === 'error' ? 'Lỗi' : 'Chưa có'
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{label}</span>
}

function IdleState() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-10 text-center">
      <Package className="h-8 w-8 text-gray-300" weight="duotone" />
      <p className="mt-3 text-sm font-medium text-gray-700">Điền thông số bên trái</p>
      <p className="mt-1 text-xs text-gray-500">AI sẽ liệt kê mẫu thùng đang có kho khớp nhất, kèm số lượng đặt được.</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-4">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-2/3 rounded bg-gray-100" />
          <div className="h-8 w-full rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
      <p className="text-sm font-medium text-red-700">Không tìm được mẫu</p>
      <p className="mt-1 text-xs text-red-600">{message}</p>
      <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  )
}

function NoMatchState() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-10 text-center">
      <p className="text-sm font-medium text-gray-900">Kho chưa có mẫu nào chứa vừa sản phẩm của bạn</p>
      <p className="mt-1 max-w-xs text-xs text-gray-500">
        Thùng theo yêu cầu được may đo đúng kích thước bạn cần, nhận từ 500 thùng.
      </p>
      <Link
        href="/consultation"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Tư vấn thùng theo yêu cầu
      </Link>
    </div>
  )
}
