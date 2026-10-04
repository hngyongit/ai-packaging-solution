import { StaffSidebar } from '@/components/layout/StaffSidebar'
import { Navbar } from '@/components/layout/navbar'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar hideAuth />
      <div className="flex h-[calc(100dvh-4rem)]">
        <StaffSidebar />
        <main className="min-w-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </>
  )
}