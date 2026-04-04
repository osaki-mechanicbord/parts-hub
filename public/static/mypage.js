/**
 * マイページ - フリマサイト完全機能実装
 * 機能: 出品管理、売上管理、購入履歴、お気に入り、値下げ交渉
 */

// ユーザーID（ログインから動的取得）
let currentUserId = null;
let token = null;

// グローバル状態
let userData = null;
let statsData = null;
let listingsData = [];
let purchasesData = [];
let favoritesData = [];
let negotiationsReceivedData = [];
let negotiationsSentData = [];
let salesHistoryData = [];
let activeTransactionsData = [];
let txFilter = 'all';

function getAuthHeaders() {
    return { headers: { 'Authorization': 'Bearer ' + token } };
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?redirect=' + encodeURIComponent('/mypage');
        return;
    }

    // ログインユーザー情報を取得
    try {
        const res = await axios.get('/api/auth/me', getAuthHeaders());
        if (res.data.success) {
            userData = res.data.user || res.data.data;
            currentUserId = userData.id;
            
            // ユーザー名を即座に表示
            const shopNameEl = document.getElementById('user-shop-name');
            if (shopNameEl) {
                shopNameEl.textContent = userData.company_name || userData.nickname || userData.name || 'マイショップ';
            }
            const shopTypeEl = document.getElementById('user-shop-type');
            if (shopTypeEl) {
                shopTypeEl.textContent = getShopTypeLabel(userData.shop_type);
            }
        } else {
            throw new Error('auth failed');
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        // 401の場合のみトークンを削除（ネットワークエラー等では保持）
        if (e?.response?.status === 401) {
            localStorage.removeItem('token');
        }
        window.location.href = '/login?redirect=' + encodeURIComponent('/mypage');
        return;
    }

    loadUserStats();
    showTab('transactions');
});

function getShopTypeLabel(type) {
    const labels = {
        'factory': '整備工場',
        'dealer': 'ディーラー',
        'parts_shop': 'パーツショップ',
        'recycler': 'リサイクルショップ',
        'scrapyard': '解体業者',
        'individual': '個人'
    };
    return labels[type] || type || '個人';
}

// ユーザー統計情報を読み込み
async function loadUserStats() {
    try {
        const response = await axios.get(`/api/mypage/stats/${currentUserId}`, getAuthHeaders());
        
        if (response.data.success) {
            statsData = response.data.data;
            renderUserStats();
        }
    } catch (error) {
        console.error('Failed to load user stats:', error);
    }
}

// ユーザー統計情報を表示
function renderUserStats() {
    const el = (id) => document.getElementById(id);
    
    // shop_name: statsDataの値を優先的に使い、なければuserDataの値を維持
    if (el('user-shop-name') && statsData.shop_name) {
        el('user-shop-name').textContent = statsData.shop_name;
    }
    // shop_type: statsDataから取得して表示（カテゴリ選択結果を反映）
    if (el('user-shop-type') && statsData.shop_type) {
        el('user-shop-type').textContent = getShopTypeLabel(statsData.shop_type);
    }
    if (el('user-rating')) el('user-rating').textContent = statsData.average_rating || '0.0';
    if (el('review-count')) el('review-count').textContent = statsData.review_count || '0';
    if (el('listing-count')) el('listing-count').textContent = statsData.listing_count || '0';
    if (el('total-sales')) el('total-sales').textContent = formatPrice(statsData.total_sales || 0);
    if (el('withdrawable')) el('withdrawable').textContent = formatPrice(statsData.withdrawable_amount || 0);
    if (el('sold-count')) el('sold-count').textContent = statsData.sold_count || '0';
    if (el('purchase-count')) el('purchase-count').textContent = statsData.purchase_count || '0';
    if (el('withdrawable-detail')) el('withdrawable-detail').textContent = formatPrice(statsData.withdrawable_amount || 0);
    
    // 進行中取引
    if (el('active-tx-count')) el('active-tx-count').textContent = statsData.active_transaction_count || '0';
    const actionCount = statsData.action_required_count || 0;
    if (actionCount > 0) {
        if (el('action-required-line')) el('action-required-line').classList.remove('hidden');
        if (el('action-required-count')) el('action-required-count').textContent = actionCount;
        // タブにバッジ表示
        const txBadge = document.getElementById('tx-action-badge');
        if (txBadge) {
            txBadge.textContent = actionCount > 9 ? '9+' : actionCount;
            txBadge.classList.remove('hidden');
        }
    }

    // 通知バッジ
    const unreadCount = statsData.unread_notifications || 0;
    if (unreadCount > 0) {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        }
    }
}

// タブ切り替え
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-red-500', 'border-red-500');
        btn.classList.add('text-gray-600', 'border-transparent');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600', 'border-transparent');
        activeBtn.classList.add('text-red-500', 'border-red-500');
    }
    
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    switch(tabName) {
        case 'transactions': loadActiveTransactions(); break;
        case 'listings': loadListings(); break;
        case 'sales': loadSalesData(); break;
        case 'purchases': loadPurchases(); break;
        case 'favorites': loadFavorites(); break;
        case 'negotiations': loadNegotiations('received'); break;
    }
}

// ==== 【取引管理】進行中の取引 ====
async function loadActiveTransactions() {
    try {
        const response = await axios.get(`/api/mypage/active-transactions/${currentUserId}`, getAuthHeaders());
        if (response.data.success) {
            activeTransactionsData = response.data.data || [];
            renderActiveTransactions();
        }
    } catch (error) {
        console.error('Failed to load active transactions:', error);
        document.getElementById('transactions-container').innerHTML =
            '<div class="text-center py-8 text-gray-500">取引情報の読み込みに失敗しました</div>';
    }
}

function filterTransactions(value) {
    txFilter = value;
    renderActiveTransactions();
}

function renderActiveTransactions() {
    const container = document.getElementById('transactions-container');
    const banner = document.getElementById('tx-action-required-banner');
    const bannerText = document.getElementById('tx-action-required-text');

    // フィルタ適用
    let filtered = activeTransactionsData;
    if (txFilter === 'action') {
        filtered = filtered.filter(t =>
            (t.is_seller && t.status === 'paid') ||
            (t.is_buyer && t.status === 'shipped')
        );
    } else if (txFilter !== 'all') {
        filtered = filtered.filter(t => t.status === txFilter);
    }

    // 要対応カウント
    const actionItems = activeTransactionsData.filter(t =>
        (t.is_seller && t.status === 'paid') ||
        (t.is_buyer && t.status === 'shipped')
    );
    if (actionItems.length > 0 && banner) {
        banner.classList.remove('hidden');
        bannerText.textContent = `${actionItems.length}件の対応が必要な取引があります`;
    } else if (banner) {
        banner.classList.add('hidden');
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-handshake text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500">${txFilter === 'all' ? '進行中の取引がありません' : '該当する取引がありません'}</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(tx => renderTransactionCard(tx)).join('');
}

function renderTransactionCard(tx) {
    const isBuyer = tx.is_buyer;
    const isSeller = tx.is_seller;
    const todo = getTodoForTransaction(tx);
    const statusInfo = getTxStatusInfo(tx.status);
    const amount = Number(tx.amount || 0);
    const counterpart = isBuyer ? tx.seller_name : tx.buyer_name;
    const roleLabel = isBuyer ? '購入' : '出品';
    const roleBg = isBuyer ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';

    return `
    <div class="bg-white border ${todo.urgent ? 'border-red-300 shadow-md' : 'border-gray-200'} rounded-xl overflow-hidden">
        <!-- ヘッダー: 商品情報 -->
        <div class="p-4 flex items-start gap-3">
            <img src="${tx.product_image || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}"
                 alt="${tx.product_title}"
                 class="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                 onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${roleBg}">${roleLabel}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bgClass}">
                        <i class="fas ${statusInfo.icon} mr-1"></i>${statusInfo.text}
                    </span>
                </div>
                <h4 class="font-semibold text-gray-900 text-sm truncate">${tx.product_title}</h4>
                <div class="flex items-center gap-3 mt-1">
                    <span class="text-red-500 font-bold">¥${formatPrice(amount)}</span>
                    <span class="text-xs text-gray-400"><i class="fas fa-user mr-1"></i>${counterpart || '不明'}</span>
                </div>
            </div>
        </div>

        <!-- TODO: やることリスト -->
        ${todo.html}

        <!-- 配送情報（発送済みの場合） -->
        ${tx.status === 'shipped' || tx.status === 'completed' ? renderTxShippingBrief(tx) : ''}

        <!-- アクション -->
        <div class="px-4 pb-3 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span class="text-[10px] text-gray-400">#${tx.transaction_id} ・ ${formatDate(tx.created_at)}</span>
            <a href="/transactions/${tx.transaction_id}" class="text-sm text-blue-600 hover:underline font-semibold">
                詳細 <i class="fas fa-chevron-right ml-0.5 text-xs"></i>
            </a>
        </div>
    </div>`;
}

function getTxStatusInfo(status) {
    const map = {
        'pending': { text: '支払い待ち', icon: 'fa-clock', bgClass: 'bg-yellow-100 text-yellow-700' },
        'paid':    { text: '発送待ち',   icon: 'fa-box',   bgClass: 'bg-orange-100 text-orange-700' },
        'shipped': { text: '配送中',     icon: 'fa-truck',  bgClass: 'bg-indigo-100 text-indigo-700' },
        'completed':{ text: '取引完了',  icon: 'fa-check-circle', bgClass: 'bg-green-100 text-green-700' },
        'cancelled':{ text: 'キャンセル',icon: 'fa-times-circle', bgClass: 'bg-red-100 text-red-700' },
    };
    return map[status] || map['pending'];
}

function getTodoForTransaction(tx) {
    const isBuyer = tx.is_buyer;
    const isSeller = tx.is_seller;
    let items = [];
    let urgent = false;

    if (tx.status === 'pending') {
        if (isBuyer) {
            items.push({ icon: 'fa-credit-card', color: 'text-yellow-500', text: 'お支払いを完了してください', done: false, urgent: true, action: 'retry_payment', txId: tx.transaction_id });
        } else {
            items.push({ icon: 'fa-clock', color: 'text-gray-400', text: '購入者のお支払いをお待ちください', done: false, urgent: false });
        }
    }

    if (tx.status === 'paid') {
        items.push({ icon: 'fa-credit-card', color: 'text-green-500', text: 'お支払い完了', done: true, urgent: false });
        if (isSeller) {
            items.push({ icon: 'fa-box-open', color: 'text-orange-500', text: '商品を梱包・発送してください', done: false, urgent: true, action: 'ship', txId: tx.transaction_id });
            urgent = true;
        } else {
            items.push({ icon: 'fa-clock', color: 'text-gray-400', text: '出品者の発送をお待ちください', done: false, urgent: false });
        }
    }

    if (tx.status === 'shipped') {
        items.push({ icon: 'fa-credit-card', color: 'text-green-500', text: 'お支払い完了', done: true, urgent: false });
        items.push({ icon: 'fa-truck', color: 'text-green-500', text: '発送完了', done: true, urgent: false });
        if (isBuyer) {
            items.push({ icon: 'fa-hand-holding-box', color: 'text-indigo-500', text: '商品到着後「受取完了」を押してください', done: false, urgent: true, action: 'receive', txId: tx.transaction_id });
            urgent = true;
        } else {
            items.push({ icon: 'fa-clock', color: 'text-gray-400', text: '購入者の受取確認をお待ちください', done: false, urgent: false });
        }
    }

    if (tx.status === 'completed') {
        items.push({ icon: 'fa-credit-card', color: 'text-green-500', text: 'お支払い完了', done: true, urgent: false });
        items.push({ icon: 'fa-truck', color: 'text-green-500', text: '発送完了', done: true, urgent: false });
        items.push({ icon: 'fa-check-circle', color: 'text-green-500', text: '受取完了・取引完了', done: true, urgent: false });
        if (isBuyer) {
            items.push({ icon: 'fa-star', color: 'text-yellow-500', text: 'レビューを書きましょう', done: false, urgent: false, action: 'review', txId: tx.transaction_id });
        }
    }

    if (items.length === 0) return { html: '', urgent: false };

    const html = `
    <div class="px-4 pb-3">
        <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <i class="fas fa-list-check mr-1"></i>やることリスト
            </div>
            <div class="space-y-2">
                ${items.map(item => `
                <div class="flex items-start gap-2.5">
                    <div class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-100' : (item.urgent ? 'bg-red-50' : 'bg-gray-100')}">
                        <i class="fas ${item.done ? 'fa-check text-green-500' : item.icon + ' ' + item.color} text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-sm ${item.done ? 'text-gray-400 line-through' : (item.urgent ? 'text-gray-900 font-semibold' : 'text-gray-600')}">${item.text}</span>
                        ${item.action ? renderTodoAction(item.action, item.txId) : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>`;

    return { html, urgent };
}

function renderTodoAction(action, txId) {
    if (action === 'retry_payment') {
        return `<button onclick="retryPaymentFromMypage(${txId})" id="retry-btn-${txId}" class="inline-flex items-center mt-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"><i class="fas fa-redo mr-1"></i>支払いをやり直す</button>`;
    }
    if (action === 'ship') {
        return `<a href="/transactions/${txId}" class="inline-flex items-center mt-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors"><i class="fas fa-truck mr-1"></i>発送報告へ</a>`;
    }
    if (action === 'receive') {
        return `<a href="/transactions/${txId}" class="inline-flex items-center mt-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors"><i class="fas fa-check-circle mr-1"></i>受取完了へ</a>`;
    }
    if (action === 'review') {
        return `<a href="/reviews/new?transaction=${txId}" class="inline-flex items-center mt-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg transition-colors"><i class="fas fa-star mr-1"></i>レビューを書く</a>`;
    }
    return '';
}

// マイページから再支払い
async function retryPaymentFromMypage(txId) {
    const btn = document.getElementById('retry-btn-' + txId);
    if (!btn) return;
    
    const auth = getAuthHeaders();
    if (!auth) {
        alert('ログインが必要です');
        window.location.href = '/login?redirect=/mypage';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>準備中...';

    try {
        const response = await axios.post('/api/payment/retry-checkout', {
            transaction_id: txId
        }, auth);

        if (response.data.success) {
            if (response.data.already_paid) {
                alert('既にお支払いが完了しています。ページを更新します。');
                window.location.reload();
                return;
            }
            if (response.data.session_url) {
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
            window.location.href = '/login?redirect=/mypage';
            return;
        }
        const errorMsg = error?.response?.data?.error || error.message || '再決済の準備に失敗しました';
        alert(errorMsg);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-redo mr-1"></i>支払いをやり直す';
    }
}

function renderTxShippingBrief(tx) {
    if (!tx.shipping_carrier && !tx.tracking_number) return '';
    return `
    <div class="px-4 pb-2">
        <div class="bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <i class="fas fa-truck text-blue-500"></i>
            ${tx.shipping_carrier ? `<span class="text-gray-700">${tx.shipping_carrier}</span>` : ''}
            ${tx.tracking_number ? `<span class="font-mono font-bold text-blue-700">${tx.tracking_number}</span>` : ''}
        </div>
    </div>`;
}

// 【出品管理】出品中の商品を読み込み
async function loadListings(status = 'all') {
    try {
        const response = await axios.get(`/api/mypage/listings/${currentUserId}?status=${status}`, getAuthHeaders());
        
        if (response.data.success) {
            listingsData = response.data.data || [];
            renderListings();
        }
    } catch (error) {
        console.error('Failed to load listings:', error);
        document.getElementById('listings-container').innerHTML = 
            '<div class="col-span-full text-center py-12 text-gray-500">出品商品の読み込みに失敗しました</div>';
    }
}

// 出品商品を表示
function renderListings() {
    const container = document.getElementById('listings-container');
    
    if (listingsData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-box-open text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500 mb-4">出品商品がありません</p>
                <a href="/listing/new" class="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    <i class="fas fa-plus mr-2"></i>商品を出品する
                </a>
            </div>`;
        return;
    }
    
    container.innerHTML = listingsData.map(product => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <a href="/products/${product.slug || product.id}" class="block">
                <div class="relative">
                    <img loading="lazy" src="${product.image_url || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}" 
                         alt="${product.title}" 
                         class="w-full aspect-square object-cover${product.status === 'sold' ? ' opacity-60' : ''}"
                         onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'">
                    ${renderStatusBadge(product.status)}
                    ${product.status === 'sold' ? '<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div style="background:rgba(220,38,38,0.85);transform:rotate(-20deg);padding:8px 32px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><span style="font-size:1.3rem;font-weight:900;color:#fff;letter-spacing:0.15em;text-shadow:1px 1px 2px rgba(0,0,0,0.3);">SOLD</span></div></div>' : ''}
                </div>
                <div class="p-3 pb-1">
                    <h4 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${product.title}</h4>
                    <div class="text-red-500 font-bold text-lg">¥${formatPrice(product.price)}</div>
                    <div class="mt-1 flex items-center justify-between text-xs text-gray-400">
                        <span><i class="far fa-eye mr-1"></i>${product.view_count || 0}</span>
                        <span><i class="far fa-heart mr-1"></i>${product.favorite_count || 0}</span>
                        <span><i class="far fa-comment mr-1"></i>${product.comment_count || 0}</span>
                    </div>
                </div>
            </a>
            <div class="px-3 pb-3 pt-2 border-t border-gray-100 flex gap-2">
                <button onclick="editProduct(${product.id})" class="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-2 rounded-lg font-semibold transition-colors">
                    <i class="fas fa-edit mr-1"></i>編集
                </button>
                ${product.status === 'active' ? `
                    <button onclick="pauseProduct(${product.id})" class="flex-1 text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 py-2 px-2 rounded-lg font-semibold transition-colors">
                        <i class="fas fa-pause mr-1"></i>停止
                    </button>
                ` : product.status === 'paused' ? `
                    <button onclick="resumeProduct(${product.id})" class="flex-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 py-2 px-2 rounded-lg font-semibold transition-colors">
                        <i class="fas fa-play mr-1"></i>再開
                    </button>
                ` : ''}
                ${product.status !== 'sold' ? `
                    <button onclick="deleteProduct(${product.id})" class="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 py-2 px-2 rounded-lg font-semibold transition-colors">
                        <i class="fas fa-trash mr-1"></i>削除
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ステータスバッジを生成
function renderStatusBadge(status) {
    const badges = {
        'active': '<span class="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">出品中</span>',
        'sold': '<span class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">SOLD</span>',
        'paused': '<span class="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">停止中</span>',
        'draft': '<span class="absolute top-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-semibold">下書き</span>'
    };
    return badges[status] || '';
}

// 出品商品をフィルタリング
function filterListings(status) {
    loadListings(status);
}

// 商品を編集
function editProduct(productId) {
    window.location.href = `/listing/edit/${productId}`;
}

// トースト通知
function showToast(message, type = 'success') {
    var toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-semibold transition-all';
    toast.style.cssText = type === 'success' ? 'background:#22c55e;' : 'background:#ef4444;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2500);
}

// 商品を停止
async function pauseProduct(productId) {
    if (!confirm('この商品の出品を停止しますか？')) return;
    
    try {
        const response = await axios.put(`/api/mypage/listings/${productId}/status`, {
            status: 'paused',
            seller_id: currentUserId
        }, getAuthHeaders());
        
        if (response.data.success) {
            showToast('商品を停止しました');
            loadListings();
        }
    } catch (error) {
        console.error('Failed to pause product:', error);
        showToast('商品の停止に失敗しました', 'error');
    }
}

// 商品を再開
async function resumeProduct(productId) {
    try {
        const response = await axios.put(`/api/mypage/listings/${productId}/status`, {
            status: 'active',
            seller_id: currentUserId
        }, getAuthHeaders());
        
        if (response.data.success) {
            showToast('商品を再開しました');
            loadListings();
        }
    } catch (error) {
        console.error('Failed to resume product:', error);
        showToast('商品の再開に失敗しました', 'error');
    }
}

// 商品を削除
async function deleteProduct(productId) {
    if (!confirm('この商品を削除しますか？この操作は取り消せません。')) return;
    
    try {
        const response = await axios.delete(`/api/mypage/listings/${productId}`, {
            data: { seller_id: currentUserId },
            ...getAuthHeaders()
        });
        
        if (response.data.success) {
            showToast('商品を削除しました');
            loadListings();
            loadUserStats();
        } else {
            showToast(response.data.error || '商品の削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Failed to delete product:', error);
        showToast(error?.response?.data?.error || '商品の削除に失敗しました', 'error');
    }
}

// 【売上管理】売上データを読み込み
async function loadSalesData() {
    try {
        const response = await axios.get(`/api/mypage/sales/${currentUserId}`, getAuthHeaders());
        
        if (response.data.success) {
            salesHistoryData = response.data.data || [];
            renderSalesData();
        }
    } catch (error) {
        console.error('Failed to load sales data:', error);
    }
}

// 売上データを表示
function renderSalesData() {
    // 進行中と完了を分離
    const inProgress = salesHistoryData.filter(s => s.status === 'paid' || s.status === 'shipped');
    const completed = salesHistoryData.filter(s => s.status === 'completed');

    const monthlySales = aggregateMonthlySales(completed);
    const summaryContainer = document.getElementById('sales-summary');
    
    if (monthlySales.length === 0 && inProgress.length === 0) {
        summaryContainer.innerHTML = '<div class="text-center py-8 text-gray-500">売上データがありません</div>';
    } else {
        let summaryHtml = '';

        // 進行中取引バナー
        if (inProgress.length > 0) {
            const inProgressTotal = inProgress.reduce((sum, s) => sum + Number(s.sale_price || 0), 0);
            const needsShipping = inProgress.filter(s => s.status === 'paid').length;
            const awaitingReceipt = inProgress.filter(s => s.status === 'shipped').length;

            summaryHtml += `
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="font-bold text-orange-800 text-sm"><i class="fas fa-clock mr-1"></i>進行中の売上</div>
                    <div class="text-lg font-bold text-orange-600">¥${formatPrice(inProgressTotal)}</div>
                </div>
                <div class="flex gap-3 text-xs">
                    ${needsShipping > 0 ? `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold"><i class="fas fa-box mr-1"></i>発送待ち ${needsShipping}件</span>` : ''}
                    ${awaitingReceipt > 0 ? `<span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold"><i class="fas fa-truck mr-1"></i>受取待ち ${awaitingReceipt}件</span>` : ''}
                </div>
            </div>`;
        }

        if (monthlySales.length > 0) {
            summaryHtml += monthlySales.map(month => `
                <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <div class="font-semibold text-gray-900">${month.year}年${month.month}月</div>
                        <div class="text-sm text-gray-600">${month.count}件の取引</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold text-gray-900">¥${formatPrice(month.total)}</div>
                        <div class="text-sm text-gray-600">手数料: ¥${formatPrice(month.fee)}</div>
                    </div>
                </div>
            `).join('');
        }
        summaryContainer.innerHTML = summaryHtml;
    }
    
    const historyContainer = document.getElementById('sales-history');
    
    if (salesHistoryData.length === 0) {
        historyContainer.innerHTML = '<div class="text-center py-8 text-gray-500">売上履歴がありません</div>';
    } else {
        historyContainer.innerHTML = salesHistoryData.map(sale => {
            const statusInfo = getSaleStatusInfo(sale.status);
            return `
            <div class="bg-white border ${sale.status === 'paid' ? 'border-orange-300' : 'border-gray-200'} rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <img loading="lazy" src="${sale.product_image || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}" 
                         alt="${sale.product_title}" 
                         class="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                         onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.bgClass}">
                                <i class="fas ${statusInfo.icon} mr-1"></i>${statusInfo.text}
                            </span>
                            <span class="text-xs text-gray-400">#${sale.transaction_id}</span>
                        </div>
                        <h4 class="font-semibold text-gray-900 text-sm truncate">${sale.product_title}</h4>
                        <div class="flex items-center justify-between mt-1">
                            <div>
                                <span class="text-lg font-bold text-gray-900">¥${formatPrice(sale.sale_price)}</span>
                                <span class="text-xs text-gray-400 ml-1">${sale.buyer_name ? '← ' + sale.buyer_name : ''}</span>
                            </div>
                        </div>
                        ${sale.status === 'paid' ? `
                        <a href="/transactions/${sale.transaction_id}" class="inline-flex items-center mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors">
                            <i class="fas fa-truck mr-1"></i>発送報告へ
                        </a>` : ''}
                        ${sale.status === 'shipped' ? `
                        <div class="mt-2 text-xs text-gray-500">
                            <i class="fas fa-truck text-indigo-500 mr-1"></i>${sale.shipping_carrier || '発送済み'}
                            ${sale.tracking_number ? ' ・ ' + sale.tracking_number : ''}
                        </div>` : ''}
                        ${sale.status === 'completed' ? `
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-gray-400">${formatDate(sale.sold_at)}</span>
                            ${sale.has_seller_review ? '<span class="text-xs text-green-600"><i class="fas fa-check-circle mr-0.5"></i>レビュー済み</span>' : `<a href="/reviews/new?transaction=${sale.transaction_id}" class="inline-flex items-center px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-[11px] font-bold rounded-lg transition-colors"><i class="fas fa-star mr-1"></i>購入者をレビュー</a>`}
                        </div>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');
    }
}

function getSaleStatusInfo(status) {
    const map = {
        'paid':     { text: '発送待ち', icon: 'fa-box',          bgClass: 'bg-orange-100 text-orange-700' },
        'shipped':  { text: '配送中',   icon: 'fa-truck',         bgClass: 'bg-indigo-100 text-indigo-700' },
        'completed':{ text: '完了',     icon: 'fa-check-circle',  bgClass: 'bg-green-100 text-green-700' },
    };
    return map[status] || { text: status, icon: 'fa-circle', bgClass: 'bg-gray-100 text-gray-700' };
}

// 月別売上を集計
function aggregateMonthlySales(sales) {
    const monthlyMap = {};
    sales.forEach(sale => {
        const date = new Date(sale.sold_at);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyMap[key]) {
            monthlyMap[key] = { year: date.getFullYear(), month: date.getMonth() + 1, total: 0, fee: 0, count: 0 };
        }
        monthlyMap[key].total += sale.sale_price;
        monthlyMap[key].fee += sale.commission_fee;
        monthlyMap[key].count++;
    });
    return Object.values(monthlyMap).sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
}

// 振込申請
async function requestWithdrawal() {
    const amount = statsData.withdrawable_amount || 0;
    if (amount < 1000) {
        alert('振込可能額が最低金額（¥1,000）に達していません');
        return;
    }
    if (!confirm(`¥${formatPrice(amount)}の振込申請を行いますか？`)) return;
    
    try {
        const response = await axios.post('/api/mypage/withdrawal', {
            user_id: currentUserId,
            amount: amount
        }, getAuthHeaders());
        
        if (response.data.success) {
            alert('振込申請を受け付けました。3〜5営業日以内に振り込まれます。');
            loadUserStats();
            loadSalesData();
        }
    } catch (error) {
        console.error('Failed to request withdrawal:', error);
        alert('振込申請に失敗しました');
    }
}

// 【購入履歴】
async function loadPurchases() {
    try {
        const response = await axios.get(`/api/mypage/purchases/${currentUserId}`, getAuthHeaders());
        
        if (response.data.success) {
            purchasesData = response.data.data || [];
            renderPurchases();
        }
    } catch (error) {
        console.error('Failed to load purchases:', error);
        document.getElementById('purchases-container').innerHTML = 
            '<div class="text-center py-8 text-gray-500">購入履歴の読み込みに失敗しました</div>';
    }
}

function renderPurchases() {
    const container = document.getElementById('purchases-container');
    
    if (purchasesData.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">購入履歴がありません</div>';
        return;
    }
    
    container.innerHTML = purchasesData.map(purchase => {
        const actionHtml = getPurchaseActionHtml(purchase);
        return `
        <div class="bg-white border ${purchase.status === 'shipped' ? 'border-indigo-300' : 'border-gray-200'} rounded-lg p-4">
            <div class="flex items-start gap-3 mb-3">
                <img loading="lazy" src="${purchase.product_image || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}" 
                     alt="${purchase.product_title}" 
                     class="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                     onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-900 text-sm truncate">${purchase.product_title}</h4>
                    <div class="text-xs text-gray-500 mt-0.5">${purchase.seller_name ? purchase.seller_name + ' ・ ' : ''}${formatDate(purchase.purchased_at)}</div>
                    <div class="text-lg font-bold text-red-500 mt-0.5">¥${formatPrice(purchase.total_price)}</div>
                </div>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                ${renderTransactionStatus(purchase.status)}
                <button onclick="viewPurchaseDetail(${purchase.transaction_id})" class="text-sm text-blue-600 hover:underline font-semibold">
                    詳細 <i class="fas fa-chevron-right ml-1"></i>
                </button>
            </div>
            ${actionHtml}
        </div>`;
    }).join('');
}

function getPurchaseActionHtml(purchase) {
    if (purchase.status === 'pending') {
        return `
        <div class="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p class="text-xs text-yellow-700 mb-2"><i class="fas fa-exclamation-triangle mr-1"></i>お支払いが完了していません。下のボタンから再度決済してください。</p>
            <button onclick="retryPaymentFromMypage(${purchase.transaction_id})" id="retry-btn-p-${purchase.transaction_id}" class="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors">
                <i class="fas fa-redo mr-1"></i>支払いをやり直す
            </button>
        </div>`;
    }
    if (purchase.status === 'shipped') {
        return `
        <div class="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p class="text-xs text-indigo-700 mb-2"><i class="fas fa-info-circle mr-1"></i>商品が発送されました。届いたら受取完了を押してください。</p>
            <a href="/transactions/${purchase.transaction_id}" class="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors">
                <i class="fas fa-check-circle mr-1"></i>受取完了へ
            </a>
        </div>`;
    }
    if (purchase.status === 'paid') {
        return `
        <div class="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700"><i class="fas fa-clock mr-1"></i>出品者が発送準備を進めています。しばらくお待ちください。</p>
        </div>`;
    }
    if (purchase.status === 'completed' && !purchase.reviewed) {
        return `
        <button onclick="writeReview(${purchase.transaction_id})" class="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm">
            <i class="fas fa-star mr-2"></i>レビューを書く
        </button>`;
    }
    return '';
}

function renderTransactionStatus(status) {
    const statusConfig = {
        'pending': { text: '支払い待ち', color: 'yellow', icon: 'fa-clock' },
        'paid': { text: '支払い完了', color: 'blue', icon: 'fa-credit-card' },
        'shipped': { text: '発送済み', color: 'purple', icon: 'fa-shipping-fast' },
        'completed': { text: '取引完了', color: 'green', icon: 'fa-check-circle' },
        'cancelled': { text: 'キャンセル', color: 'red', icon: 'fa-times-circle' }
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 text-${config.color}-700"><i class="fas ${config.icon} mr-1"></i>${config.text}</span>`;
}

function viewPurchaseDetail(transactionId) {
    window.location.href = `/transactions/${transactionId}`;
}

function writeReview(transactionId) {
    window.location.href = `/reviews/new?transaction=${transactionId}`;
}

// 【お気に入り】
async function loadFavorites() {
    try {
        const response = await axios.get(`/api/mypage/favorites/${currentUserId}`, getAuthHeaders());
        
        if (response.data.success) {
            favoritesData = response.data.data || [];
            renderFavorites();
        }
    } catch (error) {
        console.error('Failed to load favorites:', error);
    }
}

function renderFavorites() {
    const container = document.getElementById('favorites-container');
    
    if (favoritesData.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">お気に入り商品がありません</div>';
        return;
    }
    
    container.innerHTML = favoritesData.map(product => `
        <a href="/products/${product.slug || product.id}" class="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div class="relative">
                <img loading="lazy" src="${product.image_url || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}" 
                     alt="${product.title}" 
                     class="w-full aspect-square object-cover"
                     onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'">
                ${product.status === 'sold' ? '<span class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">SOLD</span>' : ''}
            </div>
            <div class="p-3">
                <h4 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${product.title}</h4>
                <div class="text-red-500 font-bold text-lg">¥${formatPrice(product.price)}</div>
            </div>
        </a>
    `).join('');
}

async function removeFavorite(productId, event) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm('このお気に入りを解除しますか？')) return;
    
    try {
        const response = await axios.delete(`/api/mypage/favorites/${productId}`, {
            data: { user_id: currentUserId },
            ...getAuthHeaders()
        });
        if (response.data.success) loadFavorites();
    } catch (error) {
        alert('お気に入り解除に失敗しました');
    }
}

// 【値下げ交渉】
async function loadNegotiations(type) {
    try {
        const response = await axios.get(`/api/negotiations/user/${currentUserId}?type=${type}`, getAuthHeaders());
        
        if (response.data.success) {
            if (type === 'received') {
                negotiationsReceivedData = response.data.data || [];
            } else {
                negotiationsSentData = response.data.data || [];
            }
            renderNegotiations(type);
        }
    } catch (error) {
        console.error('Failed to load negotiations:', error);
    }
}

function showNegotiations(type) {
    document.querySelectorAll('.nego-tab').forEach(btn => {
        btn.classList.remove('text-red-500', 'border-red-500');
        btn.classList.add('text-gray-600', 'border-transparent');
    });
    document.querySelectorAll('.nego-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeBtn = document.querySelector(`.nego-tab[data-nego-tab="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600', 'border-transparent');
        activeBtn.classList.add('text-red-500', 'border-red-500');
    }
    
    const activeContent = document.getElementById(`negotiations-${type}`);
    if (activeContent) activeContent.classList.remove('hidden');
    
    loadNegotiations(type);
}

function renderNegotiations(type) {
    const data = type === 'received' ? negotiationsReceivedData : negotiationsSentData;
    const container = document.getElementById(`negotiations-${type}`);
    
    if (data.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-gray-500">${type === 'received' ? '受け取った' : '送った'}値下げ交渉がありません</div>`;
        return;
    }
    
    container.innerHTML = data.map(nego => `
        <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center gap-3 mb-3">
                <img loading="lazy" src="${nego.product_image || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}" 
                     alt="${nego.product_title}" 
                     class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                     onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-900 text-sm truncate">${nego.product_title}</h4>
                    <div class="text-xs text-gray-500 mb-1">${formatDate(nego.created_at)}</div>
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-gray-500 line-through">¥${formatPrice(nego.current_price)}</span>
                        <i class="fas fa-arrow-right text-gray-400 text-xs"></i>
                        <span class="text-red-500 font-bold">¥${formatPrice(nego.requested_price)}</span>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                ${renderNegotiationStatus(nego.status)}
                ${type === 'received' && nego.status === 'pending' ? `
                    <div class="flex gap-2">
                        <button onclick="acceptNegotiation(${nego.id})" class="bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-lg text-xs font-semibold">承諾</button>
                        <button onclick="rejectNegotiation(${nego.id})" class="bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-lg text-xs font-semibold">拒否</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderNegotiationStatus(status) {
    const statusConfig = {
        'pending': { text: '承認待ち', color: 'yellow', icon: 'fa-clock' },
        'accepted': { text: '承認済み', color: 'green', icon: 'fa-check-circle' },
        'rejected': { text: '拒否', color: 'red', icon: 'fa-times-circle' },
        'counter_offered': { text: 'カウンター', color: 'blue', icon: 'fa-handshake' },
        'expired': { text: '期限切れ', color: 'gray', icon: 'fa-clock' }
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 text-${config.color}-700"><i class="fas ${config.icon} mr-1"></i>${config.text}</span>`;
}

async function acceptNegotiation(negotiationId) {
    if (!confirm('この値下げ交渉を承諾しますか？')) return;
    try {
        const response = await axios.put(`/api/negotiations/${negotiationId}`, { status: 'accepted', seller_id: currentUserId }, getAuthHeaders());
        if (response.data.success) {
            alert('値下げ交渉を承諾しました');
            loadNegotiations('received');
            loadListings();
        }
    } catch (error) {
        alert('値下げ交渉の承諾に失敗しました');
    }
}

async function rejectNegotiation(negotiationId) {
    if (!confirm('この値下げ交渉を拒否しますか？')) return;
    try {
        const response = await axios.put(`/api/negotiations/${negotiationId}`, { status: 'rejected', seller_id: currentUserId }, getAuthHeaders());
        if (response.data.success) {
            alert('値下げ交渉を拒否しました');
            showNegotiations('received');
        }
    } catch (error) {
        alert('値下げ交渉の拒否に失敗しました');
    }
}

function viewTransactionDetail(transactionId) {
    window.location.href = `/transactions/${transactionId}`;
}

// ユーティリティ関数
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP').format(price);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return '今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;
    
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
