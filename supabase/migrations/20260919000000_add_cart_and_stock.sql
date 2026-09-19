-- Phase 1: warehouse stock + DB-backed cart + stock-decrement guard.
-- products.stock_quantity: NULL = không theo dõi tồn kho (gia công theo yêu cầu),
-- có số = hàng có sẵn trong kho. CHECK >= 0 nên kho không bao giờ âm.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_quantity_non_negative;
ALTER TABLE public.products
  ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0);

-- Hàng tiêu chuẩn trong kho (seed 20260904025044). Dòng 'custom' giữ NULL.
UPDATE public.products SET stock_quantity = 5000
  WHERE code IN ('CTN-3L-SM', 'CTN-3L-MD', 'CTN-3L-LG');
UPDATE public.products SET stock_quantity = 2500
  WHERE code IN ('CTN-5L-MD', 'CTN-5L-LG', 'CTN-5L-XL');

-- Cờ idempotency cho việc trừ kho: RPC chỉ trừ 1 lần cho mỗi đơn.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN NOT NULL DEFAULT FALSE;

-- ── cart_items ───────────────────────────────────────────
-- Một dòng mỗi SKU mỗi khách (UNIQUE) → add lại thì cộng dồn số lượng.
-- customer_id tham chiếu profiles(id) theo đúng quy ước orders/saved_products.
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  has_printing BOOLEAN NOT NULL DEFAULT FALSE,
  printing_specs JSONB,                          -- { logoUrl, printPositionLabel }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_customer ON cart_items(customer_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_items_customer_all" ON public.cart_items;
CREATE POLICY "cart_items_customer_all"
  ON public.cart_items FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- ── deduct_order_stock ───────────────────────────────────
-- Trừ kho khi đơn được staff chốt ('confirmed'). Called by /api/orders/[id]/status.
--
-- Idempotency: `stock_deducted` + `FOR UPDATE` trên dòng orders → hai lần bấm
-- duyệt / hai request song song không trừ hai lần. Route đã CAS trên
-- orders.status nên thường chỉ một bên tới được đây; cờ này là lớp chặn thứ hai.
--
-- Oversell: UPDATE có điều kiện `stock_quantity >= quantity`. Không match →
-- RAISE → cả function rollback → confirm thất bại, đơn vẫn ở staff_review.
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

REVOKE ALL ON FUNCTION public.deduct_order_stock(UUID) FROM PUBLIC;
