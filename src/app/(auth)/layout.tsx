import { redirect } from 'next/navigation'

import { DashboardNav } from '@/components/layout/DashboardNav'
import { Navbar } from '@/components/layout/navbar'
import { createAdminClient, createClient } from '@/lib/supabase/server'

// Chặn mọi trang (auth) khi email chưa OTP-verified (luồng tự gửi Gmail).
// Đặt ở layout thay vì từng page: các page đã có redirect('/login') riêng,
// ở đây chỉ thêm cửa "/verify".
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const admin = await createAdminClient()
    const { data } = await admin
      .from('email_verifications')
      .select('verified_at')
      .eq('user_id', user.id)
      .single()
    if (!data?.verified_at) redirect('/verify')
  }

  return (
    <>
      <Navbar hideAuth />
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <DashboardNav />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </>
  )
}
