'use client'

import { useState } from 'react'
import { PencilSimpleLine, CheckCircle, XCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, toNumber } from '@/lib/data/order-shared'

interface OrderItem {
  id: string
  product_name: string
  product_code: string
  quantity: number
  unit_price: number | string
  subtotal: number | string
}

interface PriceEditorProps {
  items: OrderItem[]
  orderId: string
  currentTotal: number
  onSave?: (newTotal: number) => void
}

/**
 * Client component cho phép staff chỉnh sửa unit_price của từng item
 * và tự động tính lại total_amount của đơn hàng.
 */
export function PriceEditor({ items, orderId, currentTotal, onSave }: PriceEditorProps) {
  const [editingItems, setEditingItems] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      map.set(item.id, toNumber(item.unit_price))
    }
    return map
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Tính total mới từ các giá trị đang edit
  const newTotal = Array.from(editingItems.entries()).reduce((sum, [itemId, unitPrice]) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return sum
    return sum + unitPrice * item.quantity
  }, 0)

  function handleUnitPriceChange(itemId: string, value: string) {
    const num = parseFloat(value.replace(/\D/g, '')) || 0
    setEditingItems((prev) => {
      const next = new Map(prev)
      next.set(itemId, num)
      return next
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    try {
      const itemsToUpdate = Array.from(editingItems.entries()).map(([itemId, unitPrice]) => ({
        itemId,
        unitPrice,
      }))

      const res = await fetch(`/api/orders/${orderId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToUpdate }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Không thể cập nhật giá')
        return
      }

      setSaved(true)
      onSave?.(data.totalAmount)

      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Lỗi kết nối máy chủ')
    } finally {
      setSaving(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PencilSimpleLine className="h-5 w-5 text-blue-600" />
          Điều chỉnh giá
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Tổng hiện tại:</span>
          <span className="text-base font-bold text-gray-900">{formatCurrency(currentTotal)}</span>
        </div>
      </div>

      {/* Item price inputs */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {items.map((item) => {
          const currentPrice = toNumber(item.unit_price)
          const editedPrice = editingItems.get(item.id) ?? currentPrice
          const subtotal = editedPrice * item.quantity

          return (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-md bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-500">
                  {item.product_code} · Số lượng: {item.quantity} thùng
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Đơn giá:</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editedPrice.toLocaleString('vi-VN')}
                  onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                  className="w-32 h-8 text-right text-sm border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  placeholder="0"
                />
                <span className="text-xs text-gray-500">đ</span>
              </div>

              <div className="text-right min-w-[100px]">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</p>
                {editedPrice !== currentPrice && (
                  <p className="text-xs text-blue-600">
                    {subtotal > toNumber(item.subtotal) ? '↑ +' : '↓ -'}
                    {Math.abs(subtotal - toNumber(item.subtotal)).toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* New total summary */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">Tổng tiền mới:</span>
          <span className="text-2xl font-bold text-blue-900">{formatCurrency(newTotal)}</span>
        </div>
        {newTotal !== currentTotal && (
          <p className="mt-1 text-sm text-blue-600">
            Thay đổi:{' '}
            <span className="font-semibold">
              {newTotal > currentTotal ? '+' : ''}
              {(newTotal - currentTotal).toLocaleString('vi-VN')}đ
            </span>
          </p>
        )}
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Đã cập nhật giá thành công!
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving || newTotal === currentTotal}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Đang lưu...' : '💾 Lưu điều chỉnh giá'}
      </Button>

      <p className="text-center text-xs text-gray-500">
        Sau khi lưu, tổng tiền đơn hàng sẽ được cập nhật tự động.
      </p>
    </div>
  )
}
