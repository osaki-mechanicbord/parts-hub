import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const transactions = new Hono<{ Bindings: Bindings }>()

// 取引詳細取得
transactions.get('/:transactionId', async (c) => {
  try {
    const { DB } = c.env
    const transactionId = c.req.param('transactionId')

    const transaction = await DB.prepare(`
      SELECT 
        t.*,
        p.title as product_title,
        p.price as product_price,
        buyer.shop_name as buyer_name,
        buyer.email as buyer_email,
        buyer.phone as buyer_phone,
        seller.shop_name as seller_name,
        seller.email as seller_email,
        seller.phone as seller_phone,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as product_image
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE t.id = ?
    `).bind(transactionId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // レビュー情報も取得
    const review = await DB.prepare(`
      SELECT id, reviewer_id, rating, comment 
      FROM reviews 
      WHERE transaction_id = ?
    `).bind(transactionId).first()

    return c.json({ 
      success: true, 
      data: {
        ...transaction,
        has_review: !!review,
        review: review || null
      }
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    return c.json({ success: false, error: '取引情報の取得に失敗しました' }, 500)
  }
})

// 取引ステータス更新
transactions.put('/:transactionId/status', async (c) => {
  try {
    const { DB } = c.env
    const transactionId = c.req.param('transactionId')
    const body = await c.req.json()
    const { status, user_id, tracking_number } = body

    // 取引情報取得
    const transaction = await DB.prepare(`
      SELECT * FROM transactions WHERE id = ?
    `).bind(transactionId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // 権限チェック
    if (transaction.buyer_id !== user_id && transaction.seller_id !== user_id) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    // ステータス遷移チェック
    const allowedTransitions = {
      'pending': ['paid', 'cancelled'],
      'paid': ['shipped', 'cancelled'],
      'shipped': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    }

    if (!allowedTransitions[transaction.status]?.includes(status)) {
      return c.json({ success: false, error: '無効なステータス遷移です' }, 400)
    }

    // ステータス更新
    const updateFields: string[] = ['status = ?']
    const updateValues: any[] = [status]

    if (status === 'paid') {
      updateFields.push('paid_at = CURRENT_TIMESTAMP')
    } else if (status === 'shipped') {
      updateFields.push('shipped_at = CURRENT_TIMESTAMP')
      if (tracking_number) {
        updateFields.push('tracking_number = ?')
        updateValues.push(tracking_number)
      }
    } else if (status === 'completed') {
      updateFields.push('completed_at = CURRENT_TIMESTAMP')
    } else if (status === 'cancelled') {
      updateFields.push('cancelled_at = CURRENT_TIMESTAMP')
    }

    updateValues.push(transactionId)

    await DB.prepare(`
      UPDATE transactions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...updateValues).run()

    // 通知を作成
    let notificationTitle = ''
    let notificationMessage = ''
    let recipientId = transaction.buyer_id === user_id ? transaction.seller_id : transaction.buyer_id

    if (status === 'paid') {
      notificationTitle = '支払いが完了しました'
      notificationMessage = '購入者が支払いを完了しました。商品を発送してください。'
    } else if (status === 'shipped') {
      notificationTitle = '商品が発送されました'
      notificationMessage = tracking_number 
        ? `追跡番号: ${tracking_number}` 
        : '出品者が商品を発送しました'
    } else if (status === 'completed') {
      notificationTitle = '取引が完了しました'
      notificationMessage = '商品の受け取りが完了しました。レビューをお願いします。'
    } else if (status === 'cancelled') {
      notificationTitle = '取引がキャンセルされました'
      notificationMessage = '取引がキャンセルされました'
    }

    await DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url)
      VALUES (?, 'transaction', ?, ?, ?, 'transaction', ?)
    `).bind(
      recipientId,
      notificationTitle,
      notificationMessage,
      transactionId,
      `/transactions/${transactionId}`
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update transaction status error:', error)
    return c.json({ success: false, error: 'ステータスの更新に失敗しました' }, 500)
  }
})

export default transactions
