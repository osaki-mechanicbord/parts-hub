// 商品管理ページ、取引管理ページ、その他の管理ページのルート

import { Hono } from 'hono'
import { AdminLayout } from '../admin-layout'

const adminPagesRoutes = new Hono()

// ダッシュボード（トップページ）
adminPagesRoutes.get('/', (c) => {
  const content = `
    <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">ダッシュボード</h2>
        <p class="text-gray-600">Parts Hub 管理画面へようこそ</p>
    </div>

    <!-- 統計カード -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-sm opacity-90">総売上</p>
                    <h3 class="text-3xl font-bold" id="total-sales">¥0</h3>
                </div>
                <div class="bg-white bg-opacity-20 rounded-full p-3">
                    <i class="fas fa-yen-sign text-2xl"></i>
                </div>
            </div>
            <p class="text-sm opacity-90">
                <span id="sales-growth" class="font-semibold">0%</span> vs 先月
            </p>
        </div>

        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-sm opacity-90">総ユーザー数</p>
                    <h3 class="text-3xl font-bold" id="total-users">0</h3>
                </div>
                <div class="bg-white bg-opacity-20 rounded-full p-3">
                    <i class="fas fa-users text-2xl"></i>
                </div>
            </div>
            <p class="text-sm opacity-90">
                <span id="users-growth" class="font-semibold">+0</span> 新規（今月）
            </p>
        </div>

        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-sm opacity-90">総商品数</p>
                    <h3 class="text-3xl font-bold" id="total-products">0</h3>
                </div>
                <div class="bg-white bg-opacity-20 rounded-full p-3">
                    <i class="fas fa-box text-2xl"></i>
                </div>
            </div>
            <p class="text-sm opacity-90">出品中の商品</p>
        </div>

        <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-sm opacity-90">総取引数</p>
                    <h3 class="text-3xl font-bold" id="total-transactions">0</h3>
                </div>
                <div class="bg-white bg-opacity-20 rounded-full p-3">
                    <i class="fas fa-exchange-alt text-2xl"></i>
                </div>
            </div>
            <p class="text-sm opacity-90">
                <span id="transactions-growth" class="font-semibold">0%</span> vs 先月
            </p>
        </div>
    </div>

    <!-- グラフエリア -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">月次売上推移</h3>
            <div style="position:relative;height:250px;width:100%">
                <canvas id="sales-chart"></canvas>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">新規ユーザー推移</h3>
            <div style="position:relative;height:250px;width:100%">
                <canvas id="users-chart"></canvas>
            </div>
        </div>
    </div>

    <!-- 最近のアクティビティ -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">最近の取引</h3>
            <div id="recent-transactions" class="space-y-3">
                <p class="text-gray-500 text-center py-4">読み込み中...</p>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">新規登録ユーザー</h3>
            <div id="recent-users" class="space-y-3">
                <p class="text-gray-500 text-center py-4">読み込み中...</p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- axiosはAdminLayoutの<head>で読み込み済み。ここで再読み込みすると認証ヘッダーが消えるので不要 -->
    <script>
        let salesChart, usersChart;

        async function loadDashboard() {
            try {
                // 統計データ取得
                const statsRes = await axios.get('/api/admin/stats');
                const stats = statsRes.data;

                // 統計カード更新
                document.getElementById('total-sales').textContent = '¥' + stats.totalSales.toLocaleString();
                document.getElementById('sales-growth').textContent = (stats.salesGrowth >= 0 ? '+' : '') + stats.salesGrowth + '%';
                document.getElementById('total-users').textContent = stats.totalUsers || 0;
                document.getElementById('users-growth').textContent = '+' + (stats.newUsers || 0);
                document.getElementById('total-products').textContent = stats.totalProducts || 0;
                document.getElementById('total-transactions').textContent = stats.totalTransactions || 0;
                document.getElementById('transactions-growth').textContent = (stats.transactionsGrowth >= 0 ? '+' : '') + stats.transactionsGrowth + '%';

                // グラフ初期化
                initCharts(stats);

                // 最近のアクティビティ
                await loadRecentActivity();

            } catch (error) {
                console.error('ダッシュボード読み込みエラー:', error);
                // 401の場合はaxiosインターセプターがリダイレクトするのでalertは出さない
                if (error.response && error.response.status === 401) return;
                // それ以外のエラーのみ表示
                console.warn('データの読み込みに失敗しました');
            }
        }

        function initCharts(stats) {
            // 売上グラフ
            const salesCtx = document.getElementById('sales-chart').getContext('2d');
            salesChart = new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                    datasets: [{
                        label: '売上（円）',
                        data: stats.monthlySales || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });

            // ユーザーグラフ
            const usersCtx = document.getElementById('users-chart').getContext('2d');
            usersChart = new Chart(usersCtx, {
                type: 'bar',
                data: {
                    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                    datasets: [{
                        label: '新規ユーザー',
                        data: stats.monthlyUsers || [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
                        backgroundColor: 'rgba(34, 197, 94, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }

        async function loadRecentActivity() {
            try {
                // 最近の取引
                const txRes = await axios.get('/api/admin/transactions?limit=5');
                const transactions = txRes.data.transactions || [];
                const txHtml = transactions.length === 0 
                    ? '<p class="text-gray-500 text-center py-4">取引がありません</p>'
                    : transactions.map(tx => \`
                        <div class="flex items-center justify-between border-b pb-3">
                            <div>
                                <p class="font-medium text-gray-900">\${tx.product_title || '商品名不明'}</p>
                                <p class="text-sm text-gray-500">¥\${tx.amount.toLocaleString()}</p>
                            </div>
                            <span class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">\${tx.status}</span>
                        </div>
                    \`).join('');
                document.getElementById('recent-transactions').innerHTML = txHtml;

                // 新規ユーザー
                const usersRes = await axios.get('/api/admin/users?limit=5');
                const users = usersRes.data.users || [];
                const usersHtml = users.length === 0
                    ? '<p class="text-gray-500 text-center py-4">ユーザーがいません</p>'
                    : users.map(user => \`
                        <div class="flex items-center justify-between border-b pb-3">
                            <div>
                                <p class="font-medium text-gray-900">\${user.name}</p>
                                <p class="text-sm text-gray-500">\${user.email}</p>
                            </div>
                            <p class="text-xs text-gray-400">\${new Date(user.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                    \`).join('');
                document.getElementById('recent-users').innerHTML = usersHtml;

            } catch (error) {
                console.error('アクティビティ読み込みエラー:', error);
            }
        }

        // ページ読み込み時に実行
        document.addEventListener('DOMContentLoaded', loadDashboard);
    </script>
  `;

  return c.html(AdminLayout('dashboard', 'ダッシュボード', content));
});

// ユーザー管理ページ
adminPagesRoutes.get('/users', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">ユーザー管理</h2>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" id="search-input" placeholder="ユーザー名またはメールで検索..." class="px-4 py-2 border rounded-lg">
            <select id="status-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべてのステータス</option>
                <option value="active">有効</option>
                <option value="suspended">停止中</option>
                <option value="banned">禁止</option>
            </select>
            <select id="sort" class="px-4 py-2 border rounded-lg">
                <option value="created_desc">登録日（新しい順）</option>
                <option value="created_asc">登録日（古い順）</option>
                <option value="products_desc">商品数（多い順）</option>
            </select>
            <button onclick="searchUsers()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                <i class="fas fa-search mr-2"></i>検索
            </button>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow">
        <div class="overflow-x-auto">
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">会社名</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品数</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引数</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
                    <tr>
                        <td colspan="10" class="px-6 py-4 text-center">
                            <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                            <p class="text-gray-500 mt-2">読み込み中...</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="px-6 py-4 border-t">
            <div id="pagination" class="flex justify-center space-x-2"></div>
        </div>
    </div>

    <script>
        let currentPage = 1;
        let currentStatus = '';
        let currentSearch = '';
        let currentSort = 'created_desc';

        async function loadUsers(page = 1) {
            currentPage = page;
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '20',
                    status: currentStatus,
                    search: currentSearch,
                    sort: currentSort
                });
                
                const response = await axios.get('/api/admin/users?' + params);
                const data = response.data;
                
                if (!data.users) {
                    throw new Error('Invalid response format');
                }
                
                renderUsers(data.users);
                renderPagination(data.page, data.totalPages);
            } catch (error) {
                console.error('ユーザー読み込みエラー:', error);
                document.getElementById('users-table-body').innerHTML = 
                    '<tr><td colspan="10" class="px-6 py-4 text-center text-red-500">読み込みに失敗しました</td></tr>';
            }
        }

        function renderUsers(users) {
            const tbody = document.getElementById('users-table-body');
            
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-4 text-center text-gray-500">ユーザーが見つかりませんでした</td></tr>';
                return;
            }
            
            tbody.innerHTML = users.map(user => \`
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${user.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${user.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${user.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${user.phone || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${user.company_name || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${user.products_count || 0}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${user.transactions_count || 0}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded \${
                            user.status === 'active' ? 'bg-green-100 text-green-700' :
                            user.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }">
                            \${user.status === 'active' ? '有効' : 
                              user.status === 'suspended' ? '停止中' : '禁止'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        \${new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button onclick="viewUser(\${user.id})" class="text-blue-500 hover:underline mr-2" title="詳細">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="toggleUserStatus(\${user.id}, '\${user.status}')" 
                                class="text-\${user.status === 'active' ? 'yellow' : 'green'}-500 hover:underline mr-2" title="\${user.status === 'active' ? '停止' : '有効化'}">
                            <i class="fas fa-\${user.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button onclick="deleteUser(\${user.id}, '\${user.name}')" class="text-red-500 hover:underline" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            \`).join('');
        }

        function renderPagination(page, totalPages) {
            const pagination = document.getElementById('pagination');
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }
            
            let html = '';
            
            if (page > 1) {
                html += \`<button onclick="loadUsers(\${page - 1})" 
                        class="px-3 py-1 border rounded hover:bg-gray-100">前へ</button>\`;
            }
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === page) {
                    html += \`<button class="px-3 py-1 bg-red-500 text-white rounded">\${i}</button>\`;
                } else if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                    html += \`<button onclick="loadUsers(\${i})" 
                            class="px-3 py-1 border rounded hover:bg-gray-100">\${i}</button>\`;
                } else if (i === page - 3 || i === page + 3) {
                    html += \`<span class="px-3 py-1">...</span>\`;
                }
            }
            
            if (page < totalPages) {
                html += \`<button onclick="loadUsers(\${page + 1})" 
                        class="px-3 py-1 border rounded hover:bg-gray-100">次へ</button>\`;
            }
            
            pagination.innerHTML = html;
        }

        function searchUsers() {
            currentStatus = document.getElementById('status-filter').value;
            currentSearch = document.getElementById('search-input').value;
            currentSort = document.getElementById('sort').value;
            loadUsers(1);
        }

        function viewUser(id) {
            window.location.href = \`/admin/users/\${id}\`;
        }

        async function toggleUserStatus(id, currentStatus) {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            const action = newStatus === 'active' ? '有効化' : '停止';
            
            if (!confirm(\`このユーザーを\${action}しますか？\`)) {
                return;
            }
            
            try {
                await axios.put(\`/api/admin/users/\${id}/status\`, { status: newStatus });
                alert(\`ユーザーを\${action}しました\`);
                loadUsers(currentPage);
            } catch (error) {
                console.error('ステータス更新エラー:', error);
                alert('ステータスの更新に失敗しました');
            }
        }

        async function deleteUser(id, name) {
            if (!confirm('ユーザー「' + name + '」を完全に削除しますか？\\n\\n関連する出品商品・取引・チャット・レビュー等も全て削除されます。\\nこの操作は元に戻せません。')) return;
            if (!confirm('本当に削除してよろしいですか？（最終確認）')) return;
            try {
                await axios.delete('/api/admin/users/' + id);
                alert('ユーザー「' + name + '」を削除しました');
                loadUsers(currentPage);
            } catch (err) {
                alert('削除に失敗しました: ' + (err.response?.data?.error || err.message));
            }
        }

        // 検索フィルターの変更を監視
        document.getElementById('status-filter').addEventListener('change', searchUsers);
        document.getElementById('sort').addEventListener('change', searchUsers);
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchUsers();
        });

        // ページ読み込み時に実行
        document.addEventListener('DOMContentLoaded', () => loadUsers(1));
    </script>
  `;

  return c.html(AdminLayout('users', 'ユーザー管理', content));
});

// ユーザー詳細ページ
adminPagesRoutes.get('/users/:id', (c) => {
  const content = `
    <div class="mb-6">
        <a href="/admin/users" class="text-red-500 hover:text-red-700"><i class="fas fa-arrow-left mr-2"></i>ユーザー一覧に戻る</a>
    </div>

    <div id="user-loading" class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i><p class="text-gray-500 mt-3">読み込み中...</p></div>
    <div id="user-detail" class="hidden">
        <!-- 基本情報 -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-user mr-2"></i><span id="u-name"></span></h2>
                <span id="u-status-badge" class="px-3 py-1 text-sm rounded-full font-semibold"></span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div><span class="text-gray-500">メール:</span> <span id="u-email" class="font-medium"></span></div>
                <div><span class="text-gray-500">電話:</span> <span id="u-phone" class="font-medium"></span></div>
                <div><span class="text-gray-500">会社名:</span> <span id="u-company" class="font-medium"></span></div>
                <div><span class="text-gray-500">ショップ種別:</span> <span id="u-shop-type" class="font-medium"></span></div>
                <div><span class="text-gray-500">都道府県:</span> <span id="u-pref" class="font-medium"></span></div>
                <div><span class="text-gray-500">評価:</span> <span id="u-rating" class="font-medium"></span></div>
                <div><span class="text-gray-500">認証:</span> <span id="u-verified" class="font-medium"></span></div>
                <div><span class="text-gray-500">登録日:</span> <span id="u-created" class="font-medium"></span></div>
                <div><span class="text-gray-500">更新日:</span> <span id="u-updated" class="font-medium"></span></div>
            </div>
            <div id="u-bio-section" class="mt-4 hidden">
                <span class="text-gray-500 text-sm">自己紹介:</span>
                <p id="u-bio" class="mt-1 text-gray-700 bg-gray-50 p-3 rounded"></p>
            </div>
        </div>

        <!-- 統計カード -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-blue-600" id="u-products-count">0</p>
                <p class="text-sm text-gray-600">総出品数</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-green-600" id="u-active-count">0</p>
                <p class="text-sm text-gray-600">出品中</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-purple-600" id="u-sold-count">0</p>
                <p class="text-sm text-gray-600">売却済み</p>
            </div>
            <div class="bg-orange-50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-orange-600" id="u-tx-count">0</p>
                <p class="text-sm text-gray-600">取引数</p>
            </div>
        </div>

        <!-- アクション -->
        <div class="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3">
            <button id="btn-toggle-status" onclick="toggleStatus()" class="px-4 py-2 rounded-lg font-semibold text-white"></button>
            <button onclick="deleteUserDetail()" class="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"><i class="fas fa-trash mr-2"></i>アカウント削除</button>
        </div>

        <!-- 出品商品 -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="p-4 border-b"><h3 class="text-lg font-bold text-gray-800"><i class="fas fa-box mr-2"></i>出品商品</h3></div>
            <div id="u-products" class="p-4">
                <p class="text-gray-500 text-center py-4">読み込み中...</p>
            </div>
        </div>

        <!-- 取引履歴 -->
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b"><h3 class="text-lg font-bold text-gray-800"><i class="fas fa-exchange-alt mr-2"></i>取引履歴</h3></div>
            <div id="u-transactions" class="p-4">
                <p class="text-gray-500 text-center py-4">読み込み中...</p>
            </div>
        </div>
    </div>

    <script>
        let userData = null;
        const userId = window.location.pathname.split('/').pop();

        async function loadUserDetail() {
            try {
                const res = await axios.get('/api/admin/users/' + userId);
                if (!res.data.success) throw new Error(res.data.error);
                userData = res.data.user;
                renderUserDetail(res.data);
            } catch (err) {
                console.error(err);
                document.getElementById('user-loading').innerHTML =
                    '<p class="text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>' + (err.response?.data?.error || 'ユーザー情報の取得に失敗しました') + '</p>';
            }
        }

        function renderUserDetail(data) {
            const u = data.user;
            document.getElementById('user-loading').classList.add('hidden');
            document.getElementById('user-detail').classList.remove('hidden');

            document.getElementById('u-name').textContent = u.name;
            document.getElementById('u-email').textContent = u.email;
            document.getElementById('u-phone').textContent = u.phone || '-';
            document.getElementById('u-company').textContent = u.company_name || '-';
            document.getElementById('u-shop-type').textContent = u.shop_type === 'dealer' ? '販売店' : u.shop_type === 'repair' ? '整備工場' : '個人';
            document.getElementById('u-pref').textContent = u.prefecture || '-';
            document.getElementById('u-rating').textContent = u.rating ? u.rating.toFixed(1) + ' / 5.0' : '未評価';
            document.getElementById('u-verified').textContent = u.is_verified ? '認証済み' : '未認証';
            document.getElementById('u-created').textContent = new Date(u.created_at).toLocaleString('ja-JP');
            document.getElementById('u-updated').textContent = new Date(u.updated_at).toLocaleString('ja-JP');

            if (u.bio) {
                document.getElementById('u-bio').textContent = u.bio;
                document.getElementById('u-bio-section').classList.remove('hidden');
            }

            // ステータスバッジ
            const badge = document.getElementById('u-status-badge');
            if (u.status === 'active') {
                badge.textContent = '有効'; badge.className = 'px-3 py-1 text-sm rounded-full font-semibold bg-green-100 text-green-700';
            } else if (u.status === 'suspended') {
                badge.textContent = '停止中'; badge.className = 'px-3 py-1 text-sm rounded-full font-semibold bg-yellow-100 text-yellow-700';
            } else {
                badge.textContent = '禁止'; badge.className = 'px-3 py-1 text-sm rounded-full font-semibold bg-red-100 text-red-700';
            }

            // 統計
            document.getElementById('u-products-count').textContent = u.products_count || 0;
            document.getElementById('u-active-count').textContent = u.active_products_count || 0;
            document.getElementById('u-sold-count').textContent = u.sold_products_count || 0;
            document.getElementById('u-tx-count').textContent = u.transactions_count || 0;

            // アクションボタン
            const btn = document.getElementById('btn-toggle-status');
            if (u.status === 'active') {
                btn.textContent = 'アカウント停止'; btn.className = 'px-4 py-2 rounded-lg font-semibold text-white bg-yellow-500 hover:bg-yellow-600';
            } else {
                btn.textContent = 'アカウント有効化'; btn.className = 'px-4 py-2 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600';
            }

            // 出品商品
            const products = data.products || [];
            document.getElementById('u-products').innerHTML = products.length === 0
                ? '<p class="text-gray-500 text-center py-4">出品商品はありません</p>'
                : '<table class="w-full text-sm"><thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">ID</th><th class="pb-2">商品名</th><th class="pb-2">価格</th><th class="pb-2">ステータス</th><th class="pb-2">出品日</th></tr></thead><tbody>' +
                  products.map(p => '<tr class="border-b hover:bg-gray-50"><td class="py-2">' + p.id + '</td><td class="py-2"><a href="/admin/products/' + p.id + '" class="text-blue-500 hover:underline">' + p.title + '</a></td><td class="py-2">&yen;' + Math.floor(p.price * 1.1).toLocaleString() + ' <span style="font-size:10px;color:#6b7280;">税込</span></td><td class="py-2"><span class="px-2 py-0.5 text-xs rounded ' +
                    (p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'sold' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600') + '">' +
                    (p.status === 'active' ? '出品中' : p.status === 'sold' ? '売却済' : p.status) + '</span></td><td class="py-2">' + new Date(p.created_at).toLocaleDateString('ja-JP') + '</td></tr>').join('') +
                  '</tbody></table>';

            // 取引履歴
            const txs = data.transactions || [];
            document.getElementById('u-transactions').innerHTML = txs.length === 0
                ? '<p class="text-gray-500 text-center py-4">取引履歴はありません</p>'
                : '<table class="w-full text-sm"><thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">ID</th><th class="pb-2">種別</th><th class="pb-2">商品</th><th class="pb-2">金額</th><th class="pb-2">ステータス</th><th class="pb-2">日付</th></tr></thead><tbody>' +
                  txs.map(t => '<tr class="border-b hover:bg-gray-50"><td class="py-2">' + t.id + '</td><td class="py-2"><span class="px-2 py-0.5 text-xs rounded ' +
                    (t.role === '購入' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700') + '">' + t.role + '</span></td><td class="py-2">' + (t.product_title || '-') + '</td><td class="py-2">&yen;' + t.amount.toLocaleString() + '</td><td class="py-2">' + t.status + '</td><td class="py-2">' + new Date(t.created_at).toLocaleDateString('ja-JP') + '</td></tr>').join('') +
                  '</tbody></table>';
        }

        async function toggleStatus() {
            if (!userData) return;
            const newStatus = userData.status === 'active' ? 'suspended' : 'active';
            const action = newStatus === 'active' ? '有効化' : '停止';
            if (!confirm('このユーザーを' + action + 'しますか？')) return;
            try {
                await axios.put('/api/admin/users/' + userId + '/status', { status: newStatus });
                alert('ユーザーを' + action + 'しました');
                loadUserDetail();
            } catch (err) {
                alert('ステータス更新に失敗しました');
            }
        }

        async function deleteUserDetail() {
            if (!userData) return;
            var name = userData.name || 'このユーザー';
            if (!confirm('ユーザー「' + name + '」を完全に削除しますか？\\n\\n関連する出品商品・取引・チャット・レビュー等も全て削除されます。\\nこの操作は元に戻せません。')) return;
            if (!confirm('本当に削除してよろしいですか？（最終確認）')) return;
            try {
                await axios.delete('/api/admin/users/' + userId);
                alert('ユーザー「' + name + '」を削除しました');
                window.location.href = '/admin/users';
            } catch (err) {
                alert('削除に失敗しました: ' + (err.response?.data?.error || err.message));
            }
        }

        document.addEventListener('DOMContentLoaded', loadUserDetail);
    </script>
  `;

  return c.html(AdminLayout('users', 'ユーザー詳細', content));
});

// 商品管理ページ
adminPagesRoutes.get('/products', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">商品管理</h2>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" id="search-input" placeholder="商品名で検索..." class="px-4 py-2 border rounded-lg">
            <select id="status-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべてのステータス</option>
                <option value="active">出品中</option>
                <option value="sold">売却済み</option>
                <option value="pending">承認待ち</option>
                <option value="suspended">停止中</option>
                <option value="deleted">削除済み</option>
            </select>
            <select id="sort" class="px-4 py-2 border rounded-lg">
                <option value="created_desc">登録日（新しい順）</option>
                <option value="price_desc">価格（高い順）</option>
                <option value="price_asc">価格（安い順）</option>
            </select>
            <button onclick="searchProducts()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                <i class="fas fa-search mr-2"></i>検索
            </button>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">価格</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出品者</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">いいね</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">コメント</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody id="products-tbody" class="divide-y divide-gray-200">
                    <tr><td colspan="9" class="px-6 py-12 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div></td></tr>
                </tbody>
            </table>
        </div>
        <div id="pagination" class="px-6 py-4 border-t flex justify-between items-center"></div>
    </div>

    <script>
        let currentPage = 1;

        async function loadProducts(page = 1) {
            try {
                const status = document.getElementById('status-filter').value;
                const search = document.getElementById('search-input').value;
                
                let url = \`/api/admin/products?page=\${page}\`;
                if (status) url += \`&status=\${status}\`;
                if (search) url += \`&search=\${search}\`;
                
                const response = await axios.get(url);
                const { products, total, totalPages } = response.data;
                
                renderProducts(products);
                renderPagination(page, totalPages);
                currentPage = page;
            } catch (error) {
                console.error('商品読み込みエラー:', error);
            }
        }

        function renderProducts(products) {
            const tbody = document.getElementById('products-tbody');
            
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-8 text-center text-gray-500">商品が見つかりません</td></tr>';
                return;
            }
            
            tbody.innerHTML = products.map(p => \`
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">\${p.id}</td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">\${p.title}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">¥\${Math.floor(p.price * 1.1).toLocaleString()} <span style="font-size:10px;color:#6b7280;">税込</span></td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${p.seller_name}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs rounded \${
                            p.status === 'active' ? 'bg-green-100 text-green-700' :
                            p.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                            p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            p.status === 'deleted' ? 'bg-gray-200 text-gray-500 line-through' :
                            'bg-red-100 text-red-700'
                        }">
                            \${p.status === 'active' ? '出品中' : p.status === 'sold' ? '売却済み' : p.status === 'pending' ? '承認待ち' : p.status === 'deleted' ? '削除済み' : '停止中'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${p.favorites_count || 0}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${p.comments_count || 0}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${new Date(p.created_at).toLocaleDateString('ja-JP')}</td>
                    <td class="px-6 py-4 text-sm">
                        <a href="/admin/products/\${p.id}" class="text-blue-600 hover:text-blue-800 mr-3" title="詳細">
                            <i class="fas fa-eye"></i>
                        </a>
                        \${p.status === 'deleted' ? '<span class="text-gray-400 text-xs">削除済み</span>' : \`
                        \${p.status === 'pending' ?
                            \`<button onclick="approveProduct(\${p.id})" class="text-green-600 hover:text-green-800 mr-3" title="承認">
                                <i class="fas fa-check"></i>
                            </button>\` : ''
                        }
                        \${p.status === 'active' ?
                            \`<button onclick="suspendProduct(\${p.id})" class="text-yellow-600 hover:text-yellow-800 mr-3" title="停止">
                                <i class="fas fa-pause"></i>
                            </button>\` : ''
                        }
                        <button onclick="deleteProduct(\${p.id})" class="text-red-600 hover:text-red-800" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                        \`}
                    </td>
                </tr>
            \`).join('');
        }

        function renderPagination(current, total) {
            const pagination = document.getElementById('pagination');
            let html = \`<div class="text-sm text-gray-600">ページ \${current} / \${total}</div><div class="flex space-x-2">\`;
            if (current > 1) html += \`<button onclick="loadProducts(\${current - 1})" class="px-3 py-1 border rounded hover:bg-gray-50">前へ</button>\`;
            if (current < total) html += \`<button onclick="loadProducts(\${current + 1})" class="px-3 py-1 border rounded hover:bg-gray-50">次へ</button>\`;
            html += '</div>';
            pagination.innerHTML = html;
        }

        function searchProducts() { loadProducts(1); }

        async function approveProduct(id) {
            if (!confirm('この商品を承認しますか？')) return;
            try {
                await axios.put(\`/api/admin/products/\${id}/status\`, { status: 'active' });
                alert('商品を承認しました');
                loadProducts(currentPage);
            } catch (error) {
                alert('商品の承認に失敗しました');
            }
        }

        async function suspendProduct(id) {
            if (!confirm('この商品を停止しますか？')) return;
            try {
                await axios.put(\`/api/admin/products/\${id}/status\`, { status: 'suspended' });
                alert('商品を停止しました');
                loadProducts(currentPage);
            } catch (error) {
                alert('商品の停止に失敗しました');
            }
        }

        async function deleteProduct(id) {
            if (!confirm('この商品を削除しますか？この操作は取り消せません。')) return;
            try {
                await axios.delete(\`/api/admin/products/\${id}\`);
                alert('商品を削除しました');
                loadProducts(currentPage);
            } catch (error) {
                alert('商品の削除に失敗しました');
            }
        }

        loadProducts(1);
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchProducts();
        });
    </script>
  `;
  
  return c.html(AdminLayout('products', '商品管理', content));
})

// 商品詳細ページ
adminPagesRoutes.get('/products/:id', (c) => {
  const content = `
    <div class="mb-6">
        <a href="/admin/products" class="text-red-500 hover:text-red-700"><i class="fas fa-arrow-left mr-2"></i>商品一覧に戻る</a>
    </div>

    <div id="loading" class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i><p class="text-gray-500 mt-3">読み込み中...</p></div>
    <div id="detail" class="hidden">
        <!-- 基本情報 -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-box mr-2"></i><span id="p-title"></span></h2>
                <span id="p-status-badge" class="px-3 py-1 text-sm rounded-full font-semibold"></span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div><span class="text-gray-500">ID:</span> <span id="p-id" class="font-medium"></span></div>
                <div><span class="text-gray-500">価格:</span> <span id="p-price" class="font-bold text-red-600"></span></div>
                <div><span class="text-gray-500">状態:</span> <span id="p-condition" class="font-medium"></span></div>
                <div><span class="text-gray-500">カテゴリ:</span> <span id="p-category" class="font-medium"></span></div>
                <div><span class="text-gray-500">メーカー:</span> <span id="p-manufacturer" class="font-medium"></span></div>
                <div><span class="text-gray-500">品番:</span> <span id="p-part-number" class="font-medium"></span></div>
                <div><span class="text-gray-500">在庫:</span> <span id="p-stock" class="font-medium"></span></div>
                <div><span class="text-gray-500">閲覧数:</span> <span id="p-views" class="font-medium"></span></div>
                <div><span class="text-gray-500">お気に入り:</span> <span id="p-favs" class="font-medium"></span></div>
                <div><span class="text-gray-500">出品日:</span> <span id="p-created" class="font-medium"></span></div>
                <div><span class="text-gray-500">更新日:</span> <span id="p-updated" class="font-medium"></span></div>
            </div>
            <div id="p-desc-section" class="mt-4">
                <span class="text-gray-500 text-sm">説明:</span>
                <p id="p-desc" class="mt-1 text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap"></p>
            </div>
        </div>

        <!-- 出品者情報 -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-3"><i class="fas fa-user mr-2"></i>出品者情報</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span class="text-gray-500">名前:</span> <a id="p-seller-name" href="#" class="text-blue-500 hover:underline font-medium"></a></div>
                <div><span class="text-gray-500">メール:</span> <span id="p-seller-email" class="font-medium"></span></div>
                <div><span class="text-gray-500">会社:</span> <span id="p-seller-company" class="font-medium"></span></div>
            </div>
        </div>

        <!-- 商品画像 -->
        <div id="images-section" class="bg-white rounded-lg shadow mb-6 hidden">
            <div class="p-4 border-b"><h3 class="text-lg font-bold text-gray-800"><i class="fas fa-images mr-2"></i>商品画像</h3></div>
            <div id="p-images" class="p-4 flex flex-wrap gap-3"></div>
        </div>

        <!-- アクション -->
        <div class="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3">
            <button id="btn-activate" onclick="changeStatus('active')" class="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600">出品中にする</button>
            <button id="btn-suspend" onclick="changeStatus('suspended')" class="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600">停止する</button>
            <button id="btn-delete" onclick="deleteProduct()" class="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600">削除する</button>
            <a id="btn-view" href="#" target="_blank" class="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 inline-flex items-center"><i class="fas fa-external-link-alt mr-2"></i>商品ページを見る</a>
        </div>

        <!-- 適合情報 -->
        <div id="compat-section" class="bg-white rounded-lg shadow mb-6 hidden">
            <div class="p-4 border-b"><h3 class="text-lg font-bold text-gray-800"><i class="fas fa-car mr-2"></i>適合情報</h3></div>
            <div id="p-compat" class="p-4"></div>
        </div>

        <!-- 取引履歴 -->
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b"><h3 class="text-lg font-bold text-gray-800"><i class="fas fa-exchange-alt mr-2"></i>取引履歴</h3></div>
            <div id="p-transactions" class="p-4">
                <p class="text-gray-500 text-center py-4">読み込み中...</p>
            </div>
        </div>
    </div>

    <script>
        let productData = null;
        const productId = window.location.pathname.split('/').pop();

        async function loadProductDetail() {
            try {
                const res = await axios.get('/api/admin/products/' + productId);
                if (!res.data.success) throw new Error(res.data.error);
                productData = res.data.product;
                renderDetail(res.data);
            } catch (err) {
                console.error(err);
                document.getElementById('loading').innerHTML =
                    '<p class="text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>' + (err.response?.data?.error || '商品情報の取得に失敗しました') + '</p>';
            }
        }

        function statusBadge(s) {
            const m = { active: ['出品中','bg-green-100 text-green-700'], sold: ['売却済','bg-blue-100 text-blue-700'], suspended: ['停止中','bg-yellow-100 text-yellow-700'], deleted: ['削除済','bg-red-100 text-red-700'] };
            return m[s] || [s, 'bg-gray-100 text-gray-700'];
        }

        function conditionLabel(c) {
            const m = { new: '新品', like_new: '未使用に近い', good: '目立った傷なし', fair: 'やや傷あり', poor: '状態が悪い' };
            return m[c] || c || '-';
        }

        function renderDetail(data) {
            const p = data.product;
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('detail').classList.remove('hidden');

            document.getElementById('p-title').textContent = p.title;
            document.getElementById('p-id').textContent = p.id;
            document.getElementById('p-price').textContent = '¥' + Math.floor((p.price || 0) * 1.1).toLocaleString() + '（税込）';
            document.getElementById('p-condition').textContent = conditionLabel(p.condition);
            document.getElementById('p-category').textContent = p.category || '-';
            document.getElementById('p-manufacturer').textContent = p.manufacturer || '-';
            document.getElementById('p-part-number').textContent = p.part_number || '-';
            document.getElementById('p-stock').textContent = (p.stock_quantity != null ? p.stock_quantity : 1) + '個';
            document.getElementById('p-views').textContent = (p.view_count || p.views || 0) + '回';
            document.getElementById('p-favs').textContent = (data.favorite_count || 0) + '件';
            document.getElementById('p-created').textContent = new Date(p.created_at).toLocaleString('ja-JP');
            document.getElementById('p-updated').textContent = new Date(p.updated_at).toLocaleString('ja-JP');
            document.getElementById('p-desc').textContent = p.description || '（説明なし）';

            const sb = statusBadge(p.status);
            const badge = document.getElementById('p-status-badge');
            badge.textContent = sb[0]; badge.className = 'px-3 py-1 text-sm rounded-full font-semibold ' + sb[1];

            // 出品者
            document.getElementById('p-seller-name').textContent = p.seller_name || '-';
            document.getElementById('p-seller-name').href = '/admin/users/' + p.user_id;
            document.getElementById('p-seller-email').textContent = p.seller_email || '-';
            document.getElementById('p-seller-company').textContent = p.seller_company || '-';

            // 商品ページリンク
            document.getElementById('btn-view').href = '/products/' + p.id;

            // 画像
            const images = data.images || [];
            if (images.length > 0) {
                document.getElementById('images-section').classList.remove('hidden');
                document.getElementById('p-images').innerHTML = images.map(function(img) {
                    return '<img src="' + img.image_url + '" class="w-32 h-32 object-cover rounded-lg border" onerror="this.style.display=\\'none\\'">';
                }).join('');
            }

            // 適合情報
            const compat = data.compatibility || [];
            if (compat.length > 0) {
                document.getElementById('compat-section').classList.remove('hidden');
                document.getElementById('p-compat').innerHTML = '<table class="w-full text-sm"><thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">メーカー</th><th class="pb-2">車種</th><th class="pb-2">年式</th><th class="pb-2">型式</th><th class="pb-2">OEM品番</th></tr></thead><tbody>' +
                    compat.map(function(c) { return '<tr class="border-b"><td class="py-2">' + (c.maker_name || c.maker_id || '-') + '</td><td class="py-2">' + (c.model_name || c.model_id || '-') + '</td><td class="py-2">' + (c.year_from || '?') + '-' + (c.year_to || '?') + '</td><td class="py-2">' + (c.model_code || '-') + '</td><td class="py-2">' + (c.oem_part_number || '-') + '</td></tr>'; }).join('') +
                    '</tbody></table>';
            }

            // 取引
            const txs = data.transactions || [];
            document.getElementById('p-transactions').innerHTML = txs.length === 0
                ? '<p class="text-gray-500 text-center py-4">取引履歴はありません</p>'
                : '<table class="w-full text-sm"><thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">ID</th><th class="pb-2">購入者</th><th class="pb-2">金額</th><th class="pb-2">ステータス</th><th class="pb-2">日付</th></tr></thead><tbody>' +
                  txs.map(function(t) { return '<tr class="border-b hover:bg-gray-50"><td class="py-2">' + t.id + '</td><td class="py-2">' + (t.buyer_name || '-') + '</td><td class="py-2">¥' + t.amount.toLocaleString() + '</td><td class="py-2">' + t.status + '</td><td class="py-2">' + new Date(t.created_at).toLocaleDateString('ja-JP') + '</td></tr>'; }).join('') +
                  '</tbody></table>';
        }

        async function changeStatus(newStatus) {
            const labels = { active: '出品中に', suspended: '停止に' };
            if (!confirm('この商品を' + (labels[newStatus] || newStatus) + 'しますか？')) return;
            try {
                await axios.put('/api/admin/products/' + productId + '/status', { status: newStatus });
                alert('商品ステータスを更新しました');
                loadProductDetail();
            } catch (err) { alert('ステータス更新に失敗しました'); }
        }

        async function deleteProduct() {
            if (!confirm('この商品を完全に削除しますか？この操作は元に戻せません。')) return;
            try {
                await axios.delete('/api/admin/products/' + productId);
                alert('商品を削除しました');
                window.location.href = '/admin/products';
            } catch (err) { alert('商品の削除に失敗しました'); }
        }

        document.addEventListener('DOMContentLoaded', loadProductDetail);
    </script>
  `;

  return c.html(AdminLayout('products', '商品詳細', content));
});

// 取引管理ページ
adminPagesRoutes.get('/transactions', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">取引管理</h2>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select id="status-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべてのステータス</option>
                <option value="pending">支払い待ち</option>
                <option value="paid">発送待ち</option>
                <option value="shipped">配送中</option>
                <option value="completed">完了</option>
                <option value="dispute">トラブル</option>
                <option value="cancelled">キャンセル</option>
            </select>
            <input type="date" id="date-from" class="px-4 py-2 border rounded-lg">
            <button onclick="searchTransactions()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                <i class="fas fa-search mr-2"></i>検索
            </button>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">買い手</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">売り手</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引日</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody id="transactions-tbody" class="divide-y divide-gray-200">
                    <tr><td colspan="8" class="px-6 py-12 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div></td></tr>
                </tbody>
            </table>
        </div>
        <div id="pagination" class="px-6 py-4 border-t flex justify-between items-center"></div>
    </div>

    <script>
        let currentPage = 1;

        async function loadTransactions(page = 1) {
            try {
                const status = document.getElementById('status-filter').value;
                let url = \`/api/admin/transactions?page=\${page}\`;
                if (status) url += \`&status=\${status}\`;
                
                const response = await axios.get(url);
                const { transactions, total, totalPages } = response.data;
                
                renderTransactions(transactions);
                renderPagination(page, totalPages);
                currentPage = page;
            } catch (error) {
                console.error('取引読み込みエラー:', error);
            }
        }

        function renderTransactions(transactions) {
            const tbody = document.getElementById('transactions-tbody');
            
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">取引が見つかりません</td></tr>';
                return;
            }
            
            tbody.innerHTML = transactions.map(t => \`
                <tr class="hover:bg-gray-50 \${t.status === 'dispute' ? 'bg-red-50' : ''}">
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">#\${t.id}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${t.product_title}</td>
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">¥\${t.amount.toLocaleString()}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${t.buyer_name}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${t.seller_name}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs rounded \${
                            t.status === 'completed' ? 'bg-green-100 text-green-700' :
                            t.status === 'dispute' ? 'bg-red-100 text-red-700' :
                            t.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                        }">
                            \${t.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${new Date(t.created_at).toLocaleDateString('ja-JP')}</td>
                    <td class="px-6 py-4 text-sm">
                        <a href="/transactions/\${t.id}" target="_blank" class="text-blue-600 hover:text-blue-800 mr-3" title="詳細">
                            <i class="fas fa-eye"></i>
                        </a>
                        \${t.status === 'dispute' ?
                            \`<button onclick="resolveDispute(\${t.id})" class="text-green-600 hover:text-green-800" title="解決">
                                <i class="fas fa-check-circle"></i>
                            </button>\` : ''
                        }
                    </td>
                </tr>
            \`).join('');
        }

        function renderPagination(current, total) {
            const pagination = document.getElementById('pagination');
            let html = \`<div class="text-sm text-gray-600">ページ \${current} / \${total}</div><div class="flex space-x-2">\`;
            if (current > 1) html += \`<button onclick="loadTransactions(\${current - 1})" class="px-3 py-1 border rounded hover:bg-gray-50">前へ</button>\`;
            if (current < total) html += \`<button onclick="loadTransactions(\${current + 1})" class="px-3 py-1 border rounded hover:bg-gray-50">次へ</button>\`;
            html += '</div>';
            pagination.innerHTML = html;
        }

        function searchTransactions() { loadTransactions(1); }

        async function resolveDispute(id) {
            const action = prompt('解決方法を選択してください:\\n1: 取引完了\\n2: キャンセル');
            if (!action) return;
            
            const status = action === '1' ? 'completed' : 'cancelled';
            
            try {
                await axios.put(\`/api/admin/transactions/\${id}/status\`, { status });
                alert('トラブルを解決しました');
                loadTransactions(currentPage);
            } catch (error) {
                alert('トラブル解決に失敗しました');
            }
        }

        loadTransactions(1);
    </script>
  `;
  
  return c.html(AdminLayout('transactions', '取引管理', content));
})

// レビュー管理ページ
adminPagesRoutes.get('/reviews', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">レビュー管理</h2>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select id="rating-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべての評価</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="2">⭐⭐</option>
                <option value="1">⭐</option>
            </select>
            <select id="sort" class="px-4 py-2 border rounded-lg">
                <option value="created_desc">新しい順</option>
                <option value="rating_desc">評価が高い順</option>
                <option value="rating_asc">評価が低い順</option>
            </select>
            <button onclick="searchReviews()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                <i class="fas fa-search mr-2"></i>検索
            </button>
        </div>
    </div>

    <div class="space-y-4" id="reviews-container">
        <div class="text-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
    </div>

    <div id="pagination" class="mt-6 flex justify-between items-center"></div>

    <script>
        let currentPage = 1;

        async function loadReviews(page = 1) {
            try {
                const rating = document.getElementById('rating-filter').value;
                let url = \`/api/admin/reviews?page=\${page}\`;
                if (rating) url += \`&rating=\${rating}\`;
                
                const response = await axios.get(url);
                const { reviews, total, totalPages } = response.data;
                
                renderReviews(reviews);
                renderPagination(page, totalPages);
                currentPage = page;
            } catch (error) {
                console.error('レビュー読み込みエラー:', error);
            }
        }

        function renderReviews(reviews) {
            const container = document.getElementById('reviews-container');
            
            if (reviews.length === 0) {
                container.innerHTML = '<div class="bg-white p-8 rounded-lg shadow text-center text-gray-500">レビューが見つかりません</div>';
                return;
            }
            
            container.innerHTML = reviews.map(r => \`
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <span class="text-yellow-500 mr-2">\${'⭐'.repeat(r.rating)}</span>
                                <span class="text-sm text-gray-600">\${new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
                            </div>
                            <p class="text-sm text-gray-700 mb-2"><strong>評価者:</strong> \${r.reviewer_name}</p>
                            <p class="text-sm text-gray-700 mb-2"><strong>対象:</strong> \${r.reviewee_name}</p>
                            <p class="text-sm text-gray-700 mb-3"><strong>取引:</strong> <a href="/transactions/\${r.transaction_id}" class="text-blue-600 hover:underline">#\${r.transaction_id}</a></p>
                            <p class="text-gray-800">\${r.comment}</p>
                        </div>
                        <button onclick="deleteReview(\${r.id})" class="ml-4 text-red-600 hover:text-red-800" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            \`).join('');
        }

        function renderPagination(current, total) {
            const pagination = document.getElementById('pagination');
            let html = \`<div class="text-sm text-gray-600">ページ \${current} / \${total}</div><div class="flex space-x-2">\`;
            if (current > 1) html += \`<button onclick="loadReviews(\${current - 1})" class="px-3 py-1 border rounded hover:bg-gray-50">前へ</button>\`;
            if (current < total) html += \`<button onclick="loadReviews(\${current + 1})" class="px-3 py-1 border rounded hover:bg-gray-50">次へ</button>\`;
            html += '</div>';
            pagination.innerHTML = html;
        }

        function searchReviews() { loadReviews(1); }

        async function deleteReview(id) {
            if (!confirm('このレビューを削除しますか？')) return;
            try {
                await axios.delete(\`/api/admin/reviews/\${id}\`);
                alert('レビューを削除しました');
                loadReviews(currentPage);
            } catch (error) {
                alert('レビューの削除に失敗しました');
            }
        }

        loadReviews(1);
    </script>
  `;
  
  return c.html(AdminLayout('reviews', 'レビュー管理', content));
})

// 通報管理ページ
adminPagesRoutes.get('/reports', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">通報管理</h2>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select id="status-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべてのステータス</option>
                <option value="pending">未対応</option>
                <option value="resolved">対応済み</option>
                <option value="rejected">却下</option>
            </select>
            <button onclick="searchReports()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                <i class="fas fa-search mr-2"></i>検索
            </button>
        </div>
    </div>

    <div class="space-y-4" id="reports-container">
        <div class="text-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
    </div>

    <div id="pagination" class="mt-6 flex justify-between items-center"></div>

    <script>
        let currentPage = 1;

        async function loadReports(page = 1) {
            try {
                const status = document.getElementById('status-filter').value;
                let url = \`/api/admin/reports?page=\${page}\`;
                if (status) url += \`&status=\${status}\`;
                
                const response = await axios.get(url);
                const { reports, total, totalPages } = response.data;
                
                renderReports(reports);
                renderPagination(page, totalPages);
                currentPage = page;
            } catch (error) {
                console.error('通報読み込みエラー:', error);
            }
        }

        function renderReports(reports) {
            const container = document.getElementById('reports-container');
            
            if (reports.length === 0) {
                container.innerHTML = '<div class="bg-white p-8 rounded-lg shadow text-center text-gray-500">通報が見つかりません</div>';
                return;
            }
            
            container.innerHTML = reports.map(r => \`
                <div class="bg-white p-6 rounded-lg shadow \${r.status === 'pending' ? 'border-l-4 border-red-500' : ''}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center mb-3">
                                <span class="px-2 py-1 text-xs rounded \${
                                    r.status === 'pending' ? 'bg-red-100 text-red-700' :
                                    r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                }">
                                    \${r.status === 'pending' ? '未対応' : r.status === 'resolved' ? '対応済み' : '却下'}
                                </span>
                                <span class="ml-3 text-sm text-gray-600">\${new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
                            </div>
                            <p class="text-sm text-gray-700 mb-2"><strong>通報者:</strong> \${r.reporter_name}</p>
                            <p class="text-sm text-gray-700 mb-2"><strong>対象商品:</strong> <a href="/products/\${r.product_id}" target="_blank" class="text-blue-600 hover:underline">\${r.product_title}</a></p>
                            <p class="text-sm text-gray-700 mb-2"><strong>理由:</strong> \${r.reason}</p>
                            <p class="text-gray-800">\${r.description}</p>
                        </div>
                        \${r.status === 'pending' ?
                            \`<div class="ml-4 flex flex-col space-y-2">
                                <button onclick="resolveReport(\${r.id})" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                                    対応完了
                                </button>
                                <button onclick="rejectReport(\${r.id})" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">
                                    却下
                                </button>
                            </div>\` : ''
                        }
                    </div>
                </div>
            \`).join('');
        }

        function renderPagination(current, total) {
            const pagination = document.getElementById('pagination');
            let html = \`<div class="text-sm text-gray-600">ページ \${current} / \${total}</div><div class="flex space-x-2">\`;
            if (current > 1) html += \`<button onclick="loadReports(\${current - 1})" class="px-3 py-1 border rounded hover:bg-gray-50">前へ</button>\`;
            if (current < total) html += \`<button onclick="loadReports(\${current + 1})" class="px-3 py-1 border rounded hover:bg-gray-50">次へ</button>\`;
            html += '</div>';
            pagination.innerHTML = html;
        }

        function searchReports() { loadReports(1); }

        async function resolveReport(id) {
            if (!confirm('この通報を対応完了にしますか？')) return;
            try {
                await axios.put(\`/api/admin/reports/\${id}/status\`, { status: 'resolved' });
                alert('通報を対応完了にしました');
                loadReports(currentPage);
            } catch (error) {
                alert('通報の更新に失敗しました');
            }
        }

        async function rejectReport(id) {
            if (!confirm('この通報を却下しますか？')) return;
            try {
                await axios.put(\`/api/admin/reports/\${id}/status\`, { status: 'rejected' });
                alert('通報を却下しました');
                loadReports(currentPage);
            } catch (error) {
                alert('通報の更新に失敗しました');
            }
        }

        loadReports(1);
    </script>
  `;
  
  return c.html(AdminLayout('reports', '通報管理', content));
})

// 売上レポートページ
adminPagesRoutes.get('/sales', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">売上レポート</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
            <p class="text-sm text-gray-600 mb-2">今月の総売上</p>
            <p class="text-3xl font-bold text-gray-800" id="total-sales">¥0</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
            <p class="text-sm text-gray-600 mb-2">今月の手数料収入</p>
            <p class="text-3xl font-bold text-green-600" id="total-fees">¥0</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
            <p class="text-sm text-gray-600 mb-2">今月の取引件数</p>
            <p class="text-3xl font-bold text-blue-600" id="total-count">0</p>
        </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">月別売上推移</h3>
        <div id="monthly-chart" class="h-64 flex items-center justify-center text-gray-500">
            データを読み込み中...
        </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold text-gray-800 mb-4">最近の取引</h3>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引日</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">手数料（10%）</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">純利益</th>
                    </tr>
                </thead>
                <tbody id="sales-tbody" class="divide-y divide-gray-200">
                    <tr><td colspan="5" class="px-6 py-12 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div></td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        async function loadSalesReport() {
            try {
                const response = await axios.get('/api/admin/sales');
                const { currentMonth, monthlyData, recentTransactions } = response.data;
                
                document.getElementById('total-sales').textContent = '¥' + currentMonth.totalSales.toLocaleString();
                document.getElementById('total-fees').textContent = '¥' + currentMonth.totalFees.toLocaleString();
                document.getElementById('total-count').textContent = currentMonth.count;
                
                renderMonthlyChart(monthlyData);
                renderRecentTransactions(recentTransactions);
            } catch (error) {
                console.error('売上レポート読み込みエラー:', error);
            }
        }

        function renderMonthlyChart(data) {
            const chart = document.getElementById('monthly-chart');
            if (data.length === 0) {
                chart.innerHTML = '<div class="text-gray-500">データがありません</div>';
                return;
            }
            
            const maxSales = Math.max(...data.map(d => d.sales));
            const bars = data.map(d => {
                const height = (d.sales / maxSales * 100);
                return \`
                    <div class="flex-1 flex flex-col items-center">
                        <div class="w-full flex items-end justify-center" style="height: 180px;">
                            <div class="w-12 bg-red-500 rounded-t" style="height: \${height}%" title="¥\${d.sales.toLocaleString()}"></div>
                        </div>
                        <div class="text-xs text-gray-600 mt-2">\${d.month}月</div>
                        <div class="text-xs font-bold text-gray-800">¥\${(d.sales / 1000).toFixed(0)}K</div>
                    </div>
                \`;
            }).join('');
            
            chart.innerHTML = '<div class="flex items-end space-x-2 h-full">' + bars + '</div>';
        }

        function renderRecentTransactions(transactions) {
            const tbody = document.getElementById('sales-tbody');
            
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">取引がありません</td></tr>';
                return;
            }
            
            tbody.innerHTML = transactions.map(t => {
                const fee = Math.floor(t.amount * 0.10);
                const net = t.amount - fee;
                return \`
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm text-gray-600">\${new Date(t.created_at).toLocaleDateString('ja-JP')}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">\${t.product_title}</td>
                        <td class="px-6 py-4 text-sm font-bold text-gray-900">¥\${t.amount.toLocaleString()}</td>
                        <td class="px-6 py-4 text-sm text-green-600">¥\${fee.toLocaleString()}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">¥\${net.toLocaleString()}</td>
                    </tr>
                \`;
            }).join('');
        }

        loadSalesReport();
    </script>
  `;
  
  return c.html(AdminLayout('sales', '売上レポート', content));
})

// コラム管理ページ
adminPagesRoutes.get('/articles', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">コラム管理</h2>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select id="status-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべてのステータス</option>
                <option value="draft">下書き</option>
                <option value="published">公開中</option>
                <option value="archived">アーカイブ</option>
            </select>
            <div class="md:col-span-1"></div>
            <button onclick="showGenerateModal()" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                <i class="fas fa-magic mr-2"></i>AI自動生成
            </button>
            <button onclick="autoGenerateWithImage(event)" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                <i class="fas fa-image mr-2"></i>自動生成（画像付き）
            </button>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow">
        <div class="overflow-x-auto">
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">閲覧数</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公開日</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody id="articles-table-body" class="bg-white divide-y divide-gray-200">
                    <tr>
                        <td colspan="7" class="px-6 py-4 text-center">
                            <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                            <p class="text-gray-500 mt-2">読み込み中...</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="px-6 py-4 border-t">
            <div id="pagination" class="flex justify-center space-x-2"></div>
        </div>
    </div>

    <!-- AI自動生成モーダル -->
    <div id="generate-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">AI自動生成</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">トピック</label>
                    <input type="text" id="generate-topic" class="w-full px-4 py-2 border rounded-lg" 
                           placeholder="例: 自動車パーツの選び方">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">カテゴリ</label>
                    <select id="generate-category" class="w-full px-4 py-2 border rounded-lg">
                        <option value="general">一般</option>
                        <option value="parts-guide">パーツガイド</option>
                        <option value="maintenance">メンテナンス</option>
                        <option value="news">ニュース</option>
                        <option value="tips">お役立ち情報</option>
                    </select>
                </div>
            </div>
            <div class="mt-6 flex space-x-3">
                <button onclick="closeGenerateModal()" class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    キャンセル
                </button>
                <button onclick="generateArticle()" class="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <i class="fas fa-magic mr-2"></i>生成する
                </button>
            </div>
        </div>
    </div>

    <!-- 編集モーダル -->
    <div id="edit-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
        <div class="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 my-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-6" id="modal-title">コラム編集</h3>
            <div class="space-y-4 max-h-[70vh] overflow-y-auto">
                <input type="hidden" id="edit-id">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">タイトル</label>
                    <input type="text" id="edit-title" class="w-full px-4 py-2 border rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">スラッグ（URL）</label>
                    <input type="text" id="edit-slug" class="w-full px-4 py-2 border rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">要約</label>
                    <textarea id="edit-summary" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">本文（HTML）</label>
                    <textarea id="edit-content" rows="10" class="w-full px-4 py-2 border rounded-lg font-mono text-sm"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">サムネイルURL</label>
                        <input type="text" id="edit-thumbnail" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">カテゴリ</label>
                        <select id="edit-category" class="w-full px-4 py-2 border rounded-lg">
                            <option value="general">一般</option>
                            <option value="parts-guide">パーツガイド</option>
                            <option value="maintenance">メンテナンス</option>
                            <option value="news">ニュース</option>
                            <option value="tips">お役立ち情報</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">タグ（カンマ区切り）</label>
                        <input type="text" id="edit-tags" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">ステータス</label>
                        <select id="edit-status" class="w-full px-4 py-2 border rounded-lg">
                            <option value="draft">下書き</option>
                            <option value="published">公開</option>
                            <option value="archived">アーカイブ</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" id="edit-featured" class="mr-2">
                        <span class="text-sm font-semibold text-gray-700">注目記事として表示</span>
                    </label>
                </div>
            </div>
            <div class="mt-6 flex space-x-3">
                <button onclick="closeEditModal()" class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    キャンセル
                </button>
                <button onclick="saveArticle()" class="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    保存
                </button>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let currentPage = 1;
        let currentStatus = '';

        // Wait for axios to load
        function initArticlePage() {
            if (typeof axios === 'undefined') {
                setTimeout(initArticlePage, 100);
                return;
            }
            
            // Initialize event listeners
            document.getElementById('status-filter').addEventListener('change', (e) => {
                currentStatus = e.target.value;
                loadArticles(1);
            });
            
            // Load initial data
            loadArticles(1);
        }

        async function loadArticles(page = 1) {
            currentPage = page;
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '20',
                    status: currentStatus
                });
                
                const response = await axios.get('/api/admin/articles?' + params);
                const { articles, total, totalPages } = response.data;
                
                renderArticles(articles);
                renderPagination(page, totalPages);
            } catch (error) {
                console.error('コラム読み込みエラー:', error);
            }
        }

        function renderArticles(articles) {
            const tbody = document.getElementById('articles-table-body');
            
            if (articles.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">コラムが見つかりませんでした</td></tr>';
                return;
            }
            
            tbody.innerHTML = articles.map(article => \`
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${article.id}</td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">\${article.title}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${article.category}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded \${
                            article.status === 'published' ? 'bg-green-100 text-green-700' :
                            article.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                        }">
                            \${article.status === 'published' ? '公開中' : 
                              article.status === 'draft' ? '下書き' : 'アーカイブ'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${article.view_count || 0}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        \${article.published_at ? new Date(article.published_at).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button onclick="editArticle(\${article.id})" class="text-blue-500 hover:underline mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteArticle(\${article.id})" class="text-red-500 hover:underline">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            \`).join('');
        }

        function renderPagination(page, totalPages) {
            const pagination = document.getElementById('pagination');
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }
            
            let html = '';
            
            if (page > 1) {
                html += \`<button onclick="loadArticles(\${page - 1})" 
                        class="px-3 py-1 border rounded hover:bg-gray-100">前へ</button>\`;
            }
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === page) {
                    html += \`<button class="px-3 py-1 bg-red-500 text-white rounded">\${i}</button>\`;
                } else if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                    html += \`<button onclick="loadArticles(\${i})" 
                            class="px-3 py-1 border rounded hover:bg-gray-100">\${i}</button>\`;
                } else if (i === page - 3 || i === page + 3) {
                    html += \`<span class="px-3 py-1">...</span>\`;
                }
            }
            
            if (page < totalPages) {
                html += \`<button onclick="loadArticles(\${page + 1})" 
                        class="px-3 py-1 border rounded hover:bg-gray-100">次へ</button>\`;
            }
            
            pagination.innerHTML = html;
        }

        function showGenerateModal() {
            document.getElementById('generate-modal').classList.remove('hidden');
        }

        function closeGenerateModal() {
            document.getElementById('generate-modal').classList.add('hidden');
            document.getElementById('generate-topic').value = '';
        }

        async function generateArticle() {
            const topic = document.getElementById('generate-topic').value;
            const category = document.getElementById('generate-category').value;
            
            if (!topic.trim()) {
                alert('トピックを入力してください');
                return;
            }
            
            try {
                const response = await axios.post('/api/admin/articles/generate', { topic, category });
                
                if (response.data.success) {
                    const article = response.data.article;
                    closeGenerateModal();
                    
                    // 生成された記事を編集モーダルに表示
                    document.getElementById('edit-id').value = '';
                    document.getElementById('edit-title').value = article.title;
                    document.getElementById('edit-slug').value = article.slug;
                    document.getElementById('edit-summary').value = article.summary;
                    document.getElementById('edit-content').value = article.content;
                    document.getElementById('edit-thumbnail').value = '';
                    document.getElementById('edit-category').value = article.category;
                    document.getElementById('edit-tags').value = article.tags;
                    document.getElementById('edit-status').value = 'draft';
                    document.getElementById('edit-featured').checked = false;
                    document.getElementById('modal-title').textContent = 'AI生成されたコラム（保存前に確認してください）';
                    document.getElementById('edit-modal').classList.remove('hidden');
                } else {
                    alert('コラムの生成に失敗しました');
                }
            } catch (error) {
                console.error('生成エラー:', error);
                alert('コラムの生成に失敗しました: ' + (error.response?.data?.error || error.message));
            }
        }

        async function editArticle(id) {
            try {
                const response = await axios.get(\`/api/admin/articles?page=1&limit=100\`);
                const article = response.data.articles.find(a => a.id === id);
                
                if (!article) {
                    alert('コラムが見つかりません');
                    return;
                }
                
                document.getElementById('edit-id').value = article.id;
                document.getElementById('edit-title').value = article.title;
                document.getElementById('edit-slug').value = article.slug;
                document.getElementById('edit-summary').value = article.summary || '';
                document.getElementById('edit-content').value = article.content;
                document.getElementById('edit-thumbnail').value = article.thumbnail_url || '';
                document.getElementById('edit-category').value = article.category;
                document.getElementById('edit-tags').value = article.tags || '';
                document.getElementById('edit-status').value = article.status;
                document.getElementById('edit-featured').checked = article.is_featured === 1;
                document.getElementById('modal-title').textContent = 'コラム編集';
                document.getElementById('edit-modal').classList.remove('hidden');
            } catch (error) {
                console.error('編集準備エラー:', error);
                alert('コラムの読み込みに失敗しました');
            }
        }

        function closeEditModal() {
            document.getElementById('edit-modal').classList.add('hidden');
        }

        async function saveArticle() {
            const id = document.getElementById('edit-id').value;
            const data = {
                title: document.getElementById('edit-title').value,
                slug: document.getElementById('edit-slug').value,
                summary: document.getElementById('edit-summary').value,
                content: document.getElementById('edit-content').value,
                thumbnail_url: document.getElementById('edit-thumbnail').value,
                category: document.getElementById('edit-category').value,
                tags: document.getElementById('edit-tags').value,
                status: document.getElementById('edit-status').value,
                is_featured: document.getElementById('edit-featured').checked
            };
            
            if (!data.title || !data.slug || !data.content) {
                alert('タイトル、スラッグ、本文は必須です');
                return;
            }
            
            try {
                if (id) {
                    await axios.put(\`/api/admin/articles/\${id}\`, data);
                    alert('コラムを更新しました');
                } else {
                    await axios.post('/api/admin/articles', data);
                    alert('コラムを作成しました');
                }
                closeEditModal();
                loadArticles(currentPage);
            } catch (error) {
                console.error('保存エラー:', error);
                alert('保存に失敗しました: ' + (error.response?.data?.error || error.message));
            }
        }

        async function deleteArticle(id) {
            if (!confirm('このコラムを削除してもよろしいですか？')) {
                return;
            }
            
            try {
                await axios.delete(\`/api/admin/articles/\${id}\`);
                alert('コラムを削除しました');
                loadArticles(currentPage);
            } catch (error) {
                console.error('削除エラー:', error);
                alert('削除に失敗しました');
            }
        }

        async function autoGenerateWithImage(event) {
            if (!confirm('AIが自動で記事とアイキャッチ画像を生成し、即座に公開します。よろしいですか？\\n\\n※この機能はOpenAI APIを使用し、約$0.05のコストがかかります。')) {
                return;
            }
            
            const button = event.target;
            const originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成中...';
            
            try {
                const response = await axios.post('/api/admin/articles/auto-generate-with-image');
                
                if (response.data.success) {
                    const article = response.data.article;
                    alert('記事が生成され、公開されました！\\n\\nタイトル: ' + article.title + '\\nカテゴリ: ' + article.category + '\\n\\nトップページに表示されます。');
                    loadArticles(currentPage);
                } else {
                    alert('自動生成に失敗しました');
                }
            } catch (error) {
                console.error('自動生成エラー:', error);
                alert('自動生成に失敗しました: ' + (error.response?.data?.error || error.message));
            } finally {
                button.disabled = false;
                button.innerHTML = originalText;
            }
        }

        // Start initialization when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initArticlePage);
        } else {
            initArticlePage();
        }
    </script>
  `;

  return c.html(AdminLayout('articles', 'コラム管理', content));
})

// 出金管理ページ
adminPagesRoutes.get('/withdrawals', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">出金管理</h2>

    <!-- 統計カード -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-yellow-700 font-medium">承認待ち</p>
                    <p class="text-2xl font-bold text-yellow-800" id="pending-count">0件</p>
                    <p class="text-sm text-yellow-600" id="pending-amount">&yen;0</p>
                </div>
                <div class="bg-yellow-100 rounded-full p-3"><i class="fas fa-clock text-yellow-600 text-xl"></i></div>
            </div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-blue-700 font-medium">処理中</p>
                    <p class="text-2xl font-bold text-blue-800" id="processing-count">0件</p>
                    <p class="text-sm text-blue-600" id="processing-amount">&yen;0</p>
                </div>
                <div class="bg-blue-100 rounded-full p-3"><i class="fas fa-spinner text-blue-600 text-xl"></i></div>
            </div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-5">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-green-700 font-medium">振込完了</p>
                    <p class="text-2xl font-bold text-green-800" id="completed-count">0件</p>
                    <p class="text-sm text-green-600" id="completed-amount">&yen;0</p>
                </div>
                <div class="bg-green-100 rounded-full p-3"><i class="fas fa-check-circle text-green-600 text-xl"></i></div>
            </div>
        </div>
    </div>
    
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select id="status-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべてのステータス</option>
                <option value="pending">承認待ち</option>
                <option value="processing">処理中</option>
                <option value="completed">振込完了</option>
                <option value="rejected">却下</option>
            </select>
            <div></div>
            <button onclick="searchWithdrawals()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                <i class="fas fa-search mr-2"></i>検索
            </button>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請者</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">振込先</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">口座名義</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請日</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody id="withdrawals-tbody" class="divide-y divide-gray-200">
                    <tr><td colspan="8" class="px-6 py-12 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div></td></tr>
                </tbody>
            </table>
        </div>
        <div id="pagination" class="px-6 py-4 border-t flex justify-between items-center"></div>
    </div>

    <!-- 詳細・処理モーダル -->
    <div id="withdrawal-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
            <h3 class="text-xl font-bold text-gray-900 mb-4" id="modal-title">出金申請詳細</h3>
            <div id="modal-body" class="space-y-3 text-sm"></div>
            <div id="modal-actions" class="mt-6 flex space-x-3"></div>
        </div>
    </div>

    <script>
        let currentPage = 1;

        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        async function loadWithdrawals(page = 1) {
            try {
                const status = document.getElementById('status-filter').value;
                let url = '/api/admin/withdrawals?page=' + page;
                if (status) url += '&status=' + status;
                
                const response = await axios.get(url);
                const { withdrawals, total, totalPages, stats } = response.data;
                
                // 統計更新
                if (stats) {
                    document.getElementById('pending-count').textContent = (stats.pending_count || 0) + '件';
                    document.getElementById('pending-amount').textContent = '&yen;' + (stats.pending_amount || 0).toLocaleString();
                    document.getElementById('processing-count').textContent = (stats.processing_count || 0) + '件';
                    document.getElementById('processing-amount').textContent = '&yen;' + (stats.processing_amount || 0).toLocaleString();
                    document.getElementById('completed-count').textContent = (stats.completed_count || 0) + '件';
                    document.getElementById('completed-amount').textContent = '&yen;' + (stats.completed_amount || 0).toLocaleString();
                }
                
                renderWithdrawals(withdrawals);
                renderPagination(page, totalPages);
                currentPage = page;
            } catch (error) {
                console.error('出金一覧読み込みエラー:', error);
            }
        }

        function statusBadge(status) {
            var m = {
                pending: ['承認待ち', 'bg-yellow-100 text-yellow-700'],
                processing: ['処理中', 'bg-blue-100 text-blue-700'],
                completed: ['振込完了', 'bg-green-100 text-green-700'],
                rejected: ['却下', 'bg-red-100 text-red-700']
            };
            return m[status] || [status, 'bg-gray-100 text-gray-700'];
        }

        function accountTypeLabel(type) {
            return type === 'ordinary' ? '普通' : type === 'checking' ? '当座' : type;
        }

        function renderWithdrawals(withdrawals) {
            var tbody = document.getElementById('withdrawals-tbody');
            
            if (withdrawals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">出金申請が見つかりません</td></tr>';
                return;
            }
            
            tbody.innerHTML = withdrawals.map(function(w) {
                var sb = statusBadge(w.status);
                return '<tr class="hover:bg-gray-50' + (w.status === 'pending' ? ' bg-yellow-50' : '') + '">' +
                    '<td class="px-4 py-4 text-sm font-medium text-gray-900">#' + w.id + '</td>' +
                    '<td class="px-4 py-4 text-sm"><div class="font-medium">' + escapeHtml(w.user_name) + '</div><div class="text-gray-500 text-xs">' + escapeHtml(w.user_email) + '</div></td>' +
                    '<td class="px-4 py-4 text-sm font-bold text-gray-900">&yen;' + w.amount.toLocaleString() + '</td>' +
                    '<td class="px-4 py-4 text-sm text-gray-600"><div>' + escapeHtml(w.bank_name) + '</div><div class="text-xs">' + escapeHtml(w.branch_name) + ' ' + accountTypeLabel(w.account_type) + '</div></td>' +
                    '<td class="px-4 py-4 text-sm text-gray-600">' + escapeHtml(w.account_holder) + '<div class="text-xs text-gray-400">' + escapeHtml(w.account_number) + '</div></td>' +
                    '<td class="px-4 py-4"><span class="px-2 py-1 text-xs rounded ' + sb[1] + '">' + sb[0] + '</span></td>' +
                    '<td class="px-4 py-4 text-sm text-gray-600">' + new Date(w.requested_at).toLocaleDateString('ja-JP') + '</td>' +
                    '<td class="px-4 py-4 text-sm">' +
                        '<button onclick="showDetail(' + w.id + ')" class="text-blue-600 hover:text-blue-800 mr-2" title="詳細"><i class="fas fa-eye"></i></button>' +
                        (w.status === 'pending' ? '<button onclick="approveWithdrawal(' + w.id + ')" class="text-green-600 hover:text-green-800 mr-2" title="承認"><i class="fas fa-check"></i></button><button onclick="rejectWithdrawal(' + w.id + ')" class="text-red-600 hover:text-red-800" title="却下"><i class="fas fa-times"></i></button>' : '') +
                        (w.status === 'processing' ? '<button onclick="completeWithdrawal(' + w.id + ')" class="text-green-600 hover:text-green-800" title="振込完了"><i class="fas fa-check-double"></i></button>' : '') +
                    '</td></tr>';
            }).join('');
        }

        function renderPagination(current, total) {
            var pagination = document.getElementById('pagination');
            var html = '<div class="text-sm text-gray-600">ページ ' + current + ' / ' + total + '</div><div class="flex space-x-2">';
            if (current > 1) html += '<button onclick="loadWithdrawals(' + (current - 1) + ')" class="px-3 py-1 border rounded hover:bg-gray-50">前へ</button>';
            if (current < total) html += '<button onclick="loadWithdrawals(' + (current + 1) + ')" class="px-3 py-1 border rounded hover:bg-gray-50">次へ</button>';
            html += '</div>';
            pagination.innerHTML = html;
        }

        function searchWithdrawals() { loadWithdrawals(1); }

        async function showDetail(id) {
            try {
                var res = await axios.get('/api/admin/withdrawals?page=1&limit=100');
                var w = (res.data.withdrawals || []).find(function(item) { return item.id === id; });
                if (!w) { alert('出金申請が見つかりません'); return; }
                
                var body = document.getElementById('modal-body');
                body.innerHTML = 
                    '<div class="grid grid-cols-2 gap-3">' +
                    '<div><span class="text-gray-500">ID:</span> <strong>#' + w.id + '</strong></div>' +
                    '<div><span class="text-gray-500">金額:</span> <strong class="text-red-600">&yen;' + w.amount.toLocaleString() + '</strong></div>' +
                    '<div><span class="text-gray-500">申請者:</span> ' + escapeHtml(w.user_name) + '</div>' +
                    '<div><span class="text-gray-500">メール:</span> ' + escapeHtml(w.user_email) + '</div>' +
                    '<div><span class="text-gray-500">銀行:</span> ' + escapeHtml(w.bank_name) + '</div>' +
                    '<div><span class="text-gray-500">支店:</span> ' + escapeHtml(w.branch_name) + '</div>' +
                    '<div><span class="text-gray-500">口座種別:</span> ' + accountTypeLabel(w.account_type) + '</div>' +
                    '<div><span class="text-gray-500">口座番号:</span> ' + escapeHtml(w.account_number) + '</div>' +
                    '<div class="col-span-2"><span class="text-gray-500">口座名義:</span> <strong>' + escapeHtml(w.account_holder) + '</strong></div>' +
                    '<div><span class="text-gray-500">申請日:</span> ' + new Date(w.requested_at).toLocaleString('ja-JP') + '</div>' +
                    '<div><span class="text-gray-500">ステータス:</span> ' + statusBadge(w.status)[0] + '</div>' +
                    (w.processed_at ? '<div><span class="text-gray-500">処理日:</span> ' + new Date(w.processed_at).toLocaleString('ja-JP') + '</div>' : '') +
                    (w.transferred_at ? '<div><span class="text-gray-500">振込日:</span> ' + new Date(w.transferred_at).toLocaleString('ja-JP') + '</div>' : '') +
                    (w.notes ? '<div class="col-span-2"><span class="text-gray-500">メモ:</span> ' + escapeHtml(w.notes) + '</div>' : '') +
                    (w.rejection_reason ? '<div class="col-span-2"><span class="text-gray-500">却下理由:</span> <span class="text-red-600">' + escapeHtml(w.rejection_reason) + '</span></div>' : '') +
                    '</div>';

                var actions = document.getElementById('modal-actions');
                actions.innerHTML = '<button onclick="closeModal()" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">閉じる</button>';

                document.getElementById('withdrawal-modal').classList.remove('hidden');
            } catch(e) {
                alert('詳細の取得に失敗しました');
            }
        }

        function closeModal() {
            document.getElementById('withdrawal-modal').classList.add('hidden');
        }

        async function approveWithdrawal(id) {
            if (!confirm('出金申請 #' + id + ' を承認（処理中に変更）しますか？')) return;
            try {
                await axios.put('/api/admin/withdrawals/' + id + '/status', { status: 'processing', notes: '管理者が承認' });
                alert('出金申請を承認しました（処理中）');
                loadWithdrawals(currentPage);
            } catch (err) {
                alert('承認に失敗しました: ' + (err.response?.data?.error || err.message));
            }
        }

        async function completeWithdrawal(id) {
            if (!confirm('出金申請 #' + id + ' の振込が完了しましたか？')) return;
            try {
                await axios.put('/api/admin/withdrawals/' + id + '/status', { status: 'completed', notes: '振込完了' });
                alert('振込完了に更新しました');
                loadWithdrawals(currentPage);
            } catch (err) {
                alert('更新に失敗しました: ' + (err.response?.data?.error || err.message));
            }
        }

        async function rejectWithdrawal(id) {
            var reason = prompt('却下理由を入力してください:');
            if (reason === null) return;
            if (!reason.trim()) { alert('却下理由を入力してください'); return; }
            try {
                await axios.put('/api/admin/withdrawals/' + id + '/status', { status: 'rejected', rejection_reason: reason });
                alert('出金申請を却下しました');
                loadWithdrawals(currentPage);
            } catch (err) {
                alert('却下に失敗しました: ' + (err.response?.data?.error || err.message));
            }
        }

        document.getElementById('status-filter').addEventListener('change', searchWithdrawals);
        loadWithdrawals(1);
    </script>
  `;

  return c.html(AdminLayout('withdrawals', '出金管理', content));
});

// お知らせ管理ページ
adminPagesRoutes.get('/announcements', (c) => {
  const content = `
    <div class="mb-8 flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">お知らせ管理</h2>
            <p class="text-gray-600">メンテナンス情報や重要なお知らせを管理します</p>
        </div>
        <button onclick="showCreateModal()" class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors">
            <i class="fas fa-plus mr-2"></i>新規作成
        </button>
    </div>

    <!-- フィルター -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center gap-4 flex-wrap">
        <select id="filter-type" onchange="loadAnnouncements()" class="border rounded-lg px-3 py-2 text-sm">
            <option value="">すべての種類</option>
            <option value="info">お知らせ</option>
            <option value="maintenance">メンテナンス</option>
            <option value="important">重要</option>
            <option value="update">アップデート</option>
            <option value="campaign">キャンペーン</option>
        </select>
        <select id="filter-status" onchange="loadAnnouncements()" class="border rounded-lg px-3 py-2 text-sm">
            <option value="">すべてのステータス</option>
            <option value="active">公開中</option>
            <option value="inactive">非公開</option>
        </select>
        <span id="total-count" class="text-sm text-gray-500 ml-auto">0件</span>
    </div>

    <!-- お知らせ一覧 -->
    <div id="announcements-list" class="space-y-4">
        <div class="text-center py-12 text-gray-500">読み込み中...</div>
    </div>

    <!-- ページネーション -->
    <div id="pagination" class="mt-6 flex justify-center gap-2"></div>

    <!-- 作成・編集モーダル -->
    <div id="modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)closeModal()">
        <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h3 id="modal-title" class="text-lg font-bold text-gray-800">お知らせ作成</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
            </div>
            <form id="announcement-form" onsubmit="saveAnnouncement(event)" class="p-6 space-y-4">
                <input type="hidden" id="form-id">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">タイトル <span class="text-red-500">*</span></label>
                    <input type="text" id="form-title" required class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="例: システムメンテナンスのお知らせ">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">内容 <span class="text-red-500">*</span></label>
                    <textarea id="form-content" required rows="5" class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none resize-y" placeholder="お知らせの詳細を入力してください..."></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">種類</label>
                        <select id="form-type" class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none">
                            <option value="info">📢 お知らせ</option>
                            <option value="maintenance">🔧 メンテナンス</option>
                            <option value="important">⚠️ 重要</option>
                            <option value="update">🔄 アップデート</option>
                            <option value="campaign">🎁 キャンペーン</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">優先度</label>
                        <select id="form-priority" class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none">
                            <option value="0">通常</option>
                            <option value="1">やや高い</option>
                            <option value="2">高い</option>
                            <option value="3">緊急</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">公開日時</label>
                        <input type="datetime-local" id="form-published-at" class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">有効期限 <span class="text-gray-400 font-normal">(任意)</span></label>
                        <input type="datetime-local" id="form-expires-at" class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none">
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="form-is-active" checked class="w-4 h-4 text-red-500 rounded">
                        <span class="text-sm text-gray-700">公開する</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="form-is-pinned" class="w-4 h-4 text-red-500 rounded">
                        <span class="text-sm text-gray-700">ピン留め（常に上部に表示）</span>
                    </label>
                </div>
                <div class="flex gap-3 pt-2">
                    <button type="submit" id="save-btn" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition-colors">
                        <i class="fas fa-save mr-2"></i>保存
                    </button>
                    <button type="button" onclick="closeModal()" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        キャンセル
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
    const TOKEN = localStorage.getItem('admin_token');
    const HEADERS = { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

    const typeLabels = {
        'info': { emoji: '📢', label: 'お知らせ', cls: 'bg-gray-100 text-gray-700' },
        'maintenance': { emoji: '🔧', label: 'メンテナンス', cls: 'bg-yellow-100 text-yellow-700' },
        'important': { emoji: '⚠️', label: '重要', cls: 'bg-red-100 text-red-700' },
        'update': { emoji: '🔄', label: 'アップデート', cls: 'bg-blue-100 text-blue-700' },
        'campaign': { emoji: '🎁', label: 'キャンペーン', cls: 'bg-green-100 text-green-700' }
    };

    let currentPage = 1;

    async function loadAnnouncements(page = 1) {
        currentPage = page;
        const type = document.getElementById('filter-type').value;
        const status = document.getElementById('filter-status').value;
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (type) params.set('type', type);
        if (status) params.set('status', status);

        try {
            const res = await fetch('/api/admin/announcements?' + params.toString(), { headers: HEADERS });
            const data = await res.json();

            document.getElementById('total-count').textContent = (data.total || 0) + '件';

            const list = document.getElementById('announcements-list');
            if (!data.data || data.data.length === 0) {
                list.innerHTML = '<div class="text-center py-12 bg-white rounded-lg"><i class="fas fa-bullhorn text-4xl text-gray-300 mb-4"></i><p class="text-gray-500">お知らせがありません</p><p class="text-sm text-gray-400 mt-1">「新規作成」ボタンから最初のお知らせを投稿しましょう</p></div>';
                document.getElementById('pagination').innerHTML = '';
                return;
            }

            list.innerHTML = data.data.map(function(a) {
                var t = typeLabels[a.type] || typeLabels['info'];
                var date = a.published_at ? new Date(a.published_at).toLocaleString('ja-JP') : '';
                var expDate = a.expires_at ? new Date(a.expires_at).toLocaleString('ja-JP') : '';
                var isExpired = a.expires_at && new Date(a.expires_at) < new Date();
                var statusBadge = !a.is_active
                    ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">非公開</span>'
                    : isExpired
                    ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">期限切れ</span>'
                    : '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">公開中</span>';
                var pinBadge = a.is_pinned ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600"><i class="fas fa-thumbtack mr-1"></i>ピン留め</span>' : '';

                return '<div class="bg-white rounded-lg shadow-sm p-5 border-l-4 ' + (a.is_active ? (a.type === 'important' ? 'border-red-500' : a.type === 'maintenance' ? 'border-yellow-500' : 'border-blue-500') : 'border-gray-300') + '">' +
                    '<div class="flex items-start justify-between gap-4">' +
                        '<div class="flex-1 min-w-0">' +
                            '<div class="flex items-center gap-2 mb-2 flex-wrap">' +
                                '<span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + t.cls + '">' + t.emoji + ' ' + t.label + '</span>' +
                                statusBadge + pinBadge +
                                '<span class="text-xs text-gray-400">#' + a.id + '</span>' +
                            '</div>' +
                            '<h3 class="font-bold text-gray-800 mb-1">' + escapeHtml(a.title) + '</h3>' +
                            '<p class="text-sm text-gray-600 mb-2 line-clamp-2">' + escapeHtml(a.content) + '</p>' +
                            '<div class="flex items-center gap-4 text-xs text-gray-400">' +
                                '<span><i class="far fa-calendar mr-1"></i>公開: ' + date + '</span>' +
                                (expDate ? '<span><i class="far fa-clock mr-1"></i>期限: ' + expDate + '</span>' : '') +
                                '<span>優先度: ' + a.priority + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center gap-2 flex-shrink-0">' +
                            '<button onclick="editAnnouncement(' + a.id + ')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="編集"><i class="fas fa-edit"></i></button>' +
                            '<button onclick="toggleActive(' + a.id + ', ' + (a.is_active ? 'false' : 'true') + ')" class="p-2 ' + (a.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50') + ' rounded-lg transition-colors" title="' + (a.is_active ? '非公開にする' : '公開する') + '"><i class="fas ' + (a.is_active ? 'fa-eye-slash' : 'fa-eye') + '"></i></button>' +
                            '<button onclick="deleteAnnouncement(' + a.id + ')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="削除"><i class="fas fa-trash"></i></button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');

            // ページネーション
            var pagHtml = '';
            if (data.totalPages > 1) {
                for (var i = 1; i <= data.totalPages; i++) {
                    pagHtml += '<button onclick="loadAnnouncements(' + i + ')" class="px-3 py-1 rounded ' + (i === page ? 'bg-red-500 text-white' : 'bg-white border hover:bg-gray-50') + '">' + i + '</button>';
                }
            }
            document.getElementById('pagination').innerHTML = pagHtml;
        } catch (error) {
            console.error('Load error:', error);
            document.getElementById('announcements-list').innerHTML = '<div class="text-center py-8 text-red-500">読み込みに失敗しました</div>';
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function showCreateModal() {
        document.getElementById('modal-title').textContent = 'お知らせ作成';
        document.getElementById('form-id').value = '';
        document.getElementById('form-title').value = '';
        document.getElementById('form-content').value = '';
        document.getElementById('form-type').value = 'info';
        document.getElementById('form-priority').value = '0';
        document.getElementById('form-is-active').checked = true;
        document.getElementById('form-is-pinned').checked = false;
        // デフォルトで現在時刻をセット
        var now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('form-published-at').value = now.toISOString().slice(0, 16);
        document.getElementById('form-expires-at').value = '';
        document.getElementById('modal').classList.remove('hidden');
    }

    async function editAnnouncement(id) {
        try {
            const res = await fetch('/api/admin/announcements?limit=100', { headers: HEADERS });
            const data = await res.json();
            const a = data.data.find(function(x) { return x.id === id; });
            if (!a) { alert('お知らせが見つかりません'); return; }

            document.getElementById('modal-title').textContent = 'お知らせ編集';
            document.getElementById('form-id').value = a.id;
            document.getElementById('form-title').value = a.title;
            document.getElementById('form-content').value = a.content;
            document.getElementById('form-type').value = a.type;
            document.getElementById('form-priority').value = String(a.priority);
            document.getElementById('form-is-active').checked = !!a.is_active;
            document.getElementById('form-is-pinned').checked = !!a.is_pinned;
            if (a.published_at) {
                var d = new Date(a.published_at);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                document.getElementById('form-published-at').value = d.toISOString().slice(0, 16);
            }
            if (a.expires_at) {
                var d2 = new Date(a.expires_at);
                d2.setMinutes(d2.getMinutes() - d2.getTimezoneOffset());
                document.getElementById('form-expires-at').value = d2.toISOString().slice(0, 16);
            } else {
                document.getElementById('form-expires-at').value = '';
            }
            document.getElementById('modal').classList.remove('hidden');
        } catch (error) {
            alert('読み込みに失敗しました');
        }
    }

    async function saveAnnouncement(event) {
        event.preventDefault();
        var id = document.getElementById('form-id').value;
        var publishedAt = document.getElementById('form-published-at').value;
        var expiresAt = document.getElementById('form-expires-at').value;

        var body = {
            title: document.getElementById('form-title').value,
            content: document.getElementById('form-content').value,
            type: document.getElementById('form-type').value,
            priority: parseInt(document.getElementById('form-priority').value),
            is_active: document.getElementById('form-is-active').checked,
            is_pinned: document.getElementById('form-is-pinned').checked,
            published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
        };

        var btn = document.getElementById('save-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';

        try {
            var url = id ? '/api/admin/announcements/' + id : '/api/admin/announcements';
            var method = id ? 'PUT' : 'POST';
            var res = await fetch(url, { method: method, headers: HEADERS, body: JSON.stringify(body) });
            var data = await res.json();
            if (data.success) {
                closeModal();
                loadAnnouncements(currentPage);
            } else {
                alert(data.error || '保存に失敗しました');
            }
        } catch (error) {
            alert('保存に失敗しました');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save mr-2"></i>保存';
        }
    }

    async function toggleActive(id, active) {
        try {
            // まずデータ取得
            var res = await fetch('/api/admin/announcements?limit=100', { headers: HEADERS });
            var data = await res.json();
            var a = data.data.find(function(x) { return x.id === id; });
            if (!a) return;

            await fetch('/api/admin/announcements/' + id, {
                method: 'PUT',
                headers: HEADERS,
                body: JSON.stringify({ ...a, is_active: active })
            });
            loadAnnouncements(currentPage);
        } catch (error) {
            alert('更新に失敗しました');
        }
    }

    async function deleteAnnouncement(id) {
        if (!confirm('このお知らせを削除しますか？')) return;
        try {
            await fetch('/api/admin/announcements/' + id, { method: 'DELETE', headers: HEADERS });
            loadAnnouncements(currentPage);
        } catch (error) {
            alert('削除に失敗しました');
        }
    }

    function closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    // 初期読み込み
    loadAnnouncements(1);
    </script>
  `;

  return c.html(AdminLayout('announcements', 'お知らせ管理', content));
});

export default adminPagesRoutes
