'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from '@phosphor-icons/react'

import { Button, buttonVariants } from '@/components/ui/button'
import { PaymentConfirmationModal } from '@/components/modals/PaymentConfirmation'
import { createClient } from '@/lib/supabase/client'

import { OrderItems } from './order-items'
import { emptyItem, orderSchema, type OrderFormValues } from './order-schema'
import { PrintHandoffNotice } from './print-handoff-notice'
import {
  ArtworkSection,
  AuthNotice,
  CatalogNotice,
  ContactSection,
  Header,
  OrderSuccess,
} from './order-sections'
import { OrderSummary } from './order-summary'
import { type CreatedOrder, type ProductOption, type UploadResult } from './order-types'
import { defaultItems, getDefaultLayer, printingSpecsFor } from './order-utils'
import { type PrintHandoff } from '@/lib/mockup/handoff'

type OrderFormProps = {
  products: ProductOption[]
  printHandoff?: PrintHandoff | null
  variant?: 'page' | 'modal'
}

export function OrderForm({ products, printHandoff = null, variant = 'page' }: OrderFormProps) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [serverError, setServerError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      items: defaultItems(products, printHandoff),
      paymentMethod: 'cod',
      deliveryMethod: 'delivery',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      deliveryAddress: '',
      notes: '',
    },
  })

  const { register, handleSubmit, setValue, watch, formState } = form
  const { errors, isSubmitting } = formState
  const items = watch('items')
  const deliveryMethod = watch('deliveryMethod')
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const total = useMemo(
    () => items.reduce((sum, item) => sum + (productById.get(item.productId)?.basePrice ?? 0) * Number(item.quantity || 0), 0),
    [items, productById]
  )

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setIsAuthed(Boolean(data.user)))
  }, [])

  function addItem() {
    const product = products[0]
    setValue('items', [...items, { ...emptyItem, productId: product?.id ?? '', layers: getDefaultLayer(product) }])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setValue('items', items.filter((_, itemIndex) => itemIndex !== index))
  }

  async function uploadDesignFile(shouldUpload: boolean): Promise<UploadResult | null> {
    if (!designFile || !shouldUpload) return null
    const body = new FormData()
    body.append('file', designFile)
    body.append('purpose', 'logo')

    const response = await fetch('/api/upload', { method: 'POST', body })
    const result = await response.json().catch(() => null)
    if (!response.ok) throw new Error(translateOrderError(result?.error ?? 'Tải file thất bại'))
    return { url: result.file.url, path: result.file.path }
  }

  async function onSubmit(values: OrderFormValues) {
    setServerError('')
    setUploadError('')
    if (!isAuthed) {
      setServerError('Vui lòng đăng nhập trước khi đặt hàng.')
      return
    }

    try {
      const needsPrinting = values.items.some((item) => item.hasPrinting)
      const uploadedFile = await uploadDesignFile(needsPrinting)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: values.items.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            dimensions: {
              length: item.length,
              width: item.width,
              height: item.height,
              layers: item.layers,
              boxStyleId: item.boxStyleId,
            },
            printingSpecs: printingSpecsFor(item.hasPrinting, uploadedFile, index === 0 ? printHandoff : null),
            notes: item.itemNotes,
          })),
          consultationId: printHandoff?.consultationId,
          paymentMethod: values.paymentMethod,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          contactEmail: values.contactEmail,
          deliveryMethod: values.deliveryMethod,
          deliveryAddress: values.deliveryMethod === 'delivery' ? values.deliveryAddress : undefined,
          notes: values.notes,
        }),
      })
      const result = await response.json().catch(() => null)
      if (response.status === 401) {
        setIsAuthed(false)
        setServerError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        return
      }
      if (!response.ok) throw new Error(translateOrderError(result?.error ?? 'Không thể tạo đơn hàng'))
      setCreatedOrder(result.data)
      if (values.paymentMethod === 'bank_transfer') setPaymentModalOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo đơn hàng'
      if (message.toLowerCase().includes('upload')) setUploadError(message)
      setServerError(message)
    }
  }

  if (createdOrder) {
    return (
      <>
        <OrderSuccess order={createdOrder} variant={variant} />
        <PaymentConfirmationModal
          order={createdOrder}
          contactPhone={form.getValues('contactPhone')}
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
        />
      </>
    )
  }

  const formContent = (
    <>
      {variant === 'page' ? <Header /> : null}
      <AuthNotice isAuthed={isAuthed} />
      <CatalogNotice hasProducts={products.length > 0} />
      {printHandoff && <PrintHandoffNotice handoff={printHandoff} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <OrderItems
          items={items}
          products={products}
          productById={productById}
          errors={errors.items}
          register={register}
          setValue={setValue}
          addItem={addItem}
          removeItem={removeItem}
        />
        <ContactSection register={register} errors={errors} deliveryMethod={deliveryMethod} />
        <ArtworkSection register={register} designFile={designFile} setDesignFile={setDesignFile} uploadError={uploadError} />
        {variant === 'modal' ? <OrderSummary items={items} productById={productById} total={total} /> : null}
        {serverError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{serverError}</div>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" disabled={isSubmitting || products.length === 0 || !isAuthed}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi đơn hàng'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link href="/consultation" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            Bắt đầu bằng tư vấn AI
          </Link>
        </div>
      </form>
    </>
  )

  if (variant === 'modal') {
    return <div className="space-y-5">{formContent}</div>
  }

  return (
    <section className="bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <Header />
            <AuthNotice isAuthed={isAuthed} />
            <CatalogNotice hasProducts={products.length > 0} />
            {printHandoff && <PrintHandoffNotice handoff={printHandoff} />}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <OrderItems
                items={items}
                products={products}
                productById={productById}
                errors={errors.items}
                register={register}
                setValue={setValue}
                addItem={addItem}
                removeItem={removeItem}
              />
              <ContactSection register={register} errors={errors} deliveryMethod={deliveryMethod} />
              <ArtworkSection register={register} designFile={designFile} setDesignFile={setDesignFile} uploadError={uploadError} />
              {serverError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{serverError}</div>}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" size="lg" disabled={isSubmitting || products.length === 0 || !isAuthed}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đơn hàng'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/consultation" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                  Bắt đầu bằng tư vấn AI
                </Link>
              </div>
            </form>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary items={items} productById={productById} total={total} />
          </aside>
        </div>
      </div>
    </section>
  )
}

function translateOrderError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('unauthorized')) return 'Vui lòng đăng nhập trước khi tiếp tục.'
  if (normalized.includes('forbidden')) return 'Bạn không có quyền thực hiện thao tác này.'
  if (normalized.includes('product not found')) return 'Không tìm thấy sản phẩm đã chọn.'
  if (normalized.includes('missing') || normalized.includes('invalid')) return 'Thông tin đơn hàng chưa hợp lệ.'
  if (normalized.includes('upload')) return 'Tải file thất bại.'
  if (normalized.includes('internal')) return 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.'
  return message
}
