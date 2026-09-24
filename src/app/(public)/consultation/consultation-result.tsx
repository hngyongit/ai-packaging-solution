'use client'

import { useState } from 'react'
import { CheckCircle, Lightbulb, Package, ShieldCheck } from '@phosphor-icons/react'

import { buttonVariants } from '@/components/ui/button'
import { type AIRecommendation } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

import { Alternatives } from './consultation-alternatives'
import { SaveAsTemplateButton } from './save-as-template-button'
import { PrintMockupPanel, EMPTY_MOCKUP, type MockupAssets } from './print-mockup-panel'
import { StepIndicator } from './step-indicator'
import { ContactForm } from './contact-form'

const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export function ConsultationResult({
  recommendation,
  consultationId,
  hasPrinting = false,
  initialMockup = EMPTY_MOCKUP,
}: {
  recommendation: AIRecommendation
  consultationId?: string
  hasPrinting?: boolean
  initialMockup?: MockupAssets
}) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(initialMockup.mockupUrl)
  const [mockupStatus, setMockupStatus] = useState('idle')
  const r = recommendation
  const stars = Math.round(r.confidence * 5)
  // Chặn đặt hàng tới khi có mockup; 503 (chưa cấu hình AI) thì không chặn.
  const blockedByMockup = hasPrinting && mockupStatus !== 'unavailable' && !mockupUrl

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

            {hasPrinting && consultationId && (
              <div className="mt-6">
                <PrintMockupPanel
                  consultationId={consultationId}
                  boxStyleId={r.boxStyleId ?? undefined}
                  initial={initialMockup}
                  onAssetsChange={(assets, status) => {
                    setMockupUrl(assets.mockupUrl)
                    setMockupStatus(status)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Alternatives alternatives={r.alternatives} />
        </div>

        {/* Form liên hệ + Mua ngay — customer tạo đơn trực tiếp từ AI recommendation */}
        {consultationId && (
          <ContactForm
            consultationId={consultationId}
            estimatedTotal={r.estimatedTotalMin ?? 0}
          />
        )}

        {/* Lưu làm mẫu */}
        {consultationId && <SaveAsTemplateButton consultationId={consultationId} size="lg" className="w-full mt-6" />}

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