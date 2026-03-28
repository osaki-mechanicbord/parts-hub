-- =============================================================
-- 0013_full_schema_fix.sql
-- 全テーブルスキーマ修正 - 本番運用対応
-- =============================================================

-- =============================================
-- 1. categories テーブル作成
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO categories (id, name, slug, icon, display_order) VALUES
  (1, 'エンジンパーツ', 'engine', 'fa-cog', 1),
  (2, 'ブレーキパーツ', 'brake', 'fa-circle-stop', 2),
  (3, 'サスペンション', 'suspension', 'fa-arrows-up-down', 3),
  (4, '電装パーツ', 'electric', 'fa-bolt', 4),
  (5, '外装パーツ', 'exterior', 'fa-car', 5),
  (6, '内装パーツ', 'interior', 'fa-couch', 6),
  (7, 'ホイール・タイヤ', 'wheel', 'fa-tire', 7),
  (8, '排気系パーツ', 'exhaust', 'fa-wind', 8),
  (9, '駆動系パーツ', 'drivetrain', 'fa-gears', 9),
  (10, '冷却系パーツ', 'cooling', 'fa-temperature-low', 10),
  (11, 'ボディパーツ', 'body', 'fa-car-side', 11),
  (12, 'その他', 'other', 'fa-ellipsis', 12);

-- =============================================
-- 2. subcategories テーブル作成
-- =============================================
CREATE TABLE IF NOT EXISTS subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT OR IGNORE INTO subcategories (id, category_id, name, slug, display_order) VALUES
  (1, 1, 'ピストン・リング', 'piston-ring', 1),
  (2, 1, 'タイミングベルト・チェーン', 'timing-belt', 2),
  (3, 1, 'ガスケット', 'gasket', 3),
  (4, 1, 'オイルポンプ', 'oil-pump', 4),
  (5, 2, 'ブレーキパッド', 'brake-pad', 1),
  (6, 2, 'ブレーキローター', 'brake-rotor', 2),
  (7, 2, 'ブレーキキャリパー', 'brake-caliper', 3),
  (8, 3, 'ショックアブソーバー', 'shock-absorber', 1),
  (9, 3, 'スプリング', 'spring', 2),
  (10, 3, 'アーム・リンク', 'arm-link', 3),
  (11, 4, 'オルタネーター', 'alternator', 1),
  (12, 4, 'スターター', 'starter', 2),
  (13, 4, 'イグニッションコイル', 'ignition-coil', 3),
  (14, 5, 'バンパー', 'bumper', 1),
  (15, 5, 'フェンダー', 'fender', 2),
  (16, 5, 'ドアパネル', 'door-panel', 3),
  (17, 6, 'シート', 'seat', 1),
  (18, 6, 'ステアリング', 'steering', 2),
  (19, 7, 'アルミホイール', 'alloy-wheel', 1),
  (20, 7, 'タイヤ', 'tire', 2),
  (21, 8, 'マフラー', 'muffler', 1),
  (22, 8, '触媒', 'catalytic-converter', 2);

-- =============================================
-- 3. car_makers テーブル作成
-- =============================================
CREATE TABLE IF NOT EXISTS car_makers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT,
  country TEXT DEFAULT 'JP',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO car_makers (id, name, name_en, country, display_order) VALUES
  (1, 'トヨタ', 'TOYOTA', 'JP', 1),
  (2, 'ホンダ', 'HONDA', 'JP', 2),
  (3, '日産', 'NISSAN', 'JP', 3),
  (4, 'マツダ', 'MAZDA', 'JP', 4),
  (5, 'スバル', 'SUBARU', 'JP', 5),
  (6, 'スズキ', 'SUZUKI', 'JP', 6),
  (7, 'ダイハツ', 'DAIHATSU', 'JP', 7),
  (8, '三菱', 'MITSUBISHI', 'JP', 8),
  (9, 'いすゞ', 'ISUZU', 'JP', 9),
  (10, '日野', 'HINO', 'JP', 10),
  (11, 'レクサス', 'LEXUS', 'JP', 11),
  (12, 'BMW', 'BMW', 'DE', 12),
  (13, 'メルセデス・ベンツ', 'MERCEDES-BENZ', 'DE', 13),
  (14, 'フォルクスワーゲン', 'VOLKSWAGEN', 'DE', 14),
  (15, 'アウディ', 'AUDI', 'DE', 15);

-- =============================================
-- 4. car_models テーブル作成
-- =============================================
CREATE TABLE IF NOT EXISTS car_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maker_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  model_code TEXT,
  year_from INTEGER,
  year_to INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (maker_id) REFERENCES car_makers(id)
);

INSERT OR IGNORE INTO car_models (id, maker_id, name, model_code, year_from, year_to) VALUES
  (1, 1, 'プリウス', 'ZVW50', 2015, 2023),
  (2, 1, 'カローラ', 'NRE210', 2019, 2026),
  (3, 1, 'ハイエース', 'TRH200', 2004, 2026),
  (4, 1, 'ランドクルーザー', 'VJA300W', 2021, 2026),
  (5, 1, 'アクア', 'MXPK11', 2021, 2026),
  (6, 1, '86/GR86', 'ZN8', 2021, 2026),
  (7, 1, 'ヤリス', 'MXPA10', 2020, 2026),
  (8, 2, 'フィット', 'GR1', 2020, 2026),
  (9, 2, 'N-BOX', 'JF5', 2023, 2026),
  (10, 2, 'シビック', 'FL1', 2021, 2026),
  (11, 2, 'ヴェゼル', 'RV3', 2021, 2026),
  (12, 3, 'ノート', 'E13', 2020, 2026),
  (13, 3, 'セレナ', 'C28', 2022, 2026),
  (14, 3, 'スカイライン', 'RV37', 2019, 2026),
  (15, 3, 'フェアレディZ', 'RZ34', 2022, 2026),
  (16, 4, 'CX-5', 'KF', 2017, 2026),
  (17, 4, 'ロードスター', 'ND5RC', 2015, 2026),
  (18, 4, 'MAZDA3', 'BP', 2019, 2026),
  (19, 5, 'インプレッサ', 'GU', 2023, 2026),
  (20, 5, 'フォレスター', 'SK', 2018, 2026),
  (21, 5, 'BRZ', 'ZD8', 2021, 2026),
  (22, 6, 'ジムニー', 'JB64W', 2018, 2026),
  (23, 6, 'スイフト', 'ZC83S', 2017, 2026),
  (24, 6, 'ハスラー', 'MR52S', 2020, 2026);

-- =============================================
-- 5. products テーブルに不足カラム追加
-- =============================================
ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);
ALTER TABLE products ADD COLUMN subcategory_id INTEGER REFERENCES subcategories(id);
ALTER TABLE products ADD COLUMN maker_id INTEGER REFERENCES car_makers(id);
ALTER TABLE products ADD COLUMN model_id INTEGER REFERENCES car_models(id);
ALTER TABLE products ADD COLUMN part_number TEXT;
ALTER TABLE products ADD COLUMN compatible_models TEXT;
ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN favorite_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN is_proxy BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN seller_id INTEGER;

-- 既存データのview_count/favorite_countをviewsとlikesから移行
UPDATE products SET view_count = views WHERE views > 0;
UPDATE products SET favorite_count = likes WHERE likes > 0;
-- seller_idをuser_idからコピー
UPDATE products SET seller_id = user_id WHERE seller_id IS NULL;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_maker_id ON products(maker_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- =============================================
-- 6. users テーブルに不足カラム追加
-- =============================================
ALTER TABLE users ADD COLUMN shop_type TEXT DEFAULT 'individual';
ALTER TABLE users ADD COLUMN rating REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN total_sales INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_transactions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN postal_code TEXT;
ALTER TABLE users ADD COLUMN prefecture TEXT;
ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;

-- =============================================
-- 7. notifications テーブルに不足カラム追加
-- =============================================
ALTER TABLE notifications ADD COLUMN related_id INTEGER;
ALTER TABLE notifications ADD COLUMN related_type TEXT;
ALTER TABLE notifications ADD COLUMN action_url TEXT;
