/**
 * 通知ページ - 認証ベース通知管理
 */

let currentUserId = null;
let token = null;
let allNotifications = [];
let currentFilter = 'all';

function getAuthHeaders() {
    return { headers: { 'Authorization': 'Bearer ' + token } };
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?redirect=' + encodeURIComponent('/notifications');
        return;
    }

    // ユーザー情報取得
    try {
        const res = await axios.get('/api/auth/me', getAuthHeaders());
        if (res.data.success) {
            const user = res.data.user || res.data.data;
            currentUserId = user.id;
            localStorage.setItem('user', JSON.stringify(user));
            loadNotifications();
        } else {
            throw new Error('auth failed');
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        if (e?.response?.status === 401) {
            localStorage.removeItem('token');
        }
        window.location.href = '/login?redirect=' + encodeURIComponent('/notifications');
    }
});

// 通知を読み込み（認証ベースAPIを使用）
async function loadNotifications() {
    try {
        const response = await axios.get('/api/notifications/me', getAuthHeaders());

        if (response.data.success) {
            allNotifications = response.data.data || [];
            renderNotifications();
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
        document.getElementById('notifications-container').innerHTML =
            '<div class="text-center py-12 text-red-500"><i class="fas fa-exclamation-circle text-4xl mb-4"></i><p>通知の読み込みに失敗しました</p></div>';
    }
}

// 通知をフィルタリング
function filterNotifications(filter) {
    currentFilter = filter;

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

    let filtered = allNotifications;

    if (currentFilter === 'unread') {
        filtered = allNotifications.filter(n => !n.is_read);
    } else if (currentFilter === 'comment') {
        filtered = allNotifications.filter(n =>
            n.type === 'comment' || n.type === 'comment_reply'
        );
    } else if (currentFilter === 'negotiation') {
        filtered = allNotifications.filter(n =>
            n.type === 'price_offer' ||
            n.type === 'price_accepted' ||
            n.type === 'price_rejected' ||
            n.type === 'price_counter_offered' ||
            n.type === 'negotiation'
        );
    } else if (currentFilter === 'transaction') {
        filtered = allNotifications.filter(n =>
            n.type === 'transaction' ||
            n.type === 'purchase' ||
            n.type === 'payment' ||
            n.type === 'shipped' ||
            n.type === 'completed' ||
            n.type === 'message'
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="far fa-bell-slash text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg font-semibold mb-2">通知はありません</p>
                <p class="text-gray-400 text-sm">${currentFilter === 'unread' ? '未読の' : ''}通知が届いたらここに表示されます</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(notification => {
        const actionUrl = notification.action_url || '';
        const safeUrl = actionUrl.replace(/'/g, "\\'");
        return `
        <div onclick="handleNotificationClick(${notification.id}, '${safeUrl}')"
             class="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer ${notification.is_read ? '' : 'border-l-4 border-red-500'}">
            <div class="flex items-start gap-3 sm:gap-4">
                <div class="flex-shrink-0">
                    ${getNotificationIcon(notification.type)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1 gap-2">
                        <h3 class="font-semibold text-gray-900 text-sm sm:text-base truncate ${notification.is_read ? '' : 'font-bold'}">${escapeHtml(notification.title || '')}</h3>
                        ${notification.is_read ? '' : '<span class="flex-shrink-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>'}
                    </div>
                    <p class="text-gray-700 text-sm mb-2 line-clamp-2">${escapeHtml(notification.message || '')}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-400">
                            <i class="far fa-clock mr-1"></i>${formatDate(notification.created_at)}
                        </span>
                        ${actionUrl ? `
                            <span class="text-xs text-blue-600 font-semibold">
                                詳細を見る <i class="fas fa-chevron-right ml-1"></i>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

function getNotificationIcon(type) {
    const iconConfig = {
        'comment':              { icon: 'fa-comment',         color: 'bg-blue-100 text-blue-600' },
        'comment_reply':        { icon: 'fa-reply',           color: 'bg-blue-100 text-blue-600' },
        'price_offer':          { icon: 'fa-tag',             color: 'bg-yellow-100 text-yellow-600' },
        'price_accepted':       { icon: 'fa-check-circle',    color: 'bg-green-100 text-green-600' },
        'price_rejected':       { icon: 'fa-times-circle',    color: 'bg-red-100 text-red-600' },
        'price_counter_offered':{ icon: 'fa-handshake',       color: 'bg-purple-100 text-purple-600' },
        'negotiation':          { icon: 'fa-handshake',       color: 'bg-yellow-100 text-yellow-600' },
        'purchase':             { icon: 'fa-shopping-cart',    color: 'bg-green-100 text-green-600' },
        'payment':              { icon: 'fa-credit-card',      color: 'bg-blue-100 text-blue-600' },
        'transaction':          { icon: 'fa-exchange-alt',     color: 'bg-indigo-100 text-indigo-600' },
        'shipped':              { icon: 'fa-shipping-fast',    color: 'bg-purple-100 text-purple-600' },
        'completed':            { icon: 'fa-check-double',     color: 'bg-green-100 text-green-600' },
        'review':               { icon: 'fa-star',             color: 'bg-yellow-100 text-yellow-600' },
        'favorite':             { icon: 'fa-heart',            color: 'bg-pink-100 text-pink-600' },
        'message':              { icon: 'fa-envelope',         color: 'bg-blue-100 text-blue-600' },
        'withdrawal':           { icon: 'fa-money-check-alt',  color: 'bg-green-100 text-green-600' },
        'default':              { icon: 'fa-bell',             color: 'bg-gray-100 text-gray-600' }
    };

    const config = iconConfig[type] || iconConfig['default'];

    return `
        <div class="w-10 h-10 sm:w-12 sm:h-12 ${config.color} rounded-full flex items-center justify-center">
            <i class="fas ${config.icon} text-lg sm:text-xl"></i>
        </div>
    `;
}

// 通知クリック処理（fetch API使用）
async function handleNotificationClick(notificationId, actionUrl) {
    // トークンの有効性を再確認
    var currentToken = localStorage.getItem('token');
    if (!currentToken) {
        if (actionUrl) window.location.href = actionUrl;
        return;
    }
    token = currentToken;

    try {
        var res = await fetch('/api/notifications/' + notificationId + '/read', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            var data = await res.json().catch(function() { return {}; });
            if (data.success !== false) {
                var notification = allNotifications.find(function(n) { return n.id === notificationId; });
                if (notification) notification.is_read = true;
                if (window.__notifBadge) window.__notifBadge.refresh();
            }
        } else if (res.status === 401) {
            // トークン期限切れ: 再取得を試みる
            var retryToken = localStorage.getItem('token');
            if (retryToken && retryToken !== currentToken) {
                token = retryToken;
                var retryRes = await fetch('/api/notifications/' + notificationId + '/read', {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + retryToken,
                        'Content-Type': 'application/json'
                    }
                });
                if (retryRes.ok) {
                    var notification = allNotifications.find(function(n) { return n.id === notificationId; });
                    if (notification) notification.is_read = true;
                    if (window.__notifBadge) window.__notifBadge.refresh();
                }
            } else {
                localStorage.removeItem('token');
                token = null;
            }
        }
    } catch (error) {
        console.error('Failed to mark as read:', error);
    }
    // エラーでもナビゲーションは実行
    if (actionUrl) window.location.href = actionUrl;
    else renderNotifications();
}

// すべて既読にする（fetch API使用）
async function markAllAsRead() {
    var unreadCount = allNotifications.filter(function(n) { return !n.is_read; }).length;
    if (unreadCount === 0) {
        showToast('未読の通知はありません', 'info');
        return;
    }

    if (!confirm(unreadCount + '件の通知をすべて既読にしますか？')) return;

    // トークンの有効性を再確認
    var currentToken = localStorage.getItem('token');
    if (!currentToken) {
        showToast('ログインセッションが切れました。再ログインしてください。', 'error');
        setTimeout(function() { window.location.href = '/login?redirect=/notifications'; }, 1500);
        return;
    }
    token = currentToken;

    try {
        var res = await fetch('/api/notifications/read-all', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 401) {
            // トークンが変わっている可能性があるので再取得して再試行
            var refreshedToken = localStorage.getItem('token');
            if (refreshedToken && refreshedToken !== currentToken) {
                token = refreshedToken;
                res = await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + refreshedToken,
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (res.status === 401) {
                showToast('ログインセッションが切れました。再ログインしてください。', 'error');
                localStorage.removeItem('token');
                token = null;
                setTimeout(function() { window.location.href = '/login?redirect=/notifications'; }, 1500);
                return;
            }
        }

        var data = null;
        try {
            data = await res.json();
        } catch (parseError) {
            console.error('Response parse error:', parseError, 'status:', res.status);
            // JSONパース失敗でも200系ならOKとみなす
            if (res.ok) {
                data = { success: true };
            } else {
                showToast('サーバーエラーが発生しました（' + res.status + '）。再度お試しください。', 'error');
                return;
            }
        }

        if (data && data.success) {
            allNotifications.forEach(function(n) { n.is_read = true; });
            renderNotifications();
            showToast('すべての通知を既読にしました', 'success');
            if (window.__notifBadge) window.__notifBadge.refresh();
        } else if (data) {
            showToast(data.error || '既読処理に失敗しました。再度お試しください。', 'error');
        }
    } catch (error) {
        console.error('markAllAsRead error:', error);
        showToast('ネットワークエラーが発生しました。再度お試しください。', 'error');
    }
}

// トースト通知
function showToast(message, type) {
    var colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
    var toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-semibold transition-all';
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(function() { toast.remove(); }, 300); }, 2500);
}

// XSS対策
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 日付フォーマット
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'たった今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
