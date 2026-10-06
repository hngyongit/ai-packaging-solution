-- Migration: add columns/relationship that current src/ reads but schema lacks.
-- Requested to sync DEV DB forward to what the code expects (forward-only; drops nothing).

-- 1. orders.payos_transaction_id — written by src/lib/payos/webhook.ts:199.
--    Currently the whole webhook UPDATE fails on unknown column → 500 on every payment.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payos_transaction_id TEXT;

-- 2. box_styles.name + box_styles.dimensions — read by the embed in
--    src/app/api/orders/from-stock/route.ts:42 (`.select('*, box_styles(name, dimensions)')`).
ALTER TABLE public.box_styles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS dimensions JSONB;

-- name mirrors label for the seed styles so the embed returns something non-null.
UPDATE public.box_styles SET name = label WHERE name IS NULL;

-- 3. products.box_style_id FK — PostgREST needs a products→box_styles relationship
--    for the `box_styles(...)` embed to resolve at all.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS box_style_id TEXT REFERENCES public.box_styles(id);

-- NOT handled here: products.unit_price (read at from-stock/route.ts:56).
-- A DB column can't fix it cleanly: pricing is tiered (products.price_tier_min_qty),
-- so unit_price != base_price in general, and the value the code wants is computed
-- per-quantity. Fix in code (read base_price / compute from tiers), not schema.
