-- deduct_order_stock được gọi từ Route Handler bằng service_role.
-- REVOKE FROM PUBLIC ở migration trước có thể cắt luôn đường cấp phát mặc định,
-- nên GRANT tường minh cho service_role (khách không bao giờ gọi trực tiếp).
GRANT EXECUTE ON FUNCTION public.deduct_order_stock(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.deduct_order_stock(UUID) FROM anon, authenticated;
