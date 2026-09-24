import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ChatCircle, Spinner } from '@phosphor-icons/react/dist/ssr'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsultationStatusBadge } from '@/components/ui/consultation-status-badge'
import { formatDateTime, formatCurrency } from '@/lib/data/order-shared'
import { getCurrentProfile } from '@/lib/data/orders'
import { listCustomerConsultations, type CustomerConsultationRow } from '@/lib/data/customer-consultations'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type Params = { id: string }

function getStatusLabel(status: string) {
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

export default async function CustomerConsultationDetailPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'customer') redirect('/dashboard')

  // Fetch only this customer's consultations to ensure ownership
  const result = await listCustomerConsultations(profile.id).catch(() => ({ data: [], pagination: { total: 0, page: 1, totalPages: 1 } }))
  const consultation = result.data.find((c) => c.id === resolvedParams.id)
  if (!consultation) notFound()

  const r = consultation.ai_recommendation as any
  const dims = consultation.ai_suggested_dimensions
  const hasPrinting = consultation.has_printing === true

  return (
    <div className="space-y-6">
      <Link href="/dashboard/consultations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Danh sách tư vấn
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Tư vấn #{consultation.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo lúc {formatDateTime(consultation.created_at)}
          </p>
        </div>
        <ConsultationStatusBadge status={getStatusLabel(consultation.status)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Client Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu của bạn</CardTitle>
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
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          {r && (
            <Card>
              <CardHeader>
                <CardTitle>Tư vấn AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {r.boxStyleImageUrl && (
                  <div className="overflow-hidden rounded-lg bg-gray-100">
                    <img src={r.boxStyleImageUrl} alt={r.boxStyle} className="h-40 w-full object-cover" />
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
                {r.advice && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="flex items-center gap-1.5 font-medium">💡 Lời khuyên</p>
                    <p className="mt-1">{r.advice}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sales Notes (staff feedback) */}
          {consultation.sales_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Phản hồi từ nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                <blockquote className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  {consultation.sales_notes}
                </blockquote>
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
                      <img src={consultation.mockup_url} alt="Mockup" className="h-48 w-full object-cover" />
                    </div>
                  </div>
                )}
                {consultation.dieline_url && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">Die-cut</p>
                    <div className="overflow-hidden rounded-lg bg-gray-100">
                      <img src={consultation.dieline_url} alt="Die-cut" className="h-48 w-full object-cover" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Actions sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Show "Create Order" button if consultation is quoted/staff_reviewed */}
              {(consultation.status === 'quoted' || consultation.status === 'staff_reviewed') && (
                <Link
                  href={`/order/from-consultation/${consultation.id}`}
                  className={cn(buttonVariants({ size: 'sm' }), 'w-full')}
                >
                  📦 Tạo đơn hàng từ tư vấn này
                </Link>
              )}

              {consultation.status === 'needs_revision' && (
                <Link
                  href="/shop"
                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'w-full')}
                >
                  ✎ Chỉnh sửa & gửi lại
                </Link>
              )}

              {consultation.status === 'converted' && (
                <p className="text-sm text-green-600">✅ Đã chuyển thành đơn hàng</p>
              )}
            </CardContent>
          </Card>

          {/* Status info */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-gray-600">
                Trạng thái hiện tại: <span className="font-medium text-gray-900">{getStatusLabel(consultation.status)}</span>
              </p>
              <p className="text-gray-600">
                Cập nhật: {formatDateTime(consultation.updated_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}
