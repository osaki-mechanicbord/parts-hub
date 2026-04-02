-- レビュー・バッジシステム拡張
-- reviewsテーブルに詳細評価カラムを追加（存在しない場合のみ）

-- 商品状態評価
ALTER TABLE reviews ADD COLUMN product_condition_rating INTEGER CHECK(product_condition_rating >= 1 AND product_condition_rating <= 5);
-- コミュニケーション評価
ALTER TABLE reviews ADD COLUMN communication_rating INTEGER CHECK(communication_rating >= 1 AND communication_rating <= 5);
-- 配送評価
ALTER TABLE reviews ADD COLUMN shipping_rating INTEGER CHECK(shipping_rating >= 1 AND shipping_rating <= 5);
-- 商品ID（冗長だがクエリ高速化用）
ALTER TABLE reviews ADD COLUMN product_id INTEGER REFERENCES products(id);
-- reviewed_user_id エイリアス（routesとの互換性）
ALTER TABLE reviews ADD COLUMN reviewed_user_id INTEGER REFERENCES users(id);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
