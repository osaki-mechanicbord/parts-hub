-- ============================================================
-- 越境EC (Cross-Border E-Commerce) テーブル群
-- PARTS HUB → eBay等の海外EC連携
-- ============================================================

-- 海外出品データ
CREATE TABLE IF NOT EXISTS cross_border_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ebay',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','translating','ready','listed','sold','cancelled','error')),
  -- 翻訳済みデータ
  title_en TEXT,
  description_en TEXT,
  -- 価格設定
  price_jpy INTEGER NOT NULL,
  price_usd REAL,
  exchange_rate REAL,
  shipping_cost_usd REAL DEFAULT 0,
  -- 海外EC側のID
  external_listing_id TEXT,
  external_url TEXT,
  -- AI需要スコア (0-100)
  demand_score INTEGER DEFAULT 0,
  demand_reason TEXT,
  -- メタ
  listed_at DATETIME,
  sold_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 海外注文データ
CREATE TABLE IF NOT EXISTS cross_border_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ebay',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','buyback_requested','buyback_completed','preparing','shipped','delivered','completed','cancelled','refunded')),
  -- 購入者情報
  buyer_name TEXT,
  buyer_country TEXT,
  buyer_address TEXT,
  -- 金額
  sale_price_usd REAL NOT NULL,
  sale_price_jpy INTEGER,
  buyback_price_jpy INTEGER,
  profit_jpy INTEGER DEFAULT 0,
  exchange_rate_at_sale REAL,
  -- 配送
  shipping_method TEXT,
  tracking_number TEXT,
  shipping_cost_jpy INTEGER DEFAULT 0,
  -- 外部データ
  external_order_id TEXT,
  -- タイムスタンプ
  ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  buyback_completed_at DATETIME,
  shipped_at DATETIME,
  delivered_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES cross_border_listings(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 為替レートキャッシュ
CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  currency_pair TEXT NOT NULL DEFAULT 'USD/JPY',
  rate REAL NOT NULL,
  source TEXT DEFAULT 'api',
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_cb_listings_product ON cross_border_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_cb_listings_status ON cross_border_listings(status);
CREATE INDEX IF NOT EXISTS idx_cb_listings_platform ON cross_border_listings(platform);
CREATE INDEX IF NOT EXISTS idx_cb_orders_listing ON cross_border_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_cb_orders_status ON cross_border_orders(status);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(currency_pair, fetched_at);
