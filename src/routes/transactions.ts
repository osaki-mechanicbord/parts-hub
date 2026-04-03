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

// R2キーを表示用URLに変換するヘルパー
function toImageUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/r2/')) return key
  return `/r2/${key}`
}

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
        buyer.postal_code as buyer_postal_code,
        buyer.prefecture as buyer_prefecture,
        buyer.city as buyer_city,
        buyer.address as buyer_address,
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

    // 出品者には購入者の住所を表示（発送に必要）
    const isSeller = transaction.seller_id === userId
    let shippingAddress = null
    if (isSeller) {
      // 取引に保存された配送先があればそれを使用、なければ購入者のプロフィール住所
      if (transaction.shipping_address) {
        shippingAddress = {
          name: transaction.shipping_name,
          postal_code: transaction.shipping_postal_code,
          address: transaction.shipping_address,
          phone: transaction.shipping_phone,
        }
      } else if (transaction.buyer_postal_code || transaction.buyer_address) {
        shippingAddress = {
          name: transaction.buyer_name,
          postal_code: transaction.buyer_postal_code,
          address: [transaction.buyer_prefecture, transaction.buyer_city, transaction.buyer_address].filter(Boolean).join(''),
          phone: transaction.buyer_phone,
        }
      }
    }

    return c.json({ 
      success: true, 
      data: {
        ...transaction,
        product_image: toImageUrl(transaction.product_image as string),
        has_review: !!review,
        review: review || null,
        shipping_address_info: shippingAddress,
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
    const userId = c.get('userId')
    const body = await c.req.json()
    const { status, tracking_number, shipping_carrier, shipping_note } = body

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
    if (status === 'shipped' && transaction.seller_id !== userId) {
      return c.json({ success: false, error: '発送報告は出品者のみ可能です' }, 403)
    }
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
      if (shipping_carrier) {
        updateFields.push('shipping_carrier = ?')
        updateValues.push(shipping_carrier)
      }
      if (shipping_note) {
        updateFields.push('shipping_note = ?')
        updateValues.push(shipping_note)
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
      const carrierName = shipping_carrier || ''
      const parts = []
      if (carrierName) parts.push(`配送業者: ${carrierName}`)
      if (tracking_number) parts.push(`追跡番号: ${tracking_number}`)
      if (shipping_note) parts.push(`備考: ${shipping_note}`)
      
      notificationTitle = '商品が発送されました'
      notificationMessage = parts.length > 0 ? parts.join(' / ') : '出品者が商品を発送しました'
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

    // 発送済みの場合、購入者にメール通知
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
            shippingCarrier: shipping_carrier || undefined,
          })
          await sendEmail((c.env as any).RESEND_API_KEY, { to: txDetail.buyer_email as string, ...mail })
        }
      } catch (emailErr) {
        console.error('Failed to send shipping notification email:', emailErr)
      }
    }

    // 取引完了時、出品者にメール通知
    if (status === 'completed' && (c.env as any).RESEND_API_KEY) {
      try {
        const txDetail = await DB.prepare(`
          SELECT 
            p.title as product_name,
            t.amount,
            seller.name as seller_name, seller.email as seller_email
          FROM transactions t
          JOIN products p ON t.product_id = p.id
          JOIN users seller ON t.seller_id = seller.id
          WHERE t.id = ?
        `).bind(transactionId).first()

        if (txDetail) {
          const mail = tpl.transactionCompleted({
            sellerName: txDetail.seller_name as string,
            productName: txDetail.product_name as string,
            amount: txDetail.amount as number,
            transactionId: parseInt(transactionId),
          })
          await sendEmail((c.env as any).RESEND_API_KEY, { to: txDetail.seller_email as string, ...mail })
        }
      } catch (emailErr) {
        console.error('Failed to send completion notification email:', emailErr)
      }
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Update transaction status error:', error)
    return c.json({ success: false, error: 'ステータスの更新に失敗しました' }, 500)
  }
})

// 配送先住所の保存（購入時に呼ばれる）
transactions.put('/:transactionId/shipping-address', authMiddleware, async (c) => {
  try {
    const { DB } = c.env
    const transactionId = c.req.param('transactionId')
    const userId = c.get('userId')
    const body = await c.req.json()
    const { shipping_name, shipping_postal_code, shipping_address, shipping_phone } = body

    const transaction = await DB.prepare(`
      SELECT * FROM transactions WHERE id = ?
    `).bind(transactionId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // 購入者のみ配送先を設定可能
    if (transaction.buyer_id !== userId) {
      return c.json({ success: false, error: '権限がありません' }, 403)
    }

    await DB.prepare(`
      UPDATE transactions 
      SET shipping_name = ?, shipping_postal_code = ?, shipping_address = ?, shipping_phone = ?
      WHERE id = ?
    `).bind(
      shipping_name || null,
      shipping_postal_code || null,
      shipping_address || null,
      shipping_phone || null,
      transactionId
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update shipping address error:', error)
    return c.json({ success: false, error: '配送先の更新に失敗しました' }, 500)
  }
})

export default transactions
