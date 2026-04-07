-- パートナー管理テーブル
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  area_pref TEXT DEFAULT '',
  status TEXT DEFAULT 'training' CHECK(status IN ('training', 'active', 'inactive', 'terminated')),
  contract_date TEXT,
  notes TEXT DEFAULT '',
  total_listings INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  monthly_listings INTEGER DEFAULT 0,
  monthly_revenue INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_area_pref ON partners(area_pref);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
