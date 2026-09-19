import { createAdminClient } from '@/lib/supabase/server'

// Móc kho cho vòng đời đơn — RPC SECURITY DEFINER là nguồn đúng duy nhất.

/** Chốt đơn → trừ kho. Lỗi trả về message tiếng Việt để route dịch; thành công trả null. */
export async function deductStockOnConfirm(orderId: string): Promise<{ message: string } | null> {
  const admin = await createAdminClient()
  const { error } = await admin.rpc('deduct_order_stock', { p_order_id: orderId })
  if (!error) return null
  if (error.message.includes('insufficient stock')) {
    return { message: 'Không đủ tồn kho để chốt đơn. Vui lòng cập nhật số lượng.' }
  }
  throw error
}

/** Hủy đơn đã trừ kho → hoàn trả. Idempotent trong RPC (cờ stock_deducted). */
export async function restockOnCancel(orderId: string): Promise<void> {
  const admin = await createAdminClient()
  const { error } = await admin.rpc('restock_order', { p_order_id: orderId })
  if (error) throw new Error(`Hoàn tồn kho thất bại: ${error.message}`)
}
