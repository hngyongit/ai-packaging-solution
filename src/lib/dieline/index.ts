/**
 * Dieline engine — sinh khuôn bế (dieline) thùng carton phẳng từ thông số D/C/R.
 * Port từ `dieline.js` (thuần hàm, không DOM): model mm → SVG markup.
 *
 *   D = Dài (mm)  C = Cao (mm)  R = Rộng (mm)  t = độ dày carton (mm)
 */

export type DielineKind = 'rsc' | 'telescope' | 'mailer'

export type DielineInput = {
  type: DielineKind
  /** Dài */ D: number
  /** Cao */ C: number
  /** Rộng */ R: number
  /** Độ dày carton */ t: number
  /** Bề rộng biên keo (RSC) */ glue: number
  /** Khe hở nắp/đáy âm dương, cộng mỗi chiều */ lidGap: number
  /** Chiều cao nắp âm dương, % so với C */ lidHeightPct: number
  /** Khoảng xếp 2 chi tiết rời */ partGap: number
}

export type DielineSeg = { k: 'cut' | 'crease'; d: string }

export type DielinePart = {
  name: string
  x: number
  y: number
  w: number
  h: number
  tag?: string
  small?: boolean
  tiny?: boolean
  noFill?: boolean
}

export type DielineDim = {
  dir: 'h' | 'v'
  a: number
  b: number
  at: number
  from?: number
  text: string
  strong?: boolean
}

export type DielineModel = {
  type: DielineKind
  name: string
  code: string
  input: DielineInput
  /** Khổ trải ngang (mm) */ width: number
  /** Khổ trải dọc (mm) */ height: number
  segs: DielineSeg[]
  parts: DielinePart[]
  dims: DielineDim[]
  specs: [label: string, value: string][]
  note: string
}

export type DielineViewOptions = {
  dims?: boolean
  labels?: boolean
  fill?: boolean
  /**
   * Hình in lên khuôn bế. `src` phải là data URI tự sinh (base64, không chứa
   * ký tự break attribute) — `esc()` chỉ escape & < >.
   */
  artwork?: { src: string; rects: { x: number; y: number; w: number; h: number }[] }
}

/* ------------------------------------------------------------------ *
 * Tiện ích hình học — mọi toạ độ tính bằng mm, trục Y hướng xuống.
 * ------------------------------------------------------------------ */

const n2 = (v: number) => Math.round(v * 100) / 100
const pt = (x: number, y: number) => `${n2(x)} ${n2(y)}`
const L = (x1: number, y1: number, x2: number, y2: number) =>
  `M${pt(x1, y1)} L${pt(x2, y2)}`
const mm = (v: number) => `${n2(v)}`

function poly(...coords: number[]): string {
  const a: string[] = []
  for (let i = 0; i < coords.length; i += 2) a.push(pt(coords[i], coords[i + 1]))
  return `M${a.join(' L')}`
}

const rectPath = (x: number, y: number, w: number, h: number) =>
  poly(x, y, x + w, y, x + w, y + h, x, y + h) + ' Z'

/** Lỗ khoá hình bầu dục (stadium) — khe gài của thùng nắp gài */
function stadium(cx: number, cy: number, len: number, hgt: number): string {
  const r = hgt / 2
  const x1 = cx - len / 2
  const x2 = cx + len / 2
  const y1 = cy - r
  const y2 = cy + r
  return (
    `M${pt(x1 + r, y1)} L${pt(x2 - r, y1)}` +
    ` A${n2(r)} ${n2(r)} 0 0 1 ${pt(x2 - r, y2)}` +
    ` L${pt(x1 + r, y2)}` +
    ` A${n2(r)} ${n2(r)} 0 0 1 ${pt(x1 + r, y1)} Z`
  )
}

export const DIELINE_DEFAULTS: Omit<DielineInput, 'type'> = {
  D: 300,
  C: 200,
  R: 200,
  t: 5,
  glue: 35,
  lidGap: 3,
  lidHeightPct: 100,
  partGap: 60,
}

export const DIELINE_TYPES: { id: DielineKind; name: string; code: string }[] = [
  { id: 'rsc', name: 'Thùng đối khẩu', code: 'RSC — FEFCO 0201' },
  { id: 'telescope', name: 'Thùng âm dương', code: 'Nắp + đáy rời — FEFCO 0300' },
  { id: 'mailer', name: 'Thùng nắp gài', code: 'Mailer — Roll End Tuck Top' },
]

/** Kiểu thùng trong DB (`box_styles.id`) → kiểu dieline */
export const BOX_STYLE_TO_DIELINE: Record<string, DielineKind> = {
  rsc_a1: 'rsc',
  am_duong: 'telescope',
  mailer: 'mailer',
}

type Opts = DielineInput

/** Input thô từ form: số hoặc chuỗi rỗng/sai (engine clamp về default). */
export type DielineInputRaw = {
  type?: DielineKind
} & Partial<Record<'D' | 'C' | 'R' | 't' | 'glue' | 'lidGap' | 'lidHeightPct' | 'partGap', string | number>>

/* ------------------------------------------------------------------ *
 * 1) THÙNG ĐỐI KHẨU (RSC)
 * ------------------------------------------------------------------ */

function buildRSC(o: Opts): Omit<DielineModel, 'type' | 'name' | 'code' | 'input'> {
  const { D, R, C, t } = o
  const G = o.glue
  const F = R / 2 // hai nắp gặp nhau giữa → đối khẩu
  const W = G + 2 * D + 2 * R
  const H = C + 2 * F
  const yT = 0
  const y1 = F
  const y2 = F + C
  const yB = H
  const b = [G, G + D, G + D + R, G + 2 * D + R, W]
  const segs: DielineSeg[] = []
  const parts: DielinePart[] = []

  // Biên keo (vát hai đầu cho dễ dán)
  const tp = Math.min(8, C * 0.08)
  segs.push({ k: 'cut', d: poly(G, y1, 0, y1 + tp, 0, y2 - tp, G, y2) })
  parts.push({ name: 'Biên keo', x: 0, y: y1, w: G, h: C, tag: `${mm(G)} × ${mm(C)}`, small: true })

  const names = ['Mặt Dài', 'Mặt Rộng', 'Mặt Dài', 'Mặt Rộng']
  const wds = [D, R, D, R]
  for (let i = 0; i < 4; i++) {
    const xa = b[i]
    const xb = b[i + 1]
    const li = i === 0 ? 0 : t / 2
    const ri = i === 3 ? 0 : t / 2
    parts.push({ name: names[i], x: xa, y: y1, w: wds[i], h: C, tag: `${mm(wds[i])} × ${mm(C)}` })
    segs.push({ k: 'cut', d: poly(xa + li, y1, xa + li, yT, xb - ri, yT, xb - ri, y1) })
    segs.push({ k: 'cut', d: poly(xa + li, y2, xa + li, yB, xb - ri, yB, xb - ri, y2) })
    parts.push({ name: 'Nắp', x: xa + li, y: yT, w: wds[i] - li - ri, h: F, tag: `${mm(wds[i])} × ${mm(F)}`, small: true })
    parts.push({ name: 'Nắp', x: xa + li, y: y2, w: wds[i] - li - ri, h: F, tag: `${mm(wds[i])} × ${mm(F)}`, small: true })
  }

  segs.push({ k: 'cut', d: L(W, y1, W, y2) })
  for (let i = 0; i < 4; i++) segs.push({ k: 'crease', d: L(b[i], y1, b[i], y2) })
  segs.push({ k: 'crease', d: L(G, y1, W, y1) })
  segs.push({ k: 'crease', d: L(G, y2, W, y2) })

  const u = Math.max(W, H) / 40
  const dims: DielineDim[] = [
    { dir: 'h', a: 0, b: G, at: H + 1.3 * u, from: yB, text: `Keo ${mm(G)}` },
    { dir: 'h', a: b[0], b: b[1], at: H + 1.3 * u, from: yB, text: `D ${mm(D)}` },
    { dir: 'h', a: b[1], b: b[2], at: H + 1.3 * u, from: yB, text: `R ${mm(R)}` },
    { dir: 'h', a: b[2], b: b[3], at: H + 1.3 * u, from: yB, text: `D ${mm(D)}` },
    { dir: 'h', a: b[3], b: b[4], at: H + 1.3 * u, from: yB, text: `R ${mm(R)}` },
    { dir: 'h', a: 0, b: W, at: H + 2.8 * u, from: yB, text: `Khổ trải ${mm(W)}`, strong: true },
    { dir: 'v', a: yT, b: y1, at: -1.3 * u, from: 0, text: `R/2 ${mm(F)}` },
    { dir: 'v', a: y1, b: y2, at: -1.3 * u, from: 0, text: `C ${mm(C)}` },
    { dir: 'v', a: y2, b: yB, at: -1.3 * u, from: 0, text: `R/2 ${mm(F)}` },
    { dir: 'v', a: 0, b: H, at: -2.8 * u, from: 0, text: mm(H), strong: true },
  ]

  return {
    width: W,
    height: H,
    segs,
    parts,
    dims,
    specs: [
      ['Khổ trải', `${mm(W)} × ${mm(H)} mm`],
      ['Chu vi thân', `${mm(2 * D + 2 * R)} mm (2×D + 2×R)`],
      ['Biên keo', `${mm(G)} mm`],
      ['Chiều cao nắp', `${mm(F)} mm (= R/2)`],
      ['Bề rộng khe rãnh', `${mm(t)} mm`],
      ['Diện tích phôi', `${n2((W * H) / 1e6)} m²/thùng`],
      ['Số chi tiết', '1 mảnh'],
    ],
    note: 'Hai nắp trên (và hai nắp dưới) cao bằng R/2 nên khi gấp gặp nhau đúng ở giữa — gọi là đối khẩu. Khe rãnh giữa các nắp rộng bằng độ dày carton.',
  }
}

/* ------------------------------------------------------------------ *
 * 2) THÙNG ÂM DƯƠNG — hai khay rời (đáy "âm" + nắp "dương")
 * ------------------------------------------------------------------ */

function tray(
  ox: number,
  oy: number,
  d: number,
  r: number,
  c: number,
  t: number,
  label: string,
  segs: DielineSeg[],
  parts: DielinePart[],
): void {
  const W = d + 2 * c
  const H = r + 2 * c
  const xL = ox + c
  const xR = ox + c + d
  const yT = oy + c
  const yB = oy + c + r

  segs.push({ k: 'cut', d: rectPath(ox, oy, W, H) })
  segs.push({ k: 'crease', d: L(ox, yT, ox + W, yT) })
  segs.push({ k: 'crease', d: L(ox, yB, ox + W, yB) })
  segs.push({ k: 'crease', d: L(xL, yT, xL, yB) })
  segs.push({ k: 'crease', d: L(xR, yT, xR, yB) })

  // 4 rãnh cắt góc (rộng = độ dày carton), tách tai khỏi thành
  const xs = [xL, xR]
  const ys: [number, number][] = [
    [oy, yT],
    [oy + H, yB],
  ]
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const xc = xs[i]
      const [y0, y1] = ys[j]
      segs.push({ k: 'cut', d: poly(xc - t / 2, y0, xc - t / 2, y1, xc + t / 2, y1, xc + t / 2, y0) })
    }
  }

  parts.push({ name: label, x: xL, y: yT, w: d, h: r, tag: `${mm(d)} × ${mm(r)}` })
  parts.push({ name: 'Thành', x: xL, y: oy, w: d, h: c, tag: `${mm(d)} × ${mm(c)}`, small: true })
  parts.push({ name: 'Thành', x: xL, y: yB, w: d, h: c, tag: `${mm(d)} × ${mm(c)}`, small: true })
  parts.push({ name: 'Thành', x: ox, y: yT, w: c, h: r, tag: `${mm(c)} × ${mm(r)}`, small: true })
  parts.push({ name: 'Thành', x: xR, y: yT, w: c, h: r, tag: `${mm(c)} × ${mm(r)}`, small: true })
  parts.push({ name: 'Tai', x: ox, y: oy, w: c, h: c, small: true, tiny: true })
  parts.push({ name: 'Tai', x: xR, y: oy, w: c, h: c, small: true, tiny: true })
  parts.push({ name: 'Tai', x: ox, y: yB, w: c, h: c, small: true, tiny: true })
  parts.push({ name: 'Tai', x: xR, y: yB, w: c, h: c, small: true, tiny: true })
}

function buildTelescope(o: Opts): Omit<DielineModel, 'type' | 'name' | 'code' | 'input'> {
  const { D, R, C, t } = o
  const gap = o.lidGap
  const dL = D + 2 * t + gap
  const rL = R + 2 * t + gap
  const cL = Math.max(1, (C * o.lidHeightPct) / 100)
  const segs: DielineSeg[] = []
  const parts: DielinePart[] = []

  const hBase = R + 2 * C
  const hLid = rL + 2 * cL
  const H = Math.max(hBase, hLid)
  const wBase = D + 2 * C
  const wLid = dL + 2 * cL
  const x0 = 0
  const x1 = wBase + o.partGap
  const yBase = (H - hBase) / 2
  const yLid = (H - hLid) / 2

  tray(x0, yBase, D, R, C, t, 'ĐÁY (âm)', segs, parts)
  tray(x1, yLid, dL, rL, cL, t, 'NẮP (dương)', segs, parts)

  const W = x1 + wLid
  const u = Math.max(W, H) / 40
  const dims: DielineDim[] = [
    { dir: 'h', a: x0, b: x0 + C, at: yBase + hBase + 1.3 * u, from: yBase + hBase, text: `C ${mm(C)}` },
    { dir: 'h', a: x0 + C, b: x0 + C + D, at: yBase + hBase + 1.3 * u, from: yBase + hBase, text: `D ${mm(D)}` },
    { dir: 'h', a: x0 + C + D, b: x0 + wBase, at: yBase + hBase + 1.3 * u, from: yBase + hBase, text: `C ${mm(C)}` },
    { dir: 'h', a: x0, b: x0 + wBase, at: yBase + hBase + 2.8 * u, from: yBase + hBase, text: mm(wBase), strong: true },
    { dir: 'h', a: x1 + cL, b: x1 + cL + dL, at: yLid + hLid + 1.3 * u, from: yLid + hLid, text: `D+${mm(2 * t + gap)} = ${mm(dL)}` },
    { dir: 'h', a: x1, b: x1 + wLid, at: yLid + hLid + 2.8 * u, from: yLid + hLid, text: mm(wLid), strong: true },
    { dir: 'v', a: yBase, b: yBase + C, at: -1.3 * u, from: x0, text: `C ${mm(C)}` },
    { dir: 'v', a: yBase + C, b: yBase + C + R, at: -1.3 * u, from: x0, text: `R ${mm(R)}` },
    { dir: 'v', a: yBase + C + R, b: yBase + hBase, at: -1.3 * u, from: x0, text: `C ${mm(C)}` },
    { dir: 'v', a: yLid + cL, b: yLid + cL + rL, at: W + 1.3 * u, from: W, text: `R+${mm(2 * t + gap)} = ${mm(rL)}` },
  ]

  return {
    width: W,
    height: H,
    segs,
    parts,
    dims,
    specs: [
      ['Khổ trải (cả 2 mảnh)', `${mm(W)} × ${mm(H)} mm`],
      ['Phôi ĐÁY (âm)', `${mm(wBase)} × ${mm(hBase)} mm`],
      ['Phôi NẮP (dương)', `${mm(wLid)} × ${mm(hLid)} mm`],
      ['Lòng đáy', `${mm(D)} × ${mm(R)} × ${mm(C)} mm`],
      ['Lòng nắp', `${mm(dL)} × ${mm(rL)} × ${mm(cL)} mm`],
      ['Khe hở nắp/đáy', `${mm(2 * t + gap)} mm (2×t + ${mm(gap)})`],
      ['Rãnh cắt góc', `${mm(t)} mm × 8 rãnh`],
      ['Diện tích phôi', `${n2((wBase * hBase + wLid * hLid) / 1e6)} m²/thùng`],
      ['Số chi tiết', '2 mảnh rời'],
    ],
    note: 'Nắp (dương) lớn hơn đáy (âm) 2×độ dày + khe hở để chụp lọt bên ngoài. Bốn tai gấp ở góc dán/ghim vào mặt trong thành thùng.',
  }
}

/* ------------------------------------------------------------------ *
 * 3) THÙNG NẮP GÀI (Mailer / Roll End Tuck Top)
 * ------------------------------------------------------------------ */

function buildMailer(o: Opts): Omit<DielineModel, 'type' | 'name' | 'code' | 'input'> {
  const { D, R, C, t } = o
  const segs: DielineSeg[] = []
  const parts: DielinePart[] = []

  const Ct = Math.max(4, C - t) // nắp gài: hụt 1 lớp giấy
  const Cd = Math.max(4, C - t) // chiều sâu tai nắp
  const Ht = Math.min(12, Math.max(5, C * 0.07)) // cao tai khoá
  const Ci = Math.max(4, C - Ht) // vách trong cuộn — Ci + Ht = C

  const x0 = 0
  const x1 = Ct
  const x2 = Ct + R
  const x3 = x2 + C
  const x4 = x3 + R
  const x5 = x4 + C
  const yTab = 0
  const yIn = Ht
  const yIn2 = Ht + Ci
  const yW = yIn2 + t
  const Y1 = yW + C
  const Y2 = Y1 + D
  const yW2 = Y2 + C
  const yIn3 = yW2 + t
  const yIn4 = yIn3 + Ci
  const yBot = yIn4 + Ht
  const W = x5
  const H = yBot

  /* ĐÁY */
  parts.push({ name: 'ĐÁY', x: x3, y: Y1, w: R, h: D, tag: `${mm(R)} × ${mm(D)}` })
  segs.push({ k: 'crease', d: L(x3, Y1, x3, Y2) })
  segs.push({ k: 'crease', d: L(x4, Y1, x4, Y2) })

  /* Vách hai đầu: ngoài + trong cuộn + tai khoá */
  const Tw = R * 0.185
  const cxs = [x3 + R * 0.3, x3 + R * 0.7]
  const rollEnd = (yOut: number, yIn2_: number, yInA: number, yTabEdge: number, sgn: number) => {
    segs.push({ k: 'cut', d: L(x3, yOut, x3, yInA) })
    segs.push({ k: 'cut', d: L(x4, yOut, x4, yInA) })
    segs.push({ k: 'crease', d: L(x3, yIn2_, x4, yIn2_) })
    segs.push({ k: 'crease', d: L(x3, yIn2_ + sgn * t, x4, yIn2_ + sgn * t) })
    const p = [`M${pt(x3, yInA)}`]
    for (let i = 0; i < 2; i++) {
      p.push(`L${pt(cxs[i] - Tw / 2, yInA)}`)
      p.push(`L${pt(cxs[i] - Tw / 2, yTabEdge)}`)
      p.push(`L${pt(cxs[i] + Tw / 2, yTabEdge)}`)
      p.push(`L${pt(cxs[i] + Tw / 2, yInA)}`)
    }
    p.push(`L${pt(x4, yInA)}`)
    segs.push({ k: 'cut', d: p.join(' ') })
  }
  rollEnd(Y1, yIn2, yIn, yTab, -1)
  rollEnd(Y2, yW2, yIn4, yBot, +1)

  const Hs = Math.max(t * 1.2, Math.min(8, C * 0.05)) // cao khe gài
  for (let i = 0; i < 2; i++) {
    segs.push({ k: 'cut', d: stadium(cxs[i], Y1 + Hs / 2 + 1, Tw, Hs) })
    segs.push({ k: 'cut', d: stadium(cxs[i], Y2 - Hs / 2 - 1, Tw, Hs) })
  }
  parts.push({ name: 'Vách ngoài', x: x3, y: yW, w: R, h: C, tag: `${mm(R)} × ${mm(C)}`, small: true })
  parts.push({ name: 'Vách ngoài', x: x3, y: Y2, w: R, h: C, tag: `${mm(R)} × ${mm(C)}`, small: true })
  parts.push({ name: 'Vách trong', x: x3, y: yIn, w: R, h: Ci, tag: `${mm(R)} × ${mm(Ci)}`, small: true })
  parts.push({ name: 'Vách trong', x: x3, y: yIn3, w: R, h: Ci, tag: `${mm(R)} × ${mm(Ci)}`, small: true })

  /* Thành sau + 2 cánh dán góc */
  parts.push({ name: 'Thành sau', x: x2, y: Y1, w: C, h: D, tag: `${mm(C)} × ${mm(D)}`, small: true })
  segs.push({ k: 'crease', d: L(x2, Y1, x2, Y2) })
  segs.push({ k: 'cut', d: poly(x2, Y1, x2, Y1 - C, x3 - t, Y1 - C, x3 - t, Y1) })
  segs.push({ k: 'cut', d: poly(x2, Y2, x2, Y2 + C, x3 - t, Y2 + C, x3 - t, Y2) })
  parts.push({ name: 'Cánh dán', x: x2, y: Y1 - C, w: C - t, h: C, small: true, tiny: true })
  parts.push({ name: 'Cánh dán', x: x2, y: Y2, w: C - t, h: C, small: true, tiny: true })

  /* Thành trước + 2 cánh dán góc */
  parts.push({ name: 'Thành trước', x: x4, y: Y1, w: C, h: D, tag: `${mm(C)} × ${mm(D)}`, small: true })
  segs.push({ k: 'cut', d: L(x5, Y1, x5, Y2) })
  segs.push({ k: 'cut', d: poly(x4 + t, Y1, x4 + t, Y1 - C, x5, Y1 - C, x5, Y1) })
  segs.push({ k: 'cut', d: poly(x4 + t, Y2, x4 + t, Y2 + C, x5, Y2 + C, x5, Y2) })
  parts.push({ name: 'Cánh dán', x: x4 + t, y: Y1 - C, w: C - t, h: C, small: true, tiny: true })
  parts.push({ name: 'Cánh dán', x: x4 + t, y: Y2, w: C - t, h: C, small: true, tiny: true })

  /* NẮP + tai nắp bo góc */
  parts.push({ name: 'NẮP', x: x1, y: Y1, w: R, h: D, tag: `${mm(R)} × ${mm(D)}` })
  segs.push({ k: 'crease', d: L(x1, Y1, x1, Y2) })
  const lidFlap = (yEdge: number, sgn: number) => {
    const ins = Math.min(Cd * 0.36, R * 0.13)
    const rr = Math.min(Cd * 0.32, R * 0.16)
    const yo = yEdge + sgn * Cd
    return (
      `M${pt(x1, yEdge)} L${pt(x1 + ins, yo - sgn * rr)}` +
      ` Q${pt(x1 + ins, yo)} ${pt(x1 + ins + rr, yo)} L${pt(x2 - ins - rr, yo)}` +
      ` Q${pt(x2 - ins, yo)} ${pt(x2 - ins, yo - sgn * rr)} L${pt(x2, yEdge)}`
    )
  }
  segs.push({ k: 'cut', d: lidFlap(Y1, -1) })
  segs.push({ k: 'cut', d: lidFlap(Y2, +1) })
  parts.push({ name: 'Tai nắp', x: x1, y: Y1 - Cd, w: R, h: Cd, small: true, tiny: true, noFill: true })
  parts.push({ name: 'Tai nắp', x: x1, y: Y2, w: R, h: Cd, small: true, tiny: true, noFill: true })

  /* Nắp gài + tai khoá ma sát */
  parts.push({ name: 'Nắp gài', x: x0, y: Y1, w: Ct, h: D, tag: `${mm(Ct)} × ${mm(D)}`, small: true })
  segs.push({ k: 'cut', d: L(x0, Y1, x0, Y2) })
  const tuckEar = (yEdge: number, sgn: number) => {
    const w = Ct
    const yo = yEdge + sgn * Cd
    const rs = Math.min(Cd * 0.22, w * 0.3)
    return (
      `M${pt(x0, yEdge)} C${pt(x0, yEdge + sgn * Cd * 0.85)} ${pt(x0 + w * 0.28, yo)} ${pt(x0 + w * 0.62, yo)}` +
      ` L${pt(x1 - rs, yo)} Q${pt(x1, yo)} ${pt(x1, yo - sgn * rs)} L${pt(x1, yEdge)}`
    )
  }
  segs.push({ k: 'cut', d: tuckEar(Y1, -1) })
  segs.push({ k: 'cut', d: tuckEar(Y2, +1) })

  segs.push({ k: 'crease', d: L(x0, Y1, x5, Y1) })
  segs.push({ k: 'crease', d: L(x0, Y2, x5, Y2) })

  const u = Math.max(W, H) / 40
  const dims: DielineDim[] = [
    { dir: 'h', a: x0, b: x1, at: H + 1.3 * u, from: H, text: mm(Ct) },
    { dir: 'h', a: x1, b: x2, at: H + 1.3 * u, from: H, text: `R ${mm(R)}` },
    { dir: 'h', a: x2, b: x3, at: H + 1.3 * u, from: H, text: `C ${mm(C)}` },
    { dir: 'h', a: x3, b: x4, at: H + 1.3 * u, from: H, text: `R ${mm(R)}` },
    { dir: 'h', a: x4, b: x5, at: H + 1.3 * u, from: H, text: `C ${mm(C)}` },
    { dir: 'h', a: 0, b: W, at: H + 2.8 * u, from: H, text: `Khổ trải ${mm(W)}`, strong: true },
    { dir: 'v', a: yW, b: Y1, at: -1.3 * u, from: 0, text: `C ${mm(C)}` },
    { dir: 'v', a: Y1, b: Y2, at: -1.3 * u, from: 0, text: `D ${mm(D)}` },
    { dir: 'v', a: Y2, b: yW2, at: -1.3 * u, from: 0, text: `C ${mm(C)}` },
    { dir: 'v', a: 0, b: H, at: -2.8 * u, from: 0, text: mm(H), strong: true },
  ]

  return {
    width: W,
    height: H,
    segs,
    parts,
    dims,
    specs: [
      ['Khổ trải', `${mm(W)} × ${mm(H)} mm`],
      ['Đáy', `${mm(R)} × ${mm(D)} mm`],
      ['Nắp', `${mm(R)} × ${mm(D)} mm`],
      ['Vách trong (cuộn)', `${mm(R)} × ${mm(Ci)} mm`],
      ['Tai khoá', `${mm(n2(Tw))} × ${mm(Ht)} mm × 4 tai`],
      ['Nắp gài', `${mm(Ct)} × ${mm(D)} mm`],
      ['Khe gài', `${mm(n2(Tw))} × ${mm(n2(Hs))} mm × 4 khe`],
      ['Cấn kép vách cuộn', `cách nhau ${mm(t)} mm`],
      ['Diện tích phôi', `${n2((W * H) / 1e6)} m²/thùng`],
      ['Số chi tiết', '1 mảnh'],
    ],
    note: 'Vách hai đầu cuộn vào trong (cấn kép cách nhau đúng 1 độ dày carton), tai khoá cài xuống 4 khe trên đáy nên không cần keo. Nắp gài lùa vào sau thành trước, hai tai bo tròn giữ nắp bằng ma sát.',
  }
}

/* ------------------------------------------------------------------ *
 * Bộ dựng model
 * ------------------------------------------------------------------ */

const BUILDERS = { rsc: buildRSC, telescope: buildTelescope, mailer: buildMailer }

const NUMERIC_KEYS: (keyof Omit<DielineInput, 'type'>)[] = [
  'D',
  'C',
  'R',
  't',
  'glue',
  'lidGap',
  'lidHeightPct',
  'partGap',
]

/** opts accepts partial / string values (form inputs) — invalid → default. */
export function normalizeInput(opts: DielineInputRaw = {}): Opts {
  const out: Opts = { ...DIELINE_DEFAULTS, type: opts.type ?? 'rsc' }
  for (const key of NUMERIC_KEYS) {
    const raw = opts[key]
    const v = Number(raw)
    out[key] =
      raw === undefined || raw === null || raw === '' || !Number.isFinite(v)
        ? DIELINE_DEFAULTS[key]
        : Math.max(0.1, v)
  }
  return out
}

export function build(opts: DielineInputRaw = {}): DielineModel {
  const o = normalizeInput(opts)
  const meta = DIELINE_TYPES.find((x) => x.id === o.type) ?? DIELINE_TYPES[0]
  const fn = BUILDERS[o.type] ?? BUILDERS.rsc
  return { ...fn(o), type: o.type, name: meta.name, code: meta.code, input: o }
}

/* ------------------------------------------------------------------ *
 * Xuất SVG (kích thước thật tính bằng mm → in/duổi được)
 * ------------------------------------------------------------------ */

const STYLE = {
  cut: { stroke: '#111827', w: 1.0 },
  crease: { stroke: '#2563eb', w: 0.82, dash: [5.0, 3.2] },
  dim: { stroke: '#dc2626', w: 0.52 },
}

const esc = (s: unknown) =>
  String(s).replace(/&/g, '&amp;').replace(/</, '&lt;').replace(/>/g, '&gt;')

export function toSVG(m: DielineModel, opt: DielineViewOptions = {}): string {
  const showDims = opt.dims !== false
  const showLabels = opt.labels !== false
  const u = Math.max(m.width, m.height) / 40
  const pad = showDims ? 4.4 * u : 1.2 * u
  const vx = -pad
  const vy = -pad
  const vw = m.width + 2 * pad
  const vh = m.height + 2 * pad
  const sw = Math.max(m.width, m.height) / 800 // nét vẽ tỉ lệ theo khổ trải
  const out: string[] = []

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[n2(vx), n2(vy), n2(vw), n2(vh)].join(' ')}" ` +
      `width="${n2(vw)}mm" height="${n2(vh)}mm" ` +
      `preserveAspectRatio="xMidYMid meet" font-family="ui-sans-serif,system-ui,Arial,sans-serif">`,
  )
  out.push(`<title>${esc(`${m.name} — ${m.input.D}×${m.input.C}×${m.input.R} mm`)}</title>`)

  if (opt.fill !== false) {
    out.push('<g fill="#0f172a" fill-opacity="0.035" stroke="none">')
    for (const p of m.parts) {
      if (p.noFill) continue
      out.push(`<rect x="${n2(p.x)}" y="${n2(p.y)}" width="${n2(p.w)}" height="${n2(p.h)}"/>`)
    }
    out.push('</g>')
  }

  // Hình in nằm DƯỚI nét cắt/cấn nhưng TRÊN lớp tô — khuôn bế vẫn đọc được,
  // artwork không đè lên đường dao.
  if (opt.artwork && opt.artwork.rects.length > 0) {
    if (!/[<>"'\s]/.test(opt.artwork.src)) {
      out.push('<g>')
      for (const r of opt.artwork.rects) {
        out.push(
          `<image href="${opt.artwork.src}" x="${n2(r.x)}" y="${n2(r.y)}" ` +
            `width="${n2(r.w)}" height="${n2(r.h)}" preserveAspectRatio="xMidYMid meet"/>`,
        )
      }
      out.push('</g>')
    }
  }

  out.push(
    `<g fill="none" stroke="${STYLE.crease.stroke}" stroke-width="${n2(STYLE.crease.w * sw)}" ` +
      `stroke-dasharray="${STYLE.crease.dash.map((v) => n2(v * sw)).join(' ')}" stroke-linecap="round">`,
  )
  for (const s of m.segs) if (s.k === 'crease') out.push(`<path d="${s.d}"/>`)
  out.push('</g>')

  out.push(
    `<g fill="none" stroke="${STYLE.cut.stroke}" stroke-width="${n2(STYLE.cut.w * sw)}" ` +
      `stroke-linejoin="round" stroke-linecap="round">`,
  )
  for (const s of m.segs) if (s.k === 'cut') out.push(`<path d="${s.d}"/>`)
  out.push('</g>')

  if (showLabels) {
    const fs = Math.max(m.width, m.height) / 55
    out.push('<g text-anchor="middle" fill="#0f172a">')
    for (const p of m.parts) {
      let f = p.small ? fs * 0.72 : fs
      if (p.tiny) f = fs * 0.6
      const lo = Math.min(p.w, p.h)
      const hi = Math.max(p.w, p.h)
      if (lo < f * 1.4 || hi < f * 2.6) continue
      const cx = p.x + p.w / 2
      const cy = p.y + p.h / 2
      const rot = p.h > p.w * 1.5 && p.w < f * 5.2
      const room = rot ? p.w : p.h
      const two = !!p.tag && room > f * 3.2
      const txt = (dy: number, size: number, weight: number, op: number, s2: string) => {
        const tr = rot
          ? `translate(${n2(cx - dy)},${n2(cy)}) rotate(-90)`
          : `translate(${n2(cx)},${n2(cy + dy)})`
        out.push(
          `<text transform="${tr}" font-size="${n2(size)}" font-weight="${weight}" fill-opacity="${op}">${esc(s2)}</text>`,
        )
      }
      txt(two ? -f * 0.15 : f * 0.35, f, p.small ? 500 : 700, p.small ? 0.62 : 0.82, p.name)
      if (two) txt(f * 1.05, f * 0.72, 400, 0.45, p.tag as string)
    }
    out.push('</g>')
  }

  if (showDims) {
    const df = u * 0.66
    const tick = u * 0.2
    out.push(
      `<g stroke="${STYLE.dim.stroke}" stroke-width="${n2(STYLE.dim.w * sw)}" fill="none">`,
    )
    for (const d of m.dims) {
      if (d.dir === 'h') {
        out.push(`<path d="${L(d.a, d.at, d.b, d.at)}"/>`)
        out.push(`<path d="${L(d.a, d.at - tick, d.a, d.at + tick)}"/>`)
        out.push(`<path d="${L(d.b, d.at - tick, d.b, d.at + tick)}"/>`)
      } else {
        out.push(`<path d="${L(d.at, d.a, d.at, d.b)}"/>`)
        out.push(`<path d="${L(d.at - tick, d.a, d.at + tick, d.a)}"/>`)
        out.push(`<path d="${L(d.at - tick, d.b, d.at + tick, d.b)}"/>`)
      }
      if (d.from !== undefined) {
        if (d.dir === 'h') {
          out.push(`<path stroke-opacity="0.35" d="${L(d.a, d.from, d.a, d.at)}"/>`)
          out.push(`<path stroke-opacity="0.35" d="${L(d.b, d.from, d.b, d.at)}"/>`)
        } else {
          out.push(`<path stroke-opacity="0.35" d="${L(d.from, d.a, d.at, d.a)}"/>`)
          out.push(`<path stroke-opacity="0.35" d="${L(d.from, d.b, d.at, d.b)}"/>`)
        }
      }
    }
    out.push('</g>')
    out.push(`<g fill="${STYLE.dim.stroke}" text-anchor="middle">`)
    for (const d of m.dims) {
      const f = df * (d.strong ? 1.12 : 1)
      out.push(
        d.dir === 'h'
          ? `<text x="${n2((d.a + d.b) / 2)}" y="${n2(d.at - f * 0.45)}" font-size="${n2(f)}" font-weight="${d.strong ? 700 : 500}">${esc(d.text)}</text>`
          : `<text transform="translate(${n2(d.at - f * 0.45)},${n2((d.a + d.b) / 2)}) rotate(-90)" font-size="${n2(f)}" font-weight="${d.strong ? 700 : 500}">${esc(d.text)}</text>`,
      )
    }
    out.push('</g>')
  }

  out.push('</svg>')
  return out.join('\n')
}

/** Khổ viewBox (mm) của `toSVG` — cần cho zoom/display ở UI. */
export function viewBoxOf(m: DielineModel, showDims = true) {
  const u = Math.max(m.width, m.height) / 40
  const pad = showDims ? 4.4 * u : 1.2 * u
  return { x: -pad, y: -pad, w: m.width + 2 * pad, h: m.height + 2 * pad }
}

/** build + render một lần */
export function render(opts: DielineInputRaw, view: DielineViewOptions = {}) {
  const model = build(opts)
  return { model, svg: toSVG(model, view) }
}
