'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Lightning } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import { type StockMatch } from '@/lib/ai/types'

/**
 * Trang checkout cho stock consultation — customer điền thông tin liên hệ
 * rồi submit để tạo order trực tiếp (không qua cart).
 */
export default function StockCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const quantityParam = searchParams.get('quantity')
  const quantity = parseInt(quantityParam ?? '1', 10) || 1

  const [product, setProduct] = useState<{ name: string; code: string; unitPrice: number; maxDimensions: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)

  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch product info
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error('Không tìm thấy sản phẩm')
        const data = await res.json()
        setProduct({
          name: data.name,
          code: data.code,
          unitPrice: Number(data.base_price),
          maxDimensions: data.max_dimensions
            ? `${data.max_dimensions.length}×${data.max_dimensions.width}×${data.max_dimensions.height}cm`
            : '—',
        })
      } catch {
        setError('Không tải được thông tin sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(null)

    if (!contactName.trim()) {
      setError('Vui lòng nhập họ tên')
      setSubmitting(false)
      return
    }
    if (!contactPhone.trim() || contactPhone.length !== 10) {
      setError('Vui lòng nhập SĐT hợp lệ (10 số)')
      setSubmitting(false)
      return
    }
    if (!productId) {
      setError('Thiếu thông tin sản phẩm')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/consultation/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.orderId) {
        setError(data.error ?? 'Không thể tạo đơn hàng')
        setSubmitting(false)
        return
      }

      setSuccess(data.orderId)
      // Redirect to dashboard order detail
      router.push(`/dashboard/orders/${data.orderId}`)
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="h-8 w-1/3 bg-gray-200" />
          <div className="h-4 w-2/3 bg-gray-100" />
          <div className="h-32 w-full bg-gray-100" />
          <div className="h-48 w-full bg-gray-100" />
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Link href="/consultation/stock" className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" /> Quay lại form tư vấn
          </Link>
        </div>
      </div>
    )
  }

  const estimatedTotal = product ? product.unitPrice * quantity : 0

  return (
    <div className="bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <div className="mb-4">
          <Link href="/consultation/stock" className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Quay lại form tư vấn
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Left: Contact Form */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Thông tin liên hệ & giao hàng</h1>
            <p className="mt-1 text-sm text-gray-500">
              Điền thông tin để chúng tôi tạo đơn hàng. Nhân viên sẽ xác nhận giá cuối cùng trước khi sản xuất.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="contactName" className="text-sm font-medium text-gray-700">
                  Họ tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="0901234567"
                  maxLength={10}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                  Email <span className="text-gray-400">(không bắt buộc)</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700">
                  Địa chỉ giao hàng <span className="text-gray-400">(không bắt buộc)</span>
                </Label>
                <Input
                  id="deliveryAddress"
                  type="text"
                  placeholder="123 Đường XYZ, Quận, TP"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Ghi chú (tối đa 100 chữ)
                </Label>
                <Textarea
                  rows={3}
                  placeholder="VD: cần hàng giao gấp, ưu tiên thùng giá rẻ nhất..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 100))}
                  className="mt-1"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-400">{notes.length}/100 ký tự</p>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Lightning className="h-4 w-4" />
                    Tạo đơn hàng
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-gray-900">Tóm tắt đơn hàng</h3>

              {product ? (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sản phẩm:</span>
                    <span className="font-medium text-gray-900 truncate ml-2 max-w-[200px]">{product.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mã sản phẩm:</span>
                    <span className="font-mono text-gray-900">{product.code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kích thước:</span>
                    <span className="text-gray-900">{product.maxDimensions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số lượng:</span>
                    <span className="font-medium text-gray-900">{quantity.toLocaleString('vi-VN')} thùng</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đơn giá:</span>
                    <span className="text-gray-900">{formatCurrency(product.unitPrice)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-gray-900">Tổng ước tính:</span>
                      <span className="text-blue-600">{formatCurrency(estimatedTotal)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      * Nhân viên sẽ xác nhận giá cuối cùng trong vòng 24h
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-gray-500">Đang tải thông tin sản phẩm...</div>
              )}

              <div className="mt-6 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                💡 Sau khi đặt hàng, chúng tôi sẽ xác nhận giá và thời gian giao hàng. Thanh toán sẽ thực hiện sau khi nhân viên phê duyệt.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
