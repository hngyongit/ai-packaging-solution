import { DashboardNav } from '@/components/layout/dashboard-nav'
import { Navbar } from '@/components/layout/navbar'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
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