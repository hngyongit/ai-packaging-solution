'use client'

import Link from 'next/link'
import { ShoppingCart } from '@phosphor-icons/react'

import { buttonVariants } from '@/components/ui/button'
import { ConsultationStatusBadge } from '@/components/ui/consultation-status-badge'
import { formatDateTime, formatCurrency } from '@/lib/data/order-shared'
import type { CustomerConsultationRow } from '@/lib/data/customer-consultations'
import { cn } from '@/lib/utils'

type Props = {
  c: CustomerConsultationRow
}

export function ConsultationCard({ c }: Props) {
  const r = c.ai_recommendation as any
  const dims = c.ai_suggested_dimensions
  const canCreateOrder = c.status === 'quoted' || c.status === 'staff_reviewed'
  const priceMin = r?.estimatedUnitPriceMin ?? 0
  const priceMax = r?.estimatedUnitPriceMax ?? 0
  const qty = c.desired_quantity ?? 0

  return (
    <Link
      href={`/dashboard/consultations/${c.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs text-gray-500">
              #{c.id.slice(0, 8).toUpperCase()}
            </p>
            <ConsultationStatusBadge status={c.status} />
          </div>
          <p className="mt-1 font-medium text-gray-900">{c.product_type}</p>
          {dims && (
            <p className="mt-0.5 text-sm text-gray-500">
              {dims.length} × {dims.width} × {dims.height} cm
            </p>
          )}
          {qty > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">
              Số lượng: {qty.toLocaleString('vi-VN')} thùng
            </p>
          )}
          {priceMin > 0 && (
            <p className="mt-1 text-sm font-semibold text-blue-600">
              Giá ước tính: {formatCurrency(priceMin)} - {formatCurrency(priceMax)} / thùng
              {qty > 0 && (
                <span className="ml-1 text-gray-500 font-normal">
                  (~{formatCurrency((priceMin + priceMax) / 2 * qty)})
                </span>
              )}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {formatDateTime(c.created_at)}
          </p>
        </div>
        {canCreateOrder && (
          <div className="shrink-0">
            <Link
              href={`/order/from-consultation/${c.id}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
            >
              <ShoppingCart className="h-4 w-4" weight="fill" />
              Tạo đơn
            </Link>
          </div>
        )}
      </div>
    </Link>
  )
}
