-- 下書き(draft)とパーズ(paused)ステータスを追加
-- SQLiteではCHECK制約の変更にテーブル再作成が必要
-- D1リモートではPRAGMA foreign_keys = OFFが使えないため、
-- FOREIGN KEY制約を宣言しないテーブルを作成（参照整合性はアプリ層で担保）

-- 1. 新テーブルを作成（draft, paused を追加した CHECK制約、FK宣言なし）
CREATE TABLE products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  condition TEXT,
  manufacturer TEXT,
  model TEXT,
  year INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'suspended', 'deleted', 'draft', 'paused')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  slug TEXT,
  category_id INTEGER,
  subcategory_id INTEGER,
  maker_id INTEGER,
  model_id INTEGER,
  part_number TEXT,
  compatible_models TEXT,
  stock_quantity INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  is_proxy BOOLEAN DEFAULT 0,
  seller_id INTEGER,
  vm_maker TEXT,
  vm_model TEXT,
  vm_grade TEXT,
  vm_tire_size TEXT,
  shipping_type TEXT DEFAULT 'buyer_paid' CHECK(shipping_type IN ('seller_paid', 'buyer_paid')),
  is_universal INTEGER DEFAULT 0 CHECK(is_universal IN (0, 1))
);

-- 2. データをコピー
INSERT INTO products_new SELECT * FROM products;

-- 3. 旧テーブルを削除
DROP TABLE products;

-- 4. 新テーブルをリネーム
ALTER TABLE products_new RENAME TO products;

-- 5. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vm_maker ON products(vm_maker);
CREATE INDEX IF NOT EXISTS idx_products_vm_model ON products(vm_model);
