// 管理画面共通レイアウト

export const AdminHeader = (currentPage: string) => `
<header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-4">
            <i class="fas fa-shield-alt text-red-500 text-2xl"></i>
            <h1 class="text-xl font-bold text-gray-800">PARTS HUB 管理画面</h1>
        </div>
        <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">管理者: 尾崎俊行</span>
            <a href="/" class="text-sm text-red-500 hover:underline">
                <i class="fas fa-home mr-1"></i>サイトへ
            </a>
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
        <a href="/admin/sales" class="flex items-center px-4 py-3 mb-2 ${currentPage === 'sales' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'} rounded-lg">
            <i class="fas fa-yen-sign w-5"></i>
            <span class="ml-3 ${currentPage === 'sales' ? 'font-medium' : ''}">売上レポート</span>
        </a>
    </nav>
</aside>
`;

export const AdminLayout = (currentPage: string, title: string, content: string) => `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - PARTS HUB 管理画面</title>
    <meta name="robots" content="noindex, nofollow">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    ${AdminHeader(currentPage)}
    <div class="flex">
        ${AdminSidebar(currentPage)}
        <main class="flex-1 p-8">
            ${content}
        </main>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</body>
</html>
`;
