-- Fix: đơn có dòng gia công theo yêu cầu không được trừ kho của SKU neo giá.
-- deduct_order_stock / restock_order JOIN products rồi lọc stock_quantity
-- IS NOT NULL — custom line vẫn mượn product đó làm neo giá nên lọt qua điều
-- kiện. Thêm `AND NOT oi.is_custom`.
--
-- thuộc tính function giữ nguyên như bản gốc (deduct: search_path, không
-- SECURITY DEFINER; restock: SECURITY DEFINER) để không đổi semantics đã verify.

CREATE OR REPLACE FUNCTION public.deduct_order_stock(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_deducted BOOLEAN;
  v_line RECORD;
BEGIN
  SELECT stock_deducted INTO v_deducted FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;
  IF v_deducted THEN
    RETURN;                                       -- đã trừ rồi — không trừ lần nữa
  END IF;

  FOR v_line IN
    SELECT oi.product_id, oi.quantity
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND p.stock_quantity IS NOT NULL
      AND NOT oi.is_custom                        -- hàng gia công: không trừ kho
  LOOP
    UPDATE products
      SET stock_quantity = stock_quantity - v_line.quantity,
          updated_at = NOW()
      WHERE id = v_line.product_id
        AND stock_quantity >= v_line.quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient stock for product %', v_line.product_id;
    END IF;
  END LOOP;

  UPDATE orders SET stock_deducted = TRUE WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restock_order(p_order_id UUID)
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
      AND NOT oi.is_custom
  LOOP
    UPDATE products
    SET stock_quantity = stock_quantity + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  UPDATE orders SET stock_deducted = FALSE WHERE id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.deduct_order_stock(UUID) IS 'Trừ tồn kho khi chốt đơn; bỏ qua dòng is_custom; idempotent nhờ stock_deducted';
COMMENT ON FUNCTION public.restock_order(UUID) IS 'Hoàn tồn kho khi hủy đơn đã trừ; bỏ qua dòng is_custom';
