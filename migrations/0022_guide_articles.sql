-- ガイド記事自動生成用テーブル
CREATE TABLE IF NOT EXISTS guide_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '実践ガイド',
  sections_json TEXT NOT NULL, -- JSON: [{heading, body}]
  comparison_json TEXT, -- JSON: [{item, dealer, parts_hub, savings}] nullable
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  template_type TEXT DEFAULT 'cost-comparison', -- テンプレートタイプ
  target_keyword TEXT, -- ターゲットキーワード
  meta_title TEXT,
  meta_description TEXT,
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_guide_status ON guide_articles(status);
CREATE INDEX IF NOT EXISTS idx_guide_slug ON guide_articles(slug);
CREATE INDEX IF NOT EXISTS idx_guide_category ON guide_articles(category);
