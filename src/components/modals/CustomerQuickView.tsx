'use client'

import Link from 'next/link'
import { Buildings, EnvelopeSimple, Phone, User } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, type OrderStatus } from '@/lib/data/order-shared'

export type CustomerQuickViewInfo = {
  id: string
  full_name: string | null
  phone: string | null
  email?: string | null
  company?: string | null
}

export type CustomerQuickViewStats = {
  totalOrders: number
  totalSpent: number | string
  lastOrderAt: string | null
}

export type CustomerQuickViewOrder = {
  id: string
  order_code: string
  total_amount: number | string
  created_at: string
  status: OrderStatus
}

type CustomerQuickViewModalProps = {
  customer: CustomerQuickViewInfo
  stats: CustomerQuickViewStats
  recentOrders: CustomerQuickViewOrder[]
  open: boolean
  onOpenChange: (open: boolean) => void
  viewAllHref?: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(
    new Date(value)
  )
}

export function CustomerQuickViewModal({
  customer,
  stats,
  recentOrders,
  open,
  onOpenChange,
  viewAllHref,
}: CustomerQuickViewModalProps) {
  return (
    <Modal
      title={customer.full_name ?? 'Khách hàng'}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {viewAllHref ? (
            <Button
              size="lg"
              render={<Link href={viewAllHref} />}
              onClick={() => onOpenChange(false)}
            >
              Xem tất cả đơn hàng
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5">
        <ul className="space-y-2 text-sm">
          <ContactRow icon={<Phone className="h-4 w-4" />} value={customer.phone} fallback="Chưa có số điện thoại" />
          <ContactRow
            icon={<EnvelopeSimple className="h-4 w-4" />}
            value={customer.email}
            fallback="Chưa có email"
          />
          <ContactRow icon={<Buildings className="h-4 w-4" />} value={customer.company} fallback="Khách hàng cá nhân" />
        </ul>

        <section>
          <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">Thống kê</h3>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            <StatBlock label="Tổng đơn" value={String(stats.totalOrders)} />
            <StatBlock label="Tổng chi" value={formatCurrency(stats.totalSpent)} />
            <StatBlock
              label="Đơn gần nhất"
              value={stats.lastOrderAt ? formatDate(stats.lastOrderAt) : '—'}
            />
          </dl>
        </section>

        <section>
          <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">Đơn hàng gần đây</h3>
          {recentOrders.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">#{order.order_code}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Khách hàng chưa có đơn hàng nào.</p>
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}

function ContactRow({ icon, value, fallback }: { icon: React.ReactNode; value?: string | null; fallback: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
        {icon}
      </span>
      <span className={value ? 'font-medium text-gray-900' : 'text-gray-500'}>{value ?? fallback}</span>
    </li>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-gray-950">{value}</dd>
    </div>
  )
}
