'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { claimConsultationAfterLogin, useRequireLogin } from '@/components/auth/require-login'

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
  const requireLogin = useRequireLogin()
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
      setStatus('idle')
      // Khách vãng lai: hiện form đăng nhập tại chỗ rồi chạy lại đúng hành động.
      if (!(await requireLogin())) return null
      await claimConsultationAfterLogin(payload.consultationId)
      return add(payload)
    }

    const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null
    if (!response.ok || !body?.id) {
      setError(body?.error ?? 'Không thêm được vào giỏ. Vui lòng thử lại.')
      setStatus('error')
      return null
    }

    notifyCartUpdated()
    // Clear prefetched Server Component snapshots (especially /dashboard/cart)
    // before the next client-side navigation reuses them.
    router.refresh()
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
