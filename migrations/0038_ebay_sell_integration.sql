-- ============================================================
-- eBay Sell API 連携テーブル群
-- OAuth User Token + Inventory + Fulfillment
-- ============================================================

-- eBay OAuth User Token 保存テーブル
CREATE TABLE IF NOT EXISTS ebay_user_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_account TEXT NOT NULL DEFAULT 'default',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'User Access Token',
  expires_at DATETIME NOT NULL,
  refresh_token_expires_at DATETIME NOT NULL,
  scopes TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ebay_tokens_account ON ebay_user_tokens(seller_account, environment);

-- eBay Inventory Location テーブル
CREATE TABLE IF NOT EXISTS ebay_inventory_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_location_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location_type TEXT DEFAULT 'WAREHOUSE',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_or_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'JP',
  phone TEXT,
  is_default INTEGER DEFAULT 0,
  ebay_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- cross_border_listings に eBay出品連携用カラム追加
-- (既存テーブルへのALTER)
ALTER TABLE cross_border_listings ADD COLUMN ebay_sku TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_offer_id TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_listing_id TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_category_id TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_condition TEXT DEFAULT 'USED_GOOD';
ALTER TABLE cross_border_listings ADD COLUMN ebay_fulfillment_policy_id TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_payment_policy_id TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_return_policy_id TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_marketplace_id TEXT DEFAULT 'EBAY_US';
ALTER TABLE cross_border_listings ADD COLUMN weight_kg REAL;
ALTER TABLE cross_border_listings ADD COLUMN length_cm REAL;
ALTER TABLE cross_border_listings ADD COLUMN width_cm REAL;
ALTER TABLE cross_border_listings ADD COLUMN height_cm REAL;
ALTER TABLE cross_border_listings ADD COLUMN ebay_last_error TEXT;
ALTER TABLE cross_border_listings ADD COLUMN ebay_synced_at DATETIME;

-- cross_border_orders に eBay注文連携用カラム追加
ALTER TABLE cross_border_orders ADD COLUMN ebay_order_id TEXT;
ALTER TABLE cross_border_orders ADD COLUMN ebay_line_item_id TEXT;
ALTER TABLE cross_border_orders ADD COLUMN ebay_fulfillment_id TEXT;
ALTER TABLE cross_border_orders ADD COLUMN buyer_email TEXT;
ALTER TABLE cross_border_orders ADD COLUMN buyer_phone TEXT;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_cb_listings_ebay_sku ON cross_border_listings(ebay_sku);
CREATE INDEX IF NOT EXISTS idx_cb_listings_ebay_listing ON cross_border_listings(ebay_listing_id);
CREATE INDEX IF NOT EXISTS idx_cb_orders_ebay_order ON cross_border_orders(ebay_order_id);
