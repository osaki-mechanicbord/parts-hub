import { Hono } from 'hono'
import { authMiddleware } from '../auth'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const negotiations = new Hono<{ Bindings: Bindings }>()

// 全エンドポイントにJWT認証を適用
negotiations.use('/*', authMiddleware)

// 値下げリクエスト一覧取得（商品別）
negotiations.get('/product/:productId', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')

    const { results } = await DB.prepare(`
      SELECT 
        pn.*,
        COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_name,
        0 as buyer_verified
      FROM price_negotiations pn
      JOIN users buyer ON pn.buyer_id = buyer.id
      WHERE pn.product_id = ?
      ORDER BY pn.created_at DESC
    `).bind(productId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get negotiations error:', error)
    return c.json({ success: false, error: '値下げ交渉の取得に失敗しました' }, 500)
  }
})

// ユーザーの値下げリクエスト一覧取得
negotiations.get('/user/:userId', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')
    const type = c.req.query('type') // 'sent' or 'received'

    let query = `
      SELECT 
        pn.*,
        p.title as product_title,
        p.price as current_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image,
        COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_name,
        COALESCE(seller.company_name, seller.nickname, seller.name) as seller_name
      FROM price_negotiations pn
      JOIN products p ON pn.product_id = p.id
      JOIN users buyer ON pn.buyer_id = buyer.id
      JOIN users seller ON pn.seller_id = seller.id
      WHERE `
    
    let binds: any[] = []
    if (type === 'sent') {
      query += `pn.buyer_id = ?`
      binds = [userId]
    } else if (type === 'received') {
      query += `pn.seller_id = ?`
      binds = [userId]
    } else {
      query += `(pn.buyer_id = ? OR pn.seller_id = ?)`
      binds = [userId, userId]
    }
    
    query += ` ORDER BY pn.created_at DESC`

    const { results } = await DB.prepare(query).bind(...binds).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get user negotiations error:', error)
    return c.json({ success: false, error: '値下げ交渉の取得に失敗しました' }, 500)
  }
})

// 値下げリクエスト送信
negotiations.post('/', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { product_id, buyer_id, requested_price, message } = body

    if (!product_id || !buyer_id || !requested_price) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    // 商品情報取得
    const product = await DB.prepare(`
      SELECT user_id as seller_id, price FROM products WHERE id = ?
    `).bind(product_id).first()

    if (!product) {
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }

    // バリデーション：希望価格が現在の価格以上はNG
    if (requested_price >= product.price) {
      return c.json({ success: false, error: '希望価格は現在の価格より低く設定してください' }, 400)
    }

    // 有効期限を24時間後に設定
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const result = await DB.prepare(`
      INSERT INTO price_negotiations 
        (product_id, buyer_id, seller_id, original_price, requested_price, message, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product_id,
      buyer_id,
      product.seller_id,
      product.price,
      requested_price,
      message || null,
      expiresAt.toISOString()
    ).run()

    const negotiationId = result.meta.last_row_id

    // 出品者に通知
    await DB.prepare(`
      INSERT INTO notifications 
        (user_id, type, title, message, related_id, related_type, action_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product.seller_id,
      'price_offer',
      '値下げリクエストが届きました',
      `¥${requested_price.toLocaleString()}での購入希望があります`,
      negotiationId,
      'negotiation',
      `/products/${product_id}`
    ).run()

    return c.json({ success: true, data: { id: negotiationId } })
  } catch (error) {
    console.error('Send negotiation error:', error)
    return c.json({ success: false, error: '値下げリクエストの送信に失敗しました' }, 500)
  }
})

// 値下げリクエストに対応（承認・拒否・カウンター）
negotiations.put('/:negotiationId', async (c) => {
  try {
    const { DB } = c.env
    const negotiationId = c.req.param('negotiationId')
    const body = await c.req.json()
    const { seller_id, status, counter_price, message } = body

    if (!seller_id || !status) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    // 交渉情報取得
    const negotiation = await DB.prepare(`
      SELECT * FROM price_negotiations WHERE id = ?
    `).bind(negotiationId).first()

    if (!negotiation || negotiation.seller_id !== seller_id) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    if (negotiation.status !== 'pending' && negotiation.status !== 'counter_offered') {
      return c.json({ success: false, error: 'この値下げリクエストは既に処理されています' }, 400)
    }

    let finalPrice = negotiation.requested_price

    if (status === 'counter_offered') {
      if (!counter_price) {
        return c.json({ success: false, error: 'カウンター価格が必要です' }, 400)
      }
      finalPrice = counter_price
    } else if (status === 'accepted') {
      // 商品価格を更新
      const oldPrice = await DB.prepare(`
        SELECT price FROM products WHERE id = ?
      `).bind(negotiation.product_id).first()

      await DB.prepare(`
        UPDATE products SET price = ? WHERE id = ?
      `).bind(finalPrice, negotiation.product_id).run()

      // 価格履歴に記録
      await DB.prepare(`
        INSERT INTO price_history 
          (product_id, old_price, new_price, changed_by, reason, negotiation_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        negotiation.product_id,
        oldPrice.price,
        finalPrice,
        seller_id,
        '値下げ交渉により変更',
        negotiationId
      ).run()
    }

    // 交渉ステータス更新
    await DB.prepare(`
      UPDATE price_negotiations 
      SET status = ?, 
          counter_price = ?, 
          message = ?, 
          responded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, counter_price || null, message || null, negotiationId).run()

    // 購入者に通知
    let notificationTitle = ''
    let notificationMessage = ''
    
    if (status === 'accepted') {
      notificationTitle = '値下げリクエストが承認されました'
      notificationMessage = `出品者が¥${finalPrice.toLocaleString()}での販売に同意しました`
    } else if (status === 'rejected') {
      notificationTitle = '値下げリクエストが却下されました'
      notificationMessage = message || '出品者が値下げを見送りました'
    } else if (status === 'counter_offered') {
      notificationTitle = 'カウンターオファーが届きました'
      notificationMessage = `出品者から¥${counter_price.toLocaleString()}の提案があります`
    }

    await DB.prepare(`
      INSERT INTO notifications 
        (user_id, type, title, message, related_id, related_type, action_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      negotiation.buyer_id,
      `price_${status}`,
      notificationTitle,
      notificationMessage,
      negotiationId,
      'negotiation',
      `/products/${negotiation.product_id}`
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Respond to negotiation error:', error)
    return c.json({ success: false, error: '値下げリクエストの処理に失敗しました' }, 500)
  }
})

// 値下げリクエストのカウンターに対する購入者の承認
negotiations.put('/:negotiationId/accept-counter', async (c) => {
  try {
    const { DB } = c.env
    const negotiationId = c.req.param('negotiationId')
    const body = await c.req.json()
    const { buyer_id } = body

    if (!buyer_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    // 交渉情報取得
    const negotiation = await DB.prepare(`
      SELECT * FROM price_negotiations WHERE id = ?
    `).bind(negotiationId).first()

    if (!negotiation || negotiation.buyer_id !== buyer_id) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    if (negotiation.status !== 'countered') {
      return c.json({ success: false, error: 'カウンターオファーがありません' }, 400)
    }

    // 商品価格を更新
    const oldPrice = await DB.prepare(`
      SELECT price FROM products WHERE id = ?
    `).bind(negotiation.product_id).first()

    await DB.prepare(`
      UPDATE products SET price = ? WHERE id = ?
    `).bind(negotiation.counter_price, negotiation.product_id).run()

    // 価格履歴に記録
    await DB.prepare(`
      INSERT INTO price_history 
        (product_id, old_price, new_price, changed_by, reason, negotiation_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      negotiation.product_id,
      oldPrice.price,
      negotiation.counter_price,
      buyer_id,
      '値下げ交渉（カウンター承認）により変更',
      negotiationId
    ).run()

    // 交渉ステータス更新
    await DB.prepare(`
      UPDATE price_negotiations 
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(negotiationId).run()

    // 出品者に通知
    await DB.prepare(`
      INSERT INTO notifications 
        (user_id, type, title, message, related_id, related_type, action_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      negotiation.seller_id,
      'counter_accepted',
      'カウンターオファーが承認されました',
      `購入者が¥${negotiation.counter_price.toLocaleString()}での購入に同意しました`,
      negotiationId,
      'negotiation',
      `/products/${negotiation.product_id}`
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Accept counter offer error:', error)
    return c.json({ success: false, error: 'カウンターオファーの承認に失敗しました' }, 500)
  }
})

export default negotiations
