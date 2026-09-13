'use client'

import Link from 'next/link'
import { MagnifyingGlass, Cube, Truck } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    // Inject keyframes once
    if (!document.getElementById('hero-animations')) {
      const style = document.createElement('style')
      style.id = 'hero-animations'
      style.textContent = `
        @keyframes heroSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        .hero-entrance{animation:heroSlideUp 1.2s ease-out forwards}
        @keyframes floatDec{0%,100%{margin-top:0}50%{margin-top:-12px}}
      `
      document.head.appendChild(style)
    }
    el.classList.add('hero-entrance')

    // After entrance completes, hand off to scroll-based observer
    setTimeout(() => {
      el.style.opacity = ''
      el.style.transform = ''
      el.style.animation = 'none'
      el.style.transition = 'opacity .4s ease'

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1'
          } else {
            el.style.opacity = '0'
          }
        },
        { threshold: 0.3 },
      )
      observer.observe(el)
    }, 850)
  }, [])

  return (
    <div className="overflow-x-hidden">
      <>
        {/* Hero */}
        <section ref={heroRef} className="relative min-h-[100dvh] flex items-center pt-24 pb-16">
          {/* Decorative images */}
          <div className="absolute left-[16%] md:left-[-5%] top-[-2%] -rotate-45">
            <img
              src="https://res.cloudinary.com/dbq76uhcf/image/upload/v1789318535/landing_dec3.png"
              alt=""
              className="w-28 md:w-45 lg:w-60 opacity-80 pointer-events-none select-none drop-shadow-lg animate-[floatDec_4s_ease-in-out_infinite]"
            />
          </div>
          <div className="absolute right-[30%] md:right-[30%] top-[30%] rotate-[-12deg]">
            <img
              src="https://res.cloudinary.com/dbq76uhcf/image/upload/v1789318534/landing_dec2.png"
              alt=""
              className="w-24 md:w-36 lg:w-44 opacity-85 pointer-events-none select-none drop-shadow-lg animate-[floatDec_4s_ease-in-out_infinite_1s]"
            />
          </div>
          <div className="absolute right-[40px] md:right-[60px] bottom-[-30px] rotate-[10deg]">
            <img
              src="https://res.cloudinary.com/dbq76uhcf/image/upload/v1789318534/landing_dec1.png"
              alt=""
              className="w-40 md:w-52 lg:w-64 opacity-80 pointer-events-none select-none drop-shadow-lg animate-[floatDec_4s_ease-in-out_infinite_2s]"
            />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-gray-500">
                Giải pháp đóng gói thông minh
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-none">
                Bao bì carton theo yêu cầu — Báo giá AI trong 30 giây
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-[65ch] leading-relaxed">
                Nhập thông số sản phẩm, AI đề xuất hộp carton tối ưu — kích
                thước, chất liệu, giá cả. Đặt hàng ngay.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
                >
                  <MagnifyingGlass className="mr-2 h-5 w-5" />
                  Bắt đầu tư vấn miễn phí
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Xem sản phẩm →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Cách hoạt động
              </h2>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    {step.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Catalog Preview */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Sản phẩm của chúng tôi
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div
                  key={p.name}
                  className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.flute}</p>
                    <p className="text-lg font-bold text-blue-600">
                      Từ {p.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/pricing"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Xem tất cả sản phẩm →
              </Link>
            </div>
          </div>
        </section>

        {/* Factory Tour */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="aspect-[4/3] rounded-lg bg-gray-200 flex items-center justify-center">
                <Cube className="h-16 w-16 text-gray-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Nhà máy của chúng tôi
                </h2>
                <p className="mt-4 text-base text-gray-600 leading-relaxed">
                  Hơn 10 năm kinh nghiệm sản xuất bao bì carton tại Việt Nam.
                  Công nghệ Đức, tiêu chuẩn Nhật.
                </p>
                <dl className="mt-8 grid grid-cols-2 gap-6">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <dt className="text-2xl font-bold text-gray-900">
                        {s.value}
                      </dt>
                      <dd className="text-sm text-gray-500">{s.label}</dd>
                    </div>
                  ))}
                </dl>
                <Link
                  href="/about"
                  className="mt-6 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Xem thêm →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Sẵn sàng đặt bao bì cho sản phẩm của bạn?
            </h2>
            <p className="mt-4 text-base text-gray-600">
              Nhập thông số, AI đề xuất ngay — miễn phí.
            </p>
            <Link
              href="/consultation"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              <MagnifyingGlass className="mr-2 h-5 w-5" />
              Bắt đầu tư vấn ngay
            </Link>
          </div>
        </section>
      </>
    </div>
  )
}

const steps = [
  {
    icon: <Cube className="h-7 w-7" />,
    title: 'Nhập thông số sản phẩm',
    desc: 'Nhập kích thước, trọng lượng, số lượng sản phẩm của bạn.',
  },
  {
    icon: <MagnifyingGlass className="h-7 w-7" />,
    title: 'AI đề xuất hộp tối ưu',
    desc: 'AI phân tích và đề xuất loại hộp, chất liệu, giá cả phù hợp.',
  },
  {
    icon: <Truck className="h-7 w-7" />,
    title: 'Đặt hàng & nhận hàng',
    desc: 'Xác nhận, thanh toán, nhận hàng đúng hạn.',
  },
]

const products = [
  {
    name: 'Carton 3 lớp',
    flute: 'B-flute',
    price: '3,000đ',
    image:
      'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789317936/3_layer.png',
  },
  {
    name: 'Carton 5 lớp',
    flute: 'BC-flute',
    price: '5,500đ',
    image:
      'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789317934/5_layer.png',
  },
  {
    name: 'Carton sóng E',
    flute: 'E-flute',
    price: '4,000đ',
    image:
      'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789317935/e_flute.png',
  },
]

const stats = [
  { value: '5000+', label: 'Khách hàng' },
  { value: '10+ năm', label: 'Kinh nghiệm' },
  { value: '3000m²', label: 'Nhà máy' },
  { value: '63 tỉnh', label: 'Phủ sóng' },
]