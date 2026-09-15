import { getDielineUrl, getMockupUrl, getPrintPositionLabel, type OrderItem } from '@/lib/data/order-shared'

/**
 * Thumbnail ảnh mockup AI + khuôn bế có hình in của một dòng đơn hàng.
 * next/image không dùng được (next.config.mjs chỉ whitelist picsum) → <img> raw.
 */
export function PrintPreviewStrip({ item, size = 'sm' }: { item: OrderItem; size?: 'sm' | 'md' }) {
  const mockupUrl = getMockupUrl(item)
  const dielineUrl = getDielineUrl(item)
  if (!mockupUrl && !dielineUrl) return null

  const positionLabel = getPrintPositionLabel(item)
  const box = size === 'md' ? 'h-24 w-24' : 'h-16 w-16'

  return (
    <div className="flex shrink-0 items-start gap-2">
      {mockupUrl && <Thumb url={mockupUrl} label="Mockup in" box={box} />}
      {dielineUrl && <Thumb url={dielineUrl} label="Khuôn bế" box={box} />}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-700">In ấn</p>
        {positionLabel ? <p className="text-xs text-gray-500">{positionLabel}</p> : null}
      </div>
    </div>
  )
}

function Thumb({ url, label, box }: { url: string; label: string; box: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" title={`Mở ${label}`} className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        loading="lazy"
        className={`${box} rounded-md border border-gray-200 bg-white object-contain p-1 transition hover:border-blue-400`}
      />
    </a>
  )
}
