import { Hono } from 'hono'
import { authMiddleware } from '../auth'
import { 
  getStripeClient, 
  calculateFees, 
  validateAmount,
  STRIPE_CONFIG 
} from '../stripe-config'
import Stripe from 'stripe'
import { sendEmail } from '../email-config'
import * as tpl from '../email-templates'

type Bindings = {
  DB: D1Database
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  RESEND_API_KEY?: string
}

const payment = new Hono<{ Bindings: Bindings }>()

// ============================================================
// ヘルパー関数
// ============================================================

/** アプリ内通知を作成 */
async function createNotification(
  db: D1Database,
  userId: number,
  type: string,
  title: string,
  message: string,
  relatedId: number | null,
  relatedType: string | null,
  actionUrl: string | null
) {
  try {
    await db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, type, title, message, relatedId, relatedType, actionUrl).run()
  } catch (e) {
    console.error('Failed to create notification:', e)
  }
}

/** 取引完了処理（Webhook + verify-session 共通） */
async function processPaymentCompleted(
  db: D1Database,
  resendApiKey: string | undefined,
  transactionId: string,
  stripePaymentIntent: string | null
) {
  // 取引の現在ステータスを確認（二重処理防止）
  const currentTx = await db.prepare(`
    SELECT id, status, product_id FROM transactions WHERE id = ?
  `).bind(transactionId).first()

  if (!currentTx) {
    console.error(`Transaction ${transactionId} not found`)
    return { processed: false, reason: 'not_found' }
  }

  // 既に処理済みの場合はスキップ
  if (currentTx.status === 'paid' || currentTx.status === 'shipped' || currentTx.status === 'completed') {
    console.log(`Transaction ${transactionId} already processed (status: ${currentTx.status})`)
    return { processed: false, reason: 'already_processed', status: currentTx.status }
  }

  // ★ 安全策: cancelled状態でもStripeで実際に決済が完了していれば復元する
  // （手動キャンセルや競合条件でDBがcancelledになっていてもWebhookで正しく処理）
  if (currentTx.status === 'cancelled') {
    console.log(`[RECOVERY] Transaction ${transactionId} was cancelled but Stripe payment succeeded. Restoring to paid.`)
  }

  // 1. 取引ステータスを「支払い済み」に更新
  await db.prepare(`
    UPDATE transactions 
    SET status = 'paid', 
        stripe_payment_intent = ?,
        paid_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(stripePaymentIntent, transactionId).run()

  // 2. 商品ステータスを即座に「sold」に更新（最重要！）
  await db.prepare(`
    UPDATE products 
    SET status = 'sold', updated_at = datetime('now')
    WHERE id = ?
  `).bind(currentTx.product_id).run()

  console.log(`Product ${currentTx.product_id} marked as SOLD`)

  // 3. 取引の詳細情報を取得
  const txData = await db.prepare(`
    SELECT 
      t.id, t.amount, t.fee, t.product_id,
      p.title as product_name,
      buyer.id as buyer_id, buyer.name as buyer_name, buyer.email as buyer_email,
      buyer.phone as buyer_phone,
      buyer.postal_code as buyer_postal_code,
      buyer.prefecture as buyer_prefecture,
      buyer.city as buyer_city,
      buyer.address as buyer_address,
      COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_display_name,
      seller.id as seller_id, seller.name as seller_name, seller.email as seller_email,
      COALESCE(seller.company_name, seller.nickname, seller.name) as seller_display_name
    FROM transactions t
    JOIN products p ON t.product_id = p.id
    JOIN users buyer ON t.buyer_id = buyer.id
    JOIN users seller ON t.seller_id = seller.id
    WHERE t.id = ?
  `).bind(transactionId).first()

  // 3.5 購入者の住所を取引にスナップショット保存（発送先として使用）
  if (txData && (txData.buyer_postal_code || txData.buyer_address)) {
    try {
      const fullAddress = [txData.buyer_prefecture, txData.buyer_city, txData.buyer_address].filter(Boolean).join('')
      await db.prepare(`
        UPDATE transactions 
        SET shipping_name = ?, shipping_postal_code = ?, shipping_address = ?, shipping_phone = ?
        WHERE id = ?
      `).bind(
        txData.buyer_display_name || txData.buyer_name,
        txData.buyer_postal_code || null,
        fullAddress || null,
        txData.buyer_phone || null,
        transactionId
      ).run()
    } catch (addrErr) {
      console.error('Failed to save shipping address snapshot:', addrErr)
    }
  }

  if (!txData) {
    console.error(`Transaction detail not found for ${transactionId}`)
    return { processed: true, reason: 'detail_not_found' }
  }

  const txId = txData.id as number
  const amount = txData.amount as number
  const sellerId = txData.seller_id as number
  const buyerId = txData.buyer_id as number
  const productName = txData.product_name as string

  // 4. 出品者へのアプリ内通知
  await createNotification(
    db,
    sellerId,
    'purchase',
    '商品が購入されました！',
    `「${productName}」が購入されました。発送準備をお願いします。（金額: ¥${amount.toLocaleString()}）`,
    txId,
    'transaction',
    `/transactions/${txId}`
  )

  // 5. 購入者へのアプリ内通知
  await createNotification(
    db,
    buyerId,
    'payment',
    'お支払いが完了しました',
    `「${productName}」のお支払いが完了しました。出品者の発送をお待ちください。`,
    txId,
    'transaction',
    `/transactions/${txId}`
  )

  // 6. メール送信（出品者・購入者の両方）
  if (resendApiKey) {
    try {
      // 出品者向け: 商品が購入されました + 発送準備依頼
      const sellerMail = tpl.productPurchasedSeller({
        sellerName: txData.seller_display_name as string || txData.seller_name as string,
        productName,
        amount,
        buyerName: txData.buyer_display_name as string || txData.buyer_name as string,
        transactionId: txId,
      })
      await sendEmail(resendApiKey, { to: txData.seller_email as string, ...sellerMail })
      console.log(`Seller notification email sent to ${txData.seller_email}`)
    } catch (emailError) {
      console.error('Failed to send seller notification email:', emailError)
    }

    try {
      // 購入者向け: 決済完了
      const buyerMail = tpl.paymentCompleteBuyer({
        buyerName: txData.buyer_display_name as string || txData.buyer_name as string,
        productName,
        amount,
        transactionId: txId,
      })
      await sendEmail(resendApiKey, { to: txData.buyer_email as string, ...buyerMail })
      console.log(`Buyer notification email sent to ${txData.buyer_email}`)
    } catch (emailError) {
      console.error('Failed to send buyer notification email:', emailError)
    }
  } else {
    console.warn('RESEND_API_KEY not configured, skipping email notifications')
  }

  console.log(`Transaction ${transactionId} fully processed: paid + sold + notified`)
  return { processed: true, reason: 'success' }
}

// ============================================================
// エンドポイント
// ============================================================

// Stripe設定確認
payment.get('/config', async (c) => {
  try {
    const hasStripeKey = !!(c.env as any)?.STRIPE_SECRET_KEY
    return c.json({
      success: true,
      stripe_configured: hasStripeKey,
      platform_fee_percentage: STRIPE_CONFIG.PLATFORM_FEE_PERCENTAGE * 100,
      min_transaction_amount: STRIPE_CONFIG.MIN_TRANSACTION_AMOUNT,
      max_transaction_amount: STRIPE_CONFIG.MAX_TRANSACTION_AMOUNT,
      currency: STRIPE_CONFIG.CURRENCY
    })
  } catch (error: any) {
    console.error('Payment config error:', error)
    return c.json({ success: false, error: '決済設定の取得に失敗しました' }, 500)
  }
})

// 手数料計算
payment.get('/calculate-fees', async (c) => {
  try {
    const amount = parseInt(c.req.query('amount') || '0')
    const method = (c.req.query('method') || 'card') as 'card' | 'bank_transfer'
    if (!amount) {
      return c.json({ success: false, error: '金額を指定してください' }, 400)
    }
    const validation = validateAmount(amount)
    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400)
    }
    const fees = calculateFees(amount, method)
    return c.json({ success: true, fees })
  } catch (error: any) {
    console.error('Fee calc error:', error)
    return c.json({ success: false, error: '手数料計算に失敗しました' }, 500)
  }
})

// Checkout Session作成
payment.post('/create-checkout-session', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { product_id } = await c.req.json()

    if (!product_id) {
      return c.json({ success: false, error: '商品IDが必要です' }, 400)
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
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }

    // 商品ステータスチェック
    if (product.status !== 'active') {
      return c.json({ success: false, error: 'この商品は既に売り切れです' }, 400)
    }

    // 自分の商品は購入できない
    if (product.seller_id === userId) {
      return c.json({ success: false, error: '自分の商品は購入できません' }, 400)
    }

    // 金額バリデーション
    const amountValidation = validateAmount(product.price as number)
    if (!amountValidation.valid) {
      return c.json({ success: false, error: amountValidation.error }, 400)
    }

    // 手数料計算（メルカリ方式：購入者は商品価格のみ、手数料は出品者負担）
    const fees = calculateFees(product.price as number, 'card')

    // ★ 商品を即座に「売却中」にする（他のユーザーが購入できないように）
    // NOTE: SQLiteのCHECK制約でreservedが使えない場合はsoldを使用
    //       キャンセル/期限切れ時にactiveに戻す
    await c.env.DB.prepare(`
      UPDATE products SET status = 'sold', updated_at = datetime('now')
      WHERE id = ? AND status = 'active'
    `).bind(product_id).run()

    // 取引レコード作成（カード決済: payment_method='card'）
    const transactionResult = await c.env.DB.prepare(`
      INSERT INTO transactions (
        product_id, buyer_id, seller_id, amount, fee, 
        payment_method, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'card', 'pending', datetime('now'), datetime('now'))
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
      success_url: `https://parts-hub-tci.com/transaction/${transactionId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://parts-hub-tci.com/transaction/${transactionId}/cancel`,
      metadata: {
        transaction_id: transactionId.toString(),
        product_id: product_id.toString(),
        buyer_id: userId.toString(),
        seller_id: (product.seller_id as number).toString(),
      },
      // 30分のタイムアウト
      expires_at: Math.floor(Date.now() / 1000) + 1800,
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

// ============================================================
// ★ 決済確認エンドポイント（successページからのフォールバック）
// Webhook が遅延した場合やWebhookが届かなかった場合のセーフティネット
// ============================================================
payment.post('/verify-session', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { transaction_id, session_id } = await c.req.json()

    if (!transaction_id) {
      return c.json({ success: false, error: '取引IDが必要です' }, 400)
    }

    // 取引情報取得（権限チェック）
    const transaction = await c.env.DB.prepare(`
      SELECT t.*, p.title as product_title, p.status as product_status
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.id = ? AND (t.buyer_id = ? OR t.seller_id = ?)
    `).bind(transaction_id, userId, userId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // 既に処理済みの場合
    if (transaction.status === 'paid' || transaction.status === 'shipped' || transaction.status === 'completed') {
      return c.json({
        success: true,
        status: transaction.status,
        product_status: transaction.product_status,
        message: '決済は既に確認済みです',
        already_processed: true
      })
    }

    // StripeセッションIDの確認
    const stripeSessionId = session_id || transaction.stripe_session_id
    if (!stripeSessionId) {
      return c.json({ success: false, error: 'Stripeセッション情報がありません' }, 400)
    }

    // Stripeに直接確認
    const stripe = getStripeClient(c)
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId as string)

    if (session.payment_status === 'paid') {
      // ★ Webhookで処理されていなければここで処理する（フォールバック）
      const result = await processPaymentCompleted(
        c.env.DB,
        (c.env as any).RESEND_API_KEY,
        transaction_id.toString(),
        session.payment_intent as string | null
      )

      return c.json({
        success: true,
        status: 'paid',
        product_status: 'sold',
        message: result.processed ? '決済を確認し、処理を完了しました' : '決済は既に確認済みです',
        payment_status: session.payment_status,
        processed: result.processed
      })
    } else if (session.payment_status === 'unpaid') {
      return c.json({
        success: true,
        status: 'pending',
        message: '決済はまだ完了していません',
        payment_status: session.payment_status
      })
    } else {
      return c.json({
        success: true,
        status: transaction.status,
        message: `決済ステータス: ${session.payment_status}`,
        payment_status: session.payment_status
      })
    }

  } catch (error: any) {
    console.error('Verify session error:', error)
    return c.json({ 
      success: false, 
      error: '決済確認に失敗しました',
      details: error.message
    }, 500)
  }
})

// ============================================================
// ★ 支払いリトライ（未完了取引の再決済）
// 購入者がカード入力に失敗して画面を閉じた場合、
// マイページや取引詳細から再度決済を開始できるようにする
// ============================================================
payment.post('/retry-checkout', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { transaction_id } = await c.req.json()

    if (!transaction_id) {
      return c.json({ success: false, error: '取引IDが必要です' }, 400)
    }

    // 取引情報取得（購入者のみリトライ可能）
    const transaction = await c.env.DB.prepare(`
      SELECT t.*, p.title as product_title, p.price as product_price,
             p.status as product_status, p.user_id as product_seller_id,
             COALESCE(s.company_name, s.nickname, s.name) as seller_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users s ON t.seller_id = s.id
      WHERE t.id = ? AND t.buyer_id = ?
    `).bind(transaction_id, userId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // pendingステータスの取引のみリトライ可能
    if (transaction.status !== 'pending') {
      const statusMessages: Record<string, string> = {
        'paid': 'この取引は既にお支払い済みです',
        'shipped': 'この取引は既に発送済みです',
        'completed': 'この取引は既に完了しています',
        'cancelled': 'この取引はキャンセルされています。商品ページから再度購入してください',
      }
      return c.json({ 
        success: false, 
        error: statusMessages[transaction.status as string] || 'この取引の状態では再決済できません' 
      }, 400)
    }

    // 既存のStripeセッションがまだ有効か確認
    if (transaction.stripe_session_id) {
      try {
        const stripe = getStripeClient(c)
        const existingSession = await stripe.checkout.sessions.retrieve(
          transaction.stripe_session_id as string
        )
        
        // セッションがまだ有効で未払いの場合はそのURLを返す
        if (existingSession.status === 'open' && existingSession.payment_status === 'unpaid') {
          return c.json({
            success: true,
            session_id: existingSession.id,
            session_url: existingSession.url,
            transaction_id: transaction.id,
            reused_session: true
          })
        }

        // 既にpaidだった場合 → processPaymentCompleted で処理する
        if (existingSession.payment_status === 'paid') {
          const result = await processPaymentCompleted(
            c.env.DB,
            (c.env as any).RESEND_API_KEY,
            transaction_id.toString(),
            existingSession.payment_intent as string | null
          )
          return c.json({
            success: true,
            already_paid: true,
            message: '既にお支払いが完了しています',
            transaction_id: transaction.id,
          })
        }
      } catch (e) {
        // セッション取得失敗 → 新しいセッションを作る
        console.log('Existing session retrieval failed, creating new one:', e)
      }
    }

    // 手数料計算
    const fees = calculateFees(transaction.amount as number)

    // 新しいStripe Checkout Session作成
    const stripe = getStripeClient(c)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.CURRENCY,
            product_data: {
              name: transaction.product_title as string,
              description: `出品者: ${transaction.seller_name}`,
            },
            unit_amount: fees.total,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://parts-hub-tci.com/transaction/${transaction.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://parts-hub-tci.com/transaction/${transaction.id}/cancel`,
      metadata: {
        transaction_id: transaction.id!.toString(),
        product_id: (transaction.product_id as number).toString(),
        buyer_id: userId.toString(),
        seller_id: (transaction.seller_id as number).toString(),
      },
      // 30分のタイムアウト
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    })

    // 新しいセッションIDで取引を更新
    await c.env.DB.prepare(`
      UPDATE transactions 
      SET stripe_session_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(session.id, transaction.id).run()

    // 商品がactiveに戻っていた場合は再度soldに戻す
    if (transaction.product_status === 'active') {
      await c.env.DB.prepare(`
        UPDATE products SET status = 'sold', updated_at = datetime('now')
        WHERE id = ? AND status = 'active'
      `).bind(transaction.product_id).run()
    }

    return c.json({
      success: true,
      session_id: session.id,
      session_url: session.url,
      transaction_id: transaction.id,
      fees: fees,
      reused_session: false
    })

  } catch (error: any) {
    console.error('Retry checkout error:', error)
    return c.json({ 
      success: false, 
      error: '再決済の準備に失敗しました',
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
             t.fee, t.status, t.stripe_session_id, t.created_at, t.paid_at,
             p.title as product_title, p.status as product_status,
             COALESCE(b.company_name, b.nickname, b.name) as buyer_name,
             COALESCE(s.company_name, s.nickname, s.name) as seller_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users b ON t.buyer_id = b.id
      JOIN users s ON t.seller_id = s.id
      WHERE t.id = ? AND (t.buyer_id = ? OR t.seller_id = ?)
    `).bind(transactionId, userId, userId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    // Stripeセッション情報取得
    let paymentStatus = null
    if (transaction.stripe_session_id) {
      try {
        const stripe = getStripeClient(c)
        const session = await stripe.checkout.sessions.retrieve(
          transaction.stripe_session_id as string
        )
        paymentStatus = session.payment_status
      } catch (e) {
        console.error('Failed to retrieve Stripe session:', e)
      }
    }

    return c.json({
      success: true,
      transaction: {
        id: transaction.id,
        product_id: transaction.product_id,
        product_title: transaction.product_title,
        product_status: transaction.product_status,
        buyer_id: transaction.buyer_id,
        buyer_name: transaction.buyer_name,
        seller_id: transaction.seller_id,
        seller_name: transaction.seller_name,
        amount: transaction.amount,
        fee: transaction.fee,
        status: transaction.status,
        payment_status: paymentStatus,
        paid_at: transaction.paid_at,
        created_at: transaction.created_at
      }
    })

  } catch (error: any) {
    console.error('Get transaction status error:', error)
    return c.json({ success: false, error: '取引ステータスの取得に失敗しました' }, 500)
  }
})

// ============================================================
// Webhook受信エンドポイント
// ============================================================
payment.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature')
    const body = await c.req.text()

    console.log(`[Webhook] Received request. Has signature: ${!!signature}, Body length: ${body.length}`)

    if (!signature) {
      return c.json({ error: 'No signature' }, 400)
    }

    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return c.json({ error: 'Webhook secret not configured' }, 500)
    }

    console.log(`[Webhook] Secret starts with: ${webhookSecret.substring(0, 10)}...`)

    // Webhook署名検証
    const stripe = getStripeClient(c)
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`[Webhook] Signature verification FAILED: ${err.message}`)
      return c.json({ error: 'Invalid signature' }, 400)
    }

    console.log(`[Webhook] Received event: ${event.type}`)

    // イベント処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const transactionId = session.metadata?.transaction_id

        if (transactionId) {
          const result = await processPaymentCompleted(
            c.env.DB,
            (c.env as any).RESEND_API_KEY,
            transactionId,
            session.payment_intent as string | null
          )
          console.log(`[Webhook] checkout.session.completed processed:`, result)
        }
        break
      }

      case 'checkout.session.expired': {
        // セッション期限切れ → 商品を再度activeに戻す
        // ★ ただし、支払い済みの場合は絶対にrevertしない（安全弁）
        const expiredSession = event.data.object as Stripe.Checkout.Session
        const expiredTxId = expiredSession.metadata?.transaction_id
        const expiredProductId = expiredSession.metadata?.product_id

        // ★ 安全チェック: Stripeで支払い済みか確認
        if (expiredSession.payment_status === 'paid') {
          console.log(`[Webhook] Session expired but payment_status=paid. Processing as completed instead.`)
          // 支払い済みなのにexpiredが来た → completedとして処理する
          if (expiredTxId) {
            await processPaymentCompleted(
              c.env.DB,
              (c.env as any).RESEND_API_KEY,
              expiredTxId,
              expiredSession.payment_intent as string | null
            )
          }
          break
        }

        // ★ 安全チェック2: DB上で既にpaid/shipped/completedなら何もしない
        if (expiredTxId) {
          const currentStatus = await c.env.DB.prepare(
            `SELECT status FROM transactions WHERE id = ?`
          ).bind(expiredTxId).first()
          
          if (currentStatus && ['paid', 'shipped', 'completed'].includes(currentStatus.status as string)) {
            console.log(`[Webhook] Session expired but transaction ${expiredTxId} is already ${currentStatus.status}. Skipping revert.`)
            break
          }

          await c.env.DB.prepare(`
            UPDATE transactions 
            SET status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND status = 'pending'
          `).bind(expiredTxId).run()
          console.log(`[Webhook] Transaction ${expiredTxId} cancelled (session expired)`)
        }

        if (expiredProductId) {
          // 未決済のまま期限切れ → 商品をactiveに戻す
          // paid/shipped/completed取引がない場合のみ戻す
          const paidOrPending = await c.env.DB.prepare(`
            SELECT COUNT(*) as cnt FROM transactions 
            WHERE product_id = ? AND status IN ('pending', 'paid', 'shipped', 'completed') AND id != ?
          `).bind(expiredProductId, expiredTxId || 0).first()
          
          if (!paidOrPending || (paidOrPending.cnt as number) === 0) {
            await c.env.DB.prepare(`
              UPDATE products 
              SET status = 'active', updated_at = datetime('now')
              WHERE id = ? AND status = 'sold'
            `).bind(expiredProductId).run()
            console.log(`[Webhook] Product ${expiredProductId} restored to active (session expired, no paid transactions)`)
          } else {
            console.log(`[Webhook] Product ${expiredProductId} NOT restored - has active/paid transactions`)
          }
        }
        break
      }

      case 'payment_intent.succeeded':
        console.log('[Webhook] Payment intent succeeded:', event.data.object.id)
        break

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object as Stripe.PaymentIntent
        console.log('[Webhook] Payment failed:', failedIntent.id)
        
        // 取引ステータスを「キャンセル」に更新（ただし既にpaid以降なら何もしない）
        const failedTx = await c.env.DB.prepare(`
          SELECT id, product_id, status FROM transactions WHERE stripe_payment_intent = ?
        `).bind(failedIntent.id).first()

        if (failedTx) {
          // ★ 安全チェック: 既にpaid/shipped/completedなら何もしない
          if (['paid', 'shipped', 'completed'].includes(failedTx.status as string)) {
            console.log(`[Webhook] Payment failed but transaction ${failedTx.id} is already ${failedTx.status}. Skipping.`)
            break
          }

          await c.env.DB.prepare(`
            UPDATE transactions 
            SET status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND status = 'pending'
          `).bind(failedTx.id).run()

          // 商品をactiveに戻す（paid取引がない場合のみ）
          const hasPaidTx = await c.env.DB.prepare(`
            SELECT COUNT(*) as cnt FROM transactions 
            WHERE product_id = ? AND status IN ('paid', 'shipped', 'completed')
          `).bind(failedTx.product_id).first()

          if (!hasPaidTx || (hasPaidTx.cnt as number) === 0) {
            await c.env.DB.prepare(`
              UPDATE products 
              SET status = 'active', updated_at = datetime('now')
              WHERE id = ? AND status = 'sold'
            `).bind(failedTx.product_id).run()
            console.log(`[Webhook] Product ${failedTx.product_id} restored to active (payment failed)`)
          }
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
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
      SELECT id, buyer_id, seller_id, status, product_id
      FROM transactions
      WHERE id = ? AND buyer_id = ?
    `).bind(transactionId, userId).first()

    if (!transaction) {
      return c.json({ success: false, error: '取引が見つかりません' }, 404)
    }

    if (transaction.status !== 'shipped') {
      return c.json({ success: false, error: '配送済みの取引のみ完了できます' }, 400)
    }

    // 取引ステータスを「完了」に更新
    await c.env.DB.prepare(`
      UPDATE transactions 
      SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(transactionId).run()

    // 取引詳細を取得（通知用）
    const txDetail = await c.env.DB.prepare(`
      SELECT 
        p.title as product_name,
        t.amount,
        seller.name as seller_name, seller.email as seller_email,
        buyer.name as buyer_name, buyer.email as buyer_email
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users seller ON t.seller_id = seller.id
      JOIN users buyer ON t.buyer_id = buyer.id
      WHERE t.id = ?
    `).bind(transactionId).first()

    const productName = (txDetail?.product_name as string) || '商品'

    // 出品者へのアプリ内通知
    await createNotification(
      c.env.DB,
      transaction.seller_id as number,
      'transaction',
      '取引が完了しました',
      `「${productName}」の受取が確認されました。お疲れ様でした！`,
      parseInt(transactionId),
      'transaction',
      `/transactions/${transactionId}`
    )

    // 購入者自身へのアプリ内通知（受取完了確認）
    await createNotification(
      c.env.DB,
      transaction.buyer_id as number,
      'transaction',
      '受取完了しました',
      `「${productName}」の受取が完了しました。レビューをお願いします。`,
      parseInt(transactionId),
      'transaction',
      `/reviews/new?transaction=${transactionId}`
    )

    // メール通知
    if ((c.env as any).RESEND_API_KEY && txDetail) {
      const txId = parseInt(transactionId)
      const amount = txDetail.amount as number

      // 出品者へのメール通知（取引完了）
      try {
        const sellerMail = tpl.transactionCompleted({
          sellerName: txDetail.seller_name as string,
          productName: productName,
          amount: amount,
          transactionId: txId,
        })
        await sendEmail((c.env as any).RESEND_API_KEY, { to: txDetail.seller_email as string, ...sellerMail })
      } catch (emailErr) {
        console.error('Failed to send completion email to seller:', emailErr)
      }

      // 購入者へのメール通知（受取完了確認）
      try {
        const buyerMail = tpl.receiptConfirmed({
          buyerName: txDetail.buyer_name as string,
          productName: productName,
          amount: amount,
          transactionId: txId,
        })
        await sendEmail((c.env as any).RESEND_API_KEY, { to: txDetail.buyer_email as string, ...buyerMail })
      } catch (emailErr) {
        console.error('Failed to send receipt confirmation email to buyer:', emailErr)
      }
    }

    return c.json({
      success: true,
      message: '取引が完了しました'
    })

  } catch (error: any) {
    console.error('Complete transaction error:', error)
    return c.json({ success: false, error: '取引完了処理に失敗しました' }, 500)
  }
})

// ============================================================
// ★ 請求書払い（銀行振込）注文作成
// ============================================================
payment.post('/create-invoice-order', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { product_id, billing_info } = await c.req.json()

    if (!product_id) {
      return c.json({ success: false, error: '商品IDが必要です' }, 400)
    }

    if (!billing_info || !billing_info.company_name) {
      return c.json({ success: false, error: '請求先情報（会社名）が必要です' }, 400)
    }

    // 商品情報取得
    const product = await c.env.DB.prepare(`
      SELECT p.id, p.title, p.price, p.status, p.user_id as seller_id,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(product_id).first()

    if (!product) {
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }
    if (product.status !== 'active') {
      return c.json({ success: false, error: 'この商品は現在購入できません' }, 400)
    }
    if (product.seller_id === userId) {
      return c.json({ success: false, error: '自分の商品は購入できません' }, 400)
    }

    // 手数料計算（メルカリ方式：購入者は商品価格のみ、手数料は出品者負担）
    const fees = calculateFees(product.price as number, 'bank_transfer')

    // 請求書番号生成 (INV-YYYYMMDD-NNNN)
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM transactions 
      WHERE payment_method = 'invoice' AND invoice_number LIKE ?
    `).bind(`INV-${dateStr}-%`).first()
    const seq = String(((countResult?.cnt as number) || 0) + 1).padStart(4, '0')
    const invoiceNumber = `INV-${dateStr}-${seq}`

    // 振込期限（7日後）
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const dueDateStr = dueDate.toISOString()

    // 商品を「売約済み」に
    await c.env.DB.prepare(`
      UPDATE products SET status = 'sold', updated_at = datetime('now')
      WHERE id = ? AND status = 'active'
    `).bind(product_id).run()

    // 取引レコード作成（status = 'awaiting_transfer'）
    const transactionResult = await c.env.DB.prepare(`
      INSERT INTO transactions (
        product_id, buyer_id, seller_id, amount, fee,
        status, payment_method, invoice_number, invoice_due_date,
        billing_info, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'awaiting_transfer', 'invoice', ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      product_id,
      userId,
      product.seller_id,
      product.price,
      fees.platformFee,
      invoiceNumber,
      dueDateStr,
      JSON.stringify(billing_info)
    ).run()

    const transactionId = transactionResult.meta.last_row_id

    // 購入者に通知
    await createNotification(
      c.env.DB, userId, 'purchase',
      '銀行振込の注文を受け付けました',
      `「${product.title}」の注文を受け付けました。振込先: PayPay銀行 ビジネス営業部(005) 普通 1460031。請求書番号: ${invoiceNumber}。振込期限: ${dueDate.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}`,
      transactionId, 'transaction', `/transactions/${transactionId}`
    )

    // 出品者に通知（振込待ちである旨）
    await createNotification(
      c.env.DB, product.seller_id as number, 'sale',
      '銀行振込の注文がありました',
      `「${product.title}」に銀行振込の注文が入りました。振込確認後に発送依頼をお送りします。`,
      transactionId, 'transaction', `/transactions/${transactionId}`
    )

    // メール送信（購入者・出品者）
    const resendApiKey = (c.env as any).RESEND_API_KEY
    if (resendApiKey) {
      // 購入者・出品者の情報を取得
      const txInfo = await c.env.DB.prepare(`
        SELECT 
          buyer.name as buyer_name, buyer.email as buyer_email,
          COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_display_name,
          seller.name as seller_name, seller.email as seller_email,
          COALESCE(seller.company_name, seller.nickname, seller.name) as seller_display_name
        FROM users buyer, users seller
        WHERE buyer.id = ? AND seller.id = ?
      `).bind(userId, product.seller_id).first()

      if (txInfo) {
        const dueDateFormatted = dueDate.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})
        
        // 購入者向け: 振込先口座情報メール
        try {
          const buyerMail = tpl.bankTransferOrderBuyer({
            buyerName: txInfo.buyer_display_name as string || txInfo.buyer_name as string,
            productName: product.title as string,
            amount: product.price as number,
            invoiceNumber,
            dueDate: dueDateFormatted,
            transactionId,
          })
          await sendEmail(resendApiKey, { to: txInfo.buyer_email as string, ...buyerMail })
          console.log(`Bank transfer order email sent to buyer: ${txInfo.buyer_email}`)
        } catch (emailErr) {
          console.error('Failed to send bank transfer email to buyer:', emailErr)
        }

        // 出品者向け: 銀行振込注文通知メール
        try {
          const sellerMail = tpl.bankTransferOrderSeller({
            sellerName: txInfo.seller_display_name as string || txInfo.seller_name as string,
            productName: product.title as string,
            amount: product.price as number,
            buyerName: txInfo.buyer_display_name as string || txInfo.buyer_name as string,
            invoiceNumber,
            transactionId,
          })
          await sendEmail(resendApiKey, { to: txInfo.seller_email as string, ...sellerMail })
          console.log(`Bank transfer order email sent to seller: ${txInfo.seller_email}`)
        } catch (emailErr) {
          console.error('Failed to send bank transfer email to seller:', emailErr)
        }
      }
    }

    return c.json({
      success: true,
      transaction_id: transactionId,
      invoice_number: invoiceNumber,
      invoice_due_date: dueDateStr,
      fees,
      billing_info
    })

  } catch (error: any) {
    console.error('Create invoice order error:', error)
    return c.json({ success: false, error: '請求書払い注文の作成に失敗しました', details: error.message }, 500)
  }
})

export default payment
