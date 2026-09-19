import { type Metadata } from 'next'
import Link from 'next/link'

import { getStockedProducts } from '@/lib/data/products'

import { ProductCard } from './product-card'

export const metadata: Metadata = {
  title: 'Thùng carton có sẵn - AI Carton Packaging',
  description:
    'Thùng carton tiêu chuẩn có sẵn trong kho, số lượng lớn, giao nhanh. Thêm vào giỏ và đặt hàng trong vài phút.',
}

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const products = await getStockedProducts()

  return (
    <div className="bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
            Thùng carton có sẵn
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Các mã thùng đang có trong kho, chọn số lượng và thêm vào giỏ. Chưa tìm
            được kích thước phù hợp?{' '}
            <Link href="/consultation" className="font-medium text-blue-700 hover:underline">
              Nhận tư vấn thùng theo yêu cầu
            </Link>
            .
          </p>
        </div>

        {products.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-600">
            Kho đang cập nhật hàng. Vui lòng quay lại sau hoặc nhận tư vấn theo yêu cầu.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
