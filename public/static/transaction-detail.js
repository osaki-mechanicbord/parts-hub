/**
 * 取引詳細ページ
 */

// 現在のユーザーID（実際の実装では認証から取得）
const currentUserId = 1;

// 取引ID（URLから取得）
const pathParts = window.location.pathname.split('/');
const transactionId = pathParts[pathParts.length - 1];

// グローバル状態
let transactionData = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadTransaction();
});

// 取引情報を読み込み
async function loadTransaction() {
    try {
        const response = await axios.get(`/api/transactions/${transactionId}`);
        
        if (response.data.success) {
            transactionData = response.data.data;
            renderTransaction();
        } else {
            throw new Error(response.data.error || '取引情報の取得に失敗しました');
        }
    } catch (error) {
        console.error('Failed to load transaction:', error);
        document.getElementById('main-content').innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-circle text-6xl mb-4"></i>
                <p class="text-lg font-semibold">${error.message || '取引情報の読み込みに失敗しました'}</p>
            </div>
        `;
    }
}

// 取引情報を表示
function renderTransaction() {
    const isBuyer = transactionData.buyer_id === currentUserId;
    const isSeller = transactionData.seller_id === currentUserId;
    
    document.getElementById('main-content').innerHTML = `
        <!-- 商品情報 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">商品情報</h2>
            <div class="flex items-center gap-4">
                <img src="${transactionData.product_image || '/icons/icon-192x192.png'}" 
                     alt="${transactionData.product_title}" 
                     class="w-24 h-24 object-cover rounded-lg">
                <div class="flex-1">
                    <h3 class="font-bold text-lg text-gray-900 mb-2">${transactionData.product_title}</h3>
                    <div class="text-2xl font-bold text-red-500 mb-2">¥${formatPrice(transactionData.total_amount)}</div>
                    <div class="text-sm text-gray-600">
                        取引日: ${formatDate(transactionData.created_at)}
                    </div>
                </div>
            </div>
        </div>

        <!-- 取引ステータス -->
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">取引ステータス</h2>
            ${renderStatusTimeline()}
        </div>

        <!-- 配送情報 -->
        ${transactionData.tracking_number ? `
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h2 class="text-lg font-bold text-gray-900 mb-4">配送情報</h2>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-shipping-fast text-blue-600"></i>
                        <span class="font-semibold text-blue-900">追跡番号</span>
                    </div>
                    <div class="text-lg font-mono font-bold text-blue-600">${transactionData.tracking_number}</div>
                </div>
            </div>
        ` : ''}

        <!-- 取引相手情報 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">${isBuyer ? '出品者' : '購入者'}情報</h2>
            <div class="space-y-3">
                <div class="flex items-center gap-2">
                    <i class="fas fa-store text-gray-600"></i>
                    <span class="font-semibold">${isBuyer ? transactionData.seller_name : transactionData.buyer_name}</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-envelope text-gray-600"></i>
                    <span>${isBuyer ? transactionData.seller_email : transactionData.buyer_email}</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-phone text-gray-600"></i>
                    <span>${isBuyer ? transactionData.seller_phone : transactionData.buyer_phone}</span>
                </div>
            </div>
        </div>

        <!-- アクションボタン -->
        ${renderActionButtons(isBuyer, isSeller)}
    `;
}

// ステータスタイムラインを表示
function renderStatusTimeline() {
    const statuses = [
        { key: 'pending', label: '注文受付', icon: 'fa-shopping-cart', date: transactionData.created_at },
        { key: 'paid', label: '支払い完了', icon: 'fa-credit-card', date: transactionData.paid_at },
        { key: 'shipped', label: '発送済み', icon: 'fa-shipping-fast', date: transactionData.shipped_at },
        { key: 'completed', label: '取引完了', icon: 'fa-check-circle', date: transactionData.completed_at }
    ];
    
    const currentStatusIndex = statuses.findIndex(s => s.key === transactionData.status);
    
    return `
        <div class="space-y-4">
            ${statuses.map((status, index) => {
                const isActive = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return `
                    <div class="flex items-center gap-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                        }">
                            <i class="fas ${status.icon} text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}">${status.label}</div>
                            ${status.date ? `<div class="text-sm text-gray-600">${formatDateTime(status.date)}</div>` : ''}
                        </div>
                        ${isCurrent ? '<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">現在</span>' : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// アクションボタンを表示
function renderActionButtons(isBuyer, isSeller) {
    let buttons = [];
    
    // 出品者アクション
    if (isSeller) {
        if (transactionData.status === 'paid') {
            buttons.push(`
                <button onclick="showShippingModal()" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-all">
                    <i class="fas fa-shipping-fast mr-2"></i>発送完了を報告
                </button>
            `);
        }
    }
    
    // 購入者アクション
    if (isBuyer) {
        if (transactionData.status === 'shipped') {
            buttons.push(`
                <button onclick="completeTransaction()" class="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-all">
                    <i class="fas fa-check-circle mr-2"></i>受取完了
                </button>
            `);
        }
        
        if (transactionData.status === 'completed' && !transactionData.has_review) {
            buttons.push(`
                <button onclick="window.location.href='/reviews/new?transaction=${transactionId}'" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-all">
                    <i class="fas fa-star mr-2"></i>レビューを書く
                </button>
            `);
        }
    }
    
    // チャットボタン（両方）
    buttons.push(`
        <button onclick="alert('チャット機能は実装中です')" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-lg font-bold text-lg shadow transition-all">
            <i class="fas fa-comments mr-2"></i>メッセージを送る
        </button>
    `);
    
    if (buttons.length === 0) {
        return '';
    }
    
    return `
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">アクション</h2>
            <div class="space-y-3">
                ${buttons.join('')}
            </div>
        </div>
    `;
}

// 発送モーダルを表示
function showShippingModal() {
    const modal = `
        <div id="shipping-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="if(event.target.id === 'shipping-modal') closeShippingModal()">
            <div class="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 class="text-xl font-bold text-gray-900 mb-4">発送完了を報告</h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">追跡番号（任意）</label>
                    <input type="text" id="tracking-number-input" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="1234-5678-9012">
                    <p class="text-xs text-gray-500 mt-1">ヤマト運輸、佐川急便などの追跡番号</p>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="closeShippingModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors">
                        キャンセル
                    </button>
                    <button onclick="submitShipping()" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors">
                        発送完了
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// 発送モーダルを閉じる
function closeShippingModal() {
    const modal = document.getElementById('shipping-modal');
    if (modal) {
        modal.remove();
    }
}

// 発送完了を送信
async function submitShipping() {
    const trackingNumber = document.getElementById('tracking-number-input').value.trim();
    
    try {
        const response = await axios.put(`/api/transactions/${transactionId}/status`, {
            status: 'shipped',
            user_id: currentUserId,
            tracking_number: trackingNumber || null
        });
        
        if (response.data.success) {
            alert('発送完了を報告しました');
            closeShippingModal();
            loadTransaction();
        } else {
            throw new Error(response.data.error || '発送報告に失敗しました');
        }
    } catch (error) {
        console.error('Failed to submit shipping:', error);
        alert(error.message || '発送報告に失敗しました');
    }
}

// 取引完了
async function completeTransaction() {
    if (!confirm('商品を受け取りましたか？\n取引を完了すると取り消せません。')) return;
    
    try {
        const response = await axios.put(`/api/transactions/${transactionId}/status`, {
            status: 'completed',
            user_id: currentUserId
        });
        
        if (response.data.success) {
            alert('取引が完了しました。レビューをお願いします。');
            loadTransaction();
        } else {
            throw new Error(response.data.error || '取引完了に失敗しました');
        }
    } catch (error) {
        console.error('Failed to complete transaction:', error);
        alert(error.message || '取引完了に失敗しました');
    }
}

// ユーティリティ関数
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP').format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}
