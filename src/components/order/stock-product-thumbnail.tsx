import { cn } from '@/lib/utils'
import { getStockProductImage, type OrderItem } from '@/lib/data/order-shared'

export function StockProductThumbnail({
  item,
  size = 'md',
  className,
}: {
  item: OrderItem
  size?: 'sm' | 'md'
  className?: string
}) {
  const imageUrl = getStockProductImage(item)
  if (!imageUrl) return null

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50',
        size === 'sm' ? 'h-12 w-12' : 'h-20 w-20 sm:h-24 sm:w-24',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- product images are managed in Supabase Storage */}
      <img src={imageUrl} alt={item.product_name} className="h-full w-full object-cover" loading="lazy" />
    </div>
  )
}
