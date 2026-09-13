'use client'

import { useState } from 'react'
import { CaretDown, CheckCircle, Lightbulb, Package, PiggyBank, ShieldCheck } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { type AIRecommendation } from '@/lib/ai/types'

import { StepIndicator } from './step-indicator'

const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export function ConsultationResult({ recommendation }: { recommendation: AIRecommendation }) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const r = recommendation
  const stars = Math.round(r.confidence * 5)

  return (
    <section className="bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <StepIndicator current={2} />

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            <CheckCircle className="mr-2 inline h-6 w-6 text-emerald-500" weight="fill" />
            AI đã phân tích sản phẩm của bạn!
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Dựa trên thông số bạn cung cấp, chúng tôi đề xuất:
          </p>
        </div>

        {/* Recommendation card */}
        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="p-6">
            <div className="grid gap-6 lg:grid-cols-[9rem_1fr]">
              <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                {r.boxStyleImageUrl ? (
                  <img src={r.boxStyleImageUrl} alt={r.boxStyle} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Package className="h-16 w-16 text-blue-600" weight="duotone" />
                )}
              </div>
              <div className="space-y-2.5 text-sm">
                <h2 className="text-lg font-bold text-gray-900">{r.boxType}</h2>
                <SpecRow label="Kiểu thùng" value={r.boxStyle} />
                <SpecRow label="Kích thước" value={`${r.outerDimensions.length} × ${r.outerDimensions.width} × ${r.outerDimensions.height} cm`} />
                <SpecRow label="Số lớp" value={`Carton ${r.layers} lớp`} />
                <SpecRow label="Sóng" value={r.fluteType} />
                <SpecRow label="Chất liệu" value={r.materialDescription} />
                <SpecRow label="In ấn" value={r.printingRecommendation} />
                {r.packagingProtection && (
                  <SpecRow label="Bọc bảo vệ" value={`${r.packagingProtection.material}${r.packagingProtection.thicknessCm > 0 ? ` (+${r.packagingProtection.thicknessCm}cm mỗi chiều)` : ''}`} />
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Giá ước tính</p>
                <p className="mt-1 text-xl font-bold text-blue-600">
                  {vnd(r.estimatedUnitPriceMin)} - {vnd(r.estimatedUnitPriceMax)}
                  <span className="text-sm font-medium text-gray-500"> / thùng</span>
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Tổng: {vnd(r.estimatedTotalMin)} - {vnd(r.estimatedTotalMax)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Số lượng tối thiểu</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{r.moq.toLocaleString('vi-VN')} thùng</p>
                <p className="mt-1 text-sm text-gray-600">Linh hoạt với khách nhập hàng liên tục</p>
              </div>
            </div>

            {/* Packaging protection */}
            {r.packagingProtection && (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-amber-800">
                  <ShieldCheck className="h-4 w-4" />
                  Bọc bảo vệ khuyến nghị
                </p>
                <p className="mt-1.5 text-amber-800">
                  <span className="font-semibold">{r.packagingProtection.material}</span>
                  {r.packagingProtection.thicknessCm > 0 && (
                    <span> ({r.packagingProtection.thicknessCm}cm mỗi chiều, bọc 2 phía)</span>
                  )}
                </p>
                <p className="mt-1 text-amber-700">{r.packagingProtection.howToWrap}</p>
                {r.packagingProtection.thicknessCm > 0 && (
                  <p className="mt-2 rounded bg-white/70 px-2.5 py-1.5 text-xs text-amber-700">
                    Kích thước thùng đã bao gồm phần này (sản phẩm + dung sai + 2 ×{' '}
                    {r.packagingProtection.thicknessCm}cm bọc).
                  </p>
                )}
              </div>
            )}

            {/* Advice box */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="flex items-center gap-1.5 font-medium">
              <Lightbulb className="h-4 w-4" />
              Lời khuyên của AI
            </p>
              <p className="mt-1">{r.advice}</p>
            </div>

            {/* Confidence */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Độ tin cậy:</span>
              <span className="text-amber-400">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
              <span>{Math.round(r.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Alternatives */}
        {r.alternatives.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setShowAlternatives((open) => !open)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Xem các lựa chọn khác ({r.alternatives.length})
              <CaretDown className={`h-4 w-4 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
            </button>
            {showAlternatives && (
              <div className="space-y-3 border-t border-gray-200 p-4">
                {r.alternatives.map((alt, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{alt.boxType}</p>
                      <p className="text-gray-500">Carton {alt.layers} lớp</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-blue-600">{vnd(alt.estimatedUnitPriceMin)}-{vnd(alt.estimatedUnitPriceMax)}</p>
                      <p className="text-gray-500">{Math.round(alt.confidence * 100)}% khớp</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button size="lg" className="w-full" onClick={() => window.location.assign('/order')}>
            <Package className="h-4 w-4" />
            Đặt hàng ngay
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => window.location.assign('/dashboard')}>
            <PiggyBank className="h-4 w-4" />
            Lưu để sau
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Sau khi đặt hàng, nhân viên của chúng tôi sẽ xác nhận giá và thời gian sản xuất trong vòng 24h.
        </p>
      </div>
    </section>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-gray-500">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}