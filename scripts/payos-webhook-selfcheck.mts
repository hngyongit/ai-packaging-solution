/**
 * Self-check cho nhận diện callback PayOS v2 (payload thật, chép từ log production).
 * Chạy: npx tsx scripts/payos-webhook-selfcheck.mts
 */
import assert from 'node:assert'

const { isPaymentSucceeded } = await import('../src/lib/payos/webhook.ts')

// 1) Callback thật của PayOS v2 — data KHÔNG có `status`, thành công nằm ở envelope.
const v2 = {
  code: '00',
  desc: 'success',
  success: true,
  data: {
    accountNumber: '539177013',
    amount: 15000,
    description: 'Thanh toan ORD202610067',
    reference: 'FT26280522093679',
    transactionDateTime: '2026-10-07 13:52:15',
    counterAccountBankId: '01358001',
    counterAccountName: 'NGUYEN BA PHI HA',
    counterAccountNumber: '00004800431',
    currency: 'VND',
    orderCode: 35590346,
    paymentLinkId: 'a14c60d17e8540ceb15be780c3e2508c',
    code: '00',
    desc: 'success',
  },
}
assert.strictEqual(isPaymentSucceeded(v2, v2.data), true, 'v2 code 00 phải được nhận')
assert.strictEqual(v2.data.transactionId ?? v2.data.reference, 'FT26280522093679', 'mã giao dịch lấy từ reference')

// 2) Giao dịch hỏng: data.code khác "00" → không ghi nhận, dù envelope báo giao được.
assert.strictEqual(
  isPaymentSucceeded({ ...v2, data: { ...v2.data, code: '01', desc: 'failed' } }, { ...v2.data, code: '01' }),
  false
)

// 3) Payload phẳng bản cũ vẫn chạy.
assert.strictEqual(isPaymentSucceeded({ code: '00' }, { code: '00' }), true)
assert.strictEqual(isPaymentSucceeded({}, { status: 'paid' }), true)
assert.strictEqual(isPaymentSucceeded({}, { status: 'cancelled' }), false)

console.log('✅ payos-webhook-selfcheck passed')
