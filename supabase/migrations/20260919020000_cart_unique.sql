-- cart_items: thêm UNIQUE(customer_id, product_id) mà migration 20260919000000
-- đã hứa trong comment nhưng thiếu trong DDL. Không có nó, hai cú bấm "Thêm vào
-- giỏ" gần như đồng tạo hai dòng cùng SKU thay vì cộng dồn.

-- 1) Cộng số lượng các dòng trùng vào dòng cũ nhất, rồi xoá các dòng dư.
UPDATE public.cart_items oldest
SET quantity = dup.total_qty
FROM (
  SELECT FIRST_VALUE(id) OVER w AS keep_id,
         SUM(quantity) OVER w AS total_qty,
         id
  FROM public.cart_items
  WINDOW w AS (PARTITION BY customer_id, product_id ORDER BY created_at, id)
) dup
WHERE oldest.id = dup.keep_id
  AND dup.id <> dup.keep_id;

DELETE FROM public.cart_items c
WHERE EXISTS (
  SELECT 1
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY customer_id, product_id ORDER BY created_at, id
    ) AS rn
    FROM public.cart_items
  ) ranked
  WHERE ranked.id = c.id AND ranked.rn > 1
);

-- 2) Ràng buộc.
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_customer_product_key;
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_customer_product_key
  ON public.cart_items (customer_id, product_id);
