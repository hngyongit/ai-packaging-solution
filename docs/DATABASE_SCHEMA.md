# Database Schema — Supabase (PostgreSQL)

> Initial schema for the AI Carton Packaging Solution Platform.
> All tables have Row Level Security (RLS) enabled.

---

## 1. Entity Relationship Overview

```
profiles (1) ──────< consultations (N) ──────< consultation_items (N)
    │                                                  │
    │                                                  │ (FK: product_suggestion)
    │                                                  ▼
    │                                            products
    │
    │ (1)                                   (FK: customer_id)
    ├──────< orders (N) ──────< order_items (N)
    │           │                       │
    │           │                       │ (FK: product_id)
    │           │                       ▼
    │           │                 products
    │           │
    │           │ (FK: customer_id)
    │           ▼
    │     order_status_history (N)
    │
    ├──────< saved_products (N)     (customer's saved products)
    │
    └──────< reorder_templates (N)   (saved reorder presets)
```

---

## 2. Tables

### 2.1 profiles

Extends Supabase `auth.users`. Stores user role and contact info.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'sales', 'admin')),
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  tax_code TEXT,             -- Mã số thuế (B2B customers)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Customer can read own profile
CREATE POLICY "profiles_customer_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Sales/admin can read all profiles
CREATE POLICY "profiles_staff_select_all"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

-- Customer can update own profile
CREATE POLICY "profiles_customer_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 2.2 products

Shared product catalog — box types, materials, pricing rules.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,             -- Product code (e.g., "CTN-3L-A4")
  name TEXT NOT NULL,                     -- Product name
  description TEXT,
  category TEXT NOT NULL                  -- 'carton-3-layer', 'carton-5-layer', 'custom'
    CHECK (category IN ('carton-3-layer', 'carton-5-layer', 'corrugated', 'custom')),
  box_type TEXT NOT NULL                  -- 'regular-slotted', 'half-slotted', 'die-cut', 'custom'
    CHECK (box_type IN ('regular-slotted', 'half-slotted', 'full-overlap', 'die-cut', 'custom')),
  min_dimensions JSONB,                   -- { length: number, width: number, height: number } (cm)
  max_dimensions JSONB,                   -- { length: number, width: number, height: number } (cm)
  available_layers INT[] DEFAULT ARRAY[3,5],  -- Available carton layers
  base_price DECIMAL(12,2),              -- Base price per unit
  price_tier_min_qty INT,                -- Min quantity for this price tier
  unit TEXT NOT NULL DEFAULT 'unit',      -- 'unit', 'm2'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "products_public_select"
  ON products FOR SELECT
  USING (is_active = TRUE);

-- Only admin can manage products
CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

### 2.3 consultations

AI consultation requests — customer submits product specs, AI returns recommendations.

**Status flow**: `pending → ai_processed → staff_reviewed → quoted → converted → closed`

```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ai_processed', 'staff_reviewed', 'quoted', 'converted', 'closed')),
  -- Customer input
  product_type TEXT NOT NULL,                     -- e.g., "coffee beans", "cosmetics", "electronics"
  product_description TEXT,
  product_length DECIMAL(8,2),                    -- cm
  product_width DECIMAL(8,2),                     -- cm
  product_height DECIMAL(8,2),                    -- cm
  product_weight DECIMAL(8,2),                    -- grams
  quantity_per_box INT,                           -- Items per box
  desired_quantity INT,                           -- Number of boxes needed
  has_printing BOOLEAN NOT NULL DEFAULT FALSE,
  printing_notes TEXT,
  logo_url TEXT,                                  -- Uploaded logo/design file (Supabase Storage)
  reference_image_url TEXT,                       -- Reference image
  budget DECIMAL(12,2),
  delivery_deadline DATE,
  notes TEXT,
  -- AI output
  ai_recommendation JSONB,                        -- Full AI recommendation object
  ai_suggested_product_id UUID REFERENCES products(id),
  ai_suggested_dimensions JSONB,                  -- { length, width, height }
  ai_suggested_layers INT,
  ai_confidence DECIMAL(4,3),                    -- 0.000 to 1.000
  ai_processed_at TIMESTAMPTZ,
  -- Sales
  sales_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consultations_customer ON consultations(customer_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_assigned ON consultations(assigned_to);

-- RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Customer can see own consultations
CREATE POLICY "consultations_customer_select_own"
  ON consultations FOR SELECT
  USING (auth.uid() = customer_id);

-- Anyone can insert (anonymous consultation allowed)
CREATE POLICY "consultations_public_insert"
  ON consultations FOR INSERT
  WITH CHECK (true);

-- Customer can update own (limited fields)
CREATE POLICY "consultations_customer_update_own"
  ON consultations FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Sales/admin can see/manage all
CREATE POLICY "consultations_staff_select_all"
  ON consultations FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

CREATE POLICY "consultations_staff_update_all"
  ON consultations FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));
```

### 2.4 orders

Customer orders.

**Status flow**: `pending → staff_review → confirmed → deposit_paid (if over threshold) → production → completed → delivered → cancelled`

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE,                -- Human-readable: "ORD-20260901-001"
  customer_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',          -- Awaiting staff review
      'staff_review',     -- Staff is reviewing
      'confirmed',        -- Staff confirmed price, customer agreed
      'deposit_paid',     -- Deposit received (if over threshold)
      'production',       -- In production
      'completed',        -- Produced
      'delivered',        -- Delivered to customer
      'cancelled'         -- Cancelled at any stage
    )),
  consultation_id UUID REFERENCES consultations(id),
  -- Pricing
  total_amount DECIMAL(14,2),
  deposit_amount DECIMAL(14,2),
  deposit_threshold DECIMAL(14,2) DEFAULT 5000000,  -- Orders above this require deposit
  payment_method TEXT DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'bank_transfer')),
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid')),
  payment_proof_url TEXT,                            -- Uploaded bank transfer screenshot
  contact_name TEXT,                                 -- Customer contact info
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

-- Indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_code ON orders(order_code);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customer can see own orders
CREATE POLICY "orders_customer_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Sales/admin can see all
CREATE POLICY "orders_staff_select_all"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

-- Sales/admin can update
CREATE POLICY "orders_staff_update_all"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));
```

### 2.5 order_items

Line items within an order.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  -- Snapshot of product at time of order
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  dimensions JSONB NOT NULL,                     -- { length, width, height, layers }
  printing_specs JSONB,                          -- { colors, positions, file_url }
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Inherit from orders
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
```

### 2.6 order_status_history

Audit log for order status changes.

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Same as orders
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
```

### 2.7 saved_products

Customer's saved/customized product specs for quick reorder.

```sql
CREATE TABLE saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                            -- Customer's label: "Coffee box A4"
  product_id UUID REFERENCES products(id),
  custom_dimensions JSONB,                       -- { length, width, height, layers }
  printing_specs JSONB,                          -- { colors, positions, file_url }
  logo_url TEXT,
  notes TEXT,
  last_ordered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, name)
);

-- RLS
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_products_customer_all"
  ON saved_products FOR ALL
  USING (auth.uid() = customer_id);
```

### 2.8 reorder_templates

Quick reorder presets for B2B customers.

```sql
CREATE TABLE reorder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                            -- "Monthly coffee box order"
  saved_product_id UUID REFERENCES saved_products(id),
  default_quantity INT NOT NULL,
  auto_reorder BOOLEAN DEFAULT FALSE,            -- Auto reorder when stock runs low
  reminder_days INT,                             -- Days before reorder reminder
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE reorder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reorder_templates_customer_all"
  ON reorder_templates FOR ALL
  USING (auth.uid() = customer_id);
```

---

## 3. Storage Buckets (Supabase Storage)

| Bucket | Visibility | Purpose |
|---|---|---|
| `logos` | Public (read) | Customer uploaded logos / design files |
| `mockups` | Public (read) | Generated mockup preview images |
| `product-images` | Public (read) | Product catalog images |
| `order-files` | Authenticated | Production files, artwork |

---

## 4. Realtime Subscriptions

Enable Realtime on:

| Table | Reason |
|---|---|
| `orders` | Customer sees status updates live |
| `order_status_history` | Status change feed |
| `consultations` | Sales team sees new consultations |

---

## 5. Initial Seed Data

```sql
-- Default product catalog
INSERT INTO products (code, name, category, box_type, description, base_price, unit) VALUES
  ('CTN-3L-SM',  'Carton 3 lớp — Nhỏ',    'carton-3-layer', 'regular-slotted', '20x15x10cm, phù hợp mỹ phẩm, phụ kiện',  3000, 'unit'),
  ('CTN-3L-MD',  'Carton 3 lớp — Vừa',    'carton-3-layer', 'regular-slotted', '35x25x20cm, phù hợp thực phẩm, quà tặng',  5000, 'unit'),
  ('CTN-3L-LG',  'Carton 3 lớp — Lớn',    'carton-3-layer', 'regular-slotted', '50x40x30cm, phù hợp giày dép, quần áo',   8000, 'unit'),
  ('CTN-5L-MD',  'Carton 5 lớp — Vừa',    'carton-5-layer', 'regular-slotted', '40x30x25cm, phù hợp hàng nặng, điện tử',   12000, 'unit'),
  ('CTN-5L-LG',  'Carton 5 lớp — Lớn',    'carton-5-layer', 'regular-slotted', '60x40x40cm, phù hợp hàng cồng kềnh',       18000, 'unit'),
  ('CTN-5L-XL',  'Carton 5 lớp — Cỡ lớn', 'carton-5-layer', 'full-overlap',    '80x60x50cm, phù hợp hàng xuất khẩu',         25000, 'unit');
```

---

## 6. Migration Strategy

All schema & seed changes go through Supabase migrations. Never edit the DB directly.

```bash
# Create a new migration
npx supabase migration new <migration-name>
# → creates supabase/migrations/<timestamp>_<name>.sql

# Apply pending migrations to linked cloud project
npx supabase db push

# Reset local DB (migrations + seed)
npx supabase db reset
```

### Workflow

| Scenario | Command |
|----------|---------|
| Schema change | `npx supabase migration new <name>` → edit file → `npx supabase db push` |
| Seed data change | Edit or add migration → `npx supabase db push` |
| New team member | `npx supabase link --project-ref <ref>` → `npx supabase db push` |