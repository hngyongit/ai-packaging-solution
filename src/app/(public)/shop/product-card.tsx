'use client'

import { useState } from 'react'
import { CheckCircle, Lightning, Plus } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAddToCart } from '@/components/cart/use-add-to-cart'
import { formatCurrency } from '@/lib/utils'
import { type CartProduct } from '@/lib/data/products'

import { formatDimensions, formatLayers } from '@/features/products/utils'

function StockBadge({ quantity }: { quantity: number }) {
  const low = quantity <= 100
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${
        low ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {low ? `Còn ${quantity.toLocaleString('vi-VN')} thùng` : `Còn hàng: ${quantity.toLocaleString('vi-VN')}`}
    </span>
  )
}

export function ProductCard({ product }: { product: CartProduct }) {
  const [quantity, setQuantity] = useState(100)
  const { status, error, add, buyNow } = useAddToCart()

  const stock = product.stockQuantity ?? 0
  const outOfStock = stock <= 0
  const payload = { productId: product.id, quantity }

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-gray-500">{product.code}</p>
            <h3 className="mt-1 text-base font-semibold text-gray-950">{product.name}</h3>
          </div>
          {outOfStock ? (
            <span className="inline-flex h-5 items-center rounded-full border border-red-200 bg-red-50 px-2 text-xs font-medium text-red-700">
              Tạm hết
            </span>
          ) : (
            <StockBadge quantity={stock} />
          )}
        </div>

        {product.description && (
          <p className="line-clamp-2 text-sm text-gray-600">{product.description}</p>
        )}

        <p className="text-sm text-gray-600">
          {product.maxDimensions ? `≤ ${formatDimensions(product.maxDimensions)}` : 'Quy cách liên hệ'}
          {' · '}
          {formatLayers(product.availableLayers)}
        </p>

        <div className="mt-auto space-y-3 pt-1">
          <p className="text-lg font-semibold text-gray-950">
            {formatCurrency(product.basePrice)}
            <span className="ml-1 text-xs font-normal text-gray-500">/ {product.unit === 'unit' ? 'thùng' : product.unit}</span>
          </p>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`qty-${product.id}`}>
              Số lượng
            </label>
            <Input
              id={`qty-${product.id}`}
              type="number"
              min={1}
              step={1}
              value={quantity}
              disabled={outOfStock}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="h-8 w-24"
            />
            <Button
              size="sm"
              className="flex-1"
              disabled={outOfStock || status === 'saving' || !(quantity > 0)}
              onClick={() => void add(payload)}
            >
              {status === 'added' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Đã thêm
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {status === 'saving' ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </>
              )}
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={outOfStock || status === 'saving' || !(quantity > 0)}
            onClick={() => void buyNow(payload)}
          >
            <Lightning className="h-4 w-4" />
            Mua ngay
          </Button>
          {status === 'error' && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
