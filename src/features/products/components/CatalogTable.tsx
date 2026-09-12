import { VOLUME_TIERS, VAT_PERCENTAGE } from '@/lib/config/pricing'
import { formatCurrency } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { type CatalogProduct } from '../types'
import {
  formatDimensions,
  formatLayers,
  formatQtyRange,
  getTierUnitPrice,
} from '../utils'

type CatalogTableProps = {
  products: CatalogProduct[]
}

export function CatalogTable({ products }: CatalogTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm nào"
        description="Danh mục sản phẩm đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ với chúng tôi để được tư vấn."
        actionHref="/consultation"
        actionLabel="Nhận tư vấn"
      />
    )
  }

  return (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Đơn giá tham khảo theo số lượng (chưa gồm VAT {VAT_PERCENTAGE}%)
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Mã
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Sản phẩm
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Quy cách
              </th>
              {VOLUME_TIERS.map((tier) => (
                <th
                  key={tier.minQty}
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {formatQtyRange(tier)}
                  {tier.discountPercent > 0 && (
                    <span className="block text-[11px] font-normal normal-case text-emerald-600">
                      -{tier.discountPercent}%
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.map((product) => (
              <tr
                key={product.id}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-500">
                  {product.code}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="line-clamp-1 text-sm text-gray-500">
                      {product.description}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {product.maxDimensions
                    ? `≤ ${formatDimensions(product.maxDimensions)}`
                    : '—'}
                  {' · '}
                  {formatLayers(product.availableLayers)}
                </td>
                {VOLUME_TIERS.map((tier) => (
                  <td
                    key={tier.minQty}
                    className={`whitespace-nowrap px-6 py-4 text-right text-sm ${
                      tier.discountPercent === 0
                        ? 'font-medium text-gray-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(
                      getTierUnitPrice(product.basePrice, tier.discountPercent)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
