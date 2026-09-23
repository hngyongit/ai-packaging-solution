'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Prohibit, Factory } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { PriceChangeModal, isSignificantPriceChange, getPriceChangePercent } from '@/components/modals/PriceChange'
import { formatCurrency, toNumber } from '@/lib/data/order-shared'

/**
 * Hành động staff trên đơn — nút chính "Xác nhận & chốt giá" bắn PATCH status
 * confirmed (server trừ kho + chặn underflow). 409 (thiếu kho) hiện lỗi tại chỗ.
 */
export function StaffOrderActions({
  orderId,
  status,
  allowedTransitions,
  stockSummary,
  aiEstimatedPrice,
}: {
  orderId: string
  status: string
  allowedTransitions: string[]
  stockSummary: { stockCount: number; stockQty: number }
  aiEstimatedPrice?: number | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPriceModal, setShowPriceModal] = useState(false)

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

  async function handleConfirm() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm`, { method: 'POST' })
      const body = await response.json().catch(() => ({ error: 'Lỗi không xác định' }))
      if (!response.ok) {
        setError(body.error ?? 'Không thể xác nhận đơn hàng.')
        return
      }
      router.refresh()
    } catch {
      setError('Không thể kết nối đến máy chủ.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/orders/${orderId}/reject`, { method: 'POST' })
      const body = await response.json().catch(() => ({ error: 'Lỗi không xác định' }))
      if (!response.ok) {
        setError(body.error ?? 'Không thể từ chối đơn hàng.')
        return
      }
      router.refresh()
    } catch {
      setError('Không thể kết nối đến máy chủ.')
    } finally {
      setBusy(false)
    }
  }

  async function handleProduction() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'production' }),
      })
      const body = await response.json().catch(() => ({ error: 'Lỗi không xác định' }))
      if (!response.ok) {
        setError(body.error ?? 'Không thể chuyển sang sản xuất.')
        return
      }
      router.refresh()
    } catch {
      setError('Không thể kết nối đến máy chủ.')
    } finally {
      setBusy(false)
    }
  }

  // Check if price change is significant before confirming
  const hasAIestimate = aiEstimatedPrice && aiEstimatedPrice > 0
  const shouldShowPriceWarning = hasAIestimate && !busy && status === 'pending' && allowedTransitions.includes('confirmed')

  async function handleConfirmPriceChange(reason: string) {
    try {
      await handleConfirm()
    } catch {
      setError('Không thể xác nhận đơn hàng.')
    }
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
        <Button 
          className="w-full" 
          disabled={busy} 
          onClick={() => {
            if (shouldShowPriceWarning) {
              setShowPriceModal(true)
            } else {
              handleConfirm()
            }
          }}
        >
          <CheckCircle className="h-4 w-4" />
          {busy ? 'Đang xử lý...' : 'Xác nhận & chốt giá'}
        </Button>
      )}
      
      {/* Price warning indicator */}
      {shouldShowPriceWarning && (
        <p className="text-center text-xs text-amber-600">
          ⚠️ Giá AI ước tính: {formatCurrency(aiEstimatedPrice)} — sẽ hiển thị modal xác nhận
        </p>
      )}

      {canConfirm && stockSummary.stockCount > 0 && (
        <p className="text-center text-xs text-gray-500">
          Chốt đơn sẽ trừ {stockSummary.stockQty.toLocaleString('vi-VN')} thùng có sẵn ({stockSummary.stockCount} dòng).
        </p>
      )}
      {canConfirm && stockSummary.stockCount === 0 && (
        <p className="text-center text-xs text-gray-400">Toàn bộ là hàng gia công — chốt không trừ kho.</p>
      )}
      {goesToProduction && (
        <Button variant="outline" className="w-full" disabled={busy} onClick={handleProduction}>
          <Factory className="h-4 w-4" />
          Xác nhận & Chuyển sang sản xuất
        </Button>
      )}
      {canCancel && (
        <Button variant="outline" className="w-full text-red-600 hover:text-red-700" disabled={busy} onClick={handleReject}>
          <Prohibit className="h-4 w-4" />
          Từ chối đơn{status === 'confirmed' ? ' (hoàn kho)' : ''}
        </Button>
      )}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Price Change Modal */}
      {hasAIestimate && (
        <PriceChangeModal
          aiPrice={aiEstimatedPrice!}
          staffPrice={toNumber(0)} // Will be compared server-side
          open={showPriceModal}
          onOpenChange={setShowPriceModal}
          onConfirm={handleConfirmPriceChange}
        />
      )}
    </div>
  )
}
