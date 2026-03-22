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

    return c.json({
      totalSales: currentMonthSales?.total || 0,
      salesGrowth: lastMonthSales?.total ? 
        ((currentMonthSales?.total - lastMonthSales?.total) / lastMonthSales?.total * 100).toFixed(1) : 0,
      newUsers: newUsers?.count || 0,
      usersGrowth: lastMonthNewUsers?.count ?
        ((newUsers?.count - lastMonthNewUsers?.count) / lastMonthNewUsers?.count * 100).toFixed(1) : 0,
      totalProducts: totalProducts?.count || 0,
      totalTransactions: totalTransactions?.count || 0,
      transactionsGrowth: lastMonthTransactions?.count ?
        ((totalTransactions?.count - lastMonthTransactions?.count) / lastMonthTransactions?.count * 100).toFixed(1) : 0
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
      LEFT JOIN comments c ON p.id = c.product_id
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

    const totalFees = Math.floor((currentMonth?.totalSales || 0) * 0.07);

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

export default adminRoutes
