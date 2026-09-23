import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CalendarCheck, Package } from '@phosphor-icons/react/dist/ssr'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsultationStatusBadge } from '@/components/ui/consultation-status-badge'
import { formatCurrency, formatDateTime } from '@/lib/data/order-shared'
import { getCurrentProfile } from '@/lib/data/orders'
import { assertStaff, ProductAdminError } from '@/lib/data/products-admin'
import { getConsultationFull, updateConsultationStatus } from '@/lib/data/consultations-list'
import { cn } from '@/lib/utils'
import { ConsultationActionSidebar } from './consultation-action-sidebar'

export const dynamic = 'force-dynamic'

type Params = { id: string }

function getConsultationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Chờ AI',
    ai_processed: 'AI xử lý xong',
    pending_review: 'Chờ review',
    staff_reviewed: 'Nhân viên duyệt',
    quoted: 'Đã báo giá',
    converted: 'Đã chuyển đơn',
    closed: 'Đã đóng',
    cancelled: 'Đã hủy',
  }
  return labels[status] ?? status
}

function formatDims(dimensions: { length?: number; width?: number; height?: number } | null) {
  if (!dimensions) return '—'
  const { length, width, height } = dimensions
  if (!length || !width || !height) return 'Tùy chỉnh'
  return `${length} × ${width} × ${height} cm`
}

export default async function StaffConsultationDetailPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  try {
    assertStaff(profile)
  } catch (error) {
    if (error instanceof ProductAdminError) redirect('/dashboard')
    throw error
  }

  const consultation = await getConsultationFull(resolvedParams.id).catch(() => null)
  if (!consultation) notFound()

  const r = consultation.ai_recommendation as any
  const dims = consultation.ai_suggested_dimensions
  const hasPrinting = consultation.has_printing === true

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/staff/consultations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Danh sách tư vấn
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Tư vấn #{consultation.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo lúc {formatDateTime(consultation.created_at)}
          </p>
        </div>
        <ConsultationStatusBadge status={getConsultationStatusLabel(consultation.status)} />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        {/* Left column — Client input + AI recommendation */}
        <div className="space-y-6">
          {/* Client Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu của khách</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SpecRow label="Sản phẩm" value={consultation.product_type} />
              <SpecRow label="Kích thước" value={formatDims(dims)} />
              {consultation.product_weight && (
                <SpecRow label="Trọng lượng" value={`${consultation.product_weight}g`} />
              )}
              {consultation.desired_quantity && (
                <SpecRow label="Số lượng" value={`${consultation.desired_quantity} thùng`} />
              )}
              <SpecRow label="In ấn" value={hasPrinting ? 'Có' : 'Không'} />
              {consultation.print_faces && (
                <SpecRow label="Mặt in" value={consultation.print_faces} />
              )}
              {consultation.notes && (
                <blockquote className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 italic">
                  "{consultation.notes}"
                </blockquote>
              )}
              {/* Customer contact info */}
              <div className="mt-4 flex gap-3 text-sm">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{consultation.customer_name ?? 'Ẩn danh'}</p>
                  <p className="text-gray-500">{consultation.customer_phone ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          {r && (
            <Card>
              <CardHeader>
                <CardTitle>Tư vấn AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Box style image */}
                {r.boxStyleImageUrl && (
                  <div className="overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={r.boxStyleImageUrl}
                      alt={r.boxStyle}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <SpecRow label="Kiểu thùng" value={r.boxStyle} />
                  <SpecRow label="Kích thước đề xuất" value={formatDims(r.outerDimensions)} />
                  <SpecRow label="Số lớp" value={`${r.layers} lớp`} />
                  <SpecRow label="Sóng" value={r.fluteType} />
                  <SpecRow label="MOQ" value={`${r.moq?.toLocaleString('vi-VN')} thùng`} />
                  <SpecRow label="Lead time" value={`${r.leadTimeDays} ngày`} />
                </div>

                {/* Price */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-700 uppercase">Giá ước tính</p>
                  <p className="mt-1 text-lg font-bold text-blue-700">
                    {formatCurrency(r.estimatedUnitPriceMin)} - {formatCurrency(r.estimatedUnitPriceMax)}
                    <span className="text-sm font-medium text-blue-600"> / thùng</span>
                  </p>
                  <p className="mt-0.5 text-sm text-blue-600">
                    Tổng: {formatCurrency(r.estimatedTotalMin)} - {formatCurrency(r.estimatedTotalMax)}
                  </p>
                </div>

                {/* Advice */}
                {r.advice && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="flex items-center gap-1.5 font-medium">
                      💡 Lời khuyên
                    </p>
                    <p className="mt-1">{r.advice}</p>
                  </div>
                )}

                {/* Confidence */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Độ tin cậy:</span>
                  <span className="text-amber-400">
                    {'★'.repeat(Math.round(r.confidence * 5))}{'☆'.repeat(5 - Math.round(r.confidence * 5))}
                  </span>
                  <span>{Math.round(r.confidence * 100)}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mockup Preview */}
          {(consultation.mockup_url || consultation.dieline_url) && (
            <Card>
              <CardHeader>
                <CardTitle>Xem trước</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consultation.mockup_url && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">Mockup</p>
                    <div className="overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={consultation.mockup_url}
                        alt="Mockup"
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {consultation.dieline_url && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">Die-cut</p>
                    <div className="overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={consultation.dieline_url}
                        alt="Die-cut"
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Actions sidebar (Client Component) */}
        <ConsultationActionSidebar
          consultationId={consultation.id}
          status={consultation.status}
          assigned_name={consultation.assigned_name}
          assigned_to={consultation.assigned_to}
          sales_notes={consultation.sales_notes}
          currentUserId={profile.id}
          profileFullName={profile.full_name || ''}
        />
      </div>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 text-gray-500">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}
