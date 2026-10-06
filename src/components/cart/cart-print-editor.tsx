'use client'

import { useState } from 'react'
import { Switch } from '@base-ui/react/switch'
import { Printer } from '@phosphor-icons/react'

import { DielinePicker, LogoPicker, PrintPositionField } from '@/components/consultation/print-mockup-controls'
import { Button } from '@/components/ui/button'
import { boxStyleIdForCartLine, printPositionLabel, printPositionsForBoxStyle } from '@/lib/config/print-positions'
import { type CartLine } from '@/lib/data/cart'

// Bật/tắt in cho MỘT dòng giỏ + form thông số in, xổ ngay dưới dòng đó.
//
// Chỉ THU THẬP thông số — không gọi AI sinh mockup ở đây (mockup chỉ có ở luồng tư
// vấn). File khách tải lên đi thẳng cho xưởng bế/in.
//
// ponytail: chưa sanitize SVG. An toàn vì mọi chỗ hiển thị đều qua <img> (script
// không chạy trong ngữ cảnh đó) — TUYỆT ĐỐI không đưa file này vào
// dangerouslySetInnerHTML như DielinePreview làm với SVG do engine tự sinh.

type SavedSpec = Record<string, unknown>

function readUrl(spec: SavedSpec | null, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = spec?.[key]
    if (typeof value === 'string' && value.startsWith('https://')) return value
  }
  return null
}

export function CartPrintEditor({
  line,
  onSaved,
}: {
  line: CartLine
  onSaved: (hasPrinting: boolean, printingSpecs: SavedSpec | null) => void
}) {
  const spec = line.printing_specs
  const savedLogo = readUrl(spec, 'logoUrl', 'fileUrl')
  const savedDieline = readUrl(spec, 'dielineUrl')
  const savedDielineName = typeof spec?.dielineName === 'string' ? spec.dielineName : null

  const boxStyleId = boxStyleIdForCartLine(line)
  const positions = printPositionsForBoxStyle(boxStyleId)
  const savedPosition = typeof spec?.printPosition === 'string' ? spec.printPosition : ''

  const [on, setOn] = useState(line.has_printing)
  const [position, setPosition] = useState(savedPosition || positions[0])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [dielineFile, setDielineFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const hasLogo = Boolean(logoFile ?? savedLogo)
  const dirty = on !== line.has_printing || position !== savedPosition || Boolean(logoFile || dielineFile)
  const canSave = !busy && (on ? hasLogo : true) && dirty

  async function upload(file: File, purpose: 'logo' | 'dieline'): Promise<string> {
    const form = new FormData()
    form.set('file', file)
    form.set('purpose', purpose)
    const response = await fetch('/api/upload', { method: 'POST', body: form })
    const body = (await response.json().catch(() => null)) as { file?: { url?: string }; error?: string } | null
    if (!response.ok || !body?.file?.url) throw new Error(body?.error ?? 'Không tải được file lên')
    return body.file.url
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      if (!on) {
        const response = await fetch(`/api/cart/${line.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printing: { hasPrinting: false } }),
        })
        if (!response.ok) throw new Error('Không lưu được thông số in')
        onSaved(false, null)
        setLogoFile(null)
        setDielineFile(null)
        return
      }

      // Upload TRƯỚC khi PATCH: đơn chỉ được trỏ tới file đã nằm trên storage.
      const logoUrl = logoFile ? await upload(logoFile, 'logo') : savedLogo
      const dielineUrl = dielineFile ? await upload(dielineFile, 'dieline') : savedDieline

      const next: SavedSpec = {
        hasPrinting: true,
        printPosition: position,
        printPositionLabel: printPositionLabel(position),
        ...(logoUrl ? { logoUrl, fileUrl: logoUrl } : {}),
        ...(dielineUrl ? { dielineUrl } : {}),
        ...(dielineFile ? { dielineName: dielineFile.name } : savedDielineName ? { dielineName: savedDielineName } : {}),
      }
      const response = await fetch(`/api/cart/${line.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printing: {
            hasPrinting: true,
            printPosition: position,
            ...(logoUrl ? { logoUrl } : {}),
            ...(dielineUrl ? { dielineUrl } : {}),
            ...(next.dielineName ? { dielineName: next.dielineName } : {}),
          },
        }),
      })
      if (!response.ok) throw new Error('Không lưu được thông số in')
      onSaved(true, next)
      setLogoFile(null)
      setDielineFile(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Có lỗi khi lưu thông số in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
          {/* Tô màu theo state React thay vì `data-checked:` — repo đang ở Tailwind 3.4,
              shorthand đó là cú pháp v4 nên không sinh CSS (xem RadioGroup để so sánh). */}
          <Switch.Root
            checked={on}
            onCheckedChange={(checked) => setOn(checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
              on ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-gray-200'
            }`}
          >
            <Switch.Thumb
              className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                on ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </Switch.Root>
          <Printer className="h-4 w-4 text-gray-500" />
          In ấn cho dòng này
        </label>
        {line.has_printing && !dirty && <span className="text-xs text-emerald-700">Đã lưu</span>}
      </div>

      {on && (
        <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
          <PrintPositionField boxStyleId={boxStyleId} value={position} onChange={setPosition} />
          <div className="grid gap-3 sm:grid-cols-2">
            <LogoPicker savedUrl={savedLogo} onFile={setLogoFile} />
            <DielinePicker savedUrl={savedDieline} savedName={savedDielineName} onFile={setDielineFile} />
          </div>
          <p className="text-[11px] text-gray-500">
            Logo là ảnh cần in; file khuôn bế SVG do bạn dựng sẵn để xưởng bế và in đúng vị trí. Bản in
            chính thức vẫn được nhân viên kỹ thuật kiểm tra trước khi sản xuất.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" disabled={!canSave} onClick={() => void save()}>
          {busy ? 'Đang lưu...' : 'Lưu thông số in'}
        </Button>
        {on && !hasLogo && <span className="text-xs text-gray-500">Chọn logo trước khi lưu.</span>}
      </div>
    </div>
  )
}
