-- Migration: add payos_order_code column for webhook lookup
-- This stores the PayOS orderCode so the webhook can find the order

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payos_order_code BIGINT;
CREATE INDEX IF NOT EXISTS idx_orders_payos_order_code ON orders(payos_order_code) WHERE payos_order_code IS NOT NULL;

COMMENT ON COLUMN orders.payos_order_code IS 'PayOS order code (numeric, used for webhook lookup)';
