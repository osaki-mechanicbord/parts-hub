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
            <canvas id="sales-chart" height="250"></canvas>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">新規ユーザー推移</h3>
            <canvas id="users-chart" height="250"></canvas>
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
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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
                alert('データの読み込みに失敗しました。');
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
                
                const response = await fetch('/api/admin/users?' + params);
                const data = await response.json();
                
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
                        <button onclick="viewUser(\${user.id})" class="text-blue-500 hover:underline mr-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="toggleUserStatus(\${user.id}, '\${user.status}')" 
                                class="text-\${user.status === 'active' ? 'yellow' : 'green'}-500 hover:underline">
                            <i class="fas fa-\${user.status === 'active' ? 'pause' : 'play'}"></i>
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
                const response = await fetch(\`/api/admin/users/\${id}/status\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                
                if (response.ok) {
                    alert(\`ユーザーを\${action}しました\`);
                    loadUsers(currentPage);
                } else {
                    throw new Error('Status update failed');
                }
            } catch (error) {
                console.error('ステータス更新エラー:', error);
                alert('ステータスの更新に失敗しました');
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
                    <td class="px-6 py-4 text-sm text-gray-900">¥\${p.price.toLocaleString()}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${p.seller_name}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs rounded \${
                            p.status === 'active' ? 'bg-green-100 text-green-700' :
                            p.status === 'sold' ? 'bg-gray-100 text-gray-700' :
                            p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }">
                            \${p.status === 'active' ? '出品中' : p.status === 'sold' ? '売却済み' : p.status === 'pending' ? '承認待ち' : '停止中'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${p.favorites_count || 0}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${p.comments_count || 0}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${new Date(p.created_at).toLocaleDateString('ja-JP')}</td>
                    <td class="px-6 py-4 text-sm">
                        <a href="/products/\${p.id}" target="_blank" class="text-blue-600 hover:text-blue-800 mr-3" title="表示">
                            <i class="fas fa-eye"></i>
                        </a>
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
        // Wait for axios to load
        function initArticlePage() {
            if (typeof axios === 'undefined') {
                // Axios not loaded yet, wait and try again
                setTimeout(initArticlePage, 100);
                return;
            }

            let currentPage = 1;
            let currentStatus = '';

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

        document.getElementById('status-filter').addEventListener('change', (e) => {
            currentStatus = e.target.value;
            loadArticles(1);
        });

        loadArticles(1);
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

export default adminPagesRoutes
