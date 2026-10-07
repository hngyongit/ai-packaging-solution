-- Thêm mốc "đang giao hàng" giữa hoàn thành sản xuất và đã giao.
--
-- Trước: completed → delivered. Staff bấm "đã giao" ngay sau khi sản xuất xong,
-- không có mốc nào cho biết hàng đã rời xưởng. Khách cũng không có cách tự xác
-- nhận đã nhận hàng.
--
-- Sau: production → completed (sản xuất xong) → delivering (đã đưa đi giao)
--      → delivered (khách xác nhận, hoặc staff chốt khi ĐVVC báo xong).
--
-- delivered vẫn là trạng thái cuối — không đổi tên, không cần migrate dữ liệu cũ.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'staff_review', 'confirmed', 'deposit_paid',
    'production', 'completed', 'delivering', 'delivered', 'cancelled'
  ));

COMMENT ON COLUMN orders.status IS
  'pending → staff_review → confirmed → deposit_paid → production → completed → delivering → delivered; cancelled là nhánh thoát.';
