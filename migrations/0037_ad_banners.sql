-- バナー広告テーブル
CREATE TABLE IF NOT EXISTS ad_banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                    -- バナー管理名（CMS表示用）
  image_url TEXT NOT NULL,                -- バナー画像URL（R2パス）
  image_key TEXT,                         -- R2オブジェクトキー（削除時に使用）
  link_url TEXT DEFAULT '',               -- クリック時の遷移先URL（空=リンクなし）
  display_order INTEGER DEFAULT 0,        -- 表示順（小さい順）
  is_active INTEGER DEFAULT 1,            -- 1=表示中, 0=非表示
  width INTEGER DEFAULT 1200,             -- バナー推奨横幅(px)
  height INTEGER DEFAULT 400,             -- バナー推奨高さ(px)
  placement TEXT DEFAULT 'top',           -- 表示位置 (top=TOPページ)
  start_date TEXT,                        -- 表示開始日時 (ISO8601, NULLなら即時)
  end_date TEXT,                          -- 表示終了日時 (ISO8601, NULLなら無期限)
  click_count INTEGER DEFAULT 0,          -- クリック数（簡易計測）
  view_count INTEGER DEFAULT 0,           -- 表示回数（簡易計測）
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- インデックス: アクティブバナーの高速取得
CREATE INDEX IF NOT EXISTS idx_ad_banners_active ON ad_banners(is_active, placement, display_order);
