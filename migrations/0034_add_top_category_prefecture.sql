-- Add top_category and prefecture columns to products table
-- top_category: 大枠カテゴリ（TOPページのタブ用）
-- prefecture: エリア（全国 or 47都道府県）

ALTER TABLE products ADD COLUMN top_category TEXT DEFAULT 'other';
ALTER TABLE products ADD COLUMN prefecture TEXT DEFAULT 'all';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_products_top_category ON products(top_category);
CREATE INDEX IF NOT EXISTS idx_products_prefecture ON products(prefecture);
