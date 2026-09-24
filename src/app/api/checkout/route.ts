import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertStockAvailable, buildCheckoutItems, clearCartItems } from '@/lib/data/cart'
import { getAddressForCheckout } from '@/lib/data/addresses'
import { createOrderWithItems, OrderError } from '@/lib/data/orders-create'
import { getAuthenticatedProfile } from '@/lib/data/profile'

// Checkout từ giỏ hàng: validate tồn kho phía server (hard block) → tạo đơn qua
// cùng createOrderWithItems với /api/orders → xoá các dòng đã đặt.
// Thông tin giao hàng lấy từ customer_addresses theo addressId — không tin text
// gửi lên từ client.

const checkoutSchema = z.object({
  cartItemIds: z.array(z.string().uuid()).min(1, 'Chọn ít nhất một sản phẩm'),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'payos']).default('cod'),
  addressId: z.string().uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const json = await request.json().catch(() => null)
    const parsed = checkoutSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Thông tin đặt hàng chưa hợp lệ', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    const { lines, issues } = await assertStockAvailable(profile.id, body.cartItemIds)
    if (issues.length > 0) {
      return NextResponse.json(
        { error: 'Không đủ tồn kho để đặt hàng', issues },
        { status: 409 }
      )
    }
    if (lines.length !== body.cartItemIds.length) {
      return NextResponse.json({ error: 'Giỏ hàng đã thay đổi, vui lòng tải lại' }, { status: 409 })
    }

    const address = await getAddressForCheckout(profile.id, body.addressId)
    const createdOrder = await createOrderWithItems(
      {
        customerId: profile.id,
        items: buildCheckoutItems(lines),
        paymentMethod: body.paymentMethod,
        contactName: address.recipient_name,
        contactPhone: address.phone,
        contactEmail: address.email,
        deliveryMethod: 'delivery',
        deliveryAddress: address.address,
        notes: body.notes,
      },
      profile
    )

    await clearCartItems(profile.id, body.cartItemIds)

    // Trả về bản rút gọn đủ cho UI thành công + redirect PayOS.
    const order = createdOrder as { id: string; order_code: string; total_amount: number | string | null; payment_method: string | null }
    return NextResponse.json(
      { data: { id: order.id, order_code: order.order_code, total_amount: order.total_amount, payment_method: order.payment_method ?? 'cod' } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout POST error:', error)
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
