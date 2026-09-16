'use client'

import Link from 'next/link'
import { MagnifyingGlass, Cube, Truck } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'

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

  // Hero = h-[125dvh], sticky stage pins for 125dvh - 100dvh = 1/4 screen.
  // The band after the pin (scroll past 1/4 but not yet out of the hero) is a no-rest zone:
  //   entering it downward → eased scroll down to section 2
  //   entering it upward   → eased scroll back to page top, so the dec group is back at its initial position
  // Native `behavior:'smooth'` is not used for the handoff: this page sets
  // `scroll-behavior:smooth` globally and the handler re-fires mid-flight, so the browser
  // animation gets cancelled/stacked. A rAF tween owns the whole trip (see scrollTo).
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let lastY = window.scrollY
    let tween: { id: number } | null = null

    const scrollTo = (target: number, duration: number) => {
      if (tween) cancelAnimationFrame(tween.id)
      const start = window.scrollY
      const delta = target - start
      if (Math.abs(delta) < 2) {
        window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior })
        lastY = target
        tween = null
        return
      }
      const state = { id: 0 }
      tween = state
      const t0 = performance.now()
      const step = (now: number) => {
        if (tween !== state) return
        const p = Math.min(1, (now - t0) / duration)
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        window.scrollTo({ top: start + delta * e, behavior: 'instant' as ScrollBehavior })
        lastY = window.scrollY
        if (p < 1) state.id = requestAnimationFrame(step)
        else tween = null
      }
      state.id = requestAnimationFrame(step)
    }

    const onScroll = () => {
      const y = window.scrollY
      const goingUp = y < lastY
      lastY = y

      if (tween) return // a handoff is in flight

      const top = hero.getBoundingClientRect().top
      const pinReleased = -top >= hero.offsetHeight - window.innerHeight
      const heroLeftView = top + hero.offsetHeight <= 0

      if (!pinReleased || heroLeftView) return // parked on hero or on a later section

      const next = hero.nextElementSibling
      // 120ms even for prefers-reduced-motion: the point is a non-rest band, and
      // a 0-duration tween is exactly the instant snap we are trying to kill.
      const duration = reducedMotion.matches ? 120 : 4400
      if (goingUp) {
        scrollTo(0, duration)
      } else if (next) {
        scrollTo(next.getBoundingClientRect().top + y, duration)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
        {/* Hero: dec group scrolls up (normal flow at top), content pinned on top (sticky z-10)
            for 1/4 viewport. The 1/4 hand-off is two-way — see the scroll effect above — so on
            scroll-back it eases to the hero head where the decs sit at their initial position. */}
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
                  href="/about"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Xem sản phẩm →
                </Link>
              </div>
            </div>
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