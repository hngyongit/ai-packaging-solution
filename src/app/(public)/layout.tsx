import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { RequireLoginProvider } from '@/components/auth/require-login'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireLoginProvider>
      <Navbar />
      <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      <Footer />
    </RequireLoginProvider>
  )
}