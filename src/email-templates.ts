// PARTS HUB メールテンプレート集
import { SITE_URL } from './email-config'

// ========== 共通ベーステンプレート ==========
function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans',sans-serif;line-height:1.7;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- ヘッダー -->
        <tr><td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:1px;">PARTS HUB</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">自動車パーツ売買プラットフォーム</p>
        </td></tr>
        <!-- 本文 -->
        <tr><td style="padding:32px 28px;">
          ${content}
        </td></tr>
        <!-- フッター -->
        <tr><td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
          <p style="margin:0 0 4px;">このメールに心当たりがない場合は、お手数ですが削除してください。</p>
          <p style="margin:0;">&copy; 2026 PARTS HUB. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ========== ボタン共通 ==========
function actionButton(text: string, url: string): string {
  return `<p style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 2px 8px rgba(239,68,68,0.3);">${text}</a>
  </p>`
}

// ========== 情報ボックス共通 ==========
function infoBox(rows: string[]): string {
  return `<div style="background:#f8f9fa;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
    ${rows.join('')}
  </div>`
}

function infoRow(label: string, value: string): string {
  return `<p style="margin:4px 0;font-size:14px;"><strong>${label}:</strong> ${value}</p>`
}

// ================================================================
// 1. メールアドレス認証メール
// ================================================================
export function emailVerification(p: { userName: string; verifyUrl: string }) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">メールアドレスの認証をお願いします</h2>
    <p>${p.userName} 様</p>
    <p>PARTS HUBにご登録いただきありがとうございます。<br>以下のボタンをクリックして、メールアドレスの認証を完了してください。</p>
    ${infoBox([infoRow('有効期限', '24時間')])}
    ${actionButton('メールアドレスを認証する', p.verifyUrl)}
    <p style="font-size:13px;color:#6b7280;">ボタンが機能しない場合は以下のURLをコピーしてブラウザに貼り付けてください：<br><code style="font-size:12px;word-break:break-all;">${p.verifyUrl}</code></p>
  `
  return {
    subject: '【PARTS HUB】メールアドレスの認証をお願いします',
    html: baseTemplate('メールアドレス認証', content),
  }
}

// ================================================================
// 2. 会員登録完了メール
// ================================================================
export function registrationComplete(p: { userName: string }) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">🎉 ご登録ありがとうございます！</h2>
    <p>${p.userName} 様</p>
    <p>PARTS HUBへの会員登録が完了しました。<br>自動車パーツの売買を始めましょう！</p>
    ${infoBox([
      '<p style="margin:0 0 8px;font-weight:700;">できること：</p>',
      '<p style="margin:2px 0;font-size:14px;">✅ 自動車部品の出品・購入</p>',
      '<p style="margin:2px 0;font-size:14px;">✅ 車体番号から適合部品を検索</p>',
      '<p style="margin:2px 0;font-size:14px;">✅ 安全な決済システム（Stripe）</p>',
      '<p style="margin:2px 0;font-size:14px;">✅ 出品者とのチャット機能</p>',
    ])}
    ${actionButton('PARTS HUBを開く', SITE_URL)}
  `
  return {
    subject: '【PARTS HUB】ご登録ありがとうございます',
    html: baseTemplate('会員登録完了', content),
  }
}

// ================================================================
// 3. 商品が購入されたとき（出品者向け）- 発送準備依頼を強調
// ================================================================
export function productPurchasedSeller(p: {
  sellerName: string; productName: string; amount: number;
  buyerName: string; transactionId: number
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">🎊 商品が購入されました！</h2>
    <p>${p.sellerName} 様</p>
    <p>おめでとうございます！あなたの商品が購入されました。<br><strong style="color:#dc2626;">決済は完了していますので、できるだけ早く発送準備をお願いします。</strong></p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('販売価格', `¥${amt}`),
      infoRow('購入者', p.buyerName),
      infoRow('注文番号', `#${p.transactionId}`),
      infoRow('決済状況', '<span style="color:#16a34a;font-weight:700;">✅ 決済完了</span>'),
    ])}
    <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:800;font-size:15px;color:#c2410c;">📦 発送をお願いします</p>
      <ol style="font-size:14px;padding-left:20px;margin:0;color:#333;">
        <li style="margin-bottom:4px;">商品の梱包を行ってください</li>
        <li style="margin-bottom:4px;">配送業者に依頼して発送してください</li>
        <li style="margin-bottom:4px;">発送完了後、<a href="${url}" style="color:#ef4444;font-weight:600;">取引ページ</a>で「発送済み」に更新してください</li>
      </ol>
      <p style="margin:8px 0 0;font-size:13px;color:#9a3412;">※ 追跡番号がある場合は取引ページに入力してください。購入者に自動通知されます。</p>
    </div>
    ${actionButton('取引ページで発送手続きをする', url)}
    <p style="font-size:13px;color:#6b7280;">商品についての質問は取引ページのチャットで購入者とやり取りできます。</p>
  `
  return {
    subject: `【PARTS HUB】商品が購入されました！発送準備をお願いします - ${p.productName}`,
    html: baseTemplate('商品購入通知', content),
  }
}

// ================================================================
// 4. 決済完了時（購入者向け）
// ================================================================
export function paymentCompleteBuyer(p: {
  buyerName: string; productName: string; amount: number; transactionId: number
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">💳 お支払いが完了しました</h2>
    <p>${p.buyerName} 様</p>
    <p>以下の商品のお支払いが完了しました。ありがとうございます！</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('お支払い金額', `¥${amt}`),
      infoRow('注文番号', `#${p.transactionId}`),
    ])}
    <p>出品者が発送準備を進めます。発送されましたらメールでお知らせいたします。</p>
    ${actionButton('注文詳細を見る', url)}
    <p style="font-size:13px;color:#6b7280;">商品について質問がある場合は、取引ページから出品者にメッセージを送信できます。</p>
  `
  return {
    subject: `【PARTS HUB】お支払い完了 - ${p.productName}`,
    html: baseTemplate('決済完了', content),
  }
}

// ================================================================
// 5. 出品者に質問が来たとき
// ================================================================
export function newQuestionToSeller(p: {
  sellerName: string; productName: string; productId: number;
  buyerName: string; question: string
}) {
  const url = `${SITE_URL}/products/${p.productId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">💬 商品について質問が届きました</h2>
    <p>${p.sellerName} 様</p>
    <p>あなたの出品商品について質問が届いています。</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('質問者', p.buyerName),
    ])}
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#856404;">質問内容：</p>
      <p style="margin:0;font-size:14px;color:#333;">${p.question}</p>
    </div>
    <p>できるだけ早く回答することで、購入率が上がります！</p>
    ${actionButton('商品ページで回答する', url)}
  `
  return {
    subject: `【PARTS HUB】商品への質問 - ${p.productName}`,
    html: baseTemplate('商品への質問', content),
  }
}

// ========== 追跡URL生成ヘルパー ==========
function getTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const num = trackingNumber.replace(/[-\s]/g, '')
  switch (carrier) {
    case 'ヤマト運輸':
      return `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${num}`
    case '佐川急便':
      return `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${num}`
    case '日本郵便':
      return `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${num}`
    case '西濃運輸':
      return `https://track.seino.co.jp/kamotsu/GempyoNoShoworiBin.do?gnpNo1=${num}`
    case '福山通運':
      return `https://corp.fukutsu.co.jp/situation/tracking_no_hunt/${num}`
    default:
      return null
  }
}

// ================================================================
// 6. 商品が発送されたとき（購入者向け）
// ================================================================
export function productShipped(p: {
  buyerName: string; productName: string; transactionId: number;
  trackingNumber?: string; shippingCarrier?: string
}) {
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const trackingInfo: string[] = []
  if (p.shippingCarrier) trackingInfo.push(infoRow('配送業者', p.shippingCarrier))
  if (p.trackingNumber) {
    const trackingUrl = getTrackingUrl(p.shippingCarrier || '', p.trackingNumber)
    const trackingDisplay = trackingUrl
      ? `<a href="${trackingUrl}" style="color:#ef4444;font-weight:600;" target="_blank">${p.trackingNumber}</a>`
      : p.trackingNumber
    trackingInfo.push(infoRow('追跡番号', trackingDisplay))
  }
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">📦 商品が発送されました！</h2>
    <p>${p.buyerName} 様</p>
    <p>ご購入いただいた商品が出品者から発送されました。</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('注文番号', `#${p.transactionId}`),
      ...trackingInfo,
    ])}
    <p>商品到着後、取引ページから<strong>「受取完了」</strong>ボタンを押してください。</p>
    ${actionButton('配送状況を確認する', url)}
    <p style="font-size:13px;color:#6b7280;">商品に問題がある場合は、取引ページからお問い合わせください。</p>
  `
  return {
    subject: `【PARTS HUB】商品が発送されました - ${p.productName}`,
    html: baseTemplate('発送通知', content),
  }
}

// ================================================================
// 7. 取引完了時（出品者向け）
// ================================================================
export function transactionCompleted(p: {
  sellerName: string; productName: string; amount: number; transactionId: number
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">✅ 取引が完了しました</h2>
    <p>${p.sellerName} 様</p>
    <p>購入者が商品の受け取りを確認しました。取引が正常に完了しました。</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('販売価格', `¥${amt}`),
      infoRow('注文番号', `#${p.transactionId}`),
      infoRow('ステータス', '<span style="color:#16a34a;font-weight:700;">✅ 取引完了</span>'),
    ])}
    <p>お取引いただきありがとうございます。売上金はマイページからご確認いただけます。</p>
    ${actionButton('取引詳細を見る', url)}
  `
  return {
    subject: `【PARTS HUB】取引完了 - ${p.productName}`,
    html: baseTemplate('取引完了', content),
  }
}

// ================================================================
// 7b. 受取完了確認（購入者向け）
// ================================================================
export function receiptConfirmed(p: {
  buyerName: string; productName: string; amount: number; transactionId: number
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const reviewUrl = `${SITE_URL}/reviews/new?transaction=${p.transactionId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">✅ 受取完了 - お取引ありがとうございました</h2>
    <p>${p.buyerName} 様</p>
    <p>商品の受け取り完了を確認いたしました。お取引いただきありがとうございます。</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('お支払い金額', `¥${amt}`),
      infoRow('注文番号', `#${p.transactionId}`),
      infoRow('ステータス', '<span style="color:#16a34a;font-weight:700;">✅ 取引完了</span>'),
    ])}
    <p>出品者への<strong>レビュー</strong>にご協力いただけると幸いです。今後のお取引の参考になります。</p>
    ${actionButton('レビューを書く', reviewUrl)}
    <p style="font-size:13px;color:#6b7280;">商品に問題がある場合は、<a href="${url}" style="color:#ef4444;">取引ページ</a>からお問い合わせください。</p>
  `
  return {
    subject: `【PARTS HUB】受取完了 - ${p.productName}`,
    html: baseTemplate('受取完了', content),
  }
}

// ================================================================
// 8. パスワードリセット
// ================================================================
export function passwordReset(p: { userName: string; resetUrl: string }) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">🔑 パスワードリセット</h2>
    <p>${p.userName} 様</p>
    <p>パスワードのリセットが要求されました。以下のボタンをクリックして、新しいパスワードを設定してください。</p>
    ${infoBox([infoRow('有効期限', '1時間')])}
    ${actionButton('パスワードをリセットする', p.resetUrl)}
    <p style="font-size:13px;color:#6b7280;">このリクエストに心当たりがない場合は、このメールを無視してください。</p>
  `
  return {
    subject: '【PARTS HUB】パスワードリセット',
    html: baseTemplate('パスワードリセット', content),
  }
}
