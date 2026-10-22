'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  CaretUpDown,
  ClipboardText,
  ClockCounterClockwise,
  House,
  Package,
  ShoppingCart,
  SignOut,
  User,
} from '@phosphor-icons/react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Tổng quan', icon: House },
  { href: '/dashboard/cart', label: 'Giỏ hàng', icon: ShoppingCart },
  { href: '/dashboard/custom', label: 'Theo yêu cầu', icon: Package },
  { href: '/dashboard/orders', label: 'Đơn hàng', icon: ClipboardText },
  { href: '/dashboard/history', label: 'Lịch sử', icon: ClockCounterClockwise },
]

const profileLink = { href: '/dashboard/profile', label: 'Hồ sơ', icon: User }
const mobileLinks = [...links, profileLink]

function isActivePath(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.split('@')[0] || 'T'
  const words = source.split(/\s+/).filter(Boolean)
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : source.slice(0, 2).toUpperCase()
}

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [menuOpen, setMenuOpen] = useState(false)
  const [account, setAccount] = useState({ name: 'Khách hàng', email: '' })

  useEffect(() => {
    let active = true

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || !active) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .maybeSingle()

      if (active) {
        setAccount({
          name: profile?.full_name || data.user.user_metadata?.full_name || 'Khách hàng',
          email: data.user.email || '',
        })
      }
    })

    return () => { active = false }
  }, [supabase])

  useEffect(() => setMenuOpen(false), [pathname])

  async function handleLogout() {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = getInitials(account.name, account.email)

  return (
    <>
      <nav
        aria-label="Điều hướng tài khoản"
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden"
      >
        {mobileLinks.map((link) => {
          const Icon = link.icon
          const active = isActivePath(pathname, link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              )}
            >
              <Icon className="h-4 w-4" weight={active ? 'fill' : 'regular'} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-72 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-5 pb-3 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Khu vực khách hàng</p>
        </div>

        <nav aria-label="Điều hướng tài khoản" className="flex-1 space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActivePath(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.98]',
                  active
                    ? 'bg-blue-50 text-blue-700 shadow-[inset_3px_0_0_#2563eb]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                )}
              >
                <span className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                  active ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 group-hover:bg-white'
                )}>
                  <Icon className="h-[18px] w-[18px]" weight={active ? 'fill' : 'regular'} />
                </span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="relative border-t border-slate-200 p-3">
          {menuOpen && (
            <div role="menu" className="absolute bottom-[calc(100%+8px)] left-3 right-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_40px_rgba(15,23,42,0.14)]">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-slate-900">{account.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{account.email}</p>
              </div>
              <Link
                href="/dashboard/profile"
                role="menuitem"
                className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                <User className="h-[18px] w-[18px] text-slate-500" />
                Hồ sơ của tôi
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <SignOut className="h-[18px] w-[18px]" />
                Đăng xuất
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={cn(
              'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50',
              menuOpen && 'bg-slate-50'
            )}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm ring-2 ring-blue-100">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">{account.name}</span>
              <span className="block truncate text-xs text-slate-500">Tài khoản cá nhân</span>
            </span>
            <CaretUpDown className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        </div>
      </aside>
    </>
  )
}
