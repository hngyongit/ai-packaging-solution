'use client'

// Design Read: kết quả tư vấn B2B cho chủ xưởng — việc chính là "logo của tôi lên
// thùng sẽ ra sao", nên ảnh kết quả to, control nhỏ. blue-600 + card gray-200,
// không hiệu ứng thừa. DENSITY 4 / MOTION 2 / VARIANCE 3.

import { useState } from 'react'
import { Sparkle, WarningCircle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { printPositionsForBoxStyle } from '@/lib/config/print-positions'
import { LogoPicker, MockupPreview, PrintPositionField } from './print-mockup-controls'

export type MockupAssets = {
  logoUrl: string | null
  mockupUrl: string | null
  dielineUrl: string | null
}

export type MockupStatus = 'idle' | 'loading' | 'error' | 'ready' | 'unavailable'

export const EMPTY_MOCKUP: MockupAssets = { logoUrl: null, mockupUrl: null, dielineUrl: null }

export function PrintMockupPanel({
  consultationId,
  boxStyleId,
  initial = EMPTY_MOCKUP,
  onAssetsChange,
}: {
  consultationId: string
  boxStyleId?: string
  initial?: MockupAssets
  onAssetsChange?: (assets: MockupAssets, status: MockupStatus) => void
}) {
  const [position, setPosition] = useState<string>(() => printPositionsForBoxStyle(boxStyleId)[0])
  const [assets, setAssets] = useState<MockupAssets>(initial)
  const [status, setStatus] = useState<MockupStatus>(initial.mockupUrl ? 'ready' : 'idle')
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const loading = status === 'loading'
  const hasLogo = Boolean(logoFile ?? assets.logoUrl)

  async function generate() {
    const form = new FormData()
    form.set('consultationId', consultationId)
    if (position) form.set('printPosition', position)
    if (logoFile) form.set('file', logoFile)
    else if (assets.logoUrl) form.set('logoUrl', assets.logoUrl)
    else return

    setStatus('loading')
    setError('')
    try {
      const response = await fetch('/api/ai/mockup', { method: 'POST', body: form })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        // 503 = AI/Cloudinary chưa cấu hình (dev) → đừng chặn khách đặt hàng.
        const next = response.status === 503 ? 'unavailable' : 'error'
        setStatus(next)
        setError(data?.error ?? 'Không tạo được mockup')
        // AI fail nhưng khuôn bế đã lưu → vẫn hiện lại được, khách không mất trắng.
        const partial: MockupAssets =
          data?.dielineUrl ? { ...assets, dielineUrl: data.dielineUrl, logoUrl: data.logoUrl ?? assets.logoUrl } : assets
        if (data?.dielineUrl) setAssets(partial)
        onAssetsChange?.(partial, next)
        return
      }
      const next: MockupAssets = {
        logoUrl: data.logoUrl ?? assets.logoUrl,
        mockupUrl: data.mockupUrl,
        dielineUrl: data.dielineUrl,
      }
      setAssets(next)
      setLogoFile(null)
      setStatus('ready')
      onAssetsChange?.(next, 'ready')
    } catch {
      setStatus('error')
      setError('Mất kết nối tới server. Vui lòng thử lại.')
      onAssetsChange?.(assets, 'error')
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-3">
      <PrintPositionField boxStyleId={boxStyleId} value={position} onChange={setPosition} />

      {/* key để sau khi gen xong, ô logo hiển thị ảnh đã lưu trên server thay vì blob local */}
      <LogoPicker key={assets.mockupUrl ?? 'new'} savedUrl={assets.logoUrl} onFile={setLogoFile} />

      {loading && <div className="h-44 animate-pulse rounded-lg bg-gray-200" />}

      {!loading && status !== 'unavailable' && (assets.mockupUrl || assets.dielineUrl) && (
        <div className="grid grid-cols-2 gap-2">
          <MockupPreview label="Mockup in" url={assets.mockupUrl} />
          <MockupPreview label="Khuôn bế" url={assets.dielineUrl} />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="flex items-start gap-1.5 text-xs text-red-700">
            <WarningCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" weight="fill" />
            {error}
          </p>
        </div>
      )}

      <Button size="sm" className="w-full" onClick={generate} disabled={loading || !hasLogo}>
        {loading ? (
          'Đang tạo mockup...'
        ) : (
          <>
            <Sparkle className="h-4 w-4" weight="fill" />
            {assets.mockupUrl ? 'Tạo lại mockup' : 'Tạo ảnh mockup'}
          </>
        )}
      </Button>
      <p className="text-[11px] text-gray-400">
        Ảnh minh hoạ theo tỷ lệ thùng AI khuyến nghị — bản in thật theo file khuôn bế của xưởng.
      </p>
    </div>
  )
}
