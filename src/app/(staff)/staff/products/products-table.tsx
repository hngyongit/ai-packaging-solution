'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Tag, Stack as StackIcon } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { ProductEditModal, type EditableProduct, type ProductEditPayload } from '@/components/modals/ProductEditModal'

import { toEditable, uploadProductImage, type DbProductRow } from './product-mappers'

export type StaffProductRow = DbProductRow

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatSpec(row: StaffProductRow): string {
  const d = row.max_dimensions
  const dims = d ? `${d.length}×${d.width}×${d.height}cm` : '—'
  const layers = (row.available_layers ?? []).join('/')
  return layers ? `${dims} · ${layers} lớp` : dims
}

function formatMinSpec(row: StaffProductRow): string {
  if (!row.min_dimensions) return '—'
  const d = row.min_dimensions
  return `${d.length}×${d.width}×${d.height}cm`
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    'carton-3-layer': '3 lớp',
    'carton-5-layer': '5 lớp',
    corrugated: 'Sóng giấy',
    custom: 'Gia công',
  }
  return map[cat] ?? cat
}

function getBoxTypeLabel(type: string): string {
  const map: Record<string, string> = {
    'regular-slotted': 'RSC',
    'half-slotted': 'HSC',
    'full-overlap': 'FO',
    'die-cut': 'Bế',
    custom: 'Khác',
  }
  return map[type] ?? type
}

// ─── Component ─────────────────────────────────────────────────────────────

export function StaffProductsTable({ products }: { products: StaffProductRow[] }) {
  const router = useRouter()
  const [modalProduct, setModalProduct] = useState<EditableProduct | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [savedCode, setSavedCode] = useState('')

  function openNew() { setModalProduct(null); setModalOpen(true) }
  function openEdit(row: StaffProductRow) { setModalProduct(toEditable(row)); setModalOpen(true) }

  async function handleSubmit(payload: ProductEditPayload) {
    const imageUrl = payload.image ? await uploadProductImage(payload.image) : undefined
    const body = {
      code: payload.code, name: payload.name, description: payload.description || null,
      category: payload.category, boxType: payload.boxType, maxDimensions: payload.dimensions,
      minDimensions: payload.minDimensions, availableLayers: payload.availableLayers,
      basePrice: payload.basePrice, stockQuantity: payload.stockQuantity,
      isActive: modalProduct?.isActive ?? true,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    }
    const response = await fetch(
      modalProduct ? `/api/products/${modalProduct.id}` : '/api/products',
      {
        method: modalProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalProduct ? { ...body, code: undefined } : body),
      }
    )
    const result = await response.json().catch(() => null)
    if (!response.ok) throw new Error(result?.error ?? 'Không lưu được sản phẩm')
    setSavedCode(payload.code)
    setTimeout(() => setSavedCode(''), 2500)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-950">Sản phẩm & tồn kho</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sửa nhanh ô tồn kho; để trống = hàng gia công theo yêu cầu (không trừ kho khi chốt đơn).
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Button>
      </div>

      {savedCode && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Đã lưu sản phẩm {savedCode}.
        </p>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th className="w-24">Mã</Th>
                <Th>Sản phẩm</Th>
                <Th>Nhóm</Th>
                <Th>Loại thùng</Th>
                <Th>Tối đa</Th>
                <Th>Tối thiểu</Th>
                <Th>Lớp</Th>
                <Th className="text-right">Đơn giá</Th>
                <Th className="w-36 text-right">Tồn kho</Th>
                <Th className="text-center">Trạng thái</Th>
                <Th className="w-20 text-right">Sửa</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {products.map((row) => (
                <tr key={row.id} className={`transition-colors hover:bg-gray-50 ${row.is_active ? '' : 'opacity-50'}`}>
                  <td className="px-3 py-3 font-mono text-xs text-gray-600">{row.code}</td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900 whitespace-nowrap truncate max-w-[160px]">{row.name}</p>
                    {!row.is_active && <p className="text-xs text-red-400">Đang ẩn</p>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      <Tag className="h-3 w-3" weight="fill" />
                      {getCategoryLabel(row.category)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{getBoxTypeLabel(row.box_type)}</td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{formatSpec(row)}</td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{formatMinSpec(row)}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <StackIcon className="h-3 w-3" weight="fill" />
                      {(row.available_layers ?? []).map(String).join(', ') || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(Number(row.base_price ?? 0))}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <InlineStockEditor row={row} onSaved={() => router.refresh()} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                      row.is_active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}>
                      {row.is_active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-500">
                    Chưa có sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ProductEditModal product={modalProduct} open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleSubmit} />
    </div>
  )
}

// ─── Shared sub-components ─────────────────────────────────────────────────

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${className}`}>
      {children}
    </th>
  )
}

/** Ô tồn kho sửa nhanh — Enter/blur commit; xoá trắng gửi null */
function InlineStockEditor({ row, onSaved }: { row: StaffProductRow; onSaved: () => void }) {
  const [value, setValue] = useState<string | null>(row.stock_quantity != null ? String(row.stock_quantity) : '')
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle')

  async function commit() {
    if (value === null) return
    const trimmed = value.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    if (next !== null && (!Number.isInteger(next) || next < 0)) {
      setValue(row.stock_quantity != null ? String(row.stock_quantity) : '')
      return
    }
    if (next === row.stock_quantity) return

    setState('saving')
    const response = await fetch(`/api/products/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockQuantity: next }),
    })
    if (response.ok) {
      setState('idle')
      onSaved()
    } else {
      setState('error')
      setValue(row.stock_quantity != null ? String(row.stock_quantity) : '')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  return (
    <input
      aria-label={`Tồn kho ${row.code}`}
      type="number" min={0} step={1}
      value={value ?? ''}
      disabled={state === 'saving'}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() }
      }}
      className={`h-8 w-24 rounded-md border px-2 text-right text-sm ${
        state === 'error' ? 'border-red-400 bg-red-50' : value === '' ? 'border-dashed border-gray-300 text-gray-400' : 'border-gray-300'
      } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
      placeholder="—"
    />
  )
}
