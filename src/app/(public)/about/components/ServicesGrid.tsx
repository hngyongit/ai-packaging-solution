'use client'

import { ArrowsClockwise, Factory, Images, Receipt, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/ui/FadeIn'

const tones = {
  blue: {
    card: 'border-blue-600 bg-blue-600 text-white',
    icon: 'text-blue-200',
    desc: 'text-blue-100',
  },
  dark: {
    card: 'border-gray-900 bg-gray-900 text-white',
    icon: 'text-gray-400',
    desc: 'text-gray-300',
  },
  light: {
    card: 'border-gray-200 bg-white text-gray-900',
    icon: 'text-blue-600',
    desc: 'text-gray-600',
  },
} as const

const services = [
  {
    icon: Sparkle,
    title: 'Tư vấn bao bì bằng AI',
    desc: 'Nhận tư vấn về loại thùng, kích thước, chất liệu, in ấn và số lượng dựa trên nhu cầu của sản phẩm.',
    span: 'lg:col-span-3',
    tone: 'blue',
  },
  {
    icon: Receipt,
    title: 'Báo giá nhanh hơn',
    desc: 'AI hỗ trợ thu thập và sắp xếp thông tin để đội ngũ kinh doanh có thể chuẩn bị báo giá sơ bộ hiệu quả hơn.',
    span: 'lg:col-span-3',
    tone: 'light',
  },
  {
    icon: Images,
    title: 'Xem trước mockup bao bì',
    desc: 'Xem trước hình ảnh bao bì trước khi sản xuất bằng cách sử dụng file thiết kế, logo hoặc hình ảnh tham khảo.',
    span: 'lg:col-span-2',
    tone: 'light',
  },
  {
    icon: Factory,
    title: 'Sản xuất thực tế',
    desc: 'Sau khi đơn hàng được xác nhận, các yêu cầu về bao bì sẽ được kết nối trực tiếp với quy trình sản xuất tại nhà máy.',
    span: 'lg:col-span-2',
    tone: 'dark',
  },
  {
    icon: ArrowsClockwise,
    title: 'Đặt lại đơn hàng dễ dàng',
    desc: 'Lưu lại thông tin bao bì trước đó để việc đặt lại trở nên nhanh chóng và thuận tiện hơn.',
    span: 'lg:col-span-2',
    tone: 'light',
  },
] as const

export function ServicesGrid() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Chúng tôi cung cấp những gì?
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {services.map((service) => {
              const Icon = service.icon
              const tone = tones[service.tone]
              return (
                <div
                  key={service.title}
                  className={cn(
                    'rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow',
                    service.span,
                    tone.card
                  )}
                >
                  <Icon className={cn('h-7 w-7', tone.icon)} />
                  <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
                  <p className={cn('mt-2 text-sm leading-relaxed', tone.desc)}>
                    {service.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
