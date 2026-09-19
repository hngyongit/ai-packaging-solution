'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MagnifyingGlass, Spinner } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type StockMatch } from '@/lib/ai/types'

import { Field, InlineError, RadioGroup, Section } from '@/components/consultation/fields'
import { consultationToInput, consultationSchema, type ConsultationFormValues } from '../consultation-schema'
import { StockResultPanel, type StockResult } from './stock-result-panel'

/**
 * Form "Tư vấn mua thùng có sẵn" — bỏ BoxStylePicker (kho bán mẫu dựng sẵn,
 * khách không may đo kiểu thùng), giữ các trường AI cần để khớp size + tồn kho.
 */
export function StockConsultationForm() {
  const [result, setResult] = useState<StockResult>({ status: 'idle' })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      productType: '',
      boxStyle: undefined,
      lengthCm: undefined,
      widthCm: undefined,
      heightCm: undefined,
      weightGrams: undefined,
      desiredQuantity: undefined,
      hasPrinting: false,
      notes: '',
    },
  })

  const hasPrinting = watch('hasPrinting')

  async function onSubmit(values: ConsultationFormValues) {
    setResult({ status: 'loading' })
    try {
      const response = await fetch('/api/ai/recommend-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Kho bán mẫu dựng sẵn → không gửi boxStyle (AI custom mới cần).
        body: JSON.stringify({ ...consultationToInput(values), boxStyle: undefined }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Không thể tìm mẫu phù hợp')
      setResult({ status: 'ready', matches: (data.matches ?? []) as StockMatch[] })
    } catch (error) {
      setResult({ status: 'error', message: error instanceof Error ? error.message : 'Không thể kết nối. Vui lòng thử lại.' })
    }
  }

  return (
    <section className="bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Tư vấn mua thùng có sẵn</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Nhập thông số sản phẩm, AI tìm mẫu thùng carton đang có trong kho khớp nhất và cho bạn thêm
            vào giỏ ngay. Cần thùng may đo riêng?{' '}
            <Link href="/consultation" className="font-medium text-blue-600 hover:text-blue-700">
              Tư vấn thùng theo yêu cầu
            </Link>
            .
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Section title="Thông tin sản phẩm">
                <Field label="Sản phẩm cần đóng gói" required error={errors.productType?.message}>
                  <Input
                    placeholder="VD: Chén sứ, linh kiện, thực phẩm khô"
                    aria-invalid={Boolean(errors.productType)}
                    {...register('productType')}
                  />
                </Field>

                <Field
                  label="Kích thước sản phẩm (cm)"
                  required
                  helper="Sản phẩm + 2cm mỗi chiều phải lọt lòng thùng kho đang có."
                >
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Dài" aria-label="Chiều dài (cm)" aria-invalid={Boolean(errors.lengthCm)} {...register('lengthCm')} />
                    <Input placeholder="Rộng" aria-label="Chiều rộng (cm)" aria-invalid={Boolean(errors.widthCm)} {...register('widthCm')} />
                    <Input placeholder="Cao" aria-label="Chiều cao (cm)" aria-invalid={Boolean(errors.heightCm)} {...register('heightCm')} />
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
                    <InlineError error={errors.lengthCm?.message} />
                    <InlineError error={errors.widthCm?.message} />
                    <InlineError error={errors.heightCm?.message} />
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Trọng lượng (grams)" required error={errors.weightGrams?.message}>
                    <Input placeholder="VD: 500" aria-invalid={Boolean(errors.weightGrams)} {...register('weightGrams')} />
                  </Field>
                  <Field label="Số lượng thùng" required error={errors.desiredQuantity?.message}>
                    <Input placeholder="VD: 1000" aria-invalid={Boolean(errors.desiredQuantity)} {...register('desiredQuantity')} />
                  </Field>
                </div>
              </Section>

              <Section title="In ấn">
                <div>
                  <Label className="mb-2 text-sm font-medium text-gray-700">Có cần in lên thùng?</Label>
                  <RadioGroup
                    value={hasPrinting}
                    onChange={(next) => setValue('hasPrinting', next === 'true')}
                    options={[
                      { value: 'true', label: 'Có' },
                      { value: 'false', label: 'Không' },
                    ]}
                  />
                  {hasPrinting && (
                    <p className="mt-2 text-sm text-gray-500">
                      Mẫu thùng trơn trong kho; in ấn sẽ báo giá thêm khi bạn gửi đơn.
                    </p>
                  )}
                </div>
              </Section>

              <Section title="Ghi chú thêm">
                <Field
                  label="Yêu cầu thêm (tối đa 100 chữ)"
                  error={errors.notes?.message}
                  helper="VD: cần hàng giao gấp, ưu tiên thùng giá rẻ nhất, cần số lượng lớn..."
                >
                  <Textarea
                    rows={3}
                    placeholder="Cho AI biết thêm điều bạn cần..."
                    aria-invalid={Boolean(errors.notes)}
                    {...register('notes')}
                  />
                </Field>
              </Section>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4 animate-spin" />
                    Đang tìm mẫu trong kho...
                  </>
                ) : (
                  <>
                    <MagnifyingGlass className="h-4 w-4" />
                    Tìm thùng có sẵn
                  </>
                )}
              </Button>
            </form>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <StockResultPanel result={result} onRetry={() => setResult({ status: 'idle' })} />
          </aside>
        </div>
      </div>
    </section>
  )
}
