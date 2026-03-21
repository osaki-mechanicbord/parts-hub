import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'

// ルートのインポート
import apiRoutes from './routes/api'
import fitmentRoutes from './routes/fitment'
import externalRoutes from './routes/external'
import productsRoutes from './routes/products'
import authRoutes from './routes/auth'

const app = new Hono<{ Bindings: Bindings }>()

// ミドルウェア
app.use(logger())
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

// APIルート
app.route('/api', apiRoutes)
app.route('/api/fitment', fitmentRoutes)
app.route('/api/external', externalRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/auth', authRoutes)

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>パーツマーケット - 自動車パーツ売買プラットフォーム</title>
        <meta name="description" content="整備工場専門の純正パーツ・工具売買マーケットプレイス。メルカリのように手軽に部品を売買できます。">
        
        <!-- PWA対応 -->
        <meta name="theme-color" content="#2563eb">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="パーツマーケット">
        <link rel="manifest" href="/manifest.json">
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        
        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg">
        
        <!-- スタイル -->
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <style>
            /* PWA用追加スタイル */
            @media (display-mode: standalone) {
                body {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                }
            }
            
            /* インストールバナー */
            .install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to right, #2563eb, #1e40af);
                color: white;
                padding: 16px;
                display: none;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
            }
            
            .install-banner.show {
                display: flex;
            }
        </style>
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

// 出品ページ
app.get('/listing', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>商品を出品 - パーツマーケット</title>
        <meta name="theme-color" content="#2563eb">
        <link rel="manifest" href="/manifest.json">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-3 flex items-center">
                <button onclick="history.back()" class="mr-4">
                    <i class="fas fa-times text-xl"></i>
                </button>
                <h1 class="text-lg font-bold flex-1">商品を出品</h1>
            </div>
        </header>

        <!-- メインコンテンツ -->
        <main class="max-w-4xl mx-auto px-4 py-6 mb-20">
            <form id="listing-form" class="space-y-6">
                <!-- 画像アップロード -->
                <section class="bg-white rounded-lg p-6 shadow-sm">
                    <h2 class="text-lg font-bold mb-4">
                        <i class="fas fa-camera text-blue-600 mr-2"></i>
                        商品画像（必須）
                    </h2>
                    <p class="text-sm text-gray-600 mb-4">最大10枚まで、1枚目がメイン画像になります</p>
                    
                    <!-- カメラ・ギャラリーボタン -->
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <button type="button" 
                                onclick="productForm.openCamera()"
                                class="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-camera mr-2"></i>
                            カメラで撮影
                        </button>
                        <button type="button" 
                                onclick="productForm.openGallery()"
                                class="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            <i class="fas fa-images mr-2"></i>
                            ギャラリーから選択
                        </button>
                    </div>
                    
                    <div id="drop-zone" 
                         class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                         onclick="productForm.openGallery()">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                        <p class="text-gray-600">タップして画像を選択</p>
                        <p class="text-sm text-gray-400 mt-2">またはドラッグ&ドロップ</p>
                        <input type="file" id="image-input" accept="image/*" multiple class="hidden">
                    </div>
                    
                    <div id="image-previews" class="grid grid-cols-3 gap-3 mt-4"></div>
                </section>

                <!-- 基本情報 -->
                <section class="bg-white rounded-lg p-6 shadow-sm">
                    <h2 class="text-lg font-bold mb-4">
                        <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                        基本情報
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">商品名 *</label>
                            <input type="text" id="product-title" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="例: トヨタ プリウス 30系 フロントドア 左側 純正"
                                   required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">商品説明 *</label>
                            <textarea id="product-description" rows="5"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="商品の状態、特徴、注意事項などを詳しく記載してください"
                                      required></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">価格 *</label>
                            <div class="relative">
                                <input type="number" id="product-price" min="1"
                                       class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="10000"
                                       required>
                                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">円</span>
                            </div>
                            <p class="text-sm text-gray-500 mt-2">手数料5%が販売時に差し引かれます</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">カテゴリ *</label>
                                <select id="category-select" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required>
                                    <option value="">選択してください</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">サブカテゴリ</label>
                                <select id="subcategory-select"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">選択してください</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">商品の状態 *</label>
                            <select id="condition-select"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required>
                                <option value="">選択してください</option>
                                <option value="new">新品・未使用</option>
                                <option value="like_new">未使用に近い</option>
                                <option value="good">目立った傷や汚れなし</option>
                                <option value="acceptable">やや傷や汚れあり</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">在庫数 *</label>
                            <input type="number" id="stock-quantity" min="1" value="1"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   required>
                        </div>
                    </div>
                </section>

                <!-- 車両適合情報 -->
                <section class="bg-white rounded-lg p-6 shadow-sm">
                    <h2 class="text-lg font-bold mb-4">
                        <i class="fas fa-car text-blue-600 mr-2"></i>
                        車両適合情報
                    </h2>
                    
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">メーカー</label>
                                <select id="maker-select"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">選択してください</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">車種</label>
                                <select id="model-select"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">選択してください</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">純正品番</label>
                            <input type="text" id="part-number"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="例: 67002-47130">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">OEM品番</label>
                            <input type="text" id="oem-part-number"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="例: 67002-47130">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">年式（開始）</label>
                                <input type="number" id="year-from" min="1900" max="2030"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="2009">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">年式（終了）</label>
                                <input type="number" id="year-to" min="1900" max="2030"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="2015">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">型式</label>
                                <input type="text" id="model-code"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="例: ZVW30">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">グレード</label>
                                <input type="text" id="grade"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="例: S, G, L">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">エンジン型式</label>
                                <input type="text" id="engine-type"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="例: 2ZR-FXE">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">駆動方式</label>
                                <select id="drive-type"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">選択してください</option>
                                    <option value="FF">FF</option>
                                    <option value="FR">FR</option>
                                    <option value="4WD">4WD</option>
                                    <option value="MR">MR</option>
                                    <option value="RR">RR</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">変速機</label>
                            <select id="transmission-type"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">選択してください</option>
                                <option value="MT">MT</option>
                                <option value="AT">AT</option>
                                <option value="CVT">CVT</option>
                                <option value="DCT">DCT</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">適合車種（自由記入）</label>
                            <textarea id="compatible-models" rows="3"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="例: プリウス 30系 2009-2015年式全グレード対応"></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">確認方法</label>
                            <select id="verification-method"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="part_number">品番照合</option>
                                <option value="actual_vehicle">実車確認済み</option>
                                <option value="catalog">カタログ確認</option>
                                <option value="manual">整備書確認</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">適合に関する注意事項</label>
                            <textarea id="fitment-notes" rows="3"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="取り付けに関する注意事項や、特定グレードでの制限事項などがあれば記載してください"></textarea>
                        </div>
                    </div>
                </section>

                <!-- 出品代行オプション -->
                <section class="bg-white rounded-lg p-6 shadow-sm">
                    <div class="flex items-start">
                        <input type="checkbox" id="is-proxy" class="mt-1 mr-3">
                        <div>
                            <label for="is-proxy" class="font-medium text-gray-900 cursor-pointer">出品代行を依頼する</label>
                            <p class="text-sm text-gray-600 mt-1">
                                弊社が撮影・出品作業を代行します（手数料: 販売価格の1.5%追加）
                            </p>
                        </div>
                    </div>
                </section>

                <!-- 出品ボタン -->
                <button type="button" id="submit-btn"
                        onclick="productForm.submitForm()"
                        class="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg">
                    <i class="fas fa-check mr-2"></i>出品する
                </button>
            </form>
        </main>

        <!-- スクリプト -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/listing.js"></script>
    </body>
    </html>
  `)
})

export default app

