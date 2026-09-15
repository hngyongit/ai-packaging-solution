/**
 * Vùng in trên khuôn bế — đọc thẳng từ `model.parts` của engine `src/lib/dieline`,
 * không tính lại hình học để tránh lệch với bản vẽ.
 */

import { type DielineModel } from './index'

export type DielineRect = { x: number; y: number; w: number; h: number }

/** Tên part (khớp `parts[].name` trong engine) ứng với từng vị trí in. */
const FACE_NAMES: Record<string, string[]> = {
  // Thùng đối khẩu: 2 mặt dài = 2 mặt chính; thêm 2 mặt rộng = 2 mặt phụ.
  '2_main': ['Mặt Dài'],
  '4_sides': ['Mặt Dài', 'Mặt Rộng'],
  // Âm dương / nắp gài: chỉ in mặt trên → nắp (dương) của âm dương, NẮP của mailer.
  '1_top': ['NẮP', 'NẮP (dương)'],
}

/**
 * Các rect mặt in (mm) cho vị trí in đã chọn. Bỏ qua part nhỏ (nắp/khe) vì
 * matched name đã đủ đặc hiệu — `Mặt Dài`/`Mặt Rộng` chỉ có ở thân thùng.
 */
export function printPlacements(model: DielineModel, position: string): DielineRect[] {
  const names = FACE_NAMES[position]
  if (!names) return []
  return model.parts
    .filter((p) => names.includes(p.name) && !p.tiny)
    .map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h }))
}

/** Logo đặt giữa mặt in, chừa lề 10% cạnh ngắn — in lụa/decor đều cần vùng an toàn. */
export function fitArtwork(rect: DielineRect, aspect: number): DielineRect {
  const margin = Math.min(rect.w, rect.h) * 0.1
  const box = { x: rect.x + margin, y: rect.y + margin, w: rect.w - 2 * margin, h: rect.h - 2 * margin }
  if (box.w <= 0 || box.h <= 0) return box
  const scale = Math.min(box.w / aspect, box.h)
  const w = scale * aspect
  const h = scale
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h }
}
