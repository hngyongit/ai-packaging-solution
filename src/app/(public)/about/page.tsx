import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FadeIn } from '@/components/ui/FadeIn'
import { ServicesGrid } from './components/ServicesGrid'
import { ProcessSteps } from './components/ProcessSteps'
import { FactorySection } from './components/FactorySection'
import { ExpertiseSection } from './components/ExpertiseSection'

export const metadata: Metadata = {
  title: 'Về chúng tôi - AI Carton Packaging',
  description:
    'Nền tảng ứng dụng AI giúp doanh nghiệp lựa chọn giải pháp carton phù hợp, nhận báo giá nhanh hơn và kết nối trực tiếp với nhà máy sản xuất.',
}

const audiences = [
  'Nhà sản xuất',
  'Thương hiệu',
  'OEM',
  'Doanh nghiệp xuất khẩu',
  'Người bán online',
  'Doanh nghiệp nhỏ',
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="https://picsum.photos/seed/carton-factory-floor/1920/1080"
          alt="Nhà máy sản xuất bao bì carton"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/70 to-gray-900/40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl leading-none">
              Packaging Expertise, Powered by AI
            </h1>
            <p className="mt-6 text-lg text-gray-200 leading-relaxed max-w-[65ch]">
              Chúng tôi giúp việc tìm hiểu, đặt hàng và sản xuất bao bì carton
              trở nên đơn giản hơn.
            </p>
            <div className="mt-8">
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
              >
                Bắt đầu tư vấn
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Không chỉ là một nhà sản xuất carton
              </h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Nền tảng ứng dụng AI của chúng tôi giúp doanh nghiệp lựa chọn
                giải pháp carton phù hợp, nhận báo giá sơ bộ nhanh hơn, xem
                trước mockup bao bì và kết nối trực tiếp với quy trình sản xuất.
              </p>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Chúng tôi kết hợp công nghệ AI với năng lực sản xuất bao bì
                carton thực tế để tạo ra một quy trình đặt hàng đơn giản và
                chuyên nghiệp hơn. Từ tư vấn, báo giá đến sản xuất và đặt lại
                đơn hàng, chúng tôi kết nối toàn bộ quy trình trên một nền tảng.
              </p>
              <p className="mt-6 text-xl font-semibold text-gray-900 leading-snug">
                Mục tiêu của chúng tôi rất đơn giản: giúp doanh nghiệp đặt bao
                bì nhanh hơn, rõ ràng hơn và dễ dàng hơn.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <ServicesGrid />
      <ProcessSteps />

      <ExpertiseSection />

      {/* Built for Businesses */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Dành cho doanh nghiệp
              </h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Dù bạn đã có thiết kế bao bì hay cần tư vấn để lựa chọn loại
                carton phù hợp, nền tảng của chúng tôi được xây dựng cho nhiều
                loại hình doanh nghiệp.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {audiences.map((audience) => (
                  <span
                    key={audience}
                    className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-700"
                  >
                    {audience}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <FactorySection />

      {/* Vision CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Một cách đơn giản hơn để đặt bao bì
              </h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Chúng tôi tin rằng doanh nghiệp không nên phải trải qua một quy
                trình phức tạp chỉ để tìm được chiếc hộp phù hợp.
              </p>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Tầm nhìn của chúng tôi là kết hợp{' '}
                <span className="font-semibold text-gray-900">
                  công nghệ AI, chuyên môn con người và năng lực sản xuất thực
                  tế
                </span>{' '}
                để tạo ra một trải nghiệm đặt bao bì liền mạch và hiệu quả hơn.
              </p>
              <Link
                href="/consultation"
                className="mt-8 inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
              >
                Bắt đầu tư vấn
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
