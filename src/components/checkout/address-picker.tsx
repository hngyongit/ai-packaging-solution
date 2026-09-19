'use client'

import { useState } from 'react'
import { PencilSimple, Plus, Star } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { AddressFormModal, type AddressFormValues } from './address-form-modal'
import { type AddressRow } from '@/lib/data/addresses'

// Chọn nơi nhận hàng: danh sách địa chỉ đã lưu (default chọn trước), thêm/sửa/xoá
// tại chỗ. Client chỉ giữ addressId — server tự đọc DB khi tạo đơn.

export function AddressPicker({
  initialAddresses,
  value,
  onChange,
}: {
  initialAddresses: AddressRow[]
  value: string
  onChange: (id: string) => void
}) {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [editing, setEditing] = useState<AddressRow | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function reload(preferId?: string): Promise<AddressRow[]> {
    const response = await fetch('/api/addresses')
    if (!response.ok) return addresses
    const body = (await response.json()) as { items: AddressRow[] }
    const items = body.items ?? []
    setAddresses(items)
    // id đang chọn bị xoá / lần đầu có địa chỉ → chốt lại một id hợp lệ.
    if (preferId && items.some((item) => item.id === preferId)) onChange(preferId)
    else if (!items.some((item) => item.id === value)) {
      onChange((items.find((item) => item.is_default) ?? items[0])?.id ?? '')
    }
    return items
  }

  async function remove(id: string) {
    setError('')
    setBusy(true)
    const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    setBusy(false)
    if (!response.ok) return setError('Không xoá được địa chỉ này.')
    setOpen(false)
    await reload()
  }

  async function makeDefault(id: string) {
    setError('')
    const response = await fetch(`/api/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    })
    if (!response.ok) return setError('Không đặt được địa chỉ mặc định.')
    await reload(id)
  }

  async function submitForm(values: AddressFormValues) {
    setError('')
    setBusy(true)
    const response = await fetch(editing ? `/api/addresses/${editing.id}` : '/api/addresses', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setBusy(false)
    const body = (await response.json().catch(() => null)) as { item?: AddressRow; error?: string } | null
    if (!response.ok || !body?.item) return setError(body?.error ?? 'Không lưu được địa chỉ.')
    setOpen(false)
    await reload(body.item.id)
  }

  function openForm(row: AddressRow | null) {
    setError('')
    setEditing(row)
    setOpen(true)
  }

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {addresses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
          Bạn chưa lưu địa chỉ nào. Thêm một địa chỉ để không phải nhập lại ở lần đặt sau.
        </p>
      ) : (
        <ul className="space-y-2">
          {addresses.map((row) => {
            const checked = value === row.id
            return (
              <li
                key={row.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="addressId"
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                    checked={checked}
                    onChange={() => onChange(row.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-950">{row.label}</span>
                      {row.is_default ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-600">
                          <Star className="h-3 w-3" weight="fill" />
                          Mặc định
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-gray-700">
                      {row.recipient_name} · {row.phone}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">{row.address}</span>
                  </span>
                </label>
                <span className="flex shrink-0 gap-1">
                  {!row.is_default ? (
                    <Button type="button" size="xs" variant="ghost" onClick={() => makeDefault(row.id)}>
                      Mặc định
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Sửa địa chỉ ${row.label}`}
                    onClick={() => openForm(row)}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => openForm(null)}>
          <Plus className="h-4 w-4" />
          Thêm địa chỉ mới
        </Button>
        {addresses.length > 0 ? <p className="text-xs text-gray-500">Chọn địa chỉ khác nếu giao tới nơi khác.</p> : null}
      </div>

      <AddressFormModal
        open={open}
        onOpenChange={(next) => {
          if (!next) setOpen(false)
        }}
        editing={editing}
        busy={busy}
        error={error}
        onSubmit={submitForm}
        onDelete={remove}
      />
    </div>
  )
}
