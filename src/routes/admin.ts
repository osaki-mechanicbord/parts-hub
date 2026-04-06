import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import * as bcrypt from 'bcryptjs'
import type { Context, Next } from 'hono'

// JST (UTC+9) ヘルパー関数
const JST_OFFSET = 9 * 60 * 60 * 1000;

function nowJST(): Date {
  return new Date(Date.now() + JST_OFFSET);
}

function toJSTISOString(date?: Date): string {
  const d = date || nowJST();
  return d.toISOString();
}

// JST基準で月初日をUTC ISOStringとして返す（DB比較用）
function jstMonthStartUTC(year: number, month: number): string {
  // JST月初日 00:00 = UTC前日 15:00
  const jstDate = new Date(Date.UTC(year, month, 1, 0, 0, 0) - JST_OFFSET);
  return jstDate.toISOString();
}

// JST基準の現在年月を取得
function jstNow() {
  const d = nowJST();
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

type Bindings = {
  DB: D1Database;
  ADMIN_API_KEY?: string;
  [key: string]: any;
}

const adminRoutes = new Hono<{ Bindings: Bindings }>()

// ===== 管理者認証ヘルパー =====

function getAdminJWTSecret(c: Context): string {
  return (c.env as any)?.JWT_SECRET || 'parts-hub-admin-secret-2026'
}

async function generateAdminToken(username: string, secret: string): Promise<string> {
  const payload = {
    sub: username,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 12), // 12時間有効
  }
  return await sign(payload, secret, 'HS256')
}

// 管理者認証ミドルウェア
async function adminAuthMiddleware(c: Context, next: Next) {
  // Cron Trigger / API Key認証（外部自動実行用）
  const apiKey = c.req.header('X-Admin-API-Key')
  if (apiKey && (c.env as any)?.ADMIN_API_KEY && apiKey === (c.env as any).ADMIN_API_KEY) {
    await next()
    return
  }

  // JWT認証（管理画面からのアクセス）
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '管理者認証が必要です' }, 401)
  }

  const token = authHeader.substring(7)
  const secret = getAdminJWTSecret(c)

  try {
    const payload = await verify(token, secret, 'HS256')
    if (payload.role !== 'admin') {
      return c.json({ success: false, error: '管理者権限がありません' }, 403)
    }
    c.set('adminUser', payload.sub)
    await next()
  } catch (error) {
    return c.json({ success: false, error: '管理者トークンが無効または期限切れです' }, 401)
  }
}

// ===== 認証不要エンドポイント =====

// 管理者ログイン
adminRoutes.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ success: false, error: 'ユーザー名とパスワードを入力してください' }, 400)
    }

    // DB から管理者情報を取得
    const storedUsername = await c.env.DB.prepare(
      `SELECT value FROM admin_settings WHERE key = 'admin_username'`
    ).first()
    const storedPasswordHash = await c.env.DB.prepare(
      `SELECT value FROM admin_settings WHERE key = 'admin_password_hash'`
    ).first()

    if (!storedUsername || !storedPasswordHash) {
      return c.json({ success: false, error: '管理者設定が初期化されていません' }, 500)
    }

    // ユーザー名チェック
    if (username !== storedUsername.value) {
      return c.json({ success: false, error: 'ユーザー名またはパスワードが正しくありません' }, 401)
    }

    // パスワードチェック
    const hashValue = storedPasswordHash.value as string
    let passwordValid = false

    if (hashValue.startsWith('__INITIAL_PLAIN__')) {
      // 初期パスワード（プレーンテキスト）
      const initialPassword = hashValue.replace('__INITIAL_PLAIN__', '')
      if (password === initialPassword) {
        passwordValid = true
        // 初回ログイン時にbcryptハッシュに移行
        const salt = await bcrypt.genSalt(10)
        const newHash = await bcrypt.hash(password, salt)
        await c.env.DB.prepare(
          `UPDATE admin_settings SET value = ?, updated_at = datetime('now') WHERE key = 'admin_password_hash'`
        ).bind(newHash).run()
        await c.env.DB.prepare(
          `UPDATE admin_settings SET value = 'true', updated_at = datetime('now') WHERE key = 'admin_initialized'`
        ).bind().run()
      }
    } else {
      // bcryptハッシュで検証
      passwordValid = await bcrypt.compare(password, hashValue)
    }

    if (!passwordValid) {
      return c.json({ success: false, error: 'ユーザー名またはパスワードが正しくありません' }, 401)
    }

    // JWTトークン生成
    const secret = getAdminJWTSecret(c)
    const token = await generateAdminToken(username, secret)

    return c.json({
      success: true,
      token,
      username,
      message: 'ログインしました'
    })
  } catch (error: any) {
    console.error('Admin login error:', error)
    return c.json({ success: false, error: 'ログインに失敗しました' }, 500)
  }
})

// ===== 以下、全て認証必須 =====
adminRoutes.use('/*', async (c, next) => {
  // login エンドポイントはスキップ
  const path = new URL(c.req.url).pathname
  if (path.endsWith('/admin/login') || path.endsWith('/login')) {
    await next()
    return
  }
  return adminAuthMiddleware(c, next)
})

// 管理者パスワード変更
adminRoutes.post('/change-password', async (c) => {
  try {
    const { current_password, new_password, new_username } = await c.req.json()

    if (!current_password) {
      return c.json({ success: false, error: '現在のパスワードを入力してください' }, 400)
    }

    // 現在のパスワードを検証
    const storedHash = await c.env.DB.prepare(
      `SELECT value FROM admin_settings WHERE key = 'admin_password_hash'`
    ).first()

    if (!storedHash) {
      return c.json({ success: false, error: '管理者設定が見つかりません' }, 500)
    }

    const hashValue = storedHash.value as string
    let currentValid = false

    if (hashValue.startsWith('__INITIAL_PLAIN__')) {
      currentValid = current_password === hashValue.replace('__INITIAL_PLAIN__', '')
    } else {
      currentValid = await bcrypt.compare(current_password, hashValue)
    }

    if (!currentValid) {
      return c.json({ success: false, error: '現在のパスワードが正しくありません' }, 401)
    }

    // ユーザー名変更
    if (new_username && new_username.length >= 3) {
      await c.env.DB.prepare(
        `UPDATE admin_settings SET value = ?, updated_at = datetime('now') WHERE key = 'admin_username'`
      ).bind(new_username).run()
    }

    // パスワード変更
    if (new_password) {
      if (new_password.length < 8) {
        return c.json({ success: false, error: 'パスワードは8文字以上で設定してください' }, 400)
      }
      const salt = await bcrypt.genSalt(10)
      const newHash = await bcrypt.hash(new_password, salt)
      await c.env.DB.prepare(
        `UPDATE admin_settings SET value = ?, updated_at = datetime('now') WHERE key = 'admin_password_hash'`
      ).bind(newHash).run()
    }

    return c.json({
      success: true,
      message: '管理者設定を変更しました。次回ログイン時から新しい設定が有効になります。'
    })
  } catch (error: any) {
    console.error('Change password error:', error)
    return c.json({ success: false, error: '設定変更に失敗しました' }, 500)
  }
})

// 管理者設定取得
adminRoutes.get('/settings', async (c) => {
  try {
    const username = await c.env.DB.prepare(
      `SELECT value FROM admin_settings WHERE key = 'admin_username'`
    ).first()
    const initialized = await c.env.DB.prepare(
      `SELECT value FROM admin_settings WHERE key = 'admin_initialized'`
    ).first()

    return c.json({
      success: true,
      username: username?.value || 'admin',
      initialized: initialized?.value === 'true'
    })
  } catch (error) {
    return c.json({ success: false, error: '設定取得に失敗しました' }, 500)
  }
})

// 統計データ取得
adminRoutes.get('/stats', async (c) => {
  const { env } = c;
  
  try {
    // 今月の日付範囲（JST基準）
    const { year, month } = jstNow();
    const firstDayOfMonth = jstMonthStartUTC(year, month);
    const firstDayOfLastMonth = jstMonthStartUTC(year, month - 1);
    
    // 今月の総売上
    const currentMonthSales = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE status = 'completed'
      AND created_at >= ?
    `).bind(firstDayOfMonth).first();

    // 先月の総売上
    const lastMonthSales = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE status = 'completed'
      AND created_at >= ? AND created_at < ?
    `).bind(firstDayOfLastMonth, firstDayOfMonth).first();

    // 新規ユーザー数（今月）
    const newUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= ?
    `).bind(firstDayOfMonth).first();

    // 新規ユーザー数（先月）
    const lastMonthNewUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= ? AND created_at < ?
    `).bind(firstDayOfLastMonth, firstDayOfMonth).first();

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
    `).bind(firstDayOfMonth).first();

    // 取引数（先月）
    const lastMonthTransactions = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE created_at >= ? AND created_at < ?
    `).bind(firstDayOfLastMonth, firstDayOfMonth).first();

    // 総ユーザー数
    const totalUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();

    // 月次売上データ（過去12ヶ月・JST基準）
    const monthlySalesData = [];
    const monthlyUsersData = [];
    for (let i = 11; i >= 0; i--) {
      const ms = jstMonthStartUTC(year, month - i);
      const me = jstMonthStartUTC(year, month - i + 1);
      
      const monthSales = await env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE status = 'completed'
        AND created_at >= ? AND created_at < ?
      `).bind(ms, me).first();
      
      const monthUsers = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE created_at >= ? AND created_at < ?
      `).bind(ms, me).first();
      
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
  const search = c.req.query('search');
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

    const conditions: string[] = [];
    const bindings: any[] = [];

    if (status) {
      conditions.push('p.status = ?');
      bindings.push(status);
    } else {
      // デフォルトで「削除済み」は除外
      conditions.push("p.status != 'deleted'");
    }

    if (search) {
      conditions.push('p.title LIKE ?');
      bindings.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    bindings.push(limit, offset);

    const products = await env.DB.prepare(query).bind(...bindings).all();

    let countQuery = 'SELECT COUNT(*) as count FROM products';
    const countBindings: any[] = [];
    const countConditions: string[] = [];

    if (status) {
      countConditions.push('status = ?');
      countBindings.push(status);
    } else {
      countConditions.push("status != 'deleted'");
    }

    if (search) {
      countConditions.push('title LIKE ?');
      countBindings.push(`%${search}%`);
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const total = countBindings.length > 0 ?
      await env.DB.prepare(countQuery).bind(...countBindings).first() :
      await env.DB.prepare(countQuery).first();

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

// 商品詳細取得
adminRoutes.get('/products/:id', async (c) => {
  const { env } = c
  const productId = c.req.param('id')

  try {
    const product = await env.DB.prepare(`
      SELECT p.*, u.name as seller_name, u.email as seller_email, u.company_name as seller_company,
             u.shop_type as seller_shop_type, u.phone as seller_phone
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(productId).first()

    if (!product) {
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }

    // 商品画像（テーブルが存在しない場合も考慮）
    let images: any[] = []
    try {
      const imgRes = await env.DB.prepare(
        `SELECT id, image_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order`
      ).bind(productId).all()
      images = imgRes.results || []
    } catch (e) { /* テーブル未作成の場合はスキップ */ }

    // 適合情報
    let compatibility: any[] = []
    try {
      const compatRes = await env.DB.prepare(
        `SELECT * FROM product_compatibility WHERE product_id = ?`
      ).bind(productId).all()
      compatibility = compatRes.results || []
    } catch (e) { /* テーブル未作成の場合はスキップ */ }

    // お気に入り数
    let favoriteCount = 0
    try {
      const favCount = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM favorites WHERE product_id = ?`
      ).bind(productId).first()
      favoriteCount = (favCount?.count as number) || 0
    } catch (e) { /* テーブル未作成の場合はスキップ */ }

    // 取引
    let transactions: any[] = []
    try {
      const txRes = await env.DB.prepare(`
        SELECT t.id, t.amount, t.status, t.created_at, buyer.name as buyer_name
        FROM transactions t
        LEFT JOIN users buyer ON t.buyer_id = buyer.id
        WHERE t.product_id = ?
        ORDER BY t.created_at DESC
      `).bind(productId).all()
      transactions = txRes.results || []
    } catch (e) { /* テーブル未作成の場合はスキップ */ }

    return c.json({
      success: true,
      product,
      images,
      compatibility,
      favorite_count: favoriteCount,
      transactions
    })
  } catch (error: any) {
    console.error('商品詳細取得エラー:', error)
    return c.json({ success: false, error: '商品詳細の取得に失敗しました' }, 500)
  }
})

// 商品ステータス更新
adminRoutes.put('/products/:id/status', async (c) => {
  const { env } = c;
  const productId = c.req.param('id');
  const { status } = await c.req.json();

  // バリデーション
  const validStatuses = ['active', 'sold', 'pending', 'suspended', 'deleted'];
  if (!validStatuses.includes(status)) {
    return c.json({ success: false, error: `無効なステータスです。有効な値: ${validStatuses.join(', ')}` }, 400);
  }
  
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

// 商品削除（ソフトデリート → 完全削除の2段階）
adminRoutes.delete('/products/:id', async (c) => {
  const { env } = c;
  const productId = c.req.param('id');
  const forceDelete = c.req.query('force') === 'true';
  
  try {
    // 取引データがあるかチェック
    let hasTransactions = false;
    try {
      const txCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM transactions WHERE product_id = ?'
      ).bind(productId).first();
      hasTransactions = (txCount?.count as number) > 0;
    } catch (e) { /* テーブル未作成の場合はスキップ */ }

    if (hasTransactions && !forceDelete) {
      // 取引データがある場合はソフトデリート（status='deleted'に変更）
      await env.DB.prepare(`
        UPDATE products SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(productId).run();

      // 関連するお気に入り・コメント等はクリーンアップ
      const cleanupTables = [
        'favorites',
        'product_comments',
        'price_negotiations',
        'price_history',
      ];
      for (const table of cleanupTables) {
        try {
          await env.DB.prepare(`DELETE FROM ${table} WHERE product_id = ?`).bind(productId).run();
        } catch (e) { /* スキップ */ }
      }

      return c.json({ success: true, message: '商品を削除済みにしました（取引履歴があるためソフトデリート）' });
    }

    // 完全削除：関連テーブルのデータを先に削除（外部キー制約対応）
    const relatedTables = [
      'product_images',
      'product_compatibility',
      'favorites',
      'product_comments',
      'price_negotiations',
      'price_history',
      'fitment_confirmations',
      'universal_parts',
    ];

    for (const table of relatedTables) {
      try {
        await env.DB.prepare(`DELETE FROM ${table} WHERE product_id = ?`).bind(productId).run();
      } catch (e) {
        console.log(`テーブル ${table} の削除をスキップ:`, e);
      }
    }

    // chat_rooms と chat_messages
    try {
      // まず chat_rooms の ID を取得して chat_messages を削除
      const rooms = await env.DB.prepare('SELECT id FROM chat_rooms WHERE product_id = ?').bind(productId).all();
      if (rooms.results && rooms.results.length > 0) {
        for (const room of rooms.results) {
          await env.DB.prepare('DELETE FROM chat_messages WHERE room_id = ?').bind(room.id).run();
        }
      }
      await env.DB.prepare('DELETE FROM chat_rooms WHERE product_id = ?').bind(productId).run();
    } catch (e) {
      console.log('chat関連の削除をスキップ:', e);
    }

    // notifications
    try {
      await env.DB.prepare('DELETE FROM notifications WHERE product_id = ?').bind(productId).run();
    } catch (e) { /* スキップ */ }

    // reports の product_id を NULL に（NULLableカラムの場合）
    try {
      await env.DB.prepare('UPDATE reports SET product_id = NULL WHERE product_id = ?').bind(productId).run();
    } catch (e) { /* スキップ */ }

    // 商品本体を削除
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productId).run();

    return c.json({ success: true, message: '商品を完全に削除しました' });
  } catch (error) {
    console.error('商品削除エラー:', error);
    return c.json({ error: '商品の削除に失敗しました: ' + (error as any)?.message }, 500);
  }
});

// ユーザー詳細取得
adminRoutes.get('/users/:id', async (c) => {
  const { env } = c
  const userId = c.req.param('id')

  try {
    const user = await env.DB.prepare(`
      SELECT 
        u.*,
        COUNT(DISTINCT p.id) as products_count,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_products_count,
        COUNT(DISTINCT CASE WHEN p.status = 'sold' THEN p.id END) as sold_products_count,
        COUNT(DISTINCT t.id) as transactions_count
      FROM users u
      LEFT JOIN products p ON u.id = p.user_id
      LEFT JOIN transactions t ON u.id = t.buyer_id OR u.id = t.seller_id
      WHERE u.id = ?
      GROUP BY u.id
    `).bind(userId).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // パスワードハッシュを除外
    delete (user as any).password_hash

    // ユーザーの出品商品を取得
    const products = await env.DB.prepare(`
      SELECT id, title, price, status, created_at
      FROM products WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).bind(userId).all()

    // ユーザーの取引履歴を取得
    const transactions = await env.DB.prepare(`
      SELECT t.id, t.amount, t.status, t.created_at, p.title as product_title,
             CASE WHEN t.buyer_id = ? THEN '購入' ELSE '販売' END as role
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.buyer_id = ? OR t.seller_id = ?
      ORDER BY t.created_at DESC LIMIT 20
    `).bind(userId, userId, userId).all()

    return c.json({
      success: true,
      user,
      products: products.results || [],
      transactions: transactions.results || []
    })
  } catch (error: any) {
    console.error('ユーザー詳細取得エラー:', error)
    return c.json({ success: false, error: 'ユーザー詳細の取得に失敗しました' }, 500)
  }
})

// ユーザーステータス更新
adminRoutes.put('/users/:id/status', async (c) => {
  const { env } = c;
  const userId = c.req.param('id');
  const { status } = await c.req.json();

  // バリデーション
  const validStatuses = ['active', 'suspended', 'banned', 'deleted'];
  if (!validStatuses.includes(status)) {
    return c.json({ success: false, error: `無効なステータスです。有効な値: ${validStatuses.join(', ')}` }, 400);
  }
  
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

// ユーザー削除
adminRoutes.delete('/users/:id', async (c) => {
  const { env } = c
  const userId = c.req.param('id')
  const forceDelete = c.req.query('force') === 'true'

  try {
    // ユーザーの存在確認
    const user = await env.DB.prepare(`SELECT id, name, email FROM users WHERE id = ?`).bind(userId).first()
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // 進行中の取引があるかチェック（安全装置）
    const activeTx = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE (buyer_id = ? OR seller_id = ?) 
      AND status IN ('pending', 'paid', 'shipped', 'dispute')
    `).bind(userId, userId).first()

    if ((activeTx?.count as number) > 0 && !forceDelete) {
      return c.json({ 
        success: false, 
        error: `このユーザーには進行中の取引が${activeTx?.count}件あります。取引を完了またはキャンセルしてから削除してください。強制削除する場合は force=true パラメータを使用してください。`,
        active_transactions: activeTx?.count
      }, 409)
    }

    // 未処理の出金申請があるかチェック
    const pendingWithdrawals = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM withdrawals 
      WHERE user_id = ? AND status IN ('pending', 'processing')
    `).bind(userId).first()

    if ((pendingWithdrawals?.count as number) > 0 && !forceDelete) {
      return c.json({ 
        success: false, 
        error: `このユーザーには未処理の出金申請が${pendingWithdrawals?.count}件あります。先に処理してから削除してください。`,
        pending_withdrawals: pendingWithdrawals?.count
      }, 409)
    }

    // 関連データを削除（外部キー制約対応）
    const tables = [
      { table: 'favorites', column: 'user_id' },
      { table: 'product_images', column: 'product_id', sub: `SELECT id FROM products WHERE user_id = ?` },
      { table: 'product_compatibility', column: 'product_id', sub: `SELECT id FROM products WHERE user_id = ?` },
      { table: 'products', column: 'user_id' },
      { table: 'reviews', column: 'reviewer_id' },
      { table: 'reviews', column: 'reviewee_id' },
      { table: 'chat_messages', column: 'sender_id' },
      { table: 'chat_rooms', column: 'buyer_id' },
      { table: 'chat_rooms', column: 'seller_id' },
      { table: 'notifications', column: 'user_id' },
      { table: 'withdrawals', column: 'user_id' },
      { table: 'transactions', column: 'buyer_id' },
      { table: 'transactions', column: 'seller_id' },
    ]

    for (const t of tables) {
      try {
        if (t.sub) {
          await env.DB.prepare(`DELETE FROM ${t.table} WHERE ${t.column} IN (${t.sub})`).bind(userId).run()
        } else {
          await env.DB.prepare(`DELETE FROM ${t.table} WHERE ${t.column} = ?`).bind(userId).run()
        }
      } catch (e) { /* テーブルが存在しない場合はスキップ */ }
    }

    // ユーザー本体を削除
    await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId).run()

    return c.json({ success: true, message: `ユーザー「${(user as any).name}」を削除しました` })
  } catch (error: any) {
    console.error('ユーザー削除エラー:', error)
    return c.json({ success: false, error: 'ユーザーの削除に失敗しました' }, 500)
  }
})

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

  // バリデーション
  const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'dispute', 'refunded'];
  if (!validStatuses.includes(status)) {
    return c.json({ success: false, error: `無効なステータスです。有効な値: ${validStatuses.join(', ')}` }, 400);
  }
  
  try {
    // 取引情報を取得
    const transaction = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(transactionId).first();
    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404);
    }

    await env.DB.prepare(`
      UPDATE transactions
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, transactionId).run();

    // 取引完了時: 商品ステータスをsoldに更新
    if (status === 'completed' && transaction.product_id) {
      await env.DB.prepare(`
        UPDATE products SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(transaction.product_id).run();
    }

    // 取引キャンセル時: 商品ステータスをactiveに戻す
    if (status === 'cancelled' && transaction.product_id) {
      await env.DB.prepare(`
        UPDATE products SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'sold'
      `).bind(transaction.product_id).run();
    }

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

  // バリデーション
  const validStatuses = ['pending', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return c.json({ success: false, error: `無効なステータスです。有効な値: ${validStatuses.join(', ')}` }, 400);
  }
  
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
    // 今月の売上統計（JST基準）
    const { year, month } = jstNow();
    const firstOfMonth = jstMonthStartUTC(year, month);
    
    const currentMonth = await env.DB.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as totalSales
      FROM transactions
      WHERE status = 'completed'
      AND created_at >= ?
    `).bind(firstOfMonth).first();

    const totalFees = Math.floor((currentMonth?.totalSales || 0) * 0.10);

    // 過去12ヶ月の月別売上（JST基準）
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const ms = jstMonthStartUTC(year, month - i);
      const me = jstMonthStartUTC(year, month - i + 1);
      
      const monthSales = await env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as sales
        FROM transactions
        WHERE status = 'completed'
        AND created_at >= ? AND created_at < ?
      `).bind(ms, me).first();
      
      // JSTの月を返す
      const jstMonth = new Date(Date.UTC(year, month - i, 1));
      monthlyData.push({
        month: jstMonth.getUTCMonth() + 1,
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

// 自動投稿API（画像生成付き）- AI検知回避・高品質版
adminRoutes.post('/articles/auto-generate-with-image', async (c) => {
  const { env } = c;
  
  try {
    // OpenAI APIキーの確認
    const openaiApiKey = env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI APIキーが設定されていません' }, 500);
    }

    // ===================================================
    // トピック＆キーワード戦略（PARTS HUB固有の強み反映）
    // ===================================================
    
    // 月別の季節トピック（1月=0, 12月=11）
    const now = nowJST();
    const currentMonth = now.getUTCMonth();
    
    const seasonalTopics: Record<number, string[]> = {
      0: [ // 1月
        '年始に見直す！整備工場の在庫棚卸しとデッドストック処分のコツ',
        '冬場のバッテリー上がり対策｜純正バッテリーを賢く調達する方法',
        '寒冷地仕様パーツの需要急増｜冬こそ純正部品の出品チャンス',
      ],
      1: [ // 2月
        '年度末の車検ラッシュに備える！整備工場の部品調達戦略',
        'デッドストック純正部品、捨てる前に知ってほしいこと',
        '誤発注してしまった部品、実はそれを探している工場があります',
      ],
      2: [ // 3月
        '車検シーズン到来！整備工場が知っておくべき部品コスト削減術',
        '年度替わりの在庫整理｜倉庫に眠る純正パーツを現金化する方法',
        '春の新生活シーズン｜中古車整備に必要な純正部品の賢い探し方',
      ],
      3: [ // 4月
        '新年度スタート！整備工場の経営効率を上げる部品管理術',
        'ゴールデンウィーク前のメンテナンス需要｜整備工場が準備すべきこと',
        'エアコン関連部品の需要が高まる季節｜コンプレッサーの純正品調達',
      ],
      4: [ // 5月
        'GW明けのメンテナンス依頼増加｜効率的な部品発注と在庫管理',
        '梅雨入り前に確認！ワイパー・エアコンフィルターの在庫は大丈夫？',
        'エアコン修理シーズン直前｜コンデンサーやエバポレーターの調達先',
      ],
      5: [ // 6月
        '梅雨シーズンの整備需要｜ワイパーモーターやドレン部品の確保術',
        '雨漏り修理に必要な純正ウェザーストリップの入手方法',
        '湿気対策！エアコンフィルター交換のプロが教える選び方',
      ],
      6: [ // 7月
        '真夏の故障トップ5｜整備工場が備えるべき純正部品リスト',
        'エアコン修理の駆け込み需要｜今すぐ確保したい純正パーツ',
        'オーバーヒート対策！ラジエーターとサーモスタットの純正品事情',
      ],
      7: [ // 8月
        'お盆休み前後の故障対応｜整備工場の緊急部品調達テクニック',
        '猛暑でバッテリー消耗が加速｜純正バッテリーの在庫管理',
        '夏の長距離ドライブ後に増える修理依頼と必要な部品',
      ],
      8: [ // 9月
        '秋の車検シーズンに向けた部品在庫の見直しポイント',
        '台風シーズンの外装部品需要｜バンパーやフェンダーの純正品確保',
        '夏の酷使から愛車を守る秋メンテナンス｜部品交換の優先順位',
      ],
      9: [ // 10月
        'スタッドレスタイヤ交換シーズン開始！足回り部品の点検と調達',
        '秋の行楽シーズンに増えるメンテナンス依頼への備え方',
        '冬に向けたヒーター関連部品の在庫チェックリスト',
      ],
      10: [ // 11月
        '冬支度シーズン！暖房系統の純正部品需要が急上昇',
        '年末の在庫一掃セール｜デッドストック部品を年内に売り切るコツ',
        'スリップ事故増加期に備える｜ブレーキ関連純正部品の確認',
      ],
      11: [ // 12月
        '年末年始の緊急修理に備える！整備工場の部品ストック術',
        '一年の振り返り｜今年売れた純正部品ランキングと来年のトレンド予測',
        '年末在庫処分｜倉庫に眠ったデッドストックを年内に現金化する方法',
      ],
    };

    // 通年トピック（季節に関係なく使用）
    const evergreenTopics = [
      // ===== デッドストック・在庫活用（PARTS HUBの核心テーマ） =====
      '整備工場の倉庫に眠る「デッドストック」純正部品、その価値を見直す',
      '誤発注した純正パーツ、返品できなかった部品の第二の人生',
      '部品商の在庫圧縮術｜デッドストックをPARTS HUBで現金化する実践ガイド',
      '廃業する整備工場から引き継いだ部品在庫の効率的な処分方法',
      '倉庫スペースがコストになる前に｜眠った在庫パーツの出品のすすめ',
      '「いつか使うかも」で5年経過…デッドストック部品の判断基準と活用法',
      '年間数十万円の倉庫代が浮く！在庫パーツの出品で経営効率アップ',
      
      // ===== 純正部品の価値・品質 =====
      '社外品と純正品の本当の違い｜整備のプロが語る品質と信頼性',
      '廃番になった純正部品を探す方法｜旧車・絶版車オーナー必見',
      '純正部品番号から車両適合を調べる完全ガイド',
      '純正品が高い？それ、デッドストック品なら半額以下で手に入るかも',
      'OEM部品と純正部品の違いを整備士目線で徹底解説',
      '中古部品・リビルト品・デッドストック品の違いと選び方',
      
      // ===== 整備工場の経営・業務効率 =====
      '整備工場の利益率を上げる部品調達コスト削減の実践テクニック',
      '部品待ちで車を返せない…納期問題を解決する複数調達ルートの作り方',
      '小規模整備工場が大手に負けない部品調達術',
      '整備工場の世代交代｜次世代に引き継ぐべき在庫管理の知識',
      'デジタル化で変わる部品調達｜FAXからオンライン発注への移行ガイド',
      
      // ===== 部品商向け =====
      '部品商の新しい販路｜オンラインプラットフォームを活用した在庫回転率向上',
      '地方の部品商が全国に販路を広げる方法',
      '部品商の在庫管理DX｜デッドストック削減と売上最大化の両立',
      
      // ===== 車種別・部品別の実用記事 =====
      'トヨタ車の純正部品を安く手に入れる方法｜品番検索のコツ',
      '軽自動車の純正部品事情｜ダイハツ・スズキの部品調達ガイド',
      'ブレーキパッド交換のプロが教える｜純正品を選ぶべき理由と調達先',
      'エアコンコンプレッサー交換｜純正リビルト品とデッドストック品の比較',
      'ドアミラーASSY交換｜純正品を格安で調達するプロの裏技',
      'ヘッドライトユニット交換の費用と純正品を安く入手する方法',
      'ラジエーター交換｜純正品でないとダメな理由と賢い調達術',
      'オルタネーター（発電機）故障の前兆と純正リビルト品の選び方',
      
      // ===== 一般ユーザー向け（買い手獲得） =====
      '車の修理代が高い？純正部品のデッドストック品という選択肢',
      '純正部品を使いたいけど高い…そんな時の賢い部品探し術',
      '車検で指摘された部品交換、純正品を安く手に入れる方法',
      '愛車の修理見積もりが高すぎる時に試してほしい部品調達テクニック',
      '旧車・ネオクラシックカーの純正部品が見つからない時の探し方',
      '型式や車台番号から適合部品を検索する方法｜初心者でも簡単',
      
      // ===== 業界トレンド・コラム =====
      '自動車アフターマーケット業界の2026年トレンドと純正部品流通の変化',
      '電気自動車時代に純正部品ビジネスはどう変わるか',
      '自動車リサイクル法と部品の再利用｜環境に優しい整備の未来',
      'SDGsと自動車部品｜デッドストック活用がサステナブルな理由',
    ];

    const categories = [
      { id: 'parts-guide', name: 'パーツガイド', description: '純正部品の選び方・探し方・比較情報' },
      { id: 'maintenance', name: 'メンテナンス', description: '整備のコツ・部品交換のタイミング・プロの技術' },
      { id: 'tips', name: 'お役立ち情報', description: '整備工場経営・在庫管理・コスト削減・業界トレンド' },
      { id: 'deadstock', name: 'デッドストック活用', description: '在庫処分・倉庫整理・デッドストック販売のノウハウ' },
    ];
    
    // 季節トピック（60%） or 通年トピック（40%）をランダム選択
    const useSeasonalTopic = Math.random() < 0.6;
    const monthTopics = seasonalTopics[currentMonth] || [];
    
    let topic: string;
    if (useSeasonalTopic && monthTopics.length > 0) {
      topic = monthTopics[Math.floor(Math.random() * monthTopics.length)];
    } else {
      topic = evergreenTopics[Math.floor(Math.random() * evergreenTopics.length)];
    }
    
    const category = categories[Math.floor(Math.random() * categories.length)];

    // ===================================================
    // 記事テンプレート多様化（AI検知回避）
    // ===================================================
    
    // 5つの文体パターンをランダムに使い分け
    const writingStyles = [
      {
        persona: '整備歴25年のベテラン整備士「田中」',
        tone: '現場経験に基づいた実践的なアドバイス。「〜ですね」「〜なんですよ」など口語的な表現を交えつつも専門性を感じる文体。たまに「先日うちの工場でも…」のような体験談を挟む。',
        structure: '導入（現場のあるある話）→ 問題提起 → 解説 → 具体例・体験談 → まとめ（読者への一言）',
      },
      {
        persona: '自動車部品流通に詳しいビジネスライター',
        tone: 'データや具体的な数字を交えた説得力のある文体。「○○%のコスト削減」「年間○○万円」など数値を入れる。敬体（です・ます）で丁寧だが、硬すぎない。',
        structure: '結論ファースト → 背景・課題 → 解決策（3つ程度）→ 事例紹介 → 今後の展望',
      },
      {
        persona: '整備工場を経営する2代目オーナー',
        tone: '経営者目線での課題感と解決策。「父の代から引き継いだ工場で…」「同業の仲間に聞いたところ…」のようなリアルな声。少しカジュアルで読みやすい。',
        structure: '自分の経験・悩み → 調べてわかったこと → 試してみた結果 → 読者への提案',
      },
      {
        persona: '自動車整備の専門学校で教える講師',
        tone: '教育的で分かりやすい解説。「まず押さえておきたいのは…」「ここがポイントです」など教科書的だが堅すぎない。図解の代わりに箇条書きを効果的に使う。',
        structure: '基礎知識 → 詳細解説 → よくある質問 → プロのアドバイス → まとめ',
      },
      {
        persona: 'PARTS HUB編集部のスタッフ',
        tone: '取材記事風。「実際に整備工場を訪問してお話を伺いました」「ユーザーさんからこんな声をいただいています」など第三者視点。適度にインタビュー形式を挟む。',
        structure: '話題の導入 → 取材・インタビュー風の内容 → 専門家の見解 → 読者向けのアクション提案',
      },
    ];
    
    const style = writingStyles[Math.floor(Math.random() * writingStyles.length)];

    console.log(`自動生成開始 - トピック: ${topic}, カテゴリ: ${category.name}, 文体: ${style.persona}`);

    // ===================================================
    // プロンプト（Google AI検知回避・高品質記事生成）
    // ===================================================
    
    const systemPrompt = `あなたは「${style.persona}」として記事を書きます。

【絶対守るルール】
1. 一人の人間が書いたように、文体・語尾・表現に一貫性を持たせること
2. AIが書いたとバレる典型的なパターンを避けること：
   - 「〜について解説します」「まとめ」だけで締めない
   - 全ての見出しを疑問形にしない
   - 箇条書きだけで構成しない
   - 定型的な導入文（「○○でお悩みではありませんか？」）を使いすぎない
3. 段落の長さにバリエーションをつける（2行の段落と5行の段落を混ぜる）
4. たまに話が少し脱線する自然さを入れる（すぐ本題に戻る）
5. 具体的な数字・金額・期間を入れる（例：「約3万円」「2〜3年」「15分程度」）
6. 自分の感想や主観を適度に入れる（「個人的には〜だと思います」「正直なところ〜」）

【PARTS HUBについて（記事内で自然に触れること）】
- 整備工場や部品商の「デッドストック」（誤発注品・過剰在庫の純正部品）を売買できるプラットフォーム
- 最大の強み：車台番号や型式から純正部品番号で車両適合を正確に検索できるデータベースAPI連携
- 他のフリマサイトやオークションサイトにはない適合検索機能
- 売り手：整備工場・部品商（在庫の現金化・倉庫スペース確保）
- 買い手：整備工場・部品商・一般ユーザー（純正品を格安で入手）
- デッドストック品は新品同様の純正品が定価より大幅に安い

【NGルール】
- 他のフリマサイトやオークションサイトの具体名は出さない
- 他サービスを直接批判・比較しない（「一般的なフリマサイトでは」程度の表現はOK）
- 誇大広告的な表現は避ける

【文体】${style.tone}
【構成】${style.structure}`;

    const userPrompt = `以下のトピックについて、PARTS HUBのコラム記事を書いてください。

トピック: ${topic}
カテゴリ: ${category.name}（${category.description}）

【記事の要件】
- 本文は2000〜3000文字程度（読了時間5〜8分）
- HTMLタグを使用（h2, h3, p, ul, li, strong, em）
- h2見出しは3〜5個、h3は必要に応じて使用
- 段落（p）は適度な長さで、1段落が長くなりすぎない
- 最後に自然な形でPARTS HUBへの誘導を入れる（押し売りにならない程度）
- 記事の途中でも関連する箇所があれば自然にPARTS HUBに触れてOK

以下のJSON形式で出力してください（JSONのみを出力し、他の文字は含めないでください）：
{
  "title": "記事タイトル（32文字以内、具体的で検索されやすい表現）",
  "slug": "english-url-slug-keywords",
  "summary": "記事の要約（80〜120文字、検索結果に表示されることを意識）",
  "content": "記事本文（HTML）",
  "tags": "タグ1,タグ2,タグ3,タグ4,タグ5"
}`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 4500,
        frequency_penalty: 0.3,
        presence_penalty: 0.4,
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
    const dateStr = toJSTISOString(now);
    
    // 日付部分を取得（YYYY-MM-DD形式・JST基準）
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    
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

// 古い記事の画像をR2に再アップロード
adminRoutes.post('/articles/:id/fix-image', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  
  try {
    const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
    if (!article) {
      return c.json({ error: '記事が見つかりません' }, 404);
    }

    // OpenAIの一時URLかどうかチェック
    const thumbnailUrl = article.thumbnail_url as string;
    if (thumbnailUrl && thumbnailUrl.includes('images.parts-hub-tci.com')) {
      return c.json({ message: '画像は既にR2に保存されています', thumbnail_url: thumbnailUrl });
    }

    // 新しい画像を生成
    const imagePrompt = `Professional automotive parts photograph related to: ${article.title}. High quality, clean background, studio lighting, detailed product shot.`;
    
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard'
      })
    });

    const imageData = await imageResponse.json() as any;
    const tempImageUrl = imageData.data[0].url;

    // R2にアップロード
    const imgResponse = await fetch(tempImageUrl);
    const imageBuffer = await imgResponse.arrayBuffer();
    const imageKey = `articles/${id}-${Date.now()}.png`;
    
    await env.R2.put(imageKey, imageBuffer, {
      httpMetadata: { contentType: 'image/png' }
    });

    const permanentUrl = `${env.R2_PUBLIC_URL}/${imageKey}`;

    // データベース更新
    await env.DB.prepare('UPDATE articles SET thumbnail_url = ? WHERE id = ?')
      .bind(permanentUrl, id).run();

    return c.json({ success: true, thumbnail_url: permanentUrl, message: '画像をR2に保存しました' });
  } catch (error) {
    console.error('画像修正エラー:', error);
    return c.json({ error: '画像の修正に失敗しました: ' + (error as Error).message }, 500);
  }
});

// ===== 出金管理API =====

// 出金申請一覧
adminRoutes.get('/withdrawals', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const status = c.req.query('status');
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        w.id,
        w.user_id,
        w.amount,
        w.bank_name,
        w.branch_name,
        w.account_type,
        w.account_number,
        w.account_holder,
        w.status,
        w.requested_at,
        w.processed_at,
        w.transferred_at,
        w.notes,
        w.rejection_reason,
        u.name as user_name,
        u.email as user_email
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
    `;

    const conditions: string[] = [];
    const bindings: any[] = [];

    if (status) {
      conditions.push('w.status = ?');
      bindings.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY w.requested_at DESC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);

    const withdrawals = await env.DB.prepare(query).bind(...bindings).all();

    // 合計件数
    let countQuery = 'SELECT COUNT(*) as count FROM withdrawals';
    const countBindings: any[] = [];
    if (status) {
      countQuery += ' WHERE status = ?';
      countBindings.push(status);
    }
    const total = countBindings.length > 0 
      ? await env.DB.prepare(countQuery).bind(...countBindings).first()
      : await env.DB.prepare(countQuery).first();

    // 統計情報
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
        COALESCE(SUM(CASE WHEN status = 'processing' THEN amount ELSE 0 END), 0) as processing_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as completed_amount
      FROM withdrawals
    `).first();

    return c.json({
      withdrawals: withdrawals.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit),
      stats: stats || {}
    });
  } catch (error) {
    console.error('出金一覧取得エラー:', error);
    return c.json({ error: '出金一覧の取得に失敗しました' }, 500);
  }
});

// 出金申請ステータス更新（承認→処理中→完了 or 却下）
adminRoutes.put('/withdrawals/:id/status', async (c) => {
  const { env } = c;
  const withdrawalId = c.req.param('id');
  const { status, notes, rejection_reason } = await c.req.json();

  // バリデーション
  const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return c.json({ success: false, error: `無効なステータスです。有効な値: ${validStatuses.join(', ')}` }, 400);
  }

  try {
    // 現在の出金申請を取得
    const withdrawal = await env.DB.prepare('SELECT * FROM withdrawals WHERE id = ?').bind(withdrawalId).first();
    if (!withdrawal) {
      return c.json({ success: false, error: '出金申請が見つかりません' }, 404);
    }

    // ステータス遷移の妥当性チェック
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'rejected'],
      'processing': ['completed', 'rejected'],
      'completed': [],
      'rejected': ['pending'], // 却下を撤回して再度pendingに戻すことは可能
    };

    if (!validTransitions[withdrawal.status as string]?.includes(status)) {
      return c.json({ 
        success: false, 
        error: `「${withdrawal.status}」から「${status}」への変更はできません` 
      }, 400);
    }

    // 更新クエリ構築
    let updateQuery = `UPDATE withdrawals SET status = ?`;
    const updateBindings: any[] = [status];

    if (status === 'processing') {
      updateQuery += `, processed_at = datetime('now')`;
    }
    if (status === 'completed') {
      updateQuery += `, transferred_at = datetime('now')`;
    }
    if (notes) {
      updateQuery += `, notes = ?`;
      updateBindings.push(notes);
    }
    if (rejection_reason && status === 'rejected') {
      updateQuery += `, rejection_reason = ?`;
      updateBindings.push(rejection_reason);
    }

    updateQuery += ` WHERE id = ?`;
    updateBindings.push(withdrawalId);

    await env.DB.prepare(updateQuery).bind(...updateBindings).run();

    // 管理操作ログを記録
    await logAdminAction(env.DB, c.get('adminUser') || 'admin', 'withdrawal_status_change', 
      `出金申請 #${withdrawalId} のステータスを「${withdrawal.status}」→「${status}」に変更`);

    const statusLabels: Record<string, string> = {
      'processing': '処理中',
      'completed': '振込完了',
      'rejected': '却下',
      'pending': '保留中',
    };

    return c.json({ 
      success: true, 
      message: `出金申請を「${statusLabels[status] || status}」に更新しました` 
    });
  } catch (error) {
    console.error('出金ステータス更新エラー:', error);
    return c.json({ error: '出金ステータスの更新に失敗しました' }, 500);
  }
});

// ===== 振込確認管理API =====

// 請求書払い注文一覧
adminRoutes.get('/invoice-orders', async (c) => {
  const { env } = c;
  const status = c.req.query('status') || 'awaiting_transfer'; // awaiting_transfer, paid, cancelled
  
  try {
    const orders = await env.DB.prepare(`
      SELECT t.id, t.product_id, t.buyer_id, t.seller_id, t.amount, t.fee,
        t.status, t.payment_method, t.invoice_number, t.invoice_due_date,
        t.transfer_confirmed_at, t.transfer_note, t.billing_info,
        t.created_at, t.updated_at,
        p.title as product_title,
        buyer.name as buyer_name, buyer.email as buyer_email,
        COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_display_name,
        seller.name as seller_name, seller.email as seller_email,
        COALESCE(seller.company_name, seller.nickname, seller.name) as seller_display_name
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN users seller ON t.seller_id = seller.id
      WHERE t.payment_method = 'invoice'
      ${status !== 'all' ? 'AND t.status = ?' : ''}
      ORDER BY t.created_at DESC
      LIMIT 100
    `).bind(...(status !== 'all' ? [status] : [])).all();
    
    return c.json({ success: true, orders: orders.results || [] });
  } catch (error: any) {
    console.error('Invoice orders fetch error:', error);
    return c.json({ success: false, error: '請求書払い注文の取得に失敗しました' }, 500);
  }
});

// 振込確認処理（管理者が手動確認）
adminRoutes.post('/invoice-orders/:id/confirm-transfer', async (c) => {
  const { env } = c;
  const orderId = c.req.param('id');
  const { note } = await c.req.json().catch(() => ({ note: '' }));
  
  try {
    // 取引情報取得
    const order = await env.DB.prepare(`
      SELECT t.*, p.title as product_title,
        buyer.name as buyer_name,
        seller.name as seller_name, seller.id as seller_user_id
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN users seller ON t.seller_id = seller.id
      WHERE t.id = ? AND t.payment_method = 'invoice'
    `).bind(orderId).first();
    
    if (!order) {
      return c.json({ success: false, error: '注文が見つかりません' }, 404);
    }
    
    if (order.status !== 'awaiting_transfer') {
      return c.json({ success: false, error: `この注文は現在「${order.status}」状態です。振込待ちの注文のみ確認できます。` }, 400);
    }
    
    // ステータスを paid に更新
    await env.DB.prepare(`
      UPDATE transactions 
      SET status = 'paid', 
          transfer_confirmed_at = datetime('now'),
          transfer_note = ?,
          paid_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(note || '', orderId).run();
    
    return c.json({ 
      success: true, 
      message: `注文 ${order.invoice_number} の振込を確認しました。` 
    });
  } catch (error: any) {
    console.error('Confirm transfer error:', error);
    return c.json({ success: false, error: '振込確認処理に失敗しました' }, 500);
  }
});

// 出品者へ発送依頼通知を送信
adminRoutes.post('/invoice-orders/:id/notify-seller', async (c) => {
  const { env } = c;
  const orderId = c.req.param('id');
  
  try {
    const order = await env.DB.prepare(`
      SELECT t.*, p.title as product_title,
        buyer.name as buyer_name,
        COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_display_name,
        seller.name as seller_name, seller.id as seller_user_id
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN users seller ON t.seller_id = seller.id
      WHERE t.id = ? AND t.payment_method = 'invoice'
    `).bind(orderId).first();
    
    if (!order) {
      return c.json({ success: false, error: '注文が見つかりません' }, 404);
    }
    
    if (order.status !== 'paid') {
      return c.json({ success: false, error: '振込確認済みの注文のみ通知を送信できます' }, 400);
    }
    
    // 出品者にアプリ内通知
    try {
      await env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url)
        VALUES (?, 'shipping_request', ?, ?, ?, 'transaction', ?)
      `).bind(
        order.seller_user_id,
        '【発送依頼】振込が確認されました',
        `「${order.product_title}」の振込が確認されました（請求書番号: ${order.invoice_number}）。購入者: ${order.buyer_display_name}。商品の発送をお願いいたします。`,
        orderId,
        `/transactions/${orderId}`
      ).run();
    } catch (e) {
      console.error('Notification insert error:', e);
    }

    // 購入者にも通知
    try {
      await env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url)
        VALUES (?, 'payment_confirmed', ?, ?, ?, 'transaction', ?)
      `).bind(
        order.buyer_id,
        '振込確認完了 — 出品者に発送依頼済み',
        `「${order.product_title}」のお振込を確認いたしました（請求書番号: ${order.invoice_number}）。出品者に発送依頼を送信しました。発送をお待ちください。`,
        orderId,
        `/transactions/${orderId}`
      ).run();
    } catch (e) {
      console.error('Notification insert error:', e);
    }
    
    return c.json({ 
      success: true, 
      message: `出品者「${order.seller_name}」と購入者に通知を送信しました。` 
    });
  } catch (error: any) {
    console.error('Notify seller error:', error);
    return c.json({ success: false, error: '通知の送信に失敗しました' }, 500);
  }
});

// ===== 管理操作ログ =====

// ログ記録ヘルパー関数
async function logAdminAction(db: D1Database, adminUser: string, action: string, detail: string) {
  try {
    await db.prepare(`
      INSERT INTO admin_logs (admin_user, action, detail, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(adminUser, action, detail).run();
  } catch (e) {
    // admin_logs テーブルが存在しない場合はスキップ（後でマイグレーションで作成）
    console.log('管理ログ記録スキップ:', e);
  }
}

// 管理操作ログ一覧
adminRoutes.get('/logs', async (c) => {
  const { env } = c;
  const page = parseInt(c.req.query('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    const logs = await env.DB.prepare(`
      SELECT * FROM admin_logs 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const total = await env.DB.prepare('SELECT COUNT(*) as count FROM admin_logs').first();

    return c.json({
      logs: logs.results || [],
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    });
  } catch (error) {
    // テーブルが存在しない場合は空配列を返す
    return c.json({ logs: [], total: 0, page: 1, totalPages: 0 });
  }
});

// ===== お知らせ管理API =====

// お知らせ一覧取得（管理画面用 - 全ステータス）
adminRoutes.get('/announcements', async (c) => {
  try {
    const { DB } = c.env
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit
    const typeFilter = c.req.query('type') || ''
    const statusFilter = c.req.query('status') || ''

    let whereClause = '1=1'
    const params: any[] = []

    if (typeFilter) {
      whereClause += ' AND type = ?'
      params.push(typeFilter)
    }
    if (statusFilter === 'active') {
      whereClause += ' AND is_active = 1'
    } else if (statusFilter === 'inactive') {
      whereClause += ' AND is_active = 0'
    }

    const total = await DB.prepare(`SELECT COUNT(*) as count FROM announcements WHERE ${whereClause}`).bind(...params).first() as any
    const { results } = await DB.prepare(`
      SELECT * FROM announcements WHERE ${whereClause}
      ORDER BY is_pinned DESC, priority DESC, published_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: results,
      total: total?.count || 0,
      page,
      totalPages: Math.ceil((total?.count || 0) / limit)
    })
  } catch (error) {
    console.error('Get announcements error:', error)
    return c.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 })
  }
})

// お知らせ作成
adminRoutes.post('/announcements', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { title, content, type, priority, is_pinned, published_at, expires_at } = body

    if (!title || !content) {
      return c.json({ success: false, error: 'タイトルと内容は必須です' }, 400)
    }

    const result = await DB.prepare(`
      INSERT INTO announcements (title, content, type, priority, is_pinned, published_at, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')
    `).bind(
      title,
      content,
      type || 'info',
      priority || 0,
      is_pinned ? 1 : 0,
      published_at || new Date().toISOString(),
      expires_at || null
    ).run()

    return c.json({ success: true, data: { id: result.meta.last_row_id } })
  } catch (error) {
    console.error('Create announcement error:', error)
    return c.json({ success: false, error: 'お知らせの作成に失敗しました' }, 500)
  }
})

// お知らせ更新
adminRoutes.put('/announcements/:id', async (c) => {
  try {
    const { DB } = c.env
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, content, type, priority, is_active, is_pinned, published_at, expires_at } = body

    if (!title || !content) {
      return c.json({ success: false, error: 'タイトルと内容は必須です' }, 400)
    }

    await DB.prepare(`
      UPDATE announcements SET
        title = ?, content = ?, type = ?, priority = ?,
        is_active = ?, is_pinned = ?, published_at = ?,
        expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title, content, type || 'info', priority || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      is_pinned ? 1 : 0,
      published_at || new Date().toISOString(),
      expires_at || null,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update announcement error:', error)
    return c.json({ success: false, error: 'お知らせの更新に失敗しました' }, 500)
  }
})

// お知らせ削除
adminRoutes.delete('/announcements/:id', async (c) => {
  try {
    const { DB } = c.env
    const id = c.req.param('id')

    await DB.prepare('DELETE FROM announcements WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return c.json({ success: false, error: 'お知らせの削除に失敗しました' }, 500)
  }
})

export default adminRoutes
