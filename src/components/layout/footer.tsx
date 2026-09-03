import Link from 'next/link'

const footerLinks = [
  {
    title: 'Dịch vụ',
    links: [
      { label: 'Tư vấn AI', href: '/consultation' },
      { label: 'Đặt hàng', href: '/order' },
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

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-gray-900"
            >
              AI Carton
            </Link>
            <p className="mt-2 text-sm text-gray-500 max-w-[30ch]">
              Giải pháp đóng gói thông minh — bao bì carton theo yêu cầu với
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
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} AI Carton Packaging. All rights
          reserved.
        </div>
      </div>
    </footer>
  )
}