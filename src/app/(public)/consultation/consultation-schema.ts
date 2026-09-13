import { z } from 'zod'

import { BOX_STYLES, BOX_STYLE_LABELS } from '@/lib/ai/types'

export { BOX_STYLE_LABELS }
export type { BoxStyle } from '@/lib/ai/types'

// AI decides layers/flute/purchase-input itself — no preferred-layers / flute /
// purchase-frequency input from the customer. Box style optional: khi chọn, AI
// tôn trọng; bỏ trống, AI tự chọn (mặc định RSC/A1).
export const consultationSchema = z
  .object({
    productType: z.string().trim().min(1, 'Vui lòng nhập sản phẩm cần đóng gói').max(200),
    boxStyle: z.enum(BOX_STYLES).optional().describe('Bỏ trống để AI tự chọn kiểu thùng'),
    lengthCm: z.coerce.number({ invalid_type_error: 'Chiều dài không hợp lệ' }).positive('Nhập chiều dài (cm)').max(9999),
    widthCm: z.coerce.number({ invalid_type_error: 'Chiều rộng không hợp lệ' }).positive('Nhập chiều rộng (cm)').max(9999),
    heightCm: z.coerce.number({ invalid_type_error: 'Chiều cao không hợp lệ' }).positive('Nhập chiều cao (cm)').max(9999),
    weightGrams: z.coerce.number({ invalid_type_error: 'Trọng lượng không hợp lệ' }).positive('Nhập trọng lượng (g)').max(999999),
    desiredQuantity: z.coerce.number({ invalid_type_error: 'Số lượng không hợp lệ' }).int().positive('Nhập số lượng thùng').max(1000000),
    hasPrinting: z.boolean(),
    printFaces: z.enum(['2_main', '4_sides']).optional(),
    hasDesignFile: z.boolean().optional(),
    notes: z
      .string()
      .trim()
      .refine((v) => v === '' || v.trim().split(/\s+/).length <= 100, 'Ghi chú tối đa 100 chữ')
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.hasPrinting && !val.printFaces) {
      ctx.addIssue({ path: ['printFaces'], code: 'custom', message: 'Chọn số mặt in' })
    }
  })

export type ConsultationFormValues = z.infer<typeof consultationSchema>

export const consultationToInput = (values: ConsultationFormValues) => ({
  productType: values.productType,
  boxStyle: values.boxStyle,
  lengthCm: values.lengthCm,
  widthCm: values.widthCm,
  heightCm: values.heightCm,
  weightGrams: values.weightGrams,
  desiredQuantity: values.desiredQuantity,
  hasPrinting: values.hasPrinting,
  printFaces: values.hasPrinting ? values.printFaces : undefined,
  hasDesignFile: values.hasPrinting ? values.hasDesignFile : undefined,
  notes: values.notes?.trim() || undefined,
})