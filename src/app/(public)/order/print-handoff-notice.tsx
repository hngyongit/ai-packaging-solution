'use client'

// Design Read: bảng xác nhận đơn B2B — khách chỉ cần thấy đúng thứ họ đã duyệt ở
// màn tư vấn. Thumbnail nhỏ, nhãn rõ, không trang trí. DENSITY 4 / MOTION 1.

import { Printer } from '@phosphor-icons/react'

import type { PrintHandoff } from '@/lib/mockup/handoff'

export function PrintHandoffNotice({ handoff }: { handoff: PrintHandoff }) {
  if (!handoff.mockupUrl && !handoff.dielineUrl) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      {handoff.mockupUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={handoff.mockupUrl}
          alt="Ảnh mockup thùng đã duyệt"
          className="h-16 w-16 shrink-0 rounded-md border border-gray-100 bg-gray-50 object-contain"
        />
      )}
      <div className="min-w-0 text-sm">
        <p className="flex items-center gap-1.5 font-medium text-gray-900">
          <Printer className="h-4 w-4 text-blue-600" weight="duotone" />
          Đã duyệt mockup in
          {handoff.printPositionLabel ? ` · ${handoff.printPositionLabel}` : ''}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {handoff.dielineUrl ? (
            <>
              Kèm file khuôn bế có hình in.{' '}
              <a href={handoff.dielineUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                Xem khuôn bế
              </a>
            </>
          ) : (
            'Xưởng sẽ gửi khuôn bế chốt trước khi sản xuất.'
          )}
        </p>
      </div>
    </div>
  )
}
