import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const comments = new Hono<{ Bindings: Bindings }>()

// コメント一覧取得
comments.get('/:productId', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')

    const { results } = await DB.prepare(`
      SELECT 
        pc.*,
        u.shop_name as user_name,
        u.shop_type,
        u.is_verified,
        (SELECT COUNT(*) FROM product_comments WHERE parent_comment_id = pc.id AND deleted_at IS NULL) as reply_count
      FROM product_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.product_id = ? 
        AND pc.parent_comment_id IS NULL 
        AND pc.deleted_at IS NULL
      ORDER BY pc.created_at DESC
    `).bind(productId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get comments error:', error)
    return c.json({ success: false, error: 'コメントの取得に失敗しました' }, 500)
  }
})

// コメントの返信取得
comments.get('/:productId/:commentId/replies', async (c) => {
  try {
    const { DB } = c.env
    const commentId = c.req.param('commentId')

    const { results } = await DB.prepare(`
      SELECT 
        pc.*,
        u.shop_name as user_name,
        u.shop_type,
        u.is_verified
      FROM product_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.parent_comment_id = ? 
        AND pc.deleted_at IS NULL
      ORDER BY pc.created_at ASC
    `).bind(commentId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get replies error:', error)
    return c.json({ success: false, error: '返信の取得に失敗しました' }, 500)
  }
})

// コメント投稿
comments.post('/:productId', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')
    const body = await c.req.json()

    const { user_id, comment_text, is_question, parent_comment_id } = body

    if (!user_id || !comment_text) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    const result = await DB.prepare(`
      INSERT INTO product_comments 
        (product_id, user_id, comment_text, is_question, parent_comment_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(productId, user_id, comment_text, is_question || 0, parent_comment_id || null).run()

    const commentId = result.meta.last_row_id

    // 通知を作成（出品者に通知）
    const product = await DB.prepare(`
      SELECT seller_id FROM products WHERE id = ?
    `).bind(productId).first()

    if (product && product.seller_id !== user_id) {
      await DB.prepare(`
        INSERT INTO notifications 
          (user_id, type, title, message, related_id, related_type, action_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        product.seller_id,
        is_question ? 'question' : 'comment',
        is_question ? '商品に質問が届きました' : 'コメントが投稿されました',
        comment_text.substring(0, 100),
        productId,
        'product',
        `/products/${productId}`
      ).run()
    }

    return c.json({ success: true, data: { id: commentId } })
  } catch (error) {
    console.error('Post comment error:', error)
    return c.json({ success: false, error: 'コメントの投稿に失敗しました' }, 500)
  }
})

// コメント削除（ソフトデリート）
comments.delete('/:productId/:commentId', async (c) => {
  try {
    const { DB } = c.env
    const commentId = c.req.param('commentId')
    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    // コメントの所有者確認
    const comment = await DB.prepare(`
      SELECT user_id FROM product_comments WHERE id = ?
    `).bind(commentId).first()

    if (!comment || comment.user_id !== user_id) {
      return c.json({ success: false, error: '削除する権限がありません' }, 403)
    }

    await DB.prepare(`
      UPDATE product_comments 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(commentId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return c.json({ success: false, error: 'コメントの削除に失敗しました' }, 500)
  }
})

export default comments
