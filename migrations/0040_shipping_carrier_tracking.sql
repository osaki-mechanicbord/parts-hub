-- ============================================================
-- 配送業者マスター・追跡番号管理・発送手配書対応
-- ============================================================

-- cross_border_orders に配送業者コード（carrier_code）追加
ALTER TABLE cross_border_orders ADD COLUMN carrier_code TEXT;
-- 追跡URL（自動生成したものを保存）
ALTER TABLE cross_border_orders ADD COLUMN tracking_url TEXT;
-- 発送手配書の印刷済みフラグ
ALTER TABLE cross_border_orders ADD COLUMN shipping_doc_printed INTEGER DEFAULT 0;
-- 荷物重量
ALTER TABLE cross_border_orders ADD COLUMN package_weight_kg REAL;
-- 配送先ゾーン
ALTER TABLE cross_border_orders ADD COLUMN shipping_zone TEXT;

-- cross_border_listings に配送業者コードと重量情報を追加（出品時に選択した配送方法を保存）
ALTER TABLE cross_border_listings ADD COLUMN carrier_code TEXT;
ALTER TABLE cross_border_listings ADD COLUMN shipping_zone TEXT;

-- 法人割引率設定テーブル
CREATE TABLE IF NOT EXISTS carrier_discount_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carrier_code TEXT NOT NULL UNIQUE,
  discount_rate REAL NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- デフォルト割引率を挿入（法人契約なしの状態）
INSERT OR IGNORE INTO carrier_discount_settings (carrier_code, discount_rate, notes) VALUES
  ('fedex_priority', 0, 'FedEx International Priority - 法人契約で40-60%OFF可能'),
  ('fedex_economy', 0, 'FedEx International Economy - 法人契約で40-60%OFF可能'),
  ('dhl_express', 0, 'DHL Express Worldwide - 法人契約で大幅割引あり'),
  ('ups_express', 0, 'UPS Worldwide Express - 法人契約で割引あり'),
  ('yamato_intl', 0, 'ヤマト運輸 国際宅急便'),
  ('sagawa_intl', 0, '佐川急便 飛脚国際宅配便 - 個別見積もりが基本');

CREATE INDEX IF NOT EXISTS idx_cb_orders_carrier ON cross_border_orders(carrier_code);
