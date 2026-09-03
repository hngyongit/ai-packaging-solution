'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChartBar,
  ClipboardText,
  Package,
  Users,
  Cube,
  SignOut,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/staff', label: 'Tổng quan', icon: ChartBar },
  { href: '/staff/consultations', label: 'Tư vấn', icon: ClipboardText },
  { href: '/staff/orders', label: 'Đơn hàng', icon: Package },
  { href: '/staff/customers', label: 'Khách hàng', icon: Users },
  { href: '/staff/products', label: 'Sản phẩm', icon: Cube },
]

export function StaffSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <Link href="/staff" className="text-lg font-bold tracking-tight text-gray-900">
          Staff Panel
        </Link>
      </div>
      <div className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </div>
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <SignOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}