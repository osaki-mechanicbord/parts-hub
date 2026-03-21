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
import commentsRoutes from './routes/comments'
import chatRoutes from './routes/chat'
import negotiationsRoutes from './routes/negotiations'
import favoritesRoutes from './routes/favorites'
import notificationsRoutes from './routes/notifications'
import mypageRoutes from './routes/mypage'

const app = new Hono<{ Bindings: Bindings }>()

// ミドルウェア
app.use(logger())
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/icons/*', serveStatic({ root: './public' }))
app.use('/manifest.json', serveStatic({ root: './public' }))
app.use('/sw.js', serveStatic({ root: './public' }))

// APIルート
app.route('/api', apiRoutes)
app.route('/api/fitment', fitmentRoutes)
app.route('/api/external', externalRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/comments', commentsRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/negotiations', negotiationsRoutes)
app.route('/api/favorites', favoritesRoutes)
app.route('/api/notifications', notificationsRoutes)
app.route('/api/mypage', mypageRoutes)

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>PARTS HUB（パーツハブ）- 自動車パーツ売買プラットフォーム</title>
        <meta name="description" content="整備工場専門の純正パーツ・工具売買マーケットプレイス。メルカリのように手軽に部品を売買できます。">
        
        <!-- PWA対応 -->
        <meta name="theme-color" content="#ff4757">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="PARTS HUB">
        <link rel="manifest" href="/manifest.json">
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        
        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/icons/logo.svg">
        
        <!-- スタイル -->
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <style>
            /* カスタムカラー */
            :root {
                --primary: #ff4757;
                --primary-dark: #ee3f4d;
                --secondary: #5f27cd;
                --success: #1dd1a1;
                --warning: #feca57;
                --danger: #ee5a6f;
            }
            
            /* グラデーション背景 */
            .gradient-bg {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .gradient-red {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            }
            
            /* カード hover エフェクト */
            .product-card {
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .product-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            }
            
            /* カテゴリボタン */
            .category-btn {
                transition: all 0.2s ease;
            }
            
            .category-btn:hover {
                transform: scale(1.05);
            }
            
            /* 検索バー */
            .search-input:focus {
                box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.1);
            }
            
            /* スクロールバー */
            .custom-scrollbar::-webkit-scrollbar {
                height: 6px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #ff4757;
                border-radius: 10px;
            }
            
            /* バッジ */
            .badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .badge-new {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
                color: white;
            }
            
            .badge-verified {
                background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%);
                color: white;
            }
            
            /* ローディングスピナー */
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #ff4757;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* ヒーローセクションのアニメーション */
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            
            .hero-float {
                animation: float 6s ease-in-out infinite;
            }
            
            /* PWA用追加スタイル */
            @media (display-mode: standalone) {
                body {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                }
            }
        </style>
        
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            primary: '#ff4757',
                            secondary: '#5f27cd',
                        }
                    }
                }
            }
        </script>
    </head>
    <body class="bg-gray-50">
        <!-- ヘッダー -->
        <header class="bg-white shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- ロゴ -->
                    <div class="flex items-center">
                        <a href="/" class="flex items-center space-x-3">
                            <div class="w-10 h-10 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
                                  <defs>
                                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" style="stop-color:#ff4757;stop-opacity:1" />
                                      <stop offset="100%" style="stop-color:#ff6b95;stop-opacity:1" />
                                    </linearGradient>
                                  </defs>
                                  <circle cx="50" cy="50" r="48" fill="url(#logoGrad)"/>
                                  <g fill="#ffffff">
                                    <rect x="47" y="5" width="6" height="15" rx="1"/>
                                    <rect x="47" y="80" width="6" height="15" rx="1"/>
                                    <rect x="5" y="47" width="15" height="6" rx="1"/>
                                    <rect x="80" y="47" width="15" height="6" rx="1"/>
                                    <rect x="72" y="18" width="15" height="6" rx="1" transform="rotate(45 79.5 21)"/>
                                    <rect x="13" y="18" width="15" height="6" rx="1" transform="rotate(-45 20.5 21)"/>
                                    <rect x="72" y="76" width="15" height="6" rx="1" transform="rotate(-45 79.5 79)"/>
                                    <rect x="13" y="76" width="15" height="6" rx="1" transform="rotate(45 20.5 79)"/>
                                  </g>
                                  <circle cx="50" cy="50" r="22" fill="#ffffff"/>
                                  <g stroke="#ff4757" stroke-width="2" fill="none">
                                    <line x1="50" y1="50" x2="50" y2="32"/>
                                    <line x1="50" y1="50" x2="50" y2="68"/>
                                    <line x1="50" y1="50" x2="32" y2="50"/>
                                    <line x1="50" y1="50" x2="68" y2="50"/>
                                  </g>
                                  <g fill="#ff4757">
                                    <circle cx="50" cy="32" r="3"/>
                                    <circle cx="50" cy="68" r="3"/>
                                    <circle cx="32" cy="50" r="3"/>
                                    <circle cx="68" cy="50" r="3"/>
                                  </g>
                                  <circle cx="50" cy="50" r="8" fill="#ff4757"/>
                                  <circle cx="50" cy="50" r="4" fill="#ffffff"/>
                                </svg>
                            </div>
                            <div class="hidden sm:block">
                                <div class="text-xl font-bold text-gray-900">PARTS HUB</div>
                                <div class="text-xs text-gray-500">パーツハブ</div>
                            </div>
                        </a>
                    </div>
                    
                    <!-- ナビゲーション -->
                    <nav class="hidden md:flex items-center space-x-6">
                        <a href="/" class="text-gray-700 hover:text-primary font-medium transition-colors">
                            <i class="fas fa-home mr-1"></i>ホーム
                        </a>
                        <a href="/search" class="text-gray-700 hover:text-primary font-medium transition-colors">
                            <i class="fas fa-search mr-1"></i>検索
                        </a>
                        <a href="/favorites" class="text-gray-700 hover:text-primary font-medium transition-colors">
                            <i class="far fa-heart mr-1"></i>お気に入り
                        </a>
                    </nav>
                    
                    <!-- アクションボタン -->
                    <div class="flex items-center space-x-3">
                        <button onclick="window.location.href='/listing'" 
                                class="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md">
                            <i class="fas fa-plus mr-1"></i>
                            <span class="hidden sm:inline">出品する</span>
                        </button>
                        <button onclick="window.location.href='/login'" 
                                class="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-primary hover:text-primary transition-all">
                            <i class="fas fa-user mr-1"></i>
                            <span class="hidden sm:inline">ログイン</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Hero セクション -->
        <section class="relative py-20 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900">
            <!-- パターンオーバーレイ -->
            <div class="absolute inset-0 z-0 opacity-10">
                <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="gear-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="2"/>
                            <line x1="50" y1="30" x2="50" y2="10" stroke="white" stroke-width="2"/>
                            <line x1="50" y1="70" x2="50" y2="90" stroke="white" stroke-width="2"/>
                            <line x1="30" y1="50" x2="10" y2="50" stroke="white" stroke-width="2"/>
                            <line x1="70" y1="50" x2="90" y2="50" stroke="white" stroke-width="2"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gear-pattern)" />
                </svg>
            </div>
            
            <!-- コンテンツ -->
            <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center text-white">
                    <div class="flex items-center justify-center mb-6">
                        <div class="w-20 h-20 mr-4 flex-shrink-0 drop-shadow-2xl hero-float">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
                              <defs>
                                <linearGradient id="heroLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                                  <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.9" />
                                </linearGradient>
                              </defs>
                              <circle cx="50" cy="50" r="48" fill="none" stroke="url(#heroLogoGrad)" stroke-width="2"/>
                              <g fill="url(#heroLogoGrad)">
                                <rect x="47" y="5" width="6" height="15" rx="1"/>
                                <rect x="47" y="80" width="6" height="15" rx="1"/>
                                <rect x="5" y="47" width="15" height="6" rx="1"/>
                                <rect x="80" y="47" width="15" height="6" rx="1"/>
                                <rect x="72" y="18" width="15" height="6" rx="1" transform="rotate(45 79.5 21)"/>
                                <rect x="13" y="18" width="15" height="6" rx="1" transform="rotate(-45 20.5 21)"/>
                                <rect x="72" y="76" width="15" height="6" rx="1" transform="rotate(-45 79.5 79)"/>
                                <rect x="13" y="76" width="15" height="6" rx="1" transform="rotate(45 20.5 79)"/>
                              </g>
                              <circle cx="50" cy="50" r="22" fill="url(#heroLogoGrad)"/>
                              <g stroke="rgba(255,255,255,0.5)" stroke-width="2" fill="none">
                                <line x1="50" y1="50" x2="50" y2="32"/>
                                <line x1="50" y1="50" x2="50" y2="68"/>
                                <line x1="50" y1="50" x2="32" y2="50"/>
                                <line x1="50" y1="50" x2="68" y2="50"/>
                              </g>
                              <g fill="rgba(255,255,255,0.8)">
                                <circle cx="50" cy="32" r="3"/>
                                <circle cx="50" cy="68" r="3"/>
                                <circle cx="32" cy="50" r="3"/>
                                <circle cx="68" cy="50" r="3"/>
                              </g>
                              <circle cx="50" cy="50" r="8" fill="rgba(255,255,255,0.3)"/>
                            </svg>
                        </div>
                        <h1 class="text-4xl sm:text-5xl font-bold drop-shadow-lg">
                            PARTS HUB
                        </h1>
                    </div>
                    <p class="text-2xl mb-3 font-semibold drop-shadow-lg">自動車パーツの売買がもっと簡単に</p>
                    <p class="text-lg text-white/95 mb-10 max-w-3xl mx-auto drop-shadow-md">
                        整備工場専門のパーツマーケットプレイス。純正部品から工具まで、手軽に売買できます。
                    </p>
                    
                    <!-- 検索バー -->
                    <div class="max-w-3xl mx-auto">
                        <div class="flex gap-3">
                            <div class="flex-1 relative">
                                <i class="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                                <input type="text" id="search-input" 
                                       placeholder="商品名、メーカー、品番で検索..." 
                                       class="search-input w-full pl-14 pr-4 py-4 rounded-xl border-0 text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl">
                            </div>
                            <button onclick="performSearch()" 
                                    class="px-10 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-2xl hover:shadow-red-500/50 text-lg">
                                <i class="fas fa-search mr-2"></i>検索
                            </button>
                        </div>
                        
                        <!-- 人気キーワード -->
                        <div class="mt-6 flex flex-wrap gap-3 justify-center">
                            <span class="text-sm text-white/90 font-medium">人気:</span>
                            <button onclick="searchKeyword('トヨタ')" class="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">トヨタ</button>
                            <button onclick="searchKeyword('エンジン')" class="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">エンジン</button>
                            <button onclick="searchKeyword('ドア')" class="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">ドア</button>
                            <button onclick="searchKeyword('ライト')" class="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">ライト</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- カテゴリセクション -->
        <section class="bg-white py-8 border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-th-large text-primary mr-2"></i>
                        カテゴリから探す
                    </h2>
                </div>
                
                <div id="categories" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
                    <!-- カテゴリはJSで動的に読み込み -->
                </div>
            </div>
        </section>

        <!-- 商品一覧セクション -->
        <section class="py-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <!-- タブ -->
                <div class="flex items-center space-x-4 mb-6 border-b">
                    <button class="tab-btn active px-4 py-3 font-semibold text-primary border-b-2 border-primary">
                        <i class="fas fa-clock mr-2"></i>新着商品
                    </button>
                    <button class="tab-btn px-4 py-3 font-semibold text-gray-600 hover:text-primary transition-colors">
                        <i class="fas fa-fire mr-2"></i>人気商品
                    </button>
                    <button class="tab-btn px-4 py-3 font-semibold text-gray-600 hover:text-primary transition-colors">
                        <i class="fas fa-tags mr-2"></i>お買い得
                    </button>
                </div>
                
                <!-- フィルター -->
                <div class="flex flex-wrap gap-3 mb-6">
                    <select id="maker-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="">すべてのメーカー</option>
                    </select>
                    <select id="condition-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="">すべての状態</option>
                        <option value="new">新品・未使用</option>
                        <option value="like_new">未使用に近い</option>
                        <option value="good">目立った傷や汚れなし</option>
                        <option value="acceptable">やや傷や汚れあり</option>
                    </select>
                    <select id="sort-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="created_desc">新着順</option>
                        <option value="price_asc">価格が安い順</option>
                        <option value="price_desc">価格が高い順</option>
                        <option value="popular">人気順</option>
                    </select>
                </div>
                
                <!-- 商品グリッド -->
                <div id="products-container" class="mb-8">
                    <div id="products" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        <!-- 商品カードはJSで動的に読み込み -->
                    </div>
                    
                    <!-- ローディング -->
                    <div id="loading" class="hidden flex justify-center items-center py-12">
                        <div class="spinner"></div>
                    </div>
                </div>
                
                <!-- もっと見るボタン -->
                <div class="text-center">
                    <button id="load-more" class="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-primary hover:text-primary transition-all">
                        もっと見る
                    </button>
                </div>
            </div>
        </section>

        <!-- ボトムナビゲーション（モバイル） -->
        <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div class="grid grid-cols-5 h-16">
                <a href="/" class="flex flex-col items-center justify-center text-primary">
                    <i class="fas fa-home text-xl mb-1"></i>
                    <span class="text-xs">ホーム</span>
                </a>
                <a href="/search" class="flex flex-col items-center justify-center text-gray-500">
                    <i class="fas fa-search text-xl mb-1"></i>
                    <span class="text-xs">検索</span>
                </a>
                <a href="/listing" class="flex flex-col items-center justify-center text-gray-500">
                    <div class="w-12 h-12 -mt-6 gradient-red rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-plus text-white text-xl"></i>
                    </div>
                    <span class="text-xs mt-1">出品</span>
                </a>
                <a href="/favorites" class="flex flex-col items-center justify-center text-gray-500">
                    <i class="far fa-heart text-xl mb-1"></i>
                    <span class="text-xs">お気に入り</span>
                </a>
                <a href="/mypage" class="flex flex-col items-center justify-center text-gray-500">
                    <i class="fas fa-user text-xl mb-1"></i>
                    <span class="text-xs">マイページ</span>
                </a>
            </div>
        </nav>

        <!-- スクリプト -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentPage = 1;
            let currentFilters = {};
            
            // 検索実行
            function performSearch() {
                const query = document.getElementById('search-input').value;
                if (query.trim()) {
                    currentFilters.query = query;
                    loadProducts();
                }
            }
            
            // キーワード検索
            function searchKeyword(keyword) {
                document.getElementById('search-input').value = keyword;
                performSearch();
            }
            
            // 商品読み込み
            async function loadProducts() {
                const container = document.getElementById('products');
                const loading = document.getElementById('loading');
                
                loading.classList.remove('hidden');
                
                try {
                    const params = new URLSearchParams({
                        page: currentPage,
                        limit: 20,
                        ...currentFilters
                    });
                    
                    const response = await axios.get(\`/api/products?\${params}\`);
                    const products = response.data.items || [];
                    
                    if (currentPage === 1) {
                        container.innerHTML = '';
                    }
                    
                    products.forEach(product => {
                        const card = createProductCard(product);
                        container.innerHTML += card;
                    });
                    
                } catch (error) {
                    console.error('商品読み込みエラー:', error);
                    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">商品の読み込みに失敗しました</div>';
                } finally {
                    loading.classList.add('hidden');
                }
            }
            
            // 商品カード生成（メルカリ風）
            function createProductCard(product) {
                const conditionLabels = {
                    'new': '新品',
                    'like_new': '未使用に近い',
                    'excellent': '非常に良い',
                    'good': '良い',
                    'acceptable': '可',
                    'junk': 'ジャンク品'
                };
                
                const conditionColors = {
                    'new': 'bg-blue-500',
                    'like_new': 'bg-green-500',
                    'excellent': 'bg-teal-500',
                    'good': 'bg-gray-500',
                    'acceptable': 'bg-orange-500',
                    'junk': 'bg-red-500'
                };
                
                // 適合車種表示
                let compatibilityInfo = '';
                if (product.maker_name) {
                    compatibilityInfo = product.maker_name;
                    if (product.model_name) {
                        compatibilityInfo += ' ' + product.model_name;
                    }
                } else if (product.compatibility_count > 0) {
                    compatibilityInfo = \`\${product.compatibility_count}車種対応\`;
                }
                
                return \`
                    <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1" 
                         onclick="window.location.href='/products/\${product.id}'">
                        <!-- 商品画像 -->
                        <div class="relative aspect-square bg-gray-100">
                            <img src="\${product.main_image || 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'}" 
                                 alt="\${product.title}" 
                                 class="w-full h-full object-cover"
                                 loading="lazy"
                                 onerror="this.src='https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'">
                            
                            <!-- 状態バッジ -->
                            <div class="absolute top-2 left-2">
                                <span class="px-2 py-1 \${conditionColors[product.condition] || 'bg-gray-500'} text-white text-xs font-bold rounded shadow-md">
                                    \${conditionLabels[product.condition] || product.condition}
                                </span>
                            </div>
                            
                            <!-- 適合確認バッジ（右上） -->
                            \${product.compatibility_count > 0 ? \`
                                <div class="absolute top-2 right-2">
                                    <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded shadow-md">
                                        <i class="fas fa-car text-primary mr-1"></i>適合
                                    </span>
                                </div>
                            \` : ''}
                        </div>
                        
                        <!-- 商品情報 -->
                        <div class="p-3">
                            <!-- 商品名 -->
                            <h3 class="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                                \${product.title}
                            </h3>
                            
                            <!-- メーカー・適合車種 -->
                            \${compatibilityInfo ? \`
                                <div class="flex items-center text-xs text-gray-600 mb-2">
                                    <i class="fas fa-car mr-1 text-gray-400"></i>
                                    <span class="truncate">\${compatibilityInfo}</span>
                                </div>
                            \` : ''}
                            
                            <!-- 価格 -->
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-baseline">
                                    <span class="text-xl font-bold text-gray-900">¥\${Number(product.price).toLocaleString()}</span>
                                    <span class="text-xs text-gray-500 ml-1">税込</span>
                                </div>
                            </div>
                            
                            <!-- 統計情報 -->
                            <div class="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <div class="flex items-center space-x-3">
                                    <span class="flex items-center">
                                        <i class="fas fa-eye mr-1"></i>\${product.view_count || 0}
                                    </span>
                                    <span class="flex items-center">
                                        <i class="far fa-heart mr-1"></i>\${product.favorite_count || 0}
                                    </span>
                                </div>
                                \${product.seller_name ? \`
                                    <span class="text-xs text-gray-400 truncate max-w-[100px]">
                                        \${product.seller_name}
                                    </span>
                                \` : ''}
                            </div>
                        </div>
                    </div>
                \`;
            }
            
            // カテゴリ読み込み
            async function loadCategories() {
                try {
                    const response = await axios.get('/api/categories');
                    const categories = response.data.data || [];
                    const container = document.getElementById('categories');
                    
                    const iconMap = {
                        'engine': 'cog',
                        'gear': 'gears',
                        'car': 'car',
                        'bolt': 'bolt',
                        'seat': 'chair',
                        'paint-brush': 'paint-brush',
                        'wheel': 'circle',
                        'wrench': 'wrench',
                        'oil-can': 'oil-can',
                        'box': 'box'
                    };
                    
                    container.innerHTML = categories.slice(0, 10).map(cat => \`
                        <button onclick="filterByCategory(\${cat.id})" 
                                class="category-btn flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl hover:shadow-md border border-gray-100">
                            <div class="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-2">
                                <i class="fas fa-\${iconMap[cat.icon] || 'box'} text-primary text-xl"></i>
                            </div>
                            <span class="text-xs font-medium text-gray-700 text-center">\${cat.name}</span>
                        </button>
                    \`).join('');
                } catch (error) {
                    console.error('カテゴリ読み込みエラー:', error);
                }
            }
            
            // カテゴリフィルター
            function filterByCategory(categoryId) {
                currentFilters.category_id = categoryId;
                currentPage = 1;
                loadProducts();
            }
            
            // メーカー読み込み
            async function loadMakers() {
                try {
                    const response = await axios.get('/api/makers');
                    const makers = response.data.makers || [];
                    const select = document.getElementById('maker-filter');
                    
                    makers.forEach(maker => {
                        const option = document.createElement('option');
                        option.value = maker.id;
                        option.textContent = maker.name;
                        select.appendChild(option);
                    });
                } catch (error) {
                    console.error('メーカー読み込みエラー:', error);
                }
            }
            
            // フィルター変更
            document.getElementById('maker-filter')?.addEventListener('change', (e) => {
                if (e.target.value) {
                    currentFilters.maker_id = e.target.value;
                } else {
                    delete currentFilters.maker_id;
                }
                currentPage = 1;
                loadProducts();
            });
            
            document.getElementById('condition-filter')?.addEventListener('change', (e) => {
                if (e.target.value) {
                    currentFilters.condition = e.target.value;
                } else {
                    delete currentFilters.condition;
                }
                currentPage = 1;
                loadProducts();
            });
            
            document.getElementById('sort-filter')?.addEventListener('change', (e) => {
                currentFilters.sort = e.target.value;
                currentPage = 1;
                loadProducts();
            });
            
            // もっと見る
            document.getElementById('load-more')?.addEventListener('click', () => {
                currentPage++;
                loadProducts();
            });
            
            // 検索キーボードイベント
            document.getElementById('search-input')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            
            // ページ読み込み時に実行
            window.addEventListener('DOMContentLoaded', () => {
                loadCategories();
                loadMakers();
                loadProducts();
            });
        </script>
    </body>
    </html>
  `)
})

// ログインページ
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ログイン - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .form-input {
                @apply w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors;
            }
            .form-input:focus {
                border-color: #ef4444;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- シンプルヘッダー -->
        <header class="bg-white border-b border-gray-200">
            <div class="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                <a href="/" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </a>
                <div class="text-red-500 font-bold text-lg">PARTS HUB</div>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-md mx-auto px-4 py-12">
            <!-- タイトル -->
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
                <p class="text-gray-600">メールアドレスとパスワードを入力</p>
            </div>

            <!-- 登録成功メッセージ（URLパラメータで表示） -->
            <div id="success-message" class="hidden mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center text-green-800">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span class="text-sm font-medium">アカウント作成完了！ログインしてください。</span>
                </div>
            </div>

            <!-- ログインフォーム -->
            <div class="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <form id="login-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">メールアドレス</label>
                        <input type="email" id="email" required
                               class="form-input"
                               placeholder="example@email.com"
                               autocomplete="email">
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">パスワード</label>
                        <input type="password" id="password" required
                               class="form-input"
                               placeholder="パスワードを入力"
                               autocomplete="current-password">
                    </div>

                    <div class="flex items-center justify-between text-sm">
                        <label class="flex items-center">
                            <input type="checkbox" id="remember" 
                                   class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500">
                            <span class="ml-2 text-gray-600">ログイン状態を保持</span>
                        </label>
                        <a href="/password-reset" class="text-red-500 hover:text-red-600 font-medium">
                            パスワードを忘れた？
                        </a>
                    </div>

                    <div class="pt-2">
                        <button type="submit"
                                class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg text-lg">
                            ログイン
                        </button>
                    </div>
                </form>

                <!-- 新規登録リンク -->
                <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p class="text-gray-600">
                        アカウントをお持ちでない方
                    </p>
                    <a href="/register" class="inline-block mt-2 text-red-500 hover:text-red-600 font-semibold">
                        新規会員登録はこちら <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
            </div>

            <!-- デモアカウント情報（開発用） -->
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="text-sm text-blue-800">
                    <p class="font-semibold mb-1"><i class="fas fa-info-circle mr-1"></i>テストアカウント</p>
                    <p class="text-xs">メール: test@example.com</p>
                    <p class="text-xs">パスワード: test1234</p>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 登録成功メッセージの表示
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('registered') === 'true') {
                document.getElementById('success-message').classList.remove('hidden');
            }

            // ログインフォーム送信
            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitButton = e.target.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>ログイン中...';
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await axios.post('/api/auth/login', { email, password });
                    
                    if (response.data.success) {
                        // トークンとユーザー情報を保存
                        localStorage.setItem('token', response.data.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.data.user));
                        
                        // 成功メッセージ
                        const successMsg = document.createElement('div');
                        successMsg.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl z-50';
                        successMsg.innerHTML = '<i class="fas fa-check-circle mr-2"></i>ログイン成功！';
                        document.body.appendChild(successMsg);
                        
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1000);
                    }
                } catch (error) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'ログイン';
                    
                    const errorMsg = error.response?.data?.error || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
                    alert(errorMsg);
                }
            });
        </script>
    </body>
    </html>
  `)
})

// 登録ページ
app.get('/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新規会員登録 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .form-input {
                @apply w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors;
            }
            .form-input:focus {
                border-color: #ef4444;
            }
            .step-indicator {
                @apply flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold;
            }
            .step-active {
                @apply bg-red-500 text-white;
            }
            .step-inactive {
                @apply bg-gray-200 text-gray-500;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- シンプルヘッダー -->
        <header class="bg-white border-b border-gray-200">
            <div class="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                <a href="/" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </a>
                <div class="text-red-500 font-bold text-lg">PARTS HUB</div>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-2xl mx-auto px-4 py-8">
            <!-- タイトル -->
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">会員登録</h1>
                <p class="text-gray-600">自動車パーツの売買を始めましょう</p>
            </div>

            <!-- ステップインジケーター -->
            <div class="mb-8">
                <div class="flex items-center justify-center space-x-4">
                    <div class="flex items-center">
                        <div id="step-1" class="step-indicator step-active">1</div>
                        <span class="ml-2 text-sm font-medium text-gray-700">基本情報</span>
                    </div>
                    <div class="w-12 h-0.5 bg-gray-300"></div>
                    <div class="flex items-center">
                        <div id="step-2" class="step-indicator step-inactive">2</div>
                        <span class="ml-2 text-sm font-medium text-gray-500">店舗情報</span>
                    </div>
                </div>
            </div>

            <!-- 登録フォーム -->
            <div class="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <form id="register-form">
                    <!-- ステップ1: 基本情報 -->
                    <div id="step-1-content" class="space-y-5">
                        <h2 class="text-xl font-bold text-gray-900 mb-6">基本情報を入力</h2>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">メールアドレス</label>
                            <input type="email" id="email" required
                                   class="form-input"
                                   placeholder="example@email.com">
                            <p class="mt-1 text-xs text-gray-500">ログイン時に使用します</p>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">パスワード</label>
                            <input type="password" id="password" required minlength="8"
                                   class="form-input"
                                   placeholder="8文字以上の英数字">
                            <p class="mt-1 text-xs text-gray-500">8文字以上で設定してください</p>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">パスワード（確認）</label>
                            <input type="password" id="password-confirm" required minlength="8"
                                   class="form-input"
                                   placeholder="もう一度入力してください">
                        </div>

                        <div class="pt-4">
                            <button type="button" onclick="goToStep2()"
                                    class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg text-lg">
                                次へ進む
                            </button>
                        </div>
                    </div>

                    <!-- ステップ2: 店舗情報 -->
                    <div id="step-2-content" class="space-y-5 hidden">
                        <h2 class="text-xl font-bold text-gray-900 mb-6">店舗情報を入力</h2>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">店舗名・屋号</label>
                            <input type="text" id="shop-name" required
                                   class="form-input"
                                   placeholder="例: 山田自動車整備工場">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">業態</label>
                            <select id="shop-type" required
                                    class="form-input">
                                <option value="">選択してください</option>
                                <option value="factory">整備工場</option>
                                <option value="dealer">ディーラー</option>
                                <option value="parts_shop">パーツショップ</option>
                                <option value="recycler">リサイクルショップ</option>
                                <option value="individual">個人</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">電話番号</label>
                            <input type="tel" id="phone"
                                   class="form-input"
                                   placeholder="03-1234-5678">
                            <p class="mt-1 text-xs text-gray-500">ハイフンありで入力</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">郵便番号</label>
                                <input type="text" id="postal-code"
                                       class="form-input"
                                       placeholder="123-4567">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">都道府県</label>
                                <input type="text" id="prefecture"
                                       class="form-input"
                                       placeholder="東京都">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">市区町村</label>
                            <input type="text" id="city"
                                   class="form-input"
                                   placeholder="渋谷区神南">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">番地・建物名</label>
                            <input type="text" id="address"
                                   class="form-input"
                                   placeholder="1-2-3 ビル名 101号室">
                        </div>

                        <div class="flex items-start pt-2">
                            <input type="checkbox" id="terms" required 
                                   class="mt-1 mr-3 w-5 h-5 text-red-500 border-gray-300 rounded focus:ring-red-500">
                            <label for="terms" class="text-sm text-gray-600 leading-relaxed">
                                <a href="/terms" target="_blank" class="text-red-500 hover:text-red-600 font-medium underline">利用規約</a>および
                                <a href="/privacy" target="_blank" class="text-red-500 hover:text-red-600 font-medium underline">プライバシーポリシー</a>に同意します
                            </label>
                        </div>

                        <div class="grid grid-cols-2 gap-3 pt-4">
                            <button type="button" onclick="goToStep1()"
                                    class="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg font-bold hover:bg-gray-50 transition-all">
                                戻る
                            </button>
                            <button type="submit"
                                    class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg">
                                <i class="fas fa-user-plus mr-2"></i>登録する
                            </button>
                        </div>
                    </div>
                </form>

                <!-- ログインリンク -->
                <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p class="text-gray-600">
                        すでにアカウントをお持ちの方
                    </p>
                    <a href="/login" class="inline-block mt-2 text-red-500 hover:text-red-600 font-semibold">
                        ログインはこちら <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // ステップ管理
            function goToStep2() {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const passwordConfirm = document.getElementById('password-confirm').value;

                if (!email || !password || !passwordConfirm) {
                    alert('すべての項目を入力してください');
                    return;
                }

                if (password !== passwordConfirm) {
                    alert('パスワードが一致しません');
                    return;
                }

                if (password.length < 8) {
                    alert('パスワードは8文字以上で設定してください');
                    return;
                }

                // ステップ2に進む
                document.getElementById('step-1-content').classList.add('hidden');
                document.getElementById('step-2-content').classList.remove('hidden');
                document.getElementById('step-1').classList.remove('step-active');
                document.getElementById('step-1').classList.add('step-inactive');
                document.getElementById('step-2').classList.remove('step-inactive');
                document.getElementById('step-2').classList.add('step-active');
                window.scrollTo(0, 0);
            }

            function goToStep1() {
                document.getElementById('step-2-content').classList.add('hidden');
                document.getElementById('step-1-content').classList.remove('hidden');
                document.getElementById('step-2').classList.remove('step-active');
                document.getElementById('step-2').classList.add('step-inactive');
                document.getElementById('step-1').classList.remove('step-inactive');
                document.getElementById('step-1').classList.add('step-active');
                window.scrollTo(0, 0);
            }

            // フォーム送信
            document.getElementById('register-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitButton = e.target.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登録中...';
                
                const data = {
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    shop_name: document.getElementById('shop-name').value,
                    shop_type: document.getElementById('shop-type').value,
                    phone: document.getElementById('phone').value || null,
                    postal_code: document.getElementById('postal-code').value || null,
                    prefecture: document.getElementById('prefecture').value || null,
                    city: document.getElementById('city').value || null,
                    address: document.getElementById('address').value || null
                };
                
                try {
                    const response = await axios.post('/api/auth/register', data);
                    
                    if (response.data.success) {
                        // 成功メッセージ
                        const successMsg = document.createElement('div');
                        successMsg.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl z-50 animate-bounce';
                        successMsg.innerHTML = '<i class="fas fa-check-circle mr-2"></i>アカウント作成完了！ログインページへ移動します...';
                        document.body.appendChild(successMsg);
                        
                        setTimeout(() => {
                            window.location.href = '/login?registered=true';
                        }, 2000);
                    }
                } catch (error) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-user-plus mr-2"></i>登録する';
                    
                    const errorMsg = error.response?.data?.error || '登録に失敗しました。もう一度お試しください。';
                    alert(errorMsg);
                }
            });
        </script>
    </body>
    </html>
  `)
})

// 商品詳細ページ
app.get('/products/:id', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>商品詳細 - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="自動車パーツの詳細情報、適合車両、価格など">
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .main-image-container {
                aspect-ratio: 1 / 1;
                max-height: 500px;
            }
            .thumbnail-scroll {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
            }
            .thumbnail-scroll::-webkit-scrollbar {
                height: 4px;
            }
            .thumbnail-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e0;
                border-radius: 4px;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- シンプルヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <button onclick="window.history.back()" 
                        class="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>
                    <span class="font-medium">戻る</span>
                </button>
                <a href="/" class="text-primary font-bold text-lg">PARTS HUB</a>
                <div class="w-16"></div> <!-- スペーサー -->
            </div>
        </header>

        <!-- メインコンテンツ -->
        <main id="product-detail-container" class="max-w-6xl mx-auto px-4 py-6">
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <!-- 左カラム：画像ギャラリー (3カラム) -->
                <div class="lg:col-span-3">
                    <!-- メイン画像 -->
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                        <div class="aspect-square bg-gray-100 flex items-center justify-center">
                            <img id="main-product-image" 
                                 src="https://placehold.co/600x600/e2e8f0/64748b?text=Loading..." 
                                 alt="商品画像" 
                                 class="w-full h-full object-cover"
                                 onerror="this.src='https://placehold.co/600x600/e2e8f0/64748b?text=No+Image'">
                        </div>
                    </div>
                    
                    <!-- サムネイル -->
                    <div id="image-thumbnails" class="grid grid-cols-5 gap-2">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- 右カラム：商品情報 (2カラム) -->
                <div class="lg:col-span-2">
                    <!-- 商品タイトルと基本情報 -->
                    <div class="bg-white rounded-xl shadow-sm p-5 mb-4">
                        <h1 id="product-title" class="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                            読み込み中...
                        </h1>
                        
                        <!-- 状態バッジ -->
                        <div id="product-condition-badge" class="inline-block mb-4">
                            <!-- JavaScriptで生成 -->
                        </div>
                        
                        <!-- 価格 -->
                        <div class="mb-6">
                            <div class="flex items-baseline space-x-2">
                                <span id="product-price" class="text-4xl font-bold text-gray-900">¥0</span>
                                <span class="text-gray-500 text-sm">（税込・送料別）</span>
                            </div>
                        </div>
                        
                        <!-- アクションボタン -->
                        <div class="space-y-3 mb-6">
                            <button onclick="purchaseProduct()" 
                                    class="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                購入手続きへ
                            </button>
                            <button onclick="addToFavorites()" 
                                    class="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center">
                                <i class="far fa-heart mr-2"></i>いいね
                            </button>
                            <button onclick="openPriceOfferModal()" 
                                    class="w-full px-6 py-4 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center">
                                <i class="fas fa-tag mr-2"></i>値下げ交渉
                            </button>
                        </div>
                        <button onclick="contactSeller()" 
                                class="w-full px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center">
                            <i class="fas fa-comment-dots mr-2"></i>出品者に質問
                        </button>
                    </div>
                    
                    <!-- 商品詳細テーブル -->
                    <div class="bg-white rounded-xl shadow-sm p-5 mb-4">
                        <h2 class="font-bold text-gray-900 mb-4 text-lg">商品の情報</h2>
                        <table class="w-full text-sm">
                            <tbody>
                                <tr class="border-b">
                                    <td class="py-3 text-gray-600 font-medium">カテゴリ</td>
                                    <td id="product-category" class="py-3 text-gray-900 text-right">-</td>
                                </tr>
                                <tr class="border-b">
                                    <td class="py-3 text-gray-600 font-medium">部品番号</td>
                                    <td id="product-part-number" class="py-3 text-gray-900 text-right">-</td>
                                </tr>
                                <tr class="border-b">
                                    <td class="py-3 text-gray-600 font-medium">在庫数</td>
                                    <td id="product-stock" class="py-3 text-gray-900 text-right">-</td>
                                </tr>
                                <tr>
                                    <td class="py-3 text-gray-600 font-medium">配送方法</td>
                                    <td class="py-3 text-gray-900 text-right">未定（出品者と相談）</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 出品者情報カード -->
                    <div class="bg-white rounded-xl shadow-sm p-5">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="font-bold text-gray-900 text-lg">出品者</h2>
                            <div class="flex items-center text-sm">
                                <i class="fas fa-star text-yellow-400 mr-1"></i>
                                <span id="seller-rating" class="font-semibold">-</span>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                    <i class="fas fa-store text-gray-400 text-lg"></i>
                                </div>
                                <div class="flex-1">
                                    <div id="seller-shop-name" class="font-semibold text-gray-900">-</div>
                                    <div class="flex items-center text-sm text-gray-500">
                                        <span id="seller-shop-type">-</span>
                                        <span id="seller-verified" class="ml-2"><!-- バッジ --></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 商品説明セクション（全幅） -->
            <div class="mt-6">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">商品の説明</h2>
                    <div id="product-description" class="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        読み込み中...
                    </div>
                </div>
            </div>
            
            <!-- 適合車両情報セクション（全幅） -->
            <div id="compatibility-section" class="mt-6">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-car text-primary mr-2"></i>適合車両情報
                    </h2>
                    <div id="compatibility-info" class="text-gray-700">
                        読み込み中...
                    </div>
                </div>
            </div>

            <!-- コメント・質問セクション -->
            <div id="comments-section" class="mt-6">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-comments text-primary mr-2"></i>コメント・質問
                    </h2>
                    
                    <!-- コメント投稿フォーム -->
                    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                        <textarea id="comment-input" rows="3" 
                                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                                  placeholder="商品について質問やコメントを投稿できます"></textarea>
                        <div class="flex items-center justify-between mt-3">
                            <label class="flex items-center gap-2 text-sm text-gray-600">
                                <input type="checkbox" id="is-question" class="w-4 h-4 text-red-500 rounded">
                                <span>これは質問です</span>
                            </label>
                            <button onclick="postComment()" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                                <i class="fas fa-paper-plane mr-2"></i>投稿する
                            </button>
                        </div>
                    </div>

                    <!-- コメント一覧 -->
                    <div id="comments-list" class="space-y-4">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>
            </div>
        </main>

        <!-- 値下げモーダル -->
        <div id="price-offer-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-md w-full">
                <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-900">値下げ交渉</h3>
                    <button onclick="closePriceOfferModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">現在の価格</label>
                        <div class="text-2xl font-bold text-gray-900" id="modal-current-price">¥0</div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">希望価格 *</label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">¥</span>
                            <input type="number" id="offer-price" 
                                   class="w-full px-4 py-3 pl-8 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                                   placeholder="0">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">メッセージ（任意）</label>
                        <textarea id="offer-message" rows="3"
                                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                                  placeholder="値下げの理由など"></textarea>
                    </div>
                    <button onclick="submitPriceOffer()" 
                            class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all">
                        <i class="fas fa-tag mr-2"></i>値下げをリクエストする
                    </button>
                    <p class="text-xs text-gray-500 text-center">
                        ※値下げリクエストは24時間有効です
                    </p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/product-detail.js"></script>
        <script src="/static/comments.js"></script>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>商品を出品 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .form-input {
                @apply w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors;
            }
            .form-input:focus {
                border-color: #ef4444;
            }
            .image-upload-area {
                border: 2px dashed #d1d5db;
                transition: all 0.3s;
            }
            .image-upload-area:hover {
                border-color: #ef4444;
                background-color: #fef2f2;
            }
            .image-upload-area.dragover {
                border-color: #ef4444;
                background-color: #fee2e2;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- シンプルヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <div class="text-red-500 font-bold text-lg">商品を出品</div>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            <form id="listing-form" class="space-y-6">
                <!-- 画像アップロードセクション -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">
                        <i class="fas fa-camera text-red-500 mr-2"></i>商品画像（最大10枚）
                    </h2>
                    
                    <div id="drop-zone" class="image-upload-area rounded-lg p-8 text-center cursor-pointer">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                        <p class="text-gray-600 mb-2">クリックまたはドラッグ＆ドロップで画像を追加</p>
                        <p class="text-sm text-gray-500">JPG, PNG, WEBP（最大10MB）</p>
                        <input type="file" id="image-input" accept="image/*" multiple class="hidden">
                    </div>
                    
                    <!-- カメラとギャラリーボタン -->
                    <div class="grid grid-cols-2 gap-3 mt-3">
                        <button type="button" onclick="productForm.openCamera()" 
                                class="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <i class="fas fa-camera"></i>
                            <span class="text-sm">カメラで撮影</span>
                        </button>
                        <button type="button" onclick="productForm.openGallery()" 
                                class="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <i class="fas fa-image"></i>
                            <span class="text-sm">ギャラリーから選択</span>
                        </button>
                    </div>
                    
                    <div id="image-previews" class="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                        <!-- プレビュー画像 -->
                    </div>
                </div>

                <!-- 基本情報セクション -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">
                        <i class="fas fa-info-circle text-red-500 mr-2"></i>基本情報
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">商品名 <span class="text-red-500">*</span></label>
                            <input type="text" id="product-title" required
                                   class="form-input"
                                   placeholder="例: トヨタ プリウス 30系 フロントドア 左側">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">商品説明 <span class="text-red-500">*</span></label>
                            <textarea id="product-description" required rows="5"
                                      class="form-input resize-none"
                                      placeholder="商品の状態、特徴、付属品などを詳しく記載してください"></textarea>
                            <p class="mt-1 text-xs text-gray-500">購入者が安心できるよう、詳しく記載しましょう</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">カテゴリ <span class="text-red-500">*</span></label>
                                <select id="category-select" required class="form-input">
                                    <option value="">選択してください</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">サブカテゴリ</label>
                                <select id="subcategory-select" class="form-input">
                                    <option value="">カテゴリを選択してください</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">商品の状態 <span class="text-red-500">*</span></label>
                            <select id="condition-select" required class="form-input">
                                <option value="">選択してください</option>
                                <option value="new">新品、未使用</option>
                                <option value="like_new">未使用に近い</option>
                                <option value="excellent">目立った傷や汚れなし</option>
                                <option value="good">やや傷や汚れあり</option>
                                <option value="acceptable">傷や汚れあり</option>
                                <option value="junk">全体的に状態が悪い（ジャンク品）</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 価格設定セクション -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">
                        <i class="fas fa-yen-sign text-red-500 mr-2"></i>価格設定
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">販売価格 <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">¥</span>
                                <input type="number" id="product-price" required min="0"
                                       class="form-input pl-8"
                                       placeholder="0">
                            </div>
                            <p class="mt-1 text-xs text-gray-500">税込価格を入力してください</p>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">在庫数 <span class="text-red-500">*</span></label>
                            <input type="number" id="stock-quantity" required min="1" value="1"
                                   class="form-input"
                                   placeholder="1">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">部品番号（任意）</label>
                            <input type="text" id="part-number"
                                   class="form-input"
                                   placeholder="例: 04465-12345">
                        </div>
                    </div>
                </div>

                <!-- 適合車両情報セクション -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">
                        <i class="fas fa-car text-red-500 mr-2"></i>適合車両情報（任意）
                    </h2>
                    
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">メーカー</label>
                                <select id="maker-select" class="form-input">
                                    <option value="">選択してください</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">車種</label>
                                <select id="model-select" class="form-input">
                                    <option value="">メーカーを選択してください</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">年式（始）</label>
                                <input type="number" id="year-from" class="form-input" placeholder="例: 2010" min="1900" max="2099">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">年式（終）</label>
                                <input type="number" id="year-to" class="form-input" placeholder="例: 2015" min="1900" max="2099">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">型式</label>
                                <input type="text" id="model-code" class="form-input" placeholder="例: DAA-ZVW30">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">グレード</label>
                                <input type="text" id="grade" class="form-input" placeholder="例: S, G, Gツーリングセレクション">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">エンジン型式</label>
                                <input type="text" id="engine-type" class="form-input" placeholder="例: 2ZR-FXE">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">駆動方式</label>
                                <select id="drive-type" class="form-input">
                                    <option value="">選択してください</option>
                                    <option value="2WD">2WD（FF）</option>
                                    <option value="4WD">4WD</option>
                                    <option value="FR">FR</option>
                                    <option value="MR">MR</option>
                                    <option value="RR">RR</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">トランスミッション</label>
                                <select id="transmission-type" class="form-input">
                                    <option value="">選択してください</option>
                                    <option value="AT">オートマ（AT）</option>
                                    <option value="MT">マニュアル（MT）</option>
                                    <option value="CVT">CVT</option>
                                    <option value="DCT">DCT</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">純正部品番号</label>
                                <input type="text" id="oem-part-number" class="form-input" placeholder="例: 04465-XXXXX">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">確認方法</label>
                            <select id="verification-method" class="form-input">
                                <option value="">選択してください</option>
                                <option value="catalog">カタログで確認</option>
                                <option value="parts_list">部品リストで確認</option>
                                <option value="actual_vehicle">実車で確認</option>
                                <option value="dealer">ディーラーに確認</option>
                                <option value="manufacturer">メーカーに確認</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">適合に関する備考</label>
                            <textarea id="fitment-notes" rows="3"
                                      class="form-input resize-none"
                                      placeholder="適合に関する注意事項があれば記載してください"></textarea>
                        </div>

                    </div>
                </div>

                <!-- 代理出品案内セクション -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-200">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-hands-helping text-white text-xl"></i>
                            </div>
                        </div>
                        <div class="flex-1">
                            <h2 class="text-lg font-bold text-gray-900 mb-2">
                                出品が難しい場合は、代理出品サービスをご利用ください
                            </h2>
                            <p class="text-sm text-gray-600 mb-4">
                                パーツハブの担当者が出品作業を代行いたします。<br>
                                2つの方法からお選びいただけます。
                            </p>
                            <button type="button" onclick="showProxyListingModal()" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md">
                                <i class="fas fa-info-circle mr-2"></i>代理出品の詳細を見る
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 出品ボタン -->
                <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 shadow-lg">
                    <button type="button" id="submit-btn" onclick="productForm.submitForm()"
                            class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg text-lg">
                        <i class="fas fa-check mr-2"></i>出品する
                    </button>
                </div>
            </form>
        </main>

        <!-- 代理出品モーダル -->
        <div id="proxy-listing-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-900">代理出品サービスのご案内</h3>
                    <button onclick="closeProxyListingModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>

                <div class="p-6 space-y-6">
                    <!-- パターン1: 出張 -->
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <div class="flex items-start gap-4 mb-4">
                            <div class="flex-shrink-0">
                                <div class="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-truck text-white text-2xl"></i>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-xl font-bold text-gray-900 mb-2">パターン1: 出張代理出品</h4>
                                <p class="text-gray-600">パーツハブ担当者がお客様の整備工場に出向いて、その場で出品作業を行います。</p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="bg-white rounded-lg p-4">
                                <h5 class="font-semibold text-gray-900 mb-2"><i class="fas fa-yen-sign text-purple-500 mr-2"></i>料金体系</h5>
                                <ul class="space-y-2 text-sm text-gray-700">
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check text-green-500 mt-1"></i>
                                        <span><strong>出張費用:</strong> 距離により発生（お見積りいたします）</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check text-green-500 mt-1"></i>
                                        <span><strong>出品点数:</strong> 20点まで無料</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check text-green-500 mt-1"></i>
                                        <span><strong>21点以上:</strong> 1点につき330円（税込）</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-exclamation-triangle text-orange-500 mt-1"></i>
                                        <span><strong>売買手数料:</strong> 30%（通常7%より高くなります）</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- パターン2: 郵送 -->
                    <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                        <div class="flex items-start gap-4 mb-4">
                            <div class="flex-shrink-0">
                                <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-box text-white text-2xl"></i>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-xl font-bold text-gray-900 mb-2">パターン2: 郵送代理出品（おすすめ）</h4>
                                <p class="text-gray-600">商品をパーツハブに郵送いただき、当社で出品作業を代行します。</p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="bg-white rounded-lg p-4">
                                <h5 class="font-semibold text-gray-900 mb-2"><i class="fas fa-yen-sign text-green-500 mr-2"></i>料金体系</h5>
                                <ul class="space-y-2 text-sm text-gray-700">
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check text-green-500 mt-1"></i>
                                        <span><strong>出張費用:</strong> 無料</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check text-green-500 mt-1"></i>
                                        <span><strong>出品作業費:</strong> すべて無料（点数制限なし）</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-exclamation-triangle text-orange-500 mt-1"></i>
                                        <span><strong>売買手数料:</strong> 30%（通常7%より高くなります）</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-info-circle text-blue-500 mt-1"></i>
                                        <span><strong>送料:</strong> お客様負担</span>
                                    </li>
                                </ul>
                            </div>

                            <div class="bg-green-100 border border-green-300 rounded-lg p-4">
                                <p class="text-sm text-green-800 font-semibold">
                                    <i class="fas fa-star text-yellow-500 mr-2"></i>
                                    郵送代理出品なら、出張費用と1点あたりの出品作業費（330円）が無料です！
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 比較表 -->
                    <div class="bg-gray-50 rounded-xl p-6">
                        <h4 class="text-lg font-bold text-gray-900 mb-4">料金比較表</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b border-gray-300">
                                        <th class="text-left py-3 px-2 font-semibold text-gray-700">項目</th>
                                        <th class="text-center py-3 px-2 font-semibold text-purple-700">出張代理出品</th>
                                        <th class="text-center py-3 px-2 font-semibold text-green-700">郵送代理出品</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr>
                                        <td class="py-3 px-2 text-gray-700">出張費用</td>
                                        <td class="py-3 px-2 text-center text-orange-600">距離により発生</td>
                                        <td class="py-3 px-2 text-center text-green-600 font-semibold">無料</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-2 text-gray-700">出品作業費（20点まで）</td>
                                        <td class="py-3 px-2 text-center text-green-600">無料</td>
                                        <td class="py-3 px-2 text-center text-green-600 font-semibold">無料</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-2 text-gray-700">出品作業費（21点以上）</td>
                                        <td class="py-3 px-2 text-center text-orange-600">1点につき330円</td>
                                        <td class="py-3 px-2 text-center text-green-600 font-semibold">無料</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-2 text-gray-700">売買手数料</td>
                                        <td class="py-3 px-2 text-center text-gray-700">30%</td>
                                        <td class="py-3 px-2 text-center text-gray-700">30%</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-2 text-gray-700">送料</td>
                                        <td class="py-3 px-2 text-center text-gray-400">-</td>
                                        <td class="py-3 px-2 text-center text-gray-700">お客様負担</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- お問い合わせボタン -->
                    <div class="flex gap-3">
                        <a href="/contact?type=proxy_onsite" 
                           class="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-lg font-bold text-center transition-colors">
                            <i class="fas fa-truck mr-2"></i>出張代理出品を依頼
                        </a>
                        <a href="/contact?type=proxy_shipping" 
                           class="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-bold text-center transition-colors">
                            <i class="fas fa-box mr-2"></i>郵送代理出品を依頼
                        </a>
                    </div>

                    <p class="text-xs text-gray-500 text-center">
                        ※料金は税込表示です。詳細はお問い合わせください。
                    </p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/listing.js"></script>
        <script>
            // 代理出品モーダル制御
            function showProxyListingModal() {
                document.getElementById('proxy-listing-modal').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }

            function closeProxyListingModal() {
                document.getElementById('proxy-listing-modal').classList.add('hidden');
                document.body.style.overflow = 'auto';
            }

            // モーダル外クリックで閉じる
            document.getElementById('proxy-listing-modal')?.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeProxyListingModal();
                }
            });
        </script>
    </body>
    </html>
  `)
})

// チャットルーム一覧ページ
app.get('/chat', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>メッセージ - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .unread-badge {
                min-width: 1.5rem;
                height: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.location.href='/'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">メッセージ</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            <!-- チャットルーム一覧 -->
            <div id="chat-rooms-container" class="space-y-3">
                <!-- JavaScriptで動的に生成 -->
            </div>
            
            <!-- 空状態 -->
            <div id="empty-state" class="hidden text-center py-12">
                <div class="bg-white rounded-xl shadow-sm p-8">
                    <i class="fas fa-comments text-gray-400 text-6xl mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">メッセージはまだありません</h2>
                    <p class="text-gray-600 mb-6">商品詳細ページから出品者に問い合わせてみましょう</p>
                    <a href="/" class="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                        商品を探す
                    </a>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentUserId = 1; // TODO: 実際のログインユーザーID

            // ページ読み込み時にチャットルーム一覧をロード
            document.addEventListener('DOMContentLoaded', () => {
                loadChatRooms();
            });

            // チャットルーム一覧をロード
            async function loadChatRooms() {
                try {
                    const response = await axios.get(\`/api/chat/rooms?user_id=\${currentUserId}\`);
                    
                    if (response.data.success) {
                        const rooms = response.data.data;
                        renderChatRooms(rooms);
                    }
                } catch (error) {
                    console.error('Failed to load chat rooms:', error);
                }
            }

            // チャットルームを描画
            function renderChatRooms(rooms) {
                const container = document.getElementById('chat-rooms-container');
                const emptyState = document.getElementById('empty-state');
                
                if (rooms.length === 0) {
                    container.classList.add('hidden');
                    emptyState.classList.remove('hidden');
                    return;
                }
                
                container.classList.remove('hidden');
                emptyState.classList.add('hidden');
                
                container.innerHTML = rooms.map(room => {
                    const isMe = room.buyer_id === currentUserId;
                    const otherUserName = isMe ? room.seller_name : room.buyer_name;
                    const lastMessage = room.last_message || 'まだメッセージがありません';
                    const lastMessageTime = room.last_message_at 
                        ? new Date(room.last_message_at).toLocaleString('ja-JP', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '';
                    
                    return \`
                        <a href="/chat/\${room.id}" class="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4">
                            <div class="flex items-start gap-4">
                                <div class="flex-shrink-0">
                                    <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                        <i class="fas fa-user text-gray-600"></i>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between mb-1">
                                        <h3 class="font-semibold text-gray-900 truncate">\${otherUserName}</h3>
                                        \${room.unread_count > 0 ? \`
                                            <span class="unread-badge bg-red-500 text-white text-xs font-bold rounded-full px-2">
                                                \${room.unread_count}
                                            </span>
                                        \` : ''}
                                    </div>
                                    <p class="text-sm text-gray-600 mb-2 truncate">\${room.product_title}</p>
                                    <div class="flex items-center justify-between">
                                        <p class="text-sm text-gray-500 truncate flex-1 mr-2">\${lastMessage}</p>
                                        <span class="text-xs text-gray-400 flex-shrink-0">\${lastMessageTime}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    \`;
                }).join('');
            }
        </script>
    </body>
    </html>
  `)
})

// チャットメッセージページ
app.get('/chat/:roomId', (c) => {
  const roomId = c.req.param('roomId')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>メッセージ - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .message-container {
                display: flex;
                flex-direction: column;
                height: calc(100vh - 140px);
            }
            .messages-list {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            }
            .message-bubble {
                max-width: 70%;
                word-wrap: break-word;
            }
            .message-sent {
                margin-left: auto;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
            }
            .message-received {
                margin-right: auto;
                background: white;
                border: 1px solid #e5e7eb;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4">
                <div class="flex items-center gap-3">
                    <button onclick="window.location.href='/chat'" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-gray-600"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h1 id="other-user-name" class="font-bold text-gray-900 truncate">読み込み中...</h1>
                        <p id="product-title" class="text-sm text-gray-600 truncate">-</p>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto">
            <div class="message-container">
                <!-- メッセージ一覧 -->
                <div id="messages-list" class="messages-list space-y-3">
                    <!-- JavaScriptで動的に生成 -->
                </div>

                <!-- 送信フォーム -->
                <div class="bg-white border-t border-gray-200 p-4">
                    <div class="flex items-end gap-3">
                        <textarea id="message-input" 
                                  rows="1"
                                  class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                                  placeholder="メッセージを入力..."
                                  onkeydown="handleKeyDown(event)"></textarea>
                        <button onclick="sendMessage()" 
                                class="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const roomId = ${roomId};
            let currentUserId = 1; // TODO: 実際のログインユーザーID
            let pollingInterval = null;
            let lastMessageId = null;

            // ページ読み込み時
            document.addEventListener('DOMContentLoaded', () => {
                loadRoomInfo();
                loadMessages();
                markAsRead();
                
                // 5秒ごとに新しいメッセージをチェック
                pollingInterval = setInterval(() => {
                    loadNewMessages();
                }, 5000);
            });

            // ページを離れる時にポーリング停止
            window.addEventListener('beforeunload', () => {
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                }
            });

            // ルーム情報をロード
            async function loadRoomInfo() {
                try {
                    const response = await axios.get(\`/api/chat/rooms?user_id=\${currentUserId}\`);
                    
                    if (response.data.success) {
                        const room = response.data.data.find(r => r.id === roomId);
                        if (room) {
                            const isMe = room.buyer_id === currentUserId;
                            const otherUserName = isMe ? room.seller_name : room.buyer_name;
                            
                            document.getElementById('other-user-name').textContent = otherUserName;
                            document.getElementById('product-title').textContent = room.product_title;
                        }
                    }
                } catch (error) {
                    console.error('Failed to load room info:', error);
                }
            }

            // メッセージ一覧をロード
            async function loadMessages() {
                try {
                    const response = await axios.get(\`/api/chat/rooms/\${roomId}/messages?limit=100\`);
                    
                    if (response.data.success) {
                        const messages = response.data.data;
                        if (messages.length > 0) {
                            lastMessageId = messages[messages.length - 1].id;
                        }
                        renderMessages(messages);
                        scrollToBottom();
                    }
                } catch (error) {
                    console.error('Failed to load messages:', error);
                }
            }

            // 新しいメッセージのみロード（ポーリング用）
            async function loadNewMessages() {
                if (!lastMessageId) return;
                
                try {
                    const response = await axios.get(\`/api/chat/rooms/\${roomId}/messages?limit=50\`);
                    
                    if (response.data.success) {
                        const messages = response.data.data;
                        const newMessages = messages.filter(m => m.id > lastMessageId);
                        
                        if (newMessages.length > 0) {
                            lastMessageId = newMessages[newMessages.length - 1].id;
                            appendMessages(newMessages);
                            scrollToBottom();
                            markAsRead();
                        }
                    }
                } catch (error) {
                    console.error('Failed to load new messages:', error);
                }
            }

            // メッセージを描画
            function renderMessages(messages) {
                const container = document.getElementById('messages-list');
                
                if (messages.length === 0) {
                    container.innerHTML = \`
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-comment-slash text-4xl mb-3"></i>
                            <p>メッセージを送信して会話を始めましょう</p>
                        </div>
                    \`;
                    return;
                }
                
                container.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
            }

            // メッセージを追加（新しいメッセージのみ）
            function appendMessages(messages) {
                const container = document.getElementById('messages-list');
                const html = messages.map(msg => createMessageHTML(msg)).join('');
                container.insertAdjacentHTML('beforeend', html);
            }

            // メッセージHTMLを生成
            function createMessageHTML(msg) {
                const isSent = msg.sender_id === currentUserId;
                const bubbleClass = isSent ? 'message-sent' : 'message-received';
                const timeStr = new Date(msg.created_at).toLocaleString('ja-JP', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                return \`
                    <div class="flex \${isSent ? 'justify-end' : 'justify-start'}">
                        <div class="message-bubble \${bubbleClass} rounded-2xl px-4 py-2">
                            \${!isSent ? \`<p class="text-xs text-gray-500 mb-1">\${msg.sender_name}</p>\` : ''}
                            <p class="\${isSent ? 'text-white' : 'text-gray-900'}">\${msg.message_text}</p>
                            <p class="text-xs \${isSent ? 'text-red-100' : 'text-gray-400'} mt-1 text-right">
                                \${timeStr}
                                \${isSent && msg.is_read ? '<i class="fas fa-check-double ml-1"></i>' : ''}
                            </p>
                        </div>
                    </div>
                \`;
            }

            // メッセージを送信
            async function sendMessage() {
                const input = document.getElementById('message-input');
                const text = input.value.trim();
                
                if (!text) return;
                
                try {
                    const response = await axios.post(\`/api/chat/rooms/\${roomId}/messages\`, {
                        sender_id: currentUserId,
                        message_text: text,
                        message_type: 'text'
                    });
                    
                    if (response.data.success) {
                        input.value = '';
                        input.style.height = 'auto';
                        loadMessages();
                    }
                } catch (error) {
                    console.error('Failed to send message:', error);
                    alert('メッセージの送信に失敗しました');
                }
            }

            // メッセージを既読にする
            async function markAsRead() {
                try {
                    await axios.put(\`/api/chat/rooms/\${roomId}/read\`, {
                        user_id: currentUserId
                    });
                } catch (error) {
                    console.error('Failed to mark as read:', error);
                }
            }

            // 下にスクロール
            function scrollToBottom() {
                const container = document.getElementById('messages-list');
                container.scrollTop = container.scrollHeight;
            }

            // Enterキーで送信（Shift+Enterで改行）
            function handleKeyDown(event) {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                }
            }

            // テキストエリアの自動リサイズ
            document.getElementById('message-input').addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        </script>
    </body>
    </html>
  `)
})

// マイページ
app.get('/mypage', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>マイページ - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.location.href='/'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">マイページ</h1>
                <button onclick="window.location.href='/notifications'" class="relative">
                    <i class="far fa-bell text-2xl text-gray-600"></i>
                    <span id="notification-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"></span>
                </button>
            </div>
        </header>

        <main class="max-w-6xl mx-auto px-4 py-6">
            <!-- ユーザー情報カード -->
            <div class="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg p-6 mb-6 text-white">
                <div class="flex items-center gap-4">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-red-500 text-3xl"></i>
                    </div>
                    <div class="flex-1">
                        <h2 id="user-shop-name" class="text-2xl font-bold mb-1">読み込み中...</h2>
                        <div class="flex items-center gap-4 text-sm">
                            <span><i class="fas fa-star mr-1"></i><span id="user-rating">0.0</span> (<span id="review-count">0</span>)</span>
                            <span><i class="fas fa-box mr-1"></i>出品 <span id="listing-count">0</span>件</span>
                        </div>
                    </div>
                    <button onclick="window.location.href='/profile/edit'" class="bg-white text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        プロフィール編集
                    </button>
                </div>
            </div>

            <!-- 統計カード -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-xl shadow-sm p-4">
                    <div class="text-gray-600 text-sm mb-1">売上合計</div>
                    <div class="text-2xl font-bold text-gray-900">¥<span id="total-sales">0</span></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4">
                    <div class="text-gray-600 text-sm mb-1">振込可能額</div>
                    <div class="text-2xl font-bold text-green-600">¥<span id="withdrawable">0</span></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4">
                    <div class="text-gray-600 text-sm mb-1">売却済み</div>
                    <div class="text-2xl font-bold text-gray-900"><span id="sold-count">0</span>件</div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4">
                    <div class="text-gray-600 text-sm mb-1">購入数</div>
                    <div class="text-2xl font-bold text-gray-900"><span id="purchase-count">0</span>件</div>
                </div>
            </div>

            <!-- メニュータブ -->
            <div class="bg-white rounded-xl shadow-sm mb-6">
                <div class="flex border-b border-gray-200 overflow-x-auto">
                    <button onclick="showTab('listings')" class="tab-btn flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent" data-tab="listings">
                        出品中
                    </button>
                    <button onclick="showTab('sales')" class="tab-btn flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent" data-tab="sales">
                        売上管理
                    </button>
                    <button onclick="showTab('purchases')" class="tab-btn flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent" data-tab="purchases">
                        購入履歴
                    </button>
                    <button onclick="showTab('favorites')" class="tab-btn flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent" data-tab="favorites">
                        お気に入り
                    </button>
                    <button onclick="showTab('negotiations')" class="tab-btn flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent" data-tab="negotiations">
                        値下げ交渉
                    </button>
                </div>

                <!-- 出品中タブ -->
                <div id="tab-listings" class="tab-content p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-900">出品中の商品</h3>
                        <select id="listing-status-filter" onchange="filterListings(this.value)" class="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none">
                            <option value="all">すべて</option>
                            <option value="active">出品中</option>
                            <option value="draft">下書き</option>
                            <option value="sold">売却済み</option>
                        </select>
                    </div>
                    <div id="listings-container" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- 売上管理タブ -->
                <div id="tab-sales" class="tab-content p-6 hidden">
                    <div class="space-y-6">
                        <!-- 振込申請 -->
                        <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                            <h3 class="text-lg font-bold text-gray-900 mb-2">振込可能額</h3>
                            <div class="text-3xl font-bold text-green-600 mb-4">¥<span id="withdrawable-detail">0</span></div>
                            <button onclick="requestWithdrawal()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                                <i class="fas fa-money-check-alt mr-2"></i>振込申請
                            </button>
                            <p class="text-sm text-gray-600 mt-3">※最低振込額: ¥1,000</p>
                        </div>

                        <!-- 月別売上 -->
                        <div>
                            <h3 class="text-lg font-bold text-gray-900 mb-4">月別売上</h3>
                            <div id="sales-summary" class="space-y-3">
                                <!-- JavaScriptで動的に生成 -->
                            </div>
                        </div>

                        <!-- 売上履歴 -->
                        <div>
                            <h3 class="text-lg font-bold text-gray-900 mb-4">売上履歴</h3>
                            <div id="sales-history" class="space-y-3">
                                <!-- JavaScriptで動的に生成 -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 購入履歴タブ -->
                <div id="tab-purchases" class="tab-content p-6 hidden">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">購入履歴</h3>
                    <div id="purchases-container" class="space-y-3">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- お気に入りタブ -->
                <div id="tab-favorites" class="tab-content p-6 hidden">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">お気に入り商品</h3>
                    <div id="favorites-container" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- 値下げ交渉タブ -->
                <div id="tab-negotiations" class="tab-content p-6 hidden">
                    <div class="mb-4">
                        <div class="flex gap-2 border-b border-gray-200">
                            <button onclick="showNegotiations('received')" class="nego-tab px-4 py-2 font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent" data-nego-tab="received">
                                受け取った
                            </button>
                            <button onclick="showNegotiations('sent')" class="nego-tab px-4 py-2 font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent" data-nego-tab="sent">
                                送った
                            </button>
                        </div>
                    </div>
                    <div id="negotiations-received" class="nego-content space-y-3">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                    <div id="negotiations-sent" class="nego-content space-y-3 hidden">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/mypage.js"></script>
    </body>
    </html>
  `)
})

export default app
