'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  build,
  toSVG,
  viewBoxOf,
  BOX_STYLE_TO_DIELINE,
  DIELINE_TYPES,
  type DielineKind,
} from '@/lib/dieline'

/**
 * Xem trước khuôn bế (dieline) theo thời gian thực:
 *  - gõ kích thước D/C/R (mm) → render lại ngay
 *  - chọn kiểu thùng (RSC / âm dương / nắp gài)
 *  - zoom bằng thanh trượt, Ctrl+lăn chuột, hoặc kéo chuột để di chuyển
 *  - tải SVG / in PDF đúng tỉ lệ mm
 */

const MM_TO_PX = 96 / 25.4
const MIN_ZOOM = 0.2
const MAX_ZOOM = 8

type NumericKey = 'D' | 'C' | 'R' | 't' | 'glue' | 'lidGap' | 'lidHeightPct' | 'partGap'

const PRIMARY: { key: NumericKey; label: string; hint: string }[] = [
  { key: 'D', label: 'Dài (D)', hint: 'mm' },
  { key: 'C', label: 'Cao (C)', hint: 'mm' },
  { key: 'R', label: 'Rộng (R)', hint: 'mm' },
  { key: 't', label: 'Độ dày (t)', hint: 'mm' },
]

const ADVANCED: { key: NumericKey; label: string; hint: string; only?: DielineKind[] }[] = [
  { key: 'glue', label: 'Biên keo', hint: 'mm', only: ['rsc'] },
  { key: 'lidGap', label: 'Khe hở nắp/đáy', hint: 'mm', only: ['telescope'] },
  { key: 'lidHeightPct', label: 'Cao nắp', hint: '% của C', only: ['telescope'] },
  { key: 'partGap', label: 'Khe 2 mảnh', hint: 'mm', only: ['telescope'] },
]

const EMPTY: Record<NumericKey, string> = {
  D: '300',
  C: '200',
  R: '200',
  t: '5',
  glue: '35',
  lidGap: '3',
  lidHeightPct: '100',
  partGap: '60',
}

export type DielinePreviewProps = {
  /** Kiểu thùng khởi tạo */
  initialType?: DielineKind
  /** id trong `box_styles` (rsc_a1 / am_duong / mailer) — thắng initialType */
  boxStyleId?: string
  /** Kích thước khởi tạo (mm) */
  initialSize?: Partial<Record<NumericKey, string | number>>
  className?: string
}

export function DielinePreview({
  initialType,
  boxStyleId,
  initialSize,
  className,
}: DielinePreviewProps) {
  const [type, setType] = useState<DielineKind>(
    () => (boxStyleId && BOX_STYLE_TO_DIELINE[boxStyleId]) || initialType || 'rsc',
  )
  const [form, setForm] = useState<Record<NumericKey, string>>(() => ({
    ...EMPTY,
    ...Object.fromEntries(
      Object.entries(initialSize ?? {}).map(([k, v]) => [k, v === undefined ? '' : String(v)]),
    ),
  }))
  const [showDims, setShowDims] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const model = useMemo(() => build({ type, ...form }), [type, form])
  const svg = useMemo(
    () => toSVG(model, { dims: showDims, labels: showLabels }),
    [model, showDims, showLabels],
  )
  const vb = useMemo(() => viewBoxOf(model, showDims), [model, showDims])

  /** Giá trị người dùng nhập không hợp lệ (để cảnh báo, engine đã clamp). */
  const warnings = useMemo(() => {
    const bad: string[] = []
    for (const f of [...PRIMARY, ...ADVANCED]) {
      const raw = form[f.key]
      if (raw === '' || raw === undefined) continue
      const v = Number(raw)
      if (!Number.isFinite(v) || v <= 0) bad.push(f.label)
    }
    return bad
  }, [form])

  // ---- viewport: zoom 1 = vừa khung (fit), tính bằng mm để in đúng tỉ lệ ----
  const canvasRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(([{ contentRect }]) =>
      setBox({ w: contentRect.width, h: contentRect.height }),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const clampZoom = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v))
  /** Bề rộng vẽ khi "vừa khung" — kẹp theo cả ngang lẫn dọc. */
  const fitW = Math.max(160, Math.min(box.w - 32, ((box.h - 32) * vb.w) / vb.h))

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // đổi khổ phôi → quay về vừa khung
  useEffect(() => {
    resetView()
  }, [vb.w, vb.h, resetView])

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
  }

  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) })
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const displayW = fitW * zoom

  // ---- tải file ----
  const download = (name: string, text: string, mime: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: mime }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }
  const baseName = `dieline-${model.type}-${model.input.D}x${model.input.C}x${model.input.R}`
  const printSVG = () => {
    const w = window.open('', '_blank', 'width=1024,height=768')
    if (!w) return
    w.document.write(
      `<!doctype html><meta charset="utf-8"><title>${baseName}</title>` +
        `<style>@page{margin:10mm}html,body{margin:0}</style>${svg}`,
    )
    w.document.close()
    w.focus()
    w.print()
  }

  const setValue = (key: NumericKey, v: string) => setForm((f) => ({ ...f, [key]: v }))

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]', className)}>
      {/* ---------------- Bảng nhập ---------------- */}
      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Kiểu thùng</Label>
          <div className="grid gap-1.5">
            {DIELINE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                aria-pressed={type === t.id}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors',
                  type === t.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.code}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            Kích thước lòng trong (mm)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {PRIMARY.map((f) => (
              <NumField
                key={f.key}
                label={f.label}
                unit={f.hint}
                value={form[f.key]}
                onChange={(v) => setValue(f.key, v)}
              />
            ))}
          </div>
          {warnings.length > 0 && (
            <p className="mt-1.5 text-xs text-destructive">
              {warnings.join(', ')}: phải là số &gt; 0 — đang dùng giá trị gần đúng.
            </p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? '− Thu gọn' : '+ Thông số kỹ thuật'}
          </button>
          {showAdvanced && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ADVANCED.filter((f) => !f.only || f.only.includes(type)).map((f) => (
                <NumField
                  key={f.key}
                  label={f.label}
                  unit={f.hint}
                  value={form[f.key]}
                  onChange={(v) => setValue(f.key, v)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <Label className="block text-xs text-muted-foreground">Hiển thị</Label>
          <Toggle checked={showDims} onChange={setShowDims} label="Đường kích thước" />
          <Toggle checked={showLabels} onChange={setShowLabels} label="Nhãn mặt / tag" />
          <div className="flex items-center gap-2 pt-1">
            <span className="w-14 shrink-0 text-xs text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(clampZoom(Number(e.target.value)))}
              className="min-w-0 flex-1 accent-primary"
              aria-label="Phóng to khuôn bế"
            />
            <span className="w-10 shrink-0 text-right font-mono text-xs">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={resetView}>
              Vừa khung
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              title="1 mm trên màn hình = 1 mm giấy thật (cần hiệu chỉnh DPI trình duyệt)"
              onClick={() => setZoom(clampZoom((vb.w * MM_TO_PX) / fitW))}
            >
              1:1
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setZoom((z) => clampZoom(z * 1.25))}>
              To
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setZoom((z) => clampZoom(z / 1.25))}>
              Nhỏ
            </Button>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Ctrl + lăn chuột để phóng, kéo chuột để di chuyển. 100% = vừa khung; file SVG/PDF luôn theo
            mm thật.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => download(`${baseName}.svg`, svg, 'image/svg+xml')}>
            Tải SVG
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={printSVG}>
            In / PDF
          </Button>
        </div>
      </div>

      {/* ---------------- Khung xem trước ---------------- */}
      <div className="space-y-3">
        <div
          ref={canvasRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative h-[clamp(24rem,62vh,44rem)] cursor-grab touch-none overflow-hidden rounded-xl border border-border bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_1px,transparent_1px,transparent_9px)] active:cursor-grabbing"
        >
          <div
            className="absolute left-1/2 top-1/2 will-change-transform"
            style={{
              width: displayW,
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            }}
          >
            <div
              className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:bg-white"
              // SVG sinh từ engine thuần (mm coords), không có input từ người dùng
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>

          <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-white/85 px-2 py-1 text-[11px] font-medium shadow-sm ring-1 ring-black/5">
            {model.name} · khổ trải {Math.round(vb.w)} × {Math.round(vb.h)} mm
          </div>
          <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-1 rounded-md bg-white/85 px-2 py-1.5 text-[11px] shadow-sm ring-1 ring-black/5">
            <LegendLine color="#111827" label="Đường cắt" />
            <LegendLine color="#2563eb" dashed label="Đường cấn" />
            <LegendLine color="#dc2626" label="Kích thước" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <table className="w-full text-xs">
            <tbody>
              {model.specs.map(([label, value]) => (
                <tr key={label} className="border-b border-border/60 last:border-0">
                  <th className="py-1 pr-2 text-left font-normal text-muted-foreground">{label}</th>
                  <td className="py-1 text-right font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs leading-relaxed text-muted-foreground">{model.note}</p>
        </div>
      </div>
    </div>
  )
}

function NumField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">
        {label} <span className="opacity-60">({unit})</span>
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-primary"
      />
      {label}
    </label>
  )
}

function LegendLine({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="18" height="6" aria-hidden>
        <line
          x1="0"
          y1="3"
          x2="18"
          y2="3"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? '4 3' : undefined}
        />
      </svg>
      {label}
    </span>
  )
}
