import { Hono } from 'hono'

type Bindings = {
  DB: D1Database;
}

const adminRoutes = new Hono<{ Bindings: Bindings }>()

// 統計データ取得
adminRoutes.get('/stats', async (c) => {
  const { env } = c;
  
  try {
    // 今月の日付範囲
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // 今月の総売上
    const currentMonthSales = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE status = 'completed'
      AND created_at >= ?
    `).bind(firstDayOfMonth.toISOString()).first();

    // 先月の総売上
    const lastMonthSales = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE status = 'completed'
      AND created_at >= ? AND created_at < ?
    `).bind(firstDayOfLastMonth.toISOString(), firstDayOfMonth.toISOString()).first();

    // 新規ユーザー数（今月）
    const newUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= ?
    `).bind(firstDayOfMonth.toISOString()).first();

    // 新規ユーザー数（先月）
    const lastMonthNewUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= ? AND created_at < ?
    `).bind(firstDayOfLastMonth.toISOString(), firstDayOfMonth.toISOString()).first();

    // 出品中の商品数
    const totalProducts = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE status = 'active'
    `).first();

    // 取引数（今月）
    const totalTransactions = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE created_at >= ?
    `).bind(firstDayOfMonth.toISOString()).first();

    // 取引数（先月）
    const lastMonthTransactions = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE created_at >= ? AND created_at < ?
    `).bind(firstDayOfLastMonth.toISOString(), firstDayOfMonth.toISOString()).first();

    // 総ユーザー数
    const totalUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();

    // 月次売上データ（過去12ヶ月）
    const monthlySalesData = [];
    const monthlyUsersData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthSales = await env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE status = 'completed'
        AND created_at >= ? AND created_at < ?
      `).bind(monthStart.toISOString(), monthEnd.toISOString()).first();
      
      const monthUsers = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE created_at >= ? AND created_at < ?
      `).bind(monthStart.toISOString(), monthEnd.toISOString()).first();
      
      monthlySalesData.push(monthSales?.total || 0);
      monthlyUsersData.push(monthUsers?.count || 0);
    }

    return c.json({
      totalSales: currentMonthSales?.total || 0,
      salesGrowth: lastMonthSales?.total ? 
        ((currentMonthSales?.total - lastMonthSales?.total) / lastMonthSales?.total * 100).toFixed(1) : 0,
      totalUsers: totalUsers?.count || 0,
      newUsers: newUsers?.count || 0,
      usersGrowth: lastMonthNewUsers?.count ?
        ((newUsers?.count - lastMonthNewUsers?.count) / lastMonthNewUsers?.count * 100).toFixed(1) : 0,
      totalProducts: totalProducts?.count || 0,
      totalTransactions: totalTransactions?.count || 0,
      transactionsGrowth: lastMonthTransactions?.count ?
        ((totalTransactions?.count - lastMonthTransactions?.count) / lastMonthTransactions?.count * 100).toFixed(1) : 0,
      monthlySales: monthlySalesData,
      monthlyUsers: monthlyUsersData
    });
  } catch (error) {
    console.error('統計データ取得エラー:', error);
    return c.json({ error: '統計データの取得に失敗しました' }, 500);
  }
});

// 最近の取引
adminRoutes.get('/transactions/recent', async (c) => {
  const { env } = c;
  
  try {
    const transactions = await env.DB.prepare(`
      SELECT 
        t.id,
        t.amount,
        t.status,
        t.created_at,
        p.title as product_title,
        buyer.name as buyer_name,
        seller.name as seller_name
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN users seller ON t.seller_id = seller.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all();

    return c.json(transactions.results || []);
  } catch (error) {
    console.error('最近の取引取得エラー:', error);
    return c.json({ error: '取引データの取得に失敗しました' }, 500);
  }
});

// 最近の登録ユーザー
adminRoutes.get('/users/recent', async (c) => {
  const { env } = c;
  
  try {
    const users = await env.DB.prepare(`
      SELECT id, name, email, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    return c.json(users.results || []);
  } catch (error) {
    console.error('最近のユーザー取得エラー:', error);
    return c.json({ error: 'ユーザーデータの取得に失敗しました' }, 500);
  }
});

// 要対応事項（アラート）
adminRoutes.get('/alerts', async (c) => {
  const { env } = c;
  
  try {
    const alerts = [];

    // 未承認の商品
    const pendingProducts = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE status = 'pending'
    `).first();

    if (pendingProducts && pendingProducts.count > 0) {
      alerts.push({
        priority: 'high',
        title: '未承認の商品があります',
        message: `${pendingProducts.count}件の商品が承認待ちです`,
        link: '/admin/products?status=pending'
      });
    }

    // 通報された商品
    const reportedProducts = await env.DB.prepare(`
      SELECT COUNT(DISTINCT product_id) as count
      FROM reports
      WHERE status = 'pending'
    `).first();

    if (reportedProducts && reportedProducts.count > 0) {
      alerts.push({
        priority: 'high',
        title: '通報された商品があります',
        message: `${reportedProducts.count}件の商品が通報されています`,
        link: '/admin/reports'
      });
    }

    // 取引トラブル
    const problemTransactions = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE status = 'dispute'
    `).first();

    if (problemTransactions && problemTransactions.count > 0) {
      alerts.push({
        priority: 'high',
        title: '取引トラブルが発生しています',
        message: `${problemTransactions.count}件の取引でトラブルが報告されています`,
        link: '/admin/transactions?status=dispute'
      });
    }

    // 出金申請
    const pendingWithdrawals = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM withdrawals
      WHERE status = 'pending'
    `).first();

    if (pendingWithdrawals && pendingWithdrawals.count > 0) {
      alerts.push({
        priority: 'medium',
        title: '出金申請があります',
        message: `${pendingWithdrawals.count}件の出金申請が承認待ちです`,
        link: '/admin/withdrawals'
      });
    }

    return c.json(alerts);
  } catch (error) {
    console.error('アラート取得エラー:', error);
    return c.json({ error: 'アラートの取得に失敗しました' }, 500);
  }
});

// ユーザー一覧
adminRoutes.get('/users', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;
  
  try {
    const users = await env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.status,
        u.created_at,
        COUNT(DISTINCT p.id) as products_count,
        COUNT(DISTINCT t.id) as transactions_count
      FROM users u
      LEFT JOIN products p ON u.id = p.user_id
      LEFT JOIN transactions t ON u.id = t.buyer_id OR u.id = t.seller_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const total = await env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first();

    return c.json({
      users: users.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return c.json({ error: 'ユーザー一覧の取得に失敗しました' }, 500);
  }
});

// 商品一覧
adminRoutes.get('/products', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const status = c.req.query('status');
  const limit = 50;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT 
        p.id,
        p.title,
        p.price,
        p.status,
        p.created_at,
        u.name as seller_name,
        COUNT(DISTINCT f.id) as favorites_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN favorites f ON p.id = f.product_id
      LEFT JOIN product_comments c ON p.id = c.product_id
    `;

    if (status) {
      query += ` WHERE p.status = ?`;
    }

    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = env.DB.prepare(query);
    const products = status ? 
      await stmt.bind(status, limit, offset).all() :
      await stmt.bind(limit, offset).all();

    let countQuery = 'SELECT COUNT(*) as count FROM products';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const countStmt = env.DB.prepare(countQuery);
    const total = status ? 
      await countStmt.bind(status).first() :
      await countStmt.first();

    return c.json({
      products: products.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    console.error('商品一覧取得エラー:', error);
    return c.json({ error: '商品一覧の取得に失敗しました' }, 500);
  }
});

// 商品ステータス更新
adminRoutes.put('/products/:id/status', async (c) => {
  const { env } = c;
  const productId = c.req.param('id');
  const { status } = await c.req.json();
  
  try {
    await env.DB.prepare(`
      UPDATE products
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, productId).run();

    return c.json({ success: true, message: '商品ステータスを更新しました' });
  } catch (error) {
    console.error('商品ステータス更新エラー:', error);
    return c.json({ error: '商品ステータスの更新に失敗しました' }, 500);
  }
});

// 商品削除
adminRoutes.delete('/products/:id', async (c) => {
  const { env } = c;
  const productId = c.req.param('id');
  
  try {
    await env.DB.prepare(`
      DELETE FROM products
      WHERE id = ?
    `).bind(productId).run();

    return c.json({ success: true, message: '商品を削除しました' });
  } catch (error) {
    console.error('商品削除エラー:', error);
    return c.json({ error: '商品の削除に失敗しました' }, 500);
  }
});

// ユーザーステータス更新
adminRoutes.put('/users/:id/status', async (c) => {
  const { env } = c;
  const userId = c.req.param('id');
  const { status } = await c.req.json();
  
  try {
    await env.DB.prepare(`
      UPDATE users
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, userId).run();

    return c.json({ success: true, message: 'ユーザーステータスを更新しました' });
  } catch (error) {
    console.error('ユーザーステータス更新エラー:', error);
    return c.json({ error: 'ユーザーステータスの更新に失敗しました' }, 500);
  }
});

// 取引一覧
adminRoutes.get('/transactions', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const status = c.req.query('status');
  const limit = 50;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT 
        t.id,
        t.amount,
        t.status,
        t.created_at,
        p.title as product_title,
        buyer.name as buyer_name,
        seller.name as seller_name
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN users seller ON t.seller_id = seller.id
    `;

    if (status) {
      query += ` WHERE t.status = ?`;
    }

    query += `
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = env.DB.prepare(query);
    const transactions = status ? 
      await stmt.bind(status, limit, offset).all() :
      await stmt.bind(limit, offset).all();

    let countQuery = 'SELECT COUNT(*) as count FROM transactions';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const countStmt = env.DB.prepare(countQuery);
    const total = status ? 
      await countStmt.bind(status).first() :
      await countStmt.first();

    return c.json({
      transactions: transactions.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    console.error('取引一覧取得エラー:', error);
    return c.json({ error: '取引一覧の取得に失敗しました' }, 500);
  }
});

// 取引ステータス更新
adminRoutes.put('/transactions/:id/status', async (c) => {
  const { env } = c;
  const transactionId = c.req.param('id');
  const { status } = await c.req.json();
  
  try {
    await env.DB.prepare(`
      UPDATE transactions
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, transactionId).run();

    return c.json({ success: true, message: '取引ステータスを更新しました' });
  } catch (error) {
    console.error('取引ステータス更新エラー:', error);
    return c.json({ error: '取引ステータスの更新に失敗しました' }, 500);
  }
});

// レビュー一覧
adminRoutes.get('/reviews', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const rating = c.req.query('rating');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.transaction_id,
        reviewer.name as reviewer_name,
        reviewee.name as reviewee_name
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
    `;

    if (rating) {
      query += ` WHERE r.rating = ?`;
    }

    query += `
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = env.DB.prepare(query);
    const reviews = rating ? 
      await stmt.bind(parseInt(rating), limit, offset).all() :
      await stmt.bind(limit, offset).all();

    let countQuery = 'SELECT COUNT(*) as count FROM reviews';
    if (rating) {
      countQuery += ' WHERE rating = ?';
    }
    const countStmt = env.DB.prepare(countQuery);
    const total = rating ? 
      await countStmt.bind(parseInt(rating)).first() :
      await countStmt.first();

    return c.json({
      reviews: reviews.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    console.error('レビュー一覧取得エラー:', error);
    return c.json({ error: 'レビュー一覧の取得に失敗しました' }, 500);
  }
});

// レビュー削除
adminRoutes.delete('/reviews/:id', async (c) => {
  const { env } = c;
  const reviewId = c.req.param('id');
  
  try {
    await env.DB.prepare(`
      DELETE FROM reviews
      WHERE id = ?
    `).bind(reviewId).run();

    return c.json({ success: true, message: 'レビューを削除しました' });
  } catch (error) {
    console.error('レビュー削除エラー:', error);
    return c.json({ error: 'レビューの削除に失敗しました' }, 500);
  }
});

// 通報一覧
adminRoutes.get('/reports', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const status = c.req.query('status');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT 
        r.id,
        r.reason,
        r.description,
        r.status,
        r.created_at,
        r.product_id,
        reporter.name as reporter_name,
        p.title as product_title
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN products p ON r.product_id = p.id
    `;

    if (status) {
      query += ` WHERE r.status = ?`;
    }

    query += `
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = env.DB.prepare(query);
    const reports = status ? 
      await stmt.bind(status, limit, offset).all() :
      await stmt.bind(limit, offset).all();

    let countQuery = 'SELECT COUNT(*) as count FROM reports';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const countStmt = env.DB.prepare(countQuery);
    const total = status ? 
      await countStmt.bind(status).first() :
      await countStmt.first();

    return c.json({
      reports: reports.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    console.error('通報一覧取得エラー:', error);
    return c.json({ error: '通報一覧の取得に失敗しました' }, 500);
  }
});

// 通報ステータス更新
adminRoutes.put('/reports/:id/status', async (c) => {
  const { env } = c;
  const reportId = c.req.param('id');
  const { status } = await c.req.json();
  
  try {
    await env.DB.prepare(`
      UPDATE reports
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, reportId).run();

    return c.json({ success: true, message: '通報ステータスを更新しました' });
  } catch (error) {
    console.error('通報ステータス更新エラー:', error);
    return c.json({ error: '通報ステータスの更新に失敗しました' }, 500);
  }
});

// 売上レポート
adminRoutes.get('/sales', async (c) => {
  const { env } = c;
  
  try {
    // 今月の売上統計
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentMonth = await env.DB.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as totalSales
      FROM transactions
      WHERE status = 'completed'
      AND created_at >= ?
    `).bind(firstDayOfMonth.toISOString()).first();

    const totalFees = Math.floor((currentMonth?.totalSales || 0) * 0.10);

    // 過去12ヶ月の月別売上
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthSales = await env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as sales
        FROM transactions
        WHERE status = 'completed'
        AND created_at >= ? AND created_at < ?
      `).bind(monthStart.toISOString(), monthEnd.toISOString()).first();
      
      monthlyData.push({
        month: monthStart.getMonth() + 1,
        sales: monthSales?.sales || 0
      });
    }

    // 最近の取引
    const recentTransactions = await env.DB.prepare(`
      SELECT 
        t.id,
        t.amount,
        t.created_at,
        p.title as product_title
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.status = 'completed'
      ORDER BY t.created_at DESC
      LIMIT 20
    `).all();

    return c.json({
      currentMonth: {
        count: currentMonth?.count || 0,
        totalSales: currentMonth?.totalSales || 0,
        totalFees
      },
      monthlyData,
      recentTransactions: recentTransactions.results || []
    });
  } catch (error) {
    console.error('売上レポート取得エラー:', error);
    return c.json({ error: '売上レポートの取得に失敗しました' }, 500);
  }
});

// ===== コラム管理API =====

// コラム一覧取得（管理画面用 - 全ステータス）
adminRoutes.get('/articles', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const status = c.req.query('status');
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT * FROM articles WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const articles = await env.DB.prepare(query).bind(...params).all();

    let countQuery = `SELECT COUNT(*) as count FROM articles WHERE 1=1`;
    if (status) {
      countQuery += ` AND status = ?`;
    }
    const countParams = status ? [status] : [];
    const total = await env.DB.prepare(countQuery).bind(...countParams).first();

    return c.json({
      articles: articles.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    console.error('コラム一覧取得エラー:', error);
    return c.json({ error: 'コラム一覧の取得に失敗しました' }, 500);
  }
});

// コラム作成
adminRoutes.post('/articles', async (c) => {
  const { env } = c;
  const { title, slug, summary, content, thumbnail_url, category, tags, status, is_featured } = await c.req.json();

  try {
    // slugの重複チェック
    const existing = await env.DB.prepare(`
      SELECT id FROM articles WHERE slug = ?
    `).bind(slug).first();

    if (existing) {
      return c.json({ error: 'このスラッグは既に使用されています' }, 400);
    }

    const published_at = status === 'published' ? new Date().toISOString() : null;

    const result = await env.DB.prepare(`
      INSERT INTO articles (title, slug, summary, content, thumbnail_url, category, tags, status, is_featured, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(title, slug, summary, content, thumbnail_url, category || 'general', tags, status || 'draft', is_featured ? 1 : 0, published_at).run();

    return c.json({ 
      success: true, 
      message: 'コラムを作成しました',
      id: result.meta.last_row_id
    });
  } catch (error) {
    console.error('コラム作成エラー:', error);
    return c.json({ error: 'コラムの作成に失敗しました' }, 500);
  }
});

// コラム更新
adminRoutes.put('/articles/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  const { title, slug, summary, content, thumbnail_url, category, tags, status, is_featured } = await c.req.json();

  try {
    // 現在の記事を取得
    const currentArticle = await env.DB.prepare(`
      SELECT * FROM articles WHERE id = ?
    `).bind(id).first();

    if (!currentArticle) {
      return c.json({ error: 'コラムが見つかりません' }, 404);
    }

    // slugが変更されている場合、重複チェック
    if (slug !== currentArticle.slug) {
      const existing = await env.DB.prepare(`
        SELECT id FROM articles WHERE slug = ? AND id != ?
      `).bind(slug, id).first();

      if (existing) {
        return c.json({ error: 'このスラッグは既に使用されています' }, 400);
      }
    }

    // 下書きから公開に変更する場合、published_atを設定
    let published_at = currentArticle.published_at;
    if (status === 'published' && currentArticle.status !== 'published' && !published_at) {
      published_at = new Date().toISOString();
    }

    await env.DB.prepare(`
      UPDATE articles
      SET title = ?, slug = ?, summary = ?, content = ?, thumbnail_url = ?, 
          category = ?, tags = ?, status = ?, is_featured = ?, published_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title, slug, summary, content, thumbnail_url, category, tags, status, is_featured ? 1 : 0, published_at, id).run();

    return c.json({ 
      success: true, 
      message: 'コラムを更新しました'
    });
  } catch (error) {
    console.error('コラム更新エラー:', error);
    return c.json({ error: 'コラムの更新に失敗しました' }, 500);
  }
});

// コラム削除
adminRoutes.delete('/articles/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');

  try {
    await env.DB.prepare(`
      DELETE FROM articles WHERE id = ?
    `).bind(id).run();

    return c.json({ 
      success: true, 
      message: 'コラムを削除しました'
    });
  } catch (error) {
    console.error('コラム削除エラー:', error);
    return c.json({ error: 'コラムの削除に失敗しました' }, 500);
  }
});

// コラム自動生成API（OpenAI使用）
adminRoutes.post('/articles/generate', async (c) => {
  const { env } = c;
  const { topic, category } = await c.req.json();

  try {
    // OpenAI APIキーの確認
    const openaiApiKey = c.env?.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI APIキーが設定されていません' }, 500);
    }

    // OpenAI APIを呼び出してコラムを生成
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは自動車パーツ専門のライターです。SEOに最適化された、読みやすく有益なコラム記事を作成してください。'
          },
          {
            role: 'user',
            content: `以下のトピックについて、自動車パーツの売買プラットフォーム「PARTS HUB」のコラム記事を書いてください：

トピック: ${topic}
カテゴリ: ${category || '一般'}

以下のJSON形式で出力してください：
{
  "title": "記事タイトル（40文字以内、SEO最適化）",
  "slug": "url-friendly-slug",
  "summary": "記事の要約（120文字以内）",
  "content": "記事本文（HTMLタグ使用可、見出しはh2/h3、段落はp、リストはul/li）",
  "tags": "タグ1,タグ2,タグ3"
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API呼び出しに失敗しました');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // JSONをパース
    const articleData = JSON.parse(generatedContent);

    return c.json({
      success: true,
      article: {
        ...articleData,
        category: category || 'general',
        status: 'draft'
      }
    });
  } catch (error) {
    console.error('コラム自動生成エラー:', error);
    return c.json({ error: 'コラムの自動生成に失敗しました: ' + (error as Error).message }, 500);
  }
});

// 自動投稿API（画像生成付き）
adminRoutes.post('/articles/auto-generate-with-image', async (c) => {
  const { env } = c;
  
  try {
    // OpenAI APIキーの確認
    const openaiApiKey = env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI APIキーが設定されていません' }, 500);
    }

    // トピック候補（トレンド風キーワード）
    const topics = [
      // ブレーキ関連
      '最新ブレーキパッドの選び方と性能比較2026',
      'ブレーキディスク交換のタイミングと費用完全ガイド',
      'ブレーキフルード交換の重要性と適切な時期',
      
      // エンジン関連
      'エンジンオイルの種類と選び方完全ガイド',
      'スパークプラグ交換で燃費改善する方法',
      'エアフィルター交換で得られる5つのメリット',
      'タイミングベルト交換の最適な時期と費用',
      
      // サスペンション・足回り
      'ショックアブソーバー交換で乗り心地を劇的改善',
      'スタビライザーの役割と交換時期の見極め方',
      'ブッシュ類の劣化症状と効果的な対策',
      
      // タイヤ・ホイール
      '2026年版！夏タイヤと冬タイヤの選び方',
      'アルミホイールの種類とメリット徹底解説',
      'タイヤローテーションの重要性と正しい方法',
      
      // バッテリー・電装系
      'カーバッテリーの寿命と交換時期の判断基準',
      'HIDとLEDヘッドライトの徹底比較',
      'オルタネーター故障の症状と早期発見のコツ',
      
      // エアコン関連
      'カーエアコンフィルター交換の効果と頻度',
      'エアコンガス補充の適切なタイミング',
      
      // マフラー・排気系
      'マフラー交換で燃費と性能をアップする方法',
      '触媒コンバーター故障の診断と対処法',
      
      // 内装・外装
      'ワイパーブレード交換の目安と選び方',
      'ドアミラー修理・交換完全ガイド',
      'シートカバー選びの5つのポイント',
      
      // メンテナンス
      'DIYで車検費用を3万円節約する方法',
      '定期点検で愛車を長持ちさせる10のコツ',
      '中古パーツの賢い選び方と注意すべきポイント',
      
      // 季節・トレンド
      '梅雨対策！雨の日に必須のカーパーツ5選',
      '2026年夏！暑さ対策カーアクセサリーベスト5',
      '冬の寒さに備える車の準備チェックリスト',
      '花粉症対策！車内環境を改善するパーツ特集'
    ];
    
    const categories = [
      { id: 'parts-guide', name: 'パーツガイド' },
      { id: 'maintenance', name: 'メンテナンス' },
      { id: 'tips', name: 'お役立ち情報' }
    ];
    
    // ランダムに選択
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];

    console.log(`自動生成開始 - トピック: ${topic}, カテゴリ: ${category.name}`);

    // ステップ1: OpenAI APIでコラムを生成
    const articleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは自動車パーツ専門のライターです。SEOに最適化された、読みやすく有益なコラム記事を作成してください。'
          },
          {
            role: 'user',
            content: `以下のトピックについて、自動車パーツの売買プラットフォーム「PARTS HUB」のコラム記事を書いてください：

トピック: ${topic}
カテゴリ: ${category.name}

以下のJSON形式で出力してください（必ずJSONのみを出力し、それ以外の文字は含めないでください）：
{
  "title": "記事タイトル（40文字以内、SEO最適化）",
  "slug": "url-friendly-slug",
  "summary": "記事の要約（120文字以内）",
  "content": "記事本文（HTMLタグ使用可、見出しはh2/h3、段落はp、リストはul/li。最低800文字以上）",
  "tags": "タグ1,タグ2,タグ3"
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!articleResponse.ok) {
      throw new Error('OpenAI API呼び出しに失敗しました');
    }

    const articleData = await articleResponse.json();
    const content = articleData.choices[0].message.content;
    
    // JSONを抽出（マークダウンコードブロックを削除）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSONの抽出に失敗しました');
    }
    
    const article = JSON.parse(jsonMatch[0]);

    console.log(`記事生成完了: ${article.title}`);

    // ステップ2: DALL-E 3でアイキャッチ画像を生成
    const imagePrompt = `Professional automotive parts blog header image about ${topic}. Clean, modern design with car parts. High quality, photorealistic style.`;
    
    console.log(`画像生成開始: ${imagePrompt}`);
    
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
        style: 'natural'
      })
    });

    if (!imageResponse.ok) {
      console.error('画像生成に失敗しましたが、記事は生成されました');
    }

    let thumbnailUrl = '';
    try {
      const imageData = await imageResponse.json();
      const tempImageUrl = imageData.data[0].url;
      console.log(`画像生成完了: ${tempImageUrl}`);
      
      // ステップ2.5: 画像をR2に永続保存
      try {
        // 画像をダウンロード
        const imageDownloadResponse = await fetch(tempImageUrl);
        if (!imageDownloadResponse.ok) {
          throw new Error('画像のダウンロードに失敗しました');
        }
        
        const imageBuffer = await imageDownloadResponse.arrayBuffer();
        
        // R2に保存するファイル名を生成（タイムスタンプ付き）
        const timestamp = Date.now();
        const imageFilename = `articles/${timestamp}.png`;
        
        // R2にアップロード
        await env.R2.put(imageFilename, imageBuffer, {
          httpMetadata: {
            contentType: 'image/png',
          },
        });
        
        // 公開URLを生成
        // R2_PUBLIC_URL環境変数がある場合はそれを使用、なければデフォルトURL
        const r2PublicUrl = env.R2_PUBLIC_URL || 'https://parts-hub-images.r2.dev';
        thumbnailUrl = `${r2PublicUrl}/${imageFilename}`;
        console.log(`画像をR2に保存: ${thumbnailUrl}`);
        
      } catch (r2Error) {
        console.error('R2への画像保存エラー:', r2Error);
        // R2保存に失敗した場合は、元のOpenAI URLを使用（2時間有効）
        thumbnailUrl = tempImageUrl;
      }
      
    } catch (err) {
      console.error('画像URL取得エラー:', err);
      // 画像生成に失敗した場合はプレースホルダーを使用
      thumbnailUrl = 'https://placehold.co/1792x1024/ef4444/ffffff?text=PARTS+HUB+NEWS';
    }

    // ステップ3: SEO最適化されたスラッグを生成
    const now = new Date();
    const dateStr = now.toISOString();
    
    // 日付部分を取得（YYYY-MM-DD形式）
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // SEO最適化されたスラッグ: カテゴリ/日付/キーワード
    // 例: parts-guide/2026/03/brake-pad-selection-guide
    const baseSlug = article.slug
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    const slug = `${category.id}/${year}/${month}/${baseSlug}`;
    
    const result = await env.DB.prepare(`
      INSERT INTO articles (
        title, slug, summary, content, thumbnail_url, category, tags, 
        status, is_featured, published_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?, ?)
    `).bind(
      article.title,
      slug,
      article.summary,
      article.content,
      thumbnailUrl,
      category.id,
      article.tags,
      dateStr,
      dateStr,
      dateStr
    ).run();

    console.log(`記事公開完了: ID ${result.meta.last_row_id}`);

    return c.json({
      success: true,
      article: {
        id: result.meta.last_row_id,
        title: article.title,
        slug: slug,
        summary: article.summary,
        thumbnail_url: thumbnailUrl,
        category: category.id,
        published_at: now
      },
      message: '記事が自動生成され、公開されました'
    });

  } catch (error) {
    console.error('自動投稿エラー:', error);
    return c.json({ 
      error: '自動投稿に失敗しました: ' + (error as Error).message,
      details: error instanceof Error ? error.stack : String(error)
    }, 500);
  }
});

export default adminRoutes
