-- ユーザーテーブルに銀行口座情報とその他のフィールドを追加
ALTER TABLE users ADD COLUMN bank_name TEXT;
ALTER TABLE users ADD COLUMN branch_name TEXT;
ALTER TABLE users ADD COLUMN account_type TEXT;
ALTER TABLE users ADD COLUMN account_number TEXT;
ALTER TABLE users ADD COLUMN account_holder TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN profile_image_url TEXT;
