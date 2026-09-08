import { FadeIn } from '@/components/ui/FadeIn'

const steps = [
  {
    title: 'Cho chúng tôi biết về sản phẩm của bạn',
    desc: 'Cung cấp thông tin về sản phẩm, kích thước, số lượng và yêu cầu đóng gói.',
  },
  {
    title: 'Nhận đề xuất',
    desc: 'AI hỗ trợ xác định giải pháp carton phù hợp.',
  },
  {
    title: 'Xem trước & báo giá',
    desc: 'Xem mockup sơ bộ và nhận báo giá sơ bộ.',
  },
  {
    title: 'Xác nhận đơn hàng',
    desc: 'Đội ngũ kinh doanh kiểm tra thông tin và xác nhận báo giá chính thức.',
  },
  {
    title: 'Sản xuất',
    desc: 'Bao bì của bạn được đưa vào sản xuất tại nhà máy.',
  },
]

export function ProcessSteps() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Quy trình hoạt động
              </h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Năm bước từ thông tin sản phẩm đến sản xuất, tất cả trên một
                nền tảng.
              </p>
            </div>
            <ol className="lg:col-span-3 divide-y divide-gray-200">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-6 py-6 first:pt-0 last:pb-0">
                  <span className="pt-1 font-mono text-sm font-semibold text-blue-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
