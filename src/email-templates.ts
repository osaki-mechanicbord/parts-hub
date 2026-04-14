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
// ================================================================
// 9. お問い合わせフォーム送信時（管理者向け）
// ================================================================
export function contactInquiryAdmin(p: {
  name: string; email: string; phone?: string;
  subject: string; message: string; inquiryType: string
}) {
  const typeLabel: Record<string, string> = {
    general: '一般', product: '商品について', support: 'サポート',
    complaint: 'クレーム', other: 'その他',
  }
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">📩 新しいお問い合わせが届きました</h2>
    <p>管理者 様</p>
    <p>以下の内容でお問い合わせがありました。2営業日以内にご対応をお願いします。</p>
    ${infoBox([
      infoRow('種別', typeLabel[p.inquiryType] || p.inquiryType),
      infoRow('お名前', p.name),
      infoRow('メール', p.email),
      ...(p.phone ? [infoRow('電話番号', p.phone)] : []),
      infoRow('件名', p.subject),
    ])}
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#374151;">お問い合わせ内容：</p>
      <p style="margin:0;font-size:14px;color:#333;white-space:pre-wrap;">${p.message}</p>
    </div>
    ${actionButton('管理画面で確認する', `${SITE_URL}/admin/inquiries`)}
  `
  return {
    subject: `【PARTS HUB】新しいお問い合わせ - ${p.subject}`,
    html: baseTemplate('お問い合わせ通知', content),
  }
}

// ================================================================
// 10. フランチャイズ資料請求時（管理者向け）
// ================================================================
export function franchiseInquiryAdmin(p: {
  name: string; email: string; phone?: string;
  areaPref?: string; occupation?: string; experience?: string; message?: string
}) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">🤝 フランチャイズ資料請求が届きました</h2>
    <p>管理者 様</p>
    <p>新しいフランチャイズ（パートナー）の資料請求がありました。</p>
    ${infoBox([
      infoRow('お名前', p.name),
      infoRow('メール', p.email),
      ...(p.phone ? [infoRow('電話番号', p.phone)] : []),
      ...(p.areaPref ? [infoRow('希望エリア', p.areaPref)] : []),
      ...(p.occupation ? [infoRow('ご職業', p.occupation)] : []),
      ...(p.experience ? [infoRow('業界経験', p.experience)] : []),
    ])}
    ${p.message ? `<div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#374151;">メッセージ：</p>
      <p style="margin:0;font-size:14px;color:#333;white-space:pre-wrap;">${p.message}</p>
    </div>` : ''}
    ${actionButton('管理画面で確認する', `${SITE_URL}/admin/inquiries`)}
  `
  return {
    subject: `【PARTS HUB】フランチャイズ資料請求 - ${p.name} 様`,
    html: baseTemplate('フランチャイズ資料請求', content),
  }
}

// ================================================================
// 11. 出品完了時（出品者向け）
// ================================================================
export function listingComplete(p: {
  sellerName: string; productName: string; productId: number; price: number
}) {
  const amt = p.price.toLocaleString('ja-JP')
  const url = `${SITE_URL}/products/${p.productId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">🎉 商品の出品が完了しました！</h2>
    <p>${p.sellerName} 様</p>
    <p>以下の商品の出品が完了しました。購入者からの問い合わせをお待ちください。</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('販売価格', `¥${amt}`),
    ])}
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:700;font-size:14px;color:#166534;">💡 売れやすくするコツ</p>
      <ul style="font-size:14px;padding-left:20px;margin:0;color:#333;">
        <li style="margin-bottom:4px;">鮮明な写真を複数枚追加する</li>
        <li style="margin-bottom:4px;">商品の状態や適合車種を詳しく記載する</li>
        <li style="margin-bottom:4px;">質問には迅速に回答する</li>
      </ul>
    </div>
    ${actionButton('出品商品を確認する', url)}
    <p style="font-size:13px;color:#6b7280;">商品の編集はマイページからいつでも行えます。</p>
  `
  return {
    subject: `【PARTS HUB】出品完了 - ${p.productName}`,
    html: baseTemplate('出品完了', content),
  }
}

// ================================================================
// 12. レビュー投稿通知（出品者向け）
// ================================================================
export function newReviewNotification(p: {
  sellerName: string; reviewerName: string;
  productName: string; rating: number; comment: string;
  sellerId: number
}) {
  const stars = '★'.repeat(p.rating) + '☆'.repeat(5 - p.rating)
  const url = `${SITE_URL}/seller/${p.sellerId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">⭐ 新しいレビューが投稿されました</h2>
    <p>${p.sellerName} 様</p>
    <p>あなたの取引に対してレビューが投稿されました。</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('投稿者', p.reviewerName),
      infoRow('評価', `<span style="color:#f59e0b;font-size:16px;">${stars}</span> (${p.rating}/5)`),
    ])}
    <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#92400e;">レビュー内容：</p>
      <p style="margin:0;font-size:14px;color:#333;">${p.comment.length > 300 ? p.comment.substring(0, 300) + '...' : p.comment}</p>
    </div>
    ${actionButton('レビューを確認する', url)}
    <p style="font-size:13px;color:#6b7280;">評価は出品者プロフィールに反映されます。</p>
  `
  return {
    subject: `【PARTS HUB】新しいレビューが投稿されました（${p.rating}つ星）`,
    html: baseTemplate('レビュー通知', content),
  }
}

// ================================================================
// 13. 管理者による商品承認/却下通知（出品者向け）
// ================================================================
export function productStatusChanged(p: {
  sellerName: string; productName: string; productId: number;
  newStatus: 'active' | 'suspended'; reason?: string
}) {
  const isApproved = p.newStatus === 'active'
  const url = `${SITE_URL}/products/${p.productId}`

  const content = isApproved
    ? `
      <h2 style="margin:0 0 16px;font-size:20px;color:#111;">✅ 商品が承認されました</h2>
      <p>${p.sellerName} 様</p>
      <p>あなたの出品商品が管理者に承認され、公開されました。</p>
      ${infoBox([
        infoRow('商品名', p.productName),
        infoRow('ステータス', '<span style="color:#16a34a;font-weight:700;">✅ 公開中</span>'),
      ])}
      <p>購入者からの問い合わせや購入をお待ちください。</p>
      ${actionButton('商品ページを見る', url)}
    `
    : `
      <h2 style="margin:0 0 16px;font-size:20px;color:#111;">⚠️ 商品が却下されました</h2>
      <p>${p.sellerName} 様</p>
      <p>あなたの出品商品が管理者により却下（公開停止）されました。</p>
      ${infoBox([
        infoRow('商品名', p.productName),
        infoRow('ステータス', '<span style="color:#dc2626;font-weight:700;">❌ 公開停止</span>'),
        ...(p.reason ? [infoRow('理由', p.reason)] : []),
      ])}
      <p>商品情報を修正して再出品することが可能です。ご不明な場合はお問い合わせください。</p>
      ${actionButton('商品を編集する', `${SITE_URL}/mypage`)}
      <p style="font-size:13px;color:#6b7280;">ご不明な点がございましたら、<a href="${SITE_URL}/contact" style="color:#ef4444;">お問い合わせ</a>からご連絡ください。</p>
    `

  return {
    subject: isApproved
      ? `【PARTS HUB】商品が承認されました - ${p.productName}`
      : `【PARTS HUB】商品が却下されました - ${p.productName}`,
    html: baseTemplate(isApproved ? '商品承認' : '商品却下', content),
  }
}

// ================================================================
// 14. 銀行振込注文受付（購入者向け）— 振込先口座情報を通知
// ================================================================
export function bankTransferOrderBuyer(p: {
  buyerName: string; productName: string; amount: number;
  invoiceNumber: string; dueDate: string; transactionId: number
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">ご注文ありがとうございます</h2>
    <p>${p.buyerName} 様</p>
    <p>銀行振込を選択されましたので、下記口座にお振込をお願いいたします。</p>

    <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:20px;margin:20px 0;">
      <h3 style="font-size:16px;font-weight:bold;color:#1e40af;margin:0 0 16px;text-align:center;">振込先口座情報</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #bfdbfe;">
          <td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">金融機関名</td>
          <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">PayPay銀行</td>
        </tr>
        <tr style="border-bottom:1px solid #bfdbfe;">
          <td style="padding:8px 0;color:#64748b;font-size:13px;">支店名</td>
          <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">ビジネス営業部</td>
        </tr>
        <tr style="border-bottom:1px solid #bfdbfe;">
          <td style="padding:8px 0;color:#64748b;font-size:13px;">店番号</td>
          <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">005</td>
        </tr>
        <tr style="border-bottom:1px solid #bfdbfe;">
          <td style="padding:8px 0;color:#64748b;font-size:13px;">口座種別</td>
          <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">普通</td>
        </tr>
        <tr style="border-bottom:1px solid #bfdbfe;">
          <td style="padding:8px 0;color:#64748b;font-size:13px;">口座番号</td>
          <td style="padding:8px 0;font-weight:bold;color:#111;font-size:18px;letter-spacing:2px;">1460031</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">口座名義</td>
          <td style="padding:8px 0;font-weight:bold;color:#111;font-size:15px;">カ）ティーシーアイ</td>
        </tr>
      </table>
    </div>

    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('お振込金額', `<span style="color:#ef4444;font-weight:800;font-size:16px;">¥${amt}</span>`),
      infoRow('請求書番号', p.invoiceNumber),
      infoRow('振込期限', `<span style="color:#f59e0b;font-weight:700;">${p.dueDate}</span>`),
    ])}

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;margin:20px 0;">
      <p style="font-size:13px;color:#92400e;line-height:1.6;margin:0;">
        <strong>入金が確認され次第、商品を発送いたします。</strong><br>
        ※ 振込手数料はお客様のご負担となります。<br>
        ※ 振込期限を過ぎますと注文がキャンセルとなる場合があります。
      </p>
    </div>
    ${actionButton('注文詳細を見る', url)}
    <p style="font-size:13px;color:#6b7280;">ご不明な点がございましたら、取引ページからお問い合わせください。</p>
  `
  return {
    subject: `【PARTS HUB】お振込のお願い - ${p.productName}（${p.invoiceNumber}）`,
    html: baseTemplate('お振込のお願い', content),
  }
}

// ================================================================
// 15. 銀行振込注文通知（出品者向け）
// ================================================================
export function bankTransferOrderSeller(p: {
  sellerName: string; productName: string; amount: number;
  buyerName: string; invoiceNumber: string; transactionId: number
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">銀行振込の注文がありました</h2>
    <p>${p.sellerName} 様</p>
    <p>あなたの商品に銀行振込での注文が入りました。<br>
    <strong style="color:#b45309;">振込確認後に発送依頼をお送りしますので、しばらくお待ちください。</strong></p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('販売価格', `¥${amt}`),
      infoRow('購入者', p.buyerName),
      infoRow('請求書番号', p.invoiceNumber),
      infoRow('決済方法', '銀行振込（入金待ち）'),
    ])}
    <p style="font-size:13px;color:#6b7280;">入金が確認され次第、発送依頼の通知をお送りいたします。</p>
    ${actionButton('取引詳細を見る', url)}
  `
  return {
    subject: `【PARTS HUB】銀行振込の注文がありました - ${p.productName}`,
    html: baseTemplate('銀行振込注文通知', content),
  }
}

// ================================================================
// 16. 入金確認完了（購入者向け）
// ================================================================
export function transferConfirmedBuyer(p: {
  buyerName: string; productName: string; amount: number;
  invoiceNumber: string; transactionId: number
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">お振込を確認いたしました</h2>
    <p>${p.buyerName} 様</p>
    <p>以下の商品のお振込を確認いたしました。ありがとうございます！<br>
    出品者に発送依頼を送信しました。発送をお待ちください。</p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('お支払い金額', `¥${amt}`),
      infoRow('請求書番号', p.invoiceNumber),
      infoRow('ステータス', '<span style="color:#16a34a;font-weight:700;">入金確認済み</span>'),
    ])}
    <p>出品者が発送準備を進めます。発送されましたらメールでお知らせいたします。</p>
    ${actionButton('注文詳細を見る', url)}
  `
  return {
    subject: `【PARTS HUB】お振込確認完了 - ${p.productName}（${p.invoiceNumber}）`,
    html: baseTemplate('入金確認', content),
  }
}

// ================================================================
// 17. 発送依頼（出品者向け）— 銀行振込の入金確認後
// ================================================================
export function shippingRequestSeller(p: {
  sellerName: string; productName: string; amount: number;
  buyerName: string; invoiceNumber: string; transactionId: number;
  buyerPostalCode?: string; buyerAddress?: string; buyerPhone?: string
}) {
  const amt = p.amount.toLocaleString('ja-JP')
  const url = `${SITE_URL}/transactions/${p.transactionId}`
  const shippingRows: string[] = []
  if (p.buyerName) shippingRows.push(infoRow('お届け先名', p.buyerName))
  if (p.buyerPostalCode) shippingRows.push(infoRow('郵便番号', `〒${p.buyerPostalCode}`))
  if (p.buyerAddress) shippingRows.push(infoRow('住所', p.buyerAddress))
  if (p.buyerPhone) shippingRows.push(infoRow('電話番号', p.buyerPhone))

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">発送をお願いします</h2>
    <p>${p.sellerName} 様</p>
    <p>以下の注文のお振込が確認されました。<br>
    <strong style="color:#dc2626;">できるだけ早く発送準備をお願いします。</strong></p>
    ${infoBox([
      infoRow('商品名', p.productName),
      infoRow('販売価格', `¥${amt}`),
      infoRow('購入者', p.buyerName),
      infoRow('請求書番号', p.invoiceNumber),
      infoRow('決済状況', '<span style="color:#16a34a;font-weight:700;">入金確認済み</span>'),
    ])}
    ${shippingRows.length > 0 ? `
    <div style="background:#f8f9fa;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#1e40af;"><i class="fas fa-truck" style="margin-right:6px;"></i>配送先情報</p>
      ${shippingRows.join('')}
    </div>` : ''}
    <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:800;font-size:15px;color:#c2410c;">発送手順</p>
      <ol style="font-size:14px;padding-left:20px;margin:0;color:#333;">
        <li style="margin-bottom:4px;">商品の梱包を行ってください</li>
        <li style="margin-bottom:4px;">配送業者に依頼して発送してください</li>
        <li style="margin-bottom:4px;">発送完了後、<a href="${url}" style="color:#ef4444;font-weight:600;">取引ページ</a>で「発送済み」に更新してください</li>
      </ol>
      <p style="margin:8px 0 0;font-size:13px;color:#9a3412;">※ 追跡番号がある場合は取引ページに入力してください。購入者に自動通知されます。</p>
    </div>
    ${actionButton('取引ページで発送手続きをする', url)}
  `
  return {
    subject: `【PARTS HUB】【発送依頼】入金確認済み - ${p.productName}（${p.invoiceNumber}）`,
    html: baseTemplate('発送依頼', content),
  }
}

export function passwordReset(p: { userName: string; resetCode: string; resetUrl: string }) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111;">パスワードリセット</h2>
    <p>${p.userName} 様</p>
    <p>パスワードのリセットが要求されました。<br>以下のリセットコードを入力して、新しいパスワードを設定してください。</p>
    
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#f8f9fa;border:2px dashed #ef4444;border-radius:12px;padding:20px 40px;">
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;">リセットコード</p>
        <p style="margin:0;font-size:36px;font-weight:800;color:#ef4444;letter-spacing:8px;">${p.resetCode}</p>
      </div>
    </div>

    ${infoBox([infoRow('有効期限', '30分')])}
    ${actionButton('パスワードをリセットする', p.resetUrl)}
    <p style="font-size:13px;color:#6b7280;">このリクエストに心当たりがない場合は、このメールを無視してください。</p>
  `
  return {
    subject: '【PARTS HUB】パスワードリセットコード',
    html: baseTemplate('パスワードリセット', content),
  }
}
