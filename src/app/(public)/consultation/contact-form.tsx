'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ContactFormProps {
  consultationId?: string
  estimatedTotal?: number
}

/**
 * Form thông tin liên hệ — hiện sau khi AI recommend xong.
 * Customer điền name/phone/email/address rồi click "Mua ngay" → tạo đơn.
 */
export function ContactForm({ consultationId, estimatedTotal }: ContactFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate
    if (!contactName.trim()) {
      setError('Vui lòng nhập họ tên')
      setLoading(false)
      return
    }
    if (!contactPhone.trim() || contactPhone.length !== 10) {
      setError('Vui lòng nhập SĐT hợp lệ (10 số)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/orders/from-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          paymentMethod: 'cod', // Mặc định COD, staff sẽ tạo PayOS link sau
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.orderId) {
        setError(data.error ?? 'Không thể tạo đơn hàng')
        setLoading(false)
        return
      }

      // Redirect đến order detail page
      router.push(`/dashboard/orders/${data.orderId}`)
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-blue-900">📋 Thông tin liên hệ</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="contactName" className="text-sm font-medium text-blue-800">
            Họ tên <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contactName"
            type="text"
            placeholder="Nguyễn Văn A"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        <div>
          <Label htmlFor="contactPhone" className="text-sm font-medium text-blue-800">
            Số điện thoại <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="0901234567"
            maxLength={10}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        <div>
          <Label htmlFor="contactEmail" className="text-sm font-medium text-blue-800">
            Email <span className="text-gray-400">(không bắt buộc)</span>
          </Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="email@example.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        <div>
          <Label htmlFor="deliveryAddress" className="text-sm font-medium text-blue-800">
            Địa chỉ giao hàng <span className="text-gray-400">(không bắt buộc)</span>
          </Label>
          <Input
            id="deliveryAddress"
            type="text"
            placeholder="123 Đường XYZ, Quận, TP"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        {estimatedTotal > 0 && (
          <div className="rounded-md bg-white px-4 py-2 text-sm text-blue-800">
            💰 Tổng tiền ước tính:{' '}
            <span className="font-bold">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedTotal)}
            </span>{' '}
            <span className="text-gray-500">(Staff sẽ xác nhận giá cuối)</span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <ShoppingBag className="mr-2 h-5 w-5" weight="fill" />
          {loading ? 'Đang tạo đơn...' : '🛒 Mua ngay'}
        </Button>
      </form>
    </div>
  )
}
