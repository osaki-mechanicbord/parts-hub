import Stripe from 'stripe'
import { Context } from 'hono'

// Stripe設定
export const STRIPE_CONFIG = {
  // プラットフォーム手数料（10%）- 出品者負担（メルカリ方式）
  PLATFORM_FEE_PERCENTAGE: 0.10,
  
  // カード決済手数料 - 廃止（購入者負担なし）
  CARD_PROCESSING_FEE: 0,
  
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

// 手数料計算（メルカリ方式：出品者のみ10%負担）
// paymentMethod: 'card' | 'bank_transfer'
//
// ■ 購入者が支払う金額 = 商品価格のみ（手数料なし）
// ■ 出品者が受け取る金額 = 商品価格 − プラットフォーム手数料(10%)
// ■ プラットフォーム収益 = 商品価格 × 10%
//
// 例: 商品価格 10,000円の場合
//   購入者の支払い: 10,000円
//   出品者の受取り: 9,000円
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
  
  // カード決済手数料: 0円（購入者負担なし）
  const cardProcessingFee = 0
  
  // 購入者が支払う合計金額 = 商品価格のみ
  const total = amount
  
  // Stripe手数料: 合計金額の3.6% (Stripeが自動で差し引く、参考値)
  const stripeFeePercentage = 0.036
  const stripeFee = paymentMethod === 'card' ? Math.floor(total * stripeFeePercentage) : 0
  
  // 出品者が受け取る金額 = 商品価格 - プラットフォーム手数料(10%)
  const sellerReceives = amount - platformFee
  
  return {
    subtotal: amount,
    platformFee: platformFee,       // 出品者から徴収
    cardProcessingFee: cardProcessingFee, // 常に0
    stripeFee: stripeFee,           // 参考値（Stripeが自動徴収）
    total: total,                   // 購入者の支払い額 = 商品価格
    sellerReceives: sellerReceives  // 出品者の受取額
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
