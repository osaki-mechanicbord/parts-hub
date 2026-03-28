import { Hono } from 'hono'
import { authMiddleware } from '../auth'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const favorites = new Hono<{ Bindings: Bindings }>()

// お気に入り一覧取得（認証済みユーザーの全お気に入り）
favorites.get('/', authMiddleware, async (c) => {
  try {
    const { DB } = c.env
    const userId = c.get('userId')

    const { results } = await DB.prepare(`
      SELECT 
        f.*,
        p.title,
        p.price,
        p.condition,
        p.status as product_status,
        p.user_id as seller_id,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).bind(userId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get favorites error:', error)
    return c.json({ success: false, error: 'お気に入りの取得に失敗しました' }, 500)
  }
})

// お気に入り一覧取得（ユーザーID指定 - 後方互換）
favorites.get('/user/:userId', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')

    const { results } = await DB.prepare(`
      SELECT 
        f.*,
        p.title,
        p.price,
        p.condition,
        p.status as product_status,
        p.user_id as seller_id,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).bind(userId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get favorites error:', error)
    return c.json({ success: false, error: 'お気に入りの取得に失敗しました' }, 500)
  }
})

// お気に入り追加（認証済み）
favorites.post('/', authMiddleware, async (c) => {
  try {
    const { DB } = c.env
    const userId = c.get('userId')
    const body = await c.req.json()
    const { product_id } = body

    if (!product_id) {
      return c.json({ success: false, error: '商品IDが必要です' }, 400)
    }

    // 既にお気に入り済みかチェック
    const existing = await DB.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
    `).bind(userId, product_id).first()

    if (existing) {
      // 既にお気に入り済み → 削除（トグル動作）
      await DB.prepare(`DELETE FROM favorites WHERE id = ?`).bind(existing.id).run()
      
      await DB.prepare(`
        UPDATE products 
        SET favorite_count = (SELECT COUNT(*) FROM favorites WHERE product_id = ?)
        WHERE id = ?
      `).bind(product_id, product_id).run()

      return c.json({ success: true, action: 'removed', message: 'お気に入りを解除しました' })
    }

    const result = await DB.prepare(`
      INSERT INTO favorites (user_id, product_id)
      VALUES (?, ?)
    `).bind(userId, product_id).run()

    // 商品のお気に入り数を更新
    await DB.prepare(`
      UPDATE products 
      SET favorite_count = (SELECT COUNT(*) FROM favorites WHERE product_id = ?)
      WHERE id = ?
    `).bind(product_id, product_id).run()

    return c.json({ success: true, action: 'added', data: { id: result.meta.last_row_id } })
  } catch (error) {
    console.error('Add favorite error:', error)
    return c.json({ success: false, error: 'お気に入りの操作に失敗しました' }, 500)
  }
})

// お気に入り削除（favorite ID指定）
favorites.delete('/:favoriteId', authMiddleware, async (c) => {
  try {
    const { DB } = c.env
    const userId = c.get('userId')
    const favoriteId = c.req.param('favoriteId')

    // お気に入り情報取得
    const favorite = await DB.prepare(`
      SELECT * FROM favorites WHERE id = ? AND user_id = ?
    `).bind(favoriteId, userId).first()

    if (!favorite) {
      return c.json({ success: false, error: 'お気に入りが見つかりません' }, 404)
    }

    await DB.prepare(`DELETE FROM favorites WHERE id = ?`).bind(favoriteId).run()

    // 商品のお気に入り数を更新
    await DB.prepare(`
      UPDATE products 
      SET favorite_count = (SELECT COUNT(*) FROM favorites WHERE product_id = ?)
      WHERE id = ?
    `).bind(favorite.product_id, favorite.product_id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete favorite error:', error)
    return c.json({ success: false, error: 'お気に入りの削除に失敗しました' }, 500)
  }
})

// 商品がお気に入り済みかチェック
favorites.get('/check/:productId/:userId', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')
    const userId = c.req.param('userId')

    const favorite = await DB.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
    `).bind(userId, productId).first()

    return c.json({ 
      success: true, 
      data: { 
        is_favorited: !!favorite,
        favorite_id: favorite?.id || null
      } 
    })
  } catch (error) {
    console.error('Check favorite error:', error)
    return c.json({ success: false, error: 'チェックに失敗しました' }, 500)
  }
})

export default favorites
