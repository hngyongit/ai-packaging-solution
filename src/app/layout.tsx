import type { Metadata } from 'next'
import './globals.css'
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin','latin-ext'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'AI Carton Packaging — Giải pháp đóng gói thông minh',
  description:
    'Bao bì carton theo yêu cầu — Báo giá AI trong 30 giây. Nhập thông số sản phẩm, AI đề xuất hộp carton tối ưu.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}