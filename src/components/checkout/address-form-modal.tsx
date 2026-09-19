'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { type AddressRow } from '@/lib/data/addresses'

// Form thêm/sửa một địa chỉ trong modal. Submit trả giá trị về cha — cha gọi API
// để modal không cần biết PATCH hay POST.

export const addressFormSchema = z.object({
  label: z.string().trim().min(1, 'Nhập nhãn để dễ phân biệt').max(60),
  recipientName: z.string().trim().min(1, 'Vui lòng nhập tên người nhận').max(120),
  phone: z.string().trim().regex(/^\d{10}$/, 'Số điện thoại phải đủ 10 chữ số'),
  email: z.string().trim().email('Email không hợp lệ'),
  address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ').max(500),
})
export type AddressFormValues = z.infer<typeof addressFormSchema>

const BLANK: AddressFormValues = { label: '', recipientName: '', phone: '', email: '', address: '' }

function valuesOf(row: AddressRow): AddressFormValues {
  return {
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
  }
}

export function AddressFormModal({
  open,
  onOpenChange,
  editing,
  busy,
  error,
  onSubmit,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: AddressRow | null
  busy: boolean
  error: string
  onSubmit: (values: AddressFormValues) => Promise<void> | void
  onDelete?: (id: string) => void
}) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: editing ? valuesOf(editing) : BLANK,
  })
  const { register, handleSubmit, formState } = form

  // Modal một instance dùng chung cho thêm mới lẫn sửa → reset khi đổi đối tượng.
  useEffect(() => {
    if (open) form.reset(editing ? valuesOf(editing) : BLANK)
  }, [open, editing, form])

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'} description="Thông tin này được lưu vào tài khoản của bạn.">
      <form className="space-y-4" onSubmit={handleSubmit((values) => onSubmit(values))}>
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <Field label="Nhãn" required error={formState.errors.label?.message} helper="VD: Công ty, Nhà riêng, Kho">
          <Input {...register('label')} placeholder="Công ty" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên người nhận" required error={formState.errors.recipientName?.message}>
            <Input {...register('recipientName')} autoComplete="name" />
          </Field>
          <Field label="Số điện thoại" required error={formState.errors.phone?.message}>
            <Input {...register('phone')} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" />
          </Field>
        </div>
        <Field label="Email" required error={formState.errors.email?.message}>
          <Input {...register('email')} type="email" autoComplete="email" />
        </Field>
        <Field label="Địa chỉ" required error={formState.errors.address?.message}>
          <Textarea rows={3} {...register('address')} />
        </Field>
        <div className="flex justify-end gap-2">
          {editing && onDelete ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(editing.id)}>
              Xoá
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu địa chỉ'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
