'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

type OrdersRealtimeRefreshProps = {
  orderId?: string
  customerId?: string
  includeHistory?: boolean
}

/** Refreshes server-rendered order data when an authorized Realtime row changes. */
export function OrdersRealtimeRefresh({
  orderId,
  customerId,
  includeHistory = false,
}: OrdersRealtimeRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const filter = orderId ? `id=eq.${orderId}` : customerId ? `customer_id=eq.${customerId}` : undefined
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(refreshTimer)
      // Status history is inserted immediately after the order update. A short
      // debounce lets both writes settle before refreshing Server Components.
      refreshTimer = setTimeout(() => router.refresh(), 250)
    }

    let channel = supabase.channel(`orders-realtime-${orderId ?? customerId ?? 'staff'}`).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', ...(filter ? { filter } : {}) },
      refresh
    )

    if (includeHistory && orderId) {
      channel = channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${orderId}` },
        refresh
      )
    }

    channel.subscribe()

    return () => {
      clearTimeout(refreshTimer)
      void supabase.removeChannel(channel)
    }
  }, [customerId, includeHistory, orderId, router])

  return null
}
