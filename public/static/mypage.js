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
    showTab('listings');
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
        case 'listings': loadListings(); break;
        case 'sales': loadSalesData(); break;
        case 'purchases': loadPurchases(); break;
        case 'favorites': loadFavorites(); break;
        case 'negotiations': loadNegotiations('received'); break;
    }
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
                    <img src="${product.image_url || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}" 
                         alt="${product.title}" 
                         class="w-full aspect-square object-cover"
                         onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'">
                    ${renderStatusBadge(product.status)}
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
    const monthlySales = aggregateMonthlySales(salesHistoryData);
    const summaryContainer = document.getElementById('sales-summary');
    
    if (monthlySales.length === 0) {
        summaryContainer.innerHTML = '<div class="text-center py-8 text-gray-500">売上データがありません</div>';
    } else {
        summaryContainer.innerHTML = monthlySales.map(month => `
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
    
    const historyContainer = document.getElementById('sales-history');
    
    if (salesHistoryData.length === 0) {
        historyContainer.innerHTML = '<div class="text-center py-8 text-gray-500">売上履歴がありません</div>';
    } else {
        historyContainer.innerHTML = salesHistoryData.map(sale => `
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-2">
                    <img src="${sale.product_image || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}" 
                         alt="${sale.product_title}" 
                         class="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                         onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-gray-900 text-sm truncate">${sale.product_title}</h4>
                        <div class="text-xs text-gray-500">${formatDate(sale.sold_at)}</div>
                        <div class="text-lg font-bold text-gray-900">¥${formatPrice(sale.sale_price)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
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
    
    container.innerHTML = purchasesData.map(purchase => `
        <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center gap-3 mb-3">
                <img src="${purchase.product_image || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}" 
                     alt="${purchase.product_title}" 
                     class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                     onerror="this.src='https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-900 text-sm truncate">${purchase.product_title}</h4>
                    <div class="text-xs text-gray-500">${formatDate(purchase.purchased_at)}</div>
                    <div class="text-lg font-bold text-red-500">¥${formatPrice(purchase.total_price)}</div>
                </div>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                ${renderTransactionStatus(purchase.status)}
                <button onclick="viewPurchaseDetail(${purchase.transaction_id})" class="text-sm text-blue-600 hover:underline">
                    詳細 <i class="fas fa-chevron-right ml-1"></i>
                </button>
            </div>
            ${purchase.status === 'completed' && !purchase.reviewed ? `
                <button onclick="writeReview(${purchase.transaction_id})" class="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm">
                    <i class="fas fa-star mr-2"></i>レビューを書く
                </button>
            ` : ''}
        </div>
    `).join('');
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
                <img src="${product.image_url || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}" 
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
                <img src="${nego.product_image || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}" 
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
