-- 振込申請テーブル
CREATE TABLE IF NOT EXISTS withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  branch_name TEXT NOT NULL,
  branch_code TEXT,
  account_type TEXT NOT NULL, -- ordinary, checking
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, rejected
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  transferred_at DATETIME,
  notes TEXT,
  rejection_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON withdrawals(requested_at DESC);
