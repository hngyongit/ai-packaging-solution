'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Lightning } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const schema = z.object({
  contactName: z.string().trim().min(1, 'Vui lòng nhập tên').max(120),
  contactPhone: z.string().trim().regex(/^\d{10}$/, 'Số điện thoại phải có 10 chữ số'),
  contactEmail: z.string().trim().email('Email không hợp lệ').optional().or(z.literal('')),
  deliveryAddress: z.string().trim().min(1, 'Vui lòng nhập địa chỉ giao hàng').max(500),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

/**
 * Trang checkout cho stock consultation — user điền thông tin liên lạc
 * rồi tạo order với status pending để staff review.
 */
function StockCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const quantity = parseInt(searchParams.get('quantity') || '1', 10)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Product info từ URL params (có thể fetch từ API sau)
  const [product, setProduct] = useState<{ name: string; code: string; unitPrice: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      deliveryAddress: '',
      notes: '',
    },
  })

  // Fetch product info
  useState(() => {
    async function loadProduct() {
      if (!productId) {
        router.push('/consultation/stock')
        return
      }
      
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error('Product not found')
        const data = await res.json()
        setProduct(data)
      } catch {
        setError('Không tìm thấy sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/orders/from-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          ...values,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Không thể tạo đơn hàng')
      }

      setOrderId(data.id)
      setSuccess(true)
      
      // Redirect to order detail after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/orders/${data.id}`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="mx-auto max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold text-red-600">Sản phẩm không tồn tại</h1>
            <Button className="mt-4" onClick={() => router.push('/consultation/stock')}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Thông tin đặt hàng</h1>
          <p className="mt-1 text-sm text-gray-500">
            Điền thông tin liên lạc để tạo đơn hàng. Staff sẽ xem xét và xác nhận đơn.
          </p>
        </header>

        {/* Order summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Tóm tắt đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Mã sản phẩm</dt>
                <dd className="mt-0.5 font-mono text-sm">{product.code}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Tên sản phẩm</dt>
                <dd className="mt-0.5 text-sm">{product.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Số lượng</dt>
                <dd className="mt-0.5 text-sm">{quantity.toLocaleString('vi-VN')} thùng</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Đơn giá</dt>
                <dd className="mt-0.5 text-sm">{formatCurrency(product.unitPrice)}</dd>
              </div>
              <div className="sm:col-span-2 border-t pt-2 mt-2">
                <dt className="text-xs font-medium text-gray-500">Tổng tạm tính</dt>
                <dd className="mt-0.5 text-lg font-semibold text-gray-950">
                  {formatCurrency(product.unitPrice * quantity)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Contact form */}
        {success ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" weight="fill" />
              <h2 className="mt-4 text-lg font-semibold text-green-900">Đã tạo đơn hàng!</h2>
              <p className="mt-2 text-sm text-green-700">
                Đơn hàng đang chờ nhân viên duyệt. Đang chuyển hướng...
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contactName">Họ và tên <span className="text-red-600">*</span></Label>
                  <Input
                    id="contactName"
                    placeholder="VD: Nguyễn Văn A"
                    {...register('contactName')}
                    className={errors.contactName ? 'border-red-500' : ''}
                  />
                  {errors.contactName && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPhone">Số điện thoại <span className="text-red-600">*</span></Label>
                  <Input
                    id="contactPhone"
                    placeholder="VD: 0123456789"
                    {...register('contactPhone')}
                    className={errors.contactPhone ? 'border-red-500' : ''}
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email (không bắt buộc)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="VD: email@example.com"
                    {...register('contactEmail')}
                    className={errors.contactEmail ? 'border-red-500' : ''}
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Địa chỉ giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deliveryAddress">Địa chỉ <span className="text-red-600">*</span></Label>
                  <Textarea
                    id="deliveryAddress"
                    rows={3}
                    placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                    {...register('deliveryAddress')}
                    className={errors.deliveryAddress ? 'border-red-500' : ''}
                  />
                  {errors.deliveryAddress && (
                    <p className="mt-1 text-xs text-red-600">{errors.deliveryAddress.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Ghi chú (không bắt buộc)</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="VD: Giao giờ hành chính, gọi điện trước khi giao..."
                    {...register('notes')}
                  />
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Quay lại
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Lightning className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo đơn...
                  </>
                ) : (
                  <>
                    <Lightning className="mr-2 h-4 w-4" />
                    Tạo đơn hàng
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function StockCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <StockCheckoutContent />
    </Suspense>
  )
}
