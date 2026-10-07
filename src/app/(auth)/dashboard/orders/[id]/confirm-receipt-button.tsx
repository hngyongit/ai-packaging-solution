'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

/**
 * Khách tự xác nhận đã nhận hàng — đóng đơn từ `delivering` sang `delivered`.
 *
 * Đi qua PATCH /api/orders/[id]/status như mọi lần đổi trạng thái khác, nên
 * CUSTOMER_TRANSITIONS ở lib/data/orders-status là nơi duy nhất định quyền:
 * chỉ đơn đang giao mới bấm được, và chỉ được sang `delivered`.
 */
export function ConfirmReceiptButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setBusy(true)
    setError('')
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    })
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    setBusy(false)
    if (!response.ok) {
      setError(body?.error ?? 'Không xác nhận được. Vui lòng thử lại.')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="lg" disabled={busy} onClick={handleClick}>
        <CheckSquare className="h-4 w-4" />
        {busy ? 'Đang xác nhận...' : 'Xác nhận đã nhận hàng'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
