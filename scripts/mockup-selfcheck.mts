/**
 * Self-check cho luồng mockup in: hình học vùng in, SVG artwork, size/seed/prompt
 * của ai-box, và quan hệ vị trí in ↔ kiểu thùng.
 * Chạy: npx tsx scripts/mockup-selfcheck.mts
 */
import assert from 'node:assert'

const dieline = await import('../src/lib/dieline/index.ts')
const { printPlacements, fitArtwork } = await import('../src/lib/dieline/print-faces.ts')
const { mockupSizeFromDims, mockupSeed, buildMockupPrompt, mockupEndpoint } = await import('../src/lib/ai/mockup.ts')
const { imageAspectRatio } = await import('../src/lib/images/dimensions.ts')
const { isPrintPositionForBoxStyle, printPositionsForBoxStyle } = await import('../src/lib/config/print-positions.ts')

const { build, toSVG } = dieline

// 1) Vùng in đọc đúng từ parts của engine (D=300 C=200 R=200 t=5, glue mặc định).
const rsc = build({ type: 'rsc', D: 300, C: 200, R: 200, t: 5 })
assert.strictEqual(printPlacements(rsc, '2_main').length, 2, 'rsc 2 mặt chính phải ra 2 rect')
assert.strictEqual(printPlacements(rsc, '4_sides').length, 4, 'rsc 4 mặt phải ra 4 rect')
assert.strictEqual(printPlacements(rsc, '1_top').length, 0, 'rsc không có suất 1 mặt trên')
assert.deepStrictEqual(
  printPlacements(rsc, '2_main').map((r: { w: number }) => r.w),
  [300, 300],
  '2 mặt chính rộng đúng D',
)

const lid = build({ type: 'telescope', D: 300, C: 200, R: 200, t: 5 })
assert.strictEqual(printPlacements(lid, '1_top').length, 1, 'âm dương chỉ 1 mặt nắp')
const mailer = build({ type: 'mailer', D: 300, C: 200, R: 200, t: 5 })
assert.strictEqual(printPlacements(mailer, '1_top').length, 1, 'nắp gài chỉ 1 mặt nắp')
assert.strictEqual(printPlacements(mailer, '2_main').length, 0, 'nắp gài không in mặt bên')

// 2) fitArtwork: nằm trong mặt in, giữ tỷ lệ logo, lề đều.
const face = { x: 10, y: 20, w: 300, h: 200 }
const art = fitArtwork(face, 2)
assert.ok(art.w / art.h > 1.99 && art.w / art.h < 2.01, 'giữ aspect logo')
assert.ok(art.x >= face.x && art.y >= face.y, 'không tràn góc trái-trên')
assert.ok(art.x + art.w <= face.x + face.w && art.y + art.h <= face.y + face.h, 'không tràn cạnh phải-dưới')
assert.strictEqual(art.x - face.x, face.x + face.w - (art.x + art.w), 'lề trái = lề phải')

// 3) SVG: không truyền artwork → output y hệt (dieline-selfcheck vẫn xanh);
//    truyền artwork → đúng số mặt, không lọt ký tự phá markup.
const bare = toSVG(rsc)
assert.ok(!bare.includes('<image'), 'mặc định không có artwork')
assert.strictEqual(toSVG(rsc, {}), bare, 'options rỗng không đổi output')
const withArt = toSVG(rsc, { artwork: { src: 'data:image/png;base64,AAA', rects: printPlacements(rsc, '2_main') } })
assert.strictEqual((withArt.match(/<image /g) ?? []).length, 2, 'mỗi mặt in một <image>')
const evil = toSVG(rsc, { artwork: { src: 'x" onload="alert(1)', rects: [{ x: 0, y: 0, w: 10, h: 10 }] } })
assert.ok(!evil.includes('<image'), 'src nghi vấn bị chặn')

// 4) Kích thước ảnh ra: trong giới hạn px của qwen, chia hết 16, ratio ≤ 8.
for (const dims of [{ length: 20, width: 20, height: 20 }, { length: 120, width: 30, height: 30 }, { length: 40, width: 40, height: 6 }]) {
  const [w, h] = mockupSizeFromDims(dims).split('*').map(Number)
  assert.strictEqual(w % 16, 0)
  assert.strictEqual(h % 16, 0)
  assert.ok(w * h >= 512 * 512 && w * h <= 2048 * 2048, `tổng px ngoài giới hạn: ${w}x${h}`)
  assert.ok(Math.max(w / h, h / w) <= 8, `ratio ngoài giới hạn: ${w}x${h}`)
}

// 5) Seed cố định theo kiểu thùng → style không đổi giữa các lần gen.
assert.strictEqual(mockupSeed('rsc_a1'), mockupSeed('rsc_a1'))
assert.ok(mockupSeed('mailer') !== mockupSeed('rsc_a1'), 'các kiểu thùng phải khác seed')
for (const id of ['rsc_a1', 'am_duong', 'mailer']) {
  const seed = mockupSeed(id)
  assert.ok(Number.isInteger(seed) && seed >= 0 && seed <= 2147483647, `seed ngoài khoảng: ${seed}`)
}

// 6) Prompt: khoá phong cách + nói rõ 2 ảnh, không dùng cụm "bê nguyên ảnh gốc".
const prompt = buildMockupPrompt({ boxStyleLabel: 'RSC box', dimsCm: { length: 40, width: 30, height: 20 }, printPosition: '2_main' })
assert.ok(prompt.includes('Image A') && prompt.includes('Image B'), 'phải nêu 2 ảnh input')
assert.ok(!/keep the subject exactly the same/i.test(prompt), 'cụm này làm model không in logo')
assert.ok(prompt.includes('Pure white') && prompt.includes('kraft'), 'thiếu clause phong cách')
assert.ok(prompt.includes('40 cm long x 30 cm wide x 20 cm high'), 'thiếu kích thước')

// 7) Vị trí in hợp lệ theo kiểu thùng (server enforce cái này).
assert.strictEqual(isPrintPositionForBoxStyle('rsc_a1', '2_main'), true)
assert.strictEqual(isPrintPositionForBoxStyle('rsc_a1', '4_sides'), true)
assert.strictEqual(isPrintPositionForBoxStyle('am_duong', '2_main'), false)
assert.strictEqual(isPrintPositionForBoxStyle('mailer', '1_top'), true)
assert.strictEqual(isPrintPositionForBoxStyle('khong_biet', '2_main'), false)
assert.deepStrictEqual(printPositionsForBoxStyle(undefined), ['2_main', '4_sides'], 'thiếu boxStyleId → mặc định đối khẩu')

// 8) Endpoint: AI_BASE_URL đã chứa /v1 → không được thành /v1/v1.
process.env.AI_BASE_URL = 'https://api.ai-box.vn/v1'
assert.strictEqual(mockupEndpoint(), 'https://api.ai-box.vn/v1/images/edits')
process.env.AI_BASE_URL = 'https://api.ai-box.vn'
assert.strictEqual(mockupEndpoint(), 'https://api.ai-box.vn/v1/images/edits')
process.env.AI_BASE_URL = 'https://api.ai-box.vn/v1/'
assert.strictEqual(mockupEndpoint(), 'https://api.ai-box.vn/v1/images/edits')
delete process.env.AI_BASE_URL

// 9) Đọc kích thước logo từ header (dùng để đặt artwork đúng tỷ lệ).
const png = Buffer.alloc(24)
png.writeUInt32BE(0x89504e47, 0)
png.writeUInt32BE(120, 16)
png.writeUInt32BE(60, 20)
assert.strictEqual(imageAspectRatio(png, 'image/png'), 2, 'PNG aspect sai')
assert.strictEqual(imageAspectRatio(Buffer.from('khong phai anh'), 'image/png'), null, 'header rác phải trả null')

console.log('OK — mockup selfcheck (placements, artwork SVG, size/seed/prompt, positions, endpoint, header parse)')
