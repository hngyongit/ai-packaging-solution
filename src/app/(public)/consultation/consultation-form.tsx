'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Robot, Spinner } from '@phosphor-icons/react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { AIRecommendation } from '@/lib/ai/types'

import { BOX_STYLE_LABELS, consultationToInput, consultationSchema, type ConsultationFormValues } from './consultation-schema'
import { Field, InlineError, RadioGroup, Section } from './consultation-fields'
import { LiveResultPanel, type WorkshopResult } from './consultation-live-result'

export function ConsultationForm() {
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
      printFaces: undefined,
      hasDesignFile: undefined,
    },
  })

  const hasPrinting = watch('hasPrinting')
  const hasDesignFile = watch('hasDesignFile')

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

                <Field label="Kiểu dáng thùng" required error={errors.boxStyle?.message}>
                  <RadioGroup
                    value={watch('boxStyle')}
                    onChange={(next) => setValue('boxStyle', next as ConsultationFormValues['boxStyle'], { shouldValidate: true })}
                    options={Object.entries(BOX_STYLE_LABELS).map(([value, label]) => ({ value, label }))}
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
                </div>

                {hasPrinting && (
                  <div className="space-y-4">
                    <Field label="Số mặt in" required error={errors.printFaces?.message}>
                      <RadioGroup
                        value={watch('printFaces')}
                        onChange={(next) => setValue('printFaces', next, { shouldValidate: true })}
                        options={[
                          { value: '2_main', label: '2 mặt chính' },
                          { value: '4_sides', label: '2 mặt chính + 2 mặt phụ' },
                        ]}
                      />
                    </Field>
                    <div>
                      <Label className="mb-2 text-sm font-medium text-gray-700">Đã có file logo/thiết kế chưa?</Label>
                      <RadioGroup
                        value={hasDesignFile}
                        onChange={(next) => setValue('hasDesignFile', next === 'true')}
                        options={[
                          { value: 'true', label: 'Đã có' },
                          { value: 'false', label: 'Chưa có' },
                        ]}
                      />
                    </div>
                  </div>
                )}
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
            <LiveResultPanel result={result} onRetry={() => setResult({ status: 'idle' })} />
          </aside>
        </div>
      </div>
    </section>
  )
}