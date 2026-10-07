/**
 * Self-check máy trạng thái đơn: các mốc giao hàng mới.
 * Chạy: npx tsx scripts/order-status-selfcheck.mts
 */
import assert from 'node:assert'

const { getStatusMetadata, validateTransition, StatusError } = await import('../src/lib/data/orders-status.ts')
const { ORDER_STATUS_SEQUENCE, getOrderProgress } = await import('../src/lib/data/order-shared.ts')

const order = (status: string) => ({ id: 'o1', customer_id: 'c1', status, updated_at: '2026-10-07T00:00:00Z' }) as any

// 1) Chuỗi trạng thái có mốc "đang giao" nằm giữa sản xuất xong và đã giao.
assert.deepStrictEqual(
  ORDER_STATUS_SEQUENCE.filter((s) => s !== 'cancelled'),
  ['pending', 'staff_review', 'confirmed', 'deposit_paid', 'production', 'completed', 'delivering', 'delivered']
)

// 2) Staff: production → completed → delivering. Không nhảy thẳng completed → delivered.
assert.deepStrictEqual(getStatusMetadata('sales', order('production')).allowedTransitions, ['completed', 'cancelled'])
assert.deepStrictEqual(getStatusMetadata('sales', order('completed')).allowedTransitions, ['delivering'])
assert.deepStrictEqual(getStatusMetadata('sales', order('delivering')).allowedTransitions, ['delivered'])
assert.deepStrictEqual(getStatusMetadata('sales', order('delivered')).allowedTransitions, [])

// 3) Khách: chỉ tự đóng được đơn đang giao; các mốc khác bị chặn 403.
assert.deepStrictEqual(getStatusMetadata('customer', order('delivering')).allowedTransitions, ['delivered'])
assert.strictEqual(getStatusMetadata('customer', order('completed')).allowedTransitions.length, 0)
assert.throws(() => validateTransition('customer', order('completed'), 'delivering'), (e) => e instanceof StatusError && e.status === 403)

// 4) Tiến độ đơn chạy tới 100% ở delivered, không vượt quá.
assert.strictEqual(getOrderProgress('delivered'), 100)
assert.strictEqual(getOrderProgress('completed'), 75)

console.log('✅ order-status-selfcheck passed')
