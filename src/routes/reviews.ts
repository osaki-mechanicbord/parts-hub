import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const reviews = new Hono<{ Bindings: Bindings }>()

// レビュー投稿
reviews.post('/', async (c) => {
  try {
    const { DB } = c.env
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

    if (comment.length < 100) {
      return c.json({ success: false, error: 'コメントは100文字以上入力してください' }, 400)
    }

    // トランザクション情報取得
    const transaction = await DB.prepare(`
      SELECT 
        t.*,
        p.seller_id,
        p.title as product_title
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `).bind(transaction_id).first()

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

    // レビュー投稿
    const result = await DB.prepare(`
      INSERT INTO reviews (
        transaction_id,
        reviewer_id,
        reviewed_user_id,
        product_id,
        rating,
        comment,
        product_condition_rating,
        communication_rating,
        shipping_rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      transaction_id,
      reviewer_id,
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
      `/reviews/${reviewId}`
    ).run()

    return c.json({ success: true, data: { id: reviewId } })
  } catch (error) {
    console.error('Post review error:', error)
    return c.json({ success: false, error: 'レビューの投稿に失敗しました' }, 500)
  }
})

// ユーザーの受け取ったレビュー一覧
reviews.get('/user/:userId/received', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')
    const limit = parseInt(c.req.query('limit') || '20')

    const { results } = await DB.prepare(`
      SELECT 
        r.*,
        reviewer.shop_name as reviewer_name,
        reviewer.profile_image_url as reviewer_image,
        p.title as product_title,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN products p ON r.product_id = p.id
      WHERE r.reviewed_user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `).bind(userId, limit).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get received reviews error:', error)
    return c.json({ success: false, error: 'レビューの取得に失敗しました' }, 500)
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
        reviewed.shop_name as reviewed_user_name,
        reviewed.profile_image_url as reviewed_user_image,
        p.title as product_title,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM reviews r
      JOIN users reviewed ON r.reviewed_user_id = reviewed.id
      JOIN products p ON r.product_id = p.id
      WHERE r.reviewer_id = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `).bind(userId, limit).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get written reviews error:', error)
    return c.json({ success: false, error: 'レビューの取得に失敗しました' }, 500)
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
        reviewer.shop_name as reviewer_name,
        reviewer.profile_image_url as reviewer_image,
        reviewed.shop_name as reviewed_user_name,
        p.title as product_title,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN users reviewed ON r.reviewed_user_id = reviewed.id
      JOIN products p ON r.product_id = p.id
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
