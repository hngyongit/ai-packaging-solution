'use client'

import { useState } from 'react'
import { ArrowSquareOut, CheckCircle, ImageSquare, WarningCircle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, toNumber } from '@/lib/data/order-shared'

type UploadProofOrder = {
  id: string
  order_code: string
  total_amount: number | string | null
  deposit_amount: number | string | null
}

type UploadPaymentProofModalProps = {
  order: UploadProofOrder
  proofImageUrl: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  onRequestResend: (note: string) => Promise<void> | void
}

export function UploadPaymentProofModal({
  order,
  proofImageUrl,
  open,
  onOpenChange,
  onConfirm,
  onRequestResend,
}: UploadPaymentProofModalProps) {
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const depositAmount = toNumber(order.deposit_amount)
  const isDeposit = depositAmount > 0
  const payableAmount = isDeposit ? depositAmount : toNumber(order.total_amount)

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setNote('')
      setError('')
    }
  }

  async function run(action: () => Promise<void> | void) {
    setIsSubmitting(true)
    setError('')
    try {
      await action()
      handleOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể xử lý yêu cầu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title="Xác nhận thanh toán"
      description={`Đơn hàng #${order.order_code} — đối soát ảnh xác nhận chuyển khoản của khách hàng.`}
      open={open}
      onOpenChange={handleOpenChange}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
            onClick={() => run(() => onRequestResend(note.trim()))}
          >
            Yêu cầu gửi lại
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={isSubmitting || !proofImageUrl}
            onClick={() => run(onConfirm)}
          >
            <CheckCircle className="h-4 w-4" />
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <dl className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Phương thức</dt>
            <dd className="font-medium text-gray-900">Chuyển khoản</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Số tiền</dt>
            <dd className="font-semibold text-gray-950">
              {formatCurrency(payableAmount)}
              {isDeposit ? <span className="font-normal text-gray-500"> (đặt cọc 50%)</span> : null}
            </dd>
          </div>
        </dl>

        <div className="space-y-1">
          <p className="block text-sm font-medium text-gray-700">Ảnh xác nhận từ khách hàng</p>
          {proofImageUrl ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- staff preview of user-uploaded proof */}
              <img
                src={proofImageUrl}
                alt={`Ảnh xác nhận chuyển khoản đơn hàng #${order.order_code}`}
                className="max-h-72 w-full bg-gray-50 object-contain"
              />
              <a
                href={proofImageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 border-t border-gray-200 px-4 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-gray-50 hover:text-blue-700"
              >
                <ArrowSquareOut className="h-3.5 w-3.5" />
                Mở ảnh gốc
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
              <ImageSquare className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Khách hàng chưa tải ảnh xác nhận.</p>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="resend-note" className="block text-sm font-medium text-gray-700">
            Ghi chú cho khách <span className="font-normal text-gray-500">(khi yêu cầu gửi lại)</span>
          </label>
          <Textarea
            id="resend-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="VD: Ảnh bị mờ, vui lòng chụp rõ số tiền và nội dung chuyển khoản"
          />
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <WarningCircle className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
            <p>{error}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
