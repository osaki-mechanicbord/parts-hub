/**
 * マイページ - フリマサイト完全機能実装
 * 機能: 出品管理、売上管理、購入履歴、お気に入り、値下げ交渉
 */

// 現在のユーザーID（実際の実装では認証から取得）
const currentUserId = 1;

// グローバル状態
let userData = null;
let statsData = null;
let listingsData = [];
let purchasesData = [];
let favoritesData = [];
let negotiationsReceivedData = [];
let negotiationsSentData = [];
let salesHistoryData = [];

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadUserStats();
    showTab('listings');
    showNegotiations('received');
});

// ユーザー統計情報を読み込み
async function loadUserStats() {
    try {
        const response = await axios.get(`/api/mypage/stats/${currentUserId}`);
        
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
    document.getElementById('user-shop-name').textContent = statsData.shop_name || '整備工場';
    document.getElementById('user-rating').textContent = statsData.average_rating || '0.0';
    document.getElementById('review-count').textContent = statsData.review_count || '0';
    document.getElementById('listing-count').textContent = statsData.listing_count || '0';
    document.getElementById('total-sales').textContent = formatPrice(statsData.total_sales || 0);
    document.getElementById('withdrawable').textContent = formatPrice(statsData.withdrawable_amount || 0);
    document.getElementById('sold-count').textContent = statsData.sold_count || '0';
    document.getElementById('purchase-count').textContent = statsData.purchase_count || '0';
    document.getElementById('withdrawable-detail').textContent = formatPrice(statsData.withdrawable_amount || 0);
    
    // 通知バッジ
    const unreadCount = statsData.unread_notifications || 0;
    if (unreadCount > 0) {
        const badge = document.getElementById('notification-badge');
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
    }
}

// タブ切り替え
function showTab(tabName) {
    // すべてのタブボタンをリセット
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-red-500', 'border-red-500');
        btn.classList.add('text-gray-600', 'border-transparent');
    });
    
    // すべてのタブコンテンツを非表示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // 選択されたタブをアクティブに
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600', 'border-transparent');
        activeBtn.classList.add('text-red-500', 'border-red-500');
    }
    
    // 選択されたタブコンテンツを表示
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    // データを読み込み
    switch(tabName) {
        case 'listings':
            loadListings();
            break;
        case 'sales':
            loadSalesData();
            break;
        case 'purchases':
            loadPurchases();
            break;
        case 'favorites':
            loadFavorites();
            break;
        case 'negotiations':
            loadNegotiations('received');
            break;
    }
}

// 【出品管理】出品中の商品を読み込み
async function loadListings(status = 'all') {
    try {
        const response = await axios.get(`/api/mypage/listings/${currentUserId}?status=${status}`);
        
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
        container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">出品商品がありません</div>';
        return;
    }
    
    container.innerHTML = listingsData.map(product => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div class="relative">
                <img src="${product.image_url || '/icons/icon-192x192.png'}" 
                     alt="${product.title}" 
                     class="w-full h-48 object-cover">
                ${renderStatusBadge(product.status)}
            </div>
            <div class="p-3">
                <h4 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">${product.title}</h4>
                <div class="text-red-500 font-bold text-lg mb-2">¥${formatPrice(product.price)}</div>
                
                <!-- アクション -->
                <div class="flex gap-2 mt-3">
                    <button onclick="editProduct(${product.id})" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors">
                        <i class="fas fa-edit mr-1"></i>編集
                    </button>
                    ${product.status === 'active' ? `
                        <button onclick="pauseProduct(${product.id})" class="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-pause mr-1"></i>停止
                        </button>
                    ` : product.status === 'paused' ? `
                        <button onclick="resumeProduct(${product.id})" class="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-play mr-1"></i>再開
                        </button>
                    ` : ''}
                </div>
                
                ${product.status === 'active' ? `
                    <button onclick="deleteProduct(${product.id})" class="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-lg text-sm font-semibold transition-colors">
                        <i class="fas fa-trash-alt mr-1"></i>削除
                    </button>
                ` : ''}
                
                <!-- 統計 -->
                <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span><i class="far fa-eye mr-1"></i>${product.view_count || 0}</span>
                    <span><i class="far fa-heart mr-1"></i>${product.favorite_count || 0}</span>
                    <span><i class="far fa-comment mr-1"></i>${product.comment_count || 0}</span>
                </div>
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

// 商品を停止
async function pauseProduct(productId) {
    if (!confirm('この商品の出品を停止しますか？')) return;
    
    try {
        const response = await axios.put(`/api/mypage/listings/${productId}/status`, {
            status: 'paused',
            seller_id: currentUserId
        });
        
        if (response.data.success) {
            alert('商品を停止しました');
            loadListings();
        }
    } catch (error) {
        console.error('Failed to pause product:', error);
        alert('商品の停止に失敗しました');
    }
}

// 商品を再開
async function resumeProduct(productId) {
    try {
        const response = await axios.put(`/api/mypage/listings/${productId}/status`, {
            status: 'active',
            seller_id: currentUserId
        });
        
        if (response.data.success) {
            alert('商品を再開しました');
            loadListings();
        }
    } catch (error) {
        console.error('Failed to resume product:', error);
        alert('商品の再開に失敗しました');
    }
}

// 商品を削除
async function deleteProduct(productId) {
    if (!confirm('この商品を削除しますか？この操作は取り消せません。')) return;
    
    try {
        const response = await axios.delete(`/api/mypage/listings/${productId}`, {
            data: { seller_id: currentUserId }
        });
        
        if (response.data.success) {
            alert('商品を削除しました');
            loadListings();
            loadUserStats(); // 統計を更新
        }
    } catch (error) {
        console.error('Failed to delete product:', error);
        alert('商品の削除に失敗しました');
    }
}

// 【売上管理】売上データを読み込み
async function loadSalesData() {
    try {
        const response = await axios.get(`/api/mypage/sales/${currentUserId}`);
        
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
    // 月別集計
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
                    <div class="text-2xl font-bold text-gray-900">¥${formatPrice(month.total)}</div>
                    <div class="text-sm text-gray-600">手数料: ¥${formatPrice(month.fee)}</div>
                </div>
            </div>
        `).join('');
    }
    
    // 売上履歴
    const historyContainer = document.getElementById('sales-history');
    
    if (salesHistoryData.length === 0) {
        historyContainer.innerHTML = '<div class="text-center py-8 text-gray-500">売上履歴がありません</div>';
    } else {
        historyContainer.innerHTML = salesHistoryData.map(sale => `
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <img src="${sale.product_image || '/icons/icon-192x192.png'}" 
                             alt="${sale.product_title}" 
                             class="w-16 h-16 object-cover rounded-lg">
                        <div>
                            <h4 class="font-semibold text-gray-900">${sale.product_title}</h4>
                            <div class="text-sm text-gray-600">${formatDate(sale.sold_at)}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold text-gray-900">¥${formatPrice(sale.sale_price)}</div>
                        <div class="text-sm text-red-600">手数料: -¥${formatPrice(sale.commission_fee)}</div>
                        <div class="text-sm font-semibold text-green-600">入金: ¥${formatPrice(sale.seller_revenue)}</div>
                    </div>
                </div>
                
                <!-- 振込ステータス -->
                <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    ${renderWithdrawalStatus(sale.withdrawal_status)}
                    ${sale.withdrawal_status === 'pending' ? `
                        <button onclick="viewTransactionDetail(${sale.transaction_id})" class="text-sm text-blue-600 hover:underline">
                            詳細 <i class="fas fa-chevron-right ml-1"></i>
                        </button>
                    ` : ''}
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
            monthlyMap[key] = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                total: 0,
                fee: 0,
                count: 0
            };
        }
        
        monthlyMap[key].total += sale.sale_price;
        monthlyMap[key].fee += sale.commission_fee;
        monthlyMap[key].count++;
    });
    
    return Object.values(monthlyMap).sort((a, b) => {
        return (b.year * 12 + b.month) - (a.year * 12 + a.month);
    });
}

// 振込ステータスを表示
function renderWithdrawalStatus(status) {
    const statusConfig = {
        'pending': { text: '振込待ち', color: 'yellow', icon: 'fa-clock' },
        'processing': { text: '処理中', color: 'blue', icon: 'fa-spinner' },
        'completed': { text: '振込完了', color: 'green', icon: 'fa-check-circle' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    
    return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${config.color}-100 text-${config.color}-700">
            <i class="fas ${config.icon} mr-1"></i>${config.text}
        </span>
    `;
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
        });
        
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

// 【購入履歴】購入履歴を読み込み
async function loadPurchases() {
    try {
        const response = await axios.get(`/api/mypage/purchases/${currentUserId}`);
        
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

// 購入履歴を表示
function renderPurchases() {
    const container = document.getElementById('purchases-container');
    
    if (purchasesData.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">購入履歴がありません</div>';
        return;
    }
    
    container.innerHTML = purchasesData.map(purchase => `
        <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center gap-3 mb-3">
                <img src="${purchase.product_image || '/icons/icon-192x192.png'}" 
                     alt="${purchase.product_title}" 
                     class="w-20 h-20 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 mb-1">${purchase.product_title}</h4>
                    <div class="text-sm text-gray-600 mb-1">${formatDate(purchase.purchased_at)}</div>
                    <div class="text-xl font-bold text-red-500">¥${formatPrice(purchase.total_price)}</div>
                </div>
            </div>
            
            <!-- トランザクションステータス -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                ${renderTransactionStatus(purchase.status)}
                <button onclick="viewPurchaseDetail(${purchase.transaction_id})" class="text-sm text-blue-600 hover:underline">
                    詳細 <i class="fas fa-chevron-right ml-1"></i>
                </button>
            </div>
            
            ${purchase.status === 'completed' && !purchase.reviewed ? `
                <button onclick="writeReview(${purchase.transaction_id})" class="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
                    <i class="fas fa-star mr-2"></i>レビューを書く
                </button>
            ` : ''}
        </div>
    `).join('');
}

// トランザクションステータスを表示
function renderTransactionStatus(status) {
    const statusConfig = {
        'pending': { text: '支払い待ち', color: 'yellow', icon: 'fa-clock' },
        'paid': { text: '支払い完了', color: 'blue', icon: 'fa-credit-card' },
        'shipped': { text: '発送済み', color: 'purple', icon: 'fa-shipping-fast' },
        'completed': { text: '取引完了', color: 'green', icon: 'fa-check-circle' },
        'cancelled': { text: 'キャンセル', color: 'red', icon: 'fa-times-circle' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    
    return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${config.color}-100 text-${config.color}-700">
            <i class="fas ${config.icon} mr-1"></i>${config.text}
        </span>
    `;
}

// 購入詳細を表示
function viewPurchaseDetail(transactionId) {
    window.location.href = `/transactions/${transactionId}`;
}

// レビューを書く
function writeReview(transactionId) {
    window.location.href = `/reviews/new?transaction=${transactionId}`;
}

// 【お気に入り】お気に入り商品を読み込み
async function loadFavorites() {
    try {
        const response = await axios.get(`/api/mypage/favorites/${currentUserId}`);
        
        if (response.data.success) {
            favoritesData = response.data.data || [];
            renderFavorites();
        }
    } catch (error) {
        console.error('Failed to load favorites:', error);
        document.getElementById('favorites-container').innerHTML = 
            '<div class="col-span-full text-center py-8 text-gray-500">お気に入り商品の読み込みに失敗しました</div>';
    }
}

// お気に入り商品を表示
function renderFavorites() {
    const container = document.getElementById('favorites-container');
    
    if (favoritesData.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">お気に入り商品がありません</div>';
        return;
    }
    
    container.innerHTML = favoritesData.map(product => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <a href="/products/${product.id}" class="block">
                <div class="relative">
                    <img src="${product.image_url || '/icons/icon-192x192.png'}" 
                         alt="${product.title}" 
                         class="w-full h-48 object-cover">
                    ${product.status === 'sold' ? '<span class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">SOLD</span>' : ''}
                </div>
                <div class="p-3">
                    <h4 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">${product.title}</h4>
                    <div class="text-red-500 font-bold text-lg mb-2">¥${formatPrice(product.price)}</div>
                    <div class="text-xs text-gray-600">
                        <i class="far fa-clock mr-1"></i>${formatDate(product.favorited_at)}に追加
                    </div>
                </div>
            </a>
            <div class="p-3 pt-0">
                <button onclick="removeFavorite(${product.id}, event)" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors">
                    <i class="fas fa-heart-broken mr-1"></i>お気に入り解除
                </button>
            </div>
        </div>
    `).join('');
}

// お気に入りを解除
async function removeFavorite(productId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!confirm('このお気に入りを解除しますか？')) return;
    
    try {
        const response = await axios.delete(`/api/mypage/favorites/${productId}`, {
            data: { user_id: currentUserId }
        });
        
        if (response.data.success) {
            loadFavorites();
        }
    } catch (error) {
        console.error('Failed to remove favorite:', error);
        alert('お気に入り解除に失敗しました');
    }
}

// 【値下げ交渉】値下げ交渉を読み込み
async function loadNegotiations(type) {
    try {
        const response = await axios.get(`/api/negotiations/user/${currentUserId}?type=${type}`);
        
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

// 値下げ交渉タブを切り替え
function showNegotiations(type) {
    // すべてのタブボタンをリセット
    document.querySelectorAll('.nego-tab').forEach(btn => {
        btn.classList.remove('text-red-500', 'border-red-500');
        btn.classList.add('text-gray-600', 'border-transparent');
    });
    
    // すべてのコンテンツを非表示
    document.querySelectorAll('.nego-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // 選択されたタブをアクティブに
    const activeBtn = document.querySelector(`.nego-tab[data-nego-tab="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600', 'border-transparent');
        activeBtn.classList.add('text-red-500', 'border-red-500');
    }
    
    // 選択されたコンテンツを表示
    const activeContent = document.getElementById(`negotiations-${type}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    // データを読み込み
    loadNegotiations(type);
}

// 値下げ交渉を表示
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
                <img src="${nego.product_image || '/icons/icon-192x192.png'}" 
                     alt="${nego.product_title}" 
                     class="w-20 h-20 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 mb-1">${nego.product_title}</h4>
                    <div class="text-sm text-gray-600 mb-2">${formatDate(nego.created_at)}</div>
                    <div class="flex items-center gap-4">
                        <div>
                            <div class="text-xs text-gray-500">現在価格</div>
                            <div class="text-lg font-bold text-gray-900">¥${formatPrice(nego.current_price)}</div>
                        </div>
                        <div class="text-gray-400">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">希望価格</div>
                            <div class="text-lg font-bold text-red-500">¥${formatPrice(nego.requested_price)}</div>
                        </div>
                        ${nego.counter_price ? `
                            <div class="text-gray-400">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div>
                                <div class="text-xs text-gray-500">カウンター</div>
                                <div class="text-lg font-bold text-blue-500">¥${formatPrice(nego.counter_price)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- ステータスとアクション -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                ${renderNegotiationStatus(nego.status)}
                
                ${type === 'received' && nego.status === 'pending' ? `
                    <div class="flex gap-2">
                        <button onclick="acceptNegotiation(${nego.id})" class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-check mr-1"></i>承諾
                        </button>
                        <button onclick="showCounterOfferModal(${nego.id}, ${nego.requested_price})" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-handshake mr-1"></i>カウンター
                        </button>
                        <button onclick="rejectNegotiation(${nego.id})" class="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-times mr-1"></i>拒否
                        </button>
                    </div>
                ` : type === 'sent' && nego.status === 'counter_offered' ? `
                    <div class="flex gap-2">
                        <button onclick="acceptCounterOffer(${nego.id})" class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-check mr-1"></i>カウンターを承諾
                        </button>
                        <button onclick="rejectNegotiation(${nego.id})" class="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-times mr-1"></i>取り消し
                        </button>
                    </div>
                ` : ''}
            </div>
            
            ${nego.message ? `
                <div class="mt-3 pt-3 border-t border-gray-100">
                    <div class="text-xs text-gray-500 mb-1">メッセージ:</div>
                    <div class="text-sm text-gray-700">${nego.message}</div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 値下げ交渉ステータスを表示
function renderNegotiationStatus(status) {
    const statusConfig = {
        'pending': { text: '承認待ち', color: 'yellow', icon: 'fa-clock' },
        'accepted': { text: '承認済み', color: 'green', icon: 'fa-check-circle' },
        'rejected': { text: '拒否', color: 'red', icon: 'fa-times-circle' },
        'counter_offered': { text: 'カウンター提示', color: 'blue', icon: 'fa-handshake' },
        'expired': { text: '期限切れ', color: 'gray', icon: 'fa-clock' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    
    return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${config.color}-100 text-${config.color}-700">
            <i class="fas ${config.icon} mr-1"></i>${config.text}
        </span>
    `;
}

// 値下げ交渉を承諾
async function acceptNegotiation(negotiationId) {
    if (!confirm('この値下げ交渉を承諾しますか？商品価格が変更されます。')) return;
    
    try {
        const response = await axios.put(`/api/negotiations/${negotiationId}`, {
            status: 'accepted',
            seller_id: currentUserId
        });
        
        if (response.data.success) {
            alert('値下げ交渉を承諾しました');
            loadNegotiations('received');
            loadListings(); // 出品リストを更新
        }
    } catch (error) {
        console.error('Failed to accept negotiation:', error);
        alert('値下げ交渉の承諾に失敗しました');
    }
}

// 値下げ交渉を拒否
async function rejectNegotiation(negotiationId) {
    if (!confirm('この値下げ交渉を拒否しますか？')) return;
    
    try {
        const response = await axios.put(`/api/negotiations/${negotiationId}`, {
            status: 'rejected',
            seller_id: currentUserId
        });
        
        if (response.data.success) {
            alert('値下げ交渉を拒否しました');
            showNegotiations(document.querySelector('.nego-tab.text-red-500')?.dataset?.negoTab || 'received');
        }
    } catch (error) {
        console.error('Failed to reject negotiation:', error);
        alert('値下げ交渉の拒否に失敗しました');
    }
}

// カウンターオファーモーダルを表示
function showCounterOfferModal(negotiationId, requestedPrice) {
    const modal = `
        <div id="counter-offer-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target.id === 'counter-offer-modal') closeCounterOfferModal()">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold text-gray-900 mb-4">カウンターオファー</h3>
                <p class="text-sm text-gray-600 mb-4">希望価格: ¥${formatPrice(requestedPrice)}</p>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">提示価格</label>
                    <div class="relative">
                        <span class="absolute left-3 top-3 text-gray-500">¥</span>
                        <input type="number" id="counter-price-input" class="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="価格を入力">
                    </div>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">メッセージ（任意）</label>
                    <textarea id="counter-message-input" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none" rows="3" placeholder="カウンターオファーの理由など"></textarea>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="closeCounterOfferModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors">
                        キャンセル
                    </button>
                    <button onclick="submitCounterOffer(${negotiationId})" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors">
                        提示する
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// カウンターオファーモーダルを閉じる
function closeCounterOfferModal() {
    const modal = document.getElementById('counter-offer-modal');
    if (modal) {
        modal.remove();
    }
}

// カウンターオファーを送信
async function submitCounterOffer(negotiationId) {
    const counterPrice = parseInt(document.getElementById('counter-price-input').value);
    const message = document.getElementById('counter-message-input').value;
    
    if (!counterPrice || counterPrice <= 0) {
        alert('有効な価格を入力してください');
        return;
    }
    
    try {
        const response = await axios.put(`/api/negotiations/${negotiationId}`, {
            status: 'counter_offered',
            counter_price: counterPrice,
            message: message,
            seller_id: currentUserId
        });
        
        if (response.data.success) {
            alert('カウンターオファーを送信しました');
            closeCounterOfferModal();
            loadNegotiations('received');
        }
    } catch (error) {
        console.error('Failed to submit counter offer:', error);
        alert('カウンターオファーの送信に失敗しました');
    }
}

// カウンターオファーを承諾
async function acceptCounterOffer(negotiationId) {
    if (!confirm('このカウンターオファーを承諾しますか？')) return;
    
    try {
        const response = await axios.put(`/api/negotiations/${negotiationId}/accept-counter`, {
            buyer_id: currentUserId
        });
        
        if (response.data.success) {
            alert('カウンターオファーを承諾しました');
            loadNegotiations('sent');
        }
    } catch (error) {
        console.error('Failed to accept counter offer:', error);
        alert('カウンターオファーの承諾に失敗しました');
    }
}

// 取引詳細を表示
function viewTransactionDetail(transactionId) {
    window.location.href = `/transactions/${transactionId}`;
}

// ユーティリティ関数
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP').format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 秒単位の差
    
    if (diff < 60) return '今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;
    
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
