import Link from 'next/link'

import { getConsultation } from '@/lib/data/consultations'

import { ConsultationResult } from '../consultation-result'

export const dynamic = 'force-dynamic'

export default async function ConsultationResultPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const { id } = searchParams
  if (!id) return <ErrorCard message="Thiếu mã tư vấn." />

  let consultation = null
  try {
    consultation = await getConsultation(id)
  } catch {
    consultation = null
  }
  if (!consultation?.ai_recommendation) {
    return <ErrorCard message="Không tìm thấy kết quả tư vấn. Vui lòng thử lại." />
  }

  return (
    <ConsultationResult
      recommendation={consultation.ai_recommendation}
      consultationId={consultation.id}
      hasPrinting={Boolean(consultation.has_printing)}
      initialMockup={{
        logoUrl: consultation.logo_url,
        mockupUrl: consultation.mockup_url ?? null,
        dielineUrl: consultation.dieline_url ?? null,
      }}
    />
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <section className="flex flex-col items-center justify-center bg-gray-50 py-24">
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">Không hiển thị được</h1>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      <Link
        href="/consultation"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Bắt đầu tư vấn lại
      </Link>
    </section>
  )
}