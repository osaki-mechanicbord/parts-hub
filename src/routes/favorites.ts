import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const favorites = new Hono<{ Bindings: Bindings }>()

// お気に入り一覧取得
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
        p.seller_id,
        u.shop_name as seller_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).bind(userId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get favorites error:', error)
    return c.json({ success: false, error: 'お気に入りの取得に失敗しました' }, 500)
  }
})

// お気に入り追加
favorites.post('/', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { user_id, product_id } = body

    if (!user_id || !product_id) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    // 既にお気に入り済みかチェック
    const existing = await DB.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
    `).bind(user_id, product_id).first()

    if (existing) {
      return c.json({ success: false, error: '既にお気に入りに追加されています' }, 400)
    }

    const result = await DB.prepare(`
      INSERT INTO favorites (user_id, product_id)
      VALUES (?, ?)
    `).bind(user_id, product_id).run()

    // 商品のお気に入り数を更新
    await DB.prepare(`
      UPDATE products 
      SET favorite_count = (SELECT COUNT(*) FROM favorites WHERE product_id = ?)
      WHERE id = ?
    `).bind(product_id, product_id).run()

    return c.json({ success: true, data: { id: result.meta.last_row_id } })
  } catch (error) {
    console.error('Add favorite error:', error)
    return c.json({ success: false, error: 'お気に入りの追加に失敗しました' }, 500)
  }
})

// お気に入り削除
favorites.delete('/:favoriteId', async (c) => {
  try {
    const { DB } = c.env
    const favoriteId = c.req.param('favoriteId')
    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    // お気に入り情報取得
    const favorite = await DB.prepare(`
      SELECT * FROM favorites WHERE id = ? AND user_id = ?
    `).bind(favoriteId, user_id).first()

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
