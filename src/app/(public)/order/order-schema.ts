import { z } from 'zod'

export const itemSchema = z.object({
  productId: z.string().uuid('Vui lòng chọn sản phẩm carton'),
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1'),
  length: z.coerce.number().positive('Vui lòng nhập chiều dài'),
  width: z.coerce.number().positive('Vui lòng nhập chiều rộng'),
  height: z.coerce.number().positive('Vui lòng nhập chiều cao'),
  layers: z.coerce.number().int().positive().optional(),
  // Kiểu thùng AI chọn (chỉ có qua handoff tư vấn) — khách không nhập tay.
  boxStyleId: z.string().optional(),
  hasPrinting: z.boolean(),
  itemNotes: z.string().trim().max(500).optional(),
})

export const orderSchema = z.object({
  items: z.array(itemSchema).min(1),
  paymentMethod: z.enum(['cod', 'bank_transfer']),
  contactName: z.string().trim().min(1, 'Vui lòng nhập tên liên hệ'),
  contactPhone: z.string().trim().regex(/^\d{10}$/, 'Số điện thoại phải đủ 10 chữ số'),
  contactEmail: z.string().trim().email('Email không hợp lệ'),
  deliveryMethod: z.literal('delivery'),
  deliveryAddress: z.string().trim().optional(),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.deliveryMethod === 'delivery' && (value.deliveryAddress ?? '').trim().length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['deliveryAddress'],
      message: 'Vui lòng nhập địa chỉ giao hàng',
    })
  }
})

export type OrderFormValues = z.infer<typeof orderSchema>

export const emptyItem: OrderFormValues['items'][number] = {
  productId: '',
  quantity: 100,
  length: 30,
  width: 20,
  height: 15,
  layers: 3,
  hasPrinting: false,
  itemNotes: '',
}
