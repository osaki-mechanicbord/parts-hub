-- Add Stripe fields to transactions table
ALTER TABLE transactions ADD COLUMN stripe_session_id TEXT;
ALTER TABLE transactions ADD COLUMN stripe_payment_intent TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent ON transactions(stripe_payment_intent);
