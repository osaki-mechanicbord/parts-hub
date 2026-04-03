import { Hono } from 'hono'
import { authMiddleware } from '../auth'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const mypage = new Hono<{ Bindings: Bindings }>()

// 全エンドポイントにJWT認証を適用
mypage.use('/*', authMiddleware)

// R2キーを表示用URLに変換するヘルパー
function toImageUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/r2/')) return key
  return `/r2/${key}`
}

// マイページ統計情報取得
mypage.get('/stats/:userId', async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const userId = c.req.param('userId')

    // 自分のデータのみアクセス可能
    if (String(authUserId) !== String(userId)) {
      return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
    }

    // 簡略化: 各統計を個別にtry-catchで囲む
    let listing_count = 0;
    let sold_count = 0;
    let purchase_count = 0;
    let total_sales = 0;
    let total_fees = 0;
    let withdrawable_amount = 0;
    let review_count = 0;
    let avg_rating = 0;
    let unread_notifications = 0;
    let unread_messages = 0;
    let active_transaction_count = 0;
    let action_required_count = 0;

    // 出品中の商品数
    try {
      const result = await DB.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE user_id = ? AND status = 'active'
      `).bind(userId).first()
      listing_count = result?.count || 0
    } catch (error) {
      console.error('listing_count error:', error)
    }

    // 売却済み商品数（transactionsテーブルが存在しない場合は0）
    try {
      const result = await DB.prepare(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE seller_id = ? AND status = 'completed'
      `).bind(userId).first()
      sold_count = result?.count || 0
    } catch (error) {
      console.log('transactions table not found, using 0')
      sold_count = 0
    }

    // 購入数
    try {
      const result = await DB.prepare(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE buyer_id = ? AND status = 'completed'
      `).bind(userId).first()
      purchase_count = result?.count || 0
    } catch (error) {
      purchase_count = 0
    }

    // 総売上
    try {
      const result = await DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
        WHERE seller_id = ? AND status = 'completed'
      `).bind(userId).first()
      total_sales = result?.total || 0
    } catch (error) {
      total_sales = 0
    }

    // 手数料合計
    try {
      const result = await DB.prepare(`
        SELECT COALESCE(SUM(fee), 0) as total FROM transactions 
        WHERE seller_id = ? AND status = 'completed'
      `).bind(userId).first()
      total_fees = result?.total || 0
    } catch (error) {
      total_fees = 0
    }

    // 振込可能額
    withdrawable_amount = Math.max(0, total_sales - total_fees)

    // 評価
    try {
      const result = await DB.prepare(`
        SELECT 
          COUNT(*) as review_count,
          AVG(rating) as avg_rating
        FROM reviews 
        WHERE reviewed_user_id = ?
      `).bind(userId).first()
      review_count = result?.review_count || 0
      avg_rating = result?.avg_rating || 0
    } catch (error) {
      review_count = 0
      avg_rating = 0
    }

    // 進行中の取引数
    try {
      const result = await DB.prepare(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE (buyer_id = ? OR seller_id = ?) AND status IN ('pending', 'paid', 'shipped')
      `).bind(userId, userId).first()
      active_transaction_count = result?.count || 0
    } catch (error) {
      active_transaction_count = 0
    }

    // 要対応の取引数（自分がアクション必要なもの）
    try {
      const result = await DB.prepare(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE (
          (seller_id = ? AND status = 'paid')
          OR (buyer_id = ? AND status = 'shipped')
        )
      `).bind(userId, userId).first()
      action_required_count = result?.count || 0
    } catch (error) {
      action_required_count = 0
    }

    // 未読通知数
    try {
      const result = await DB.prepare(`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ? AND is_read = 0
      `).bind(userId).first()
      unread_notifications = result?.count || 0
    } catch (error) {
      unread_notifications = 0
    }

    // 未読メッセージ数
    try {
      const result = await DB.prepare(`
        SELECT COUNT(DISTINCT room_id) as count 
        FROM chat_messages cm
        JOIN chat_rooms cr ON cm.room_id = cr.id
        WHERE (cr.buyer_id = ? OR cr.seller_id = ?)
          AND cm.sender_id != ?
          AND cm.is_read = 0
      `).bind(userId, userId, userId).first()
      unread_messages = result?.count || 0
    } catch (error) {
      unread_messages = 0
    }

    // ユーザー名と店舗情報
    let shop_name = 'マイショップ';
    let shop_type = 'individual';
    try {
      const user = await DB.prepare(`
        SELECT company_name, nickname, name, shop_type FROM users WHERE id = ?
      `).bind(userId).first()
      shop_name = user?.company_name || user?.nickname || user?.name || 'マイショップ'
      shop_type = user?.shop_type || 'individual'
    } catch (error) {
      console.error('user info error:', error)
    }

    return c.json({
      success: true,
      data: {
        shop_name,
        shop_type,
        listing_count,
        sold_count,
        purchase_count,
        total_sales,
        total_fees,
        withdrawable_amount,
        review_count,
        average_rating: Math.round(avg_rating * 10) / 10,
        unread_notifications,
        unread_messages,
        active_transaction_count,
        action_required_count
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return c.json({ success: false, error: '統計情報の取得に失敗しました' }, 500)
  }
})

// 進行中の取引一覧（出品者・購入者両方）
mypage.get('/active-transactions/:userId', async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const userId = c.req.param('userId')

    if (String(authUserId) !== String(userId)) {
      return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
    }

    const { results } = await DB.prepare(`
      SELECT 
        t.id as transaction_id,
        t.product_id,
        t.amount,
        t.fee,
        t.status,
        t.created_at,
        t.paid_at,
        t.shipped_at,
        t.completed_at,
        t.cancelled_at,
        t.tracking_number,
        t.shipping_carrier,
        t.shipping_note,
        t.buyer_id,
        t.seller_id,
        p.title as product_title,
        COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_name,
        COALESCE(seller.company_name, seller.nickname, seller.name) as seller_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE (t.buyer_id = ? OR t.seller_id = ?)
        AND t.status IN ('pending', 'paid', 'shipped', 'completed')
      ORDER BY 
        CASE t.status
          WHEN 'paid' THEN 1
          WHEN 'shipped' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'completed' THEN 4
        END,
        t.created_at DESC
      LIMIT 50
    `).bind(userId, userId).all()

    const data = results.map((t: any) => ({
      ...t,
      product_image: toImageUrl(t.product_image),
      is_buyer: Number(t.buyer_id) === Number(userId),
      is_seller: Number(t.seller_id) === Number(userId),
    }))

    return c.json({ success: true, data })
  } catch (error) {
    console.error('Get active transactions error:', error)
    return c.json({ success: false, error: '取引情報の取得に失敗しました' }, 500)
  }
})

// 出品商品一覧
mypage.get('/listings/:userId', async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const userId = c.req.param('userId')

    if (String(authUserId) !== String(userId)) {
      return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
    }
    const status = c.req.query('status') || 'all' // all, active, draft, sold

    let query = `
      SELECT 
        p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url,
        (SELECT COUNT(*) FROM favorites WHERE product_id = p.id) as favorite_count,
        (SELECT COUNT(*) FROM product_comments WHERE product_id = p.id AND deleted_at IS NULL) as comment_count
      FROM products p
      WHERE p.user_id = ? AND p.status != 'deleted'
    `
    
    if (status === 'active') {
      query += ` AND p.status = 'active'`
    } else if (status === 'draft') {
      query += ` AND p.status = 'draft'`
    } else if (status === 'sold') {
      query += ` AND p.status = 'sold'`
    }
    
    query += ` ORDER BY p.created_at DESC`

    const { results } = await DB.prepare(query).bind(userId).all()

    // 画像URLを変換
    const data = results.map((p: any) => ({
      ...p,
      image_url: toImageUrl(p.image_url)
    }))

    return c.json({ success: true, data })
  } catch (error) {
    console.error('Get listings error:', error)
    return c.json({ success: false, error: '出品商品の取得に失敗しました' }, 500)
  }
})

// 購入履歴
mypage.get('/purchases/:userId', async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const userId = c.req.param('userId')

    if (String(authUserId) !== String(userId)) {
      return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
    }

    const { results } = await DB.prepare(`
      SELECT 
        t.id as transaction_id,
        t.product_id,
        t.amount as total_price,
        t.status,
        t.created_at,
        t.paid_at,
        t.shipped_at,
        t.completed_at,
        t.updated_at as purchased_at,
        t.tracking_number,
        t.shipping_carrier,
        p.title as product_title,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image,
        CASE 
          WHEN EXISTS (SELECT 1 FROM reviews WHERE transaction_id = t.id AND reviewer_id = ?) THEN 1
          ELSE 0
        END as reviewed
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users u ON t.seller_id = u.id
      WHERE t.buyer_id = ?
      ORDER BY 
        CASE t.status
          WHEN 'shipped' THEN 1
          WHEN 'paid' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'completed' THEN 4
          WHEN 'cancelled' THEN 5
        END,
        t.created_at DESC
    `).bind(userId, userId).all()

    const data = results.map((p: any) => ({
      ...p,
      product_image: toImageUrl(p.product_image)
    }))

    return c.json({ success: true, data })
  } catch (error) {
    console.error('Get purchases error:', error)
    return c.json({ success: false, error: '購入履歴の取得に失敗しました' }, 500)
  }
})

// 売上履歴（進行中取引も含む）
mypage.get('/sales/:userId', async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const userId = c.req.param('userId')

    if (String(authUserId) !== String(userId)) {
      return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
    }

    const { results } = await DB.prepare(`
      SELECT 
        t.id as transaction_id,
        t.product_id,
        t.amount as sale_price,
        t.fee as commission_fee,
        (t.amount - COALESCE(t.fee, 0)) as seller_revenue,
        t.created_at,
        t.paid_at,
        t.shipped_at,
        t.completed_at,
        t.updated_at as sold_at,
        t.status,
        t.tracking_number,
        t.shipping_carrier,
        p.title as product_title,
        COALESCE(u.company_name, u.nickname, u.name) as buyer_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users u ON t.buyer_id = u.id
      WHERE t.seller_id = ? AND t.status IN ('paid', 'shipped', 'completed')
      ORDER BY 
        CASE t.status
          WHEN 'paid' THEN 1
          WHEN 'shipped' THEN 2
          WHEN 'completed' THEN 3
        END,
        t.created_at DESC
    `).bind(userId).all()

    const data = results.map((s: any) => ({
      ...s,
      product_image: toImageUrl(s.product_image)
    }))

    return c.json({ success: true, data })
  } catch (error) {
    console.error('Get sales error:', error)
    return c.json({ success: false, error: '売上履歴の取得に失敗しました' }, 500)
  }
})

// 月別売上集計
mypage.get('/sales-summary/:userId', async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const userId = c.req.param('userId')

    if (String(authUserId) !== String(userId)) {
      return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
    }

    const { results } = await DB.prepare(`
      SELECT 
        strftime('%Y-%m', updated_at) as month,
        COUNT(*) as transaction_count,
        SUM(amount) as total_sales,
        SUM(fee) as total_fees,
        SUM(amount - fee) as net_income
      FROM transactions
      WHERE seller_id = ? AND status = 'completed'
      GROUP BY strftime('%Y-%m', updated_at)
      ORDER BY month DESC
      LIMIT 12
    `).bind(userId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get sales summary error:', error)
    return c.json({ success: false, error: '売上集計の取得に失敗しました' }, 500)
  }
})

// お気に入り商品一覧
mypage.get('/favorites/:userId', async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const userId = c.req.param('userId')

    if (String(authUserId) !== String(userId)) {
      return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
    }

    const { results } = await DB.prepare(`
      SELECT 
        p.*,
        f.created_at as favorited_at,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).bind(userId).all()

    const data = results.map((p: any) => ({
      ...p,
      image_url: toImageUrl(p.image_url)
    }))

    return c.json({ success: true, data })
  } catch (error) {
    console.error('Get favorites error:', error)
    return c.json({ success: false, error: 'お気に入り商品の取得に失敗しました' }, 500)
  }
})

// お気に入り削除
mypage.delete('/favorites/:productId', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')
    const { user_id } = await c.req.json()

    await DB.prepare(`
      DELETE FROM favorites 
      WHERE product_id = ? AND user_id = ?
    `).bind(productId, user_id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete favorite error:', error)
    return c.json({ success: false, error: 'お気に入り削除に失敗しました' }, 500)
  }
})

// 商品ステータス変更（停止・再開）
mypage.put('/listings/:productId/status', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')
    const { status, seller_id } = await c.req.json()

    // 商品の所有者確認
    const product = await DB.prepare(`
      SELECT user_id as seller_id FROM products WHERE id = ?
    `).bind(productId).first()

    if (!product || Number(product.seller_id) !== Number(seller_id)) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    // ステータス更新
    await DB.prepare(`
      UPDATE products 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(status, productId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update product status error:', error)
    return c.json({ success: false, error: 'ステータス変更に失敗しました' }, 500)
  }
})

// 商品削除（論理削除）
mypage.delete('/listings/:productId', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')
    const { seller_id } = await c.req.json()

    // 商品の所有者確認
    const product = await DB.prepare(`
      SELECT user_id as seller_id, status FROM products WHERE id = ?
    `).bind(productId).first()

    if (!product || Number(product.seller_id) !== Number(seller_id)) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    // 売却済みの商品は削除不可
    if (product.status === 'sold') {
      return c.json({ success: false, error: '売却済みの商品は削除できません' }, 400)
    }

    // ステータスを削除済みに変更
    await DB.prepare(`
      UPDATE products 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(productId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return c.json({ success: false, error: '商品削除に失敗しました' }, 500)
  }
})

// 振込申請
mypage.post('/withdrawal', async (c) => {
  try {
    const { DB } = c.env
    const { user_id, amount } = await c.req.json()

    // 最低振込額チェック
    if (amount < 1000) {
      return c.json({ success: false, error: '最低振込額は¥1,000です' }, 400)
    }

    // 振込可能額チェック
    const stats = await DB.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_sales,
        COALESCE(SUM(fee), 0) as total_fees
      FROM transactions 
      WHERE seller_id = ? AND status = 'completed'
    `).bind(user_id).first()

    const withdrawable = (stats?.total_sales || 0) - (stats?.total_fees || 0)

    if (amount > withdrawable) {
      return c.json({ success: false, error: '振込可能額を超えています' }, 400)
    }

    // 通知を作成（振込申請はテーブルなしで通知のみ）
    await DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'withdrawal', '振込申請を受け付けました', ?)
    `).bind(user_id, `¥${amount.toLocaleString()}の振込申請を受け付けました。3〜5営業日以内に振り込まれます。`).run()

    return c.json({ success: true, message: '振込申請を受け付けました' })
  } catch (error) {
    console.error('Withdrawal request error:', error)
    return c.json({ success: false, error: '振込申請に失敗しました' }, 500)
  }
})

export default mypage
