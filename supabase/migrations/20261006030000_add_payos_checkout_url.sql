-- Migration: lưu URL thanh toán của link PayOS đang mở.
-- PayOS không trả lại checkoutUrl khi tra cứu link (chỉ trả lúc tạo), nên phải
-- giữ lại để lần bấm sau trả về đúng link cũ thay vì tạo link trùng.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payos_checkout_url TEXT;
COMMENT ON COLUMN orders.payos_checkout_url IS 'URL thanh toán của link PayOS đang mở; xoá khi link chết hoặc đã thu tiền';
