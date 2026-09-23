'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/**
 * Nút "Thanh toán ngay" — tạo link PayOS rồi redirect.
 * Chỉ hiện khi đơn chưa thanh toán + có total_amount > 0.
 */
export function PayNowButton({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Không hiện nếu đã thanh toán hoặc không có tổng tiền
  if (paymentStatus === 'paid') return null

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}/payos/create`, { method: 'POST' })
      const data = await res.json().catch(() => ({})) as { error?: string; paymentUrl?: string }

      if (!res.ok || !data.paymentUrl) {
        setError(data.error ?? 'Không thể tạo link thanh toán')
        setLoading(false)
        return
      }

      // Redirect đến PayOS checkout
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
        {loading ? 'Đang tải...' : 'Thanh toán ngay (PayOS)'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
