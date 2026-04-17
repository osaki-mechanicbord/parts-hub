-- 海外販売OK/NG選択肢を追加
-- デフォルト0（海外販売NG）- お客様が出品時に明示的にOKを選択する必要がある
ALTER TABLE products ADD COLUMN overseas_ok INTEGER DEFAULT 0;

-- 海外販売OKの商品を高速検索するためのインデックス
CREATE INDEX IF NOT EXISTS idx_products_overseas_ok ON products(overseas_ok);
