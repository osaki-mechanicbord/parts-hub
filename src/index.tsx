import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'

// ルートのインポート
import apiRoutes from './routes/api'
import fitmentRoutes from './routes/fitment'

const app = new Hono<{ Bindings: Bindings }>()

// ミドルウェア
app.use(logger())
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

// APIルート
app.route('/api', apiRoutes)
app.route('/api/fitment', fitmentRoutes)

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>自動車パーツ売買プラットフォーム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- ヘッダー -->
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <h1 class="text-2xl font-bold text-blue-600">
                            <i class="fas fa-car mr-2"></i>
                            パーツマーケット
                        </h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>出品する
                        </button>
                        <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            ログイン
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- 検索バー -->
        <div class="bg-white border-b">
            <div class="max-w-7xl mx-auto px-4 py-6">
                <div class="flex gap-2">
                    <input type="text" id="search" placeholder="商品名、メーカー、品番で検索" 
                           class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <button class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-search mr-2"></i>検索
                    </button>
                </div>
            </div>
        </div>

        <!-- カテゴリ -->
        <div class="bg-white border-b">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div id="categories" class="flex gap-4 overflow-x-auto">
                    <div class="text-center min-w-[100px] cursor-pointer hover:bg-gray-50 p-3 rounded-lg">
                        <div class="text-3xl mb-2">🔧</div>
                        <div class="text-sm">エンジン</div>
                    </div>
                    <div class="text-center min-w-[100px] cursor-pointer hover:bg-gray-50 p-3 rounded-lg">
                        <div class="text-3xl mb-2">🚗</div>
                        <div class="text-sm">ボディ</div>
                    </div>
                    <div class="text-center min-w-[100px] cursor-pointer hover:bg-gray-50 p-3 rounded-lg">
                        <div class="text-3xl mb-2">⚡</div>
                        <div class="text-sm">電装</div>
                    </div>
                    <div class="text-center min-w-[100px] cursor-pointer hover:bg-gray-50 p-3 rounded-lg">
                        <div class="text-3xl mb-2">🛞</div>
                        <div class="text-sm">足回り</div>
                    </div>
                    <div class="text-center min-w-[100px] cursor-pointer hover:bg-gray-50 p-3 rounded-lg">
                        <div class="text-3xl mb-2">🔨</div>
                        <div class="text-sm">工具</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- メインコンテンツ -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <h2 class="text-2xl font-bold mb-6">新着商品</h2>
            <div id="products" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- 商品はJavaScriptで読み込み -->
                <div class="text-center py-12 col-span-full text-gray-500">
                    <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <p>商品を読み込み中...</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 商品一覧取得
            async function loadProducts() {
                try {
                    const response = await axios.get('/api/products?limit=8');
                    const products = response.data.items || [];
                    
                    const container = document.getElementById('products');
                    if (products.length === 0) {
                        container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">商品がありません</div>';
                        return;
                    }
                    
                    container.innerHTML = products.map(product => \`
                        <div class="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer">
                            <div class="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                                <i class="fas fa-image text-4xl text-gray-400"></i>
                            </div>
                            <div class="p-4">
                                <h3 class="font-semibold text-sm mb-2 line-clamp-2">\${product.title}</h3>
                                <div class="text-2xl font-bold text-blue-600 mb-2">
                                    ¥\${product.price.toLocaleString()}
                                </div>
                                <div class="flex items-center text-sm text-gray-600">
                                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                                    <span>4.5</span>
                                    <span class="mx-2">·</span>
                                    <span>\${product.view_count} 閲覧</span>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('商品読み込みエラー:', error);
                    document.getElementById('products').innerHTML = 
                        '<div class="col-span-full text-center py-12 text-red-500">商品の読み込みに失敗しました</div>';
                }
            }

            // カテゴリ一覧取得
            async function loadCategories() {
                try {
                    const response = await axios.get('/api/categories');
                    // カテゴリ表示処理（後で実装）
                } catch (error) {
                    console.error('カテゴリ読み込みエラー:', error);
                }
            }

            // ページ読み込み時に実行
            window.addEventListener('DOMContentLoaded', () => {
                loadProducts();
                loadCategories();
            });
        </script>
    </body>
    </html>
  `)
})

export default app

