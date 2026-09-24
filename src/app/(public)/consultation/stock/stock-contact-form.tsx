'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { type StockMatch } from '@/lib/ai/types'

/**
 * Form liên hệ inline — hiện sau khi customer chọn thùng từ danh sách match.
 * Customer điền name/phone/email/address rồi click "Mua ngay" → tạo đơn pending.
 */
export function StockContactForm({ match }: { match: StockMatch }) {
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
      const res = await fetch('/api/orders/from-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: match.productId,
          quantity: match.suggestedQuantity,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
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
          <Label htmlFor="stock-contactName" className="text-sm font-medium text-blue-800">
            Họ tên <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock-contactName"
            type="text"
            placeholder="Nguyễn Văn A"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        <div>
          <Label htmlFor="stock-contactPhone" className="text-sm font-medium text-blue-800">
            Số điện thoại <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock-contactPhone"
            type="tel"
            placeholder="0901234567"
            maxLength={10}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        <div>
          <Label htmlFor="stock-contactEmail" className="text-sm font-medium text-blue-800">
            Email <span className="text-gray-400">(không bắt buộc)</span>
          </Label>
          <Input
            id="stock-contactEmail"
            type="email"
            placeholder="email@example.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        <div>
          <Label htmlFor="stock-deliveryAddress" className="text-sm font-medium text-blue-800">
            Địa chỉ giao hàng <span className="text-gray-400">(không bắt buộc)</span>
          </Label>
          <Input
            id="stock-deliveryAddress"
            type="text"
            placeholder="123 Đường XYZ, Quận, TP"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        <div className="rounded-md bg-white px-4 py-2 text-sm text-blue-800">
          💰 Tổng tiền ước tính:{' '}
          <span className="font-bold">
            {formatCurrency(match.unitPrice * match.suggestedQuantity)}
          </span>{' '}
          <span className="text-gray-500">(Staff sẽ xác nhận giá cuối)</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Mua ngay'}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
        Sau khi đặt hàng, nhân viên của chúng tôi sẽ xác nhận giá và thời gian sản xuất trong vòng 24h.
      </p>
    </div>
  )
}
