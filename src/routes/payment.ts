import { Hono } from 'hono'
import { authMiddleware } from '../auth'
import { 
  getStripeClient, 
  calculateFees, 
  validateAmount,
  STRIPE_CONFIG 
} from '../stripe-config'
import Stripe from 'stripe'

type Bindings = {
  DB: D1Database
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
}

const payment = new Hono<{ Bindings: Bindings }>()

// Checkout Session作成
payment.post('/create-checkout-session', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { product_id } = await c.req.json()

    if (!product_id) {
      return c.json({ 
        success: false, 
        error: '商品IDが必要です' 
      }, 400)
    }

    // 商品情報取得
    const product = await c.env.DB.prepare(`
      SELECT p.id, p.title, p.price, p.user_id as seller_id, p.status,
             u.name as seller_name, u.email as seller_email
      FROM products p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(product_id).first()

    if (!product) {
      return c.json({ 
        success: false, 
        error: '商品が見つかりません' 
      }, 404)
    }

    // 商品ステータスチェック
    if (product.status !== 'active') {
      return c.json({ 
        success: false, 
        error: 'この商品は購入できません' 
      }, 400)
    }

    // 自分の商品は購入できない
    if (product.seller_id === userId) {
      return c.json({ 
        success: false, 
        error: '自分の商品は購入できません' 
      }, 400)
    }

    // 金額バリデーション
    const amountValidation = validateAmount(product.price as number)
    if (!amountValidation.valid) {
      return c.json({ 
        success: false, 
        error: amountValidation.error 
      }, 400)
    }

    // 手数料計算
    const fees = calculateFees(product.price as number)

    // 取引レコード作成
    const transactionResult = await c.env.DB.prepare(`
      INSERT INTO transactions (
        product_id, buyer_id, seller_id, amount, fee, 
        status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(
      product_id,
      userId,
      product.seller_id,
      product.price,
      fees.platformFee
    ).run()

    const transactionId = transactionResult.meta.last_row_id

    // Stripe Checkout Session作成
    const stripe = getStripeClient(c)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.CURRENCY,
            product_data: {
              name: product.title as string,
              description: `出品者: ${product.seller_name}`,
            },
            unit_amount: fees.total,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://parts-hub-tci.com/transaction/${transactionId}/success`,
      cancel_url: `https://parts-hub-tci.com/transaction/${transactionId}/cancel`,
      metadata: {
        transaction_id: transactionId.toString(),
        product_id: product_id.toString(),
        buyer_id: userId.toString(),
        seller_id: (product.seller_id as number).toString(),
      },
    })

    // セッションIDを取引に保存
    await c.env.DB.prepare(`
      UPDATE transactions 
      SET stripe_session_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(session.id, transactionId).run()

    return c.json({
      success: true,
      session_id: session.id,
      session_url: session.url,
      transaction_id: transactionId,
      fees: fees
    })

  } catch (error: any) {
    console.error('Create checkout session error:', error)
    return c.json({ 
      success: false, 
      error: 'Checkout Sessionの作成に失敗しました',
      details: error.message
    }, 500)
  }
})

// 取引ステータス確認
payment.get('/transaction/:id/status', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const transactionId = c.req.param('id')

    const transaction = await c.env.DB.prepare(`
      SELECT t.id, t.product_id, t.buyer_id, t.seller_id, t.amount, 
             t.fee, t.status, t.stripe_session_id, t.created_at,
             p.title as product_title,
             b.name as buyer_name,
             s.name as seller_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users b ON t.buyer_id = b.id
      JOIN users s ON t.seller_id = s.id
      WHERE t.id = ? AND (t.buyer_id = ? OR t.seller_id = ?)
    `).bind(transactionId, userId, userId).first()

    if (!transaction) {
      return c.json({ 
        success: false, 
        error: '取引が見つかりません' 
      }, 404)
    }

    // Stripeセッション情報取得
    let paymentStatus = null
    if (transaction.stripe_session_id) {
      const stripe = getStripeClient(c)
      const session = await stripe.checkout.sessions.retrieve(
        transaction.stripe_session_id as string
      )
      paymentStatus = session.payment_status
    }

    return c.json({
      success: true,
      transaction: {
        id: transaction.id,
        product_id: transaction.product_id,
        product_title: transaction.product_title,
        buyer_id: transaction.buyer_id,
        buyer_name: transaction.buyer_name,
        seller_id: transaction.seller_id,
        seller_name: transaction.seller_name,
        amount: transaction.amount,
        fee: transaction.fee,
        status: transaction.status,
        payment_status: paymentStatus,
        created_at: transaction.created_at
      }
    })

  } catch (error: any) {
    console.error('Get transaction status error:', error)
    return c.json({ 
      success: false, 
      error: '取引ステータスの取得に失敗しました' 
    }, 500)
  }
})

// Webhook受信エンドポイント
payment.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature')
    const body = await c.req.text()

    if (!signature) {
      return c.json({ error: 'No signature' }, 400)
    }

    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return c.json({ error: 'Webhook secret not configured' }, 500)
    }

    // Webhook署名検証
    const stripe = getStripeClient(c)
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return c.json({ error: 'Invalid signature' }, 400)
    }

    // イベント処理
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        const transactionId = session.metadata?.transaction_id

        if (transactionId) {
          // 取引ステータスを「支払い済み」に更新
          await c.env.DB.prepare(`
            UPDATE transactions 
            SET status = 'paid', 
                stripe_payment_intent = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(session.payment_intent, transactionId).run()

          // 商品ステータスを「売却済み」に更新
          await c.env.DB.prepare(`
            UPDATE products 
            SET status = 'sold', updated_at = datetime('now')
            WHERE id = (SELECT product_id FROM transactions WHERE id = ?)
          `).bind(transactionId).run()

          console.log(`Transaction ${transactionId} marked as paid`)
        }
        break

      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded:', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedIntent.id)
        
        // 取引ステータスを「キャンセル」に更新
        await c.env.DB.prepare(`
          UPDATE transactions 
          SET status = 'cancelled', updated_at = datetime('now')
          WHERE stripe_payment_intent = ?
        `).bind(failedIntent.id).run()
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return c.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return c.json({ 
      error: 'Webhook processing failed',
      details: error.message
    }, 500)
  }
})

// 取引完了（配送完了後）
payment.post('/transaction/:id/complete', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const transactionId = c.req.param('id')

    // 取引情報取得（購入者のみ実行可能）
    const transaction = await c.env.DB.prepare(`
      SELECT id, buyer_id, seller_id, status
      FROM transactions
      WHERE id = ? AND buyer_id = ?
    `).bind(transactionId, userId).first()

    if (!transaction) {
      return c.json({ 
        success: false, 
        error: '取引が見つかりません' 
      }, 404)
    }

    if (transaction.status !== 'shipped') {
      return c.json({ 
        success: false, 
        error: '配送済みの取引のみ完了できます' 
      }, 400)
    }

    // 取引ステータスを「完了」に更新
    await c.env.DB.prepare(`
      UPDATE transactions 
      SET status = 'completed', updated_at = datetime('now')
      WHERE id = ?
    `).bind(transactionId).run()

    // TODO: 出品者への入金処理（Stripe Connect）

    return c.json({
      success: true,
      message: '取引が完了しました'
    })

  } catch (error: any) {
    console.error('Complete transaction error:', error)
    return c.json({ 
      success: false, 
      error: '取引完了処理に失敗しました' 
    }, 500)
  }
})

export default payment
