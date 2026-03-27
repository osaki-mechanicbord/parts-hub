-- 管理者設定テーブル
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期管理者認証情報（ログイン名: admin, パスワード: PartsHub2026!）
-- パスワードはbcryptハッシュ化して保存するが、初期値はプレーンテキストで挿入し、初回ログイン時にハッシュ化
INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_username', 'admin');
-- 初期パスワードはSHA-256ハッシュで保存（後でログイン時にbcryptに移行）
INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_password_hash', '__INITIAL_PLAIN__PartsHub2026!');
INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_initialized', 'false');
