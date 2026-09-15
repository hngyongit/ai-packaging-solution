/**
 * Đọc kích thước ảnh từ header — đủ để đặt logo đúng tỷ lệ lên khuôn bế mà
 * không cần thêm dependency giải mã ảnh.
 *
 * ponytail: chỉ nhận PNG/JPEG/WEBP/GIF/SVG (đúng định dạng /api/upload cho phép
 * với purpose=logo). Cần hỗ trợ PDF/AI/EPS thì đổi sang dep parse thật.
 */

export function imageAspectRatio(bytes: Buffer, mime: string): number | null {
  const type = mime.toLowerCase()
  if (type.includes('png')) return pngSize(bytes)
  if (type.includes('jpeg') || type.includes('jpg')) return jpegSize(bytes)
  if (type.includes('webp')) return webpSize(bytes)
  if (type.includes('gif')) return gifSize(bytes)
  if (type.includes('svg')) return svgSize(bytes)
  return null
}

function ratio(w: number, h: number): number | null {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
  const r = w / h
  return Math.min(8, Math.max(0.125, r)) // chặn giá trị header hỏng
}

function pngSize(b: Buffer): number | null {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null
  return ratio(b.readUInt32BE(16), b.readUInt32BE(20))
}

function gifSize(b: Buffer): number | null {
  if (b.length < 10) return null
  return ratio(b.readUInt16LE(6), b.readUInt16LE(8))
}

function webpSize(b: Buffer): number | null {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null
  const chunk = b.toString('ascii', 12, 16)
  if (chunk === 'VP8X') return ratio(1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3))
  if (chunk === 'VP8L') {
    const n = b.readUInt32LE(21)
    return ratio(1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff))
  }
  if (chunk === 'VP8 ') {
    // Khung lossy: kích thước ở header frame (offset 26/28, 7-bit).
    return ratio(b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff)
  }
  return null
}

function jpegSize(b: Buffer): number | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++
      continue
    }
    const marker = b[i + 1]
    // SOF0..SOF15 (trừ DHT/AC4..AC7 không phải frame) chứa kích thước.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return ratio(b.readUInt16BE(i + 7), b.readUInt16BE(i + 5))
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2
      continue
    }
    i += 2 + b.readUInt16BE(i + 2) // nhảy qua segment
  }
  return null
}

function svgSize(b: Buffer): number | null {
  const head = b.subarray(0, 4096).toString('utf8')
  const viewBox = /viewBox\s*=\s*["']([^"']+)["']/.exec(head)?.[1]
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4) return ratio(parts[2], parts[3])
  }
  const w = /width\s*=\s*["']([\d.]+)(?:px)?["']/.exec(head)?.[1]
  const h = /height\s*=\s*["']([\d.]+)(?:px)?["']/.exec(head)?.[1]
  return w && h ? ratio(Number(w), Number(h)) : null
}
