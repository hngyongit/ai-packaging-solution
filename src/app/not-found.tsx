'use client'

import Link from 'next/link'
import { House, Package } from '@phosphor-icons/react'

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gray-50 px-4 py-16 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/60 blur-3xl"
      />

      <div className="relative w-full max-w-xl text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900 transition-colors hover:text-blue-600"
        >
          <Package className="h-6 w-6 text-blue-600" weight="duotone" />
          AI Carton
        </Link>

        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Trang không tồn tại
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500 sm:text-base">
            Đường dẫn bạn truy cập không đúng hoặc trang này đã được chuyển đi.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
          >
            <House className="h-4 w-4" weight="bold" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  )
}
