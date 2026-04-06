-- 請求書払い（銀行振込）対応
-- transactionsテーブルに支払い方法と請求書関連カラムを追加

-- 支払い方法 (card = Stripe決済, invoice = 請求書払い/銀行振込)
ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'card';

-- 請求書番号 (INV-20260406-0001 形式)
ALTER TABLE transactions ADD COLUMN invoice_number TEXT;

-- 振込期限
ALTER TABLE transactions ADD COLUMN invoice_due_date DATETIME;

-- 振込確認日時
ALTER TABLE transactions ADD COLUMN transfer_confirmed_at DATETIME;

-- 振込確認した管理者メモ
ALTER TABLE transactions ADD COLUMN transfer_note TEXT;

-- 購入者の請求先情報（JSON: company_name, address, contact_name, email, phone）
ALTER TABLE transactions ADD COLUMN billing_info TEXT;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_number ON transactions(invoice_number);
