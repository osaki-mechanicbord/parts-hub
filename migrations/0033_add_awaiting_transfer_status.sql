-- Add 'awaiting_transfer' and 'refunded' to transactions status CHECK constraint
-- Required for bank transfer (invoice) payment method

PRAGMA foreign_keys = OFF;

CREATE TABLE transactions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  fee INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed', 'awaiting_transfer', 'refunded')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  paid_at DATETIME,
  shipped_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  tracking_number TEXT,
  shipping_carrier TEXT,
  shipping_note TEXT,
  shipping_address TEXT,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_postal_code TEXT,
  payment_method TEXT DEFAULT 'card',
  invoice_number TEXT,
  invoice_due_date DATETIME,
  transfer_confirmed_at DATETIME,
  transfer_note TEXT,
  billing_info TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

INSERT INTO transactions_new SELECT * FROM transactions;

DROP TABLE transactions;

ALTER TABLE transactions_new RENAME TO transactions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);

PRAGMA foreign_keys = ON;
