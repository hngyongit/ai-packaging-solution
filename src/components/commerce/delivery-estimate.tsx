'use client'

import { useEffect, useState } from 'react'
import { Truck } from '@phosphor-icons/react'

type DeliveryKind = 'stock' | 'custom'

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date)
  let remaining = days
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const weekday = result.getDay()
    if (weekday !== 0 && weekday !== 6) remaining -= 1
  }
  return result
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function estimate(kind: DeliveryKind) {
  const today = new Date()
  if (kind === 'stock') {
    return `Dự kiến nhận hàng ${formatDate(addBusinessDays(today, 3))}-${formatDate(addBusinessDays(today, 4))} (3-4 ngày làm việc).`
  }
  const arrival = new Date(today)
  arrival.setDate(arrival.getDate() + 15)
  return `Dự kiến nhận hàng khoảng ${formatDate(arrival)} (khoảng 15 ngày).`
}

export function DeliveryEstimate({ kind, compact = false }: { kind: DeliveryKind; compact?: boolean }) {
  const [message, setMessage] = useState(kind === 'stock' ? 'Dự kiến giao sau 3-4 ngày làm việc.' : 'Dự kiến giao sau khoảng 15 ngày.')

  useEffect(() => {
    setMessage(estimate(kind))
  }, [kind])

  return (
    <p className={compact ? 'flex gap-1.5 text-xs leading-5 text-gray-500' : 'flex gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm leading-5 text-emerald-950'}>
      <Truck className={compact ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600' : 'mt-0.5 h-4 w-4 shrink-0 text-emerald-700'} aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}
