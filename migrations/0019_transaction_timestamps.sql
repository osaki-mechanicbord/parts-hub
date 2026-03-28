-- 取引テーブルに日時・追跡番号フィールドを追加

-- 取引に日時フィールドを追加
ALTER TABLE transactions ADD COLUMN paid_at DATETIME;
ALTER TABLE transactions ADD COLUMN shipped_at DATETIME;
ALTER TABLE transactions ADD COLUMN completed_at DATETIME;
ALTER TABLE transactions ADD COLUMN cancelled_at DATETIME;
ALTER TABLE transactions ADD COLUMN tracking_number TEXT;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_transactions_paid_at ON transactions(paid_at);
