'use client'

import { useState } from 'react'
import { ArrowRight, Warning } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, toNumber } from '@/lib/data/order-shared'

export const PRICE_CHANGE_THRESHOLD_PERCENT = 15

export function getPriceChangePercent(aiPrice: number | string, staffPrice: number | string) {
  const ai = toNumber(aiPrice)
  if (ai <= 0) return 0
  return Math.round(((toNumber(staffPrice) - ai) / ai) * 100)
}

export function isSignificantPriceChange(
  aiPrice: number | string,
  staffPrice: number | string,
  threshold = PRICE_CHANGE_THRESHOLD_PERCENT
) {
  return Math.abs(getPriceChangePercent(aiPrice, staffPrice)) >= threshold
}

type PriceChangeModalProps = {
  aiPrice: number | string
  staffPrice: number | string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void> | void
}

export function PriceChangeModal({ aiPrice, staffPrice, open, onOpenChange, onConfirm }: PriceChangeModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const changePercent = getPriceChangePercent(aiPrice, staffPrice)
  const changeLabel = changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setReason('')
      setError('')
    }
  }

  async function handleConfirm() {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do thay đổi giá.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onConfirm(reason.trim())
      handleOpenChange(false)
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Không thể xác nhận giá')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title="Giá khác biệt đáng kể"
      description={`Giá chênh lệch hơn ${PRICE_CHANGE_THRESHOLD_PERCENT}% so với AI đề xuất. Bạn có muốn tiếp tục?`}
      open={open}
      onOpenChange={handleOpenChange}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Quay lại chỉnh sửa
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <ArrowRight className="h-4 w-4" />
            {isSubmitting ? 'Đang xử lý...' : 'Tiếp tục'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <dl className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-amber-800">Giá AI ước tính</dt>
            <dd className="font-medium text-amber-900">{formatCurrency(aiPrice)}/hộp</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-amber-800">Giá bạn nhập</dt>
            <dd className="font-semibold text-amber-950">
              {formatCurrency(staffPrice)}/hộp ({changeLabel})
            </dd>
          </div>
          <div className="flex items-start gap-2 border-t border-amber-200 pt-2 text-xs leading-5 text-amber-800">
            <Warning className="mt-0.5 h-4 w-4 shrink-0" weight="fill" />
            <p>Giá cuối cùng sẽ được gửi cho khách hàng kèm lý do điều chỉnh để đối soát nội bộ.</p>
          </div>
        </dl>

        <div className="space-y-1">
          <label htmlFor="price-change-reason" className="block text-sm font-medium text-gray-700">
            Lý do thay đổi giá <span className="text-red-600">*</span>
          </label>
          <Textarea
            id="price-change-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="VD: Điều chỉnh theo giá nguyên liệu tháng này"
          />
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <Warning className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
            <p>{error}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
