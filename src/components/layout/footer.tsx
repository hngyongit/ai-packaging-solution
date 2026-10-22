import Link from 'next/link'
import { ChatCircleText, FacebookLogo, Phone } from '@phosphor-icons/react/dist/ssr'
import { BrandLogo } from '@/components/layout/brand-logo'

const footerLinks = [
  {
    title: 'Dịch vụ',
    links: [
      { label: 'Tư vấn AI', href: '/consultation' },
      { label: 'Đặt hàng', href: '/shop' },
      { label: 'Bảng giá', href: '/pricing' },
    ],
  },
  {
    title: 'Công ty',
    links: [
      { label: 'Về chúng tôi', href: '/about' },
      { label: 'Liên hệ', href: '/about' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Câu hỏi thường gặp', href: '/#faq' },
      { label: 'Điều khoản sử dụng', href: '#' },
    ],
  },
]

const contactLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61584385318993',
    icon: FacebookLogo,
  },
  { label: '0968373066', href: 'tel:0968373066', icon: Phone },
  {
    label: 'Zalo: 0968373066',
    href: 'https://zalo.me/0968373066',
    icon: ChatCircleText,
  },
]

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <BrandLogo compact />
            <p className="mt-2 text-sm text-gray-500 max-w-[30ch]">
              Giải pháp đóng gói thông minh. Bao bì carton theo yêu cầu với
              báo giá AI trong 30 giây.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-900">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Liên hệ</h3>
            <ul className="mt-3 space-y-1">
              {contactLinks.map((link) => {
                const Icon = link.icon

                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                      aria-label={link.label}
                      className="group -ml-2 inline-flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-sm text-gray-600 transition-colors hover:bg-white hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
                        <Icon className="h-[17px] w-[17px]" aria-hidden="true" weight="regular" />
                      </span>
                      <span className="whitespace-nowrap">{link.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ThinhLoi Packaging. All rights
          reserved.
        </div>
      </div>
    </footer>
  )
}
