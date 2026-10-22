import { Info } from '@phosphor-icons/react/dist/ssr'

export function PriceEstimateNotice({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? 'flex gap-1.5 text-xs leading-5 text-gray-500' : 'flex gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-5 text-blue-950'}>
      <Info className={compact ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600' : 'mt-0.5 h-4 w-4 shrink-0 text-blue-700'} aria-hidden="true" />
      <span>
        Giá hiển thị là ước tính. Nếu cần điều chỉnh, chúng tôi sẽ xác nhận với bạn trước khi xử lý đơn và cam kết mức chênh lệch không quá 10%.
      </span>
    </p>
  )
}
