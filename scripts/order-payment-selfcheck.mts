/**
 * Self-check cho luật thanh toán: khi nào phải cọc, khi nào được trả qua PayOS,
 * khi nào được vào sản xuất. Chạy: npx tsx scripts/order-payment-selfcheck.mts
 */
import assert from 'node:assert'

const {
  canEnterProduction,
  canPayViaPayOS,
  getOutstandingAmount,
  orderRequiresDeposit,
} = await import('../src/lib/data/order-payment.ts')

const base = {
  payment_method: 'cod',
  payment_status: 'unpaid',
  total_amount: 0,
  deposit_amount: 0,
}

// 1) Đơn nhỏ: không cọc.
assert.strictEqual(orderRequiresDeposit({ total_amount: 4_999_999, deposit_amount: 0 }), false)
assert.strictEqual(getOutstandingAmount({ ...base, total_amount: 4_999_999 }), 0, 'COD nhỏ không thu trước')

// 2) Đơn lớn có cọc: phải thu cọc trước, kể cả COD.
const bigCod = { ...base, total_amount: 10_000_000, deposit_amount: 5_000_000, status: 'confirmed' }
assert.strictEqual(orderRequiresDeposit(bigCod), true)
assert.strictEqual(getOutstandingAmount(bigCod), 5_000_000, 'lần đầu thu đúng phần cọc')
assert.strictEqual(canEnterProduction(bigCod), false, 'chưa cọc thì không được sản xuất')

const bigCodDeposited = { ...bigCod, payment_status: 'deposit_paid' }
assert.strictEqual(getOutstandingAmount(bigCodDeposited), 5_000_000, 'sau cọc còn lại 50%')
assert.strictEqual(canEnterProduction(bigCodDeposited), true, 'cọc xong được sản xuất')
assert.strictEqual(canPayViaPayOS(bigCodDeposited), true, 'còn nợ thì trả tiếp qua PayOS')

// 3) bank_transfer đơn nhỏ: thu toàn bộ, chỉ sau khi chốt giá.
const smallBank = {
  ...base,
  payment_method: 'bank_transfer',
  total_amount: 1_000_000,
  status: 'pending',
}
assert.strictEqual(getOutstandingAmount(smallBank), 1_000_000)
assert.strictEqual(canPayViaPayOS(smallBank), false, 'chưa chốt giá thì không tạo link')

const smallBankConfirmed = { ...smallBank, status: 'confirmed' }
assert.strictEqual(canPayViaPayOS(smallBankConfirmed), true)

// 3b) Chưa xác nhận thì KHÔNG mời trả đồng nào — kể cả tiền cọc, vì cọc tính
// theo % giá cuối mà giá cuối do staff chốt.
assert.strictEqual(canPayViaPayOS({ ...bigCod, status: 'pending' }), false, 'pending: chờ staff xác nhận')
assert.strictEqual(
  canPayViaPayOS({ ...bigCod, status: 'staff_review' }),
  false,
  'staff_review: vẫn đang chờ chốt giá',
)
assert.strictEqual(
  canPayViaPayOS({ ...smallBank, status: 'pending' }),
  false,
  'đơn thường ở pending thì chờ chốt giá',
)

// 3c) Quay lại đơn sau (không trả ngay lúc đặt) — nút phải còn, không phụ thuộc việc vừa đặt.
assert.strictEqual(
  canPayViaPayOS({ ...smallBankConfirmed, status: 'staff_review' }),
  false,
  'staff_review: giá chưa chốt, chưa mời trả',
)
assert.strictEqual(canPayViaPayOS({ ...smallBankConfirmed, status: 'production' }), true, 'đang sản xuất vẫn trả được phần còn lại')
assert.strictEqual(
  canPayViaPayOS({ ...bigCod, status: 'confirmed' }),
  true,
  'đơn cọc đã chốt giá: có nút trả cọc',
)
// Đã cọc rồi nhưng giá CHƯA chốt: phần còn lại phụ thuộc giá cuối, chưa được thu.
assert.strictEqual(
  canPayViaPayOS({ ...bigCodDeposited, status: 'staff_review' }),
  false,
  'đã cọc, giá chưa chốt: chưa mời trả phần còn lại',
)
// Chốt giá xong thì mời trả nốt.
assert.strictEqual(
  canPayViaPayOS({ ...bigCodDeposited, status: 'confirmed' }),
  true,
  'đã cọc + đã chốt giá: nút thanh toán phần còn lại phải hiện',
)

// 4) Đã tất toán: không còn gì để thu, không vào sản xuất lại lần nữa vì lý do tiền.
assert.strictEqual(getOutstandingAmount({ ...bigCodDeposited, payment_status: 'paid' }), 0)
assert.strictEqual(canPayViaPayOS({ ...bigCodDeposited, payment_status: 'paid' }), false)
assert.strictEqual(canEnterProduction({ ...bigCodDeposited, payment_status: 'paid' }), true)

console.log('order-payment self-check: OK')
