'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * Tự động reload order detail page khi PayOS redirect về với status=PAID.
 * 
 * PayOS redirect về với query params:
 * ?payment=redirected&code=00&id=...&cancel=false&status=PAID&orderCode=...
 * 
 * Webhook đã update payment_status='paid' trong DB, nhưng page cần reload
 * để hiển thị đúng trạng thái mới.
 */
export function PayOSRedirectHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const status = searchParams.get('status')
    const cancel = searchParams.get('cancel')

    // Chỉ reload khi PayOS trả về status=PAID và cancel=false
    if (status === 'PAID' && cancel !== 'true') {
      // Debounce nhẹ để webhook kịp cập nhật DB
      const timer = setTimeout(() => {
        router.refresh()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  return null
}
