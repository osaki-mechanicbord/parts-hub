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

    // 言語切替ボタンを追加
    var langBtn = document.createElement('div');
    langBtn.className = 'relative flex-shrink-0';
    langBtn.style.cssText = 'margin-right:2px;';
    var currentLang = localStorage.getItem('parts_hub_lang') || 'ja';
    var flags = { ja: '🇯🇵', en: '🇺🇸', zh: '🇨🇳', ko: '🇰🇷' };
    langBtn.innerHTML =
        '<button onclick="event.stopPropagation();var m=this.nextElementSibling;m.classList.toggle(\'hidden\')" class="p-1 text-gray-400 hover:text-primary transition-colors" title="Language" style="font-size:14px;">' +
            '<i class="fas fa-globe"></i>' +
        '</button>' +
        '<div class="hidden absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden" style="min-width:130px;" id="auth-header-lang-menu">' +
            [['ja','🇯🇵','日本語'],['en','🇺🇸','English'],['zh','🇨🇳','中文'],['ko','🇰🇷','한국어']].map(function(l) {
                return '<button data-lang="' + l[0] + '" style="display:flex;align-items:center;gap:6px;width:100%;padding:8px 12px;border:none;background:' + (l[0]===currentLang?'#fef2f2':'#fff') + ';cursor:pointer;font-size:13px;color:#374151;text-align:left;">' + l[1] + ' ' + l[2] + (l[0]===currentLang?' <span style="margin-left:auto;color:#ef4444;">✓</span>':'') + '</button>';
            }).join('') +
        '</div>';
    // 言語メニュークリックイベント
    setTimeout(function() {
        var lm = document.getElementById('auth-header-lang-menu');
        if (!lm) return;
        lm.querySelectorAll('button').forEach(function(b) {
            b.onclick = function(e) {
                e.stopPropagation();
                var lang = this.getAttribute('data-lang');
                if (lang !== currentLang) {
                    localStorage.setItem('parts_hub_lang', lang);
                    location.reload();
                }
            };
        });
        document.addEventListener('click', function() { lm.classList.add('hidden'); });
    }, 0);

    // 挿入位置を決定
    if (spacer) {
        // スペーサーがあれば置換（言語+認証をまとめたコンテナで）
        var wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-1 flex-shrink-0';
        wrapper.appendChild(langBtn);
        wrapper.appendChild(authContainer);
        spacer.parentNode.replaceChild(wrapper, spacer);
    } else {
        // 最後の子要素として追加
        headerInner.appendChild(langBtn);
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
