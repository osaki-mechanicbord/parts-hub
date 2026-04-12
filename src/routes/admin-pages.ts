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
                            <p class="text-xs text-gray-400">\${new Date(user.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</p>
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
                        \${new Date(user.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}
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
            document.getElementById('u-created').textContent = new Date(u.created_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
            document.getElementById('u-updated').textContent = new Date(u.updated_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});

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
                  products.map(p => '<tr class="border-b hover:bg-gray-50"><td class="py-2">' + p.id + '</td><td class="py-2"><a href="/admin/products/' + p.id + '" class="text-blue-500 hover:underline">' + p.title + '</a></td><td class="py-2">&yen;' + Math.round(p.price * 1.1).toLocaleString() + ' <span style="font-size:10px;color:#6b7280;">税込</span></td><td class="py-2"><span class="px-2 py-0.5 text-xs rounded ' +
                    (p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'sold' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600') + '">' +
                    (p.status === 'active' ? '出品中' : p.status === 'sold' ? '売却済' : p.status) + '</span></td><td class="py-2">' + new Date(p.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</td></tr>').join('') +
                  '</tbody></table>';

            // 取引履歴
            const txs = data.transactions || [];
            document.getElementById('u-transactions').innerHTML = txs.length === 0
                ? '<p class="text-gray-500 text-center py-4">取引履歴はありません</p>'
                : '<table class="w-full text-sm"><thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">ID</th><th class="pb-2">種別</th><th class="pb-2">商品</th><th class="pb-2">金額</th><th class="pb-2">ステータス</th><th class="pb-2">日付</th></tr></thead><tbody>' +
                  txs.map(t => '<tr class="border-b hover:bg-gray-50"><td class="py-2">' + t.id + '</td><td class="py-2"><span class="px-2 py-0.5 text-xs rounded ' +
                    (t.role === '購入' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700') + '">' + t.role + '</span></td><td class="py-2">' + (t.product_title || '-') + '</td><td class="py-2">&yen;' + t.amount.toLocaleString() + '</td><td class="py-2">' + t.status + '</td><td class="py-2">' + new Date(t.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</td></tr>').join('') +
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
                    <td class="px-6 py-4 text-sm text-gray-900">¥\${Math.round(p.price * 1.1).toLocaleString()} <span style="font-size:10px;color:#6b7280;">税込</span></td>
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
                    <td class="px-6 py-4 text-sm text-gray-600">\${new Date(p.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</td>
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
            document.getElementById('p-price').textContent = '¥' + Math.round((p.price || 0) * 1.1).toLocaleString() + '（税込）';
            document.getElementById('p-condition').textContent = conditionLabel(p.condition);
            document.getElementById('p-category').textContent = p.category || '-';
            document.getElementById('p-manufacturer').textContent = p.manufacturer || '-';
            document.getElementById('p-part-number').textContent = p.part_number || '-';
            document.getElementById('p-stock').textContent = (p.stock_quantity != null ? p.stock_quantity : 1) + '個';
            document.getElementById('p-views').textContent = (p.view_count || p.views || 0) + '回';
            document.getElementById('p-favs').textContent = (data.favorite_count || 0) + '件';
            document.getElementById('p-created').textContent = new Date(p.created_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
            document.getElementById('p-updated').textContent = new Date(p.updated_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
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
                  txs.map(function(t) { return '<tr class="border-b hover:bg-gray-50"><td class="py-2">' + t.id + '</td><td class="py-2">' + (t.buyer_name || '-') + '</td><td class="py-2">¥' + t.amount.toLocaleString() + '</td><td class="py-2">' + t.status + '</td><td class="py-2">' + new Date(t.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</td></tr>'; }).join('') +
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
                    <td class="px-6 py-4 text-sm text-gray-600">\${new Date(t.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</td>
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
                                <span class="text-sm text-gray-600">\${new Date(r.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</span>
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
                                <span class="ml-3 text-sm text-gray-600">\${new Date(r.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</span>
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
                        <td class="px-6 py-4 text-sm text-gray-600">\${new Date(t.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</td>
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
                        \${article.published_at ? new Date(article.published_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) : '-'}
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

// ===== 振込確認ページ =====
adminPagesRoutes.get('/invoice-orders', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="fas fa-file-invoice-dollar text-green-600 mr-2"></i>振込確認管理</h2>
    
    <!-- フィルタータブ -->
    <div class="flex gap-2 mb-6">
        <button onclick="loadInvoiceOrders('awaiting_transfer')" id="tab-awaiting" class="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800 border-2 border-yellow-400">
            <i class="fas fa-clock mr-1"></i>振込待ち
        </button>
        <button onclick="loadInvoiceOrders('paid')" id="tab-paid" class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200">
            <i class="fas fa-check-circle mr-1"></i>確認済み
        </button>
        <button onclick="loadInvoiceOrders('all')" id="tab-all" class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200">
            <i class="fas fa-list mr-1"></i>すべて
        </button>
    </div>
    
    <!-- 注文一覧 -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">請求書番号</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">商品</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">購入者</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">出品者</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">金額</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">振込期限</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ステータス</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody id="invoice-orders-tbody" class="divide-y divide-gray-200">
                    <tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">読み込み中...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- 詳細モーダル -->
    <div id="invoice-detail-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold text-gray-900 mb-4" id="invoice-modal-title">注文詳細</h3>
            <div id="invoice-modal-body"></div>
            <div class="mt-4 flex gap-3">
                <button onclick="document.getElementById('invoice-detail-modal').classList.add('hidden')" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">閉じる</button>
            </div>
        </div>
    </div>
    
    <script>
    var currentInvoiceTab = 'awaiting_transfer';
    
    function loadInvoiceOrders(status) {
        currentInvoiceTab = status || 'awaiting_transfer';
        // タブスタイル切替
        ['awaiting', 'paid', 'all'].forEach(function(t) {
            var el = document.getElementById('tab-' + t);
            if (!el) return;
            if ((t === 'awaiting' && status === 'awaiting_transfer') || t === status) {
                el.className = 'px-4 py-2 rounded-lg text-sm font-medium border-2 ' + 
                    (t === 'awaiting' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 
                     t === 'paid' ? 'bg-green-100 text-green-800 border-green-400' : 'bg-blue-100 text-blue-800 border-blue-400');
            } else {
                el.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200';
            }
        });
        
        var token = localStorage.getItem('admin_token');
        axios.get('/api/admin/invoice-orders?status=' + status, {
            headers: { Authorization: 'Bearer ' + token }
        }).then(function(res) {
            var orders = res.data.orders || [];
            var tbody = document.getElementById('invoice-orders-tbody');
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">該当する注文はありません</td></tr>';
                return;
            }
            tbody.innerHTML = orders.map(function(o) {
                var statusBadge = o.status === 'awaiting_transfer' 
                    ? '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">振込待ち</span>'
                    : o.status === 'paid'
                    ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">振込確認済</span>'
                    : '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">' + o.status + '</span>';
                var dueDate = o.invoice_due_date ? new Date(o.invoice_due_date).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) : '-';
                var isOverdue = o.status === 'awaiting_transfer' && o.invoice_due_date && new Date(o.invoice_due_date) < new Date();
                var dueDateHtml = isOverdue ? '<span class="text-red-600 font-bold">' + dueDate + ' <i class="fas fa-exclamation-triangle"></i></span>' : dueDate;
                
                var actions = '';
                if (o.status === 'awaiting_transfer') {
                    actions = '<button onclick="confirmTransfer(' + o.id + ')" class="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 mr-1"><i class="fas fa-check mr-1"></i>振込確認</button>';
                } else if (o.status === 'paid') {
                    actions = '<button onclick="notifySeller(' + o.id + ')" class="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 mr-1"><i class="fas fa-paper-plane mr-1"></i>発送依頼</button>';
                }
                actions += '<button onclick="showInvoiceDetail(' + o.id + ')" class="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"><i class="fas fa-eye"></i></button>';
                
                return '<tr class="hover:bg-gray-50">' +
                    '<td class="px-4 py-3 text-sm font-mono font-bold text-gray-900">' + (o.invoice_number || '-') + '</td>' +
                    '<td class="px-4 py-3 text-sm text-gray-900 max-w-[150px] truncate">' + (o.product_title || '-') + '</td>' +
                    '<td class="px-4 py-3 text-sm text-gray-600">' + (o.buyer_display_name || o.buyer_name || '-') + '</td>' +
                    '<td class="px-4 py-3 text-sm text-gray-600">' + (o.seller_display_name || o.seller_name || '-') + '</td>' +
                    '<td class="px-4 py-3 text-sm font-bold text-gray-900">&yen;' + (o.amount || 0).toLocaleString() + '</td>' +
                    '<td class="px-4 py-3 text-sm">' + dueDateHtml + '</td>' +
                    '<td class="px-4 py-3 text-sm">' + statusBadge + '</td>' +
                    '<td class="px-4 py-3 text-sm whitespace-nowrap">' + actions + '</td>' +
                    '</tr>';
            }).join('');
        }).catch(function(err) {
            console.error('Invoice orders load error:', err);
            document.getElementById('invoice-orders-tbody').innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">読み込みエラー</td></tr>';
        });
    }
    
    function confirmTransfer(orderId) {
        var note = prompt('振込確認メモ（任意）：\\n例: ○○銀行より ¥xx,xxx 入金確認', '');
        if (note === null) return; // キャンセル
        
        var token = localStorage.getItem('admin_token');
        axios.post('/api/admin/invoice-orders/' + orderId + '/confirm-transfer', { note: note }, {
            headers: { Authorization: 'Bearer ' + token }
        }).then(function(res) {
            alert(res.data.message || '振込を確認しました');
            loadInvoiceOrders(currentInvoiceTab);
        }).catch(function(err) {
            alert(err.response?.data?.error || '処理に失敗しました');
        });
    }
    
    function notifySeller(orderId) {
        if (!confirm('出品者と購入者に通知を送信しますか？\\n\\n出品者: 発送依頼\\n購入者: 振込確認完了通知')) return;
        
        var token = localStorage.getItem('admin_token');
        axios.post('/api/admin/invoice-orders/' + orderId + '/notify-seller', {}, {
            headers: { Authorization: 'Bearer ' + token }
        }).then(function(res) {
            alert(res.data.message || '通知を送信しました');
            loadInvoiceOrders(currentInvoiceTab);
        }).catch(function(err) {
            alert(err.response?.data?.error || '通知の送信に失敗しました');
        });
    }
    
    function showInvoiceDetail(orderId) {
        var token = localStorage.getItem('admin_token');
        axios.get('/api/admin/invoice-orders?status=all', {
            headers: { Authorization: 'Bearer ' + token }
        }).then(function(res) {
            var order = (res.data.orders || []).find(function(o) { return o.id === orderId; });
            if (!order) { alert('注文が見つかりません'); return; }
            
            var billing = {};
            try { billing = JSON.parse(order.billing_info || '{}'); } catch(e) {}
            
            document.getElementById('invoice-modal-title').textContent = '注文詳細 - ' + (order.invoice_number || '');
            document.getElementById('invoice-modal-body').innerHTML = 
                '<div class="space-y-3">' +
                '<div class="bg-gray-50 p-3 rounded-lg"><span class="text-gray-500 text-sm">商品:</span> <strong>' + (order.product_title || '-') + '</strong></div>' +
                '<div class="grid grid-cols-2 gap-3">' +
                    '<div class="bg-gray-50 p-3 rounded-lg"><span class="text-gray-500 text-sm block">購入者</span><strong>' + (order.buyer_display_name || order.buyer_name || '-') + '</strong><br><span class="text-xs text-gray-400">' + (order.buyer_email || '') + '</span></div>' +
                    '<div class="bg-gray-50 p-3 rounded-lg"><span class="text-gray-500 text-sm block">出品者</span><strong>' + (order.seller_display_name || order.seller_name || '-') + '</strong><br><span class="text-xs text-gray-400">' + (order.seller_email || '') + '</span></div>' +
                '</div>' +
                '<div class="grid grid-cols-2 gap-3">' +
                    '<div class="bg-gray-50 p-3 rounded-lg"><span class="text-gray-500 text-sm block">金額</span><strong class="text-red-600">&yen;' + (order.amount || 0).toLocaleString() + '</strong></div>' +
                    '<div class="bg-gray-50 p-3 rounded-lg"><span class="text-gray-500 text-sm block">手数料</span>&yen;' + (order.fee || 0).toLocaleString() + '</div>' +
                '</div>' +
                '<div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200"><span class="text-gray-500 text-sm block">振込期限</span><strong>' + (order.invoice_due_date ? new Date(order.invoice_due_date).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) : '-') + '</strong></div>' +
                (billing.company_name ? '<div class="bg-blue-50 p-3 rounded-lg border border-blue-200"><span class="text-gray-500 text-sm block mb-1">請求先情報</span>' +
                    '<div><strong>' + (billing.company_name || '') + '</strong></div>' +
                    (billing.contact_name ? '<div class="text-sm">' + billing.contact_name + '</div>' : '') +
                    (billing.address ? '<div class="text-sm text-gray-600">' + billing.address + '</div>' : '') +
                    (billing.email ? '<div class="text-sm text-gray-600">' + billing.email + '</div>' : '') +
                    (billing.phone ? '<div class="text-sm text-gray-600">' + billing.phone + '</div>' : '') +
                '</div>' : '') +
                (order.transfer_note ? '<div class="bg-green-50 p-3 rounded-lg border border-green-200"><span class="text-gray-500 text-sm block">振込確認メモ</span>' + order.transfer_note + '</div>' : '') +
                (order.transfer_confirmed_at ? '<div class="bg-green-50 p-3 rounded-lg border border-green-200"><span class="text-gray-500 text-sm block">振込確認日時</span>' + new Date(order.transfer_confirmed_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</div>' : '') +
                '</div>';
            
            document.getElementById('invoice-detail-modal').classList.remove('hidden');
        }).catch(function(err) {
            alert('詳細の取得に失敗しました');
        });
    }
    
    // 初期読み込み
    document.addEventListener('DOMContentLoaded', function() {
        loadInvoiceOrders('awaiting_transfer');
    });
    </script>
  `;
  return c.html(AdminLayout('invoice-orders', '振込確認管理', content));
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
                    '<td class="px-4 py-4 text-sm text-gray-600">' + new Date(w.requested_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</td>' +
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
                    '<div><span class="text-gray-500">申請日:</span> ' + new Date(w.requested_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</div>' +
                    '<div><span class="text-gray-500">ステータス:</span> ' + statusBadge(w.status)[0] + '</div>' +
                    (w.processed_at ? '<div><span class="text-gray-500">処理日:</span> ' + new Date(w.processed_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</div>' : '') +
                    (w.transferred_at ? '<div><span class="text-gray-500">振込日:</span> ' + new Date(w.transferred_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</div>' : '') +
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
                var date = a.published_at ? new Date(a.published_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}) : '';
                var expDate = a.expires_at ? new Date(a.expires_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}) : '';
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

// ══════════════════════════════════════════════════════════════
// フランチャイズ管理画面 — CMS編集・エリア管理・問い合わせ管理
// ══════════════════════════════════════════════════════════════
adminPagesRoutes.get('/franchise', (c) => {
  const content = `
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-1"><i class="fas fa-handshake text-red-500 mr-2"></i>フランチャイズ管理</h2>
        <p class="text-sm text-gray-500">CMS編集・エリア管理・問い合わせ管理を一元管理</p>
    </div>

    <!-- タブ切り替え -->
    <div class="flex border-b border-gray-200 mb-6">
        <button onclick="switchTab('cms')" id="tab-cms" class="px-5 py-3 text-sm font-semibold border-b-2 border-red-500 text-red-600 -mb-px"><i class="fas fa-edit mr-1"></i>CMS編集</button>
        <button onclick="switchTab('areas')" id="tab-areas" class="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px"><i class="fas fa-map-marker-alt mr-1"></i>エリア管理</button>
        <button onclick="switchTab('inquiries')" id="tab-inquiries" class="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px"><i class="fas fa-envelope mr-1"></i>問い合わせ<span id="inquiry-badge" class="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 hidden">0</span></button>
    </div>

    <!-- ── CMS編集タブ ── -->
    <div id="panel-cms">
      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-heading mr-2 text-blue-500"></i>ヒーロー・基本設定</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">ヒーロータイトル</label>
            <input type="text" id="cms-hero_title" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="全国の整備工場と繋がる出品代行パートナー募集">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">ヒーローサブタイトル</label>
            <input type="text" id="cms-hero_subtitle" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="PARTS HUBの出品代行パートナーとして...">
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-yen-sign mr-2 text-emerald-500"></i>料金設定</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">初期費用（円）</label>
            <input type="number" id="cms-initial_fee" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="150000">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">月額費用（円）</label>
            <input type="number" id="cms-monthly_fee" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">報酬率（%）</label>
            <input type="number" id="cms-commission_rate" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="5" step="0.1">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">プラットフォーム手数料率（%）</label>
            <input type="number" id="cms-platform_fee_rate" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="10" step="0.1">
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-calculator mr-2 text-purple-500"></i>収益シミュレーション設定</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="border rounded-lg p-4">
            <p class="text-xs font-bold text-blue-500 mb-3">副業プラン</p>
            <div class="space-y-2">
              <div><label class="text-[11px] text-gray-500">月間出品数</label><input type="number" id="cms-light_listings" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="50"></div>
              <div><label class="text-[11px] text-gray-500">平均単価（円）</label><input type="number" id="cms-light_avg_price" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="5000"></div>
              <div><label class="text-[11px] text-gray-500">目標収入（円）※自動算出可</label><input type="number" id="cms-target_income_light" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="自動算出"></div>
            </div>
          </div>
          <div class="border-2 border-red-200 rounded-lg p-4 bg-red-50/30">
            <p class="text-xs font-bold text-red-500 mb-3">標準プラン（推奨）</p>
            <div class="space-y-2">
              <div><label class="text-[11px] text-gray-500">月間出品数</label><input type="number" id="cms-standard_listings" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="100"></div>
              <div><label class="text-[11px] text-gray-500">平均単価（円）</label><input type="number" id="cms-standard_avg_price" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="5000"></div>
              <div><label class="text-[11px] text-gray-500">目標収入（円）</label><input type="number" id="cms-target_income_standard" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="自動算出"></div>
            </div>
          </div>
          <div class="border rounded-lg p-4">
            <p class="text-xs font-bold text-emerald-500 mb-3">本格プラン</p>
            <div class="space-y-2">
              <div><label class="text-[11px] text-gray-500">月間出品数</label><input type="number" id="cms-heavy_listings" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="200"></div>
              <div><label class="text-[11px] text-gray-500">平均単価（円）</label><input type="number" id="cms-heavy_avg_price" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="7000"></div>
              <div><label class="text-[11px] text-gray-500">目標収入（円）</label><input type="number" id="cms-target_income_heavy" class="w-full px-2 py-1.5 border rounded text-sm" placeholder="自動算出"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-tasks mr-2 text-amber-500"></i>仕事内容（改行区切り）</h3>
        <textarea id="cms-job_description" rows="4" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="工場訪問・情報ヒアリング&#10;パーツの撮影・出品登録&#10;問い合わせ・価格交渉対応&#10;売上管理・報酬受取"></textarea>
        <p class="text-[11px] text-gray-400 mt-1">1行＝1ステップ。「タイトル - 説明」形式で記述できます。</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-star mr-2 text-yellow-500"></i>メリット（改行区切り）</h3>
        <textarea id="cms-benefits" rows="4" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="在庫リスクなし - 整備工場に保管されたまま&#10;初期費用のみ - 月額固定費0円&#10;自分のペースで - 副業からスタート可能&#10;全国ネットワーク - 整備工場との繋がり"></textarea>
      </div>

      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-question-circle mr-2 text-indigo-500"></i>FAQ（JSON形式）</h3>
        <textarea id="cms-faq" rows="8" class="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder='[{"q":"質問","a":"回答"}]'></textarea>
        <div class="flex gap-2 mt-2">
          <button onclick="addFaqItem()" class="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100"><i class="fas fa-plus mr-1"></i>FAQ追加</button>
          <button onclick="formatFaq()" class="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200"><i class="fas fa-align-left mr-1"></i>整形</button>
        </div>
      </div>

      <div class="flex gap-3">
        <button onclick="saveCmsAll()" id="cms-save-btn" class="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">
          <i class="fas fa-save mr-2"></i>CMS設定を一括保存
        </button>
        <a href="/franchise" target="_blank" class="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-600 flex items-center">
          <i class="fas fa-external-link-alt mr-2"></i>公開ページ確認
        </a>
      </div>
      <div id="cms-status" class="mt-3 text-sm hidden"></div>
    </div>

    <!-- ── エリア管理タブ ── -->
    <div id="panel-areas" class="hidden">
      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-map mr-2 text-blue-500"></i>全国エリアステータス</h3>
          <div class="flex gap-3 text-xs">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>募集中 <span id="area-recruiting-count" class="font-bold">0</span></span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>予定 <span id="area-planned-count" class="font-bold">0</span></span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>決定済 <span id="area-closed-count" class="font-bold">0</span></span>
            <span class="flex items-center gap-1"><i class="fas fa-user-tie text-blue-500"></i>パートナー計 <span id="area-total-partners" class="font-bold">0</span></span>
          </div>
        </div>
        <div class="flex gap-2 mb-4">
          <select id="area-filter-region" onchange="filterAreas()" class="text-sm border rounded-lg px-3 py-1.5">
            <option value="">全地域</option>
            <option value="北海道">北海道</option><option value="東北">東北</option><option value="関東">関東</option>
            <option value="中部">中部</option><option value="近畿">近畿</option><option value="中国">中国</option>
            <option value="四国">四国</option><option value="九州・沖縄">九州・沖縄</option>
          </select>
          <select id="area-filter-status" onchange="filterAreas()" class="text-sm border rounded-lg px-3 py-1.5">
            <option value="">全ステータス</option>
            <option value="recruiting">募集中</option><option value="planned">予定</option><option value="closed">決定済</option>
          </select>
          <button onclick="bulkAreaUpdate()" class="ml-auto text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"><i class="fas fa-sync mr-1"></i>一括反映</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">都道府県</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">地域</th><th class="px-3 py-2 text-center text-xs font-bold text-gray-500">ステータス</th><th class="px-3 py-2 text-center text-xs font-bold text-gray-500">パートナー数</th><th class="px-3 py-2 text-center text-xs font-bold text-gray-500">操作</th></tr>
            </thead>
            <tbody id="areas-tbody"></tbody>
          </table>
        </div>
      </div>
      <div id="area-status" class="text-sm hidden"></div>
    </div>

    <!-- ── 問い合わせ管理タブ ── -->
    <div id="panel-inquiries" class="hidden">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-blue-800 font-medium"><i class="fas fa-info-circle mr-1"></i>全問い合わせの統合管理</p>
          <p class="text-xs text-blue-600 mt-1">サイト全体のお問い合わせ（フォーム + パートナー資料請求）を一元管理できます</p>
        </div>
        <a href="/admin/inquiries" class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 whitespace-nowrap"><i class="fas fa-external-link-alt mr-1"></i>統合管理画面</a>
      </div>
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-envelope-open-text mr-2 text-purple-500"></i>パートナー資料請求一覧</h3>
          <button onclick="loadInquiries()" class="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200"><i class="fas fa-sync mr-1"></i>更新</button>
        </div>
        <div id="inquiries-list" class="space-y-3">
          <p class="text-gray-400 text-center py-6">読み込み中...</p>
        </div>
      </div>
    </div>

    <!-- 問い合わせ詳細モーダル -->
    <div id="inquiry-modal" class="fixed inset-0 bg-black/50 z-[100] hidden flex items-center justify-center">
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold"><i class="fas fa-user mr-2 text-purple-500"></i>問い合わせ詳細</h3>
          <button onclick="document.getElementById('inquiry-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-lg"></i></button>
        </div>
        <div id="inquiry-detail" class="space-y-3"></div>
      </div>
    </div>

    <script>
    var HEADERS = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') };
    var allAreas = [];
    var PREF_REGIONS = {
      hokkaido:'北海道',aomori:'東北',iwate:'東北',miyagi:'東北',akita:'東北',yamagata:'東北',fukushima:'東北',
      ibaraki:'関東',tochigi:'関東',gunma:'関東',saitama:'関東',chiba:'関東',tokyo:'関東',kanagawa:'関東',
      niigata:'中部',toyama:'中部',ishikawa:'中部',fukui:'中部',yamanashi:'中部',nagano:'中部',gifu:'中部',shizuoka:'中部',aichi:'中部',
      mie:'近畿',shiga:'近畿',kyoto:'近畿',osaka:'近畿',hyogo:'近畿',nara:'近畿',wakayama:'近畿',
      tottori:'中国',shimane:'中国',okayama:'中国',hiroshima:'中国',yamaguchi:'中国',
      tokushima:'四国',kagawa:'四国',ehime:'四国',kochi:'四国',
      fukuoka:'九州・沖縄',saga:'九州・沖縄',nagasaki:'九州・沖縄',kumamoto:'九州・沖縄',oita:'九州・沖縄',miyazaki:'九州・沖縄',kagoshima:'九州・沖縄',okinawa:'九州・沖縄'
    };
    var PREF_NAMES = {
      hokkaido:'北海道',aomori:'青森県',iwate:'岩手県',miyagi:'宮城県',akita:'秋田県',yamagata:'山形県',fukushima:'福島県',
      ibaraki:'茨城県',tochigi:'栃木県',gunma:'群馬県',saitama:'埼玉県',chiba:'千葉県',tokyo:'東京都',kanagawa:'神奈川県',
      niigata:'新潟県',toyama:'富山県',ishikawa:'石川県',fukui:'福井県',yamanashi:'山梨県',nagano:'長野県',gifu:'岐阜県',shizuoka:'静岡県',aichi:'愛知県',
      mie:'三重県',shiga:'滋賀県',kyoto:'京都府',osaka:'大阪府',hyogo:'兵庫県',nara:'奈良県',wakayama:'和歌山県',
      tottori:'鳥取県',shimane:'島根県',okayama:'岡山県',hiroshima:'広島県',yamaguchi:'山口県',
      tokushima:'徳島県',kagawa:'香川県',ehime:'愛媛県',kochi:'高知県',
      fukuoka:'福岡県',saga:'佐賀県',nagasaki:'長崎県',kumamoto:'熊本県',oita:'大分県',miyazaki:'宮崎県',kagoshima:'鹿児島県',okinawa:'沖縄県'
    };

    // ── タブ切り替え ──
    function switchTab(name) {
        ['cms','areas','inquiries'].forEach(function(t) {
            document.getElementById('panel-' + t).classList.toggle('hidden', t !== name);
            var btn = document.getElementById('tab-' + t);
            if (t === name) {
                btn.classList.add('border-red-500','text-red-600');
                btn.classList.remove('border-transparent','text-gray-500');
            } else {
                btn.classList.remove('border-red-500','text-red-600');
                btn.classList.add('border-transparent','text-gray-500');
            }
        });
        if (name === 'areas' && allAreas.length === 0) loadAreas();
        if (name === 'inquiries') loadInquiries();
    }

    // ── CMS読み込み ──
    async function loadCms() {
        try {
            var res = await fetch('/api/franchise/cms', { headers: HEADERS });
            var data = await res.json();
            if (!data.success) return;
            var d = data.data;

            // テキスト・数値フィールド
            var fields = ['hero_title','hero_subtitle','initial_fee','monthly_fee','commission_rate','platform_fee_rate',
                          'light_listings','light_avg_price','target_income_light',
                          'standard_listings','standard_avg_price','target_income_standard',
                          'heavy_listings','heavy_avg_price','target_income_heavy'];
            fields.forEach(function(f) {
                var el = document.getElementById('cms-' + f);
                if (el && d[f] !== undefined && d[f] !== null) el.value = d[f];
            });

            // 配列フィールド
            if (d.job_description && Array.isArray(d.job_description)) {
                document.getElementById('cms-job_description').value = d.job_description.join('\\n');
            }
            if (d.benefits && Array.isArray(d.benefits)) {
                document.getElementById('cms-benefits').value = d.benefits.join('\\n');
            }
            if (d.faq) {
                document.getElementById('cms-faq').value = JSON.stringify(d.faq, null, 2);
            }
        } catch (e) { console.error('CMS load error:', e); }
    }

    // ── CMS一括保存 ──
    async function saveCmsAll() {
        var btn = document.getElementById('cms-save-btn');
        var status = document.getElementById('cms-status');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';

        try {
            var items = [];
            // テキスト・数値
            var simple = ['hero_title','hero_subtitle','initial_fee','monthly_fee','commission_rate','platform_fee_rate',
                          'light_listings','light_avg_price','target_income_light',
                          'standard_listings','standard_avg_price','target_income_standard',
                          'heavy_listings','heavy_avg_price','target_income_heavy'];
            simple.forEach(function(f) {
                var el = document.getElementById('cms-' + f);
                if (!el) return;
                var val = el.value;
                if (val === '') return;
                // 数値フィールド
                if (['initial_fee','monthly_fee','commission_rate','platform_fee_rate',
                     'light_listings','light_avg_price','target_income_light',
                     'standard_listings','standard_avg_price','target_income_standard',
                     'heavy_listings','heavy_avg_price','target_income_heavy'].indexOf(f) >= 0) {
                    val = Number(val);
                }
                items.push({ key: f, value: val });
            });

            // 配列
            var jd = document.getElementById('cms-job_description').value.trim();
            if (jd) items.push({ key: 'job_description', value: jd.split('\\n').filter(function(s){return s.trim();}) });

            var bn = document.getElementById('cms-benefits').value.trim();
            if (bn) items.push({ key: 'benefits', value: bn.split('\\n').filter(function(s){return s.trim();}) });

            // FAQ
            var faqStr = document.getElementById('cms-faq').value.trim();
            if (faqStr) {
                try {
                    var faqVal = JSON.parse(faqStr);
                    items.push({ key: 'faq', value: faqVal });
                } catch(e) { alert('FAQのJSON形式が不正です'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-save mr-2"></i>CMS設定を一括保存'; return; }
            }

            var res = await fetch('/api/franchise/cms/bulk', {
                method: 'PUT', headers: HEADERS, body: JSON.stringify({ items: items })
            });
            var result = await res.json();
            if (result.success) {
                status.className = 'mt-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2';
                status.innerHTML = '<i class="fas fa-check-circle mr-1"></i>CMS設定を保存しました（' + items.length + '項目）';
                status.classList.remove('hidden');
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            status.className = 'mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2';
            status.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>保存に失敗しました: ' + e.message;
            status.classList.remove('hidden');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save mr-2"></i>CMS設定を一括保存';
        setTimeout(function(){ status.classList.add('hidden'); }, 5000);
    }

    // ── FAQ操作 ──
    function addFaqItem() {
        var el = document.getElementById('cms-faq');
        try {
            var arr = el.value.trim() ? JSON.parse(el.value) : [];
            arr.push({ q: '新しい質問', a: '回答を入力してください' });
            el.value = JSON.stringify(arr, null, 2);
        } catch(e) { alert('JSONの形式を修正してからFAQを追加してください'); }
    }
    function formatFaq() {
        var el = document.getElementById('cms-faq');
        try { el.value = JSON.stringify(JSON.parse(el.value), null, 2); } catch(e) { alert('JSONの形式が不正です'); }
    }

    // ── エリア読み込み ──
    async function loadAreas() {
        try {
            var res = await fetch('/api/franchise/areas', { headers: HEADERS });
            var data = await res.json();
            if (!data.success) return;
            allAreas = Object.entries(data.data).map(function(e) {
                return { slug: e[0], status: e[1].status, partner_count: e[1].partner_count, name: PREF_NAMES[e[0]] || e[0], region: PREF_REGIONS[e[0]] || '' };
            });
            renderAreas(allAreas);
        } catch(e) { console.error('Areas load error:', e); }
    }

    function filterAreas() {
        var region = document.getElementById('area-filter-region').value;
        var status = document.getElementById('area-filter-status').value;
        var filtered = allAreas.filter(function(a) {
            if (region && a.region !== region) return false;
            if (status && a.status !== status) return false;
            return true;
        });
        renderAreas(filtered);
    }

    function renderAreas(areas) {
        var tbody = document.getElementById('areas-tbody');
        var rCount = 0, pCount = 0, cCount = 0, totalP = 0;
        allAreas.forEach(function(a) {
            if (a.status === 'recruiting') rCount++;
            else if (a.status === 'planned') pCount++;
            else if (a.status === 'closed') cCount++;
            totalP += a.partner_count || 0;
        });
        document.getElementById('area-recruiting-count').textContent = rCount;
        document.getElementById('area-planned-count').textContent = pCount;
        document.getElementById('area-closed-count').textContent = cCount;
        document.getElementById('area-total-partners').textContent = totalP;

        var html = '';
        areas.forEach(function(a) {
            var statusBadge = a.status === 'recruiting'
                ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">募集中</span>'
                : a.status === 'closed'
                ? '<span class="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-semibold">決定済</span>'
                : '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-xs font-semibold">予定</span>';
            html += '<tr class="border-b hover:bg-gray-50">';
            html += '<td class="px-3 py-2.5 font-semibold">' + escapeHtml(a.name) + '</td>';
            html += '<td class="px-3 py-2.5 text-gray-500 text-xs">' + escapeHtml(a.region) + '</td>';
            html += '<td class="px-3 py-2.5 text-center"><select data-slug="' + a.slug + '" data-field="status" class="area-field text-xs border rounded px-2 py-1">';
            html += '<option value="recruiting"' + (a.status==='recruiting'?' selected':'') + '>募集中</option>';
            html += '<option value="planned"' + (a.status==='planned'?' selected':'') + '>予定</option>';
            html += '<option value="closed"' + (a.status==='closed'?' selected':'') + '>決定済</option></select></td>';
            html += '<td class="px-3 py-2.5 text-center"><input type="number" data-slug="' + a.slug + '" data-field="partner_count" class="area-field w-16 text-center text-sm border rounded px-2 py-1" value="' + (a.partner_count||0) + '" min="0"></td>';
            html += '<td class="px-3 py-2.5 text-center"><button onclick="saveArea(\\'' + a.slug + '\\')" class="text-xs text-blue-500 hover:text-blue-700 font-semibold"><i class="fas fa-save mr-1"></i>保存</button></td>';
            html += '</tr>';
        });
        tbody.innerHTML = html || '<tr><td colspan="5" class="text-center py-6 text-gray-400">該当なし</td></tr>';
    }

    async function saveArea(slug) {
        var statusEl = document.querySelector('select[data-slug="' + slug + '"][data-field="status"]');
        var countEl = document.querySelector('input[data-slug="' + slug + '"][data-field="partner_count"]');
        try {
            var res = await fetch('/api/franchise/areas/' + slug, {
                method: 'PUT', headers: HEADERS,
                body: JSON.stringify({ status: statusEl.value, partner_count: parseInt(countEl.value) || 0 })
            });
            var data = await res.json();
            if (data.success) {
                // allAreasも更新
                allAreas.forEach(function(a) { if (a.slug === slug) { a.status = statusEl.value; a.partner_count = parseInt(countEl.value) || 0; } });
                renderAreas(allAreas);
            } else { alert('保存エラー: ' + data.error); }
        } catch(e) { alert('保存に失敗しました'); }
    }

    async function bulkAreaUpdate() {
        if (!confirm('全てのエリアの変更を一括保存しますか？')) return;
        var fields = document.querySelectorAll('.area-field');
        var updates = {};
        fields.forEach(function(el) {
            var slug = el.dataset.slug;
            var field = el.dataset.field;
            if (!updates[slug]) updates[slug] = {};
            updates[slug][field] = field === 'partner_count' ? parseInt(el.value) || 0 : el.value;
        });
        var ok = 0, err = 0;
        for (var slug in updates) {
            try {
                var res = await fetch('/api/franchise/areas/' + slug, {
                    method: 'PUT', headers: HEADERS, body: JSON.stringify(updates[slug])
                });
                var d = await res.json();
                if (d.success) ok++; else err++;
            } catch(e) { err++; }
        }
        alert('一括更新完了: 成功 ' + ok + '件' + (err > 0 ? ', 失敗 ' + err + '件' : ''));
        loadAreas();
    }

    // ── 問い合わせ読み込み ──
    async function loadInquiries() {
        try {
            var res = await fetch('/api/franchise/inquiries', { headers: HEADERS });
            var data = await res.json();
            if (!data.success) return;
            var list = data.data || [];
            var badge = document.getElementById('inquiry-badge');
            if (list.length > 0) { badge.textContent = list.length; badge.classList.remove('hidden'); }
            else { badge.classList.add('hidden'); }

            var container = document.getElementById('inquiries-list');
            if (list.length === 0) {
                container.innerHTML = '<p class="text-gray-400 text-center py-6"><i class="fas fa-inbox mr-2"></i>問い合わせはまだありません</p>';
                return;
            }
            var html = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">日時</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">氏名</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">メール</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">電話</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">希望エリア</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">職業</th><th class="px-3 py-2 text-center text-xs font-bold text-gray-500">操作</th></tr></thead><tbody>';
            var occupations = { auto_mechanic:'整備士', auto_dealer:'ディーラー', parts_dealer:'部品卸商', used_car:'中古車販売', office_worker:'会社員', self_employed:'自営業', other:'その他' };
            list.forEach(function(item, idx) {
                var date = item.created_at ? new Date(item.created_at).toLocaleString('ja-JP') : '-';
                var prefName = PREF_NAMES[item.area_pref] || item.area_pref || '-';
                var occName = occupations[item.occupation] || item.occupation || '-';
                html += '<tr class="border-b hover:bg-gray-50">';
                html += '<td class="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">' + date + '</td>';
                html += '<td class="px-3 py-2.5 font-semibold">' + escapeHtml(item.name) + '</td>';
                html += '<td class="px-3 py-2.5"><a href="mailto:' + escapeHtml(item.email) + '" class="text-blue-500 hover:underline">' + escapeHtml(item.email) + '</a></td>';
                html += '<td class="px-3 py-2.5 text-gray-500">' + escapeHtml(item.phone || '-') + '</td>';
                html += '<td class="px-3 py-2.5">' + escapeHtml(prefName) + '</td>';
                html += '<td class="px-3 py-2.5 text-xs">' + escapeHtml(occName) + '</td>';
                html += '<td class="px-3 py-2.5 text-center"><button onclick="showInquiry(' + idx + ')" class="text-xs text-purple-500 hover:text-purple-700 font-semibold"><i class="fas fa-eye mr-1"></i>詳細</button></td>';
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;

            // グローバルに保持
            window._inquiries = list;
        } catch(e) { console.error('Inquiries load error:', e); }
    }

    function showInquiry(idx) {
        var item = window._inquiries[idx];
        if (!item) return;
        var occupations = { auto_mechanic:'整備士', auto_dealer:'ディーラー', parts_dealer:'部品卸商', used_car:'中古車販売', office_worker:'会社員', self_employed:'自営業', other:'その他' };
        var detail = document.getElementById('inquiry-detail');
        detail.innerHTML = '<div class="space-y-3">'
            + '<div class="flex justify-between"><span class="text-xs text-gray-400">受付日時</span><span class="text-sm font-medium">' + (item.created_at ? new Date(item.created_at).toLocaleString('ja-JP') : '-') + '</span></div>'
            + '<div class="flex justify-between"><span class="text-xs text-gray-400">氏名</span><span class="text-sm font-bold">' + escapeHtml(item.name) + '</span></div>'
            + '<div class="flex justify-between"><span class="text-xs text-gray-400">メール</span><a href="mailto:' + escapeHtml(item.email) + '" class="text-sm text-blue-500">' + escapeHtml(item.email) + '</a></div>'
            + '<div class="flex justify-between"><span class="text-xs text-gray-400">電話番号</span><span class="text-sm">' + escapeHtml(item.phone || '-') + '</span></div>'
            + '<div class="flex justify-between"><span class="text-xs text-gray-400">希望エリア</span><span class="text-sm">' + escapeHtml(PREF_NAMES[item.area_pref] || item.area_pref || '-') + '</span></div>'
            + '<div class="flex justify-between"><span class="text-xs text-gray-400">ご職業</span><span class="text-sm">' + escapeHtml(occupations[item.occupation] || item.occupation || '-') + '</span></div>'
            + '<div class="flex justify-between"><span class="text-xs text-gray-400">業界経験</span><span class="text-sm">' + (item.experience === 'yes' ? 'あり' : item.experience === 'no' ? 'なし' : '-') + '</span></div>'
            + (item.message ? '<div class="pt-2 border-t"><p class="text-xs text-gray-400 mb-1">ご質問・ご要望</p><p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">' + escapeHtml(item.message) + '</p></div>' : '')
            + '</div>';
        document.getElementById('inquiry-modal').classList.remove('hidden');
    }

    // 初期読み込み
    loadCms();
    loadInquiries(); // バッジ用
    </script>
  `;

  return c.html(AdminLayout('franchise', 'フランチャイズ管理', content));
});

// ══════════════════════════════════════════════════════════════
// 整備ガイド管理画面
// ══════════════════════════════════════════════════════════════
adminPagesRoutes.get('/guides', (c) => {
  const content = `
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-1"><i class="fas fa-book-open text-blue-500 mr-2"></i>整備ガイド管理</h2>
        <p class="text-sm text-gray-500">ガイド記事の作成・編集・自動生成管理</p>
    </div>

    <!-- タブ切り替え -->
    <div class="flex border-b border-gray-200 mb-6">
        <button onclick="switchGuideTab('list')" id="gtab-list" class="px-5 py-3 text-sm font-semibold border-b-2 border-red-500 text-red-600 -mb-px"><i class="fas fa-list mr-1"></i>記事一覧</button>
        <button onclick="switchGuideTab('create')" id="gtab-create" class="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px"><i class="fas fa-plus mr-1"></i>新規作成</button>
        <button onclick="switchGuideTab('auto')" id="gtab-auto" class="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px"><i class="fas fa-robot mr-1"></i>自動生成</button>
        <button onclick="switchGuideTab('pool')" id="gtab-pool" class="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px"><i class="fas fa-database mr-1"></i>キーワードプール</button>
    </div>

    <!-- ── 記事一覧 ── -->
    <div id="gpanel-list">
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex gap-2">
            <select id="guide-filter-status" onchange="loadGuideList()" class="text-sm border rounded-lg px-3 py-1.5">
              <option value="">全ステータス</option>
              <option value="published">公開中</option>
              <option value="draft">下書き</option>
            </select>
          </div>
          <div class="flex gap-2 text-xs">
            <span class="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">公開 <span id="guide-pub-count">0</span></span>
            <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">下書き <span id="guide-draft-count">0</span></span>
          </div>
        </div>
        <div id="guide-list-content" class="space-y-2">
          <p class="text-gray-400 text-center py-6">読み込み中...</p>
        </div>
      </div>
    </div>

    <!-- ── 新規作成 ── -->
    <div id="gpanel-create" class="hidden">
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-pen-fancy mr-2 text-blue-500"></i>ガイド記事作成</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">テンプレート</label>
            <select id="guide-template" class="w-full px-3 py-2 border rounded-lg text-sm" onchange="onTemplateChange()">
              <option value="">テンプレートを選択</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">ステータス</label>
            <select id="guide-status" class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="draft">下書き</option>
              <option value="published">公開</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">スラッグ（URL）</label>
            <input type="text" id="guide-slug" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="example-guide-slug">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">カテゴリ</label>
            <input type="text" id="guide-category" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="費用比較">
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-gray-600 mb-1">タイトル</label>
          <input type="text" id="guide-title" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="ガイド記事のタイトル">
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-gray-600 mb-1">説明（meta description）</label>
          <textarea id="guide-description" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="記事の概要"></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-gray-600 mb-1">セクション（JSON）</label>
          <textarea id="guide-sections" rows="8" class="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder='[{"heading":"見出し","body":"本文"}]'></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-gray-600 mb-1">比較テーブル（JSON、任意）</label>
          <textarea id="guide-comparison" rows="4" class="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder='[{"item":"品目","dealer":"5万円","parts_hub":"2万円","savings":"60%"}]'></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick="saveGuide()" id="guide-save-btn" class="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20"><i class="fas fa-save mr-2"></i>保存</button>
          <button onclick="previewGuide()" class="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-600"><i class="fas fa-eye mr-2"></i>プレビュー</button>
        </div>
        <div id="guide-save-status" class="mt-3 text-sm hidden"></div>
      </div>
    </div>

    <!-- ── 自動生成 ── -->
    <div id="gpanel-auto" class="hidden">
      <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-robot mr-2 text-purple-500"></i>自動生成ステータス</h3>
        <div id="auto-status-content" class="text-sm text-gray-500">読み込み中...</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-play-circle mr-2 text-emerald-500"></i>手動実行</h3>
        <div class="flex gap-3 mb-4">
          <button onclick="triggerAutoGenerate('guide')" class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"><i class="fas fa-book mr-1"></i>ガイド1件生成</button>
          <button onclick="triggerAutoGenerate('news')" class="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"><i class="fas fa-newspaper mr-1"></i>地域ニュース1件生成</button>
          <button onclick="triggerAutoGenerate('both')" class="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600"><i class="fas fa-magic mr-1"></i>両方生成</button>
        </div>
        <div id="auto-gen-result" class="text-sm hidden"></div>
      </div>
    </div>

    <!-- ── キーワードプール ── -->
    <div id="gpanel-pool" class="hidden">
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-database mr-2 text-amber-500"></i>キーワードプール</h3>
        <div id="pool-content" class="text-sm text-gray-500">読み込み中...</div>
      </div>
    </div>

    <!-- 編集モーダル -->
    <div id="guide-edit-modal" class="fixed inset-0 bg-black/50 z-[100] hidden flex items-center justify-center">
      <div class="bg-white rounded-2xl p-6 w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold"><i class="fas fa-edit mr-2 text-blue-500"></i>記事編集</h3>
          <button onclick="document.getElementById('guide-edit-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-lg"></i></button>
        </div>
        <div class="space-y-4">
          <input type="hidden" id="edit-guide-slug">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">タイトル</label>
            <input type="text" id="edit-guide-title" class="w-full px-3 py-2 border rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">説明</label>
            <textarea id="edit-guide-description" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">カテゴリ</label>
            <input type="text" id="edit-guide-category" class="w-full px-3 py-2 border rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">ステータス</label>
            <select id="edit-guide-status" class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="draft">下書き</option>
              <option value="published">公開</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">セクション（JSON）</label>
            <textarea id="edit-guide-sections" rows="10" class="w-full px-3 py-2 border rounded-lg text-sm font-mono"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">比較テーブル（JSON）</label>
            <textarea id="edit-guide-comparison" rows="4" class="w-full px-3 py-2 border rounded-lg text-sm font-mono"></textarea>
          </div>
          <div class="flex gap-3">
            <button onclick="updateGuide()" class="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600"><i class="fas fa-save mr-2"></i>更新</button>
            <button onclick="document.getElementById('guide-edit-modal').classList.add('hidden')" class="px-6 py-2.5 border rounded-xl hover:bg-gray-50 text-gray-600">キャンセル</button>
          </div>
        </div>
      </div>
    </div>

    <script>
    var HEADERS = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') };

    function switchGuideTab(name) {
        ['list','create','auto','pool'].forEach(function(t) {
            document.getElementById('gpanel-' + t).classList.toggle('hidden', t !== name);
            var btn = document.getElementById('gtab-' + t);
            if (t === name) { btn.classList.add('border-red-500','text-red-600'); btn.classList.remove('border-transparent','text-gray-500'); }
            else { btn.classList.remove('border-red-500','text-red-600'); btn.classList.add('border-transparent','text-gray-500'); }
        });
        if (name === 'list') loadGuideList();
        if (name === 'auto') loadAutoStatus();
        if (name === 'pool') loadKeywordPool();
        if (name === 'create') loadTemplates();
    }

    // ── 記事一覧 ──
    async function loadGuideList() {
        try {
            var status = document.getElementById('guide-filter-status').value;
            var url = '/api/guides/list' + (status ? '?status=' + status : '');
            var res = await fetch(url, { headers: HEADERS });
            var data = await res.json();
            var list = data.data || [];

            var pubCount = 0, draftCount = 0;
            list.forEach(function(a) { if (a.status === 'published') pubCount++; else draftCount++; });
            document.getElementById('guide-pub-count').textContent = pubCount;
            document.getElementById('guide-draft-count').textContent = draftCount;

            var container = document.getElementById('guide-list-content');
            if (list.length === 0) { container.innerHTML = '<p class="text-gray-400 text-center py-6">記事がありません</p>'; return; }

            var html = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">タイトル</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">カテゴリ</th><th class="px-3 py-2 text-center text-xs font-bold text-gray-500">ステータス</th><th class="px-3 py-2 text-center text-xs font-bold text-gray-500">PV</th><th class="px-3 py-2 text-left text-xs font-bold text-gray-500">更新日</th><th class="px-3 py-2 text-center text-xs font-bold text-gray-500">操作</th></tr></thead><tbody>';
            list.forEach(function(a) {
                var statusBadge = a.status === 'published'
                    ? '<span class="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-semibold">公開</span>'
                    : '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">下書き</span>';
                var date = a.updated_at ? new Date(a.updated_at).toLocaleDateString('ja-JP') : '-';
                html += '<tr class="border-b hover:bg-gray-50">';
                html += '<td class="px-3 py-2.5"><div class="font-semibold text-sm">' + escapeHtml(a.title) + '</div><div class="text-[11px] text-gray-400">/guide/' + escapeHtml(a.slug) + '</div></td>';
                html += '<td class="px-3 py-2.5 text-xs text-gray-500">' + escapeHtml(a.category || '-') + '</td>';
                html += '<td class="px-3 py-2.5 text-center">' + statusBadge + '</td>';
                html += '<td class="px-3 py-2.5 text-center text-gray-500">' + (a.view_count || 0) + '</td>';
                html += '<td class="px-3 py-2.5 text-xs text-gray-500">' + date + '</td>';
                html += '<td class="px-3 py-2.5 text-center"><div class="flex gap-2 justify-center">';
                html += '<a href="/guide/' + a.slug + '" target="_blank" class="text-xs text-blue-500 hover:text-blue-700"><i class="fas fa-eye"></i></a>';
                html += '<button onclick="editGuide(\\'' + a.slug + '\\')" class="text-xs text-amber-500 hover:text-amber-700"><i class="fas fa-edit"></i></button>';
                html += '<button onclick="deleteGuide(\\'' + a.slug + '\\')" class="text-xs text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>';
                html += '</div></td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch(e) { console.error('Guide list error:', e); }
    }

    // ── 記事編集 ──
    async function editGuide(slug) {
        try {
            var res = await fetch('/api/guides/detail/' + slug, { headers: HEADERS });
            var data = await res.json();
            if (!data.success) { alert('記事の読み込みに失敗'); return; }
            var a = data.data;
            document.getElementById('edit-guide-slug').value = a.slug;
            document.getElementById('edit-guide-title').value = a.title;
            document.getElementById('edit-guide-description').value = a.description || '';
            document.getElementById('edit-guide-category').value = a.category || '';
            document.getElementById('edit-guide-status').value = a.status || 'draft';
            document.getElementById('edit-guide-sections').value = JSON.stringify(a.sections || [], null, 2);
            document.getElementById('edit-guide-comparison').value = a.comparison ? JSON.stringify(a.comparison, null, 2) : '';
            document.getElementById('guide-edit-modal').classList.remove('hidden');
        } catch(e) { alert('読み込みに失敗しました'); }
    }

    async function updateGuide() {
        var slug = document.getElementById('edit-guide-slug').value;
        try {
            var sections = JSON.parse(document.getElementById('edit-guide-sections').value);
            var compStr = document.getElementById('edit-guide-comparison').value.trim();
            var comparison = compStr ? JSON.parse(compStr) : null;
            var body = {
                slug: slug,
                title: document.getElementById('edit-guide-title').value,
                description: document.getElementById('edit-guide-description').value,
                category: document.getElementById('edit-guide-category').value,
                status: document.getElementById('edit-guide-status').value,
                sections: sections,
                comparison: comparison
            };
            var res = await fetch('/api/guides/save', { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
            var data = await res.json();
            if (data.success) {
                document.getElementById('guide-edit-modal').classList.add('hidden');
                loadGuideList();
                alert('更新しました');
            } else { alert('更新失敗: ' + data.error); }
        } catch(e) { alert('JSONの形式を確認してください: ' + e.message); }
    }

    async function deleteGuide(slug) {
        if (!confirm('「' + slug + '」を削除しますか？')) return;
        try {
            var res = await fetch('/api/guides/' + slug, { method: 'DELETE', headers: HEADERS });
            var data = await res.json();
            if (data.success) loadGuideList();
            else alert('削除失敗: ' + data.error);
        } catch(e) { alert('削除に失敗しました'); }
    }

    // ── テンプレート読み込み ──
    async function loadTemplates() {
        try {
            var res = await fetch('/api/guides/templates', { headers: HEADERS });
            var data = await res.json();
            var sel = document.getElementById('guide-template');
            if (sel.options.length <= 1) {
                (data.data || []).forEach(function(t) {
                    var opt = document.createElement('option');
                    opt.value = t.name;
                    opt.textContent = t.label + ' - ' + t.description;
                    sel.appendChild(opt);
                });
            }
        } catch(e) { console.error(e); }
    }

    function onTemplateChange() {
        var tmpl = document.getElementById('guide-template').value;
        if (tmpl) document.getElementById('guide-category').value = tmpl === 'cost-comparison' ? '費用比較' : tmpl === 'how-to' ? '実践ガイド' : tmpl === 'business-improvement' ? '経営改善' : 'Web集客';
    }

    // ── 新規保存 ──
    async function saveGuide() {
        var btn = document.getElementById('guide-save-btn');
        var status = document.getElementById('guide-save-status');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
        try {
            var sectionsStr = document.getElementById('guide-sections').value.trim();
            var compStr = document.getElementById('guide-comparison').value.trim();
            var sections = sectionsStr ? JSON.parse(sectionsStr) : [];
            var comparison = compStr ? JSON.parse(compStr) : null;
            var body = {
                slug: document.getElementById('guide-slug').value,
                title: document.getElementById('guide-title').value,
                description: document.getElementById('guide-description').value,
                category: document.getElementById('guide-category').value,
                status: document.getElementById('guide-status').value,
                template_type: document.getElementById('guide-template').value || null,
                sections: sections,
                comparison: comparison
            };
            var res = await fetch('/api/guides/save', { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
            var data = await res.json();
            if (data.success) {
                status.className = 'mt-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2';
                status.innerHTML = '<i class="fas fa-check-circle mr-1"></i>' + data.message;
                status.classList.remove('hidden');
            } else { throw new Error(data.error); }
        } catch(e) {
            status.className = 'mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2';
            status.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>保存失敗: ' + e.message;
            status.classList.remove('hidden');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save mr-2"></i>保存';
    }

    function previewGuide() {
        var slug = document.getElementById('guide-slug').value;
        if (slug) window.open('/guide/' + slug, '_blank');
        else alert('スラッグを入力してください');
    }

    // ── 自動生成ステータス ──
    async function loadAutoStatus() {
        try {
            var res = await fetch('/api/guides/auto-generate/status', { headers: HEADERS });
            var data = await res.json();
            if (!data.success) return;
            var d = data.data;
            var html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
            html += '<div class="border rounded-xl p-4"><h4 class="font-bold text-sm mb-3"><i class="fas fa-book text-blue-500 mr-1"></i>ガイド記事</h4>';
            html += '<div class="grid grid-cols-3 gap-3 text-center">';
            html += '<div><div class="text-2xl font-black text-blue-500">' + d.guide.total_keywords + '</div><div class="text-[11px] text-gray-500">キーワード総数</div></div>';
            html += '<div><div class="text-2xl font-black text-emerald-500">' + d.guide.generated + '</div><div class="text-[11px] text-gray-500">生成済み</div></div>';
            html += '<div><div class="text-2xl font-black text-amber-500">' + d.guide.remaining + '</div><div class="text-[11px] text-gray-500">残り</div></div>';
            html += '</div>';
            html += '<div class="mt-3 bg-blue-50 rounded-lg p-2 text-xs text-blue-700 text-center">1日1記事ペースであと <strong>' + d.guide.days_of_content + '</strong> 日分のコンテンツ</div></div>';
            html += '<div class="border rounded-xl p-4"><h4 class="font-bold text-sm mb-3"><i class="fas fa-newspaper text-purple-500 mr-1"></i>地域ニュース</h4>';
            html += '<div class="grid grid-cols-2 gap-3 text-center">';
            html += '<div><div class="text-2xl font-black text-purple-500">' + d.regional_news.total_prefectures + '</div><div class="text-[11px] text-gray-500">都道府県数</div></div>';
            html += '<div><div class="text-2xl font-black text-emerald-500">' + d.regional_news.generated_count + '</div><div class="text-[11px] text-gray-500">生成済み記事</div></div>';
            html += '</div>';
            html += '<div class="mt-3 text-xs text-gray-500">季節テーマ: ' + (d.regional_news.current_season || []).join(', ') + '</div></div>';
            html += '</div>';
            document.getElementById('auto-status-content').innerHTML = html;
        } catch(e) { document.getElementById('auto-status-content').innerHTML = '<p class="text-red-500">読み込みエラー</p>'; }
    }

    async function triggerAutoGenerate(type) {
        var el = document.getElementById('auto-gen-result');
        el.className = 'text-sm bg-blue-50 text-blue-700 rounded-lg px-4 py-2';
        el.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>生成中...';
        el.classList.remove('hidden');
        try {
            var res = await fetch('/api/guides/auto-generate?key=ph-cron-2026-secure&type=' + type, { headers: HEADERS });
            var data = await res.json();
            if (data.success) {
                var msgs = (data.generated || []).map(function(g) { return g.type + ': ' + g.title + ' (' + g.status + ')'; });
                el.className = 'text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-4 py-2';
                el.innerHTML = '<i class="fas fa-check-circle mr-1"></i>' + data.message + '<br>' + msgs.join('<br>');
                loadAutoStatus();
            } else { throw new Error(data.error); }
        } catch(e) {
            el.className = 'text-sm bg-red-50 text-red-700 rounded-lg px-4 py-2';
            el.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>生成エラー: ' + e.message;
        }
    }

    // ── キーワードプール ──
    async function loadKeywordPool() {
        try {
            var res = await fetch('/api/guides/keyword-pool', { headers: HEADERS });
            var data = await res.json();
            var pool = data.data || [];
            var html = '<p class="text-xs text-gray-500 mb-3">全 ' + pool.length + ' キーワード</p>';
            html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">';
            pool.forEach(function(kw) {
                var typeColor = kw.template === 'cost-comparison' ? 'bg-blue-100 text-blue-700' : kw.template === 'how-to' ? 'bg-emerald-100 text-emerald-700' : kw.template === 'business-improvement' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700';
                html += '<div class="border rounded-lg p-2.5 hover:bg-gray-50 flex items-start gap-2">';
                html += '<span class="text-[10px] px-1.5 py-0.5 rounded ' + typeColor + ' whitespace-nowrap flex-shrink-0">' + escapeHtml(kw.template) + '</span>';
                html += '<div class="min-w-0"><div class="text-xs font-semibold truncate">' + escapeHtml(kw.title) + '</div><div class="text-[10px] text-gray-400 truncate">/guide/' + escapeHtml(kw.slug) + '</div></div></div>';
            });
            html += '</div>';
            document.getElementById('pool-content').innerHTML = html;
        } catch(e) { document.getElementById('pool-content').innerHTML = '<p class="text-red-500">読み込みエラー</p>'; }
    }

    // 初期読み込み
    loadGuideList();
    </script>
  `;

  return c.html(AdminLayout('guides', '整備ガイド管理', content));
});

// ══════════════════════════════════════════════════════════════
// パートナー管理画面（次フェーズ: DB設計→API→管理画面）
// ══════════════════════════════════════════════════════════════
adminPagesRoutes.get('/partners', (c) => {
  const content = `
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-1"><i class="fas fa-user-tie text-amber-500 mr-2"></i>パートナー管理</h2>
        <p class="text-sm text-gray-500">登録パートナーの管理・実績追跡</p>
    </div>

    <!-- タブ切り替え -->
    <div class="flex border-b border-gray-200 mb-6">
        <button onclick="switchPartnerTab('list')" id="ptab-list" class="px-5 py-3 text-sm font-semibold border-b-2 border-red-500 text-red-600 -mb-px"><i class="fas fa-list mr-1"></i>パートナー一覧</button>
        <button onclick="switchPartnerTab('register')" id="ptab-register" class="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px"><i class="fas fa-user-plus mr-1"></i>新規登録</button>
        <button onclick="switchPartnerTab('stats')" id="ptab-stats" class="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px"><i class="fas fa-chart-bar mr-1"></i>実績レポート</button>
    </div>

    <!-- パートナー一覧 -->
    <div id="ppanel-list">
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex gap-3 text-xs">
            <span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">アクティブ <span id="partner-active-count">0</span></span>
            <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">研修中 <span id="partner-training-count">0</span></span>
            <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">休止中 <span id="partner-inactive-count">0</span></span>
          </div>
          <button onclick="loadPartners()" class="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200"><i class="fas fa-sync mr-1"></i>更新</button>
        </div>
        <div id="partner-list-content">
          <p class="text-gray-400 text-center py-6">読み込み中...</p>
        </div>
      </div>
    </div>

    <!-- 新規登録 -->
    <div id="ppanel-register" class="hidden">
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-user-plus mr-2 text-blue-500"></i>パートナー新規登録</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">氏名 <span class="text-red-500">*</span></label>
            <input type="text" id="p-name" class="w-full px-3 py-2 border rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">メールアドレス <span class="text-red-500">*</span></label>
            <input type="email" id="p-email" class="w-full px-3 py-2 border rounded-lg text-sm">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">電話番号</label>
            <input type="tel" id="p-phone" class="w-full px-3 py-2 border rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">担当エリア</label>
            <select id="p-area" class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">選択してください</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">ステータス</label>
            <select id="p-status" class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="training">研修中</option>
              <option value="active">アクティブ</option>
              <option value="inactive">休止中</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1">契約日</label>
            <input type="date" id="p-contract-date" class="w-full px-3 py-2 border rounded-lg text-sm">
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-bold text-gray-600 mb-1">備考</label>
          <textarea id="p-notes" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="特記事項"></textarea>
        </div>
        <button onclick="registerPartner()" id="p-register-btn" class="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20">
          <i class="fas fa-user-plus mr-2"></i>登録する
        </button>
        <div id="p-register-status" class="mt-3 text-sm hidden"></div>
      </div>
    </div>

    <!-- 実績レポート -->
    <div id="ppanel-stats" class="hidden">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div class="text-sm opacity-90">総パートナー数</div>
          <div class="text-3xl font-black mt-1" id="stat-total">0</div>
        </div>
        <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div class="text-sm opacity-90">今月の出品数</div>
          <div class="text-3xl font-black mt-1" id="stat-listings">0</div>
        </div>
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div class="text-sm opacity-90">今月の売上（パートナー報酬）</div>
          <div class="text-3xl font-black mt-1" id="stat-revenue">&yen;0</div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-trophy mr-2 text-amber-500"></i>パートナー実績ランキング</h3>
        <div id="partner-ranking">
          <p class="text-gray-400 text-center py-6">パートナーが登録されるとランキングが表示されます</p>
        </div>
      </div>
    </div>

    <script>
    var HEADERS = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') };
    var PREF_NAMES = {
      hokkaido:'北海道',aomori:'青森県',iwate:'岩手県',miyagi:'宮城県',akita:'秋田県',yamagata:'山形県',fukushima:'福島県',
      ibaraki:'茨城県',tochigi:'栃木県',gunma:'群馬県',saitama:'埼玉県',chiba:'千葉県',tokyo:'東京都',kanagawa:'神奈川県',
      niigata:'新潟県',toyama:'富山県',ishikawa:'石川県',fukui:'福井県',yamanashi:'山梨県',nagano:'長野県',gifu:'岐阜県',shizuoka:'静岡県',aichi:'愛知県',
      mie:'三重県',shiga:'滋賀県',kyoto:'京都府',osaka:'大阪府',hyogo:'兵庫県',nara:'奈良県',wakayama:'和歌山県',
      tottori:'鳥取県',shimane:'島根県',okayama:'岡山県',hiroshima:'広島県',yamaguchi:'山口県',
      tokushima:'徳島県',kagawa:'香川県',ehime:'愛媛県',kochi:'高知県',
      fukuoka:'福岡県',saga:'佐賀県',nagasaki:'長崎県',kumamoto:'熊本県',oita:'大分県',miyazaki:'宮崎県',kagoshima:'鹿児島県',okinawa:'沖縄県'
    };

    function switchPartnerTab(name) {
        ['list','register','stats'].forEach(function(t) {
            document.getElementById('ppanel-' + t).classList.toggle('hidden', t !== name);
            var btn = document.getElementById('ptab-' + t);
            if (t === name) { btn.classList.add('border-red-500','text-red-600'); btn.classList.remove('border-transparent','text-gray-500'); }
            else { btn.classList.remove('border-red-500','text-red-600'); btn.classList.add('border-transparent','text-gray-500'); }
        });
        if (name === 'list') loadPartners();
        if (name === 'register') populateAreaSelect();
        if (name === 'stats') loadPartnerStats();
    }

    function populateAreaSelect() {
        var sel = document.getElementById('p-area');
        if (sel.options.length <= 1) {
            Object.entries(PREF_NAMES).forEach(function(e) {
                var opt = document.createElement('option');
                opt.value = e[0];
                opt.textContent = e[1];
                sel.appendChild(opt);
            });
        }
    }

    // ── パートナー一覧 ──
    async function loadPartners() {
        try {
            var res = await fetch('/api/admin/partners', { headers: HEADERS });
            var data = await res.json();
            var list = data.data || [];
            var active = 0, training = 0, inactive = 0;
            list.forEach(function(p) {
                if (p.status === 'active') active++;
                else if (p.status === 'training') training++;
                else inactive++;
            });
            document.getElementById('partner-active-count').textContent = active;
            document.getElementById('partner-training-count').textContent = training;
            document.getElementById('partner-inactive-count').textContent = inactive;

            var container = document.getElementById('partner-list-content');
            if (list.length === 0) {
                container.innerHTML = '<p class="text-gray-400 text-center py-6"><i class="fas fa-user-slash mr-2"></i>登録パートナーはまだいません。<br><span class="text-xs">「新規登録」タブからパートナーを追加できます。</span></p>';
                return;
            }
            var html = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr>';
            html += '<th class="px-3 py-2 text-left text-xs font-bold text-gray-500">氏名</th>';
            html += '<th class="px-3 py-2 text-left text-xs font-bold text-gray-500">メール</th>';
            html += '<th class="px-3 py-2 text-left text-xs font-bold text-gray-500">エリア</th>';
            html += '<th class="px-3 py-2 text-center text-xs font-bold text-gray-500">ステータス</th>';
            html += '<th class="px-3 py-2 text-center text-xs font-bold text-gray-500">出品数</th>';
            html += '<th class="px-3 py-2 text-center text-xs font-bold text-gray-500">売上</th>';
            html += '<th class="px-3 py-2 text-left text-xs font-bold text-gray-500">契約日</th>';
            html += '<th class="px-3 py-2 text-center text-xs font-bold text-gray-500">操作</th>';
            html += '</tr></thead><tbody>';
            list.forEach(function(p) {
                var statusBadge = p.status === 'active'
                    ? '<span class="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-semibold">アクティブ</span>'
                    : p.status === 'training'
                    ? '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-xs font-semibold">研修中</span>'
                    : '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">休止中</span>';
                html += '<tr class="border-b hover:bg-gray-50">';
                html += '<td class="px-3 py-2.5 font-semibold">' + escapeHtml(p.name) + '</td>';
                html += '<td class="px-3 py-2.5"><a href="mailto:' + escapeHtml(p.email) + '" class="text-blue-500 text-xs hover:underline">' + escapeHtml(p.email) + '</a></td>';
                html += '<td class="px-3 py-2.5 text-xs">' + escapeHtml(PREF_NAMES[p.area_pref] || p.area_pref || '-') + '</td>';
                html += '<td class="px-3 py-2.5 text-center">' + statusBadge + '</td>';
                html += '<td class="px-3 py-2.5 text-center text-gray-500">' + (p.total_listings || 0) + '</td>';
                html += '<td class="px-3 py-2.5 text-center text-gray-500">&yen;' + ((p.total_revenue || 0)).toLocaleString() + '</td>';
                html += '<td class="px-3 py-2.5 text-xs text-gray-500">' + (p.contract_date || '-') + '</td>';
                html += '<td class="px-3 py-2.5 text-center">';
                html += '<button onclick="updatePartnerStatus(' + p.id + ',\\'' + (p.status === 'active' ? 'inactive' : 'active') + '\\')" class="text-xs text-blue-500 hover:text-blue-700 mr-2"><i class="fas fa-toggle-' + (p.status === 'active' ? 'on' : 'off') + '"></i></button>';
                html += '<button onclick="deletePartner(' + p.id + ')" class="text-xs text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>';
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch(e) {
            // APIがまだない場合
            document.getElementById('partner-list-content').innerHTML = '<p class="text-gray-400 text-center py-6"><i class="fas fa-user-slash mr-2"></i>登録パートナーはまだいません。<br><span class="text-xs">「新規登録」タブからパートナーを追加できます。</span></p>';
        }
    }

    async function registerPartner() {
        var btn = document.getElementById('p-register-btn');
        var status = document.getElementById('p-register-status');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登録中...';
        try {
            var body = {
                name: document.getElementById('p-name').value,
                email: document.getElementById('p-email').value,
                phone: document.getElementById('p-phone').value,
                area_pref: document.getElementById('p-area').value,
                status: document.getElementById('p-status').value,
                contract_date: document.getElementById('p-contract-date').value,
                notes: document.getElementById('p-notes').value
            };
            if (!body.name || !body.email) { alert('氏名とメールは必須です'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>登録する'; return; }
            var res = await fetch('/api/admin/partners', { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
            var data = await res.json();
            if (data.success) {
                status.className = 'mt-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2';
                status.innerHTML = '<i class="fas fa-check-circle mr-1"></i>パートナーを登録しました';
                status.classList.remove('hidden');
                // フォームリセット
                ['p-name','p-email','p-phone','p-notes','p-contract-date'].forEach(function(id) { document.getElementById(id).value = ''; });
            } else { throw new Error(data.error); }
        } catch(e) {
            status.className = 'mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2';
            status.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>登録失敗: ' + e.message;
            status.classList.remove('hidden');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>登録する';
    }

    async function updatePartnerStatus(id, status) {
        try {
            await fetch('/api/admin/partners/' + id, { method: 'PUT', headers: HEADERS, body: JSON.stringify({ status: status }) });
            loadPartners();
        } catch(e) { alert('更新に失敗しました'); }
    }

    async function deletePartner(id) {
        if (!confirm('このパートナーを削除しますか？')) return;
        try {
            await fetch('/api/admin/partners/' + id, { method: 'DELETE', headers: HEADERS });
            loadPartners();
        } catch(e) { alert('削除に失敗しました'); }
    }

    async function loadPartnerStats() {
        try {
            var res = await fetch('/api/admin/partners/stats', { headers: HEADERS });
            var data = await res.json();
            if (data.success && data.data) {
                document.getElementById('stat-total').textContent = data.data.total || 0;
                document.getElementById('stat-listings').textContent = data.data.monthly_listings || 0;
                document.getElementById('stat-revenue').textContent = '\\u00A5' + (data.data.monthly_revenue || 0).toLocaleString();
            }
        } catch(e) {
            document.getElementById('stat-total').textContent = '0';
        }
    }

    // 初期読み込み
    loadPartners();
    </script>
  `;

  return c.html(AdminLayout('partners', 'パートナー管理', content));
});

// ============================================================
// 越境EC管理画面
// ============================================================
adminPagesRoutes.get('/cross-border', (c) => {
  const content = `
    <style>
      .cb-stat-card { background:white; border-radius:16px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.06); border:1px solid #f3f4f6; transition:transform .15s; }
      .cb-stat-card:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
      .cb-stat-value { font-size:28px; font-weight:800; color:#1f2937; }
      .cb-stat-label { font-size:12px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
      .cb-tab { padding:10px 20px; border-radius:10px; font-weight:600; font-size:14px; cursor:pointer; transition:all .2s; border:none; background:#f3f4f6; color:#6b7280; }
      .cb-tab.active { background:#dc2626; color:white; }
      .cb-tab:hover:not(.active) { background:#e5e7eb; }
      .cb-card { background:white; border-radius:12px; border:1px solid #e5e7eb; overflow:hidden; transition:all .2s; }
      .cb-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }
      .cb-badge { display:inline-block; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:600; }
      .cb-badge-draft { background:#f3f4f6; color:#6b7280; }
      .cb-badge-ready { background:#fef9c3; color:#a16207; }
      .cb-badge-listed { background:#dcfce7; color:#16a34a; }
      .cb-badge-sold { background:#dbeafe; color:#2563eb; }
      .cb-badge-cancelled { background:#fee2e2; color:#dc2626; }
      .cb-badge-error { background:#fee2e2; color:#dc2626; }
      .demand-bar { height:6px; border-radius:3px; background:#e5e7eb; overflow:hidden; }
      .demand-fill { height:100%; border-radius:3px; transition:width .3s; }
      .rate-display { background:linear-gradient(135deg,#1e40af,#3b82f6); color:white; border-radius:12px; padding:16px 20px; }
      .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:100; display:none; align-items:center; justify-content:center; }
      .modal-overlay.show { display:flex; }
      .modal-content { background:white; border-radius:16px; max-width:800px; width:95%; max-height:90vh; overflow-y:auto; padding:24px; }
      .filter-chip { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:500; border:1px solid #d1d5db; cursor:pointer; transition:all .15s; }
      .filter-chip:hover { border-color:#3b82f6; }
      .filter-chip.active { background:#3b82f6; color:white; border-color:#3b82f6; }
      .order-timeline { position:relative; padding-left:24px; }
      .order-timeline::before { content:''; position:absolute; left:7px; top:4px; bottom:4px; width:2px; background:#e5e7eb; }
      .order-step { position:relative; margin-bottom:12px; }
      .order-step::before { content:''; position:absolute; left:-21px; top:4px; width:12px; height:12px; border-radius:50%; background:#e5e7eb; border:2px solid white; }
      .order-step.active::before { background:#3b82f6; }
      .order-step.done::before { background:#16a34a; }
      .sim-row { display:grid; grid-template-columns:60px 1fr 1fr 1fr 1fr; gap:8px; padding:6px 8px; border-radius:6px; font-size:13px; }
      .sim-row:nth-child(even) { background:#f9fafb; }
      .listing-actions { display:flex; gap:4px; margin-top:8px; }
      .listing-actions button { font-size:11px; padding:3px 8px; border-radius:6px; font-weight:600; border:1px solid transparent; cursor:pointer; transition:all .15s; }
      @media print {
        body > *:not(.modal-overlay.show) { display:none !important; }
        .modal-overlay.show { position:static !important; background:none !important; display:block !important; }
        .modal-overlay.show > .modal-content { max-height:none !important; max-width:none !important; width:100% !important; padding:0 !important; box-shadow:none !important; }
        .no-print { display:none !important; }
        #shipping-doc-content { font-size:12px; }
      }
    </style>

    <!-- eBay連携ステータス -->
    <div id="ebay-connect-bar" class="mb-4 p-4 rounded-xl border border-gray-200 bg-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="fab fa-ebay text-2xl text-blue-600"></i>
          <div>
            <p class="font-bold text-sm text-gray-800">eBay Sell API 連携</p>
            <p class="text-xs text-gray-500" id="ebay-connect-status">確認中...</p>
          </div>
        </div>
        <div id="ebay-connect-actions">
          <button onclick="connectEbay()" class="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold hidden" id="btn-connect-ebay">
            <i class="fab fa-ebay mr-1"></i>eBayアカウント連携
          </button>
          <span class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hidden" id="ebay-connected-badge">
            <i class="fas fa-check-circle mr-1"></i>連携済み
          </span>
        </div>
      </div>
      <div id="ebay-location-bar" class="hidden mt-3 pt-3 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-500"><i class="fas fa-warehouse mr-1"></i>発送元: <span id="ebay-location-name" class="font-semibold text-gray-700">未設定</span></p>
          <button onclick="openLocationModal()" class="text-xs text-blue-600 hover:text-blue-700 font-semibold">
            <i class="fas fa-edit mr-1"></i>設定
          </button>
        </div>
      </div>
    </div>

    <!-- 為替レート表示 -->
    <div class="rate-display mb-6 flex items-center justify-between">
      <div>
        <div class="text-sm opacity-80">リアルタイム為替レート</div>
        <div class="flex items-center gap-3 mt-1">
          <span class="text-3xl font-bold" id="rate-value">---</span>
          <span class="text-sm opacity-80">JPY / 1 USD</span>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs opacity-60" id="rate-updated">取得中...</div>
        <button onclick="refreshRate()" class="mt-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition">
          <i class="fas fa-sync-alt mr-1"></i>更新
        </button>
      </div>
    </div>

    <!-- 統計カード -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="cb-stat-card">
        <div class="cb-stat-label"><i class="fas fa-globe text-blue-400 mr-1"></i>海外出品中</div>
        <div class="cb-stat-value mt-1" id="stat-active">0</div>
      </div>
      <div class="cb-stat-card">
        <div class="cb-stat-label"><i class="fas fa-shopping-cart text-green-400 mr-1"></i>海外売上</div>
        <div class="cb-stat-value mt-1" id="stat-sold">0</div>
      </div>
      <div class="cb-stat-card">
        <div class="cb-stat-label"><i class="fas fa-dollar-sign text-yellow-500 mr-1"></i>海外売上(USD)</div>
        <div class="cb-stat-value mt-1" id="stat-revenue">$0</div>
      </div>
      <div class="cb-stat-card">
        <div class="cb-stat-label"><i class="fas fa-chart-line text-red-400 mr-1"></i>利益(JPY)</div>
        <div class="cb-stat-value mt-1" id="stat-profit">¥0</div>
      </div>
    </div>

    <!-- タブ切り替え -->
    <div class="flex gap-2 mb-6 overflow-x-auto">
      <button class="cb-tab active" data-tab="candidates" onclick="switchCBTab('candidates')">
        <i class="fas fa-search mr-1"></i>買取候補
      </button>
      <button class="cb-tab" data-tab="listings" onclick="switchCBTab('listings')">
        <i class="fas fa-globe mr-1"></i>海外出品
      </button>
      <button class="cb-tab" data-tab="orders" onclick="switchCBTab('orders')">
        <i class="fas fa-truck mr-1"></i>海外注文
      </button>
    </div>

    <!-- ===== 買取候補タブ ===== -->
    <div id="tab-candidates">
      <!-- フィルター -->
      <div class="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <!-- キーワード検索 -->
        <div class="flex items-center gap-2 mb-3">
          <div class="flex-1 relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input type="text" id="filter-keyword" placeholder="商品名・品番で検索..." class="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" onkeydown="if(event.key==='Enter'){cbCandidateOffset=0;loadCandidates();}">
          </div>
          <select id="filter-sort" class="px-3 py-2 border rounded-lg text-sm text-gray-600" onchange="cbCandidateOffset=0;loadCandidates();">
            <option value="newest">新着順</option>
            <option value="price_desc">価格が高い順</option>
            <option value="price_asc">価格が安い順</option>
            <option value="popular">人気順</option>
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-xs font-bold text-gray-500">メーカー:</span>
          <div class="flex flex-wrap gap-1">
            <button class="filter-chip active" data-maker="" onclick="filterMaker(this)">すべて</button>
            <button class="filter-chip" data-maker="トヨタ" onclick="filterMaker(this)">トヨタ</button>
            <button class="filter-chip" data-maker="日産" onclick="filterMaker(this)">日産</button>
            <button class="filter-chip" data-maker="ホンダ" onclick="filterMaker(this)">ホンダ</button>
            <button class="filter-chip" data-maker="スズキ" onclick="filterMaker(this)">スズキ</button>
            <button class="filter-chip" data-maker="スバル" onclick="filterMaker(this)">スバル</button>
            <button class="filter-chip" data-maker="マツダ" onclick="filterMaker(this)">マツダ</button>
            <button class="filter-chip" data-maker="三菱" onclick="filterMaker(this)">三菱</button>
            <button class="filter-chip" data-maker="いすゞ" onclick="filterMaker(this)">いすゞ</button>
            <button class="filter-chip" data-maker="日野" onclick="filterMaker(this)">日野</button>
            <button class="filter-chip" data-maker="ダイハツ" onclick="filterMaker(this)">ダイハツ</button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3 mt-3">
          <span class="text-xs font-bold text-gray-500">カテゴリ:</span>
          <div class="flex flex-wrap gap-1">
            <button class="filter-chip active" data-cat="" onclick="filterCat(this)">すべて</button>
            <button class="filter-chip" data-cat="car" onclick="filterCat(this)">乗用車</button>
            <button class="filter-chip" data-cat="truck" onclick="filterCat(this)">トラック</button>
            <button class="filter-chip" data-cat="bus" onclick="filterCat(this)">バス</button>
            <button class="filter-chip" data-cat="motorcycle" onclick="filterCat(this)">バイク</button>
            <button class="filter-chip" data-cat="forklift" onclick="filterCat(this)">フォークリフト</button>
            <button class="filter-chip" data-cat="heavy_equipment" onclick="filterCat(this)">重機</button>
            <button class="filter-chip" data-cat="marine" onclick="filterCat(this)">船舶</button>
            <button class="filter-chip" data-cat="agricultural" onclick="filterCat(this)">農機具</button>
            <button class="filter-chip" data-cat="tools" onclick="filterCat(this)">工具</button>
            <button class="filter-chip" data-cat="rebuilt" onclick="filterCat(this)">リビルト</button>
            <button class="filter-chip" data-cat="electrical" onclick="filterCat(this)">電装</button>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-3">
          <span class="text-xs font-bold text-gray-500">価格帯:</span>
          <input type="number" id="filter-min-price" placeholder="¥下限" class="px-3 py-1.5 border rounded-lg text-sm w-28">
          <span class="text-gray-400">〜</span>
          <input type="number" id="filter-max-price" placeholder="¥上限" class="px-3 py-1.5 border rounded-lg text-sm w-28">
          <button onclick="cbCandidateOffset=0;loadCandidates()" class="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 font-semibold">
            <i class="fas fa-filter mr-1"></i>絞り込み
          </button>
          <span class="text-xs text-gray-400 ml-2" id="candidates-count"></span>
        </div>
      </div>

      <!-- 候補商品グリッド -->
      <div id="candidates-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="text-center py-12 text-gray-400 col-span-full">
          <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
          <p>読み込み中...</p>
        </div>
      </div>
      <div class="text-center mt-4">
        <button id="candidates-load-more" onclick="loadMoreCandidates()" class="hidden px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-600">
          もっと見る
        </button>
      </div>
    </div>

    <!-- ===== 海外出品タブ ===== -->
    <div id="tab-listings" style="display:none">
      <!-- ステータスフィルタ -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button class="filter-chip active" data-lstatus="" onclick="filterListingStatus(this)">すべて</button>
        <button class="filter-chip" data-lstatus="draft" onclick="filterListingStatus(this)">下書き</button>
        <button class="filter-chip" data-lstatus="ready" onclick="filterListingStatus(this)">出品準備完了</button>
        <button class="filter-chip" data-lstatus="listed" onclick="filterListingStatus(this)">出品中</button>
        <button class="filter-chip" data-lstatus="sold" onclick="filterListingStatus(this)">売却済</button>
      </div>
      <div id="listings-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="text-center py-12 text-gray-400 col-span-full">読み込み中...</div>
      </div>
    </div>

    <!-- ===== 海外注文タブ ===== -->
    <div id="tab-orders" style="display:none">
      <div class="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <p class="text-sm text-gray-500 mb-2"><i class="fas fa-info-circle mr-1"></i>注文フロー</p>
        <div class="flex items-center gap-1 text-xs flex-wrap">
          <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">受注</span><i class="fas fa-arrow-right text-gray-300"></i>
          <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded">買取依頼</span><i class="fas fa-arrow-right text-gray-300"></i>
          <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded">買取完了</span><i class="fas fa-arrow-right text-gray-300"></i>
          <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded">検品・梱包</span><i class="fas fa-arrow-right text-gray-300"></i>
          <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">発送済</span><i class="fas fa-arrow-right text-gray-300"></i>
          <span class="px-2 py-1 bg-green-100 text-green-700 rounded">配達完了</span><i class="fas fa-arrow-right text-gray-300"></i>
          <span class="px-2 py-1 bg-green-200 text-green-800 rounded font-bold">取引完了</span>
        </div>
      </div>
      <div id="orders-list">
        <div class="text-center py-12 text-gray-400">読み込み中...</div>
      </div>
    </div>

    <!-- ===== 利益シミュレーターモーダル ===== -->
    <div id="sim-modal" class="modal-overlay">
      <div class="modal-content" style="max-width:600px;">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-calculator mr-2 text-green-500"></i>為替別 利益シミュレーション</h3>
          <button onclick="document.getElementById('sim-modal').classList.remove('show')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div class="bg-gray-50 rounded-xl p-4 mb-4">
          <p class="text-sm text-gray-600">仕入原価(税込): <strong id="sim-cost">¥0</strong></p>
          <p class="text-sm text-gray-600">販売価格: <strong id="sim-usd">$0</strong> / 送料: <strong id="sim-ship">$0</strong></p>
        </div>
        <div class="sim-row font-bold text-xs text-gray-500 mb-1">
          <span>為替レート</span><span>手取(¥)</span><span>手数料</span><span>利益</span><span>利益率</span>
        </div>
        <div id="sim-results"></div>
      </div>
    </div>

    <!-- ===== 出品モーダル ===== -->
    <div id="listing-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-globe-americas mr-2 text-blue-500"></i>海外出品設定</h3>
          <button onclick="closeListingModal()" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <!-- 元商品情報 -->
        <div class="bg-gray-50 rounded-xl p-4 mb-4 flex gap-4">
          <img id="modal-img" src="" class="w-20 h-20 object-cover rounded-lg" onerror="this.src='/icons/icon.svg'">
          <div>
            <p class="font-bold text-gray-800" id="modal-title-ja">-</p>
            <p class="text-sm text-gray-500" id="modal-maker">-</p>
            <p class="text-lg font-bold text-red-600 mt-1" id="modal-price-ja">¥0</p>
          </div>
        </div>

        <!-- AI翻訳 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="font-bold text-sm text-gray-700">英語タイトル</label>
            <button onclick="aiTranslate()" id="ai-translate-btn" class="text-xs bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600">
              <i class="fas fa-magic mr-1"></i>AI翻訳
            </button>
          </div>
          <input type="text" id="modal-title-en" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="English title for eBay...">
        </div>

        <div class="mb-4">
          <label class="font-bold text-sm text-gray-700 mb-2 block">英語説明</label>
          <textarea id="modal-desc-en" rows="5" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="English description for eBay listing..."></textarea>
        </div>

        <!-- 配送・重量設定（拡張版） -->
        <div class="bg-gray-50 rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <p class="font-bold text-sm text-gray-700"><i class="fas fa-shipping-fast mr-1 text-indigo-500"></i>配送設定</p>
            <button onclick="openCarrierCompare()" class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 font-semibold">
              <i class="fas fa-balance-scale mr-1"></i>全業者比較
            </button>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-xs text-gray-500">重量(kg)</label>
              <input type="number" id="modal-weight-kg" step="0.1" value="2" min="0.1" max="70" class="w-full px-2 py-1.5 border rounded-lg text-sm" onchange="autoCalcPrice()">
            </div>
            <div>
              <label class="text-xs text-gray-500">配送方法</label>
              <select id="modal-ship-method" class="w-full px-2 py-1.5 border rounded-lg text-sm" onchange="autoCalcPrice()">
                <optgroup label="📮 日本郵便">
                  <option value="ems">EMS（3〜5日）⭐推奨</option>
                  <option value="epacket_light">eパケットライト（7〜14日）</option>
                  <option value="jp_air_parcel">国際小包 航空便（7〜14日）</option>
                </optgroup>
                <optgroup label="🚀 FedEx">
                  <option value="fedex_priority">FedEx Priority（1〜3日）</option>
                  <option value="fedex_economy">FedEx Economy（4〜6日）</option>
                </optgroup>
                <optgroup label="🟡 DHL">
                  <option value="dhl_express">DHL Express（1〜3日）</option>
                </optgroup>
                <optgroup label="🟤 UPS">
                  <option value="ups_express">UPS Express（1〜3日）</option>
                </optgroup>
                <optgroup label="🐈 ヤマト運輸">
                  <option value="yamato_intl">国際宅急便（3〜6日）</option>
                </optgroup>
                <optgroup label="🔵 佐川急便">
                  <option value="sagawa_intl">飛脚国際宅配便（2〜5日）</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-500">配送先</label>
              <select id="modal-ship-zone" class="w-full px-2 py-1.5 border rounded-lg text-sm" onchange="autoCalcPrice()">
                <option value="us">アメリカ</option>
                <option value="eu">ヨーロッパ</option>
                <option value="asia">アジア</option>
              </select>
            </div>
          </div>
          <!-- おすすめ表示 -->
          <div id="shipping-recommend-bar" class="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100 hidden">
            <p class="text-xs font-bold text-blue-700"><i class="fas fa-lightbulb mr-1 text-yellow-500"></i><span id="shipping-recommend-label"></span></p>
            <p class="text-xs text-blue-600 mt-0.5" id="shipping-recommend-reason"></p>
          </div>
          <p class="text-xs text-gray-400 mt-2" id="modal-ship-info"></p>
        </div>

        <!-- 自動価格計算 -->
        <div class="bg-blue-50 rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <p class="font-bold text-sm text-blue-800"><i class="fas fa-calculator mr-1"></i>自動価格計算</p>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500">目標利益率</label>
              <select id="modal-target-margin" class="px-2 py-1 border rounded-lg text-sm font-bold text-blue-800" onchange="autoCalcPrice()">
                <option value="15">15%</option>
                <option value="20">20%</option>
                <option value="25" selected>25%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
                <option value="50">50%</option>
              </select>
            </div>
          </div>

          <!-- コスト内訳 -->
          <div class="bg-white rounded-lg p-3 mb-3 text-sm" id="cost-breakdown-area">
            <div class="flex justify-between mb-1"><span class="text-gray-500">仕入原価（税込）</span><span class="font-bold" id="cb-product-cost">-</span></div>
            <div class="flex justify-between mb-1"><span class="text-gray-500">国際送料</span><span class="font-bold" id="cb-shipping-cost">-</span></div>
            <div class="flex justify-between mb-1"><span class="text-gray-500">梱包材</span><span class="font-bold" id="cb-packaging-cost">-</span></div>
            <div class="flex justify-between pt-1 border-t border-gray-200"><span class="text-gray-700 font-bold">総コスト</span><span class="font-bold text-red-600" id="cb-total-cost">-</span></div>
          </div>

          <!-- 価格入力 -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="text-xs text-gray-500">eBay販売価格(USD)</label>
              <div class="flex gap-1">
                <input type="number" id="modal-price-usd" step="1" class="flex-1 px-2 py-1.5 border rounded-lg text-sm font-bold text-lg" oninput="calcProfit()">
                <button onclick="applyRecommendedPrice()" class="px-2 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 whitespace-nowrap" title="推奨価格を適用">推奨</button>
              </div>
              <p class="text-xs text-blue-600 mt-1">推奨: <strong id="recommended-price-usd">-</strong></p>
            </div>
            <div>
              <label class="text-xs text-gray-500">送料チャージ(USD)</label>
              <input type="number" id="modal-shipping-usd" step="1" value="30" class="w-full px-2 py-1.5 border rounded-lg text-sm" oninput="calcProfit()">
              <p class="text-xs text-gray-400 mt-1">推奨: <strong id="recommended-shipping-usd">-</strong></p>
            </div>
          </div>

          <!-- 手数料内訳 -->
          <div class="bg-white rounded-lg p-3 mb-3 text-xs" id="fee-breakdown-area">
            <p class="font-bold text-gray-600 mb-2">手数料内訳</p>
            <div class="flex justify-between mb-0.5"><span class="text-gray-400">eBay落札手数料 (12.9%)</span><span id="fee-final-value">-</span></div>
            <div class="flex justify-between mb-0.5"><span class="text-gray-400">海外取引手数料 (1.65%)</span><span id="fee-international">-</span></div>
            <div class="flex justify-between mb-0.5"><span class="text-gray-400">固定手数料</span><span>$0.30</span></div>
            <div class="flex justify-between mb-0.5"><span class="text-gray-400">Payoneer出金手数料 (~2%)</span><span id="fee-payoneer">-</span></div>
            <div class="flex justify-between pt-1 border-t border-gray-100"><span class="text-gray-500 font-bold">手数料合計</span><span class="font-bold text-red-500" id="fee-total">-</span></div>
          </div>

          <!-- 利益表示 -->
          <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <span class="text-sm text-gray-600">予想利益:</span>
              <span class="text-2xl font-bold ml-1" id="modal-profit">-</span>
              <span class="text-sm ml-2" id="modal-profit-margin"></span>
            </div>
            <div class="flex gap-2">
              <button onclick="openSimulator()" class="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-semibold">
                <i class="fas fa-chart-line mr-1"></i>為替別シミュレーション
              </button>
              <button onclick="openPriceTableModal()" class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-semibold">
                <i class="fas fa-table mr-1"></i>利益率別一覧
              </button>
            </div>
          </div>
        </div>

        <!-- 利益率別価格テーブルモーダル -->
        <div id="price-table-modal" class="modal-overlay">
          <div class="modal-content" style="max-width:550px;">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-table mr-2 text-green-500"></i>利益率別 推奨価格テーブル</h3>
              <button onclick="document.getElementById('price-table-modal').classList.remove('show')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <p class="text-gray-600">仕入原価: <strong id="pt-cost">-</strong> / 送料: <strong id="pt-ship">-</strong> / レート: <strong id="pt-rate">-</strong></p>
            </div>
            <div class="text-xs font-bold text-gray-500 grid grid-cols-4 gap-2 mb-2 px-2">
              <span>目標利益率</span><span>eBay価格</span><span>利益</span><span>実質利益率</span>
            </div>
            <div id="price-table-body"></div>
          </div>
        </div>

        <!-- アクションボタン -->
        <div class="flex gap-3">
          <button onclick="closeListingModal()" class="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-semibold">キャンセル</button>
          <button onclick="saveListing('draft')" class="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold">
            <i class="fas fa-save mr-1"></i>下書き保存
          </button>
          <button onclick="saveAndPublishToEbay()" id="btn-ebay-publish" class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            <i class="fab fa-ebay mr-1"></i>eBayに出品
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 全業者送料比較モーダル ===== -->
    <div id="carrier-compare-modal" class="modal-overlay">
      <div class="modal-content" style="max-width:900px;">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-balance-scale mr-2 text-indigo-500"></i>全配送業者 送料比較</h3>
          <button onclick="document.getElementById('carrier-compare-modal').classList.remove('show')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div class="bg-indigo-50 rounded-lg p-3 mb-4">
          <p class="text-sm text-indigo-800"><strong id="cc-weight">-</strong> / <strong id="cc-zone">-</strong> / レート: <strong id="cc-rate">-</strong></p>
          <p class="text-xs text-indigo-600 mt-1" id="cc-recommend-text"></p>
        </div>
        <!-- 業者グループ別フィルタ -->
        <div class="flex gap-2 mb-3 flex-wrap">
          <button onclick="filterCarrierGroup('all')" class="filter-chip active" data-cg="all">すべて</button>
          <button onclick="filterCarrierGroup('japan_post')" class="filter-chip" data-cg="japan_post">📮 日本郵便</button>
          <button onclick="filterCarrierGroup('fedex')" class="filter-chip" data-cg="fedex">🚀 FedEx</button>
          <button onclick="filterCarrierGroup('dhl')" class="filter-chip" data-cg="dhl">🟡 DHL</button>
          <button onclick="filterCarrierGroup('ups')" class="filter-chip" data-cg="ups">🟤 UPS</button>
          <button onclick="filterCarrierGroup('yamato')" class="filter-chip" data-cg="yamato">🐈 ヤマト</button>
          <button onclick="filterCarrierGroup('sagawa')" class="filter-chip" data-cg="sagawa">🔵 佐川</button>
        </div>
        <!-- ヘッダー -->
        <div class="grid grid-cols-8 gap-2 text-xs font-bold text-gray-500 mb-1 px-2">
          <span class="col-span-2">配送業者</span>
          <span>日数</span>
          <span>送料(JPY)</span>
          <span>送料(USD)</span>
          <span>追跡</span>
          <span>補償</span>
          <span></span>
        </div>
        <div id="carrier-compare-body" class="max-h-96 overflow-y-auto"></div>
        <!-- 法人割引設定リンク -->
        <div class="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
          <p class="text-xs text-gray-400"><i class="fas fa-info-circle mr-1"></i>概算マークの業者は法人契約で割引が可能です</p>
          <button onclick="openDiscountSettings()" class="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-semibold">
            <i class="fas fa-percentage mr-1"></i>法人割引率設定
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 法人割引率設定モーダル ===== -->
    <div id="discount-settings-modal" class="modal-overlay">
      <div class="modal-content" style="max-width:600px;">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-percentage mr-2 text-green-500"></i>法人割引率設定</h3>
          <button onclick="document.getElementById('discount-settings-modal').classList.remove('show')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <p class="text-xs text-gray-500 mb-4">FedEx / DHL / UPS / ヤマト / 佐川など民間業者の法人契約割引率を設定します。<br>0%=定価のまま。50%=定価の半額。</p>
        <div id="discount-settings-body"></div>
        <div class="flex gap-3 mt-4">
          <button onclick="document.getElementById('discount-settings-modal').classList.remove('show')" class="flex-1 px-4 py-2.5 border rounded-lg font-semibold">閉じる</button>
          <button onclick="saveAllDiscounts()" class="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
            <i class="fas fa-save mr-1"></i>割引率を保存
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 発送手配書モーダル ===== -->
    <div id="shipping-doc-modal" class="modal-overlay">
      <div class="modal-content" style="max-width:800px;">
        <div class="flex items-center justify-between mb-4 no-print">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-file-alt mr-2 text-orange-500"></i>発送手配書</h3>
          <div class="flex gap-2">
            <button onclick="window.print()" class="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold"><i class="fas fa-print mr-1"></i>印刷 / PDF保存</button>
            <button onclick="document.getElementById('shipping-doc-modal').classList.remove('show')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
        </div>
        <div id="shipping-doc-content"></div>
      </div>
    </div>

    <script>
    var cbCurrentRate = 150;
    var cbCandidateOffset = 0;
    var cbCurrentFilters = { maker: '', top_category: '', min_price: '', max_price: '', q: '' };
    var cbCurrentProduct = null;
    var cbListingStatusFilter = '';

    // ===== 為替レート =====
    async function refreshRate() {
      try {
        var res = await axios.get('/api/admin/cross-border/exchange-rate', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') },
          timeout: 10000
        });
        if (res.data.success) {
          cbCurrentRate = res.data.rate;
          document.getElementById('rate-value').textContent = res.data.rate.toFixed(2);
          var info = res.data.cached ? '(キャッシュ)' : '(最新)';
          document.getElementById('rate-updated').textContent = info + ' ' + new Date().toLocaleTimeString('ja-JP');
        }
      } catch(e) {
        console.warn('為替レート取得失敗:', e);
        document.getElementById('rate-value').textContent = cbCurrentRate.toFixed(2) + ' (デフォルト)';
      }
    }

    // ===== 統計読み込み =====
    async function loadStats() {
      try {
        var res = await axios.get('/api/admin/cross-border/stats', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') },
          timeout: 15000
        });
        if (res.data.success) {
          var l = res.data.listings, o = res.data.orders, r = res.data.revenue;
          document.getElementById('stat-active').textContent = l.active || 0;
          document.getElementById('stat-sold').textContent = l.sold || 0;
          document.getElementById('stat-revenue').textContent = '$' + Number(r.total_revenue_usd || 0).toLocaleString();
          document.getElementById('stat-profit').textContent = '¥' + Number(r.total_profit_jpy || 0).toLocaleString();
        }
      } catch(e) {
        console.warn('Stats load error:', e);
      }
    }

    // ===== タブ切り替え =====
    function switchCBTab(tab) {
      document.querySelectorAll('.cb-tab').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-tab') === tab);
      });
      ['candidates','listings','orders'].forEach(function(t) {
        document.getElementById('tab-' + t).style.display = t === tab ? '' : 'none';
      });
      if (tab === 'listings') loadListings();
      if (tab === 'orders') loadOrders();
    }

    // ===== フィルタ =====
    function filterMaker(el) {
      document.querySelectorAll('[data-maker]').forEach(function(c) { c.classList.remove('active'); });
      el.classList.add('active');
      cbCurrentFilters.maker = el.getAttribute('data-maker');
      cbCandidateOffset = 0;
      loadCandidates();
    }
    function filterCat(el) {
      document.querySelectorAll('[data-cat]').forEach(function(c) { c.classList.remove('active'); });
      el.classList.add('active');
      cbCurrentFilters.top_category = el.getAttribute('data-cat');
      cbCandidateOffset = 0;
      loadCandidates();
    }

    // ===== 買取候補一覧 =====
    async function loadCandidates(append) {
      if (!append) cbCandidateOffset = 0;
      var params = new URLSearchParams({ limit: '12', offset: String(cbCandidateOffset) });
      if (cbCurrentFilters.maker) params.set('maker', cbCurrentFilters.maker);
      if (cbCurrentFilters.top_category) params.set('top_category', cbCurrentFilters.top_category);
      var minP = document.getElementById('filter-min-price').value;
      var maxP = document.getElementById('filter-max-price').value;
      if (minP) params.set('min_price', minP);
      if (maxP) params.set('max_price', maxP);
      var kw = document.getElementById('filter-keyword').value.trim();
      if (kw) params.set('q', kw);
      var sortVal = document.getElementById('filter-sort').value;
      if (sortVal) params.set('sort', sortVal);

      try {
        var res = await axios.get('/api/admin/cross-border/candidates?' + params, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') },
          timeout: 15000
        });
        var grid = document.getElementById('candidates-grid');
        if (!append) grid.innerHTML = '';

        document.getElementById('candidates-count').textContent = res.data.total + '件の候補';
        if (res.data.items.length === 0 && !append) {
          grid.innerHTML = '<div class="text-center py-12 text-gray-400 col-span-full"><i class="fas fa-box-open text-4xl mb-3"></i><p>候補商品がありません</p></div>';
          document.getElementById('candidates-load-more').classList.add('hidden');
          return;
        }

        res.data.items.forEach(function(p) {
          var priceJpy = Math.round(p.price * 1.1);
          var priceUsd = (priceJpy / cbCurrentRate).toFixed(2);
          var imgSrc = p.image_url || '/icons/icon.svg';
          grid.innerHTML += '<div class="cb-card">' +
            '<div class="flex gap-3 p-3">' +
              '<img src="' + escapeHtml(imgSrc) + '" class="w-20 h-20 object-cover rounded-lg flex-shrink-0" onerror="this.src=\\'/icons/icon.svg\\'">' +
              '<div class="flex-1 min-w-0">' +
                '<p class="font-semibold text-sm text-gray-800 truncate">' + escapeHtml(p.title) + '</p>' +
                '<p class="text-xs text-gray-500 mt-0.5">' + escapeHtml(p.vm_maker || '') + ' ' + escapeHtml(p.vm_model || '') + '</p>' +
                '<div class="flex items-center gap-2 mt-1">' +
                  '<span class="font-bold text-red-600">¥' + priceJpy.toLocaleString() + '</span>' +
                  '<span class="text-xs text-gray-400">→</span>' +
                  '<span class="font-bold text-blue-600">$' + priceUsd + '</span>' +
                '</div>' +
                '<div class="flex items-center gap-2 mt-2">' +
                  '<span class="text-xs text-gray-400"><i class="fas fa-eye mr-1"></i>' + (p.view_count || 0) + '</span>' +
                  '<span class="text-xs text-gray-400"><i class="fas fa-heart mr-1"></i>' + (p.favorite_count || 0) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="px-3 pb-3">' +
              '<button onclick="openListingModal(' + p.id + ')" class="w-full py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 font-semibold">' +
                '<i class="fas fa-globe-americas mr-1"></i>海外出品する' +
              '</button>' +
            '</div>' +
          '</div>';
        });

        var btn = document.getElementById('candidates-load-more');
        if (res.data.items.length >= 12 && cbCandidateOffset + 12 < res.data.total) {
          btn.classList.remove('hidden');
        } else {
          btn.classList.add('hidden');
        }
      } catch(e) {
        console.error('Candidates load error:', e);
        var grid = document.getElementById('candidates-grid');
        if (grid && !append) {
          grid.innerHTML = '<div class="text-center py-12 text-gray-400 col-span-full"><i class="fas fa-exclamation-triangle text-4xl mb-3 text-yellow-400"></i><p>データの読み込みに失敗しました</p><p class="text-xs mt-1 text-gray-300">再読み込みしてください</p></div>';
        }
      }
    }

    function loadMoreCandidates() {
      cbCandidateOffset += 12;
      loadCandidates(true);
    }

    // ===== 自動価格計算データ =====
    var cbCalcData = null; // APIからの計算結果

    // ===== 出品モーダル =====
    async function openListingModal(productId) {
      try {
        var res = await axios.get('/api/admin/products/' + productId, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        var p = res.data.product || res.data;
        cbCurrentProduct = p;

        document.getElementById('modal-img').src = p.main_image || p.image_url || '/icons/icon.svg';
        document.getElementById('modal-title-ja').textContent = p.title;
        document.getElementById('modal-maker').textContent = (p.vm_maker || '') + ' ' + (p.vm_model || '');
        var costJpy = Math.round(Number(p.price) * 1.1);
        document.getElementById('modal-price-ja').textContent = '¥' + costJpy.toLocaleString();
        document.getElementById('modal-title-en').value = '';
        document.getElementById('modal-desc-en').value = '';

        // 重量初期値（あれば）
        if (p.weight_kg) {
          document.getElementById('modal-weight-kg').value = p.weight_kg;
        }

        // 自動価格計算を実行
        await autoCalcPrice();

        document.getElementById('listing-modal').classList.add('show');
      } catch(e) {
        alert('商品情報の取得に失敗しました');
      }
    }

    function closeListingModal() {
      document.getElementById('listing-modal').classList.remove('show');
      cbCurrentProduct = null;
      cbCalcData = null;
    }

    // ===== 自動価格計算 =====
    async function autoCalcPrice() {
      if (!cbCurrentProduct) return;
      var weightKg = parseFloat(document.getElementById('modal-weight-kg').value) || 2;
      var method = document.getElementById('modal-ship-method').value;
      var zone = document.getElementById('modal-ship-zone').value;
      var margin = parseInt(document.getElementById('modal-target-margin').value) || 25;

      try {
        var res = await axios.post('/api/admin/cross-border/calc-price', {
          price_jpy: cbCurrentProduct.price,
          weight_kg: weightKg,
          shipping_method: method,
          zone: zone,
          exchange_rate: cbCurrentRate,
          target_margin: margin / 100
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        if (res.data.success) {
          cbCalcData = res.data;
          var cb = res.data.cost_breakdown;
          var rec = res.data.recommended;

          // コスト内訳表示
          document.getElementById('cb-product-cost').textContent = '¥' + cb.product_cost_jpy.toLocaleString();
          document.getElementById('cb-shipping-cost').textContent = '¥' + cb.shipping_cost_jpy.toLocaleString() + ' ($' + cb.shipping_cost_usd + ')';
          document.getElementById('cb-packaging-cost').textContent = '¥' + cb.packaging_jpy.toLocaleString();
          document.getElementById('cb-total-cost').textContent = '¥' + cb.total_cost_jpy.toLocaleString() + ' ($' + cb.total_cost_usd + ')';

          // 推奨価格表示
          document.getElementById('recommended-price-usd').textContent = '$' + rec.price_usd;
          document.getElementById('recommended-shipping-usd').textContent = '$' + rec.shipping_charge_usd;

          // 配送情報
          var selOpt = document.getElementById('modal-ship-method');
          var methodLabel = selOpt.options[selOpt.selectedIndex] ? selOpt.options[selOpt.selectedIndex].text : method;
          document.getElementById('modal-ship-info').textContent =
            '送料: ¥' + cb.shipping_cost_jpy.toLocaleString() + ' ($' + cb.shipping_cost_usd + ') / ' + methodLabel + ' / ' + weightKg + 'kg';

          // おすすめ表示
          loadShippingRecommendation(weightKg, zone);

          // 推奨価格を自動入力（初回のみ、ユーザーが変更していなければ）
          var currentUsd = parseFloat(document.getElementById('modal-price-usd').value) || 0;
          if (currentUsd === 0 || !document.getElementById('modal-price-usd')._userEdited) {
            document.getElementById('modal-price-usd').value = rec.price_usd;
            document.getElementById('modal-shipping-usd').value = rec.shipping_charge_usd;
          }

          calcProfit();
        }
      } catch(e) {
        console.error('Auto calc price error:', e);
      }
    }

    function applyRecommendedPrice() {
      if (!cbCalcData) return;
      document.getElementById('modal-price-usd').value = cbCalcData.recommended.price_usd;
      document.getElementById('modal-shipping-usd').value = cbCalcData.recommended.shipping_charge_usd;
      document.getElementById('modal-price-usd')._userEdited = false;
      calcProfit();
    }

    // ===== 利益計算（リアルタイム） =====
    function calcProfit() {
      var usd = parseFloat(document.getElementById('modal-price-usd').value) || 0;
      var shipCharge = parseFloat(document.getElementById('modal-shipping-usd').value) || 0;
      var costJpy = cbCurrentProduct ? Math.round(Number(cbCurrentProduct.price) * 1.1) : 0;

      // 送料コスト（JPY） - APIの計算結果がある場合はそれを使用
      var shippingCostJpy = cbCalcData ? cbCalcData.cost_breakdown.shipping_cost_jpy : Math.floor(shipCharge * cbCurrentRate);
      var packagingJpy = cbCalcData ? cbCalcData.cost_breakdown.packaging_jpy : 800;

      // eBay手数料計算
      var ebayFinalValue = usd * 0.129;
      var ebayIntl = usd * 0.0165;
      var ebayFixed = 0.30;
      var totalEbayFees = ebayFinalValue + ebayIntl + ebayFixed;
      var payoneerPayout = usd - totalEbayFees;
      var payoneerFee = payoneerPayout * 0.02;
      var netUsd = payoneerPayout - payoneerFee;
      var netJpy = Math.floor(netUsd * cbCurrentRate);

      var profit = netJpy - costJpy - shippingCostJpy - packagingJpy;
      var margin = netJpy > 0 ? Math.round((profit / netJpy) * 100) : 0;

      // 手数料内訳表示
      document.getElementById('fee-final-value').textContent = '-$' + ebayFinalValue.toFixed(2);
      document.getElementById('fee-international').textContent = '-$' + ebayIntl.toFixed(2);
      document.getElementById('fee-payoneer').textContent = '-$' + payoneerFee.toFixed(2);
      document.getElementById('fee-total').textContent = '-$' + (totalEbayFees + payoneerFee).toFixed(2) + ' (-¥' + Math.floor((totalEbayFees + payoneerFee) * cbCurrentRate).toLocaleString() + ')';

      // 利益表示
      var el = document.getElementById('modal-profit');
      el.textContent = '¥' + profit.toLocaleString();
      el.className = 'text-2xl font-bold ml-1 ' + (profit > 0 ? 'text-green-600' : 'text-red-600');

      var marginEl = document.getElementById('modal-profit-margin');
      marginEl.textContent = '(' + margin + '%)';
      marginEl.className = 'text-sm ml-2 font-bold ' + (profit > 0 ? 'text-green-500' : 'text-red-500');

      // ユーザー編集フラグ
      document.getElementById('modal-price-usd')._userEdited = true;
    }

    // ===== 利益率別テーブルモーダル =====
    function openPriceTableModal() {
      if (!cbCalcData || !cbCalcData.price_table) {
        alert('先に価格計算を実行してください');
        return;
      }
      var cb = cbCalcData.cost_breakdown;
      document.getElementById('pt-cost').textContent = '¥' + cb.product_cost_jpy.toLocaleString();
      document.getElementById('pt-ship').textContent = '¥' + cb.shipping_cost_jpy.toLocaleString();
      document.getElementById('pt-rate').textContent = '¥' + cbCurrentRate + '/USD';

      var html = '';
      cbCalcData.price_table.forEach(function(row) {
        var color = row.profit_jpy > 0 ? 'text-green-600' : 'text-red-600';
        var current = parseFloat(document.getElementById('modal-price-usd').value) || 0;
        var highlight = row.price_usd === current ? 'background:#dbeafe;' : '';
        html += '<div class="grid grid-cols-4 gap-2 py-2 px-2 rounded-lg text-sm" style="' + highlight + '">' +
          '<span class="font-bold">' + row.target_margin + '%</span>' +
          '<span class="font-bold text-blue-700 cursor-pointer hover:underline" onclick="setPriceFromTable(' + row.price_usd + ')">$' + row.price_usd + '</span>' +
          '<span class="font-bold ' + color + '">¥' + row.profit_jpy.toLocaleString() + '</span>' +
          '<span class="' + color + '">' + row.actual_margin + '%</span>' +
        '</div>';
      });
      document.getElementById('price-table-body').innerHTML = html;
      document.getElementById('price-table-modal').classList.add('show');
    }

    function setPriceFromTable(price) {
      document.getElementById('modal-price-usd').value = price;
      document.getElementById('modal-price-usd')._userEdited = true;
      calcProfit();
      document.getElementById('price-table-modal').classList.remove('show');
    }

    // ===== AI翻訳 =====
    async function aiTranslate() {
      if (!cbCurrentProduct) return;
      var btn = document.getElementById('ai-translate-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>翻訳中...';
      try {
        var res = await axios.post('/api/admin/cross-border/translate', {
          title: cbCurrentProduct.title,
          description: cbCurrentProduct.description,
          maker: cbCurrentProduct.vm_maker,
          model: cbCurrentProduct.vm_model,
          condition: cbCurrentProduct.condition
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        if (res.data.success) {
          document.getElementById('modal-title-en').value = res.data.title_en || '';
          document.getElementById('modal-desc-en').value = res.data.description_en || '';
        } else {
          alert(res.data.error || 'AI翻訳に失敗しました');
        }
      } catch(e) {
        alert('AI翻訳エラー: ' + (e.response?.data?.error || e.message));
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic mr-1"></i>AI翻訳';
      }
    }

    // ===== 出品保存 =====
    async function saveListing(status) {
      if (!cbCurrentProduct) return;
      var titleEn = document.getElementById('modal-title-en').value.trim();
      if (!titleEn) { alert('英語タイトルを入力してください'); return; }

      var priceUsd = parseFloat(document.getElementById('modal-price-usd').value) || 0;
      var shippingUsd = parseFloat(document.getElementById('modal-shipping-usd').value) || 0;
      var weightKg = parseFloat(document.getElementById('modal-weight-kg').value) || 2;
      var carrierCode = document.getElementById('modal-ship-method').value;
      var shippingZone = document.getElementById('modal-ship-zone').value;

      if (priceUsd <= 0) { alert('販売価格を入力してください'); return; }

      try {
        var res = await axios.post('/api/admin/cross-border/listings', {
          product_id: cbCurrentProduct.id,
          title_en: titleEn,
          description_en: document.getElementById('modal-desc-en').value,
          price_usd: priceUsd,
          exchange_rate: cbCurrentRate,
          shipping_cost_usd: shippingUsd,
          status: status
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        // 配送設定も保存
        if (res.data.success && res.data.id) {
          try {
            await axios.put('/api/admin/cross-border/listings/' + res.data.id + '/shipping', {
              carrier_code: carrierCode,
              shipping_zone: shippingZone,
              weight_kg: weightKg,
              shipping_cost_usd: shippingUsd
            }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });
          } catch(e) { console.warn('配送設定の保存に失敗:', e); }
        }

        alert(status === 'ready' ? '出品準備完了しました！' : '下書き保存しました');
        closeListingModal();
        loadCandidates();
        loadStats();
      } catch(e) {
        alert('保存に失敗しました');
      }
    }

    // ===== 出品ステータスフィルタ =====
    function filterListingStatus(el) {
      document.querySelectorAll('[data-lstatus]').forEach(function(c) { c.classList.remove('active'); });
      el.classList.add('active');
      cbListingStatusFilter = el.getAttribute('data-lstatus');
      loadListings();
    }

    // ===== 海外出品一覧 =====
    async function loadListings() {
      var grid = document.getElementById('listings-grid');
      try {
        var url = '/api/admin/cross-border/listings';
        if (cbListingStatusFilter) url += '?status=' + cbListingStatusFilter;
        var res = await axios.get(url, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        if (!res.data.items || res.data.items.length === 0) {
          grid.innerHTML = '<div class="text-center py-12 text-gray-400 col-span-full"><i class="fas fa-globe text-4xl mb-3"></i><p>海外出品データがありません</p><p class="text-xs mt-1">「買取候補」タブから商品を選んで出品してください</p></div>';
          return;
        }
        var statusLabels = { draft:'下書き', translating:'翻訳中', ready:'出品準備完了', listed:'出品中', sold:'売却済', cancelled:'取消', error:'エラー' };
        var statusColors = { draft:'cb-badge-draft', ready:'cb-badge-ready', listed:'cb-badge-listed', sold:'cb-badge-sold', cancelled:'cb-badge-cancelled', error:'cb-badge-error' };
        // ステータス遷移ボタン生成
        function getActionButtons(item) {
          var s = item.status;
          var btns = '';
          if (s === 'draft') {
            btns += '<button onclick="updateListingStatus(' + item.id + ',\\'ready\\')" style="background:#fef9c3;color:#a16207;">出品準備完了にする</button>';
            btns += '<button onclick="deleteListing(' + item.id + ')" style="background:#fee2e2;color:#dc2626;">削除</button>';
          } else if (s === 'ready') {
            btns += '<button onclick="updateListingStatus(' + item.id + ',\\'listed\\')" style="background:#dcfce7;color:#16a34a;">出品中にする</button>';
            btns += '<button onclick="updateListingStatus(' + item.id + ',\\'draft\\')" style="background:#f3f4f6;color:#6b7280;">下書きに戻す</button>';
          } else if (s === 'listed') {
            btns += '<button onclick="updateListingStatus(' + item.id + ',\\'sold\\')" style="background:#dbeafe;color:#2563eb;">売却済にする</button>';
            btns += '<button onclick="updateListingStatus(' + item.id + ',\\'cancelled\\')" style="background:#fee2e2;color:#dc2626;">出品取消</button>';
          }
          return btns ? '<div class="listing-actions">' + btns + '</div>' : '';
        }

        grid.innerHTML = res.data.items.map(function(item) {
          var img = item.image_url || '/icons/icon.svg';
          var dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('ja-JP') : '';
          return '<div class="cb-card p-4">' +
            '<div class="flex gap-3">' +
              '<img src="' + escapeHtml(img) + '" class="w-16 h-16 object-cover rounded-lg flex-shrink-0" onerror="this.src=\\'/icons/icon.svg\\'">' +
              '<div class="flex-1 min-w-0">' +
                '<div class="flex items-center gap-2">' +
                  '<span class="cb-badge ' + (statusColors[item.status] || 'cb-badge-draft') + '">' + (statusLabels[item.status] || item.status) + '</span>' +
                  '<span class="text-xs text-gray-400">#' + item.id + '</span>' +
                  '<span class="text-xs text-gray-300">' + dateStr + '</span>' +
                '</div>' +
                '<p class="font-semibold text-sm mt-1 truncate" title="' + escapeHtml(item.title_en || '') + '">' + escapeHtml(item.title_en || item.product_title) + '</p>' +
                '<p class="text-xs text-gray-500 truncate">' + escapeHtml(item.product_title || '') + '</p>' +
                '<div class="flex items-center gap-3 mt-1">' +
                  '<span class="font-bold text-blue-600">$' + Number(item.price_usd || 0).toFixed(2) + '</span>' +
                  '<span class="text-xs text-gray-400">(¥' + Number(item.price_jpy || 0).toLocaleString() + ')</span>' +
                  (item.external_url ? '<a href="' + escapeHtml(item.external_url) + '" target="_blank" class="text-xs text-blue-400 hover:underline"><i class="fas fa-external-link-alt mr-1"></i>eBay</a>' : '') +
                '</div>' +
                getActionButtons(item) +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        grid.innerHTML = '<div class="text-center py-12 text-red-400 col-span-full">読み込みエラー</div>';
      }
    }

    // ===== 出品ステータス更新 =====
    async function updateListingStatus(id, newStatus) {
      if (!confirm(newStatus === 'cancelled' ? '出品を取り消しますか？' : 'ステータスを変更しますか？')) return;
      try {
        await axios.put('/api/admin/cross-border/listings/' + id + '/status', { status: newStatus }, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        loadListings();
        loadStats();
      } catch(e) {
        alert('ステータス更新に失敗しました');
      }
    }

    // ===== 出品削除 =====
    async function deleteListing(id) {
      if (!confirm('この出品データを削除しますか？')) return;
      try {
        await axios.delete('/api/admin/cross-border/listings/' + id, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        loadListings();
        loadStats();
      } catch(e) {
        alert(e.response?.data?.error || '削除に失敗しました');
      }
    }

    // ===== 海外注文一覧 =====
    async function loadOrders() {
      var el = document.getElementById('orders-list');
      try {
        var res = await axios.get('/api/admin/cross-border/orders', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        if (!res.data.items || res.data.items.length === 0) {
          el.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-truck text-4xl mb-3"></i><p>海外注文はまだありません</p><p class="text-xs mt-1">eBay連携後、注文が入ると表示されます</p></div>';
          return;
        }
        var orderStatusLabels = {
          pending:'受注', buyback_requested:'買取依頼中', buyback_completed:'買取完了',
          preparing:'検品・梱包中', shipped:'発送済', delivered:'配達完了',
          completed:'取引完了', cancelled:'キャンセル', refunded:'返金済'
        };
        var orderStatusColors = {
          pending:'bg-yellow-100 text-yellow-700', buyback_requested:'bg-blue-100 text-blue-700',
          buyback_completed:'bg-blue-100 text-blue-800', preparing:'bg-purple-100 text-purple-700',
          shipped:'bg-indigo-100 text-indigo-700', delivered:'bg-green-100 text-green-700',
          completed:'bg-green-200 text-green-800', cancelled:'bg-red-100 text-red-700',
          refunded:'bg-red-100 text-red-700'
        };
        var nextStatus = {
          pending:'buyback_requested', buyback_requested:'buyback_completed',
          buyback_completed:'preparing', preparing:'shipped', shipped:'delivered',
          delivered:'completed'
        };

        el.innerHTML = '<p class="text-sm text-gray-500 mb-3">注文 ' + res.data.items.length + '件</p>' +
          res.data.items.map(function(o) {
            var img = o.image_url ? (o.image_url.startsWith('http') ? o.image_url : '/r2/' + o.image_url) : '/icons/icon.svg';
            var next = nextStatus[o.status];
            var nextLabel = next ? orderStatusLabels[next] : null;
            return '<div class="cb-card p-4 mb-3">' +
              '<div class="flex gap-3">' +
                '<img src="' + escapeHtml(img) + '" class="w-16 h-16 object-cover rounded-lg flex-shrink-0" onerror="this.src=\\'/icons/icon.svg\\'">' +
                '<div class="flex-1 min-w-0">' +
                  '<div class="flex items-center gap-2 flex-wrap">' +
                    '<span class="cb-badge ' + (orderStatusColors[o.status] || '') + '">' + (orderStatusLabels[o.status] || o.status) + '</span>' +
                    '<span class="text-xs text-gray-400">#' + o.id + '</span>' +
                    (o.buyer_country ? '<span class="text-xs text-gray-400"><i class="fas fa-globe mr-1"></i>' + escapeHtml(o.buyer_country) + '</span>' : '') +
                  '</div>' +
                  '<p class="font-semibold text-sm mt-1 truncate">' + escapeHtml(o.title_en || o.product_title || '') + '</p>' +
                  '<div class="flex items-center gap-3 mt-1">' +
                    '<span class="font-bold text-blue-600">$' + Number(o.sale_price_usd || 0).toFixed(2) + '</span>' +
                    '<span class="text-xs text-gray-400">(¥' + Number(o.sale_price_jpy || 0).toLocaleString() + ')</span>' +
                    (o.profit_jpy ? '<span class="text-xs font-bold ' + (o.profit_jpy > 0 ? 'text-green-600' : 'text-red-600') + '">利益 ¥' + Number(o.profit_jpy).toLocaleString() + '</span>' : '') +
                  '</div>' +
                  (o.tracking_number ? '<p class="text-xs text-gray-400 mt-1"><i class="fas fa-shipping-fast mr-1"></i>追跡: ' + escapeHtml(o.tracking_number) + '</p>' : '') +
                  (o.buyer_name ? '<p class="text-xs text-gray-400 mt-0.5"><i class="fas fa-user mr-1"></i>' + escapeHtml(o.buyer_name) + '</p>' : '') +
                '</div>' +
              '</div>' +
              '<div class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">' +
                (o.tracking_number && o.tracking_url ? '<a href="' + escapeHtml(o.tracking_url) + '" target="_blank" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200"><i class="fas fa-external-link-alt mr-1"></i>追跡ページ</a>' : '') +
                '<button onclick="openShippingDoc(' + o.id + ')" class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-200"><i class="fas fa-file-alt mr-1"></i>手配書</button>' +
                (o.status === 'preparing' && !o.tracking_number ? '<button onclick="openTrackingModal(' + o.id + ')" class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-200"><i class="fas fa-barcode mr-1"></i>追跡番号登録</button>' : '') +
                (next ? '<button onclick="advanceOrder(' + o.id + ',\\'' + next + '\\')" class="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 font-semibold ml-auto"><i class="fas fa-arrow-right mr-1"></i>' + nextLabel + 'へ</button>' : '') +
              '</div>' +
            '</div>';
          }).join('');
      } catch(e) {
        el.innerHTML = '<div class="text-center py-12 text-red-400">読み込みエラー</div>';
      }
    }

    // ===== 注文ステータス進行 =====
    async function advanceOrder(orderId, newStatus) {
      // shipped に進める場合は追跡番号モーダルを表示
      if (newStatus === 'shipped') {
        openTrackingModal(orderId);
        return;
      }
      var data = { status: newStatus };
      if (!confirm((newStatus === 'cancelled' ? 'キャンセルしますか？' : 'ステータスを進めますか？'))) return;
      try {
        await axios.put('/api/admin/cross-border/orders/' + orderId + '/status', data, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        loadOrders();
        loadStats();
      } catch(e) {
        alert('更新に失敗しました');
      }
    }

    // ===== 利益シミュレーター =====
    async function openSimulator() {
      if (!cbCurrentProduct) return;
      var costJpy = Math.round(Number(cbCurrentProduct.price) * 1.1);
      var priceUsd = parseFloat(document.getElementById('modal-price-usd').value) || 0;
      var shipUsd = parseFloat(document.getElementById('modal-shipping-usd').value) || 0;
      var weightKg = parseFloat(document.getElementById('modal-weight-kg').value) || 2;
      var method = document.getElementById('modal-ship-method').value;
      var zone = document.getElementById('modal-ship-zone').value;
      document.getElementById('sim-cost').textContent = '¥' + costJpy.toLocaleString();
      document.getElementById('sim-usd').textContent = '$' + priceUsd.toFixed(2);
      document.getElementById('sim-ship').textContent = '$' + shipUsd.toFixed(2);

      try {
        var res = await axios.post('/api/admin/cross-border/simulate-profit', {
          price_jpy: cbCurrentProduct.price, price_usd: priceUsd, shipping_cost_usd: shipUsd,
          weight_kg: weightKg, shipping_method: method, zone: zone
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        if (res.data.success) {
          var html = '';
          res.data.simulations.forEach(function(s) {
            var color = s.profit > 0 ? 'text-green-600' : 'text-red-600';
            var highlight = Math.abs(s.rate - cbCurrentRate) < 3 ? 'background:#eff6ff;font-weight:700;' : '';
            html += '<div class="sim-row" style="' + highlight + '">' +
              '<span>¥' + s.rate + '</span>' +
              '<span>¥' + s.net_payout_jpy.toLocaleString() + '</span>' +
              '<span class="text-gray-500">-$' + s.fees_usd + '</span>' +
              '<span class="font-bold ' + color + '">¥' + s.profit.toLocaleString() + '</span>' +
              '<span class="' + color + '">' + s.margin + '%</span>' +
            '</div>';
          });
          document.getElementById('sim-results').innerHTML = html;
        }
      } catch(e) {
        document.getElementById('sim-results').innerHTML = '<p class="text-red-400 text-sm py-4 text-center">シミュレーションに失敗しました</p>';
      }

      document.getElementById('sim-modal').classList.add('show');
    }

    // ===== eBay連携機能 =====
    var ebayConnected = false;
    var ebayPolicies = null;
    var ebayLocationKey = null;

    async function checkEbayConnection() {
      try {
        var res = await axios.get('/api/admin/ebay-sell/oauth/status', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') },
          timeout: 15000
        });
        if (res.data.success && res.data.connected) {
          ebayConnected = true;
          document.getElementById('ebay-connect-status').textContent = 
            'Production環境 / トークン有効期限: ' + new Date(res.data.token.expires_at).toLocaleDateString('ja-JP');
          document.getElementById('ebay-connected-badge').classList.remove('hidden');
          document.getElementById('btn-connect-ebay').classList.add('hidden');
          document.getElementById('ebay-location-bar').classList.remove('hidden');
          loadEbayLocations();
        } else {
          document.getElementById('ebay-connect-status').textContent = res.data.has_ru_name 
            ? '未連携 - eBayアカウントの認証が必要です' 
            : '未連携 - EBAY_RU_NAME の設定が必要です';
          document.getElementById('btn-connect-ebay').classList.remove('hidden');
          if (!res.data.has_ru_name) document.getElementById('btn-connect-ebay').disabled = true;
        }
      } catch(e) {
        document.getElementById('ebay-connect-status').textContent = 'ステータス確認に失敗しました';
        document.getElementById('btn-connect-ebay').classList.remove('hidden');
      }
    }

    async function connectEbay() {
      try {
        var res = await axios.get('/api/admin/ebay-sell/oauth/auth-url', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        if (res.data.success) {
          window.open(res.data.auth_url, '_blank');
        } else {
          alert(res.data.error || 'OAuth URL の生成に失敗しました');
        }
      } catch(e) {
        alert('eBay認証URLの取得に失敗しました');
      }
    }

    async function loadEbayLocations() {
      try {
        var res = await axios.get('/api/admin/ebay-sell/locations', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        if (res.data.success && res.data.locations.length > 0) {
          var loc = res.data.locations[0];
          ebayLocationKey = loc.merchant_location_key;
          var syncStatus = loc.ebay_synced ? ' ✅' : ' ⚠️未同期';
          document.getElementById('ebay-location-name').innerHTML = escapeHtml(loc.name) + ' (' + escapeHtml(loc.city) + ', ' + escapeHtml(loc.country) + ')' + syncStatus + (!loc.ebay_synced ? ' <button onclick="syncEbayLocation()" style="margin-left:8px;padding:2px 10px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">再同期</button>' : '');
        } else {
          document.getElementById('ebay-location-name').textContent = '未設定 - 出品には発送元の登録が必要です';
        }
      } catch(e) {}
    }

    async function syncEbayLocation() {
      try {
        var res = await axios.post('/api/admin/ebay-sell/locations/sync', {}, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') },
          timeout: 30000
        });
        if (res.data.success) {
          var allOk = res.data.results && res.data.results.every(function(r) { return r.success; });
          if (allOk) {
            alert('✅ eBayへの同期が完了しました！');
          } else {
            var msg = '同期結果:\\n';
            (res.data.results || []).forEach(function(r) {
              msg += r.name + ': ' + (r.success ? '✅ 成功' : '❌ 失敗 - ' + (r.error || '')) + '\\n';
            });
            alert(msg);
          }
          loadEbayLocations();
        } else {
          alert('同期に失敗しました: ' + (res.data.error || ''));
        }
      } catch(e) {
        alert('同期エラー: ' + (e.response?.data?.error || e.message));
      }
    }

    function openLocationModal() {
      var html = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;" id="loc-modal-overlay" onclick="if(event.target===this)this.remove()">' +
        '<div style="background:white;border-radius:16px;max-width:500px;width:95%;padding:24px;" onclick="event.stopPropagation()">' +
        '<h3 class="text-lg font-bold mb-4"><i class="fas fa-warehouse mr-2 text-blue-500"></i>発送元ロケーション設定</h3>' +
        '<div class="space-y-3">' +
        '<div><label class="text-xs text-gray-500">倉庫名</label><input type="text" id="loc-name" class="w-full px-3 py-2 border rounded-lg text-sm" value="PARTS HUB 本社倉庫" placeholder="倉庫名"></div>' +
        '<div><label class="text-xs text-gray-500">住所</label><input type="text" id="loc-address" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1-2-3 Shibuya"></div>' +
        '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="text-xs text-gray-500">市区町村</label><input type="text" id="loc-city" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Shibuya-ku"></div>' +
        '<div><label class="text-xs text-gray-500">都道府県</label><input type="text" id="loc-state" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Tokyo"></div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="text-xs text-gray-500">郵便番号</label><input type="text" id="loc-postal" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="150-0002"></div>' +
        '<div><label class="text-xs text-gray-500">電話番号</label><input type="text" id="loc-phone" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="03-1234-5678"></div>' +
        '</div>' +
        '</div>' +
        '<div class="flex gap-3 mt-4">' +
        '<button onclick="var el=document.getElementById(&quot;loc-modal-overlay&quot;);if(el)el.remove()" class="flex-1 px-4 py-2 border rounded-lg font-semibold">キャンセル</button>' +
        '<button onclick="saveLocation()" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"><i class="fas fa-save mr-1"></i>保存してeBayに同期</button>' +
        '</div></div></div>';
      document.body.insertAdjacentHTML('beforeend', html);
    }

    async function saveLocation() {
      var payload = {
        name: document.getElementById('loc-name').value,
        address_line1: document.getElementById('loc-address').value,
        city: document.getElementById('loc-city').value,
        state_or_province: document.getElementById('loc-state').value,
        postal_code: document.getElementById('loc-postal').value,
        country: 'JP',
        phone: document.getElementById('loc-phone').value
      };
      if (!payload.name || !payload.address_line1 || !payload.city || !payload.postal_code) {
        alert('名前・住所・市区町村・郵便番号は必須です');
        return;
      }
      try {
        var res = await axios.post('/api/admin/ebay-sell/locations', payload, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        if (res.data.success) {
          ebayLocationKey = res.data.merchant_location_key;
          alert('ロケーションを保存しました' + (res.data.ebay_synced ? '（eBay同期済み）' : '（eBay同期は後で実行されます）'));
          var overlay = document.getElementById('loc-modal-overlay');
          if (overlay) overlay.remove();
          loadEbayLocations();
        } else {
          alert('保存に失敗しました: ' + (res.data.error || ''));
        }
      } catch(e) {
        alert('エラーが発生しました');
      }
    }

    // eBayに直接出品（保存 → Inventory登録 → Offer公開）
    async function saveAndPublishToEbay() {
      if (!ebayConnected) {
        alert('先にeBayアカウントを連携してください。');
        return;
      }
      var titleEn = document.getElementById('modal-title-en').value;
      var descEn = document.getElementById('modal-desc-en').value;
      var priceUsd = parseFloat(document.getElementById('modal-price-usd').value);
      var shipUsd = parseFloat(document.getElementById('modal-shipping-usd').value) || 0;

      if (!titleEn) { alert('英語タイトルは必須です。AI翻訳を実行してください。'); return; }
      if (!priceUsd || priceUsd <= 0) { alert('USD価格を設定してください。'); return; }

      var btn = document.getElementById('btn-ebay-publish');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>eBay出品中...';

      var weightKg = parseFloat(document.getElementById('modal-weight-kg').value) || 2;
      var carrierCode = document.getElementById('modal-ship-method').value;
      var shippingZone = document.getElementById('modal-ship-zone').value;

      try {
        // まず出品データを保存
        var saveRes = await axios.post('/api/admin/cross-border/listings', {
          product_id: cbCurrentProduct.id,
          title_en: titleEn,
          description_en: descEn,
          price_usd: priceUsd,
          exchange_rate: cbCurrentRate,
          shipping_cost_usd: shipUsd
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        if (!saveRes.data.success) {
          alert('出品データの保存に失敗: ' + (saveRes.data.error || ''));
          return;
        }

        var listingId = saveRes.data.id;

        // 配送設定も保存
        try {
          await axios.put('/api/admin/cross-border/listings/' + listingId + '/shipping', {
            carrier_code: carrierCode,
            shipping_zone: shippingZone,
            weight_kg: weightKg,
            shipping_cost_usd: shipUsd
          }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });
        } catch(e) { console.warn('配送設定の保存に失敗:', e); }

        // eBay Quick List
        var ebayRes = await axios.post('/api/admin/ebay-sell/quick-list', {
          listing_id: listingId,
          price_usd: priceUsd
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        if (ebayRes.data.success && ebayRes.data.ebay_url) {
          closeListingModal();
          alert('✅ eBayへの出品が完了しました！\\n\\n' + ebayRes.data.ebay_url);
          loadStats();
          loadListings();
        } else {
          var msg = 'eBay出品処理で問題が発生しました。\\n\\n';
          if (ebayRes.data.steps) {
            ebayRes.data.steps.forEach(function(s) {
              msg += s.step + ': ' + (s.success ? '✅' : '❌ ' + (s.error || '')) + '\\n';
            });
          }
          msg += '\\n' + (ebayRes.data.message || '');
          alert(msg);
        }
      } catch(e) {
        alert('エラーが発生しました: ' + (e.response?.data?.error || e.message));
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fab fa-ebay mr-1"></i>eBayに出品';
      }
    }

    // ===== おすすめ配送方法表示 =====
    function loadShippingRecommendation(weightKg, zone) {
      var bar = document.getElementById('shipping-recommend-bar');
      var label, reason;
      if (weightKg <= 2) {
        label = '小型パーツ（〜2kg）: EMS または eパケットライトがおすすめ';
        reason = 'コスパ最良。eパケットライトが最安、EMSが最速';
      } else if (weightKg <= 10) {
        label = '中型パーツ（2〜10kg）: EMS がおすすめ';
        reason = '追跡・補償あり。EMSがコスト合理的';
      } else if (weightKg <= 30) {
        label = '大型パーツ（10〜30kg）: EMS または FedEx Economy';
        reason = 'EMSは30kgまで対応。超えたらFedEx/DHLを検討';
      } else {
        label = '超大型/高額品（30kg超）: FedEx/DHL/UPS';
        reason = '補償充実＆最速配送。法人割引で大幅コスト削減可能';
      }
      document.getElementById('shipping-recommend-label').textContent = label;
      document.getElementById('shipping-recommend-reason').textContent = reason;
      bar.classList.remove('hidden');
    }

    // ===== 全業者送料比較 =====
    var carrierCompareData = [];
    var carrierGroupFilter = 'all';

    async function openCarrierCompare() {
      var weightKg = parseFloat(document.getElementById('modal-weight-kg').value) || 2;
      var zone = document.getElementById('modal-ship-zone').value;
      var zoneNames = { us:'アメリカ', eu:'ヨーロッパ', asia:'アジア' };

      document.getElementById('cc-weight').textContent = weightKg + 'kg';
      document.getElementById('cc-zone').textContent = zoneNames[zone] || zone;
      document.getElementById('cc-rate').textContent = '¥' + cbCurrentRate + '/USD';

      try {
        var res = await axios.post('/api/admin/cross-border/compare-shipping', {
          weight_kg: weightKg,
          zone: zone,
          exchange_rate: cbCurrentRate
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        if (res.data.success) {
          carrierCompareData = res.data.carriers;
          var rec = res.data.recommendation;
          document.getElementById('cc-recommend-text').innerHTML =
            '<i class="fas fa-lightbulb text-yellow-500 mr-1"></i><strong>' + rec.label + '</strong>: ' + rec.reason;
          carrierGroupFilter = 'all';
          document.querySelectorAll('[data-cg]').forEach(function(el) {
            el.classList.toggle('active', el.getAttribute('data-cg') === 'all');
          });
          renderCarrierCompare();
        }
      } catch(e) {
        document.getElementById('carrier-compare-body').innerHTML = '<p class="text-red-400 text-center py-4">比較データの取得に失敗しました</p>';
      }
      document.getElementById('carrier-compare-modal').classList.add('show');
    }

    function filterCarrierGroup(group) {
      carrierGroupFilter = group;
      document.querySelectorAll('[data-cg]').forEach(function(el) {
        el.classList.toggle('active', el.getAttribute('data-cg') === group);
      });
      renderCarrierCompare();
    }

    function renderCarrierCompare() {
      var filtered = carrierCompareData;
      if (carrierGroupFilter !== 'all') {
        filtered = carrierCompareData.filter(function(c) { return c.carrier_group === carrierGroupFilter; });
      }
      var html = '';
      filtered.forEach(function(c) {
        var rowClass = !c.available ? 'opacity-40' : c.is_recommended ? 'bg-blue-50 border-l-4 border-blue-400' : '';
        var discountBadge = c.discount_applied > 0 ? '<span class="text-green-600 text-xs font-bold ml-1">-' + Math.round(c.discount_applied * 100) + '%</span>' : '';
        var estimateBadge = c.is_estimate ? '<span class="text-orange-500 text-xs ml-1" title="概算（法人契約で変動）">概算</span>' : '';
        var recommendBadge = c.is_recommended ? '<span class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded ml-1">おすすめ</span>' : '';
        html += '<div class="grid grid-cols-8 gap-2 text-sm py-2 px-2 rounded-lg items-center ' + rowClass + '" style="border-bottom:1px solid #f3f4f6;">' +
          '<span class="col-span-2 font-semibold text-gray-800">' + escapeHtml(c.name) + recommendBadge + estimateBadge + discountBadge + '</span>' +
          '<span class="text-gray-600">' + c.days + '</span>' +
          '<span class="font-bold ' + (c.available ? 'text-gray-900' : 'text-gray-400') + '">¥' + (c.available ? c.cost_jpy.toLocaleString() : '-') + '</span>' +
          '<span class="' + (c.available ? 'text-blue-600 font-bold' : 'text-gray-400') + '">$' + (c.available ? c.cost_usd : '-') + '</span>' +
          '<span>' + (c.tracking ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-gray-300"></i>') + '</span>' +
          '<span>' + (c.insurance ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-gray-300"></i>') + '</span>' +
          '<span>' + (c.available ? '<button onclick="selectCarrier(\\'' + c.carrier_code + '\\')" class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">選択</button>' : '<span class="text-xs text-gray-400">対象外</span>') + '</span>' +
        '</div>';
      });
      if (!html) html = '<p class="text-center text-gray-400 py-4">該当する配送業者がありません</p>';
      document.getElementById('carrier-compare-body').innerHTML = html;
    }

    function selectCarrier(code) {
      document.getElementById('modal-ship-method').value = code;
      document.getElementById('carrier-compare-modal').classList.remove('show');
      autoCalcPrice();
    }

    // ===== 法人割引率設定 =====
    var discountData = [];

    async function openDiscountSettings() {
      try {
        var res = await axios.get('/api/admin/cross-border/carrier-discounts', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        discountData = res.data.discounts || [];
      } catch(e) { discountData = []; }

      // 全業者（割引適用可能なもの）のリストを作成
      var discountableCarriers = [
        { code:'fedex_priority', name:'FedEx International Priority' },
        { code:'fedex_economy', name:'FedEx International Economy' },
        { code:'dhl_express', name:'DHL Express Worldwide' },
        { code:'ups_express', name:'UPS Worldwide Express' },
        { code:'yamato_intl', name:'ヤマト運輸 国際宅急便' },
        { code:'sagawa_intl', name:'佐川急便 飛脚国際宅配便' }
      ];

      var html = '';
      discountableCarriers.forEach(function(carrier) {
        var existing = discountData.find(function(d) { return d.carrier_code === carrier.code; });
        var rate = existing ? Math.round(existing.discount_rate * 100) : 0;
        var notes = existing ? (existing.notes || '') : '';
        html += '<div class="flex items-center gap-3 py-3 border-b border-gray-100">' +
          '<div class="flex-1">' +
            '<p class="font-semibold text-sm text-gray-800">' + carrier.name + '</p>' +
            '<p class="text-xs text-gray-400">' + carrier.code + '</p>' +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<input type="number" id="discount-' + carrier.code + '" min="0" max="80" step="5" value="' + rate + '" class="w-16 px-2 py-1 border rounded-lg text-sm text-center font-bold">' +
            '<span class="text-sm text-gray-500">%OFF</span>' +
          '</div>' +
        '</div>';
      });
      document.getElementById('discount-settings-body').innerHTML = html;
      document.getElementById('discount-settings-modal').classList.add('show');
    }

    async function saveAllDiscounts() {
      var codes = ['fedex_priority','fedex_economy','dhl_express','ups_express','yamato_intl','sagawa_intl'];
      var failed = [];
      for (var i = 0; i < codes.length; i++) {
        var input = document.getElementById('discount-' + codes[i]);
        if (!input) continue;
        var rate = parseInt(input.value) || 0;
        try {
          await axios.put('/api/admin/cross-border/carrier-discounts/' + codes[i], {
            discount_rate: rate / 100
          }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });
        } catch(e) {
          failed.push(codes[i]);
        }
      }
      if (failed.length === 0) {
        alert('✅ 法人割引率を保存しました！送料計算に反映されます。');
        document.getElementById('discount-settings-modal').classList.remove('show');
        // 再計算
        if (cbCurrentProduct) autoCalcPrice();
      } else {
        alert('一部の保存に失敗しました: ' + failed.join(', '));
      }
    }

    // ===== 発送手配書 =====
    async function openShippingDoc(orderId) {
      try {
        var res = await axios.get('/api/admin/cross-border/orders/' + orderId + '/shipping-document', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
        });
        if (!res.data.success) { alert(res.data.error || '手配書の取得に失敗'); return; }
        var doc = res.data.document;
        var trackingLink = doc.tracking_url ? '<a href="' + escapeHtml(doc.tracking_url) + '" target="_blank" class="text-blue-600 hover:underline">' + escapeHtml(doc.tracking_number) + '</a>' : escapeHtml(doc.tracking_number || '未登録');
        var checklist = doc.checklist.map(function(item, i) {
          return '<label class="flex items-center gap-2 py-1"><input type="checkbox" class="w-4 h-4 rounded border-gray-300"><span class="text-sm text-gray-700">' + escapeHtml(item.item) + '</span></label>';
        }).join('');

        var html = '<div class="border-2 border-gray-800 rounded-lg p-6" style="font-family:sans-serif;">' +
          '<div class="text-center mb-6">' +
            '<h2 class="text-2xl font-bold text-gray-900">発送手配書 / Shipping Arrangement</h2>' +
            '<p class="text-sm text-gray-500">Order #' + doc.order_id + (doc.ebay_order_id ? ' / eBay: ' + escapeHtml(doc.ebay_order_id) : '') + '</p>' +
            '<p class="text-xs text-gray-400">発行日: ' + new Date().toLocaleDateString('ja-JP') + '</p>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-4 mb-4">' +
            '<div class="border rounded-lg p-3">' +
              '<p class="text-xs font-bold text-gray-500 mb-2 uppercase">送り元 / From</p>' +
              '<p class="font-bold text-sm">' + escapeHtml(doc.sender_name) + '</p>' +
              '<p class="text-xs text-gray-600">' + escapeHtml(doc.sender_address) + '</p>' +
            '</div>' +
            '<div class="border rounded-lg p-3">' +
              '<p class="text-xs font-bold text-gray-500 mb-2 uppercase">送り先 / To</p>' +
              '<p class="font-bold text-sm">' + escapeHtml(doc.buyer_name || '未設定') + '</p>' +
              '<p class="text-xs text-gray-600">' + escapeHtml(doc.buyer_address || '') + '</p>' +
              '<p class="text-xs text-gray-600">' + escapeHtml(doc.buyer_country || '') + '</p>' +
              (doc.buyer_email ? '<p class="text-xs text-gray-400">' + escapeHtml(doc.buyer_email) + '</p>' : '') +
            '</div>' +
          '</div>' +
          '<div class="border rounded-lg p-3 mb-4">' +
            '<p class="text-xs font-bold text-gray-500 mb-2 uppercase">商品情報 / Product</p>' +
            '<div class="flex gap-3">' +
              (doc.main_image ? '<img src="' + escapeHtml(doc.main_image) + '" class="w-16 h-16 object-cover rounded" onerror="this.style.display=\\'none\\'">' : '') +
              '<div>' +
                '<p class="font-bold text-sm">' + escapeHtml(doc.product_title_en || doc.product_title_ja) + '</p>' +
                '<p class="text-xs text-gray-500">' + escapeHtml(doc.product_title_ja) + '</p>' +
                '<p class="text-xs text-gray-400">' + escapeHtml(doc.vm_maker || '') + ' ' + escapeHtml(doc.vm_model || '') + ' / ' + escapeHtml(doc.condition || '') + '</p>' +
                (doc.ebay_sku ? '<p class="text-xs text-gray-400">SKU: ' + escapeHtml(doc.ebay_sku) + '</p>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-4 mb-4">' +
            '<div class="border rounded-lg p-3">' +
              '<p class="text-xs font-bold text-gray-500 mb-2 uppercase">配送情報 / Shipping</p>' +
              '<div class="space-y-1 text-sm">' +
                '<p><span class="text-gray-500">配送業者:</span> <strong>' + escapeHtml(doc.carrier_name) + '</strong></p>' +
                '<p><span class="text-gray-500">追跡番号:</span> <strong>' + trackingLink + '</strong></p>' +
                '<p><span class="text-gray-500">重量:</span> ' + (doc.package_weight_kg || doc.weight_kg || '-') + ' kg</p>' +
              '</div>' +
            '</div>' +
            '<div class="border rounded-lg p-3">' +
              '<p class="text-xs font-bold text-gray-500 mb-2 uppercase">金額情報 / Invoice</p>' +
              '<div class="space-y-1 text-sm">' +
                '<p><span class="text-gray-500">販売価格:</span> <strong>$' + Number(doc.sale_price_usd || 0).toFixed(2) + '</strong> (¥' + Number(doc.sale_price_jpy || 0).toLocaleString() + ')</p>' +
                '<p><span class="text-gray-500">送料:</span> $' + Number(doc.shipping_cost_usd || 0).toFixed(2) + '</p>' +
                '<p class="text-xs text-gray-400 mt-1">※通関用インボイスに記載する金額</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="border rounded-lg p-3 mb-4">' +
            '<p class="text-xs font-bold text-gray-500 mb-2 uppercase">チェックリスト</p>' +
            '<div class="grid grid-cols-2 gap-1">' + checklist + '</div>' +
          '</div>' +
          '<div class="border-t-2 border-gray-800 pt-3 text-center">' +
            '<p class="text-xs text-gray-400">PARTS HUB / TCI inc - 越境EC発送手配書</p>' +
          '</div>' +
        '</div>';
        document.getElementById('shipping-doc-content').innerHTML = html;
        document.getElementById('shipping-doc-modal').classList.add('show');
      } catch(e) {
        alert('発送手配書の取得に失敗しました');
      }
    }

    // ===== 追跡番号登録モーダル =====
    function openTrackingModal(orderId) {
      var carrierOptions = [
        { code:'ems', name:'EMS（国際スピード郵便）', group:'日本郵便' },
        { code:'epacket_light', name:'eパケットライト', group:'日本郵便' },
        { code:'jp_air_parcel', name:'国際小包（航空便）', group:'日本郵便' },
        { code:'fedex_priority', name:'FedEx International Priority', group:'FedEx' },
        { code:'fedex_economy', name:'FedEx International Economy', group:'FedEx' },
        { code:'dhl_express', name:'DHL Express Worldwide', group:'DHL' },
        { code:'ups_express', name:'UPS Worldwide Express', group:'UPS' },
        { code:'yamato_intl', name:'ヤマト運輸 国際宅急便', group:'ヤマト' },
        { code:'sagawa_intl', name:'佐川急便 飛脚国際宅配便', group:'佐川' }
      ];
      var optionsHtml = '<option value="">-- 業者を選択 --</option>';
      var currentGroup = '';
      carrierOptions.forEach(function(c) {
        if (c.group !== currentGroup) {
          if (currentGroup) optionsHtml += '</optgroup>';
          optionsHtml += '<optgroup label="' + c.group + '">';
          currentGroup = c.group;
        }
        optionsHtml += '<option value="' + c.code + '">' + c.name + '</option>';
      });
      optionsHtml += '</optgroup>';

      var html = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;" id="tracking-modal-overlay" onclick="if(event.target===this)this.remove()">' +
        '<div style="background:white;border-radius:16px;max-width:500px;width:95%;padding:24px;" onclick="event.stopPropagation()">' +
        '<h3 class="text-lg font-bold mb-4"><i class="fas fa-shipping-fast mr-2 text-indigo-500"></i>追跡番号登録 #' + orderId + '</h3>' +
        '<div class="space-y-3">' +
        '<div><label class="text-xs text-gray-500 block mb-1">配送業者</label>' +
          '<select id="track-carrier-' + orderId + '" class="w-full px-3 py-2 border rounded-lg text-sm">' + optionsHtml + '</select></div>' +
        '<div><label class="text-xs text-gray-500 block mb-1">追跡番号</label>' +
          '<input type="text" id="track-number-' + orderId + '" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="EJ123456789JP"></div>' +
        '<div class="bg-blue-50 rounded-lg p-2">' +
          '<p class="text-xs text-blue-600"><i class="fas fa-info-circle mr-1"></i>追跡番号を登録すると追跡URLが自動生成され、注文ステータスが「発送済」に更新されます。</p>' +
        '</div>' +
        '</div>' +
        '<div class="flex gap-3 mt-4">' +
        '<button onclick="document.getElementById(\\'tracking-modal-overlay\\').remove()" class="flex-1 px-4 py-2 border rounded-lg font-semibold">キャンセル</button>' +
        '<button onclick="saveTracking(' + orderId + ')" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"><i class="fas fa-save mr-1"></i>登録して発送済みに</button>' +
        '</div></div></div>';
      document.body.insertAdjacentHTML('beforeend', html);
    }

    async function saveTracking(orderId) {
      var carrier = document.getElementById('track-carrier-' + orderId);
      var number = document.getElementById('track-number-' + orderId);
      if (!carrier || !number) return;
      if (!number.value.trim()) { alert('追跡番号を入力してください'); return; }
      if (!carrier.value) { alert('配送業者を選択してください'); return; }

      try {
        var res = await axios.put('/api/admin/cross-border/orders/' + orderId + '/tracking', {
          tracking_number: number.value.trim(),
          carrier_code: carrier.value
        }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') } });

        if (res.data.success) {
          alert('✅ 追跡番号を登録しました！\\n\\n業者: ' + res.data.carrier_name + '\\n番号: ' + res.data.tracking_number +
            (res.data.tracking_url ? '\\n追跡URL: ' + res.data.tracking_url : ''));
          var overlay = document.getElementById('tracking-modal-overlay');
          if (overlay) overlay.remove();
          loadOrders();
        } else {
          alert('登録失敗: ' + (res.data.error || ''));
        }
      } catch(e) {
        alert('エラー: ' + (e.response?.data?.error || e.message));
      }
    }

    // ===== 初期化 =====
    (function() {
      // 全て並列で非同期実行（1つが失敗/遅延しても他に影響しない）
      refreshRate().catch(function(e) { console.warn('refreshRate error:', e); });
      loadStats().catch(function(e) { console.warn('loadStats error:', e); });
      loadCandidates().catch(function(e) { console.warn('loadCandidates error:', e); });
      checkEbayConnection().catch(function(e) { console.warn('checkEbayConnection error:', e); });
    })();
    </script>
  `;

  return c.html(AdminLayout('cross-border', '越境EC管理', content));
});

// =============================================
// バナー広告管理ページ
// =============================================
adminPagesRoutes.get('/banners', async (c) => {
  const content = `
    <div class="space-y-6">
      <!-- ヘッダー -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-images mr-2 text-red-500"></i>バナー広告管理</h2>
          <p class="text-sm text-gray-500 mt-1">TOPページ・各都道府県ページに表示されるバナースライダーを管理します（各エリア最大5枚）</p>
        </div>
        <button onclick="openBannerModal()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2">
          <i class="fas fa-plus"></i>新規バナー追加
        </button>
      </div>

      <!-- エリアフィルタ -->
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"><i class="fas fa-map-marker-alt mr-1"></i>表示エリアで絞り込み</label>
        <div class="flex flex-wrap gap-2" id="area-filter-tabs">
          <button onclick="filterByArea('all')" data-area="all" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-red-500 text-white border-red-500">すべて</button>
          <button onclick="filterByArea('top')" data-area="top" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">TOPページ</button>
          <div class="border-l border-gray-200 mx-1"></div>
          <button onclick="filterByArea('hokkaido')" data-area="hokkaido" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">北海道</button>
          <button onclick="filterByArea('aomori')" data-area="aomori" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">青森</button>
          <button onclick="filterByArea('iwate')" data-area="iwate" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">岩手</button>
          <button onclick="filterByArea('miyagi')" data-area="miyagi" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">宮城</button>
          <button onclick="filterByArea('akita')" data-area="akita" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">秋田</button>
          <button onclick="filterByArea('yamagata')" data-area="yamagata" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">山形</button>
          <button onclick="filterByArea('fukushima')" data-area="fukushima" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">福島</button>
          <button onclick="filterByArea('ibaraki')" data-area="ibaraki" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">茨城</button>
          <button onclick="filterByArea('tochigi')" data-area="tochigi" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">栃木</button>
          <button onclick="filterByArea('gunma')" data-area="gunma" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">群馬</button>
          <button onclick="filterByArea('saitama')" data-area="saitama" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">埼玉</button>
          <button onclick="filterByArea('chiba')" data-area="chiba" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">千葉</button>
          <button onclick="filterByArea('tokyo')" data-area="tokyo" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">東京</button>
          <button onclick="filterByArea('kanagawa')" data-area="kanagawa" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">神奈川</button>
          <button onclick="filterByArea('niigata')" data-area="niigata" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">新潟</button>
          <button onclick="filterByArea('toyama')" data-area="toyama" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">富山</button>
          <button onclick="filterByArea('ishikawa')" data-area="ishikawa" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">石川</button>
          <button onclick="filterByArea('fukui')" data-area="fukui" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">福井</button>
          <button onclick="filterByArea('yamanashi')" data-area="yamanashi" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">山梨</button>
          <button onclick="filterByArea('nagano')" data-area="nagano" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">長野</button>
          <button onclick="filterByArea('gifu')" data-area="gifu" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">岐阜</button>
          <button onclick="filterByArea('shizuoka')" data-area="shizuoka" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">静岡</button>
          <button onclick="filterByArea('aichi')" data-area="aichi" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">愛知</button>
          <button onclick="filterByArea('mie')" data-area="mie" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">三重</button>
          <button onclick="filterByArea('shiga')" data-area="shiga" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">滋賀</button>
          <button onclick="filterByArea('kyoto')" data-area="kyoto" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">京都</button>
          <button onclick="filterByArea('osaka')" data-area="osaka" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">大阪</button>
          <button onclick="filterByArea('hyogo')" data-area="hyogo" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">兵庫</button>
          <button onclick="filterByArea('nara')" data-area="nara" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">奈良</button>
          <button onclick="filterByArea('wakayama')" data-area="wakayama" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">和歌山</button>
          <button onclick="filterByArea('tottori')" data-area="tottori" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">鳥取</button>
          <button onclick="filterByArea('shimane')" data-area="shimane" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">島根</button>
          <button onclick="filterByArea('okayama')" data-area="okayama" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">岡山</button>
          <button onclick="filterByArea('hiroshima')" data-area="hiroshima" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">広島</button>
          <button onclick="filterByArea('yamaguchi')" data-area="yamaguchi" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">山口</button>
          <button onclick="filterByArea('tokushima')" data-area="tokushima" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">徳島</button>
          <button onclick="filterByArea('kagawa')" data-area="kagawa" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">香川</button>
          <button onclick="filterByArea('ehime')" data-area="ehime" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">愛媛</button>
          <button onclick="filterByArea('kochi')" data-area="kochi" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">高知</button>
          <button onclick="filterByArea('fukuoka')" data-area="fukuoka" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">福岡</button>
          <button onclick="filterByArea('saga')" data-area="saga" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">佐賀</button>
          <button onclick="filterByArea('nagasaki')" data-area="nagasaki" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">長崎</button>
          <button onclick="filterByArea('kumamoto')" data-area="kumamoto" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">熊本</button>
          <button onclick="filterByArea('oita')" data-area="oita" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">大分</button>
          <button onclick="filterByArea('miyazaki')" data-area="miyazaki" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">宮崎</button>
          <button onclick="filterByArea('kagoshima')" data-area="kagoshima" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">鹿児島</button>
          <button onclick="filterByArea('okinawa')" data-area="okinawa" class="area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-gray-600 border-gray-300 hover:border-red-300">沖縄</button>
        </div>
      </div>

      <!-- 推奨サイズ表示 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
          <div>
            <p class="font-semibold text-blue-800 text-sm">バナー画像の推奨サイズ</p>
            <p class="text-blue-700 text-xs mt-1">推奨: <strong>1200×400px</strong>（横3:縦1の比率）｜最大ファイルサイズ: <strong>5MB</strong>｜対応形式: JPEG, PNG, WebP, GIF</p>
            <p class="text-blue-600 text-xs mt-1">※ スマートフォンでは自動的にフィットします。重要な内容は中央に配置してください。</p>
          </div>
        </div>
      </div>

      <!-- プレビュー -->
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <h3 class="text-sm font-bold text-gray-700 mb-3"><i class="fas fa-eye mr-1"></i>スライダープレビュー</h3>
        <div id="preview-wrapper" class="relative overflow-hidden rounded-lg bg-gray-100" style="aspect-ratio:3/1; max-height:300px;">
          <div id="preview-track" class="flex transition-transform duration-500 ease-in-out h-full"></div>
          <div id="preview-dots" class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5"></div>
          <div id="preview-empty" class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
              <i class="fas fa-image text-4xl mb-2"></i>
              <p class="text-sm">バナーが登録されていません</p>
            </div>
          </div>
        </div>
      </div>

      <!-- バナー一覧テーブル -->
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h3 class="font-bold text-gray-800"><i class="fas fa-list mr-2"></i>登録バナー一覧</h3>
          <span id="banner-count" class="text-sm text-gray-500">-</span>
        </div>
        <div id="banner-list" class="divide-y">
          <div class="p-8 text-center text-gray-400"><div class="spinner mx-auto mb-2"></div>読み込み中...</div>
        </div>
      </div>
    </div>

    <!-- バナー追加/編集モーダル -->
    <div id="banner-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[100] hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 id="modal-title" class="text-lg font-bold text-gray-800"><i class="fas fa-plus-circle mr-2 text-red-500"></i>新規バナー追加</h3>
          <button onclick="closeBannerModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6 space-y-5">
          <input type="hidden" id="edit-banner-id" value="">

          <!-- バナー管理名 -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">バナー管理名 <span class="text-red-500">*</span></label>
            <input type="text" id="banner-title" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="例: 春の新作パーツセール">
          </div>

          <!-- 画像アップロード -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">バナー画像 <span class="text-red-500">*</span></label>
            <div id="upload-area" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors"
                 onclick="document.getElementById('banner-file').click()">
              <div id="upload-placeholder">
                <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                <p class="text-sm text-gray-600">クリックして画像を選択<br><span class="text-xs text-gray-400">または、ドラッグ＆ドロップ</span></p>
              </div>
              <div id="upload-preview" class="hidden">
                <img id="preview-img" src="" alt="プレビュー" class="max-h-40 mx-auto rounded">
                <p id="upload-filename" class="text-xs text-gray-500 mt-2"></p>
              </div>
            </div>
            <input type="file" id="banner-file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" onchange="handleFileSelect(event)">
            <div id="upload-progress" class="hidden mt-2">
              <div class="w-full bg-gray-200 rounded-full h-2"><div id="progress-bar" class="bg-red-500 h-2 rounded-full transition-all" style="width:0%"></div></div>
              <p id="progress-text" class="text-xs text-gray-500 mt-1">アップロード中...</p>
            </div>
            <input type="hidden" id="banner-image-url" value="">
            <input type="hidden" id="banner-image-key" value="">
          </div>

          <!-- バナーサイズ指定 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">推奨横幅 (px)</label>
              <input type="number" id="banner-width" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg" value="1200" min="300" max="3000">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">推奨高さ (px)</label>
              <input type="number" id="banner-height" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg" value="400" min="100" max="1500">
            </div>
          </div>

          <!-- リンクURL -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">リンク先URL <span class="text-gray-400 font-normal text-xs">（空欄の場合リンクなし）</span></label>
            <input type="url" id="banner-link" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="https://example.com">
          </div>

          <!-- 表示順 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">表示順</label>
              <input type="number" id="banner-order" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg" value="0" min="0">
              <p class="text-xs text-gray-400 mt-1">小さい数字が先に表示されます</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">表示状態</label>
              <select id="banner-active" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg">
                <option value="1">表示中</option>
                <option value="0">非表示</option>
              </select>
            </div>
          </div>

          <!-- 表示エリア -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">表示エリア <span class="text-red-500">*</span></label>
            <select id="banner-placement" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg">
              <option value="top">TOPページ</option>
              <optgroup label="北海道">
                <option value="hokkaido">北海道</option>
              </optgroup>
              <optgroup label="東北">
                <option value="aomori">青森県</option><option value="iwate">岩手県</option><option value="miyagi">宮城県</option><option value="akita">秋田県</option><option value="yamagata">山形県</option><option value="fukushima">福島県</option>
              </optgroup>
              <optgroup label="関東">
                <option value="ibaraki">茨城県</option><option value="tochigi">栃木県</option><option value="gunma">群馬県</option><option value="saitama">埼玉県</option><option value="chiba">千葉県</option><option value="tokyo">東京都</option><option value="kanagawa">神奈川県</option>
              </optgroup>
              <optgroup label="中部">
                <option value="niigata">新潟県</option><option value="toyama">富山県</option><option value="ishikawa">石川県</option><option value="fukui">福井県</option><option value="yamanashi">山梨県</option><option value="nagano">長野県</option><option value="gifu">岐阜県</option><option value="shizuoka">静岡県</option><option value="aichi">愛知県</option>
              </optgroup>
              <optgroup label="近畿">
                <option value="mie">三重県</option><option value="shiga">滋賀県</option><option value="kyoto">京都府</option><option value="osaka">大阪府</option><option value="hyogo">兵庫県</option><option value="nara">奈良県</option><option value="wakayama">和歌山県</option>
              </optgroup>
              <optgroup label="中国">
                <option value="tottori">鳥取県</option><option value="shimane">島根県</option><option value="okayama">岡山県</option><option value="hiroshima">広島県</option><option value="yamaguchi">山口県</option>
              </optgroup>
              <optgroup label="四国">
                <option value="tokushima">徳島県</option><option value="kagawa">香川県</option><option value="ehime">愛媛県</option><option value="kochi">高知県</option>
              </optgroup>
              <optgroup label="九州・沖縄">
                <option value="fukuoka">福岡県</option><option value="saga">佐賀県</option><option value="nagasaki">長崎県</option><option value="kumamoto">熊本県</option><option value="oita">大分県</option><option value="miyazaki">宮崎県</option><option value="kagoshima">鹿児島県</option><option value="okinawa">沖縄県</option>
              </optgroup>
            </select>
          </div>

          <!-- 表示期間 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">表示開始日 <span class="text-gray-400 font-normal text-xs">（空欄＝即時）</span></label>
              <input type="datetime-local" id="banner-start" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">表示終了日 <span class="text-gray-400 font-normal text-xs">（空欄＝無期限）</span></label>
              <input type="datetime-local" id="banner-end" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg">
            </div>
          </div>

          <!-- エラーメッセージ -->
          <div id="modal-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm"></div>
        </div>

        <div class="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <button onclick="closeBannerModal()" class="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">キャンセル</button>
          <button onclick="saveBanner()" id="save-btn" class="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2">
            <i class="fas fa-save"></i>保存
          </button>
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div id="delete-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[110] hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold text-gray-800 mb-2"><i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>バナーを削除</h3>
        <p class="text-sm text-gray-600 mb-4">このバナーを削除しますか？この操作は取り消せません。</p>
        <input type="hidden" id="delete-banner-id">
        <div class="flex gap-3">
          <button onclick="document.getElementById('delete-modal').classList.add('hidden')" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">キャンセル</button>
          <button onclick="confirmDelete()" class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">削除する</button>
        </div>
      </div>
    </div>

    <style>
      #upload-area.drag-over { border-color: #ef4444; background: #fef2f2; }
      .banner-row:hover { background: #fafafa; }
    </style>

    <script>
    const API = '/api/admin';
    let banners = [];
    let currentAreaFilter = 'all';
    const PREF_NAMES = {top:'TOPページ',hokkaido:'北海道',aomori:'青森',iwate:'岩手',miyagi:'宮城',akita:'秋田',yamagata:'山形',fukushima:'福島',ibaraki:'茨城',tochigi:'栃木',gunma:'群馬',saitama:'埼玉',chiba:'千葉',tokyo:'東京',kanagawa:'神奈川',niigata:'新潟',toyama:'富山',ishikawa:'石川',fukui:'福井',yamanashi:'山梨',nagano:'長野',gifu:'岐阜',shizuoka:'静岡',aichi:'愛知',mie:'三重',shiga:'滋賀',kyoto:'京都',osaka:'大阪',hyogo:'兵庫',nara:'奈良',wakayama:'和歌山',tottori:'鳥取',shimane:'島根',okayama:'岡山',hiroshima:'広島',yamaguchi:'山口',tokushima:'徳島',kagawa:'香川',ehime:'愛媛',kochi:'高知',fukuoka:'福岡',saga:'佐賀',nagasaki:'長崎',kumamoto:'熊本',oita:'大分',miyazaki:'宮崎',kagoshima:'鹿児島',okinawa:'沖縄'};

    function filterByArea(area) {
      currentAreaFilter = area;
      document.querySelectorAll('.area-tab').forEach(t => {
        t.className = 'area-tab px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ' +
          (t.dataset.area === area ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-300 hover:border-red-300');
      });
      renderBannerList();
      renderPreview();
      const filtered = currentAreaFilter === 'all' ? banners : banners.filter(b => b.placement === currentAreaFilter);
      document.getElementById('banner-count').textContent = filtered.length + ' 件' + (currentAreaFilter !== 'all' ? '（' + (PREF_NAMES[currentAreaFilter] || currentAreaFilter) + '）' : '');
    }

    // ====== 初期読み込み ======
    async function loadBanners() {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await axios.get(API + '/banners', { headers: { Authorization: 'Bearer ' + token } });
        banners = res.data.banners || [];
        renderBannerList();
        renderPreview();
        const filtered = currentAreaFilter === 'all' ? banners : banners.filter(b => b.placement === currentAreaFilter);
        document.getElementById('banner-count').textContent = filtered.length + ' 件' + (currentAreaFilter !== 'all' ? '（' + (PREF_NAMES[currentAreaFilter] || currentAreaFilter) + '）' : ' / 全エリア合計 ' + banners.length + ' 件');
      } catch (e) {
        document.getElementById('banner-list').innerHTML = '<div class="p-8 text-center text-red-500">読み込みに失敗しました</div>';
      }
    }

    // ====== 一覧レンダリング ======
    function renderBannerList() {
      const list = document.getElementById('banner-list');
      const filtered = currentAreaFilter === 'all' ? banners : banners.filter(b => b.placement === currentAreaFilter);
      if (!filtered.length) {
        list.innerHTML = '<div class="p-12 text-center text-gray-400"><i class="fas fa-image text-4xl mb-3"></i><p>バナーが登録されていません</p><p class="text-xs mt-1">「新規バナー追加」から登録してください</p></div>';
        return;
      }
      list.innerHTML = filtered.map((b, idx) => {
        const imgUrl = b.image_url.startsWith('/r2/') ? b.image_url : '/r2/' + b.image_url;
        const statusBadge = b.is_active
          ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">表示中</span>'
          : '<span class="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">非表示</span>';
        const period = (b.start_date || b.end_date)
          ? '<span class="text-xs text-gray-400">' + (b.start_date ? b.start_date.substring(0,10) : '即時') + ' 〜 ' + (b.end_date ? b.end_date.substring(0,10) : '無期限') + '</span>'
          : '<span class="text-xs text-gray-400">期間制限なし</span>';
        return '<div class="banner-row flex items-center gap-4 px-6 py-4 transition-colors">' +
          '<div class="text-gray-400 text-sm font-mono w-6 text-center">' + b.display_order + '</div>' +
          '<div class="w-32 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">' +
            '<img src="' + imgUrl + '" alt="' + escapeHtml(b.title) + '" class="w-full h-full object-cover">' +
          '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<span class="font-semibold text-gray-800 text-sm truncate">' + escapeHtml(b.title) + '</span>' +
              statusBadge +
              '<span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-semibold">' + (PREF_NAMES[b.placement] || b.placement || 'TOP') + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-3 text-xs text-gray-500">' +
              (b.link_url ? '<a href="' + b.link_url + '" target="_blank" class="text-blue-500 hover:underline truncate max-w-[200px]"><i class="fas fa-external-link-alt mr-1"></i>' + b.link_url.substring(0, 40) + '</a>' : '<span class="text-gray-400">リンクなし</span>') +
              '<span>|</span>' + period +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2 text-xs text-gray-400">' +
            '<div class="text-center px-2"><div class="font-bold text-gray-700 text-sm">' + (b.view_count || 0).toLocaleString() + '</div><div>表示</div></div>' +
            '<div class="text-center px-2"><div class="font-bold text-gray-700 text-sm">' + (b.click_count || 0).toLocaleString() + '</div><div>クリック</div></div>' +
          '</div>' +
          '<div class="flex items-center gap-1">' +
            '<button onclick="editBanner(' + b.id + ')" class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="編集"><i class="fas fa-edit"></i></button>' +
            '<button onclick="toggleBannerActive(' + b.id + ',' + (b.is_active ? 0 : 1) + ')" class="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg" title="' + (b.is_active ? '非表示にする' : '表示する') + '"><i class="fas fa-' + (b.is_active ? 'eye-slash' : 'eye') + '"></i></button>' +
            '<button onclick="showDeleteModal(' + b.id + ')" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="削除"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // ====== プレビュースライダー ======
    function renderPreview() {
      const track = document.getElementById('preview-track');
      const dots = document.getElementById('preview-dots');
      const empty = document.getElementById('preview-empty');
      const forArea = currentAreaFilter === 'all' ? banners : banners.filter(b => b.placement === currentAreaFilter);
      const active = forArea.filter(b => b.is_active);
      if (!active.length) {
        track.innerHTML = '';
        dots.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');
      track.innerHTML = active.slice(0, 5).map(b => {
        const imgUrl = b.image_url.startsWith('/r2/') ? b.image_url : '/r2/' + b.image_url;
        return '<div class="flex-shrink-0 w-full h-full"><img src="' + imgUrl + '" class="w-full h-full object-cover"></div>';
      }).join('');
      const total = Math.min(active.length, 5);
      dots.innerHTML = Array.from({length: total}, (_, i) =>
        '<button class="w-2 h-2 rounded-full ' + (i === 0 ? 'bg-red-500' : 'bg-gray-300') + '" data-pidx="' + i + '"></button>'
      ).join('');
      // Simple auto-slide for preview
      let pIdx = 0;
      clearInterval(window._previewTimer);
      if (total > 1) {
        window._previewTimer = setInterval(() => {
          pIdx = (pIdx + 1) % total;
          track.style.transform = 'translateX(-' + (pIdx * 100) + '%)';
          dots.querySelectorAll('button').forEach((d, i) => d.className = 'w-2 h-2 rounded-full ' + (i === pIdx ? 'bg-red-500' : 'bg-gray-300'));
        }, 3000);
      }
    }

    // ====== モーダル操作 ======
    function openBannerModal() {
      document.getElementById('edit-banner-id').value = '';
      document.getElementById('banner-title').value = '';
      document.getElementById('banner-link').value = '';
      document.getElementById('banner-order').value = banners.length;
      document.getElementById('banner-active').value = '1';
      document.getElementById('banner-placement').value = currentAreaFilter !== 'all' ? currentAreaFilter : 'top';
      document.getElementById('banner-width').value = '1200';
      document.getElementById('banner-height').value = '400';
      document.getElementById('banner-start').value = '';
      document.getElementById('banner-end').value = '';
      document.getElementById('banner-image-url').value = '';
      document.getElementById('banner-image-key').value = '';
      document.getElementById('upload-placeholder').classList.remove('hidden');
      document.getElementById('upload-preview').classList.add('hidden');
      document.getElementById('modal-error').classList.add('hidden');
      document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus-circle mr-2 text-red-500"></i>新規バナー追加';
      document.getElementById('banner-modal').classList.remove('hidden');
    }

    function closeBannerModal() {
      document.getElementById('banner-modal').classList.add('hidden');
    }

    async function editBanner(id) {
      const token = localStorage.getItem('admin_token');
      try {
        const res = await axios.get(API + '/banners/' + id, { headers: { Authorization: 'Bearer ' + token } });
        const b = res.data.banner;
        document.getElementById('edit-banner-id').value = b.id;
        document.getElementById('banner-title').value = b.title;
        document.getElementById('banner-link').value = b.link_url || '';
        document.getElementById('banner-order').value = b.display_order;
        document.getElementById('banner-active').value = b.is_active;
        document.getElementById('banner-width').value = b.width || 1200;
        document.getElementById('banner-height').value = b.height || 400;
        document.getElementById('banner-placement').value = b.placement || 'top';
        document.getElementById('banner-start').value = b.start_date ? b.start_date.substring(0, 16) : '';
        document.getElementById('banner-end').value = b.end_date ? b.end_date.substring(0, 16) : '';
        document.getElementById('banner-image-url').value = b.image_url;
        document.getElementById('banner-image-key').value = b.image_key || '';
        // Show existing image
        const imgUrl = b.image_url.startsWith('/r2/') ? b.image_url : '/r2/' + b.image_url;
        document.getElementById('preview-img').src = imgUrl;
        document.getElementById('upload-filename').textContent = b.title;
        document.getElementById('upload-placeholder').classList.add('hidden');
        document.getElementById('upload-preview').classList.remove('hidden');
        document.getElementById('modal-error').classList.add('hidden');
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit mr-2 text-blue-500"></i>バナーを編集';
        document.getElementById('banner-modal').classList.remove('hidden');
      } catch (e) { alert('バナー情報の取得に失敗しました'); }
    }

    // ====== 画像アップロード ======
    function handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      uploadBannerImage(file);
    }

    // ドラッグ＆ドロップ
    const uploadArea = document.getElementById('upload-area');
    ['dragenter','dragover'].forEach(e => uploadArea?.addEventListener(e, (ev) => { ev.preventDefault(); uploadArea.classList.add('drag-over'); }));
    ['dragleave','drop'].forEach(e => uploadArea?.addEventListener(e, (ev) => { ev.preventDefault(); uploadArea.classList.remove('drag-over'); }));
    uploadArea?.addEventListener('drop', (ev) => {
      const file = ev.dataTransfer?.files?.[0];
      if (file) uploadBannerImage(file);
    });

    async function uploadBannerImage(file) {
      if (file.size > 5 * 1024 * 1024) { showModalError('ファイルサイズは5MB以下にしてください'); return; }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) { showModalError('JPEG, PNG, WebP, GIF のみ対応しています'); return; }

      const progress = document.getElementById('upload-progress');
      const bar = document.getElementById('progress-bar');
      const pText = document.getElementById('progress-text');
      progress.classList.remove('hidden');
      bar.style.width = '30%';
      pText.textContent = 'アップロード中...';

      try {
        const token = localStorage.getItem('admin_token');
        const fd = new FormData();
        fd.append('image', file);
        bar.style.width = '60%';
        const res = await axios.post(API + '/banners/upload', fd, {
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' }
        });
        bar.style.width = '100%';
        pText.textContent = 'アップロード完了';
        if (res.data.success) {
          document.getElementById('banner-image-url').value = res.data.image_url;
          document.getElementById('banner-image-key').value = res.data.image_key;
          document.getElementById('preview-img').src = res.data.image_url;
          document.getElementById('upload-filename').textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
          document.getElementById('upload-placeholder').classList.add('hidden');
          document.getElementById('upload-preview').classList.remove('hidden');
        } else {
          showModalError(res.data.error || 'アップロードに失敗しました');
        }
      } catch (e) {
        showModalError('アップロードに失敗しました: ' + (e.response?.data?.error || e.message));
      }
      setTimeout(() => progress.classList.add('hidden'), 1500);
    }

    // ====== 保存 ======
    async function saveBanner() {
      const title = document.getElementById('banner-title').value.trim();
      const imageUrl = document.getElementById('banner-image-url').value;
      if (!title) { showModalError('バナー管理名を入力してください'); return; }
      if (!imageUrl) { showModalError('バナー画像をアップロードしてください'); return; }

      const token = localStorage.getItem('admin_token');
      const payload = {
        title: title,
        image_url: imageUrl,
        image_key: document.getElementById('banner-image-key').value || null,
        link_url: document.getElementById('banner-link').value.trim(),
        display_order: parseInt(document.getElementById('banner-order').value) || 0,
        is_active: parseInt(document.getElementById('banner-active').value),
        width: parseInt(document.getElementById('banner-width').value) || 1200,
        height: parseInt(document.getElementById('banner-height').value) || 400,
        placement: document.getElementById('banner-placement').value || 'top',
        start_date: document.getElementById('banner-start').value ? new Date(document.getElementById('banner-start').value).toISOString() : null,
        end_date: document.getElementById('banner-end').value ? new Date(document.getElementById('banner-end').value).toISOString() : null
      };

      const editId = document.getElementById('edit-banner-id').value;
      const btn = document.getElementById('save-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>保存中...';

      try {
        if (editId) {
          await axios.put(API + '/banners/' + editId, payload, { headers: { Authorization: 'Bearer ' + token } });
        } else {
          await axios.post(API + '/banners', payload, { headers: { Authorization: 'Bearer ' + token } });
        }
        closeBannerModal();
        loadBanners();
      } catch (e) {
        showModalError('保存に失敗しました: ' + (e.response?.data?.error || e.message));
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i>保存';
    }

    // ====== 表示/非表示切替 ======
    async function toggleBannerActive(id, newState) {
      const token = localStorage.getItem('admin_token');
      try {
        await axios.put(API + '/banners/' + id, { is_active: newState }, { headers: { Authorization: 'Bearer ' + token } });
        loadBanners();
      } catch (e) { alert('更新に失敗しました'); }
    }

    // ====== 削除 ======
    function showDeleteModal(id) {
      document.getElementById('delete-banner-id').value = id;
      document.getElementById('delete-modal').classList.remove('hidden');
    }
    async function confirmDelete() {
      const id = document.getElementById('delete-banner-id').value;
      const token = localStorage.getItem('admin_token');
      try {
        await axios.delete(API + '/banners/' + id, { headers: { Authorization: 'Bearer ' + token } });
        document.getElementById('delete-modal').classList.add('hidden');
        loadBanners();
      } catch (e) { alert('削除に失敗しました'); }
    }

    function showModalError(msg) {
      const el = document.getElementById('modal-error');
      el.textContent = msg;
      el.classList.remove('hidden');
    }

    // ====== 初期化 ======
    loadBanners();
    </script>
  `;
  return c.html(AdminLayout('banners', 'バナー広告管理', content));
});

// eBay API設定・テスト管理ページ
adminPagesRoutes.get('/ebay', async (c) => {
  const content = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-800"><i class="fab fa-ebay mr-2 text-blue-600"></i>eBay API連携</h2>
          <p class="text-gray-500 mt-1">eBay Browse APIを使った商品検索・価格調査機能の管理</p>
        </div>
      </div>

      <!-- API接続ステータス -->
      <div id="status-card" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-plug mr-2"></i>接続ステータス</h3>
        <div id="status-loading" class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-blue-500 text-xl"></i>
          <p class="text-sm text-gray-500 mt-2">接続確認中...</p>
        </div>
        <div id="status-result" class="hidden">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">環境</p>
              <p id="s-environment" class="font-bold text-gray-900">-</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">Client ID</p>
              <p id="s-clientId" class="font-bold">-</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">Client Secret</p>
              <p id="s-clientSecret" class="font-bold">-</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">OAuth Token</p>
              <p id="s-token" class="font-bold">-</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 検索テスト -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-search mr-2"></i>検索テスト</h3>
        <div class="flex gap-3 mb-4">
          <input type="text" id="test-query" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="キーワードを入力（例: brake pads toyota）">
          <button onclick="testSearch()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <i class="fas fa-search mr-1"></i>検索
          </button>
        </div>
        <div id="search-result" class="hidden">
          <div id="search-loading" class="text-center py-4 hidden">
            <i class="fas fa-spinner fa-spin text-blue-500"></i>
          </div>
          <div id="search-data" class="space-y-3"></div>
        </div>
      </div>

      <!-- 価格調査テスト -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-chart-line mr-2"></i>価格調査テスト</h3>
        <div class="flex gap-3 mb-4">
          <input type="text" id="price-query" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="品番 or キーワード（例: 04465-26420）">
          <select id="price-condition" class="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">全状態</option>
            <option value="new">新品</option>
            <option value="used">中古</option>
          </select>
          <button onclick="testPriceResearch()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
            <i class="fas fa-chart-bar mr-1"></i>調査
          </button>
        </div>
        <div id="price-result" class="hidden">
          <div id="price-loading" class="text-center py-4 hidden">
            <i class="fas fa-spinner fa-spin text-green-500"></i>
          </div>
          <div id="price-data"></div>
        </div>
      </div>

      <!-- API設定情報 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-cog mr-2"></i>設定方法</h3>
        <div class="space-y-3 text-sm text-gray-600">
          <p><strong>1. eBay Developer Programに登録:</strong> <a href="https://developer.ebay.com" target="_blank" class="text-blue-600 hover:underline">developer.ebay.com</a></p>
          <p><strong>2. Application Keysを作成</strong>（Sandbox / Production）</p>
          <p><strong>3. Cloudflare環境変数に設定:</strong></p>
          <div class="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <p>npx wrangler pages secret put EBAY_CLIENT_ID --project-name parts-hub</p>
            <p>npx wrangler pages secret put EBAY_CLIENT_SECRET --project-name parts-hub</p>
            <p>npx wrangler pages secret put EBAY_DEV_ID --project-name parts-hub</p>
            <p class="text-gray-500"># Dashboard → Environment Variables:</p>
            <p>EBAY_ENVIRONMENT = "sandbox" <span class="text-gray-500">または</span> "production"</p>
          </div>
          <p><strong>4. 利用可能なAPI:</strong></p>
          <ul class="list-disc ml-6 space-y-1">
            <li><code class="bg-gray-100 px-1 rounded">GET /api/ebay/search?q=keyword</code> - 商品検索</li>
            <li><code class="bg-gray-100 px-1 rounded">GET /api/ebay/price-research?q=keyword</code> - 価格調査</li>
            <li><code class="bg-gray-100 px-1 rounded">GET /api/ebay/status</code> - API接続確認</li>
          </ul>
        </div>
      </div>
    </div>

    <script>
      var token = localStorage.getItem('admin_token');
      var headers = token ? { 'Authorization': 'Bearer ' + token } : {};

      // 接続ステータス取得
      (function() {
        axios.get('/api/ebay/status')
          .then(function(res) {
            document.getElementById('status-loading').classList.add('hidden');
            document.getElementById('status-result').classList.remove('hidden');
            var d = res.data.data;
            document.getElementById('s-environment').textContent = d.environment === 'production' ? '本番' : 'サンドボックス';
            document.getElementById('s-environment').className = 'font-bold ' + (d.environment === 'production' ? 'text-green-600' : 'text-yellow-600');
            
            var ok = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>設定済み</span>';
            var ng = '<span class="text-red-500"><i class="fas fa-times-circle mr-1"></i>未設定</span>';
            document.getElementById('s-clientId').innerHTML = d.credentials.clientId ? ok : ng;
            document.getElementById('s-clientSecret').innerHTML = d.credentials.clientSecret ? ok : ng;
            document.getElementById('s-token').innerHTML = d.tokenValid 
              ? '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>認証成功</span>' 
              : '<span class="text-red-500"><i class="fas fa-times-circle mr-1"></i>認証失敗</span>';
          })
          .catch(function(err) {
            document.getElementById('status-loading').innerHTML = '<p class="text-red-500"><i class="fas fa-exclamation-triangle mr-1"></i>接続確認に失敗しました</p>';
          });
      })();

      // 検索テスト
      function testSearch() {
        var q = document.getElementById('test-query').value.trim();
        if (!q) return alert('キーワードを入力してください');
        
        var result = document.getElementById('search-result');
        var loading = document.getElementById('search-loading');
        var dataEl = document.getElementById('search-data');
        result.classList.remove('hidden');
        loading.classList.remove('hidden');
        dataEl.innerHTML = '';

        axios.get('/api/ebay/search?q=' + encodeURIComponent(q) + '&limit=10')
          .then(function(res) {
            loading.classList.add('hidden');
            var d = res.data.data;
            if (d.sandbox) {
              dataEl.innerHTML = '<div class="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm"><i class="fas fa-info-circle mr-1"></i>' + d.note + '</div>';
              return;
            }
            if (!d.items || d.items.length === 0) {
              dataEl.innerHTML = '<p class="text-gray-500 text-sm">結果なし (' + d.total + '件)</p>';
              return;
            }
            dataEl.innerHTML = '<p class="text-sm text-gray-500 mb-2">合計 ' + d.total + '件</p>' +
              d.items.map(function(item) {
                var img = item.image ? '<img src="' + item.image + '" class="w-12 h-12 rounded object-cover">' : '<div class="w-12 h-12 bg-gray-200 rounded"></div>';
                var price = item.price ? '$' + item.price.value : '-';
                return '<div class="flex items-center gap-3 p-2 border-b border-gray-100">' + img + '<div class="flex-1 min-w-0"><p class="text-sm font-medium truncate">' + item.title + '</p><p class="text-xs text-gray-500">' + price + ' | ' + (item.condition || '-') + '</p></div>' + (item.itemWebUrl ? '<a href="' + item.itemWebUrl + '" target="_blank" class="text-blue-500 text-xs"><i class="fas fa-external-link-alt"></i></a>' : '') + '</div>';
              }).join('');
          })
          .catch(function(err) {
            loading.classList.add('hidden');
            dataEl.innerHTML = '<p class="text-red-500 text-sm"><i class="fas fa-exclamation-triangle mr-1"></i>' + (err.response?.data?.error || 'エラーが発生しました') + '</p>';
          });
      }

      // 価格調査テスト
      function testPriceResearch() {
        var q = document.getElementById('price-query').value.trim();
        if (!q) return alert('キーワードを入力してください');
        var cond = document.getElementById('price-condition').value;
        
        var result = document.getElementById('price-result');
        var loading = document.getElementById('price-loading');
        var dataEl = document.getElementById('price-data');
        result.classList.remove('hidden');
        loading.classList.remove('hidden');
        dataEl.innerHTML = '';

        var url = '/api/ebay/price-research?q=' + encodeURIComponent(q);
        if (cond) url += '&condition=' + cond;

        axios.get(url)
          .then(function(res) {
            loading.classList.add('hidden');
            var d = res.data.data;
            if (d.sandbox) {
              dataEl.innerHTML = '<div class="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm"><i class="fas fa-info-circle mr-1"></i>' + d.message + '</div>';
              return;
            }
            if (!d.priceAnalysis) {
              dataEl.innerHTML = '<p class="text-gray-500 text-sm">' + (d.message || '結果なし') + '</p>';
              return;
            }
            var pa = d.priceAnalysis;
            var fmt = function(v) { return '$' + Number(v).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); };
            dataEl.innerHTML = '<div class="grid grid-cols-2 md:grid-cols-5 gap-3">' +
              '<div class="bg-green-50 rounded-lg p-3 text-center"><p class="text-xs text-gray-500">最安値</p><p class="text-lg font-bold text-green-600">' + fmt(pa.min) + '</p></div>' +
              '<div class="bg-blue-50 rounded-lg p-3 text-center"><p class="text-xs text-gray-500">平均</p><p class="text-lg font-bold text-blue-600">' + fmt(pa.average) + '</p></div>' +
              '<div class="bg-gray-50 rounded-lg p-3 text-center"><p class="text-xs text-gray-500">中央値</p><p class="text-lg font-bold text-gray-900">' + fmt(pa.median) + '</p></div>' +
              '<div class="bg-orange-50 rounded-lg p-3 text-center"><p class="text-xs text-gray-500">最高値</p><p class="text-lg font-bold text-orange-600">' + fmt(pa.max) + '</p></div>' +
              '<div class="bg-purple-50 rounded-lg p-3 text-center"><p class="text-xs text-gray-500">サンプル数</p><p class="text-lg font-bold text-purple-600">' + pa.sampleSize + '/' + pa.totalListings + '</p></div>' +
              '</div>';
            if (d.sampleItems && d.sampleItems.length > 0) {
              dataEl.innerHTML += '<p class="text-sm text-gray-500 mt-4 mb-2">サンプル商品</p>' +
                d.sampleItems.map(function(item) {
                  var img = item.image ? '<img src="' + item.image + '" class="w-10 h-10 rounded object-cover">' : '';
                  return '<div class="flex items-center gap-3 p-2 border-b border-gray-100">' + img + '<div class="flex-1"><p class="text-xs truncate">' + item.title + '</p><p class="text-xs text-gray-500">' + (item.price ? '$' + item.price.value : '-') + ' | ' + (item.condition || '-') + '</p></div></div>';
                }).join('');
            }
          })
          .catch(function(err) {
            loading.classList.add('hidden');
            dataEl.innerHTML = '<p class="text-red-500 text-sm"><i class="fas fa-exclamation-triangle mr-1"></i>' + (err.response?.data?.error || 'エラーが発生しました') + '</p>';
          });
      }

      document.getElementById('test-query').addEventListener('keydown', function(e) { if (e.key === 'Enter') testSearch(); });
      document.getElementById('price-query').addEventListener('keydown', function(e) { if (e.key === 'Enter') testPriceResearch(); });
    </script>
  `;
  return c.html(AdminLayout('ebay', 'eBay API連携', content));
});

// =============================================
// 問い合わせ管理画面
// =============================================
adminPagesRoutes.get('/inquiries', (c) => {
  const content = `
    <style>
      .inq-badge { display:inline-block; padding:2px 10px; border-radius:9999px; font-size:12px; font-weight:600; }
      .inq-new { background:#fef2f2; color:#dc2626; }
      .inq-in_progress { background:#fffbeb; color:#d97706; }
      .inq-resolved { background:#f0fdf4; color:#16a34a; }
      .inq-closed { background:#f3f4f6; color:#6b7280; }
      .type-badge { display:inline-block; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:500; background:#eff6ff; color:#2563eb; }
    </style>

    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-envelope mr-2 text-purple-500"></i>問い合わせ管理</h2>
        <p class="text-sm text-gray-500 mt-1">サイト全体のお問い合わせを一元管理</p>
      </div>
      <div class="flex items-center gap-2">
        <span id="new-badge" class="hidden bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full"></span>
      </div>
    </div>

    <!-- フィルター -->
    <div class="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
      <select id="filter-source" onchange="loadInquiries()" class="px-3 py-2 border rounded-lg text-sm">
        <option value="">全送信元</option>
        <option value="contact">📩 お問い合わせフォーム</option>
        <option value="franchise">🤝 パートナー資料請求</option>
      </select>
      <select id="filter-status" onchange="loadInquiries()" class="px-3 py-2 border rounded-lg text-sm">
        <option value="">全ステータス</option>
        <option value="new">🔴 新規</option>
        <option value="in_progress">🟡 対応中</option>
        <option value="contacted">📞 連絡済み</option>
        <option value="resolved">🟢 解決済み</option>
        <option value="closed">⚫ 完了</option>
      </select>
      <select id="filter-type" onchange="loadInquiries()" class="px-3 py-2 border rounded-lg text-sm">
        <option value="">全種別</option>
        <option value="general">一般</option>
        <option value="franchise">パートナー資料請求</option>
        <option value="proxy_onsite">代理出品（出張）</option>
        <option value="proxy_shipping">代理出品（郵送）</option>
        <option value="technical">技術的な問題</option>
        <option value="payment">決済</option>
        <option value="product_question">商品質問</option>
        <option value="other">その他</option>
      </select>
    </div>

    <!-- 一覧 -->
    <div id="inquiries-list" class="space-y-3">
      <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="mt-2">読み込み中...</p></div>
    </div>

    <!-- ページネーション -->
    <div id="pagination" class="flex justify-center mt-6 gap-2 hidden"></div>

    <!-- 詳細モーダル -->
    <div id="detail-modal" class="fixed inset-0 bg-black/50 z-[100] hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 class="text-lg font-bold"><i class="fas fa-envelope-open-text mr-2 text-purple-500"></i>問い合わせ詳細</h3>
          <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div id="detail-content" class="p-6"></div>
      </div>
    </div>

    <script>
      var currentPage = 1;

      function escHtml(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
      }

      var typeLabels = {
        general: '一般', franchise: 'パートナー資料請求', proxy_onsite: '代理出品（出張）', proxy_shipping: '代理出品（郵送）',
        technical: '技術的な問題', payment: '決済', product_question: '商品質問', other: 'その他'
      };
      var statusLabels = { new: '🔴 新規', in_progress: '🟡 対応中', contacted: '📞 連絡済み', resolved: '🟢 解決済み', closed: '⚫ 完了' };
      var sourceLabels = { contact: '📩 フォーム', franchise: '🤝 パートナー' };

      async function loadInquiries(page) {
        currentPage = page || 1;
        var source = document.getElementById('filter-source').value;
        var status = document.getElementById('filter-status').value;
        var type = document.getElementById('filter-type').value;
        var params = 'page=' + currentPage;
        if (source) params += '&source=' + source;
        if (status) params += '&status=' + status;
        if (type) params += '&type=' + type;

        try {
          var res = await axios.get('/api/admin/inquiries?' + params, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') },
            timeout: 15000
          });
          var data = res.data;
          var container = document.getElementById('inquiries-list');

          // 新着バッジ
          var badge = document.getElementById('new-badge');
          if (data.new_count > 0) {
            badge.textContent = data.new_count + '件の新着';
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }

          if (!data.inquiries || data.inquiries.length === 0) {
            container.innerHTML = '<div class="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>問い合わせはまだありません</p></div>';
            document.getElementById('pagination').classList.add('hidden');
            return;
          }

          var html = '';
          data.inquiries.forEach(function(inq) {
            var dateStr = new Date(inq.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
            var srcStyle = inq.source==='franchise' ? 'background:#fef3c7;color:#92400e' : 'background:#dbeafe;color:#1e40af';
            html += '<div class="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer" data-inq-id="' + inq.id + '" data-inq-source="' + escHtml(inq.source) + '">';
            html += '  <div class="flex items-start justify-between">';
            html += '    <div class="flex-1 min-w-0">';
            html += '      <div class="flex items-center gap-2 mb-1">';
            html += '        <span class="inq-badge inq-' + escHtml(inq.status) + '">' + (statusLabels[inq.status] || inq.status) + '</span>';
            html += '        <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:500;' + srcStyle + '">' + (sourceLabels[inq.source] || inq.source) + '</span>';
            html += '        <span class="type-badge">' + (typeLabels[inq.inquiry_type] || inq.inquiry_type) + '</span>';
            html += '      </div>';
            html += '      <h4 class="font-bold text-gray-900 truncate">' + escHtml(inq.subject) + '</h4>';
            html += '      <p class="text-sm text-gray-500 mt-1 truncate">' + escHtml(inq.message) + '</p>';
            html += '      <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">';
            html += '        <span><i class="fas fa-user mr-1"></i>' + escHtml(inq.name) + '</span>';
            html += '        <span><i class="fas fa-envelope mr-1"></i>' + escHtml(inq.email) + '</span>';
            html += '        <span><i class="fas fa-clock mr-1"></i>' + dateStr + '</span>';
            html += '      </div>';
            html += '    </div>';
            html += '    <i class="fas fa-chevron-right text-gray-300 ml-3 mt-2"></i>';
            html += '  </div>';
            html += '</div>';
          });
          container.innerHTML = html;

          // カードクリックイベント委譲
          container.querySelectorAll('[data-inq-id]').forEach(function(card) {
            card.addEventListener('click', function() {
              openDetail(card.getAttribute('data-inq-id'), card.getAttribute('data-inq-source'));
            });
          });

          // ページネーション
          if (data.pages > 1) {
            var pagHtml = '';
            for (var i = 1; i <= data.pages; i++) {
              pagHtml += '<button onclick="loadInquiries(' + i + ')" class="px-3 py-1 rounded ' + (i === currentPage ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') + '">' + i + '</button>';
            }
            document.getElementById('pagination').innerHTML = pagHtml;
            document.getElementById('pagination').classList.remove('hidden');
          } else {
            document.getElementById('pagination').classList.add('hidden');
          }
        } catch(e) {
          document.getElementById('inquiries-list').innerHTML = '<div class="bg-white rounded-xl shadow-sm p-8 text-center text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2"></i><p>読み込みに失敗しました</p></div>';
        }
      }

      async function openDetail(id, source) {
        source = source || 'contact';
        try {
          var res = await axios.get('/api/admin/inquiries/' + id + '?source=' + source, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
          });
          var inq = res.data.inquiry;
          var dateStr = new Date(inq.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
          var repliedStr = inq.replied_at ? new Date(inq.replied_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';

          var html = '';
          html += '<div class="space-y-4">';
          html += '  <div class="flex items-center gap-2">';
          html += '    <span class="inq-badge inq-' + escHtml(inq.status) + '">' + (statusLabels[inq.status] || inq.status) + '</span>';
          html += '    <span class="type-badge">' + (typeLabels[inq.inquiry_type] || inq.inquiry_type) + '</span>';
          html += '  </div>';

          html += '  <div class="bg-gray-50 rounded-lg p-4 space-y-2">';
          html += '    <div class="grid grid-cols-2 gap-2 text-sm">';
          html += '      <div><span class="text-gray-500">名前:</span> <strong>' + escHtml(inq.name) + '</strong></div>';
          html += '      <div><span class="text-gray-500">メール:</span> <a href="mailto:' + escHtml(inq.email) + '" class="text-blue-600 hover:underline">' + escHtml(inq.email) + '</a></div>';
          html += '      <div><span class="text-gray-500">電話:</span> ' + (inq.phone ? escHtml(inq.phone) : '<span class=text-gray-300>未入力</span>') + '</div>';
          html += '      <div><span class="text-gray-500">受信日:</span> ' + dateStr + '</div>';
          if (repliedStr) html += '      <div><span class="text-gray-500">対応日:</span> ' + repliedStr + '</div>';
          if (inq.product_id) html += '      <div><span class="text-gray-500">関連商品:</span> <a href="/admin/products/' + inq.product_id + '" class="text-blue-600">#' + inq.product_id + '</a></div>';
          html += '    </div>';
          if (source === 'franchise') {
            var occLabels = { mechanic: '整備士', dealer: '中古車販売', parts: 'パーツ販売', transport: '運送業', other: 'その他' };
            html += '    <div class="grid grid-cols-2 gap-2 text-sm mt-2 pt-2 border-t border-gray-200">';
            if (inq.area_pref) html += '      <div><span class="text-gray-500">希望エリア:</span> ' + escHtml(inq.area_pref) + '</div>';
            if (inq.occupation) html += '      <div><span class="text-gray-500">職業:</span> ' + (occLabels[inq.occupation] || escHtml(inq.occupation)) + '</div>';
            if (inq.experience) html += '      <div class="col-span-2"><span class="text-gray-500">経験:</span> ' + escHtml(inq.experience) + '</div>';
            html += '    </div>';
          }
          html += '  </div>';

          html += '  <div>';
          html += '    <h4 class="font-bold text-gray-800 mb-2">' + escHtml(inq.subject) + '</h4>';
          html += '    <div class="bg-white border rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">' + escHtml(inq.message) + '</div>';
          html += '  </div>';

          // ステータス変更
          html += '  <div class="border-t pt-4">';
          html += '    <label class="block text-sm font-medium text-gray-700 mb-2">ステータス変更</label>';
          html += '    <div class="flex gap-2 flex-wrap">';
          ['new', 'in_progress', 'contacted', 'resolved', 'closed'].forEach(function(s) {
            var active = inq.status === s ? 'ring-2 ring-offset-2 ring-purple-500' : 'opacity-70 hover:opacity-100';
            html += '<button data-action="status" data-id="' + inq.id + '" data-status="' + s + '" data-source="' + source + '" class="inq-badge inq-' + s + ' cursor-pointer ' + active + ' px-4 py-2">' + statusLabels[s] + '</button>';
          });
          html += '    </div>';
          html += '  </div>';

          // 管理メモ
          html += '  <div>';
          html += '    <label class="block text-sm font-medium text-gray-700 mb-2">管理メモ</label>';
          html += '    <textarea id="admin-note" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm">' + escHtml(inq.admin_note || '') + '</textarea>';
          html += '    <button data-action="save-note" data-id="' + inq.id + '" data-source="' + source + '" class="mt-2 px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"><i class="fas fa-save mr-1"></i>メモ保存</button>';
          html += '  </div>';

          // 削除
          html += '  <div class="border-t pt-4 flex justify-between">';
          html += '    <a href="mailto:' + escHtml(inq.email) + '?subject=Re: ' + encodeURIComponent(inq.subject) + '" class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"><i class="fas fa-reply mr-1"></i>メールで返信</a>';
          html += '    <button data-action="delete" data-id="' + inq.id + '" data-source="' + source + '" class="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200"><i class="fas fa-trash mr-1"></i>削除</button>';
          html += '  </div>';
          html += '</div>';

          var detailEl = document.getElementById('detail-content');
          detailEl.innerHTML = html;

          // data-action イベント委譲
          detailEl.querySelectorAll('[data-action]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var action = btn.getAttribute('data-action');
              var aid = btn.getAttribute('data-id');
              var asrc = btn.getAttribute('data-source');
              if (action === 'status') updateStatus(aid, btn.getAttribute('data-status'), asrc);
              else if (action === 'save-note') saveNote(aid, asrc);
              else if (action === 'delete') deleteInquiry(aid, asrc);
            });
          });

          document.getElementById('detail-modal').classList.remove('hidden');
        } catch(e) {
          alert('詳細の読み込みに失敗しました');
        }
      }

      function closeModal() {
        document.getElementById('detail-modal').classList.add('hidden');
      }

      async function updateStatus(id, newStatus, source) {
        source = source || 'contact';
        try {
          await axios.put('/api/admin/inquiries/' + id + '/status', { status: newStatus, source: source }, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
          });
          closeModal();
          loadInquiries(currentPage);
        } catch(e) {
          alert('更新に失敗しました');
        }
      }

      async function saveNote(id, source) {
        source = source || 'contact';
        try {
          var note = document.getElementById('admin-note').value;
          await axios.put('/api/admin/inquiries/' + id + '/status', {
            status: 'in_progress',
            admin_note: note,
            source: source
          }, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
          });
          alert('メモを保存しました');
        } catch(e) {
          alert('保存に失敗しました');
        }
      }

      async function deleteInquiry(id, source) {
        source = source || 'contact';
        if (!confirm('この問い合わせを削除しますか？')) return;
        try {
          await axios.delete('/api/admin/inquiries/' + id + '?source=' + source, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
          });
          closeModal();
          loadInquiries(currentPage);
        } catch(e) {
          alert('削除に失敗しました');
        }
      }

      // 初期読み込み
      loadInquiries();
    </script>
  `;
  return c.html(AdminLayout('inquiries', '問い合わせ管理', content));
});

export default adminPagesRoutes
