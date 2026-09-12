'use client'

import { useState } from 'react'
import { WarningCircle, XCircle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

const CANCEL_REASONS = [
  { value: 'changed_need', label: 'Thay đổi nhu cầu' },
  { value: 'cheaper_elsewhere', label: 'Tìm được nơi khác rẻ hơn' },
  { value: 'delivery_too_long', label: 'Thời gian giao hàng quá lâu' },
  { value: 'other', label: 'Khác' },
] as const

type CancelReason = (typeof CANCEL_REASONS)[number]['value']

type CancelOrderModalProps = {
  orderId: string
  orderCode?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelled?: () => void
}

export function CancelOrderModal({ orderId, orderCode, open, onOpenChange, onCancelled }: CancelOrderModalProps) {
  const [reason, setReason] = useState<CancelReason>('changed_need')
  const [otherReason, setOtherReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState('')

  function handleOpenChange(nextOpen: boolean) {
    if (isCancelling) return
    onOpenChange(nextOpen)
    if (!nextOpen) setError('')
  }

  function buildNotes() {
    const label = CANCEL_REASONS.find((item) => item.value === reason)?.label ?? ''
    const detail = reason === 'other' ? otherReason.trim() : ''
    return detail ? `Khách hàng hủy đơn: ${label} — ${detail}` : `Khách hàng hủy đơn: ${label}`
  }

  async function cancelOrder() {
    if (reason === 'other' && !otherReason.trim()) {
      setError('Vui lòng nhập lý do hủy đơn.')
      return
    }

    setIsCancelling(true)
    setError('')

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', notes: buildNotes() }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? 'Không thể hủy đơn hàng')
      }

      handleOpenChange(false)
      onCancelled?.()
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Không thể hủy đơn hàng')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Modal
      title="Xác nhận hủy đơn hàng"
      description={`Bạn có chắc chắn muốn hủy đơn hàng${orderCode ? ` #${orderCode}` : ''}? Hành động này không thể hoàn tác.`}
      open={open}
      onOpenChange={handleOpenChange}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" disabled={isCancelling} onClick={() => handleOpenChange(false)}>
            Giữ đơn hàng
          </Button>
          <Button type="button" variant="destructive" size="lg" disabled={isCancelling} onClick={cancelOrder}>
            <XCircle className="h-4 w-4" />
            {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">Lý do hủy</legend>
          {CANCEL_REASONS.map((item) => (
            <label key={item.value} className="flex items-center gap-3 rounded-md px-1 py-1.5 text-sm text-gray-700">
              <input
                type="radio"
                name="cancel-reason"
                value={item.value}
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {item.label}
            </label>
          ))}
          {reason === 'other' ? (
            <input
              type="text"
              value={otherReason}
              onChange={(event) => setOtherReason(event.target.value)}
              placeholder="Nhập lý do hủy đơn"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : null}
        </fieldset>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex gap-3">
            <WarningCircle className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
            <div>
              <p className="font-semibold">Đơn hàng sẽ không tiếp tục quy trình duyệt</p>
              <p className="mt-1 leading-6">Thao tác này sẽ ghi nhận lịch sử hủy đơn kèm lý do bạn đã chọn.</p>
              {error ? <p className="mt-3 font-medium">{error}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
