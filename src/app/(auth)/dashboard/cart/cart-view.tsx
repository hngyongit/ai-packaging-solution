'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { notifyCartUpdated } from '@/components/cart/cart-events'
import { type CartLine } from '@/lib/data/cart'
import { formatCurrency } from '@/lib/utils'

import { CartLineRow, lineOverStock } from './cart-line-row'
import { CustomLineEditor } from './custom-line-editor'
import { type CustomSpec } from '@/lib/data/custom-spec'

export function CartView({ initialLines, fullName }: { initialLines: CartLine[]; fullName: string | null }) {
  const router = useRouter()
  const [lines, setLines] = useState(initialLines)
  const [selected, setSelected] = useState<string[]>(() => initialLines.filter((l) => !lineOverStock(l)).map((l) => l.id))
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<CartLine | null>(null)

  useEffect(() => setLines(initialLines), [initialLines])

  const selectedLines = useMemo(() => lines.filter((line) => selected.includes(line.id)), [lines, selected])
  const total = useMemo(
    () => selectedLines.reduce((sum, line) => sum + (line.product?.basePrice ?? 0) * line.quantity, 0),
    [selectedLines]
  )
  const blocked = selectedLines.some(lineOverStock)

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function patchQuantity(line: CartLine, quantity: number) {
    setBusyId(line.id)
    setError('')
    const response = await fetch(`/api/cart/${line.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    if (!response.ok) {
      setError('Không cập nhật được số lượng. Vui lòng thử lại.')
    } else {
      setLines((prev) => prev.map((x) => (x.id === line.id ? { ...x, quantity } : x)))
    }
    setBusyId(null)
  }

  async function remove(line: CartLine) {
    setBusyId(line.id)
    const response = await fetch(`/api/cart/${line.id}`, { method: 'DELETE' })
    if (response.ok) {
      setLines((prev) => prev.filter((x) => x.id !== line.id))
      setSelected((prev) => prev.filter((x) => x !== line.id))
      notifyCartUpdated()
    } else {
      setError('Không xoá được sản phẩm. Vui lòng thử lại.')
    }
    setBusyId(null)
  }

  async function saveCustom(line: CartLine, spec: CustomSpec) {
    setBusyId(line.id)
    setError('')
    const response = await fetch(`/api/cart/${line.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom: spec }),
    })
    if (!response.ok) {
      setError('Không cập nhật được quy cách. Vui lòng thử lại.')
    } else {
      setLines((prev) => prev.map((x) => (x.id === line.id ? { ...x, custom: spec } : x)))
    }
    setBusyId(null)
  }

  function goCheckout() {
    router.push(`/dashboard/checkout?items=${selected.join(',')}`)
  }

  if (lines.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Giỏ hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fullName ? `Chào ${fullName},` : 'Chào bạn,'} đây là các thùng đang chờ đặt.
          </p>
        </div>
        <EmptyState
          title="Giỏ hàng đang trống"
          description="Xem các thùng có sẵn trong kho hoặc nhận tư vấn mẫu thùng theo nhu cầu của bạn."
          actionHref="/shop"
          actionLabel="Xem hàng trong kho"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn các dòng muốn đặt rồi tiến hành thanh toán. Số lượng chỉnh trực tiếp tại đây.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardContent className="divide-y">
            {lines.map((line) => (
              <CartLineRow
                key={line.id}
                line={line}
                checked={selected.includes(line.id)}
                busy={busyId === line.id}
                onToggle={() => toggle(line.id)}
                onQuantity={(quantity) => void patchQuantity(line, quantity)}
                onRemove={() => void remove(line)}
                onEditCustom={line.custom ? () => setEditing(line) : undefined}
              />
            ))}
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-base font-semibold text-gray-950">Tóm tắt</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Số dòng đã chọn</dt>
                  <dd className="font-medium text-gray-950">{selectedLines.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Tổng số thùng</dt>
                  <dd className="font-medium text-gray-950">
                    {selectedLines.reduce((sum, line) => sum + line.quantity, 0).toLocaleString('vi-VN')}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <dt className="text-gray-600">Tạm tính</dt>
                  <dd className="text-base font-semibold text-gray-950">{formatCurrency(total)}</dd>
                </div>
              </dl>
              <p className="text-xs text-gray-500">
                Giá chưa gồm VAT. Nhân viên sẽ xác nhận đơn giá cuối cùng sau khi nhận đơn.
              </p>
              <Button className="w-full" disabled={selectedLines.length === 0 || blocked} onClick={goCheckout}>
                Thanh toán
                <ArrowRight className="h-4 w-4" />
              </Button>
              {blocked && <p className="text-xs text-red-600">Giảm số lượng về mức còn kho để tiếp tục.</p>}
              <Link href="/shop" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
                Tiếp tục mua hàng
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {editing?.custom ? (
        <CustomLineEditor
          open
          spec={editing.custom}
          busy={busyId === editing.id}
          onOpenChange={(next) => {
            if (!next) setEditing(null)
          }}
          onSubmit={(spec) => {
            void saveCustom(editing, spec)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}
