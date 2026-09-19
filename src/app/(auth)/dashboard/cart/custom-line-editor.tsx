'use client'

import { PencilSimple } from '@phosphor-icons/react'
import { z } from 'zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { type CustomSpec } from '@/lib/data/custom-spec'

// Chỉnh quy cách của một dòng custom ngay trong giỏ. productName/productCode là
// định danh hiển thị đã có từ nguồn (mẫu đã lưu / tư vấn) → giữ nguyên, không cho sửa.

const specFormSchema = z.object({
  length: z.coerce.number().positive('Nhập chiều dài (cm)').max(9999),
  width: z.coerce.number().positive('Nhập chiều rộng (cm)').max(9999),
  height: z.coerce.number().positive('Nhập chiều cao (cm)').max(9999),
  layers: z.coerce.number().int().positive('Chọn số lớp').max(9),
  notes: z.string().trim().max(500).optional(),
})
type SpecFormValues = z.infer<typeof specFormSchema>

const LAYER_OPTIONS = [3, 5]

export function CustomLineEditor({
  open,
  onOpenChange,
  spec,
  busy,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spec: CustomSpec
  busy: boolean
  onSubmit: (next: CustomSpec) => void
}) {
  const form = useForm<SpecFormValues>({
    resolver: zodResolver(specFormSchema),
    defaultValues: {
      length: spec.length,
      width: spec.width,
      height: spec.height,
      layers: spec.layers ?? LAYER_OPTIONS[0],
      notes: spec.notes ?? '',
    },
  })
  const { register, handleSubmit, formState } = form

  useEffect(() => {
    if (open) {
      form.reset({
        length: spec.length,
        width: spec.width,
        height: spec.height,
        layers: spec.layers ?? LAYER_OPTIONS[0],
        notes: spec.notes ?? '',
      })
    }
  }, [open, spec, form])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Sửa quy cách thùng"
      description={spec.productName}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          onSubmit({ ...spec, ...values })
          onOpenChange(false)
        })}
      >
        <div className="grid grid-cols-3 gap-3">
          <Field label="Dài (cm)" required error={formState.errors.length?.message}>
            <Input type="number" min={1} className="h-8" {...register('length')} />
          </Field>
          <Field label="Rộng (cm)" required error={formState.errors.width?.message}>
            <Input type="number" min={1} className="h-8" {...register('width')} />
          </Field>
          <Field label="Cao (cm)" required error={formState.errors.height?.message}>
            <Input type="number" min={1} className="h-8" {...register('height')} />
          </Field>
        </div>

        <Field label="Số lớp" required error={formState.errors.layers?.message}>
          <select
            className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...register('layers')}
          >
            {LAYER_OPTIONS.map((layers) => (
              <option key={layers} value={layers}>
                {layers} lớp
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ghi chú cho dòng này" error={formState.errors.notes?.message}>
          <Input {...register('notes')} placeholder="VD: in 1 màu, 2 mặt" />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu quy cách'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/** Nút mở editor — tách ra để cart-line-row gọn dưới limit component. */
export function CustomEditTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <PencilSimple className="h-4 w-4" />
      Sửa quy cách
    </Button>
  )
}
