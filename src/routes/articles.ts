import { Hono } from 'hono'

type Bindings = {
  DB: D1Database;
}

const articlesRoutes = new Hono<{ Bindings: Bindings }>()

// コラム一覧取得（公開記事のみ）
articlesRoutes.get('/', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '12');
  const category = c.req.query('category');
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        id, title, slug, summary, thumbnail_url, 
        category, tags, view_count, is_featured,
        published_at, created_at
      FROM articles
      WHERE status = 'published'
    `;

    const params = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const articles = await env.DB.prepare(query).bind(...params).all();

    // 総数取得
    let countQuery = `SELECT COUNT(*) as count FROM articles WHERE status = 'published'`;
    if (category) {
      countQuery += ` AND category = ?`;
    }
    const countParams = category ? [category] : [];
    const total = await env.DB.prepare(countQuery).bind(...countParams).first();

    return c.json({
      articles: articles.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    console.error('コラム一覧取得エラー:', error);
    return c.json({ error: 'コラムの取得に失敗しました' }, 500);
  }
});

// 注目記事取得
articlesRoutes.get('/featured', async (c) => {
  const { env } = c;
  const limit = parseInt(c.req.query('limit') || '3');

  try {
    const articles = await env.DB.prepare(`
      SELECT 
        id, title, slug, summary, thumbnail_url, 
        category, tags, view_count, is_featured,
        published_at, created_at
      FROM articles
      WHERE status = 'published' AND is_featured = 1
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({
      articles: articles.results || []
    });
  } catch (error) {
    console.error('注目記事取得エラー:', error);
    return c.json({ error: '注目記事の取得に失敗しました' }, 500);
  }
});

// コラム詳細取得（SEO URL対応: /api/articles/category/YYYY/MM/slug）
articlesRoutes.get('/:category/:year/:month/:slug', async (c) => {
  const { env } = c;
  const { category, year, month, slug } = c.req.param();
  const fullSlug = `${category}/${year}/${month}/${slug}`;

  try {
    const article = await env.DB.prepare(`
      SELECT * FROM articles
      WHERE slug = ? AND status = 'published'
    `).bind(fullSlug).first();

    if (!article) {
      return c.json({ error: 'コラムが見つかりません' }, 404);
    }

    // 閲覧数を増やす
    await env.DB.prepare(`
      UPDATE articles
      SET view_count = view_count + 1
      WHERE id = ?
    `).bind(article.id).run();

    // 関連記事を取得
    const relatedArticles = await env.DB.prepare(`
      SELECT 
        id, title, slug, summary, thumbnail_url, 
        category, published_at
      FROM articles
      WHERE status = 'published' 
        AND category = ? 
        AND id != ?
      ORDER BY published_at DESC
      LIMIT 3
    `).bind(article.category, article.id).all();

    return c.json({
      article,
      relatedArticles: relatedArticles.results || []
    });
  } catch (error) {
    console.error('コラム詳細取得エラー:', error);
    return c.json({ error: 'コラムの取得に失敗しました' }, 500);
  }
});

// コラム詳細取得（後方互換: /api/articles/:slug - 旧URL形式対応）
articlesRoutes.get('/:slug', async (c) => {
  const { env } = c;
  const slug = c.req.param('slug');

  try {
    // まずスラッグ完全一致で検索
    let article = await env.DB.prepare(`
      SELECT * FROM articles
      WHERE slug = ? AND status = 'published'
    `).bind(slug).first();

    // 見つからない場合、スラッグの末尾部分で検索（旧URL対応）
    if (!article) {
      article = await env.DB.prepare(`
        SELECT * FROM articles
        WHERE slug LIKE ? AND status = 'published'
        ORDER BY published_at DESC
        LIMIT 1
      `).bind(`%${slug}`).first();
    }

    if (!article) {
      return c.json({ error: 'コラムが見つかりません' }, 404);
    }

    // 閲覧数を増やす
    await env.DB.prepare(`
      UPDATE articles
      SET view_count = view_count + 1
      WHERE id = ?
    `).bind(article.id).run();

    // 関連記事を取得
    const relatedArticles = await env.DB.prepare(`
      SELECT 
        id, title, slug, summary, thumbnail_url, 
        category, published_at
      FROM articles
      WHERE status = 'published' 
        AND category = ? 
        AND id != ?
      ORDER BY published_at DESC
      LIMIT 3
    `).bind(article.category, article.id).all();

    return c.json({
      article,
      relatedArticles: relatedArticles.results || []
    });
  } catch (error) {
    console.error('コラム詳細取得エラー:', error);
    return c.json({ error: 'コラムの取得に失敗しました' }, 500);
  }
});

export default articlesRoutes
