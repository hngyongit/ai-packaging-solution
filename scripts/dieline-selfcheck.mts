/**
 * Self-check: port `src/lib/dieline` phải sinh SVG giống hệt `dieline.js` gốc.
 * Chạy: npx tsx scripts/dieline-selfcheck.mts [path/to/dieline.js]
 * Bỏ qua nếu không tìm thấy file gốc (CI).
 */
import assert from 'node:assert'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const candidates = [
  process.argv[2],
  'C:/Users/hanguyen/Downloads/dieline.js',
  './dieline.js',
].filter(Boolean) as string[]
const path = candidates.find((p) => existsSync(p))
if (!path) {
  console.log('skip: dieline.js not found')
  process.exit(0)
}
const orig = require(path)
const mine = await import('../src/lib/dieline/index.ts')

const inputs = [
  { D: 300, C: 200, R: 200, t: 5 },
  { D: 120, C: 60, R: 80, t: 3, glue: 20, lidGap: 5, lidHeightPct: 50, partGap: 40 },
  { D: 1000, C: 500, R: 500, t: 7 },
]
for (const type of ['rsc', 'telescope', 'mailer']) {
  for (const inp of inputs) {
    const a = orig.toSVG(orig.build({ type, ...inp }))
    const b = mine.toSVG(mine.build({ type, ...inp }))
    assert.strictEqual(b, a, `SVG mismatch ${type} ${JSON.stringify(inp)}`)
  }
}
const m = mine.build({ type: 'mailer', D: '', C: -5, R: 'abc' })
assert.ok(!/NaN/.test(mine.toSVG(m)), 'NaN in output')
assert.strictEqual(m.input.D, 300)
console.log(`OK — SVG byte-identical vs ${path} (3 styles × ${inputs.length} sizes)`)
