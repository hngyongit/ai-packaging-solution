-- Giỏ hàng chứa được cả dòng "theo yêu cầu": mỗi line tự mang quy cách, không
-- nhất thiết gắn với một SKU kho. Custom line vẫn cần product_id làm NEO GIÁ
-- (base_price của sản phẩm cơ sở) nhưng không được trừ kho.

-- ── cart_items ───────────────────────────────────────────
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'stock'
    CONSTRAINT cart_items_kind_check CHECK (kind IN ('stock', 'custom')),
  ADD COLUMN IF NOT EXISTS custom JSONB,          -- { length,width,height,layers,boxStyleId,productName,productCode,unit,basePrice,mockupUrl,dielineUrl,logoUrl }
  ADD COLUMN IF NOT EXISTS saved_product_id UUID REFERENCES saved_products(id) ON DELETE SET NULL;

-- Hàng kho: vẫn một dòng mỗi SKU. Hàng custom: KHÔNG dedupe — mỗi lần thêm là
-- một quy cách riêng, nên unique index chỉ áp cho kind='stock'.
DROP INDEX IF EXISTS public.cart_items_customer_product_key;
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_stock_key
  ON public.cart_items (customer_id, product_id) WHERE kind = 'stock';

-- Custom phải có quy cách; hàng kho phải có product để còn tra giá + tồn kho.
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_custom_needs_specs;
ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_custom_needs_specs
  CHECK (kind <> 'custom' OR custom IS NOT NULL);

-- ── order_items ──────────────────────────────────────────
-- Cờ phân biệt dòng gia công theo yêu cầu để RPC trừ kho bỏ qua. Không dựa
-- product.stock_quantity vì custom line vẫn mượn product đó làm neo giá.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.cart_items.kind IS 'stock = hàng kho (dedupe theo SKU) | custom = theo yêu cầu (mỗi lần thêm một dòng)';
COMMENT ON COLUMN public.order_items.is_custom IS 'true = gia công theo yêu cầu, không trừ tồn kho khi chốt đơn';
