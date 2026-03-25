-- ユーザーテーブルにニックネームフィールドを追加
-- nickname: 他のユーザーに表示される名前（任意設定、未設定の場合はnameの一部を表示）
ALTER TABLE users ADD COLUMN nickname TEXT;
