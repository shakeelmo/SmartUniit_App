ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' AFTER subtotal,
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER discount_type,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER discount_value;
