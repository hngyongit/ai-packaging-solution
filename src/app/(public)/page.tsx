'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Cube, MagnifyingGlass, Package, Truck } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { PriceEstimateNotice } from '@/components/commerce/price-estimate-notice'

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)

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

  // Reveal-on-scroll for every `[data-reveal]` block (sections below the hero).
  // Plain IntersectionObserver + CSS (.reveal / .reveal.is-visible in globals.css) —
  // motion's whileInView was unreliable on this page.
  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    )
    if (!blocks.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // one-way: reveal on entry, stay visible after — toggling off on exit
          // fades content out at the top edge while the user is still reading it
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        }
      },
      // fire only once the block's top has crossed 35% up from the viewport
      // bottom — i.e. the block is genuinely in the viewing area. An edge-cross
      // trigger (threshold 0/0.15) completes the fade off-screen at normal
      // scroll speed; the user only ever sees the finished result.
      { threshold: 0, rootMargin: '0px 0px -35% 0px' },
    )
    blocks.forEach((b) => io.observe(b))
    return () => io.disconnect()
  }, [])

  return (
    // overflow-x-clip (not -hidden): -hidden creates a scroll container and kills position:sticky
    <div className="overflow-x-clip reveal-init">
      <>
        {/* Hero: dec group scrolls up in normal flow while the content stays pinned briefly. */}
        <section ref={heroRef} className="relative h-[125dvh]">
          {/* Decorative images — one group, positions unchanged */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[100dvh]">
            <div className="absolute left-[16%] md:left-[-5%] top-[-2%] -rotate-45">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dbq76uhcf/image/upload/v1789318535/landing_dec3.png"
                alt=""
                className="w-28 md:w-45 lg:w-60 opacity-80 select-none drop-shadow-lg animate-[floatDec_4s_ease-in-out_infinite]"
              />
            </div>
            <div className="absolute right-[30%] md:right-[30%] top-[30%] rotate-[-12deg]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dbq76uhcf/image/upload/v1789318534/landing_dec2.png"
                alt=""
                className="w-24 md:w-36 lg:w-44 opacity-85 select-none drop-shadow-lg animate-[floatDec_4s_ease-in-out_infinite_1s]"
              />
            </div>
            <div className="absolute right-[40px] md:right-[60px] bottom-[-30px] rotate-[10deg]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dbq76uhcf/image/upload/v1789318534/landing_dec1.png"
                alt=""
                className="w-40 md:w-52 lg:w-64 opacity-80 select-none drop-shadow-lg animate-[floatDec_4s_ease-in-out_infinite_2s]"
              />
            </div>
          </div>

          <div className="sticky top-0 z-10 flex h-[100dvh] items-center pt-24 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Xem hàng có sẵn
                </Link>
              </div>
            </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div data-reveal className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Bạn cần loại bao bì nào?
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
                Chọn đúng lối mua hàng ngay từ đầu. Bạn có thể đặt nhanh thùng có sẵn hoặc nhận tư vấn cho quy cách riêng.
              </p>
            </div>
            <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2">
              <article className="group flex min-h-[430px] flex-col rounded-2xl border border-emerald-200 bg-[linear-gradient(145deg,#f0fdf4_0%,#ecfdf5_100%)] p-6 shadow-[0_10px_30px_rgba(5,150,105,0.06)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_44px_rgba(5,150,105,0.12)] motion-reduce:transform-none motion-reduce:transition-none sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Package className="h-6 w-6" weight="duotone" />
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">Giao nhanh</span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-gray-950">Thùng carton có sẵn</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  Chọn mẫu tiêu chuẩn đang có kho, xem giá và thêm vào giỏ ngay. Phù hợp khi bạn cần hàng nhanh.
                </p>
                <div className="mt-auto pt-8">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Truck className="h-5 w-5" weight="duotone" />
                    Dự kiến giao 3-4 ngày làm việc
                  </p>
                  <Link href="/shop" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] sm:w-fit">
                    Mua hàng có sẵn <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
              <article className="group flex min-h-[430px] flex-col rounded-2xl border border-blue-300 bg-[linear-gradient(145deg,#eff6ff_0%,#eef2ff_100%)] p-6 shadow-[0_12px_34px_rgba(37,99,235,0.09)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_20px_48px_rgba(37,99,235,0.16)] motion-reduce:transform-none motion-reduce:transition-none sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <MagnifyingGlass className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700">Thiết kế riêng</span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-gray-950">Thùng theo yêu cầu</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  Nhập sản phẩm, kích thước và số lượng. AI đề xuất quy cách, giá ước tính và đội ngũ xác nhận trước khi sản xuất.
                </p>
                <div className="mt-4">
                  <PriceEstimateNotice />
                </div>
                <div className="mt-auto pt-6">
                  <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <Truck className="h-5 w-5" weight="duotone" />
                    Dự kiến giao khoảng 15 ngày
                  </p>
                  <Link href="/consultation" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98] sm:w-fit">
                    Nhận tư vấn miễn phí <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div data-reveal className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          <div data-reveal className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                    <PriceEstimateNotice compact />
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
          <div data-reveal className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-200">
                <Image
                  src="/images/factory-workshop-clean.png"
                  alt="Xưởng sản xuất bao bì carton với dây chuyền máy móc và thành phẩm"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-center"
                />
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
          <div data-reveal className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
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
