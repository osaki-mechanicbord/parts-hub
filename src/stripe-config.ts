import Stripe from 'stripe'
import { Context } from 'hono'

// Stripe設定
export const STRIPE_CONFIG = {
  // プラットフォーム手数料（10%）- 出品者負担（メルカリ方式）
  PLATFORM_FEE_PERCENTAGE: 0.10,
  
  // カード決済手数料（税込330円）- 購入者負担
  CARD_PROCESSING_FEE: 330,
  
  // 出金振込手数料（税込330円/回）- 出品者負担
  WITHDRAWAL_FEE: 330,
  
  // 最低取引金額（100円）
  MIN_TRANSACTION_AMOUNT: 100,
  
  // 最大取引金額（100万円）
  MAX_TRANSACTION_AMOUNT: 1000000,
  
  // 通貨
  CURRENCY: 'jpy',
  
  // Webhook許容タイムスタンプ差異（5分）
  WEBHOOK_TOLERANCE: 300
}

// Stripeクライアント取得
export function getStripeClient(c: Context): Stripe {
  const secretKey = (c.env as any)?.STRIPE_SECRET_KEY
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover', // Stripe SDK v20.x対応
    typescript: true
  })
}

// 手数料計算
// paymentMethod: 'card' | 'bank_transfer'
//
// ■ 購入者が支払う金額:
//   - カード決済: 商品価格（税込）+ カード決済手数料 ¥330（税込）
//   - 銀行振込: 商品価格（税込）+ 振込手数料（各銀行により異なる、購入者負担）
// ■ 出品者が受け取る金額 = 販売額 − 販売手数料(10%)
// ■ 出品者の出金時: 振込申請のたびに振込手数料 ¥330 を差引
// ■ プラットフォーム収益 = 販売額 × 10%
//
// 例: 商品価格 10,000円（税抜）の場合
//   購入者の支払い（カード）: 11,330円（税込11,000円 + カード手数料330円）
//   購入者の支払い（振込）:  11,000円（税込）+ 振込手数料（銀行により異なる）
//   出品者の受取り: 9,000円（10,000 - 10%）※出金時に別途¥330/回
//   PARTS HUB収益: 1,000円
//   ※ Stripe手数料(3.6%)はプラットフォーム収益から負担
export function calculateFees(amount: number, paymentMethod: 'card' | 'bank_transfer' = 'card'): {
  subtotal: number
  platformFee: number
  cardProcessingFee: number
  stripeFee: number
  total: number
  sellerReceives: number
} {
  // プラットフォーム手数料: 10%（出品者負担）
  const platformFee = Math.floor(amount * STRIPE_CONFIG.PLATFORM_FEE_PERCENTAGE)
  
  // カード決済手数料: ¥330（税込）購入者負担（カード決済時のみ）
  const cardProcessingFee = paymentMethod === 'card' ? STRIPE_CONFIG.CARD_PROCESSING_FEE : 0
  
  // 購入者が支払う合計金額 = 商品価格 + カード決済手数料（カード時のみ）
  const total = amount + cardProcessingFee
  
  // Stripe手数料: 合計金額の3.6% (Stripeが自動で差し引く、参考値)
  const stripeFeePercentage = 0.036
  const stripeFee = paymentMethod === 'card' ? Math.floor(total * stripeFeePercentage) : 0
  
  // 出品者が受け取る金額 = 商品価格 - プラットフォーム手数料(10%)
  const sellerReceives = amount - platformFee
  
  return {
    subtotal: amount,
    platformFee: platformFee,       // 出品者から徴収（販売額の10%）
    cardProcessingFee: cardProcessingFee, // カード決済時のみ¥330（購入者負担）
    stripeFee: stripeFee,           // 参考値（Stripeが自動徴収）
    total: total,                   // 購入者の支払い額
    sellerReceives: sellerReceives  // 出品者の受取額（出金時に別途¥330/回）
  }
}

// 金額バリデーション
export function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (!amount || amount < STRIPE_CONFIG.MIN_TRANSACTION_AMOUNT) {
    return { 
      valid: false, 
      error: `取引金額は${STRIPE_CONFIG.MIN_TRANSACTION_AMOUNT}円以上である必要があります` 
    }
  }
  
  if (amount > STRIPE_CONFIG.MAX_TRANSACTION_AMOUNT) {
    return { 
      valid: false, 
      error: `取引金額は${STRIPE_CONFIG.MAX_TRANSACTION_AMOUNT.toLocaleString()}円以下である必要があります` 
    }
  }
  
  return { valid: true }
}

// Webhook署名検証
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event | null {
  const stripe = new Stripe(secret, {
    apiVersion: '2026-02-25.clover'
  })
  
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret
    )
    return event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return null
  }
}
