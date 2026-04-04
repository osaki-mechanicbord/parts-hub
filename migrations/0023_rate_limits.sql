-- レートリミット用テーブル
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expire_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expire ON rate_limits(expire_at);
