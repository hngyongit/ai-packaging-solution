-- restock_order vẫn gọi được bằng anon key trên remote.
--
-- Migration gốc (20260919040000) chỉ `REVOKE ALL ... FROM PUBLIC`, nhưng Supabase
-- đã cấp EXECUTE cho anon/authenticated bằng ALTER DEFAULT PRIVILEGES ngay lúc
-- CREATE FUNCTION — grant tường minh đó không bị gỡ bởi revoke PUBLIC. deduct_order_stock
-- đã được vá đúng cách ở 20260919010000; restock_order thì chưa.
--
-- Hàm là SECURITY DEFINER (bỏ qua RLS). anon key nằm sẵn trong bundle trình duyệt,
-- nên bất kỳ ai cũng gọi được với order id bất kỳ → cộng ngược tồn kho của mọi
-- product trong đơn và reset stock_deducted, phá cả tồn kho lẫn tính idempotent.
-- Chỉ route handler (service_role) mới được gọi.

REVOKE EXECUTE ON FUNCTION public.restock_order(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restock_order(UUID) TO service_role;

-- Advisor function_search_path_mutable: SECURITY DEFINER phải ghim search_path.
-- ALTER thay vì CREATE OR REPLACE để khỏi chép lại thân hàm (tránh lệch bản đang chạy).
ALTER FUNCTION public.restock_order(UUID) SET search_path = public;
