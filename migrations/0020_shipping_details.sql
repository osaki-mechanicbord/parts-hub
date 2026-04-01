-- 発送詳細フィールド追加
-- 配送業者
ALTER TABLE transactions ADD COLUMN shipping_carrier TEXT;
-- 配送メモ（梱包サイズ、到着予定日等）
ALTER TABLE transactions ADD COLUMN shipping_note TEXT;
-- 配送先住所（購入時にスナップショット保存）
ALTER TABLE transactions ADD COLUMN shipping_address TEXT;
-- 配送先名前
ALTER TABLE transactions ADD COLUMN shipping_name TEXT;
-- 配送先電話番号
ALTER TABLE transactions ADD COLUMN shipping_phone TEXT;
-- 配送先郵便番号
ALTER TABLE transactions ADD COLUMN shipping_postal_code TEXT;
