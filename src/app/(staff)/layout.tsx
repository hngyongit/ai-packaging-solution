import { StaffSidebar } from '@/components/layout/staff-sidebar'
import { Navbar } from '@/components/layout/navbar'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <StaffSidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </>
  )
}