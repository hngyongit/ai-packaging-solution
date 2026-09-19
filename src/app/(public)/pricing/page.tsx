import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Info } from '@phosphor-icons/react/dist/ssr'

import {
  DEPOSIT_PERCENTAGE,
  DEPOSIT_THRESHOLD,
  VAT_PERCENTAGE,
} from '@/lib/config/pricing'
import { getCatalogProducts } from '@/lib/data/products'
import { CatalogTable } from '@/features/products/components/CatalogTable'
import { PriceTierCards } from '@/features/products/components/PriceTierCards'

export const metadata: Metadata = {
  title: 'Bảng giá - AI Carton Packaging',
  description:
    'Bảng giá thùng carton minh bạch theo số lượng đặt hàng, chiết khấu rõ ràng cho doanh nghiệp — đơn hàng càng lớn, đơn giá càng tốt.',
}

const priceNotes = [
  `Giá tham khảo chưa bao gồm VAT ${VAT_PERCENTAGE}%.`,
  `Đơn hàng có giá trị trên ${DEPOSIT_THRESHOLD.toLocaleString('vi-VN')}đ cần đặt cọc ${DEPOSIT_PERCENTAGE}% giá trị đơn hàng.`,
  'Giá cuối cùng sẽ do nhân viên của chúng tôi xác nhận sau khi xem xét yêu cầu cụ thể của bạn.',
  'Chi phí in ấn và thiết kế được tính riêng theo yêu cầu.',
]

export default async function PricingPage() {
  const products = await getCatalogProducts()

  return (
    <>
      {/* Header */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-gray-500">
              Bảng giá
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Bảng giá thùng carton
            </h1>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Đơn giá tham khảo theo số lượng đặt hàng — đặt càng nhiều, đơn giá
              càng tốt. Sau khi nhận yêu cầu, nhân viên của chúng tôi sẽ xác
              nhận báo giá cuối cùng phù hợp với quy cách thực tế của bạn.
            </p>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Catalogue sản phẩm
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Các dòng thùng carton tiêu chuẩn đang sản xuất, sắp xếp theo giá
              từ thấp đến cao.
            </p>
          </div>
          <CatalogTable products={products} />
        </div>
      </section>

      {/* Volume tiers */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Chiết khấu theo số lượng
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Mức chiết khấu áp dụng trực tiếp trên đơn giá gốc của từng sản
              phẩm, dựa theo tổng số lượng hộp trong một đơn hàng.
            </p>
          </div>
          <div className="mt-8">
            <PriceTierCards />
          </div>
        </div>
      </section>

      {/* Policy + CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                Lưu ý về giá
              </h2>
              <ul className="mt-6 space-y-4">
                {priceNotes.map((note, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {index === 0 ? (
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    ) : (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    )}
                    <span className="text-sm text-gray-600">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Cần báo giá chính xác?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Gửi thông số sản phẩm của bạn, đội ngũ của chúng tôi sẽ tư vấn
                loại carton phù hợp và phản hồi báo giá chi tiết trong thời
                gian sớm nhất.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  Nhận tư vấn miễn phí
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Đặt hàng ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
