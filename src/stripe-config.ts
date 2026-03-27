import Stripe from 'stripe'
import { Context } from 'hono'

// Stripe設定
export const STRIPE_CONFIG = {
  // プラットフォーム手数料（10%）
  PLATFORM_FEE_PERCENTAGE: 0.10,
  
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
export function calculateFees(amount: number): {
  subtotal: number
  platformFee: number
  stripeFee: number
  total: number
  sellerReceives: number
} {
  // Stripe手数料: 3.6%
  const stripeFeePercentage = 0.036
  
  // プラットフォーム手数料: 10%
  const platformFee = Math.floor(amount * STRIPE_CONFIG.PLATFORM_FEE_PERCENTAGE)
  
  // Stripe手数料計算
  const stripeFee = Math.floor(amount * stripeFeePercentage)
  
  // 合計金額
  const total = amount + platformFee + stripeFee
  
  // 出品者が受け取る金額
  const sellerReceives = amount - platformFee
  
  return {
    subtotal: amount,
    platformFee: platformFee,
    stripeFee: stripeFee,
    total: total,
    sellerReceives: sellerReceives
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
