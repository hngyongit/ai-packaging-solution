import { createClient } from '@/lib/supabase/server'

// Kiểu dáng thùng đọc từ DB (bảng box_styles) — app chạy được cả khi
// chưa push migration nhờ fallback static bên dưới.
export type BoxStyleRecord = {
  id: string
  label: string
  previewUrl: string
  mockupUrl: string
  isActive: boolean
  sortOrder: number
}

// Fallback — khớp seed trong migration để DB trống payload vẫn ổn.
const FALLBACK_BOX_STYLES: BoxStyleRecord[] = [
  {
    id: 'rsc_a1',
    label: 'Thùng carton đối khẩu - RSC / A1',
    previewUrl: 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309841/standard-preview.png',
    mockupUrl: 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309903/standard-mockup.png',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'am_duong',
    label: 'Thùng carton âm dương',
    previewUrl: 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309841/telescoping-preview.png',
    mockupUrl: 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309902/telescoping-mockup.png',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'mailer',
    label: 'Thùng carton nắp gài / Mailer Box',
    previewUrl: 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309841/mailler-preview.png',
    mockupUrl: 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309902/mailler-mockup.png',
    isActive: true,
    sortOrder: 3,
  },
]

export async function getBoxStyles(): Promise<BoxStyleRecord[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('box_styles')
      .select('id, label, preview_url, mockup_url, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    if (!data || data.length === 0) return FALLBACK_BOX_STYLES

    return data.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      previewUrl: String(row.preview_url),
      mockupUrl: String(row.mockup_url),
      isActive: Boolean(row.is_active),
      sortOrder: Number(row.sort_order),
    }))
  } catch {
    // Table chưa tồn tại (migration chưa push) — fallback giữ form chạy.
    return FALLBACK_BOX_STYLES
  }
}

export function getBoxStyleMap(styles: BoxStyleRecord[]): Record<string, BoxStyleRecord> {
  return Object.fromEntries(styles.map((s) => [s.id, s]))
}