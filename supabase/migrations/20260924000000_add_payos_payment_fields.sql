-- Migration: remove VNPay fields, add PayOS payment fields
-- Run: npx supabase migration new add_payos_payment_fields

-- 1. Drop VNPay columns (if they exist from a previous migration)
ALTER TABLE orders DROP COLUMN IF EXISTS vnp_transaction_no;
ALTER TABLE orders DROP COLUMN IF EXISTS vnp_pay_date;

-- 2. Add PayOS columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payos_payment_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_payos_payment_id ON orders(payos_payment_id) WHERE payos_payment_id IS NOT NULL;

-- 3. Update payment_method CHECK constraint to include 'payos'
-- First drop the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
-- Then recreate with 'payos' included
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cod', 'bank_transfer', 'payos'));

-- 4. Update payment_status CHECK constraint if needed (keep existing: unpaid/deposit_paid/paid)
-- No change needed — these statuses work for PayOS too.

COMMENT ON COLUMN orders.payos_payment_id IS 'PayOS transaction ID (set when customer pays via PayOS)';
