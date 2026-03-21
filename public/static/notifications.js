/**
 * 通知ページ - リアルタイム通知管理
 */

// 現在のユーザーID（実際の実装では認証から取得）
const currentUserId = 1;

// グローバル状態
let allNotifications = [];
let currentFilter = 'all';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
});

// 通知を読み込み
async function loadNotifications() {
    try {
        const response = await axios.get(`/api/notifications/${currentUserId}`);
        
        if (response.data.success) {
            allNotifications = response.data.data || [];
            renderNotifications();
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
        document.getElementById('notifications-container').innerHTML = 
            '<div class="text-center py-12 text-red-500">通知の読み込みに失敗しました</div>';
    }
}

// 通知をフィルタリング
function filterNotifications(filter) {
    currentFilter = filter;
    
    // タブUIを更新
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('text-red-500', 'border-red-500');
        tab.classList.add('text-gray-600', 'border-transparent');
    });
    
    const activeTab = document.querySelector(`.filter-tab[data-filter="${filter}"]`);
    if (activeTab) {
        activeTab.classList.remove('text-gray-600', 'border-transparent');
        activeTab.classList.add('text-red-500', 'border-red-500');
    }
    
    renderNotifications();
}

// 通知を表示
function renderNotifications() {
    const container = document.getElementById('notifications-container');
    
    // フィルタリング
    let filteredNotifications = allNotifications;
    
    if (currentFilter === 'unread') {
        filteredNotifications = allNotifications.filter(n => !n.is_read);
    } else if (currentFilter === 'comment') {
        filteredNotifications = allNotifications.filter(n => n.type === 'comment' || n.type === 'comment_reply');
    } else if (currentFilter === 'negotiation') {
        filteredNotifications = allNotifications.filter(n => 
            n.type === 'price_offer' || 
            n.type === 'price_accepted' || 
            n.type === 'price_rejected' ||
            n.type === 'price_counter_offered'
        );
    } else if (currentFilter === 'transaction') {
        filteredNotifications = allNotifications.filter(n => 
            n.type === 'purchase' || 
            n.type === 'payment' || 
            n.type === 'shipped' ||
            n.type === 'completed'
        );
    }
    
    if (filteredNotifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="far fa-bell-slash text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg font-semibold mb-2">通知はありません</p>
                <p class="text-gray-400 text-sm">${currentFilter === 'unread' ? '未読の' : ''}通知が届いたらここに表示されます</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredNotifications.map(notification => `
        <div onclick="handleNotificationClick(${notification.id}, '${notification.action_url || ''}')" 
             class="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer ${notification.is_read ? '' : 'border-l-4 border-red-500'}">
            <div class="flex items-start gap-4">
                <!-- アイコン -->
                <div class="flex-shrink-0">
                    ${getNotificationIcon(notification.type)}
                </div>
                
                <!-- 内容 -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="font-semibold text-gray-900 ${notification.is_read ? '' : 'font-bold'}">${notification.title}</h3>
                        ${notification.is_read ? '' : '<span class="flex-shrink-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">NEW</span>'}
                    </div>
                    <p class="text-gray-700 text-sm mb-2">${notification.message}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">
                            <i class="far fa-clock mr-1"></i>${formatDate(notification.created_at)}
                        </span>
                        ${notification.action_url ? `
                            <span class="text-xs text-blue-600 font-semibold">
                                詳細を見る <i class="fas fa-chevron-right ml-1"></i>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 通知タイプに応じたアイコンを返す
function getNotificationIcon(type) {
    const iconConfig = {
        'comment': { icon: 'fa-comment', color: 'bg-blue-100 text-blue-600' },
        'comment_reply': { icon: 'fa-reply', color: 'bg-blue-100 text-blue-600' },
        'price_offer': { icon: 'fa-tag', color: 'bg-yellow-100 text-yellow-600' },
        'price_accepted': { icon: 'fa-check-circle', color: 'bg-green-100 text-green-600' },
        'price_rejected': { icon: 'fa-times-circle', color: 'bg-red-100 text-red-600' },
        'price_counter_offered': { icon: 'fa-handshake', color: 'bg-purple-100 text-purple-600' },
        'purchase': { icon: 'fa-shopping-cart', color: 'bg-green-100 text-green-600' },
        'payment': { icon: 'fa-credit-card', color: 'bg-blue-100 text-blue-600' },
        'shipped': { icon: 'fa-shipping-fast', color: 'bg-purple-100 text-purple-600' },
        'completed': { icon: 'fa-check-double', color: 'bg-green-100 text-green-600' },
        'review': { icon: 'fa-star', color: 'bg-yellow-100 text-yellow-600' },
        'favorite': { icon: 'fa-heart', color: 'bg-pink-100 text-pink-600' },
        'message': { icon: 'fa-envelope', color: 'bg-blue-100 text-blue-600' },
        'withdrawal': { icon: 'fa-money-check-alt', color: 'bg-green-100 text-green-600' },
        'default': { icon: 'fa-bell', color: 'bg-gray-100 text-gray-600' }
    };
    
    const config = iconConfig[type] || iconConfig['default'];
    
    return `
        <div class="w-12 h-12 ${config.color} rounded-full flex items-center justify-center">
            <i class="fas ${config.icon} text-xl"></i>
        </div>
    `;
}

// 通知クリック処理
async function handleNotificationClick(notificationId, actionUrl) {
    try {
        // 既読にする
        await axios.put(`/api/notifications/${notificationId}/read`, {
            user_id: currentUserId
        });
        
        // 通知リストを更新
        const notification = allNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.is_read = true;
        }
        
        // アクションURLがあれば遷移
        if (actionUrl) {
            window.location.href = actionUrl;
        } else {
            // URLがない場合はUIだけ更新
            renderNotifications();
        }
    } catch (error) {
        console.error('Failed to mark as read:', error);
    }
}

// すべて既読にする
async function markAllAsRead() {
    if (allNotifications.filter(n => !n.is_read).length === 0) {
        alert('既読にする通知がありません');
        return;
    }
    
    if (!confirm('すべての通知を既読にしますか？')) return;
    
    try {
        const response = await axios.put(`/api/notifications/read-all`, {
            user_id: currentUserId
        });
        
        if (response.data.success) {
            // すべての通知を既読にする
            allNotifications.forEach(n => n.is_read = true);
            renderNotifications();
            alert('すべての通知を既読にしました');
        }
    } catch (error) {
        console.error('Failed to mark all as read:', error);
        alert('既読処理に失敗しました');
    }
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 秒単位の差
    
    if (diff < 60) return 'たった今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;
    
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
