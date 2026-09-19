-- Address book: thông tin liên hệ + giao hàng lưu trong DB để khách không phải
-- nhập lại mỗi lần đặt (checkout chỉ chọn địa chỉ).
--
-- phone có CHECK 10 chữ số vì orders.contact_phone cũng validate đúng như vậy —
-- chặn dữ liệu bẩn ngay ở DB thay vì tin app.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_address TEXT;

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_addresses_label_length CHECK (length(label) BETWEEN 1 AND 60),
  CONSTRAINT customer_addresses_phone_ten_digits CHECK (phone ~ '^[0-9]{10}$')
);

-- Mỗi khách tối đa một địa chỉ mặc định — DB chặn, app không cần khoá.
CREATE UNIQUE INDEX IF NOT EXISTS customer_addresses_one_default
  ON customer_addresses (customer_id) WHERE is_default;

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_addresses_customer_all" ON public.customer_addresses;
CREATE POLICY "customer_addresses_customer_all"
  ON public.customer_addresses FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);
