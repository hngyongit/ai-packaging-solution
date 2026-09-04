-- Migration: init_schema
-- Created: 2026-09-04
-- Description: Initial schema — all tables, RLS policies, indexes

-- Drop existing tables (dev DB may have old schema from schema.sql runs)
DROP TABLE IF EXISTS reorder_templates CASCADE;
DROP TABLE IF EXISTS saved_products CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ── Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2.1 profiles ────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'sales', 'admin')),
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  tax_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_customer_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_staff_select_all"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

CREATE POLICY "profiles_customer_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 2.2 products ────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL
    CHECK (category IN ('carton-3-layer', 'carton-5-layer', 'corrugated', 'custom')),
  box_type TEXT NOT NULL
    CHECK (box_type IN ('regular-slotted', 'half-slotted', 'full-overlap', 'die-cut', 'custom')),
  min_dimensions JSONB,
  max_dimensions JSONB,
  available_layers INT[] DEFAULT ARRAY[3,5],
  base_price DECIMAL(12,2),
  price_tier_min_qty INT,
  unit TEXT NOT NULL DEFAULT 'unit',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_select"
  ON products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- ── 2.3 consultations ───────────────────────────────────
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ai_processed', 'staff_reviewed', 'quoted', 'converted', 'closed')),
  product_type TEXT NOT NULL,
  product_description TEXT,
  product_length DECIMAL(8,2),
  product_width DECIMAL(8,2),
  product_height DECIMAL(8,2),
  product_weight DECIMAL(8,2),
  quantity_per_box INT,
  desired_quantity INT,
  has_printing BOOLEAN NOT NULL DEFAULT FALSE,
  printing_notes TEXT,
  logo_url TEXT,
  reference_image_url TEXT,
  budget DECIMAL(12,2),
  delivery_deadline DATE,
  notes TEXT,
  ai_recommendation JSONB,
  ai_suggested_product_id UUID REFERENCES products(id),
  ai_suggested_dimensions JSONB,
  ai_suggested_layers INT,
  ai_confidence DECIMAL(4,3),
  ai_processed_at TIMESTAMPTZ,
  sales_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_customer ON consultations(customer_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_assigned ON consultations(assigned_to);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultations_customer_select_own"
  ON consultations FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "consultations_public_insert"
  ON consultations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "consultations_customer_update_own"
  ON consultations FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "consultations_staff_select_all"
  ON consultations FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

CREATE POLICY "consultations_staff_update_all"
  ON consultations FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

-- ── 2.4 orders ──────────────────────────────────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'staff_review', 'confirmed', 'deposit_paid',
      'production', 'completed', 'delivered', 'cancelled'
    )),
  consultation_id UUID REFERENCES consultations(id),
  total_amount DECIMAL(14,2),
  deposit_amount DECIMAL(14,2),
  deposit_threshold DECIMAL(14,2) DEFAULT 5000000,
  payment_method TEXT DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'bank_transfer')),
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid')),
  payment_proof_url TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  delivery_method TEXT DEFAULT 'pickup',
  delivery_address TEXT,
  delivery_fee DECIMAL(12,2) DEFAULT 0,
  expected_production_date DATE,
  expected_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_customer_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "orders_staff_select_all"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

CREATE POLICY "orders_staff_update_all"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

-- ── 2.5 order_items ─────────────────────────────────────
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  dimensions JSONB NOT NULL,
  printing_specs JSONB,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_customer_select"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "order_items_staff_select_all"
  ON order_items FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

-- ── 2.6 order_status_history ────────────────────────────
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_status_history_select"
  ON order_status_history FOR SELECT
  USING (
    auth.uid() IN (
      SELECT customer_id FROM orders WHERE id = order_id
    ) OR auth.jwt() ->> 'role' IN ('sales', 'admin')
  );

CREATE POLICY "order_status_history_staff_insert"
  ON order_status_history FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('sales', 'admin'));

-- ── 2.7 saved_products ──────────────────────────────────
CREATE TABLE saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  custom_dimensions JSONB,
  printing_specs JSONB,
  logo_url TEXT,
  notes TEXT,
  last_ordered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, name)
);

ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_products_customer_all"
  ON saved_products FOR ALL
  USING (auth.uid() = customer_id);

-- ── 2.8 reorder_templates ───────────────────────────────
CREATE TABLE reorder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  saved_product_id UUID REFERENCES saved_products(id),
  default_quantity INT NOT NULL,
  auto_reorder BOOLEAN DEFAULT FALSE,
  reminder_days INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reorder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reorder_templates_customer_all"
  ON reorder_templates FOR ALL
  USING (auth.uid() = customer_id);