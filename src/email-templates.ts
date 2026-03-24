import {
  UserRegistrationEmail,
  PasswordResetEmail,
  PurchaseNotificationBuyerEmail,
  PurchaseNotificationSellerEmail,
  TransactionStatusUpdateEmail,
  FROM_EMAIL,
  FROM_NAME,
  SUPPORT_EMAIL,
  SITE_URL,
} from './email-config';

// メールのベーステンプレート
function getEmailTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #4F46E5;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4F46E5;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #4F46E5;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔧 Parts Hub</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>このメールに心当たりがない場合は、お手数ですが削除してください。</p>
      <p>お問い合わせ: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      <p>&copy; 2026 Parts Hub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// 1. ユーザー登録確認メール
export function createUserRegistrationEmail(data: UserRegistrationEmail) {
  const content = `
    <h2>ご登録ありがとうございます！</h2>
    <p>${data.userName} 様</p>
    <p>Parts Hubへのご登録が完了しました。</p>
    <p>自動車部品のマーケットプレイスで、安心・安全な取引をお楽しみください。</p>
    <div class="info-box">
      <strong>できること：</strong>
      <ul>
        <li>自動車部品の出品・購入</li>
        <li>安全な決済システム（Stripe）</li>
        <li>取引履歴の管理</li>
        <li>レビュー機能</li>
      </ul>
    </div>
    <p>
      <a href="${SITE_URL}" class="button">Parts Hubを開く</a>
    </p>
  `;

  return {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.to,
    subject: '【Parts Hub】ご登録ありがとうございます',
    html: getEmailTemplate('ユーザー登録完了', content),
  };
}

// 2. パスワードリセットメール
export function createPasswordResetEmail(data: PasswordResetEmail) {
  const content = `
    <h2>パスワードリセットのご案内</h2>
    <p>${data.userName} 様</p>
    <p>パスワードリセットのリクエストを受け付けました。</p>
    <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
    <div class="info-box">
      <p><strong>有効期限:</strong> ${data.expiresIn}</p>
      <p>このリンクは1回のみ有効です。</p>
    </div>
    <p>
      <a href="${data.resetUrl}" class="button">パスワードをリセット</a>
    </p>
    <p style="color: #666; font-size: 14px;">
      ボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
      <code>${data.resetUrl}</code>
    </p>
    <p style="color: #e53e3e; margin-top: 20px;">
      <strong>⚠️ 注意:</strong> このリクエストに心当たりがない場合は、このメールを無視してください。
    </p>
  `;

  return {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.to,
    subject: '【Parts Hub】パスワードリセットのご案内',
    html: getEmailTemplate('パスワードリセット', content),
  };
}

// 3. 購入完了通知（購入者向け）
export function createPurchaseNotificationBuyerEmail(data: PurchaseNotificationBuyerEmail) {
  const formattedAmount = data.amount.toLocaleString('ja-JP');
  
  const content = `
    <h2>ご購入ありがとうございます！</h2>
    <p>${data.buyerName} 様</p>
    <p>以下の商品のご購入が完了しました。</p>
    <div class="info-box">
      <p><strong>商品名:</strong> ${data.productName}</p>
      <p><strong>お支払い金額:</strong> ¥${formattedAmount}</p>
      <p><strong>注文番号:</strong> #${data.transactionId}</p>
    </div>
    <p>出品者が発送準備を進めています。配送情報が更新されましたら、再度メールでお知らせします。</p>
    <p>
      <a href="${data.orderDetailsUrl}" class="button">注文詳細を見る</a>
    </p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      商品に問題がある場合や、質問がある場合は、マイページから出品者へメッセージを送信できます。
    </p>
  `;

  return {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.to,
    subject: `【Parts Hub】ご購入ありがとうございます - ${data.productName}`,
    html: getEmailTemplate('購入完了', content),
  };
}

// 4. 商品購入通知（出品者向け）
export function createPurchaseNotificationSellerEmail(data: PurchaseNotificationSellerEmail) {
  const formattedAmount = data.amount.toLocaleString('ja-JP');
  
  const content = `
    <h2>商品が購入されました！</h2>
    <p>${data.sellerName} 様</p>
    <p>おめでとうございます！あなたの商品が購入されました。</p>
    <div class="info-box">
      <p><strong>商品名:</strong> ${data.productName}</p>
      <p><strong>販売価格:</strong> ¥${formattedAmount}</p>
      <p><strong>購入者:</strong> ${data.buyerName}</p>
      <p><strong>注文番号:</strong> #${data.transactionId}</p>
    </div>
    <p><strong>次のステップ：</strong></p>
    <ol>
      <li>商品の梱包を行ってください</li>
      <li>発送手配を進めてください</li>
      <li>発送完了後、取引ステータスを「発送済み」に更新してください</li>
    </ol>
    <p>
      <a href="${data.orderDetailsUrl}" class="button">注文詳細を見る</a>
    </p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      購入者からの質問にはできるだけ早く回答してください。良い評価を獲得するチャンスです！
    </p>
  `;

  return {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.to,
    subject: `【Parts Hub】商品が購入されました - ${data.productName}`,
    html: getEmailTemplate('商品購入通知', content),
  };
}

// 5. 取引ステータス更新通知
export function createTransactionStatusUpdateEmail(data: TransactionStatusUpdateEmail) {
  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    paid: '💳',
    shipped: '📦',
    delivered: '✅',
    completed: '🎉',
    cancelled: '❌',
  };

  const emoji = statusEmoji[data.status] || '📢';
  
  const content = `
    <h2>${emoji} 取引ステータスが更新されました</h2>
    <p>${data.userName} 様</p>
    <p>以下の取引のステータスが更新されました。</p>
    <div class="info-box">
      <p><strong>商品名:</strong> ${data.productName}</p>
      <p><strong>注文番号:</strong> #${data.transactionId}</p>
      <p><strong>新しいステータス:</strong> ${data.statusText}</p>
    </div>
    <p>
      <a href="${data.orderDetailsUrl}" class="button">注文詳細を見る</a>
    </p>
  `;

  return {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.to,
    subject: `【Parts Hub】取引ステータス更新 - ${data.productName}`,
    html: getEmailTemplate('取引ステータス更新', content),
  };
}
