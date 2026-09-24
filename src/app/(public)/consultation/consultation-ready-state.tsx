'use client'

import { useState } from 'react'
import { Lightbulb, Package, ShieldCheck } from '@phosphor-icons/react'

import { CustomCartActions } from '@/components/cart/custom-cart-actions'
import type { AIRecommendation } from '@/lib/ai/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { Alternatives } from './consultation-alternatives'
import { SaveAsTemplateButton } from './save-as-template-button'
import { PrintMockupPanel } from './print-mockup-panel'

export const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export type WorkshopResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; consultationId: string; recommendation: AIRecommendation; hasPrinting: boolean }

export type ReadyResult = Extract<WorkshopResult, { status: 'ready' }>

export function ReadyState({ result }: { result: ReadyResult }) {
  const r = result.recommendation
  const stars = Math.round(r.confidence * 5)
  // Chặn đặt hàng tới khi khách xem được mockup (quyết định đã chốt với product).
  // 'unavailable' = AI/Cloudinary chưa cấu hình → không chặn ở môi trường dev.
  const [mockupUrl, setMockupUrl] = useState<string | null>(null)
  const [mockupStatus, setMockupStatus] = useState('idle')
  const blockedByMockup = result.hasPrinting && mockupStatus !== 'unavailable' && !mockupUrl

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
          {r.boxStyleImageUrl ? (
            <img src={r.boxStyleImageUrl} alt={r.boxStyle} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <Package className="h-8 w-8 text-gray-300" weight="duotone" />
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{r.boxType}</h3>
          <p className="text-sm text-gray-500">{r.boxStyle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Kích thước" value={`${r.outerDimensions.length}x${r.outerDimensions.width}x${r.outerDimensions.height} cm`} />
        <MiniStat label="Số lớp" value={`Carton ${r.layers} lớp`} />
        <MiniStat label="Sóng" value={r.fluteType} />
        <MiniStat label="MOQ" value={`${r.moq.toLocaleString('vi-VN')} thùng`} />
      </div>

      {r.packagingProtection && <ProtectionBox protection={r.packagingProtection} />}

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

      {result.hasPrinting && (
        <PrintMockupPanel
          consultationId={result.consultationId}
          boxStyleId={r.boxStyleId ?? undefined}
          onAssetsChange={(assets, status) => {
            setMockupUrl(assets.mockupUrl)
            setMockupStatus(status)
          }}
        />
      )}

      <Alternatives alternatives={r.alternatives} compact />

      <div className="space-y-2 pt-1">
        {/* Hành động: Tạo đơn hàng (group) */}
        <CustomCartActions
          className="space-y-2"
          disabled={blockedByMockup}
          payload={{
            kind: 'custom',
            consultationId: result.consultationId,
            productId: r.suggestedProductId ?? undefined,
            quantity: r.moq,
            hasPrinting: result.hasPrinting,
          }}
        />
        {blockedByMockup && (
          <p className="text-center text-[11px] text-gray-500">Tạo ảnh mockup để tiếp tục đặt hàng.</p>
        )}
        <SaveAsTemplateButton consultationId={result.consultationId} className="w-full" />
        <p className="text-center text-[11px] text-gray-400">
          Mã tư vấn: {result.consultationId.slice(0, 8).toUpperCase()} · Nhân viên sẽ xác nhận trong 24h
        </p>
      </div>
    </div>
  )
}

function ProtectionBox({ protection: p }: { protection: AIRecommendation['packagingProtection'] }) {
  return (
    <div className="rounded-lg bg-amber-50 p-3">
      <p className="flex items-center gap-1 text-xs font-medium text-amber-700">
        <ShieldCheck className="h-3.5 w-3.5" weight="fill" />
        Bọc bảo vệ
      </p>
      <p className="mt-1 text-xs text-amber-800">
        <span className="font-semibold">{p.material}</span>
        {p.thicknessCm > 0 ? ` (+${p.thicknessCm}cm mỗi chiều)` : ''}
      </p>
      <p className="mt-0.5 text-xs text-amber-700/80">{p.howToWrap}</p>
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
