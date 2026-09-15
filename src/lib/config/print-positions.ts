// Vị trí in hợp lệ theo kiểu thùng — server enforce, UI chỉ hiển thị option
// nằm trong danh sách này. '1_top' cho thùng âm dương / nắp gài (chỉ có một
// mặt phẳng hướng lên), 2 phương án mặt bên cho thùng đối khẩu.
export type PrintPosition = '2_main' | '4_sides' | '1_top'

export const PRINT_POSITION_LABELS: Record<PrintPosition, string> = {
  '2_main': '2 mặt chính',
  '4_sides': '2 mặt chính + 2 mặt phụ',
  '1_top': '1 mặt trên',
}

export const PRINT_POSITIONS_BY_BOX_STYLE: Record<string, PrintPosition[]> = {
  rsc_a1: ['2_main', '4_sides'],
  am_duong: ['1_top'],
  mailer: ['1_top'],
}

export const PRINT_POSITIONS = Object.keys(PRINT_POSITION_LABELS) as PrintPosition[]

// AI có thể không trả boxStyleId → mặc định thùng đối khẩu, theo lib/ai/types.
export const DEFAULT_BOX_STYLE_ID = 'rsc_a1'

export function printPositionsForBoxStyle(boxStyleId?: string | null): PrintPosition[] {
  return PRINT_POSITIONS_BY_BOX_STYLE[boxStyleId ?? DEFAULT_BOX_STYLE_ID] ?? PRINT_POSITIONS_BY_BOX_STYLE[DEFAULT_BOX_STYLE_ID]
}

export function isPrintPositionForBoxStyle(boxStyleId: string, position: string): position is PrintPosition {
  return (PRINT_POSITIONS_BY_BOX_STYLE[boxStyleId] ?? []).includes(position as PrintPosition)
}

export function printPositionLabel(position: string): string {
  return PRINT_POSITION_LABELS[position as PrintPosition] ?? position
}
