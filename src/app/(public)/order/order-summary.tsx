import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

import { type OrderFormValues } from './order-schema'
import { type ProductOption } from './order-types'
import { formatCurrency } from './order-utils'

export function OrderSummary({
  items,
  productById,
  total,
}: {
  items: OrderFormValues['items']
  productById: Map<string, ProductOption>
  total: number
}) {
  return (
    <Card className="rounded-lg border-gray-200">
      <CardHeader>
        <CardTitle>Tóm tắt đơn hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item, index) => {
            const product = productById.get(item.productId)
            const subtotal = (product?.basePrice ?? 0) * Number(item.quantity || 0)

            return (
              <div key={index} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-gray-950">{product?.name ?? `Sản phẩm ${index + 1}`}</p>
                  <p className="text-xs text-gray-500">
                    {Number(item.quantity || 0)} sản phẩm x {formatCurrency(product?.basePrice ?? 0)}
                  </p>
                </div>
                <p className="shrink-0 font-medium text-gray-950">{formatCurrency(subtotal)}</p>
              </div>
            )
          })}
        </div>
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tạm tính</span>
            <span className="font-semibold text-gray-950">{formatCurrency(total)}</span>
          </div>
          <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-950">
            Giá cuối cùng sẽ được server tính và nhân viên xác nhận sau khi duyệt đơn.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
