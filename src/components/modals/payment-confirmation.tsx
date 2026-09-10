'use client'

import { useRef, useState } from 'react'
import { CurrencyCircleDollar, UploadSimple, WarningCircle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/modal'
import { formatCurrency, toNumber } from '@/lib/data/order-shared'

const BANK_INFO = {
  bankName: 'Vietcombank',
  accountNumber: '0123 456 789',
  accountName: 'CÔNG TY TNHH BAO BÌ ABC',
} as const

type PaymentConfirmationOrder = {
  id: string
  order_code: string
  total_amount: number | string | null
  deposit_amount: number | string | null
}

type PaymentConfirmationModalProps = {
  order: PaymentConfirmationOrder
  contactPhone?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentSubmitted?: (method: 'cod' | 'bank_transfer') => void
}

export function PaymentConfirmationModal({
  order,
  contactPhone,
  open,
  onOpenChange,
  onPaymentSubmitted,
}: PaymentConfirmationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const depositAmount = toNumber(order.deposit_amount)
  const totalAmount = toNumber(order.total_amount)
  const isDeposit = depositAmount > 0
  const payableAmount = isDeposit ? depositAmount : totalAmount
  const transferReference = `${order.order_code}${contactPhone ? ` - ${contactPhone}` : ''}`

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setError('')
      setProofFile(null)
    }
  }

  async function submitPayment(body: { paymentMethod: 'cod' | 'bank_transfer'; paymentProofUrl?: string }) {
    const response = await fetch(`/api/orders/${order.id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) throw new Error(result?.error ?? 'Không thể ghi nhận thanh toán')
  }

  async function handleTransferConfirm() {
    if (!proofFile) {
      setError('Vui lòng tải ảnh xác nhận chuyển khoản.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const uploadBody = new FormData()
      uploadBody.append('file', proofFile)
      uploadBody.append('purpose', 'payment-proof')
      uploadBody.append('orderId', order.id)

      const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadBody })
      const uploadResult = await uploadResponse.json().catch(() => null)
      if (!uploadResponse.ok) throw new Error(uploadResult?.error ?? 'Tải ảnh xác nhận thất bại')

      await submitPayment({ paymentMethod: 'bank_transfer', paymentProofUrl: uploadResult.file.url })
      onPaymentSubmitted?.('bank_transfer')
      handleOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể ghi nhận thanh toán')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCod() {
    setIsSubmitting(true)
    setError('')

    try {
      await submitPayment({ paymentMethod: 'cod' })
      onPaymentSubmitted?.('cod')
      handleOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể ghi nhận thanh toán')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thông tin thanh toán"
      description={`Đơn hàng #${order.order_code} — vui lòng chuyển khoản theo thông tin bên dưới.`}
      open={open}
      onOpenChange={handleOpenChange}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            Đóng
          </Button>
          <Button type="button" size="lg" disabled={isSubmitting || !proofFile} onClick={handleTransferConfirm}>
            <CurrencyCircleDollar className="h-4 w-4" />
            {isSubmitting ? 'Đang xử lý...' : 'Tôi đã chuyển khoản'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <dl className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <InfoRow label="Ngân hàng" value={BANK_INFO.bankName} />
          <InfoRow label="Số tài khoản" value={BANK_INFO.accountNumber} />
          <InfoRow label="Chủ tài khoản" value={BANK_INFO.accountName} />
          <InfoRow
            label={isDeposit ? 'Số tiền (đặt cọc 50%)' : 'Số tiền'}
            value={formatCurrency(payableAmount)}
            strong
          />
          <InfoRow label="Nội dung" value={transferReference} />
        </dl>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Ảnh xác nhận chuyển khoản</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <UploadSimple className="h-5 w-5" />
            {proofFile ? proofFile.name : 'Chọn ảnh (JPG, PNG, WebP — tối đa 5MB)'}
          </button>
          <p className="text-xs text-gray-500">Sau khi chuyển khoản, vui lòng tải ảnh xác nhận để nhân viên đối soát.</p>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <WarningCircle className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
            <p>{error}</p>
          </div>
        ) : null}

        <p className="text-center text-sm text-gray-500">
          Hoặc{' '}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCod}
            className="font-medium text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline disabled:opacity-50"
          >
            thanh toán khi nhận hàng (COD)
          </button>
        </p>
      </div>
    </Modal>
  )
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={strong ? 'font-semibold text-gray-950' : 'font-medium text-gray-900'}>{value}</dd>
    </div>
  )
}
