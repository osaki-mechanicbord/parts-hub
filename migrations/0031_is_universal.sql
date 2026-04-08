-- 全車種対応（汎用品）フラグ
ALTER TABLE products ADD COLUMN is_universal INTEGER DEFAULT 0 CHECK(is_universal IN (0, 1));
CREATE INDEX IF NOT EXISTS idx_products_is_universal ON products(is_universal);
