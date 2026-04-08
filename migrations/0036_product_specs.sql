-- 出品商品に製品仕様フィールドを追加
-- 既存: manufacturer (メーカー名), part_number (品番)
-- 新規: jan_code (JANコード), product_number (製品番号), manufacturer_url (メーカーページリンク)

ALTER TABLE products ADD COLUMN jan_code TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN product_number TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN manufacturer_url TEXT DEFAULT NULL;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_products_jan_code ON products(jan_code);
