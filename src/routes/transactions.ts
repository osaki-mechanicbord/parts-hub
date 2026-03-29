import { Hono } from 'hono'
import { authMiddleware } from '../auth'
import { sendEmail } from '../email-config'
import * as tpl from '../email-templates'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
  RESEND_API_KEY?: string
}

const transactions = new Hono<{ Bindings: Bindings }>()

// 取引詳細取得（認証必須 + 当事者のみアクセス可能）
transactions.get('/:transactionId', authMiddleware, async (c) => {
  try {
    const { DB } = c.env
    const transactionId = c.req.param('transactionId')
    const userId = c.get('userId')

    const transaction = await DB.prepare(`
      SELECT 
        t.*,
        p.title as product_title,
        p.price as product_price,
        COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_name,
        buyer.email as buyer_email,
        buyer.phone as buyer_phone,
        COALESCE(seller.company_name, seller.nickname, seller.name) as seller_name,
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

    // ★ 当事者チェック: 購入者または出品者のみアクセス可能
    if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
      return c.json({ success: false, error: 'この取引へのアクセス権限がありません' }, 403)
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

// 取引ステータス更新（認証必須 + トークンからuser_id取得）
transactions.put('/:transactionId/status', authMiddleware, async (c) => {
  try {
    const { DB } = c.env
    const transactionId = c.req.param('transactionId')
    const userId = c.get('userId') // ★ トークンからuser_idを取得（リクエストbodyのuser_idは無視）
    const body = await c.req.json()
    const { status, tracking_number } = body

    // 取引情報取得
    const transaction = await DB.prepare(`
      SELECT * FROM transactions WHERE id = ?
    `).bind(transactionId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // ★ 権限チェック: トークンのuser_idで検証
    if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    // ★ 操作権限の詳細チェック
    // 出品者のみ: shipped に変更可能
    if (status === 'shipped' && transaction.seller_id !== userId) {
      return c.json({ success: false, error: '発送報告は出品者のみ可能です' }, 403)
    }
    // 購入者のみ: completed に変更可能
    if (status === 'completed' && transaction.buyer_id !== userId) {
      return c.json({ success: false, error: '受取完了は購入者のみ可能です' }, 403)
    }

    // ステータス遷移チェック
    const allowedTransitions: Record<string, string[]> = {
      'pending': ['paid', 'cancelled'],
      'paid': ['shipped', 'cancelled'],
      'shipped': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    }

    if (!allowedTransitions[transaction.status as string]?.includes(status)) {
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
    let recipientId = transaction.buyer_id === userId ? transaction.seller_id : transaction.buyer_id

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

    // 6) 発送済みの場合、購入者にメール通知
    if (status === 'shipped' && (c.env as any).RESEND_API_KEY) {
      try {
        const txDetail = await DB.prepare(`
          SELECT 
            p.title as product_name,
            buyer.name as buyer_name, buyer.email as buyer_email
          FROM transactions t
          JOIN products p ON t.product_id = p.id
          JOIN users buyer ON t.buyer_id = buyer.id
          WHERE t.id = ?
        `).bind(transactionId).first()

        if (txDetail) {
          const mail = tpl.productShipped({
            buyerName: txDetail.buyer_name as string,
            productName: txDetail.product_name as string,
            transactionId: parseInt(transactionId),
            trackingNumber: tracking_number || undefined,
          })
          await sendEmail((c.env as any).RESEND_API_KEY, { to: txDetail.buyer_email as string, ...mail })
        }
      } catch (emailErr) {
        console.error('Failed to send shipping notification email:', emailErr)
      }
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Update transaction status error:', error)
    return c.json({ success: false, error: 'ステータスの更新に失敗しました' }, 500)
  }
})

export default transactions
