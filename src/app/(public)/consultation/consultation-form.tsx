'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Robot, Spinner } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AIRecommendation } from '@/lib/ai/types'
import type { BoxStyleRecord } from '@/lib/data/boxes'

import { consultationToInput, consultationSchema, type ConsultationFormValues } from './consultation-schema'
import { BoxStylePicker, Field, InlineError, RadioGroup, Section } from '@/components/consultation/fields'
import { LiveResultPanel, type WorkshopResult } from './consultation-live-result'

export function ConsultationForm({ boxStyles }: { boxStyles: BoxStyleRecord[] }) {
  const [result, setResult] = useState<WorkshopResult>({ status: 'idle' })

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
  const chosenBoxStyle = watch('boxStyle')
  const chosenPreviewUrl = chosenBoxStyle
    ? boxStyles.find((style) => style.id === chosenBoxStyle)?.previewUrl
    : undefined

  async function onSubmit(values: ConsultationFormValues) {
    setResult({ status: 'loading' })
    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationToInput(values)),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Không thể gửi yêu cầu tư vấn')
      setResult({
        status: 'ready',
        consultationId: data.consultationId,
        recommendation: data.recommendation as AIRecommendation,
        hasPrinting: values.hasPrinting,
      })
    } catch (error) {
      setResult({ status: 'error', message: error instanceof Error ? error.message : 'Không thể kết nối. Vui lòng thử lại.' })
    }
  }

  return (
    <section className="bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Tư vấn bao bì thông minh</h1>
          <p className="mt-1 text-sm text-gray-500">
            Nhập thông số sản phẩm, AI đề xuất thùng carton phù hợp ngay tại đây.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Left: form */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Section title="Thông tin sản phẩm">
                <Field label="Sản phẩm cần đóng gói" required error={errors.productType?.message}>
                  <Input
                    placeholder="VD: Loa, thiết bị điện tử, đồ gia dụng"
                    aria-invalid={Boolean(errors.productType)}
                    {...register('productType')}
                  />
                </Field>

                <Field
                  label="Kiểu dáng thùng"
                  error={errors.boxStyle?.message}
                  helper="Chọn kiểu thùng hoặc để trống, AI sẽ chọn kiểu phù hợp nhất."
                >
                  <BoxStylePicker
                    value={watch('boxStyle')}
                    onChange={(next) =>
                      setValue('boxStyle', next as ConsultationFormValues['boxStyle'], { shouldValidate: true })
                    }
                    styles={boxStyles}
                  />
                </Field>

                <div>
                  <Label className="mb-2 text-sm font-medium text-gray-700">
                    Kích thước sản phẩm (cm)
                    <span className="ml-1 text-red-600">*</span>
                  </Label>
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
                </div>

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
                      Sau khi AI trả kết quả, bạn upload logo và chọn vị trí in để xem ảnh mockup thực tế.
                    </p>
                  )}
                </div>
              </Section>

              <Section title="Ghi chú thêm">
                <Field
                  label="Yêu cầu thêm (tối đa 100 chữ)"
                  error={errors.notes?.message}
                  helper="VD: hàng dễ vỡ cần bọc thêm xốp, khách muốn thùng cong tay, giao nhiều điểm..."
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
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Robot className="h-4 w-4" />
                    Yêu cầu AI tư vấn
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right: live result */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <LiveResultPanel
                result={result}
                onRetry={() => setResult({ status: 'idle' })}
                selectedPreviewUrl={chosenPreviewUrl}
              />
          </aside>
        </div>
      </div>
    </section>
  )
}