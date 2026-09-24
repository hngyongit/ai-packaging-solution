'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Spinner } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/data/order-shared'

type Params = { id: string }

export default function CreateOrderFromConsultationPage({ params }: { params: Params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consultationId, setConsultationId] = useState<string>('')
  const [consultationData, setConsultationData] = useState<any>(null)
  const [fetching, setFetching] = useState(true)

  // Form state
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod')

  // Fetch consultation data on mount
  useEffect(() => {
    let cancelled = false
    
    setConsultationId(params.id)
    fetch(`/api/consultations/${params.id}`)
      .then(async (res) => {
        console.log('[Order Page] API response status:', res.status, 'for id:', params.id)
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => null)
          console.error('[Order Page] API error:', res.status, errorData)
          setError(`Không thể tải thông tin tư vấn (Lỗi ${res.status})`)
          return null
        }
        
        return res.json()
      })
      .then((data) => {
        if (!cancelled && data) {
          setConsultationData(data)
          // Pre-fill form with customer profile data
          if (data.customer_name) setContactName(data.customer_name)
        }
      })
      .catch((e) => {
        console.error('Failed to load consultation:', e)
        if (!cancelled) {
          setError('Không thể tải thông tin tư vấn')
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false)
      })
    
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders/from-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          contactName,
          contactPhone,
          contactEmail,
          deliveryAddress,
          notes: notes || undefined,
          paymentMethod,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Không thể tạo đơn hàng')
      }

      const data = await res.json()
      router.push(`/dashboard/orders?orderId=${data.orderId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (!consultationData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const r = consultationData.ai_recommendation as any
  const dims = consultationData.ai_suggested_dimensions

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 text-gray-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tạo đơn hàng từ tư vấn</h1>
        <p className="mt-1 text-sm text-gray-500">
          #{consultationId.slice(0, 8).toUpperCase()} — Điền thông tin giao hàng & thanh toán
        </p>
      </div>

      {/* Consultation summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt tư vấn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Sản phẩm:</span>
              <p className="font-medium text-gray-900">{consultationData.product_type}</p>
            </div>
            <div>
              <span className="text-gray-500">Kích thước:</span>
              <p className="font-medium text-gray-900">
                {dims ? `${dims.length} × ${dims.width} × ${dims.height} cm` : 'Tùy chỉnh'}
              </p>
            </div>
            {consultationData.desired_quantity && (
              <div>
                <span className="text-gray-500">Số lượng:</span>
                <p className="font-medium text-gray-900">{consultationData.desired_quantity} thùng</p>
              </div>
            )}
            {r && (
              <div>
                <span className="text-gray-500">Giá ước tính:</span>
                <p className="font-medium text-blue-600">
                  {formatCurrency(r.estimatedUnitPriceMin)} - {formatCurrency(r.estimatedUnitPriceMax)} / thùng
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Họ và tên *</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Số điện thoại *</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                placeholder="0901234567"
                pattern="^\d{10}$"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                placeholder="example@email.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Địa chỉ giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Địa chỉ *</Label>
              <Textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                rows={3}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="accent-blue-600"
              />
              Thanh toán khi nhận hàng (COD)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => setPaymentMethod('bank_transfer')}
                className="accent-blue-600"
              />
              Chuyển khoản ngân hàng
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ghi chú (tùy chọn)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Yêu cầu đặc biệt, thời gian giao hàng preferred, v.v."
              maxLength={1000}
            />
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo đơn...
              </>
            ) : (
              '✅ Tạo đơn hàng'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  )
}
