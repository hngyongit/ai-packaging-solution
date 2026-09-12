import Link from 'next/link'
import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { CheckCircle, FileArrowUp, SignIn } from '@phosphor-icons/react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { Field } from './form-field'
import { type OrderFormValues } from './order-schema'
import { type CreatedOrder } from './order-types'
import { formatCurrency } from './order-utils'

export function Header() {
  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-blue-700">Đặt carton</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
        Tạo đơn hàng sản xuất
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
        Chọn quy cách carton, tải file thiết kế nếu cần và gửi đơn để nhân viên duyệt.
      </p>
    </div>
  )
}

export function AuthNotice({ isAuthed }: { isAuthed: boolean | null }) {
  if (isAuthed !== false) return null
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
      <span>Vui lòng đăng nhập hoặc tạo tài khoản trước khi gửi đơn hàng.</span>
      <div className="flex gap-2">
        <Link href="/login" className={buttonVariants({ size: 'sm' })}>
          <SignIn className="h-4 w-4" />
          Đăng nhập
        </Link>
        <Link href="/register" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
          Đăng ký
        </Link>
      </div>
    </div>
  )
}

export function CatalogNotice({ hasProducts }: { hasProducts: boolean }) {
  if (hasProducts) return null
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      Hiện chưa có sản phẩm carton đang hoạt động. Vui lòng thử lại sau khi danh mục được cập nhật.
    </div>
  )
}

export function ContactSection({
  register,
  errors,
  deliveryMethod,
}: {
  register: UseFormRegister<OrderFormValues>
  errors: FieldErrors<OrderFormValues>
  deliveryMethod: OrderFormValues['deliveryMethod']
}) {
  const contactPhoneField = register('contactPhone', {
    setValueAs: (value) => String(value ?? '').replace(/\D/g, '').slice(0, 10),
    onChange: (event) => {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10)
    },
  })

  return (
    <Card className="rounded-lg border-gray-200">
      <CardHeader>
        <CardTitle>Thông tin liên hệ và giao nhận</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Tên liên hệ" required error={errors.contactName?.message}>
          <Input {...register('contactName')} autoComplete="name" />
        </Field>
        <Field label="Số điện thoại" required error={errors.contactPhone?.message}>
          <Input
            {...contactPhoneField}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            autoComplete="tel"
          />
        </Field>
        <Field label="Email" required error={errors.contactEmail?.message}>
          <Input {...register('contactEmail')} type="email" autoComplete="email" />
        </Field>
        <Field label="Phương thức giao nhận" required>
          <select
            className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...register('deliveryMethod')}
          >
            <option value="delivery">Giao hàng</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field
            label="Địa chỉ giao hàng"
            required={deliveryMethod === 'delivery'}
            error={errors.deliveryAddress?.message}
          >
            <Textarea rows={3} {...register('deliveryAddress')} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Ghi chú">
            <Textarea rows={4} {...register('notes')} />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}

export function ArtworkSection({
  register,
  designFile,
  setDesignFile,
  uploadError,
}: {
  register: UseFormRegister<OrderFormValues>
  designFile: File | null
  setDesignFile: (file: File | null) => void
  uploadError: string
}) {
  return (
    <Card className="rounded-lg border-gray-200">
      <CardHeader>
        <CardTitle>Thiết kế và thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="File thiết kế">
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-center text-sm text-gray-600 transition hover:border-blue-400 hover:bg-blue-50">
            <FileArrowUp className="mb-2 h-6 w-6 text-blue-600" />
            <span className="font-medium text-gray-900">
              {designFile ? designFile.name : 'Tải logo hoặc file thiết kế'}
            </span>
            <span className="mt-1 text-xs text-gray-500">PNG, JPG, PDF, AI hoặc EPS, tối đa 10MB</span>
            <input
              className="sr-only"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.ai,.eps,image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setDesignFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
        </Field>
        <Field label="Phương thức thanh toán" required>
          <select
            className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...register('paymentMethod')}
          >
            <option value="cod">Thanh toán khi nhận hàng</option>
            <option value="bank_transfer">Chuyển khoản</option>
          </select>
        </Field>
      </CardContent>
    </Card>
  )
}

export function OrderSuccess({ order, variant: _variant = 'page' }: { order: CreatedOrder; variant?: 'page' | 'modal' }) {
  return (
    <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-lg border-gray-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-blue-600" weight="fill" />
            <h1 className="mt-4 text-2xl font-semibold text-gray-950">Đã nhận đơn hàng</h1>
            <p className="mt-2 text-sm text-gray-600">
              Đơn hàng của bạn đang chờ nhân viên duyệt. Chúng tôi sẽ sớm xác nhận giá và thời gian sản xuất.
            </p>
            <dl className="mt-6 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Mã đơn hàng</dt>
                <dd className="mt-1 font-semibold text-gray-950">{order.order_code}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Tổng tạm tính</dt>
                <dd className="mt-1 font-semibold text-gray-950">{formatCurrency(order.total_amount)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/dashboard/orders" className={buttonVariants()}>
                Xem đơn hàng của tôi
              </Link>
              <Link href="/order" className={buttonVariants({ variant: 'outline' })}>
                Tạo đơn hàng khác
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
