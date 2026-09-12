import { VOLUME_TIERS } from '@/lib/config/pricing'
import { formatQtyRange } from '../utils'

export function PriceTierCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {VOLUME_TIERS.map((tier) => {
        const isBase = tier.discountPercent === 0
        const isTopTier = tier.maxQty === null
        return (
          <div
            key={tier.minQty}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="text-lg font-semibold text-gray-900">
              {formatQtyRange(tier)}{' '}
              <span className="text-sm font-normal text-gray-500">hộp</span>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isBase
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isBase ? 'Giá gốc' : `Giảm ${tier.discountPercent}%`}
              </span>
            </div>
            {isTopTier && (
              <p className="mt-3 text-xs text-gray-500">
                Số lượng lớn — liên hệ để có giá tốt nhất
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
