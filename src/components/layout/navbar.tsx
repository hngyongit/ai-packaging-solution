'use client'

import Link from 'next/link'
import { CaretDown, List, ShoppingCart, X, User } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { CART_UPDATED } from '@/components/cart/cart-events'
import { NavHoverMenu } from '@/components/ui/nav-hover-menu'

type NavLink = { href: string; label: string; description?: string; children?: NavLink[] }

const navLinks: NavLink[] = [
  { href: '/', label: 'Trang chủ' },
  { href: '/shop', label: 'Kho hàng' },
  {
    href: '/consultation',
    label: 'Tư vấn',
    children: [
      { href: '/consultation', label: 'Tư vấn thùng theo yêu cầu', description: 'AI thiết kế quy cách thùng riêng cho sản phẩm của bạn.' },
      { href: '/consultation/stock', label: 'Tư vấn mua thùng có sẵn', description: 'Tìm mẫu đang có trong kho phù hợp nhu cầu, đặt nhanh.' },
    ],
  },
  { href: '/about', label: 'Về chúng tôi' },
  { href: '/pricing', label: 'Bảng giá' },
]

export function Navbar({ hideAuth }: { hideAuth?: boolean }) {
  const [open, setOpen] = useState(false)
  const [consultOpen, setConsultOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // Badge giỏ hàng: tải lần đầu khi đã đăng nhập, refresh khi có sự kiện cart:updated.
  useEffect(() => {
    if (!user) {
      setCartCount(0)
      return
    }
    let active = true
    async function load() {
      const response = await fetch('/api/cart/count').catch(() => null)
      if (!response?.ok) return
      const body = (await response.json().catch(() => null)) as { count?: number } | null
      if (active) setCartCount(body?.count ?? 0)
    }
    void load()
    window.addEventListener(CART_UPDATED, load)
    return () => {
      active = false
      window.removeEventListener(CART_UPDATED, load)
    }
  }, [user])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
    window.location.reload()
  }


  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-gray-900"
          >
            AI Carton
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.children ? (
                <NavHoverMenu
                  key={link.href}
                  label={link.label}
                  items={link.children}
                  trigger={
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                      <CaretDown className="h-3 w-3" />
                    </Link>
                  }
                />
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>

        {!hideAuth && (
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard/cart"
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
                className="relative rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            ) : null}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden border-t border-gray-200 bg-white overflow-hidden transition-all duration-200',
          open ? 'max-h-[36rem]' : 'max-h-0'
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.href}>
                <button
                  type="button"
                  onClick={() => setConsultOpen((v) => !v)}
                  aria-expanded={consultOpen}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                  <CaretDown className={cn('h-3.5 w-3.5 transition-transform', consultOpen && 'rotate-180')} />
                </button>
                {consultOpen && (
                  <div className="ml-3 border-l border-gray-200 pl-2">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
          <hr className="my-2 border-gray-200" />
          {!hideAuth && (
            <>
              {user ? (
                <Link
                  href="/dashboard/cart"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Giỏ hàng
                  {cartCount > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              ) : null}
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="block rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}