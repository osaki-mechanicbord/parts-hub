// 商品管理ページ、取引管理ページ、その他の管理ページのルート

import { Hono } from 'hono'
import { AdminLayout } from '../admin-layout'

const adminPagesRoutes = new Hono()

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
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">手数料（7%）</th>
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
                const fee = Math.floor(t.amount * 0.07);
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

export default adminPagesRoutes
