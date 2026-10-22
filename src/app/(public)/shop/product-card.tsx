'use client'

import { useState } from 'react'
import { CheckCircle, Lightning, Plus } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAddToCart } from '@/components/cart/use-add-to-cart'
import { DeliveryEstimate } from '@/components/commerce/delivery-estimate'
import { formatCurrency } from '@/lib/utils'
import { type CartProduct } from '@/lib/data/products'

import { formatDimensions, formatLayers } from '@/features/products/utils'
import { getStockProductImageUrl } from '@/features/products/product-image'

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
  const imageSrc = getStockProductImageUrl(product)

  return (
    <Card className="group gap-0 overflow-hidden border-gray-200 py-0 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(37,99,235,0.12)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="relative h-48 overflow-hidden bg-slate-50 sm:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element -- product URLs can be managed from Supabase Storage */}
        {imageSrc ? <img
          src={imageSrc}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
          loading="lazy"
        /> : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/5 to-transparent" />
      </div>
      <CardContent className="flex flex-col gap-3 p-5">
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

        <div className="mt-1 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-lg font-semibold text-gray-950">
            {formatCurrency(product.basePrice)}
            <span className="ml-1 text-xs font-normal text-gray-500">/ {product.unit === 'unit' ? 'thùng' : product.unit}</span>
          </p>
          <DeliveryEstimate kind="stock" compact />

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
