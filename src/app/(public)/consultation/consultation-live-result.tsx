'use client'

import { useState } from 'react'
import { CaretDown, Lightbulb, Package } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import type { AIRecommendation } from '@/lib/ai/types'

const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export type WorkshopResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; consultationId: string; recommendation: AIRecommendation }

export function LiveResultPanel({
  result,
  onRetry,
}: {
  result: WorkshopResult
  onRetry: () => void
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
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

function ReadyState({
  result,
}: {
  result: Extract<WorkshopResult, { status: 'ready' }>
}) {
  const r = result.recommendation
  const stars = Math.round(r.confidence * 5)
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">{r.boxType}</h3>
        <p className="text-sm text-gray-500">{r.boxStyle}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Kích thước" value={`${r.outerDimensions.length}x${r.outerDimensions.width}x${r.outerDimensions.height} cm`} />
        <MiniStat label="Số lớp" value={`Carton ${r.layers} lớp`} />
        <MiniStat label="Sóng" value={r.fluteType} />
        <MiniStat label="MOQ" value={`${r.moq.toLocaleString('vi-VN')} thùng`} />
      </div>

      <div className="rounded-lg bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-700 uppercase">Giá ước tính</p>
        <p className="mt-1 text-lg font-bold text-blue-700">
          {vnd(r.estimatedUnitPriceMin)} - {vnd(r.estimatedUnitPriceMax)}
          <span className="text-xs font-medium text-blue-600"> / thùng</span>
        </p>
        <p className="mt-0.5 text-xs text-blue-600">
          Tổng: {vnd(r.estimatedTotalMin)} - {vnd(r.estimatedTotalMax)}
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <p className="flex items-center gap-1 font-medium text-gray-700">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" weight="fill" />
          Lời khuyên
        </p>
        <p className="mt-1">{r.advice}</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium">Độ tin cậy:</span>
        <span className="text-amber-400">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
        <span>{Math.round(r.confidence * 100)}%</span>
      </div>

      {r.alternatives.length > 0 && <Alternatives result={result} />}

      <div className="space-y-2 pt-1">
        <Button className="w-full" onClick={() => window.location.assign('/order')}>
          Đặt hàng ngay
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => window.location.assign('/dashboard')}>
          Lưu để sau
        </Button>
        <p className="text-center text-[11px] text-gray-400">
          Mã tư vấn: {result.consultationId.slice(0, 8).toUpperCase()} · Nhân viên sẽ xác nhận trong 24h
        </p>
      </div>
    </div>
  )
}

function Alternatives({
  result,
}: {
  result: Extract<WorkshopResult, { status: 'ready' }>
}) {
  const [open, setOpen] = useState(false)
  const alts = result.recommendation.alternatives
  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        Lựa chọn khác ({alts.length})
        <CaretDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-gray-200 p-3">
          {alts.map((alt, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-800">{alt.boxType}</span>
              <span className="text-gray-500">
                {vnd(alt.estimatedUnitPriceMin)}-{vnd(alt.estimatedUnitPriceMax)} · {Math.round(alt.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}