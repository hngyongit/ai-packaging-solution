'use client'

import { useState } from 'react'
import { CreditCard } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

/**
 * Nút "Thanh toán ngay" — tạo link PayOS rồi redirect sang cổng thanh toán.
 *
 * Đặt ở src/components/checkout vì dùng chung cho 2 route group
 * (dashboard/orders/[id] và dashboard/checkout) — repo cấm import chéo route group.
 *
 * resumeUrl: link PayOS còn mở của đơn (orders.payos_checkout_url). Có thì đi thẳng,
 * khỏi round-trip tạo link. Không có thì gọi API tạo link mới.
 */
export function PayNowButton({
  orderId,
  resumeUrl,
  label = 'Thanh toán ngay',
}: {
  orderId: string
  resumeUrl?: string | null
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')

    if (resumeUrl) {
      window.location.href = resumeUrl
      return
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/payos/create`, { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as { error?: string; paymentUrl?: string }

      if (!res.ok || !data.paymentUrl) {
        setError(data.error ?? 'Không thể tạo link thanh toán')
        setLoading(false)
        return
      }

      window.location.href = data.paymentUrl
    } catch {
      setError('Không thể kết nối đến máy chủ.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading} className="w-full sm:w-auto">
        <CreditCard className="mr-2 h-4 w-4" />
        {loading ? 'Đang tải...' : `${label} (PayOS)`}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
