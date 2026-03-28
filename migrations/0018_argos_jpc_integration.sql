-- ARGOS JPC API連携用テーブル
-- 公開予定: 2026年6月以降（ARGOS JPC無料トライアル後、本契約確定後）

-- VIN検索結果キャッシュ（API呼出コスト削減: 同一VIN 2回目以降はD1から応答）
CREATE TABLE IF NOT EXISTS argos_vin_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vin TEXT NOT NULL UNIQUE,
  brand TEXT,
  brand_ja TEXT,
  model TEXT,
  model_ja TEXT,
  type_code TEXT,
  generation TEXT,
  year INTEGER,
  month INTEGER,
  engine TEXT,
  displacement TEXT,
  transmission TEXT,
  drive TEXT,
  grade TEXT,
  color TEXT,
  body_type TEXT,
  fuel TEXT,
  full_model_code TEXT,
  katashiki TEXT,
  type_class TEXT,
  ruibetsu TEXT,
  raw_response TEXT,           -- ARGOS APIの生レスポンスJSON
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,         -- キャッシュ有効期限（デフォルト30日）
  hit_count INTEGER DEFAULT 0  -- キャッシュヒット回数（コスト分析用）
);
CREATE INDEX IF NOT EXISTS idx_argos_vin_cache_vin ON argos_vin_cache(vin);
CREATE INDEX IF NOT EXISTS idx_argos_vin_cache_expires ON argos_vin_cache(expires_at);

-- 部品グループキャッシュ（VIN × グループ別）
CREATE TABLE IF NOT EXISTS argos_parts_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vin TEXT NOT NULL,
  group_id TEXT NOT NULL,
  subgroup_id TEXT,
  parts_json TEXT NOT NULL,    -- 部品一覧JSON
  illustration_url TEXT,       -- イラスト画像URL（R2に保存したもの）
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  UNIQUE(vin, group_id, subgroup_id)
);
CREATE INDEX IF NOT EXISTS idx_argos_parts_cache_vin ON argos_parts_cache(vin);
CREATE INDEX IF NOT EXISTS idx_argos_parts_cache_lookup ON argos_parts_cache(vin, group_id, subgroup_id);

-- ARGOS API呼出ログ（コスト追跡・使用状況分析）
CREATE TABLE IF NOT EXISTS argos_api_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_endpoint TEXT NOT NULL,  -- 例: '#13 Get Car List by VIN'
  request_vin TEXT,
  request_params TEXT,         -- JSON
  response_status INTEGER,
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT 0,
  user_id INTEGER,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_argos_api_log_created ON argos_api_log(created_at);
CREATE INDEX IF NOT EXISTS idx_argos_api_log_endpoint ON argos_api_log(api_endpoint);

-- 出品商品とOEM品番の紐付け（VIN検索→出品で自動設定された品番を記録）
CREATE TABLE IF NOT EXISTS product_oem_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  oem_part_number TEXT NOT NULL,
  part_name TEXT,
  reference_price INTEGER,           -- ARGOS参考価格
  compatible_part_numbers TEXT,      -- 互換品番（カンマ区切り）
  source TEXT DEFAULT 'argos_jpc',   -- データソース
  vin_used TEXT,                     -- 元のVIN
  group_name TEXT,                   -- 部品グループ名
  subgroup_name TEXT,                -- サブグループ名
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_oem_parts_product ON product_oem_parts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_oem_parts_number ON product_oem_parts(oem_part_number);
CREATE INDEX IF NOT EXISTS idx_product_oem_parts_compat ON product_oem_parts(compatible_part_numbers);
