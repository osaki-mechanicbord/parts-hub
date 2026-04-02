-- レビュー・バッジシステム拡張（冪等: 既存カラムがあっても安全）
-- reviewed_user_id エイリアス（routesとの互換性）
-- ALTER TABLE は IF NOT EXISTS 非対応のため、エラーは --remote で個別実行する

-- インデックス追加（IF NOT EXISTS対応）
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
