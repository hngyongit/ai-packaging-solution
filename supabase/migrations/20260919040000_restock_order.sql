-- Hủy đơn đã chốt → hoàn trả tồn kho (đối xứng deduct_order_stock, Phase 4).
-- Chỉ hoàn khi đơn THỰC SỰ đã trừ (stock_deducted = true) và reset cờ về false
-- để không hoàn hai lần. Hàng gia công (stock_quantity NULL) bỏ qua.

CREATE OR REPLACE FUNCTION restock_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_deducted BOOLEAN;
  v_item RECORD;
BEGIN
  SELECT stock_deducted INTO v_stock_deducted FROM orders WHERE id = p_order_id;
  IF v_stock_deducted IS DISTINCT FROM TRUE THEN
    RETURN; -- chưa từng trừ kho → không có gì để hoàn
  END IF;

  FOR v_item IN
    SELECT oi.product_id, oi.quantity
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND p.stock_quantity IS NOT NULL
  LOOP
    UPDATE products
    SET stock_quantity = stock_quantity + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  UPDATE orders SET stock_deducted = FALSE WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION restock_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION restock_order(UUID) TO service_role;

COMMENT ON FUNCTION restock_order(UUID) IS 'Hoàn tồn kho khi hủy đơn đã trừ kho; idempotent nhờ cờ stock_deducted';
