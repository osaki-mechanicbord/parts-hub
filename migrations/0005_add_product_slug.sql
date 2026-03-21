-- 商品テーブルにslugカラムを追加（SEO対応）
-- slug: URL用のユニークな識別子（例: "brake-pad-toyota-2015-abc123"）

ALTER TABLE products ADD COLUMN slug TEXT;

-- ユニークインデックスを追加（重複防止）
CREATE UNIQUE INDEX idx_products_slug ON products(slug);

-- 既存商品にスラッグを自動生成（idベース）
UPDATE products 
SET slug = LOWER(
    REPLACE(
        REPLACE(
            REPLACE(title, ' ', '-'),
            '　', '-'
        ),
        '--', '-'
    ) || '-' || id
)
WHERE slug IS NULL;
