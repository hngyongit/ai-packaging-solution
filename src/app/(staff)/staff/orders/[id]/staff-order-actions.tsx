'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Prohibit } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

/**
 * Hành động staff trên đơn — nút chính "Xác nhận & chốt giá" bắn PATCH status
 * confirmed (server trừ kho + chặn underflow). 409 (thiếu kho) hiện lỗi tại chỗ.
 */
export function StaffOrderActions({
  orderId,
  status,
  allowedTransitions,
  stockSummary,
}: {
  orderId: string
  status: string
  allowedTransitions: string[]
  stockSummary: { stockCount: number; stockQty: number }
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function patchStatus(next: string) {
    setBusy(true)
    setError('')
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    if (!response.ok) {
      setError(body?.error ?? 'Không chuyển được trạng thái đơn.')
      setBusy(false)
      return
    }
    setBusy(false)
    router.refresh()
  }

  if (status === 'cancelled' || status === 'delivered') {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
        Đơn đã kết thúc ({status === 'cancelled' ? 'đã hủy' : 'đã giao'}).
      </p>
    )
  }

  const canConfirm = allowedTransitions.includes('confirmed')
  const canCancel = allowedTransitions.includes('cancelled')
  const goesToProduction = status === 'confirmed'

  return (
    <div className="space-y-2">
      {canConfirm && (
        <Button className="w-full" disabled={busy} onClick={() => patchStatus('confirmed')}>
          <CheckCircle className="h-4 w-4" />
          {busy ? 'Đang chốt...' : 'Xác nhận & chốt giá'}
        </Button>
      )}
      {canConfirm && stockSummary.stockCount > 0 && (
        <p className="text-center text-xs text-gray-500">
          Chốt đơn sẽ trừ {stockSummary.stockQty.toLocaleString('vi-VN')} thùng có sẵn ({stockSummary.stockCount} dòng).
        </p>
      )}
      {canConfirm && stockSummary.stockCount === 0 && (
        <p className="text-center text-xs text-gray-400">Toàn bộ là hàng gia công — chốt không trừ kho.</p>
      )}
      {goesToProduction && allowedTransitions.includes('production') && (
        <Button variant="outline" className="w-full" disabled={busy} onClick={() => patchStatus('production')}>
          Chuyển sang sản xuất
        </Button>
      )}
      {canCancel && (
        <Button variant="outline" className="w-full text-red-600 hover:text-red-700" disabled={busy} onClick={() => patchStatus('cancelled')}>
          <Prohibit className="h-4 w-4" />
          Hủy đơn{status === 'confirmed' ? ' (hoàn kho)' : ''}
        </Button>
      )}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
