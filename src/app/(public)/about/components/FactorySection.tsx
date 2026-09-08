import Image from 'next/image'
import { FadeIn } from '@/components/ui/FadeIn'

const gallery = [
  {
    src: 'https://picsum.photos/seed/carton-production-line/1280/720',
    alt: 'Dây chuyền sản xuất thùng carton tại nhà máy',
    className: 'col-span-2 aspect-[16/9]',
    sizes: '(min-width: 1024px) 40rem, 100vw',
  },
  {
    src: 'https://picsum.photos/seed/corrugated-boxes-stack/640/480',
    alt: 'Thùng carton thành phẩm',
    className: 'aspect-[4/3]',
    sizes: '(min-width: 1024px) 20rem, 50vw',
  },
  {
    src: 'https://picsum.photos/seed/packaging-warehouse/640/480',
    alt: 'Kho lưu trữ bao bì carton',
    className: 'aspect-[4/3]',
    sizes: '(min-width: 1024px) 20rem, 50vw',
  },
]

export function FactorySection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Nhà máy thực tế. Sản xuất thực tế.
              </h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Công nghệ chỉ là một phần của giải pháp.
              </p>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Nền tảng của chúng tôi được kết nối với năng lực sản xuất carton
                thực tế, tạo ra sự liên kết trực tiếp giữa quá trình tư vấn
                trực tuyến và sản xuất vật lý.
              </p>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Chúng tôi tin rằng khách hàng cần được thấy rõ nhà máy, máy
                móc, quy trình sản xuất và những sản phẩm bao bì thực tế mà
                chúng tôi cung cấp.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {gallery.map((image) => (
                <div
                  key={image.src}
                  className={`relative overflow-hidden rounded-lg bg-gray-200 ${image.className}`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={image.sizes}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
