'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MagnifyingGlass, ArrowClockwise, Package } from '@phosphor-icons/react'

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Xin chào, {user?.user_metadata?.full_name || user?.email || 'bạn'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Chào mừng trở lại</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/consultation"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
        >
          <MagnifyingGlass className="h-4 w-4" />
          Tư vấn mới
        </Link>
        <Link
          href="/dashboard/reorder"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowClockwise className="h-4 w-4" />
          Đặt lại
        </Link>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Package className="h-4 w-4" />
          Theo dõi đơn
        </Link>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Chưa có đơn hàng nào
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Hãy bắt đầu tư vấn để nhận đề xuất đóng gói phù hợp.
        </p>
        <Link
          href="/consultation"
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Bắt đầu tư vấn
        </Link>
      </div>
    </div>
  )
}