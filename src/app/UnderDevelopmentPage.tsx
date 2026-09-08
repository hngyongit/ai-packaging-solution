'use client'

import Link from 'next/link'
import { Wrench } from '@phosphor-icons/react'

export default function UnderDevelopmentPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Wrench className="h-16 w-16 text-gray-300" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
        Đang phát triển
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Trang này đang được xây dựng. Vui lòng quay lại sau.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Về trang chủ
      </Link>
    </div>
  )
}