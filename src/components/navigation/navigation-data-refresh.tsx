'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Next's client router may reuse a previously prefetched Server Component tree.
 * Refresh after a real pathname transition so database-backed pages never show
 * an old snapshot until the user manually reloads.
 */
export function NavigationDataRefresh() {
  const pathname = usePathname()
  const router = useRouter()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    router.refresh()
  }, [pathname, router])

  return null
}
