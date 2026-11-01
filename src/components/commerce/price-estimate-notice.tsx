import { Info } from '@phosphor-icons/react/dist/ssr'

import { formatCurrency } from '@/lib/utils'

// Giá hiển thị lấy từ products.base_price nên chỉ là tạm tính; xưởng chốt lại
// sau khi xem quy cách thật. Biên độ ±10% để khách thấy ngay con số có thể
// dao động — không phải cam kết giá cuối.
const VARIANCE_PERCENT = 10

function formatRange(total: number) {
  const low = Math.round((total * (100 - VARIANCE_PERCENT)) / 100)
  const high = Math.round((total * (100 + VARIANCE_PERCENT)) / 100)
  return `${formatCurrency(low)} – ${formatCurrency(high)}`
}

export function PriceEstimateNotice({
  compact = false,
  total,
}: {
  compact?: boolean
  /** Thành tiền tạm tính — có thì hiện luôn khoảng giá dự kiến ±10%. */
  total?: number
}) {
  const range = total && total > 0 ? formatRange(total) : null

  return (
    <p className={compact ? 'flex gap-1.5 text-xs leading-5 text-gray-500' : 'flex gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-5 text-blue-950'}>
      <Info className={compact ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600' : 'mt-0.5 h-4 w-4 shrink-0 text-blue-700'} aria-hidden="true" />
      <span>
        Giá hiển thị là tạm tính. Giá chốt với xưởng có thể chênh ±5% đến ±10%
        {range ? (
          <>
            {' '}
            — dự kiến <strong className="font-semibold">{range}</strong>
          </>
        ) : null}
        . Nếu cần điều chỉnh, chúng tôi sẽ xác nhận với bạn trước khi xử lý đơn.
      </span>
    </p>
  )
}
