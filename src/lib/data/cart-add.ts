import { customFromConsultation, customFromSaved, customSpecSchema, type CustomCartItem } from './custom-spec'
import { getConsultation } from './consultations'
import { listSavedProducts } from './saved-products'
import { OrderError } from './orders-create'
import { upsertCartItem } from './cart'
import { getCartProductById } from './products'

// Điều phối "thêm vào giỏ" cho cả hai loại dòng. Route handler /api/cart mỏng để
// còn dưới 80 dòng; mọi nhánh resolve spec ở đây.
//
// Custom line bắt buộc có product_id (NOT NULL ở DB) — nó là NEO GIÁ, không phải
// quy cách. product_id lấy từ: consultation.ai_suggested_product_id /
// saved_products.product_id, hoặc client gửi lên khi tự nhập.

export type AddToCartRequest = {
  customerId: string
  productId?: string
  quantity?: number
  hasPrinting?: boolean
  printingSpecs?: Record<string, unknown> | null
  /** hàng kho (mặc định) hoặc theo yêu cầu */
  kind?: 'stock' | 'custom'
  /** thêm từ một buổi tư vấn đã có */
  consultationId?: string
  /** thêm từ mẫu đã lưu */
  savedProductId?: string
  /** spec tự nhập (tab "Sản phẩm theo yêu cầu") */
  custom?: unknown
}

/** Neo giá phải là sản phẩm đang bán — không cho tự do uuid. */
async function assertAnchor(productId: string) {
  const product = await getCartProductById(productId)
  if (!product || !product.isActive) throw new OrderError('Không tìm thấy sản phẩm', 404)
  return product
}

async function fromConsultation(input: AddToCartRequest): Promise<CustomCartItem> {
  const consultation = await getConsultation(input.consultationId ?? '')
  if (!consultation) throw new OrderError('Không tìm thấy tư vấn', 404)
  if (consultation.customer_id && consultation.customer_id !== input.customerId) {
    throw new OrderError('Forbidden', 403)
  }
  const line = customFromConsultation(consultation, input.productId ?? null)
  if (!line) throw new OrderError('Tư vấn chưa có kết quả để đặt hàng', 422)
  return line
}

async function fromSavedProfile(input: AddToCartRequest): Promise<CustomCartItem> {
  const saved = (await listSavedProducts(input.customerId)).find((row) => row.id === input.savedProductId)
  if (!saved) throw new OrderError('Không tìm thấy mẫu đã lưu', 404)
  const line = customFromSaved(saved, input.productId ?? null)
  if (!line) {
    throw new OrderError('Mẫu chưa có quy cách hoặc sản phẩm cơ sở để tính giá', 422)
  }
  return line
}

function fromManual(input: AddToCartRequest): CustomCartItem {
  const parsed = customSpecSchema.safeParse(input.custom)
  if (!parsed.success) throw new OrderError('Quy cách không hợp lệ', 400)
  if (!input.productId) throw new OrderError('Chọn sản phẩm cơ sở để tính giá tạm tính', 400)
  return {
    productId: input.productId,
    spec: parsed.data,
    hasPrinting: input.hasPrinting ?? false,
    printingSpecs: input.printingSpecs ?? null,
  }
}

export async function addToCart(input: AddToCartRequest): Promise<{ id: string }> {
  if (input.kind === 'custom') {
    const line = input.consultationId
      ? await fromConsultation(input)
      : input.savedProductId
        ? await fromSavedProfile(input)
        : fromManual(input)
    await assertAnchor(line.productId)
    return upsertCartItem({
      customerId: input.customerId,
      kind: 'custom',
      productId: line.productId,
      savedProductId: line.savedProductId ?? null,
      custom: line.spec,
      // Số lượng: khách gửi > khai lúc tư vấn/lưu mẫu > 1.
      quantity: input.quantity ?? line.quantity ?? 1,
      hasPrinting: input.hasPrinting ?? line.hasPrinting,
      printingSpecs: input.printingSpecs ?? line.printingSpecs,
    })
  }

  if (!input.productId) throw new OrderError('Thiếu sản phẩm', 400)
  const product = await assertAnchor(input.productId)
  if (product.stockQuantity !== null && (input.quantity ?? 1) > product.stockQuantity) {
    throw new OrderError(`Chỉ còn ${product.stockQuantity} thùng ${product.name} trong kho`, 409)
  }
  return upsertCartItem({
    customerId: input.customerId,
    kind: 'stock',
    productId: input.productId,
    quantity: input.quantity,
    hasPrinting: input.hasPrinting,
    printingSpecs: input.printingSpecs ?? null,
  })
}
