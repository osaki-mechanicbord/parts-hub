import { Hono } from 'hono';
import { getResendClient, EmailEnv, SITE_URL } from '../email-config';
import {
  createUserRegistrationEmail,
  createPasswordResetEmail,
  createPurchaseNotificationBuyerEmail,
  createPurchaseNotificationSellerEmail,
  createTransactionStatusUpdateEmail,
} from '../email-templates';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 1. ユーザー登録確認メール送信
app.post('/send-registration', async (c) => {
  try {
    const { email, userName } = await c.req.json();

    if (!email || !userName) {
      return c.json({ success: false, error: 'メールアドレスと名前が必要です' }, 400);
    }

    const resend = getResendClient({ RESEND_API_KEY: c.env.RESEND_API_KEY });
    const emailData = createUserRegistrationEmail({ to: email, userName });

    const result = await resend.emails.send(emailData);

    return c.json({
      success: true,
      message: '登録確認メールを送信しました',
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('Registration email error:', error);
    return c.json({ success: false, error: 'メール送信に失敗しました' }, 500);
  }
});

// 2. パスワードリセットメール送信
app.post('/send-password-reset', async (c) => {
  try {
    const { email, userName, resetToken } = await c.req.json();

    if (!email || !userName || !resetToken) {
      return c.json({ success: false, error: '必要な情報が不足しています' }, 400);
    }

    const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
    const expiresIn = '1時間';

    const resend = getResendClient({ RESEND_API_KEY: c.env.RESEND_API_KEY });
    const emailData = createPasswordResetEmail({
      to: email,
      userName,
      resetUrl,
      expiresIn,
    });

    const result = await resend.emails.send(emailData);

    return c.json({
      success: true,
      message: 'パスワードリセットメールを送信しました',
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('Password reset email error:', error);
    return c.json({ success: false, error: 'メール送信に失敗しました' }, 500);
  }
});

// 3. 購入完了通知送信（購入者・出品者両方）
app.post('/send-purchase-notification', async (c) => {
  try {
    const {
      buyerEmail,
      buyerName,
      sellerEmail,
      sellerName,
      productName,
      amount,
      transactionId,
    } = await c.req.json();

    if (!buyerEmail || !sellerEmail || !productName || !amount || !transactionId) {
      return c.json({ success: false, error: '必要な情報が不足しています' }, 400);
    }

    const orderDetailsUrl = `${SITE_URL}/mypage/transactions/${transactionId}`;
    const resend = getResendClient({ RESEND_API_KEY: c.env.RESEND_API_KEY });

    // 購入者向けメール
    const buyerEmailData = createPurchaseNotificationBuyerEmail({
      to: buyerEmail,
      buyerName,
      productName,
      amount,
      transactionId,
      orderDetailsUrl,
    });

    // 出品者向けメール
    const sellerEmailData = createPurchaseNotificationSellerEmail({
      to: sellerEmail,
      sellerName,
      productName,
      amount,
      buyerName,
      transactionId,
      orderDetailsUrl,
    });

    // 両方のメールを送信
    const [buyerResult, sellerResult] = await Promise.all([
      resend.emails.send(buyerEmailData),
      resend.emails.send(sellerEmailData),
    ]);

    return c.json({
      success: true,
      message: '購入通知メールを送信しました',
      buyerEmailId: buyerResult.data?.id,
      sellerEmailId: sellerResult.data?.id,
    });
  } catch (error) {
    console.error('Purchase notification email error:', error);
    return c.json({ success: false, error: 'メール送信に失敗しました' }, 500);
  }
});

// 4. 取引ステータス更新通知送信
app.post('/send-status-update', async (c) => {
  try {
    const { email, userName, productName, transactionId, status, statusText } =
      await c.req.json();

    if (!email || !userName || !productName || !transactionId || !status || !statusText) {
      return c.json({ success: false, error: '必要な情報が不足しています' }, 400);
    }

    const orderDetailsUrl = `${SITE_URL}/mypage/transactions/${transactionId}`;
    const resend = getResendClient({ RESEND_API_KEY: c.env.RESEND_API_KEY });

    const emailData = createTransactionStatusUpdateEmail({
      to: email,
      userName,
      productName,
      transactionId,
      status,
      statusText,
      orderDetailsUrl,
    });

    const result = await resend.emails.send(emailData);

    return c.json({
      success: true,
      message: 'ステータス更新メールを送信しました',
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('Status update email error:', error);
    return c.json({ success: false, error: 'メール送信に失敗しました' }, 500);
  }
});

export default app;
