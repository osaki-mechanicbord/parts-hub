// 管理画面共通レイアウト

export const AdminHeader = (currentPage: string) => `
<header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-4">
            <i class="fas fa-shield-alt text-red-500 text-2xl"></i>
            <h1 class="text-xl font-bold text-gray-800">PARTS HUB 管理画面</h1>
        </div>
        <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600" id="admin-name">管理者</span>
            <button onclick="showPasswordModal()" class="text-sm text-gray-500 hover:text-gray-700" title="設定変更">
                <i class="fas fa-cog"></i>
            </button>
            <a href="/" class="text-sm text-gray-500 hover:text-gray-700">
                <i class="fas fa-home mr-1"></i>サイト
            </a>
            <button onclick="adminLogout()" class="text-sm text-red-500 hover:text-red-700 font-semibold">
                <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
            </button>
        </div>
    </div>
</header>
`;

export const AdminSidebar = (currentPage: string) => `
<aside class="w-64 bg-white shadow-lg min-h-screen">
    <nav class="p-4">
        <a href="/admin" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'dashboard' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-chart-line w-5"></i>
            <span class="ml-3 ${currentPage === 'dashboard' ? 'font-medium' : ''}">ダッシュボード</span>
        </a>
        <a href="/admin/users" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'users' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-users w-5"></i>
            <span class="ml-3 ${currentPage === 'users' ? 'font-medium' : ''}">ユーザー管理</span>
        </a>
        <a href="/admin/products" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'products' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-box w-5"></i>
            <span class="ml-3 ${currentPage === 'products' ? 'font-medium' : ''}">商品管理</span>
        </a>
        <a href="/admin/transactions" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'transactions' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-exchange-alt w-5"></i>
            <span class="ml-3 ${currentPage === 'transactions' ? 'font-medium' : ''}">取引管理</span>
        </a>
        <a href="/admin/reviews" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'reviews' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-star w-5"></i>
            <span class="ml-3 ${currentPage === 'reviews' ? 'font-medium' : ''}">レビュー管理</span>
        </a>
        <a href="/admin/reports" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'reports' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-flag w-5"></i>
            <span class="ml-3 ${currentPage === 'reports' ? 'font-medium' : ''}">通報管理</span>
        </a>
        <a href="/admin/articles" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'articles' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-newspaper w-5"></i>
            <span class="ml-3 ${currentPage === 'articles' ? 'font-medium' : ''}">コラム管理</span>
        </a>
        <a href="/admin/announcements" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'announcements' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-bullhorn w-5"></i>
            <span class="ml-3 ${currentPage === 'announcements' ? 'font-medium' : ''}">お知らせ管理</span>
        </a>
        <a href="/admin/invoice-orders" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'invoice-orders' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-file-invoice-dollar w-5"></i>
            <span class="ml-3 ${currentPage === 'invoice-orders' ? 'font-medium' : ''}">振込確認</span>
        </a>
        <a href="/admin/withdrawals" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'withdrawals' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-money-bill-wave w-5"></i>
            <span class="ml-3 ${currentPage === 'withdrawals' ? 'font-medium' : ''}">出金管理</span>
        </a>
        <a href="/admin/sales" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'sales' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-yen-sign w-5"></i>
            <span class="ml-3 ${currentPage === 'sales' ? 'font-medium' : ''}">売上レポート</span>
        </a>
        <div class="border-t border-gray-200 my-3"></div>
        <p class="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">広告管理</p>
        <a href="/admin/banners" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'banners' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-images w-5"></i>
            <span class="ml-3 ${currentPage === 'banners' ? 'font-medium' : ''}">バナー広告</span>
        </a>
        <div class="border-t border-gray-200 my-3"></div>
        <p class="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">越境EC</p>
        <a href="/admin/cross-border" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'cross-border' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-globe-americas w-5"></i>
            <span class="ml-3 ${currentPage === 'cross-border' ? 'font-medium' : ''}">越境EC管理</span>
        </a>
        <div class="border-t border-gray-200 my-3"></div>
        <p class="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">外部API連携</p>
        <a href="/admin/ebay" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'ebay' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fab fa-ebay w-5"></i>
            <span class="ml-3 ${currentPage === 'ebay' ? 'font-medium' : ''}">eBay連携</span>
        </a>
        <div class="border-t border-gray-200 my-3"></div>
        <p class="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">コンテンツ管理</p>
        <a href="/admin/franchise" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'franchise' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-handshake w-5"></i>
            <span class="ml-3 ${currentPage === 'franchise' ? 'font-medium' : ''}">フランチャイズ</span>
        </a>
        <a href="/admin/guides" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'guides' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-book-open w-5"></i>
            <span class="ml-3 ${currentPage === 'guides' ? 'font-medium' : ''}">整備ガイド</span>
        </a>
        <a href="/admin/partners" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'partners' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-user-tie w-5"></i>
            <span class="ml-3 ${currentPage === 'partners' ? 'font-medium' : ''}">パートナー管理</span>
        </a>
    </nav>
</aside>
`;

// パスワード変更モーダル
export const AdminPasswordModal = () => `
<div id="password-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[100] hidden flex items-center justify-center">
    <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-cog mr-2"></i>管理者設定変更</h3>
        <div id="pw-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm"></div>
        <div id="pw-success" class="hidden bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-3 text-sm"></div>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">新しいログイン名（変更する場合のみ）</label>
                <input type="text" id="new-username" class="w-full px-3 py-2 border rounded-lg" placeholder="現在のログイン名のまま">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">現在のパスワード <span class="text-red-500">*</span></label>
                <input type="password" id="current-password" class="w-full px-3 py-2 border rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（変更する場合のみ）</label>
                <input type="password" id="new-password" class="w-full px-3 py-2 border rounded-lg" placeholder="8文字以上">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
                <input type="password" id="new-password-confirm" class="w-full px-3 py-2 border rounded-lg">
            </div>
        </div>
        <div class="flex space-x-3 mt-6">
            <button onclick="closePasswordModal()" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">キャンセル</button>
            <button onclick="changeAdminPassword()" id="pw-save-btn" class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">保存</button>
        </div>
    </div>
</div>
`;

// 管理者認証チェック・共通JS（body末尾用：ログアウト・パスワード変更・XSSエスケープ）
export const AdminAuthScript = () => `
<script>
    // XSSエスケープ関数（全管理画面で使用）
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    // ログアウト
    function adminLogout() {
        if (confirm('ログアウトしますか？')) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_username');
            window.location.href = '/admin/login';
        }
    }

    // パスワード変更モーダル
    function showPasswordModal() {
        document.getElementById('password-modal').classList.remove('hidden');
        document.getElementById('pw-error').classList.add('hidden');
        document.getElementById('pw-success').classList.add('hidden');
    }
    function closePasswordModal() {
        document.getElementById('password-modal').classList.add('hidden');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('new-password-confirm').value = '';
        document.getElementById('new-username').value = '';
    }
    async function changeAdminPassword() {
        const errEl = document.getElementById('pw-error');
        const sucEl = document.getElementById('pw-success');
        errEl.classList.add('hidden');
        sucEl.classList.add('hidden');

        const currentPw = document.getElementById('current-password').value;
        const newPw = document.getElementById('new-password').value;
        const newPwConfirm = document.getElementById('new-password-confirm').value;
        const newUsername = document.getElementById('new-username').value;

        if (!currentPw) {
            errEl.textContent = '現在のパスワードを入力してください';
            errEl.classList.remove('hidden');
            return;
        }
        if (newPw && newPw !== newPwConfirm) {
            errEl.textContent = '新しいパスワードが一致しません';
            errEl.classList.remove('hidden');
            return;
        }
        if (newPw && newPw.length < 8) {
            errEl.textContent = 'パスワードは8文字以上にしてください';
            errEl.classList.remove('hidden');
            return;
        }
        if (!newPw && !newUsername) {
            errEl.textContent = '変更する項目を入力してください';
            errEl.classList.remove('hidden');
            return;
        }

        const btn = document.getElementById('pw-save-btn');
        btn.disabled = true;
        btn.textContent = '保存中...';

        try {
            const body = { current_password: currentPw };
            if (newPw) body.new_password = newPw;
            if (newUsername) body.new_username = newUsername;

            const res = await axios.post('/api/admin/change-password', body);
            if (res.data.success) {
                sucEl.textContent = res.data.message;
                sucEl.classList.remove('hidden');
                if (newUsername) {
                    localStorage.setItem('admin_username', newUsername);
                    const el = document.getElementById('admin-name');
                    if (el) el.textContent = '管理者: ' + newUsername;
                }
                if (newPw) {
                    sucEl.textContent += ' 2秒後に再ログインします...';
                    setTimeout(() => {
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_username');
                        window.location.href = '/admin/login';
                    }, 2000);
                }
            }
        } catch (err) {
            errEl.textContent = err.response?.data?.error || '設定変更に失敗しました';
            errEl.classList.remove('hidden');
        }
        btn.disabled = false;
        btn.textContent = '保存';
    }
</script>
`;

export const AdminLayout = (currentPage: string, title: string, content: string) => `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - PARTS HUB 管理画面</title>
    <meta name="robots" content="noindex, nofollow">
    <script>
        // 認証チェック（ページ描画前に実行 - 最優先）
        (function() {
            var t = localStorage.getItem('admin_token');
            if (!t) {
                document.documentElement.style.display = 'none';
                window.location.replace('/admin/login');
                throw new Error('not authenticated');
            }
        })();
    </script>
    <link rel="stylesheet" href="/static/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // axios認証ヘッダーとインターセプター設定（DOMContentLoadedより前に実行）
        (function() {
            var adminToken = localStorage.getItem('admin_token');
            if (!adminToken) return;
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + adminToken;
            // 401エラー時にトークン削除してリダイレクト（1回だけ）
            var redirecting = false;
            axios.interceptors.response.use(
                function(response) { return response; },
                function(error) {
                    if (error.response && error.response.status === 401 && !redirecting) {
                        redirecting = true;
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_username');
                        window.location.replace('/admin/login');
                    }
                    return Promise.reject(error);
                }
            );
            // ユーザー名を後から表示
            document.addEventListener('DOMContentLoaded', function() {
                var el = document.getElementById('admin-name');
                if (el) el.textContent = '管理者: ' + (localStorage.getItem('admin_username') || 'admin');
            });
        })();
    </script>
</head>
<body class="bg-gray-100">
    ${AdminHeader(currentPage)}
    <div class="flex">
        ${AdminSidebar(currentPage)}
        <main class="flex-1 p-8">
            ${content}
        </main>
    </div>
    ${AdminPasswordModal()}
    ${AdminAuthScript()}
</body>
</html>
`;
