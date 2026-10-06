/**
 * Self-check cho in ấn trong giỏ hàng: shape printing_specs ghi xuống DB, quan hệ
 * vị trí in ↔ kiểu thùng của một dòng giỏ, và đường hand-off sang order_items.
 * Chạy: npx tsx scripts/cart-printing-selfcheck.mts
 */
import assert from 'node:assert'

const { printingSpecSchema, toStoredSpec } = await import('../src/lib/data/cart-printing.ts')
const { buildCheckoutItems } = await import('../src/lib/data/cart.ts')
const { boxStyleIdForCartLine, printPositionLabel, printPositionsForBoxStyle } = await import(
  '../src/lib/config/print-positions.ts'
)
const { getDielineUrl, getPrintPositionLabel } = await import('../src/lib/data/order-shared.ts')

// 1) Schema: payload tối thiểu và payload đầy đủ đều qua; rác thì bị chặn.
assert.strictEqual(printingSpecSchema.safeParse({ hasPrinting: false }).success, true, 'tắt in là payload hợp lệ')
assert.strictEqual(printingSpecSchema.safeParse({ hasPrinting: true, printPosition: '1_top' }).success, true)
assert.strictEqual(printingSpecSchema.safeParse({}).success, false, 'thiếu hasPrinting phải bị chặn')
assert.strictEqual(
  printingSpecSchema.safeParse({ hasPrinting: true, printPosition: '9_faces' }).success,
  false,
  'vị trí in lạ phải bị chặn',
)
assert.strictEqual(
  printingSpecSchema.safeParse({ hasPrinting: true, logoUrl: 'javascript:alert(1)' }).success,
  false,
  'logoUrl không phải URL phải bị chặn',
)

// 2) Shape lưu DB giữ đúng key cũ mà màn đơn hàng/staff đang đọc.
const stored = toStoredSpec({
  hasPrinting: true,
  printPosition: '4_sides',
  logoUrl: 'https://cdn.example.com/logo.png',
  dielineUrl: 'https://cdn.example.com/be.svg',
  dielineName: 'be.svg',
})
assert.strictEqual(stored.printPositionLabel, printPositionLabel('4_sides'), 'nhãn do server suy ra')
assert.strictEqual(stored.printPositionLabel, '2 mặt chính + 2 mặt phụ')
assert.strictEqual(stored.fileUrl, stored.logoUrl, 'fileUrl là bí danh cũ của logoUrl')
assert.deepStrictEqual(getPrintPositionLabel({ printing_specs: stored }), '2 mặt chính + 2 mặt phụ')
assert.strictEqual(getDielineUrl({ printing_specs: stored }), 'https://cdn.example.com/be.svg')

// 3) Tắt in → không ghi rác; buildCheckoutItems phải BỎ in ấn chứ không gửi { hasPrinting: true } rỗng.
assert.deepStrictEqual(toStoredSpec({ hasPrinting: false }), {})
const base = {
  id: 'line-1',
  customer_id: 'c1',
  product_id: 'p1',
  kind: 'stock' as const,
  custom: null,
  saved_product_id: null,
  quantity: 10,
  has_printing: false,
  printing_specs: null,
  product: {
    id: 'p1',
    code: 'CTN-3L-SM',
    name: 'Carton 3L nhỏ',
    description: null,
    category: 'carton-3-layer',
    boxType: 'regular-slotted',
    maxDimensions: { length: 20, width: 15, height: 10 },
    availableLayers: [3],
    basePrice: 3000,
    unit: 'thùng',
    stockQuantity: 100,
    isActive: true,
    imageUrl: null,
  },
}
assert.strictEqual(buildCheckoutItems([base])[0].printingSpecs, undefined, 'không in → không gửi printingSpecs')
const withPrint = buildCheckoutItems([{ ...base, has_printing: true, printing_specs: stored }])[0]
assert.deepStrictEqual(withPrint.printingSpecs, stored, 'có in → spec chảy nguyên sang order_items')

// 4) Kiểu thùng của dòng giỏ: custom mang boxStyleId, hàng kho để undefined → mặc định RSC.
assert.strictEqual(boxStyleIdForCartLine({ kind: 'custom', custom: { boxStyleId: 'mailer' } }), 'mailer')
assert.strictEqual(boxStyleIdForCartLine({ kind: 'custom', custom: {} }), undefined)
assert.strictEqual(boxStyleIdForCartLine({ kind: 'stock', custom: null }), undefined)
assert.deepStrictEqual(printPositionsForBoxStyle(boxStyleIdForCartLine(base)), ['2_main', '4_sides'], 'hàng kho → RSC')
assert.deepStrictEqual(
  printPositionsForBoxStyle(boxStyleIdForCartLine({ kind: 'custom', custom: { boxStyleId: 'am_duong' } })),
  ['1_top'],
  'âm dương chỉ 1 mặt trên',
)

console.log('OK — cart printing selfcheck (schema, shape DB, hand-off đơn, kiểu thùng theo dòng)')
