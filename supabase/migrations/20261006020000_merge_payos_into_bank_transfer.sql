-- Migration: PayOS là CƠ CHẾ THI HÀNH của bank_transfer, không phải phương thức riêng.
-- Trước: payment_method IN ('cod', 'bank_transfer', 'payos') → UI hiện 3 lựa chọn,
-- khách chọn "payos" tách rời khỏi "bank_transfer" dù cùng một nghiệp vụ.
-- Sau:   payment_method IN ('cod', 'bank_transfer'); bank_transfer thu tiền qua PayOS.

-- 1. Gộp dữ liệu cũ: đơn đã chọn 'payos' chuyển về 'bank_transfer'.
UPDATE orders SET payment_method = 'bank_transfer' WHERE payment_method = 'payos';

-- 2. Siết lại CHECK constraint.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'bank_transfer'));

-- 3. Số tiền của link PayOS đang mở — webhook đối chiếu để không ghi nhận thiếu tiền.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payos_amount DECIMAL(14,2);
COMMENT ON COLUMN orders.payos_amount IS 'Số tiền của link PayOS đang mở (cọc hoặc toàn bộ), webhook đối chiếu khi nhận callback';

-- 4. Bỏ minh chứng chuyển khoản thủ công — bank_transfer nay xác nhận qua PayOS webhook.
ALTER TABLE orders DROP COLUMN IF EXISTS payment_proof_url;
