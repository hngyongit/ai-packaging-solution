/**
 * Self-check cho mail thông báo đơn: mỗi mốc trạng thái phải nói đúng bước
 * khách cần làm, không mời thu tiền khi chưa chốt giá.
 * Chạy: npx tsx scripts/order-mail-selfcheck.mts
 */
import assert from 'node:assert'

const { getOrderNextStep, renderOrderEmail } = await import('../src/lib/mail/order-mail.ts')

const base = {
  id: '11111111-1111-4111-8111-111111111111',
  order_code: 'ORD-TEST-0001',
  status: 'confirmed',
  total_amount: 10_000_000,
  deposit_amount: 5_000_000,
  payment_method: 'bank_transfer',
  payment_status: 'unpaid',
  contact_email: 'khach@example.com',
  contact_name: 'Chị Lan',
}

// 1) Đơn phải cọc, đã chốt giá → mời đặt cọc.
assert.strictEqual(getOrderNextStep(base).cta, 'Đặt cọc ngay')

// 2) Đã cọc, đã chốt giá → mời trả phần còn lại.
assert.strictEqual(
  getOrderNextStep({ ...base, payment_status: 'deposit_paid' }).cta,
  'Thanh toán phần còn lại',
)

// 3) COD không cọc → KHÔNG mời trả gì, nói rõ thu hộ khi giao.
const cod = { ...base, payment_method: 'cod', deposit_amount: 0, total_amount: 1_000_000 }
const codStep = getOrderNextStep(cod)
assert.strictEqual(codStep.cta, 'Xem đơn hàng')
assert.ok(codStep.note.includes('thu hộ'), 'đơn COD phải nói rõ thu hộ khi giao')

// 4) COD phải cọc → vẫn mời đặt cọc, kể cả COD.
const codDeposit = { ...cod, total_amount: 10_000_000, deposit_amount: 5_000_000 }
const codDepositStep = getOrderNextStep(codDeposit)
assert.strictEqual(codDepositStep.cta, 'Đặt cọc ngay')
assert.ok(codDepositStep.note.includes('kể cả khi chọn COD'), 'phải nói rõ cọc áp cả COD')

// 5) Đã trả đủ → không mời trả thêm.
assert.strictEqual(getOrderNextStep({ ...base, payment_status: 'paid' }).cta, 'Xem đơn hàng')

// 6) Đơn hủy → không mời trả, dù còn nợ.
const cancelled = getOrderNextStep({ ...base, status: 'cancelled' })
assert.strictEqual(cancelled.cta, 'Xem đơn hàng')
assert.ok(cancelled.note.includes('hủy'), 'đơn hủy phải nói đã hủy')

// 7) Nội dung render: có mã đơn, số tiền, link tới đơn, và KHÔNG có undefined/NaN.
const html = renderOrderEmail(base, 'Đơn hàng đã được xác nhận', 'Nhân viên đã chốt giá.')
assert.ok(html.includes('ORD-TEST-0001'), 'mail phải có mã đơn')
assert.ok(html.includes('5.000.000'), 'mail phải có số tiền cọc')
assert.ok(html.includes(base.id), 'mail phải link tới đúng đơn')
assert.ok(!html.includes('undefined') && !html.includes('NaN'), 'mail không được lọt undefined/NaN')

console.log('order-mail self-check: OK')
