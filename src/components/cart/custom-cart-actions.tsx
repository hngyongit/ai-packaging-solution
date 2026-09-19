'use client'

import Link from 'next/link'
import { Lightning, Plus } from '@phosphor-icons/react'

import { Button, buttonVariants } from '@/components/ui/button'

import { type CartPayload, useAddToCart } from './use-add-to-cart'

/**
 * Hai nút "Thêm vào giỏ" / "Mua ngay" cho một dòng custom — đơn chỉ được tạo
 * từ đây, không còn form tạo đơn riêng. Dùng ở màn kết quả tư vấn và tab
 * "Sản phẩm theo yêu cầu".
 */
export function CustomCartActions({
  payload,
  disabled = false,
  fallbackHref = '/dashboard/custom',
  fallbackLabel = 'Tự nhập quy cách',
  className,
  size = 'default',
}: {
  payload: CartPayload | null
  disabled?: boolean
  fallbackHref?: string
  fallbackLabel?: string
  className?: string
  size?: 'default' | 'sm' | 'lg'
}) {
  const { status, error, add, buyNow } = useAddToCart()

  if (!payload) {
    return (
      <Link href={fallbackHref} className={buttonVariants({ variant: 'outline', size, className })}>
        {fallbackLabel}
      </Link>
    )
  }

  const busy = disabled || status === 'saving'
  return (
    <div className={className}>
      <Button size={size} className="w-full" disabled={busy} onClick={() => void add(payload)}>
        <Plus className="h-4 w-4" />
        {status === 'added' ? 'Đã thêm vào giỏ' : busy ? 'Đang thêm...' : 'Thêm vào giỏ'}
      </Button>
      <Button size={size} variant="outline" className="w-full" disabled={busy} onClick={() => void buyNow(payload)}>
        <Lightning className="h-4 w-4" />
        Mua ngay
      </Button>
      {status === 'error' && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  )
}
