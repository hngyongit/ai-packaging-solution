import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Consultation status badge — separate from OrderStatus to avoid TS conflicts
// ---------------------------------------------------------------------------

const CONSULTATION_STATUS_COLORS: Record<string, string> = {
  pending: 'border-gray-200 bg-gray-50 text-gray-700',
  ai_processed: 'border-blue-200 bg-blue-50 text-blue-700',
  pending_review: 'border-amber-200 bg-amber-50 text-amber-700',
  staff_reviewed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  quoted: 'border-purple-200 bg-purple-50 text-purple-700',
  converted: 'border-green-200 bg-green-50 text-green-700',
  closed: 'border-red-200 bg-red-50 text-red-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
}

const CONSULTATION_LABELS: Record<string, string> = {
  pending: 'Chờ AI',
  ai_processed: 'AI xử lý xong',
  pending_review: 'Chờ review',
  staff_reviewed: 'Nhân viên duyệt',
  quoted: 'Đã báo giá',
  converted: 'Đã chuyển đơn',
  closed: 'Đã đóng',
  cancelled: 'Đã hủy',
}

export function ConsultationStatusBadge({ status }: { status: string }) {
  const colorClass = CONSULTATION_STATUS_COLORS[status] ?? 'border-gray-200 bg-gray-50 text-gray-700'
  const label = CONSULTATION_LABELS[status] ?? status

  return (
    <span
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        colorClass
      )}
    >
      {label}
    </span>
  )
}
