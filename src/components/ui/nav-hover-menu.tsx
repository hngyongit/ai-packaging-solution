'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'

import { cn } from '@/lib/utils'

type NavHoverMenuItem = {
  href: string
  label: string
  description?: string
}

type NavHoverMenuProps = {
  /** Nhãn nhóm, chỉ cho aria — trigger đã hiển thị nhãn nhìn thấy. */
  label: string
  items: NavHoverMenuItem[]
  /** Element kích hoạt (thường là <Link>/<button> đã có style navbar). */
  trigger: React.ReactElement
  className?: string
}

/**
 * Menu hover trên navbar — Base UI Popover (openOnHover), click + keyboard vẫn
 * hoạt động (trigger mặc định mở bằng click). Theo convention `trigger` render
 * prop của modal.tsx.
 */
export function NavHoverMenu({ label, items, trigger, className }: NavHoverMenuProps) {
  return (
    <Popover.Root>
      <Popover.Trigger render={trigger} openOnHover delay={120} closeDelay={150} aria-label={label} />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} className="z-50 outline-none">
          <Popover.Popup
            className={cn(
              'w-72 rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.08)]',
              'origin-[var(--transform-origin)] transition-all data-closed:translate-y-1 data-closed:opacity-0 data-open:translate-y-0 data-open:opacity-100',
              className
            )}
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
              >
                <span className="block text-sm font-medium text-gray-900">{item.label}</span>
                {item.description ? (
                  <span className="mt-0.5 block text-xs leading-5 text-gray-500">{item.description}</span>
                ) : null}
              </a>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
