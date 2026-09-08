'use client'

import { Robot, UserCheck } from '@phosphor-icons/react'
import { FadeIn } from '@/components/ui/FadeIn'

export function ExpertiseSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              AI + Chuyên môn con người
            </h2>
            <p className="mt-6 text-xl font-semibold text-gray-900 leading-snug sm:text-2xl">
              <span className="block">AI giúp quy trình nhanh hơn.</span>
              <span className="block">Con người đảm bảo mọi thứ chính xác.</span>
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Robot className="h-7 w-7 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                AI hỗ trợ
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Tư vấn, thu thập yêu cầu, hỗ trợ kinh doanh, chăm sóc khách hàng
                và đặt lại đơn hàng.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <UserCheck className="h-7 w-7 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Con người đảm bảo
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Đội ngũ kinh doanh và kỹ thuật vẫn đóng vai trò quan trọng trong
                những bước cần chuyên môn con người, đặc biệt là xác nhận báo
                giá và chuẩn bị bao bì cho sản xuất.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
