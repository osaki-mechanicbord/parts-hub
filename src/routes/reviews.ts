import { Hono } from 'hono'
import { authMiddleware } from '../auth'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const reviews = new Hono<{ Bindings: Bindings }>()

// ===== バッジ計算ロジック =====
interface BadgeInfo {
  level: string
  label: string
  color: string
  bgColor: string
  icon: string
  nextLevel: string | null
  nextThreshold: number | null
  progress: number
}

function calculateBadge(avgRating: number, totalReviews: number, completedTransactions: number): BadgeInfo {
  // バッジレベル定義
  if (totalReviews >= 50 && avgRating >= 4.8) {
    return { level: 'platinum', label: 'プラチナ', color: '#7c3aed', bgColor: '#ede9fe', icon: 'fa-gem', nextLevel: null, nextThreshold: null, progress: 100 }
  }
  if (totalReviews >= 30 && avgRating >= 4.5) {
    return { level: 'gold', label: 'ゴールド', color: '#d97706', bgColor: '#fef3c7', icon: 'fa-crown', nextLevel: 'プラチナ', nextThreshold: 50, progress: Math.min(100, (totalReviews / 50) * 100) }
  }
  if (totalReviews >= 10 && avgRating >= 4.0) {
    return { level: 'silver', label: 'シルバー', color: '#6b7280', bgColor: '#f3f4f6', icon: 'fa-medal', nextLevel: 'ゴールド', nextThreshold: 30, progress: Math.min(100, (totalReviews / 30) * 100) }
  }
  if (totalReviews >= 3 && avgRating >= 3.5) {
    return { level: 'bronze', label: 'ブロンズ', color: '#b45309', bgColor: '#fef3c7', icon: 'fa-award', nextLevel: 'シルバー', nextThreshold: 10, progress: Math.min(100, (totalReviews / 10) * 100) }
  }
  if (completedTransactions >= 1) {
    return { level: 'starter', label: 'スターター', color: '#10b981', bgColor: '#d1fae5', icon: 'fa-seedling', nextLevel: 'ブロンズ', nextThreshold: 3, progress: Math.min(100, (totalReviews / 3) * 100) }
  }
  return { level: 'new', label: '新規', color: '#9ca3af', bgColor: '#f9fafb', icon: 'fa-user', nextLevel: 'スターター', nextThreshold: 1, progress: 0 }
}

// ===== 出品者レビューサマリー（商品ページ用） =====
reviews.get('/seller/:userId/summary', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')

    // 平均評価・件数取得（reviewee_id または reviewed_user_id で対応）
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        COALESCE(AVG(product_condition_rating), 0) as avg_condition,
        COALESCE(AVG(communication_rating), 0) as avg_communication,
        COALESCE(AVG(shipping_rating), 0) as avg_shipping,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE reviewee_id = ? OR reviewed_user_id = ?
    `).bind(userId, userId).first() as any

    // 完了取引数
    const txCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE (buyer_id = ? OR seller_id = ?) AND status = 'completed'
    `).bind(userId, userId).first() as any

    const totalReviews = Number(stats?.total_reviews || 0)
    const avgRating = Number(stats?.avg_rating || 0)
    const completedTransactions = Number(txCount?.count || 0)

    // バッジ計算
    const badge = calculateBadge(avgRating, totalReviews, completedTransactions)

    // 直近5件のレビュー
    const { results: recentReviews } = await DB.prepare(`
      SELECT 
        r.id, r.rating, r.comment, r.created_at,
        r.product_condition_rating, r.communication_rating, r.shipping_rating,
        COALESCE(reviewer.company_name, reviewer.nickname, reviewer.name, '匿名') as reviewer_name,
        reviewer.profile_image_url as reviewer_image,
        p.title as product_title
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN products p ON (r.product_id = p.id)
      WHERE r.reviewee_id = ? OR r.reviewed_user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `).bind(userId, userId).all()

    return c.json({
      success: true,
      data: {
        avg_rating: Math.round(avgRating * 10) / 10,
        total_reviews: totalReviews,
        completed_transactions: completedTransactions,
        distribution: {
          five: Number(stats?.five_star || 0),
          four: Number(stats?.four_star || 0),
          three: Number(stats?.three_star || 0),
          two: Number(stats?.two_star || 0),
          one: Number(stats?.one_star || 0)
        },
        detail_averages: {
          condition: Math.round(Number(stats?.avg_condition || 0) * 10) / 10,
          communication: Math.round(Number(stats?.avg_communication || 0) * 10) / 10,
          shipping: Math.round(Number(stats?.avg_shipping || 0) * 10) / 10
        },
        badge,
        recent_reviews: recentReviews
      }
    })
  } catch (error) {
    console.error('Get seller summary error:', error)
    return c.json({
      success: true,
      data: {
        avg_rating: 0,
        total_reviews: 0,
        completed_transactions: 0,
        distribution: { five: 0, four: 0, three: 0, two: 0, one: 0 },
        detail_averages: { condition: 0, communication: 0, shipping: 0 },
        badge: calculateBadge(0, 0, 0),
        recent_reviews: []
      }
    })
  }
})

// レビュー投稿（認証必須）
reviews.post('/', authMiddleware, async (c) => {
  try {
    const { DB } = c.env
    const authUserId = c.get('userId')
    const body = await c.req.json()
    const {
      transaction_id,
      reviewer_id,
      rating,
      comment,
      product_condition_rating,
      communication_rating,
      shipping_rating
    } = body

    // バリデーション
    if (!transaction_id || !reviewer_id || !rating || !comment) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    if (rating < 1 || rating > 5) {
      return c.json({ success: false, error: '評価は1〜5の範囲で指定してください' }, 400)
    }

    if (comment.length < 5) {
      return c.json({ success: false, error: 'コメントは5文字以上入力してください' }, 400)
    }

    // 認証ユーザーとreviewer_idの一致確認
    if (String(authUserId) !== String(reviewer_id)) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    // トランザクション情報取得
    const transaction = await DB.prepare(`
      SELECT 
        t.*,
        p.user_id as seller_id,
        p.title as product_title
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `).bind(transaction_id).first() as any

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // 取引完了チェック
    if (transaction.status !== 'completed') {
      return c.json({ success: false, error: '取引が完了していません' }, 400)
    }

    // レビュー権限チェック（購入者または出品者のみ）
    if (transaction.buyer_id !== reviewer_id && transaction.seller_id !== reviewer_id) {
      return c.json({ success: false, error: 'この取引のレビュー権限がありません' }, 403)
    }

    // 既存レビューチェック
    const existingReview = await DB.prepare(`
      SELECT id FROM reviews 
      WHERE transaction_id = ? AND reviewer_id = ?
    `).bind(transaction_id, reviewer_id).first()

    if (existingReview) {
      return c.json({ success: false, error: '既にレビューを投稿しています' }, 400)
    }

    // レビュー対象ユーザーを決定
    const reviewed_user_id = transaction.buyer_id === reviewer_id 
      ? transaction.seller_id 
      : transaction.buyer_id

    // レビュー投稿（reviewee_id と reviewed_user_id の両方に保存）
    const result = await DB.prepare(`
      INSERT INTO reviews (
        transaction_id,
        reviewer_id,
        reviewee_id,
        reviewed_user_id,
        product_id,
        rating,
        comment,
        product_condition_rating,
        communication_rating,
        shipping_rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      transaction_id,
      reviewer_id,
      reviewed_user_id,
      reviewed_user_id,
      transaction.product_id,
      rating,
      comment,
      product_condition_rating || null,
      communication_rating || null,
      shipping_rating || null
    ).run()

    const reviewId = result.meta.last_row_id

    // 通知を作成
    await DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url)
      VALUES (?, 'review', '新しいレビューが投稿されました', ?, ?, 'review', ?)
    `).bind(
      reviewed_user_id,
      `${rating}つ星のレビューを受け取りました`,
      reviewId,
      `/seller/${reviewed_user_id}`
    ).run()

    return c.json({ success: true, data: { id: reviewId } })
  } catch (error) {
    console.error('Post review error:', error)
    return c.json({ success: false, error: 'レビューの投稿に失敗しました' }, 500)
  }
})

// ユーザーの受け取ったレビュー一覧（ページネーション対応）
reviews.get('/user/:userId/received', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')
    const ratingFilter = c.req.query('rating')

    let whereClause = '(r.reviewee_id = ? OR r.reviewed_user_id = ?)'
    const params: any[] = [userId, userId]

    if (ratingFilter) {
      whereClause += ' AND r.rating = ?'
      params.push(parseInt(ratingFilter))
    }

    const { results } = await DB.prepare(`
      SELECT 
        r.*,
        COALESCE(reviewer.company_name, reviewer.nickname, reviewer.name, '匿名') as reviewer_name,
        reviewer.profile_image_url as reviewer_image,
        p.title as product_title,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN products p ON (r.product_id = p.id)
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get received reviews error:', error)
    return c.json({ success: false, data: [] })
  }
})

// ユーザーが書いたレビュー一覧
reviews.get('/user/:userId/written', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')
    const limit = parseInt(c.req.query('limit') || '20')

    const { results } = await DB.prepare(`
      SELECT 
        r.*,
        COALESCE(reviewed.company_name, reviewed.nickname, reviewed.name, '匿名') as reviewed_user_name,
        reviewed.profile_image_url as reviewed_user_image,
        p.title as product_title,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM reviews r
      LEFT JOIN users reviewed ON (r.reviewed_user_id = reviewed.id OR r.reviewee_id = reviewed.id)
      LEFT JOIN products p ON (r.product_id = p.id)
      WHERE r.reviewer_id = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `).bind(userId, limit).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get written reviews error:', error)
    return c.json({ success: false, data: [] })
  }
})

// レビュー詳細取得
reviews.get('/:reviewId', async (c) => {
  try {
    const { DB } = c.env
    const reviewId = c.req.param('reviewId')

    const review = await DB.prepare(`
      SELECT 
        r.*,
        COALESCE(reviewer.company_name, reviewer.nickname, reviewer.name, '匿名') as reviewer_name,
        reviewer.profile_image_url as reviewer_image,
        COALESCE(reviewed.company_name, reviewed.nickname, reviewed.name, '匿名') as reviewed_user_name,
        p.title as product_title,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON (r.reviewed_user_id = reviewed.id OR r.reviewee_id = reviewed.id)
      LEFT JOIN products p ON (r.product_id = p.id)
      WHERE r.id = ?
    `).bind(reviewId).first()

    if (!review) {
      return c.json({ success: false, error: 'レビューが見つかりません' }, 404)
    }

    return c.json({ success: true, data: review })
  } catch (error) {
    console.error('Get review error:', error)
    return c.json({ success: false, error: 'レビューの取得に失敗しました' }, 500)
  }
})

export default reviews
