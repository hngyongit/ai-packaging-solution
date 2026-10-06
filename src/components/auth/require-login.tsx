'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

import { LoginForm } from '@/components/auth/login-form'
import { Modal } from '@/components/ui/modal'

// Cổng đăng nhập cho trang public: khách vãng lai bấm "Thêm vào giỏ" thì hiện
// modal tại chỗ rồi chạy lại đúng hành động đó, không mất kết quả tư vấn.
//
// ponytail: 1 promise treo tại một thời điểm. Hai hành động cùng lúc thì cái sau
// ghi đè resolve của cái trước (cái trước treo tới khi unmount) — chấp nhận được
// vì UI chỉ cho bấm một nút một lúc; cần thì đổi sang mảng waiter.

type RequireLogin = () => Promise<boolean>

const RequireLoginContext = createContext<RequireLogin | null>(null)

/**
 * Dùng ở client component trong nhánh (public).
 * Ngoài provider (vd. trong /dashboard) → rơi về chuyển hướng /login như cũ,
 * vì ở đó khách đã đăng nhập rồi nên nhánh này gần như không chạy.
 */
export function useRequireLogin(): RequireLogin {
  const requireLogin = useContext(RequireLoginContext)
  return requireLogin ?? redirectToLogin
}

function redirectToLogin(): Promise<boolean> {
  window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
  return Promise.resolve(false)
}

/**
 * Sau khi login, nhận tư vấn ẩn danh về tài khoản vừa đăng nhập — không có bước này
 * thì thêm-giỏ/đặt-hàng từ tư vấn đó bị 404 (guard đòi customer_id khớp).
 * Lỗi mạng không chặn hành động: guard phía server vẫn là chốt cuối.
 */
export async function claimConsultationAfterLogin(consultationId?: string): Promise<void> {
  if (!consultationId) return
  await fetch(`/api/consultations/${consultationId}/claim`, { method: 'POST' }).catch(() => null)
}

export function RequireLoginProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const resolveRef = useRef<((ok: boolean) => void) | null>(null)

  const requireLogin = useCallback<RequireLogin>(() => {
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  // Đóng bằng nút X / phím Esc → coi như khách đổi ý.
  function handleOpenChange(next: boolean) {
    if (next) {
      setOpen(true)
      return
    }
    setOpen(false)
    resolveRef.current?.(false)
    resolveRef.current = null
  }

  function handleSuccess() {
    setOpen(false)
    resolveRef.current?.(true)
    resolveRef.current = null
  }

  return (
    <RequireLoginContext.Provider value={requireLogin}>
      {children}
      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title="Đăng nhập để tiếp tục"
        description="Bạn cần đăng nhập để lưu vào giỏ hàng, đặt hàng hoặc lưu mẫu. Kết quả tư vấn vẫn giữ nguyên."
      >
        <LoginForm onSuccess={handleSuccess} />
      </Modal>
    </RequireLoginContext.Provider>
  )
}
