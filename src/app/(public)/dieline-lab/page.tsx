import type { Metadata } from 'next'

import { DielinePreview } from '@/features/dieline/DielinePreview'

export const metadata: Metadata = {
  title: 'Xem trước khuôn bế (Dieline) — AI Carton Packaging',
  description:
    'Nhập kích thước D × C × R (mm), chọn kiểu thùng và xem ngay bản khuôn bế trải phẳng — phóng to theo tỉ lệ thật, tải SVG hoặc in đúng khổ.',
}

export default function DielineLabPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <header className="mb-5">
        <h1 className="font-heading text-2xl font-semibold md:text-3xl">
          Xem trước khuôn bế thùng carton
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Gõ kích thước lòng trong tính bằng mm — bản vẽ khuôn bế trải phẳng (đường cắt / đường cấn /
          đường kích thước) vẽ lại ngay theo thông số D, C, R và độ dày carton.
        </p>
      </header>
      <DielinePreview />
    </section>
  )
}
