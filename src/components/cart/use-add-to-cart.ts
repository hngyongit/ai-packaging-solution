'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { notifyCartUpdated } from './cart-events'

// Một lần gọi /api/cart cho cả "Thêm vào giỏ" và "Mua ngay" (thêm rồi sang
// checkout ngay). Ba UI (shop card, stock match card, custom tab) dùng chung —
// hôm nay mỗi chỗ tự viết fetch + 401 redirect → dễ lệch nhau.

export type CartPayload = {
  productId?: string
  quantity?: number
  hasPrinting?: boolean
  printingSpecs?: Record<string, unknown> | null
  kind?: 'stock' | 'custom'
  consultationId?: string
  savedProductId?: string
  custom?: unknown
}

export type CartStatus = 'idle' | 'saving' | 'added' | 'error'

export function useAddToCart() {
  const router = useRouter()
  const [status, setStatus] = useState<CartStatus>('idle')
  const [error, setError] = useState('')

  /** Thêm vào giỏ; trả về id dòng để "Mua ngay" đưa thẳng sang checkout. */
  async function add(payload: CartPayload): Promise<string | null> {
    setStatus('saving')
    setError('')
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.status === 401) {
      setError('Vui lòng đăng nhập để tiếp tục.')
      setStatus('error')
      window.setTimeout(() => {
        window.location.href = '/login'
      }, 1200)
      return null
    }

    const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null
    if (!response.ok || !body?.id) {
      setError(body?.error ?? 'Không thêm được vào giỏ. Vui lòng thử lại.')
      setStatus('error')
      return null
    }

    notifyCartUpdated()
    setStatus('added')
    window.setTimeout(() => setStatus('idle'), 2000)
    return body.id
  }

  /** Mua ngay = thêm vào giỏ rồi sang checkout với đúng dòng vừa thêm. */
  async function buyNow(payload: CartPayload) {
    const id = await add(payload)
    if (id) router.push(`/dashboard/checkout?items=${id}`)
  }

  return { status, error, add, buyNow }
}
