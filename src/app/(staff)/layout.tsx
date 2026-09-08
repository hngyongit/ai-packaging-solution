import { StaffSidebar } from '@/components/layout/StaffSidebar'
import { Navbar } from '@/components/layout/Navbar'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar hideAuth />
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <StaffSidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </>
  )
}