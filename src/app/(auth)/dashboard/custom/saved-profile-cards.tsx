'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Package, Trash } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { CustomCartActions } from '@/components/cart/custom-cart-actions'
import { type SavedProductRow } from '@/lib/data/saved-products'
import { formatDimensions } from '@/features/products/utils'

/**
 * Mẫu thùng đã lưu từ phiên tư vấn AI — đối xử như sản phẩm: thêm giỏ hoặc mua
 * ngay. Chưa có mockup plan (tư vấn chưa gen ảnh) thì vẫn bán được, chỉ thiếu ảnh.
 */
export function SavedProfileCards({ profiles }: { profiles: SavedProductRow[] }) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function remove(id: string) {
    setRemovingId(id)
    const response = await fetch(`/api/saved-products/${id}`, { method: 'DELETE' })
    setRemovingId(null)
    if (response.ok) router.refresh()
  }

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-gray-950">Mẫu đã lưu</h2>
      {profiles.length === 0 ? (
        <EmptyState
          title="Chưa lưu mẫu nào"
          description="Nhận tư vấn AI rồi bấm 'Lưu làm mẫu' để lần sau đặt lại chỉ mất một cú click."
          actionHref="/consultation"
          actionLabel="Nhận tư vấn"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => {
            const dims = profile.custom_dimensions
            const mockupUrl = profile.printing_specs?.mockupUrl ?? null
            const priceless = !profile.product_id
            return (
              <Card key={profile.id}>
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950">{profile.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {dims
                          ? `${formatDimensions({ length: dims.length, width: dims.width, height: dims.height })}${dims.layers ? ` · ${dims.layers} lớp` : ''}`
                          : 'Chưa có kích thước'}
                      </p>
                    </div>
                    {mockupUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mockupUrl} alt={profile.name} className="h-14 w-16 shrink-0 rounded-md border border-gray-100 object-cover" loading="lazy" />
                    ) : (
                      <Package className="h-8 w-8 shrink-0 text-gray-300" weight="duotone" />
                    )}
                  </div>

                  {profile.notes && <p className="line-clamp-2 text-xs text-gray-600">{profile.notes}</p>}
                  {priceless && (
                    <p className="text-xs text-amber-700">Mẫu thiếu sản phẩm cơ sở — không tính được giá tạm tính.</p>
                  )}

                  <div className="mt-auto flex items-center gap-2">
                    {priceless ? (
                      <p className="min-w-0 flex-1 text-xs text-amber-700">
                        Thiếu sản phẩm cơ sở — không tính được giá tạm tính.
                      </p>
                    ) : (
                      <CustomCartActions
                        className="min-w-0 flex-1 space-y-2"
                        size="sm"
                        payload={{ kind: 'custom', savedProductId: profile.id }}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removingId === profile.id}
                      onClick={() => void remove(profile.id)}
                      aria-label={`Xoá mẫu ${profile.name}`}
                      className="shrink-0 self-start text-gray-500"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
