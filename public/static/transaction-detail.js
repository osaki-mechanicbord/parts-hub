/**
 * 取引詳細ページ（認証付き）- 発送フロー改善版
 */

const pathParts = window.location.pathname.split('/');
const transactionId = pathParts[pathParts.length - 1];

let transactionData = null;
let currentUserId = null;

// 配送業者と追跡URL定義
const CARRIERS = [
  { value: 'ヤマト運輸', label: 'ヤマト運輸', trackUrl: (n) => `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${n.replace(/[-\s]/g, '')}` },
  { value: '佐川急便', label: '佐川急便', trackUrl: (n) => `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${n.replace(/[-\s]/g, '')}` },
  { value: '日本郵便', label: '日本郵便', trackUrl: (n) => `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${n.replace(/[-\s]/g, '')}` },
  { value: '西濃運輸', label: '西濃運輸', trackUrl: (n) => `https://track.seino.co.jp/kamotsu/GempyoNoShoworiBin.do?gnpNo1=${n.replace(/[-\s]/g, '')}` },
  { value: '福山通運', label: '福山通運', trackUrl: (n) => `https://corp.fukutsu.co.jp/situation/tracking_no_hunt/${n.replace(/[-\s]/g, '')}` },
  { value: 'その他', label: 'その他', trackUrl: null },
];

function getTrackingUrl(carrier, number) {
  if (!carrier || !number) return null;
  const c = CARRIERS.find(x => x.value === carrier);
  return c && c.trackUrl ? c.trackUrl(number) : null;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return { headers: { 'Authorization': 'Bearer ' + token } };
}

document.addEventListener('DOMContentLoaded', async () => {
  const auth = getAuthHeaders();
  if (!auth) { showLoginRequired(); return; }

  try {
    const meRes = await axios.get('/api/auth/me', auth);
    if (meRes.data.success && meRes.data.user) {
      currentUserId = meRes.data.user.id;
    } else {
      showLoginRequired(); return;
    }
  } catch (e) {
    if (e?.response?.status === 401) localStorage.removeItem('token');
    showLoginRequired(); return;
  }

  loadTransaction();
});

function showLoginRequired() {
  document.getElementById('main-content').innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-lock text-gray-300 text-6xl mb-4"></i>
      <p class="text-lg font-semibold text-gray-700 mb-4">取引詳細を表示するにはログインが必要です</p>
      <a href="/login?redirect=${encodeURIComponent(window.location.pathname)}" 
         class="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-colors">
        <i class="fas fa-sign-in-alt mr-2"></i>ログイン
      </a>
    </div>
  `;
}

async function loadTransaction() {
  const auth = getAuthHeaders();
  if (!auth) { showLoginRequired(); return; }

  try {
    const response = await axios.get(`/api/transactions/${transactionId}`, auth);
    if (response.data.success) {
      transactionData = response.data.data;
      renderTransaction();
    } else {
      throw new Error(response.data.error || '取引情報の取得に失敗しました');
    }
  } catch (error) {
    console.error('Failed to load transaction:', error);
    const msg = error?.response?.status === 403 
      ? 'この取引へのアクセス権限がありません' 
      : error?.response?.status === 401
      ? 'ログインセッションが切れました'
      : (error.message || '取引情報の読み込みに失敗しました');
    document.getElementById('main-content').innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-circle text-red-400 text-6xl mb-4"></i>
        <p class="text-lg font-semibold text-gray-700 mb-2">${msg}</p>
        <a href="/mypage" class="text-red-500 hover:text-red-600 font-semibold mt-4 inline-block">
          <i class="fas fa-arrow-left mr-1"></i>マイページに戻る
        </a>
      </div>
    `;
  }
}

function renderTransaction() {
  const isBuyer = transactionData.buyer_id === currentUserId;
  const isSeller = transactionData.seller_id === currentUserId;
  const amount = Number(transactionData.amount || transactionData.product_price || 0);
  const fee = Number(transactionData.fee || 0);
  const status = transactionData.status;

  document.getElementById('main-content').innerHTML = `
    <!-- ステータスバナー -->
    ${renderStatusBanner(status, isBuyer, isSeller)}

    <!-- 商品情報 -->
    <div class="bg-white rounded-xl shadow-sm p-5">
      <div class="flex items-start gap-4">
        <div class="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          <img src="${getProductImageUrl(transactionData.product_image)}" 
               alt="${escapeHtml(transactionData.product_title)}" 
               class="w-full h-full object-cover"
               onerror="this.onerror=null; this.src='https://placehold.co/200x200/e2e8f0/64748b?text=No+Image';">
        </div>
        <div class="flex-1 min-w-0 py-1">
          <h3 class="font-bold text-base text-gray-900 leading-snug line-clamp-2">${escapeHtml(transactionData.product_title)}</h3>
          <div class="text-xl font-bold text-red-500 mt-1.5">¥${formatPrice(amount)}</div>
          ${fee > 0 ? `<div class="text-xs text-gray-400">（手数料 ¥${formatPrice(fee)}込み）</div>` : ''}
          <div class="text-xs text-gray-500 mt-1">注文 #${transactionData.id} ・ ${formatDate(transactionData.created_at)}</div>
        </div>
      </div>
    </div>

    <!-- ステータスタイムライン -->
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h2 class="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
        <i class="fas fa-route mr-1"></i>取引の進行状況
      </h2>
      ${renderStatusTimeline()}
    </div>

    <!-- 配送情報（発送済み以降表示） -->
    ${renderShippingInfo(isBuyer, isSeller)}

    <!-- 配送先住所（出品者に表示） -->
    ${renderShippingAddress(isSeller)}

    <!-- 取引相手情報 -->
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h2 class="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
        <i class="fas fa-user mr-1"></i>${isBuyer ? '出品者' : '購入者'}情報
      </h2>
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-building text-gray-400 w-5 text-center"></i>
          <span class="font-semibold text-gray-800">${isBuyer ? transactionData.seller_name : transactionData.buyer_name}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-envelope text-gray-400 w-5 text-center"></i>
          <span class="text-gray-700">${isBuyer ? (transactionData.seller_email || '-') : (transactionData.buyer_email || '-')}</span>
        </div>
        ${(isBuyer ? transactionData.seller_phone : transactionData.buyer_phone) ? `
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-phone text-gray-400 w-5 text-center"></i>
          <a href="tel:${isBuyer ? transactionData.seller_phone : transactionData.buyer_phone}" class="text-blue-600">${isBuyer ? transactionData.seller_phone : transactionData.buyer_phone}</a>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- アクションボタン -->
    ${renderActionButtons(isBuyer, isSeller)}
  `;
}

// ステータスバナー
function renderStatusBanner(status, isBuyer, isSeller) {
  const banners = {
    pending: isBuyer 
      ? { bg: 'bg-yellow-50 border-yellow-300', icon: 'fa-credit-card text-yellow-500', title: 'お支払いが完了していません', desc: '決済が中断されたか、カード情報の入力が完了していません。「支払いをやり直す」ボタンからお支払いをお願いします。' }
      : { bg: 'bg-yellow-50 border-yellow-300', icon: 'fa-clock text-yellow-500', title: '注文受付中', desc: '購入者のお支払いをお待ちしています。' },
    paid: isSeller 
      ? { bg: 'bg-orange-50 border-orange-300', icon: 'fa-box text-orange-500', title: '発送をお願いします', desc: '購入者がお支払いを完了しました。できるだけ早く発送してください。' }
      : { bg: 'bg-blue-50 border-blue-300', icon: 'fa-credit-card text-blue-500', title: 'お支払い完了', desc: '出品者が発送準備を進めています。しばらくお待ちください。' },
    shipped: isBuyer
      ? { bg: 'bg-indigo-50 border-indigo-300', icon: 'fa-truck text-indigo-500', title: '商品が発送されました', desc: '商品到着後「受取完了」ボタンを押してください。' }
      : { bg: 'bg-indigo-50 border-indigo-300', icon: 'fa-truck text-indigo-500', title: '発送済み', desc: '購入者の受取確認をお待ちください。' },
    completed: { bg: 'bg-green-50 border-green-300', icon: 'fa-check-circle text-green-500', title: '取引完了', desc: 'お取引いただきありがとうございました。' },
    cancelled: { bg: 'bg-red-50 border-red-300', icon: 'fa-times-circle text-red-500', title: '取引キャンセル', desc: 'この取引はキャンセルされました。' },
  };
  const b = banners[status] || banners.pending;
  return `
    <div class="${b.bg} border-l-4 rounded-r-xl p-4 flex items-start gap-3">
      <i class="fas ${b.icon} text-2xl mt-0.5 flex-shrink-0"></i>
      <div>
        <div class="font-bold text-gray-900">${b.title}</div>
        <div class="text-sm text-gray-600 mt-0.5">${b.desc}</div>
      </div>
    </div>
  `;
}

// ステータスタイムライン（横型コンパクト）
function renderStatusTimeline() {
  const steps = [
    { key: 'pending', label: '注文', icon: 'fa-shopping-cart', date: transactionData.created_at },
    { key: 'paid', label: '支払い', icon: 'fa-credit-card', date: transactionData.paid_at },
    { key: 'shipped', label: '発送', icon: 'fa-truck', date: transactionData.shipped_at },
    { key: 'completed', label: '完了', icon: 'fa-check-circle', date: transactionData.completed_at },
  ];

  if (transactionData.status === 'cancelled') {
    return `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <i class="fas fa-times-circle text-red-500 text-3xl mb-2"></i>
        <div class="font-bold text-red-700">この取引はキャンセルされました</div>
        ${transactionData.cancelled_at ? `<div class="text-sm text-red-500 mt-1">${formatDateTime(transactionData.cancelled_at)}</div>` : ''}
      </div>
    `;
  }

  const currentIdx = steps.findIndex(s => s.key === transactionData.status);

  return `
    <div class="flex items-center justify-between">
      ${steps.map((step, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const isLast = i === steps.length - 1;
        return `
          <div class="flex flex-col items-center flex-1 relative">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm ${
              isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
            } ${isCurrent ? 'ring-4 ring-green-200' : ''}">
              <i class="fas ${step.icon}"></i>
            </div>
            <div class="text-xs font-semibold mt-1.5 ${isActive ? 'text-gray-900' : 'text-gray-400'}">${step.label}</div>
            ${step.date ? `<div class="text-[10px] text-gray-400 mt-0.5">${formatShortDate(step.date)}</div>` : ''}
          </div>
          ${!isLast ? `<div class="flex-1 h-0.5 -mt-6 mx-1 ${i < currentIdx ? 'bg-green-500' : 'bg-gray-200'}"></div>` : ''}
        `;
      }).join('')}
    </div>
  `;
}

// 配送情報
function renderShippingInfo(isBuyer, isSeller) {
  const status = transactionData.status;
  // 発送済み or 完了の場合のみ表示
  if (status !== 'shipped' && status !== 'completed') return '';

  const carrier = transactionData.shipping_carrier;
  const trackNum = transactionData.tracking_number;
  const note = transactionData.shipping_note;
  const shippedAt = transactionData.shipped_at;
  const trackUrl = getTrackingUrl(carrier, trackNum);

  return `
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h2 class="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
        <i class="fas fa-truck mr-1 text-blue-500"></i>配送情報
      </h2>
      <div class="space-y-3">
        ${shippedAt ? `
        <div class="flex items-center text-sm">
          <span class="text-gray-500 w-24 flex-shrink-0">発送日時</span>
          <span class="font-semibold text-gray-800">${formatDateTime(shippedAt)}</span>
        </div>
        ` : ''}
        ${carrier ? `
        <div class="flex items-center text-sm">
          <span class="text-gray-500 w-24 flex-shrink-0">配送業者</span>
          <span class="font-semibold text-gray-800">${carrier}</span>
        </div>
        ` : ''}
        ${trackNum ? `
        <div class="flex items-center text-sm">
          <span class="text-gray-500 w-24 flex-shrink-0">追跡番号</span>
          <span class="font-mono font-bold text-lg text-blue-600">${trackNum}</span>
        </div>
        ${trackUrl ? (status === 'completed' ? `
        <div class="flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 text-gray-400 font-semibold py-3 px-4 rounded-lg text-sm cursor-not-allowed">
          <i class="fas fa-external-link-alt"></i>
          ${carrier || '配送業者'}のサイトで追跡する
          <span class="text-xs">（取引完了済み）</span>
        </div>
        ` : `
        <a href="${trackUrl}" target="_blank" rel="noopener" 
           class="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold py-3 px-4 rounded-lg transition-colors text-sm">
          <i class="fas fa-external-link-alt"></i>
          ${carrier || '配送業者'}のサイトで追跡する
        </a>
        `) : ''}
        ` : `
        <div class="flex items-center text-sm">
          <span class="text-gray-500 w-24 flex-shrink-0">追跡番号</span>
          <span class="text-gray-400 italic">未登録</span>
        </div>
        `}
        ${note ? `
        <div class="bg-gray-50 rounded-lg p-3 mt-2">
          <div class="text-xs text-gray-500 mb-1"><i class="fas fa-sticky-note mr-1"></i>出品者メモ</div>
          <div class="text-sm text-gray-700">${escapeHtml(note)}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

// 配送先住所（出品者用）
function renderShippingAddress(isSeller) {
  if (!isSeller) return '';
  const status = transactionData.status;
  // 支払い完了〜完了まで表示
  if (status !== 'paid' && status !== 'shipped' && status !== 'completed') return '';

  const addr = transactionData.shipping_address_info;
  if (!addr || (!addr.address && !addr.postal_code)) {
    return `
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
        <h2 class="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
          <i class="fas fa-map-marker-alt mr-1 text-yellow-500"></i>配送先
        </h2>
        <p class="text-sm text-yellow-700">
          <i class="fas fa-exclamation-triangle mr-1"></i>
          購入者の住所が登録されていません。チャットまたは連絡先から直接確認してください。
        </p>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h2 class="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
        <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>配送先住所
      </h2>
      <div class="bg-gray-50 rounded-lg p-4 space-y-2">
        ${addr.name ? `<div class="font-bold text-gray-900 text-base">${escapeHtml(addr.name)} 様</div>` : ''}
        ${addr.postal_code ? `<div class="text-sm text-gray-600">〒${escapeHtml(addr.postal_code)}</div>` : ''}
        ${addr.address ? `<div class="text-sm text-gray-800">${escapeHtml(addr.address)}</div>` : ''}
        ${addr.phone ? `
        <div class="flex items-center gap-2 text-sm mt-1">
          <i class="fas fa-phone text-gray-400"></i>
          <a href="tel:${addr.phone}" class="text-blue-600 font-semibold">${escapeHtml(addr.phone)}</a>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

// アクションボタン
function renderActionButtons(isBuyer, isSeller) {
  let buttons = [];
  const status = transactionData.status;

  // 購入者: pending状態で再支払いボタン表示
  if (isBuyer && status === 'pending') {
    buttons.push(`
      <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5">
        <h3 class="font-bold text-yellow-800 mb-2"><i class="fas fa-credit-card mr-1"></i>お支払いが完了していません</h3>
        <p class="text-sm text-yellow-700 mb-4">決済が中断されたか、カード情報の入力が完了していません。<br>下のボタンから再度お支払い手続きを行ってください。</p>
        <button onclick="retryPayment()" id="retry-payment-btn" class="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]">
          <i class="fas fa-redo mr-2"></i>支払いをやり直す
        </button>
        <p class="text-xs text-gray-400 mt-3 text-center">
          <i class="fas fa-info-circle mr-1"></i>Stripeの安全な決済ページに移動します
        </p>
      </div>
    `);
  }

  // 出品者: 支払い完了後に「発送完了を報告」
  if (isSeller && status === 'paid') {
    buttons.push(`
      <div class="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
        <h3 class="font-bold text-orange-800 mb-2"><i class="fas fa-box-open mr-1"></i>発送手続き</h3>
        <p class="text-sm text-orange-700 mb-4">商品を梱包・発送後、以下のボタンから発送情報を登録してください。</p>
        <button onclick="showShippingModal()" class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]">
          <i class="fas fa-truck mr-2"></i>発送完了を報告する
        </button>
      </div>
    `);
  }

  // 購入者: 発送済み後に「受取完了」
  if (isBuyer && status === 'shipped') {
    buttons.push(`
      <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5">
        <h3 class="font-bold text-green-800 mb-2"><i class="fas fa-hand-holding-box mr-1"></i>商品到着の確認</h3>
        <p class="text-sm text-green-700 mb-4">商品が届いたら、内容を確認して「受取完了」を押してください。</p>
        <button onclick="completeTransaction()" class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]">
          <i class="fas fa-check-circle mr-2"></i>受取完了
        </button>
      </div>
    `);
  }

  // 購入者: 取引完了後にレビュー（まだレビューしていない場合のみ）
  if (isBuyer && status === 'completed' && !transactionData.has_my_review) {
    buttons.push(`
      <button onclick="window.location.href='/reviews/new?transaction=${transactionId}'" class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]">
        <i class="fas fa-star mr-2"></i>レビューを書く
      </button>
    `);
  }

  // 出品者: 取引完了後にレビュー（まだレビューしていない場合のみ）
  if (isSeller && status === 'completed' && !transactionData.has_my_review) {
    buttons.push(`
      <button onclick="window.location.href='/reviews/new?transaction=${transactionId}'" class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]">
        <i class="fas fa-star mr-2"></i>レビューを書く
      </button>
    `);
  }

  // レビュー投稿済みの場合は完了メッセージ表示
  if (status === 'completed' && transactionData.has_my_review) {
    buttons.push(`
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <i class="fas fa-check-circle text-green-500 mr-2"></i>
        <span class="text-sm text-gray-600 font-semibold">レビュー投稿済み</span>
      </div>
    `);
  }

  if (buttons.length === 0) return '';

  return `<div class="space-y-4">${buttons.join('')}</div>`;
}

// ==== 発送モーダル（改善版） ====
function showShippingModal() {
  const modal = `
    <div id="shipping-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onclick="if(event.target.id === 'shipping-modal') closeShippingModal()">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp">
        <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 class="text-lg font-bold text-gray-900"><i class="fas fa-truck mr-2 text-blue-500"></i>発送情報の入力</h3>
          <button onclick="closeShippingModal()" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="p-6 space-y-5">
          <!-- 配送業者 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-building mr-1 text-gray-400"></i>配送業者 <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2" id="carrier-grid">
              ${CARRIERS.map(c => `
                <button type="button" onclick="selectCarrier('${c.value}')" 
                        class="carrier-btn border-2 border-gray-200 rounded-lg py-3 px-3 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                        data-carrier="${c.value}">
                  ${c.label}
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="selected-carrier" value="">
          </div>

          <!-- 追跡番号 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-barcode mr-1 text-gray-400"></i>追跡番号
            </label>
            <input type="text" id="tracking-number-input" 
                   class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-mono transition-colors" 
                   placeholder="1234-5678-9012"
                   inputmode="numeric">
            <p class="text-xs text-gray-400 mt-1">配送業者の追跡番号を入力すると、購入者に自動リンクが提供されます</p>
          </div>

          <!-- メモ -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-sticky-note mr-1 text-gray-400"></i>備考・メモ（任意）
            </label>
            <textarea id="shipping-note-input" 
                      class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none transition-colors" 
                      rows="2"
                      placeholder="例: 明日到着予定です / 段ボール2箱でお送りします"></textarea>
          </div>

          <!-- 確認メッセージ -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800">
              <i class="fas fa-info-circle mr-1"></i>
              発送報告すると、購入者にメールとアプリ内通知で配送情報がお知らせされます。
            </p>
          </div>

          <!-- ボタン -->
          <div class="flex gap-3 pt-2">
            <button onclick="closeShippingModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-semibold transition-colors">
              キャンセル
            </button>
            <button onclick="submitShipping()" id="submit-shipping-btn" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3.5 px-4 rounded-xl font-bold transition-colors shadow-md">
              <i class="fas fa-paper-plane mr-1"></i>発送完了を報告
            </button>
          </div>
        </div>
      </div>
    </div>
    <style>
      @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .animate-slideUp { animation: slideUp 0.3s ease-out; }
    </style>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

function selectCarrier(value) {
  document.getElementById('selected-carrier').value = value;
  document.querySelectorAll('.carrier-btn').forEach(btn => {
    if (btn.dataset.carrier === value) {
      btn.classList.remove('border-gray-200', 'text-gray-700');
      btn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
    } else {
      btn.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-700');
      btn.classList.add('border-gray-200', 'text-gray-700');
    }
  });
}

function closeShippingModal() {
  const modal = document.getElementById('shipping-modal');
  if (modal) modal.remove();
}

async function submitShipping() {
  const carrier = document.getElementById('selected-carrier').value;
  const trackingNumber = document.getElementById('tracking-number-input').value.trim();
  const shippingNote = document.getElementById('shipping-note-input').value.trim();
  const btn = document.getElementById('submit-shipping-btn');
  const auth = getAuthHeaders();
  if (!auth) { alert('ログインが必要です'); return; }

  if (!carrier) {
    alert('配送業者を選択してください。');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>送信中...';

  try {
    const response = await axios.put(`/api/transactions/${transactionId}/status`, {
      status: 'shipped',
      tracking_number: trackingNumber || null,
      shipping_carrier: carrier,
      shipping_note: shippingNote || null,
    }, auth);

    if (response.data.success) {
      closeShippingModal();
      showToast('発送完了を報告しました！購入者に通知されます。', 'success');
      loadTransaction();
    } else {
      throw new Error(response.data.error || '発送報告に失敗しました');
    }
  } catch (error) {
    console.error('Failed to submit shipping:', error);
    alert(error?.response?.data?.error || error.message || '発送報告に失敗しました');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i>発送完了を報告';
  }
}

// 取引完了
let isCompletingTransaction = false;

// ==== 再支払い機能 ====
async function retryPayment() {
  const btn = document.getElementById('retry-payment-btn');
  if (!btn) return;
  
  const auth = getAuthHeaders();
  if (!auth) { 
    alert('ログインが必要です。ログインページに移動します。');
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    return; 
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>決済ページを準備中...';

  try {
    const response = await axios.post('/api/payment/retry-checkout', {
      transaction_id: parseInt(transactionId)
    }, auth);

    if (response.data.success) {
      if (response.data.already_paid) {
        // 既に支払い済みだった
        showToast('既にお支払いが完了しています。ページを更新します。', 'success');
        setTimeout(() => loadTransaction(), 1500);
        return;
      }
      
      if (response.data.session_url) {
        // Stripeの決済ページにリダイレクト
        window.location.href = response.data.session_url;
      } else {
        throw new Error('決済URLが取得できませんでした');
      }
    } else {
      throw new Error(response.data.error || '再決済の準備に失敗しました');
    }
  } catch (error) {
    console.error('Retry payment error:', error);
    
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      alert('ログインセッションが切れました。再度ログインしてください。');
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    const errorMsg = error?.response?.data?.error || error.message || '再決済の準備に失敗しました';
    alert(errorMsg);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-redo mr-2"></i>支払いをやり直す';
  }
}

async function completeTransaction() {
  if (isCompletingTransaction) return;
  if (!confirm('商品を受け取りましたか？\n\n受取完了を確認すると取引が完了します。\n問題がある場合は先に出品者にご連絡ください。')) return;

  isCompletingTransaction = true;
  // ボタンを即座に無効化
  const btn = document.querySelector('[onclick="completeTransaction()"]');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>処理中...';
  }

  const auth = getAuthHeaders();
  if (!auth) { alert('ログインが必要です'); isCompletingTransaction = false; return; }

  try {
    const response = await axios.post(`/api/payment/transaction/${transactionId}/complete`, {}, auth);
    if (response.data.success) {
      showToast('取引が完了しました！レビューをお願いします。', 'success');
      loadTransaction();
    } else {
      throw new Error(response.data.error || '取引完了に失敗しました');
    }
  } catch (error) {
    console.error('Failed to complete transaction:', error);
    alert(error?.response?.data?.error || error.message || '取引完了に失敗しました');
    isCompletingTransaction = false;
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>受取完了';
    }
  }
}

// トースト通知
function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };
  const toast = document.createElement('div');
  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 ${colors[type] || colors.info} text-white px-6 py-3 rounded-xl shadow-2xl z-[100] text-sm font-semibold flex items-center gap-2 animate-slideDown`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>${message}`;
  document.body.appendChild(toast);
  
  const style = document.createElement('style');
  style.textContent = '@keyframes slideDown { from { transform: translateX(-50%) translateY(-100%); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } } .animate-slideDown { animation: slideDown 0.3s ease-out; }';
  document.head.appendChild(style);
  
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ユーティリティ
function formatPrice(price) {
  return new Intl.NumberFormat('ja-JP').format(price);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatShortDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 商品画像URLを正規化（R2キー → /r2/ パス、完全URL → そのまま）
function getProductImageUrl(imageUrl) {
  if (!imageUrl) return 'https://placehold.co/200x200/e2e8f0/64748b?text=No+Image';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/r2/') || imageUrl.startsWith('/')) return imageUrl;
  return '/r2/' + imageUrl;
}
