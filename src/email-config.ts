import { Resend } from 'resend';

export interface EmailEnv {
  RESEND_API_KEY?: string;
}

export function getResendClient(env: EmailEnv): Resend {
  const apiKey = env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  
  return new Resend(apiKey);
}

// メールテンプレート用の型定義
export interface UserRegistrationEmail {
  to: string;
  userName: string;
  verificationUrl?: string;
}

export interface PasswordResetEmail {
  to: string;
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

export interface PurchaseNotificationBuyerEmail {
  to: string;
  buyerName: string;
  productName: string;
  amount: number;
  transactionId: number;
  orderDetailsUrl: string;
}

export interface PurchaseNotificationSellerEmail {
  to: string;
  sellerName: string;
  productName: string;
  amount: number;
  buyerName: string;
  transactionId: number;
  orderDetailsUrl: string;
}

export interface TransactionStatusUpdateEmail {
  to: string;
  userName: string;
  productName: string;
  transactionId: number;
  status: string;
  statusText: string;
  orderDetailsUrl: string;
}

// メール送信元情報
export const FROM_EMAIL = 'noreply@parts-hub-tci.com';
export const FROM_NAME = 'Parts Hub';
export const SUPPORT_EMAIL = 'support@parts-hub-tci.com';
export const SITE_URL = 'https://parts-hub-tci.com';
