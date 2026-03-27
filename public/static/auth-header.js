/**
 * 共通ヘッダー認証UI
 * 全ページで読み込み、ログイン状態に応じてヘッダー右側にマイページ/ログアウトまたはログインボタンを表示
 */
(function() {
    'use strict';
    
    // TOPページ・マイページは独自の実装があるのでスキップ
    if (document.getElementById('header-guest') && document.getElementById('header-user')) {
        return;
    }
    // 既に挿入済みならスキップ
    if (document.getElementById('page-auth-buttons')) return;

    var token = localStorage.getItem('token');
    var user = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch(e) {}

    // ヘッダーを検出
    var header = document.querySelector('header');
    if (!header) return;

    // ヘッダー内の最初のdiv（レイアウトコンテナ）
    var headerInner = header.querySelector(':scope > div');
    if (!headerInner) return;

    // 既存のスペーサー（w-16の空div）を探す
    var spacer = headerInner.querySelector('div.w-16');
    
    // 認証ボタンコンテナを作成
    var authContainer = document.createElement('div');
    authContainer.className = 'flex items-center gap-1.5 flex-shrink-0 ml-2';
    authContainer.id = 'page-auth-buttons';

    var btnHtml = '';
    
    if (token && (user || true)) {
        // ログイン済み（またはトークンあり）: マイページボタン + ログアウトボタン
        var displayName = '';
        if (user) {
            displayName = escName(user.nickname || user.company_name || user.name || 'マイページ');
        } else {
            displayName = 'マイページ';
        }
        btnHtml = 
            '<a href="/mypage" class="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md text-xs font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-sm whitespace-nowrap" style="font-size:11px;line-height:1.4;">' +
                '<i class="fas fa-user-circle" style="font-size:12px;"></i>' +
                '<span class="hidden sm:inline">' + displayName + '</span>' +
                '<span class="sm:hidden">MY</span>' +
            '</a>' +
            '<button onclick="window.__authHeaderLogout()" class="p-1 text-gray-400 hover:text-red-500 transition-colors" title="ログアウト" style="font-size:13px;">' +
                '<i class="fas fa-sign-out-alt"></i>' +
            '</button>';
        
        // user情報がない場合はバックグラウンドで取得
        if (!user) fetchUser(token);
    } else {
        // 未ログイン: ログインボタン
        btnHtml = 
            '<a href="/login" class="flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 rounded-md text-xs font-semibold hover:border-red-500 hover:text-red-500 transition-all whitespace-nowrap" style="font-size:11px;line-height:1.4;">' +
                '<i class="fas fa-sign-in-alt" style="font-size:12px;"></i>' +
                '<span class="hidden sm:inline">ログイン</span>' +
            '</a>';
    }
    
    authContainer.innerHTML = btnHtml;

    // 挿入位置を決定
    if (spacer) {
        // スペーサーがあれば置換
        spacer.parentNode.replaceChild(authContainer, spacer);
    } else {
        // 最後の子要素として追加（flex + justify-betweenの場合は最後に来る）
        headerInner.appendChild(authContainer);
    }

    // ログアウト関数をグローバルに定義
    window.__authHeaderLogout = function() {
        var t = localStorage.getItem('token');
        if (t && typeof axios !== 'undefined') {
            axios.post('/api/auth/logout', {}, { headers: { Authorization: 'Bearer ' + t } }).catch(function(){});
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    function fetchUser(tok) {
        if (typeof axios === 'undefined') return;
        axios.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + tok } })
            .then(function(res) {
                if (res.data && res.data.success) {
                    var u = res.data.user || res.data.data;
                    if (u) localStorage.setItem('user', JSON.stringify(u));
                }
            })
            .catch(function(err) {
                if (err && err.response && err.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    location.reload();
                }
            });
    }

    function escName(name) {
        if (!name) return 'マイページ';
        var d = document.createElement('div');
        var n = name.length > 8 ? name.substring(0, 8) + '…' : name;
        d.textContent = n;
        return d.innerHTML;
    }
})();
