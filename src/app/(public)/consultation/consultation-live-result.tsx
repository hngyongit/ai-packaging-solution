'use client'

import { Package } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

import { ReadyState, vnd, type WorkshopResult } from './consultation-ready-state'

export { ReadyState, vnd }
export type { WorkshopResult }

export function LiveResultPanel({
  result,
  onRetry,
  selectedPreviewUrl,
}: {
  result: WorkshopResult
  onRetry: () => void
  selectedPreviewUrl?: string
}) {
  const readyImageUrl = result.status === 'ready' ? result.recommendation.boxStyleImageUrl : undefined
  const imageUrl = readyImageUrl ?? selectedPreviewUrl

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      {imageUrl && (
        <div className="aspect-[16/8] overflow-hidden border-b border-gray-200 bg-gray-50">
          <img src={imageUrl} alt="Kiểu thùng" className="h-full w-full object-contain" />
        </div>
      )}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <Package className="h-4 w-4 text-blue-600" weight="duotone" />
          Kết quả AI
        </p>
        <StatusBadge status={result.status} />
      </div>

      <div className="flex-1 p-4">
        {result.status === 'idle' && <IdleState />}
        {result.status === 'loading' && <LoadingState />}
        {result.status === 'error' && <ErrorState message={result.message} onRetry={onRetry} />}
        {result.status === 'ready' && <ReadyState result={result} />}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: WorkshopResult['status'] }) {
  const styles =
    status === 'ready'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'loading'
        ? 'bg-blue-100 text-blue-800'
        : status === 'error'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-600'
  const label =
    status === 'ready' ? 'Hoàn tất' : status === 'loading' ? 'Đang phân tích' : status === 'error' ? 'Lỗi' : 'Chưa có'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  )
}

function IdleState() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-10 text-center">
      <Package className="h-8 w-8 text-gray-300" weight="duotone" />
      <p className="mt-3 text-sm font-medium text-gray-700">Điền thông số bên trái</p>
      <p className="mt-1 text-xs text-gray-500">AI sẽ đưa ra đề xuất thùng carton tại đây, ngay trên cùng màn hình.</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-2/3 rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 rounded-lg bg-gray-100" />
        <div className="h-16 rounded-lg bg-gray-100" />
      </div>
      <div className="h-24 rounded-lg bg-gray-100" />
      <div className="h-16 rounded-lg bg-gray-100" />
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
      <p className="text-sm font-medium text-red-700">Không thể phân tích</p>
      <p className="mt-1 text-xs text-red-600">{message}</p>
      <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  )
}
