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
import profileRoutes from './routes/profile'
import reviewsRoutes from './routes/reviews'
import transactionsRoutes from './routes/transactions'
import adminRoutes from './routes/admin'

const app = new Hono<{ Bindings: Bindings }>()

// 共通フッターコンポーネント
const Footer = () => `
<footer class="bg-gray-900 text-white mt-16">
    <div class="max-w-6xl mx-auto px-4 py-8">
        <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
                <h3 class="font-bold text-lg mb-4">PARTS HUB</h3>
                <p class="text-sm text-gray-400">自動車部品の<br>フリーマーケット</p>
            </div>
            <div>
                <h4 class="font-semibold mb-3">サービス</h4>
                <ul class="space-y-2 text-sm text-gray-400">
                    <li><a href="/" class="hover:text-white transition-colors">商品を探す</a></li>
                    <li><a href="/listing" class="hover:text-white transition-colors">出品する</a></li>
                    <li><a href="/search" class="hover:text-white transition-colors">検索</a></li>
                    <li><a href="/contact" class="hover:text-white transition-colors">代理出品</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold mb-3">サポート</h4>
                <ul class="space-y-2 text-sm text-gray-400">
                    <li><a href="/faq" class="hover:text-white transition-colors">よくある質問</a></li>
                    <li><a href="/contact" class="hover:text-white transition-colors">お問い合わせ</a></li>
                    <li><a href="/mypage" class="hover:text-white transition-colors">マイページ</a></li>
                    <li><a href="/notifications" class="hover:text-white transition-colors">通知</a></li>
                    <li><a href="/favorites" class="hover:text-white transition-colors">お気に入り</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold mb-3">法的情報</h4>
                <ul class="space-y-2 text-sm text-gray-400">
                    <li><a href="/terms" class="hover:text-white transition-colors">利用規約</a></li>
                    <li><a href="/privacy" class="hover:text-white transition-colors">プライバシーポリシー</a></li>
                    <li><a href="/security" class="hover:text-white transition-colors">セキュリティポリシー</a></li>
                    <li><a href="/legal" class="hover:text-white transition-colors">特定商取引法に基づく表記</a></li>
                </ul>
            </div>
        </div>
        <div class="border-t border-gray-800 pt-6 text-center">
            <p class="text-sm text-gray-400 mb-2">&copy; 2026 PARTS HUB. All rights reserved.</p>
            <p class="text-xs text-gray-500">運営：株式会社TCI / 大阪府大阪市淀川区新高1-5-4 / TEL: 06-6151-3697</p>
        </div>
    </div>
</footer>
`

// ミドルウェア
app.use(logger())
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/icons/*', serveStatic({ root: './public' }))

// robots.txt, manifest.json, sw.js配信
app.get('/robots.txt', async (c) => {
  return c.text(`User-agent: *
Allow: /
Allow: /products/*
Allow: /search
Allow: /listing
Allow: /contact
Allow: /faq
Allow: /terms
Allow: /privacy
Allow: /security
Allow: /legal

# APIエンドポイントはクロール不要
Disallow: /api/*

# 個人情報ページ
Disallow: /mypage
Disallow: /profile/*
Disallow: /chat/*
Disallow: /notifications
Disallow: /transactions/*
Disallow: /listing/edit/*

# LLM専用クローラーには追加情報を許可
User-agent: GPTBot
Allow: /
Allow: /products/*
Allow: /faq
Allow: /search
Disallow: /mypage
Disallow: /api/*

User-agent: ClaudeBot
Allow: /
Allow: /products/*
Allow: /faq
Allow: /search
Disallow: /mypage
Disallow: /api/*

User-agent: Google-Extended
Allow: /
Allow: /products/*
Allow: /faq
Allow: /search
Disallow: /mypage
Disallow: /api/*

# Sitemap
Sitemap: https://parts-hub.com/sitemap.xml`, { headers: { 'Content-Type': 'text/plain' } })
})
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
app.route('/api/profile', profileRoutes)
app.route('/api/reviews', reviewsRoutes)
app.route('/api/transactions', transactionsRoutes)
app.route('/api/admin', adminRoutes)

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>PARTS HUB（パーツハブ）- 自動車パーツ売買プラットフォーム</title>
        <meta name="description" content="整備工場専門の純正パーツ・工具売買マーケットプレイス。手軽に部品を出品・購入できるプラットフォームです。">
        
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

        <!-- 構造化データ（JSON-LD） -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PARTS HUB（パーツハブ）",
          "url": "https://parts-hub.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://parts-hub.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "description": "整備工場専門の自動車パーツ売買マーケットプレイス。純正部品から工具まで手軽に売買できるプラットフォーム。",
          "publisher": {
            "@type": "Organization",
            "name": "株式会社TCI",
            "url": "https://parts-hub.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://parts-hub.com/logo.png"
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "淀川区新高1-5-4",
              "addressLocality": "大阪市",
              "addressRegion": "大阪府",
              "postalCode": "532-0000",
              "addressCountry": "JP"
            },
            "telephone": "+81-6-6151-3697",
            "email": "contact@parts-hub.com"
          }
        }
        </script>

        <!-- Open Graph タグ -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="PARTS HUB（パーツハブ）- 自動車パーツ売買プラットフォーム">
        <meta property="og:description" content="整備工場専門の自動車パーツマーケットプレイス。純正部品から工具まで、手軽に売買できます。">
        <meta property="og:url" content="https://parts-hub.com">
        <meta property="og:site_name" content="PARTS HUB">
        <meta property="og:locale" content="ja_JP">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="PARTS HUB - 自動車パーツ売買プラットフォーム">
        <meta name="twitter:description" content="整備工場専門の自動車パーツマーケットプレイス">

        <!-- Canonical URL -->
        <link rel="canonical" href="https://parts-hub.com">
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
                        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold drop-shadow-lg">
                            PARTS HUB
                        </h1>
                    </div>
                    <p class="text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 font-semibold drop-shadow-lg">自動車パーツの売買がもっと簡単に</p>
                    <p class="text-sm sm:text-base md:text-lg text-white/95 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto drop-shadow-md px-4">
                        整備工場専門のパーツマーケットプレイス。純正部品から工具まで、手軽に売買できます。
                    </p>
                    
                    <!-- 検索バー -->
                    <div class="max-w-3xl mx-auto">
                        <div class="flex flex-col sm:flex-row gap-3">
                            <div class="flex-1 relative">
                                <i class="fas fa-search absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg"></i>
                                <input type="text" id="search-input" 
                                       placeholder="商品名、メーカー、品番で検索..." 
                                       class="search-input w-full pl-11 sm:pl-14 pr-4 py-3 sm:py-4 rounded-xl border-0 text-gray-900 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl">
                            </div>
                            <button onclick="performSearch()" 
                                    class="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-2xl hover:shadow-red-500/50 text-base sm:text-lg">
                                <i class="fas fa-search mr-2"></i>検索
                            </button>
                        </div>
                        
                        <!-- 人気キーワード -->
                        <div class="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3 justify-center">
                            <span class="text-xs sm:text-sm text-white/90 font-medium">人気:</span>
                            <button onclick="searchKeyword('トヨタ')" class="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">トヨタ</button>
                            <button onclick="searchKeyword('エンジン')" class="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">エンジン</button>
                            <button onclick="searchKeyword('ドア')" class="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">ドア</button>
                            <button onclick="searchKeyword('ライト')" class="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm border border-white/30 font-medium">ライト</button>
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
            
            // 商品カード生成
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

        ${Footer()}
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

// 通知ページ
app.get('/notifications', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>通知 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.location.href='/mypage'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">通知</h1>
                <button onclick="markAllAsRead()" class="text-sm text-blue-600 hover:underline">
                    すべて既読
                </button>
            </div>
        </header>

        <main class="max-w-6xl mx-auto px-4 py-6">
            <!-- フィルタータブ -->
            <div class="bg-white rounded-xl shadow-sm mb-6">
                <div class="flex border-b border-gray-200 overflow-x-auto">
                    <button onclick="filterNotifications('all')" class="filter-tab flex-1 px-6 py-4 font-semibold text-red-500 border-b-2 border-red-500" data-filter="all">
                        すべて
                    </button>
                    <button onclick="filterNotifications('unread')" class="filter-tab flex-1 px-6 py-4 font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="unread">
                        未読
                    </button>
                    <button onclick="filterNotifications('comment')" class="filter-tab flex-1 px-6 py-4 font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="comment">
                        コメント
                    </button>
                    <button onclick="filterNotifications('negotiation')" class="filter-tab flex-1 px-6 py-4 font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="negotiation">
                        値下げ交渉
                    </button>
                    <button onclick="filterNotifications('transaction')" class="filter-tab flex-1 px-6 py-4 font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="transaction">
                        取引
                    </button>
                </div>
            </div>

            <!-- 通知一覧 -->
            <div id="notifications-container" class="space-y-3">
                <!-- JavaScriptで動的に生成 -->
                <div class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">読み込み中...</p>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/notifications.js"></script>
    </body>
    </html>
  `)
})

// プロフィール編集ページ
app.get('/profile/edit', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>プロフィール編集 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .upload-area {
                border: 2px dashed #e5e7eb;
                transition: all 0.3s;
            }
            .upload-area:hover {
                border-color: #ef4444;
                background: #fef2f2;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.location.href='/mypage'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">プロフィール編集</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            <form id="profile-form" class="space-y-6">
                <!-- プロフィール画像 -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">プロフィール画像</h2>
                    <div class="flex items-center gap-6">
                        <div class="relative">
                            <div id="profile-image-preview" class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                <i class="fas fa-user text-4xl text-gray-400"></i>
                            </div>
                            <button type="button" onclick="document.getElementById('profile-image-input').click()" class="absolute bottom-0 right-0 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                <i class="fas fa-camera text-sm"></i>
                            </button>
                            <input type="file" id="profile-image-input" accept="image/*" class="hidden" onchange="handleProfileImageUpload(event)">
                        </div>
                        <div class="flex-1">
                            <p class="text-sm text-gray-600 mb-2">推奨サイズ: 200x200px以上</p>
                            <p class="text-xs text-gray-500">JPG、PNG形式、最大5MB</p>
                        </div>
                    </div>
                </div>

                <!-- 基本情報 -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">基本情報</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">店舗名・工場名<span class="text-red-500">*</span></label>
                            <input type="text" id="shop-name" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="山田自動車整備工場">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">店舗種別<span class="text-red-500">*</span></label>
                            <select id="shop-type" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors">
                                <option value="">選択してください</option>
                                <option value="factory">整備工場</option>
                                <option value="dealer">ディーラー</option>
                                <option value="parts_shop">パーツショップ</option>
                                <option value="scrapyard">解体業者</option>
                                <option value="individual">個人</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">電話番号<span class="text-red-500">*</span></label>
                            <input type="tel" id="phone" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="03-1234-5678">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">メールアドレス<span class="text-red-500">*</span></label>
                            <input type="email" id="email" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="info@example.com">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">自己紹介</label>
                            <textarea id="bio" rows="4" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none" placeholder="創業50年の老舗整備工場です。国産車全般の修理・整備を承っております。"></textarea>
                        </div>
                    </div>
                </div>

                <!-- 住所情報 -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">住所情報</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">郵便番号</label>
                            <input type="text" id="postal-code" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="123-4567" maxlength="8">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">都道府県</label>
                            <select id="prefecture" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors">
                                <option value="">選択してください</option>
                                <option value="東京都">東京都</option>
                                <option value="神奈川県">神奈川県</option>
                                <option value="埼玉県">埼玉県</option>
                                <option value="千葉県">千葉県</option>
                                <!-- その他の都道府県も追加 -->
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">市区町村</label>
                            <input type="text" id="city" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="渋谷区">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">番地・建物名</label>
                            <input type="text" id="address" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="神南1-2-3 ビル4F">
                        </div>
                    </div>
                </div>

                <!-- 銀行口座情報（振込用） -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-2">銀行口座情報</h2>
                    <p class="text-sm text-gray-600 mb-4">売上金の振込先口座を登録してください</p>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">銀行名</label>
                            <input type="text" id="bank-name" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="みずほ銀行">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">支店名</label>
                            <input type="text" id="branch-name" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="渋谷支店">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">口座種別</label>
                            <select id="account-type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors">
                                <option value="">選択してください</option>
                                <option value="普通">普通</option>
                                <option value="当座">当座</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">口座番号</label>
                            <input type="text" id="account-number" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="1234567" maxlength="7">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">口座名義（カタカナ）</label>
                            <input type="text" id="account-holder" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="ヤマダジドウシャセイビコウジョウ">
                        </div>
                    </div>
                </div>

                <!-- 保存ボタン -->
                <div class="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-4 mt-6">
                    <button type="submit" id="submit-btn" class="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-all">
                        <i class="fas fa-save mr-2"></i>変更を保存
                    </button>
                </div>
            </form>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/profile-edit.js"></script>
    </body>
    </html>
  `)
})

// レビュー投稿ページ
app.get('/reviews/new', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>レビューを書く - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .star-rating {
                display: inline-flex;
                gap: 8px;
                font-size: 2rem;
            }
            .star {
                cursor: pointer;
                color: #d1d5db;
                transition: color 0.2s;
            }
            .star.active,
            .star:hover {
                color: #fbbf24;
            }
            .star:hover ~ .star {
                color: #d1d5db;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">レビューを書く</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            <!-- 取引情報カード -->
            <div id="transaction-info" class="bg-white rounded-xl shadow-sm p-6 mb-6">
                <!-- JavaScriptで動的に生成 -->
                <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                </div>
            </div>

            <!-- レビューフォーム -->
            <form id="review-form" class="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <!-- 評価 -->
                <div>
                    <label class="block text-lg font-bold text-gray-900 mb-3">評価<span class="text-red-500">*</span></label>
                    <div class="star-rating" id="star-rating">
                        <i class="far fa-star star" data-rating="1" onclick="setRating(1)"></i>
                        <i class="far fa-star star" data-rating="2" onclick="setRating(2)"></i>
                        <i class="far fa-star star" data-rating="3" onclick="setRating(3)"></i>
                        <i class="far fa-star star" data-rating="4" onclick="setRating(4)"></i>
                        <i class="far fa-star star" data-rating="5" onclick="setRating(5)"></i>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">星をクリックして評価してください</p>
                    <input type="hidden" id="rating" value="0">
                </div>

                <!-- コメント -->
                <div>
                    <label class="block text-lg font-bold text-gray-900 mb-3">コメント<span class="text-red-500">*</span></label>
                    <textarea id="comment" required rows="6" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none" placeholder="商品の状態、対応、配送などについてお書きください（100文字以上）"></textarea>
                    <p class="text-sm text-gray-600 mt-2"><span id="char-count">0</span> / 100文字（最低）</p>
                </div>

                <!-- 評価項目（任意） -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">商品の状態</label>
                        <select id="product-condition-rating" class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none">
                            <option value="">-</option>
                            <option value="5">とても良い</option>
                            <option value="4">良い</option>
                            <option value="3">普通</option>
                            <option value="2">悪い</option>
                            <option value="1">とても悪い</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">対応・コミュニケーション</label>
                        <select id="communication-rating" class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none">
                            <option value="">-</option>
                            <option value="5">とても良い</option>
                            <option value="4">良い</option>
                            <option value="3">普通</option>
                            <option value="2">悪い</option>
                            <option value="1">とても悪い</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">配送</label>
                        <select id="shipping-rating" class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none">
                            <option value="">-</option>
                            <option value="5">とても良い</option>
                            <option value="4">良い</option>
                            <option value="3">普通</option>
                            <option value="2">悪い</option>
                            <option value="1">とても悪い</option>
                        </select>
                    </div>
                </div>

                <!-- 投稿ボタン -->
                <div class="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-6">
                    <button type="submit" id="submit-btn" class="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-all">
                        <i class="fas fa-paper-plane mr-2"></i>レビューを投稿
                    </button>
                </div>
            </form>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/reviews.js"></script>
    </body>
    </html>
  `)
})

// 取引詳細ページ
app.get('/transactions/:id', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>取引詳細 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">取引詳細</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6 space-y-6" id="main-content">
            <!-- JavaScriptで動的に生成 -->
            <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">読み込み中...</p>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/transaction-detail.js"></script>
    </body>
    </html>
  `)
})

// 商品編集ページ（出品ページを再利用し、編集モードで動作）
app.get('/listing/edit/:id', (c) => {
  const productId = c.req.param('id')
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>商品を編集 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .form-input {
                border: 2px solid #e5e7eb;
                transition: border-color 0.2s;
            }
            .form-input:focus {
                border-color: #ef4444;
                outline: none;
            }
            .image-upload-area {
                border: 2px dashed #d1d5db;
                background: #f9fafb;
                transition: all 0.3s;
            }
            .image-upload-area:hover {
                border-color: #ef4444;
                background: #fef2f2;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-arrow-left mr-2"></i>戻る
                    </button>
                    <h1 class="text-red-500 font-bold text-lg">商品を編集</h1>
                    <div class="w-16"></div>
                </div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            <form id="listing-form" class="space-y-6">
                <input type="hidden" id="product-id" value="${productId}">
                
                <!-- 読み込み中表示 -->
                <div id="loading" class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">商品情報を読み込み中...</p>
                </div>

                <!-- フォーム本体（JavaScriptで動的生成） -->
                <div id="form-content" class="hidden"></div>
            </form>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 商品編集モード
            window.EDIT_MODE = true;
            window.PRODUCT_ID = ${productId};
        </script>
        <script src="/static/listing.js"></script>
    </body>
    </html>
  `)
})

// お問い合わせページ
app.get('/contact', (c) => {
  const type = c.req.query('type') || ''
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>お問い合わせ - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">お問い合わせ</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            ${type === 'proxy_onsite' || type === 'proxy_shipping' ? `
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <h2 class="text-lg font-bold text-blue-900 mb-2">
                        <i class="fas fa-hands-helping mr-2"></i>代理出品サービスについて
                    </h2>
                    <p class="text-blue-800">
                        ${type === 'proxy_onsite' ? '出張代理出品' : '郵送代理出品'}についてお問い合わせいただきありがとうございます。
                    </p>
                </div>
            ` : ''}

            <form id="contact-form" class="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <!-- お問い合わせ種別 -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">お問い合わせ種別<span class="text-red-500">*</span></label>
                    <select id="inquiry-type" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none">
                        <option value="">選択してください</option>
                        <option value="proxy_onsite" ${type === 'proxy_onsite' ? 'selected' : ''}>代理出品（出張）</option>
                        <option value="proxy_shipping" ${type === 'proxy_shipping' ? 'selected' : ''}>代理出品（郵送）</option>
                        <option value="general">一般的なお問い合わせ</option>
                        <option value="technical">技術的な問題</option>
                        <option value="payment">決済について</option>
                        <option value="other">その他</option>
                    </select>
                </div>

                <!-- お名前 -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">お名前<span class="text-red-500">*</span></label>
                    <input type="text" id="name" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="山田太郎">
                </div>

                <!-- メールアドレス -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">メールアドレス<span class="text-red-500">*</span></label>
                    <input type="email" id="email" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="example@email.com">
                </div>

                <!-- 電話番号 -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">電話番号</label>
                    <input type="tel" id="phone" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="090-1234-5678">
                </div>

                <!-- 件名 -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">件名<span class="text-red-500">*</span></label>
                    <input type="text" id="subject" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="お問い合わせ内容を簡潔に">
                </div>

                <!-- お問い合わせ内容 -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">お問い合わせ内容<span class="text-red-500">*</span></label>
                    <textarea id="message" required rows="8" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none" placeholder="詳しくお書きください"></textarea>
                </div>

                <!-- 送信ボタン -->
                <button type="submit" id="submit-btn" class="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-all">
                    <i class="fas fa-paper-plane mr-2"></i>送信する
                </button>
            </form>

            <!-- お問い合わせ先情報 -->
            <div class="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">その他のお問い合わせ方法</h3>
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-phone text-blue-600"></i>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600">電話</div>
                            <div class="font-semibold text-gray-900">06-6151-3697</div>
                            <div class="text-xs text-gray-500">平日 10:00～17:00</div>
                        </div>
                    </div>
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-yellow-600"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-yellow-800">
                                    <strong>メールでのお問い合わせについて</strong><br>
                                    メールでのお問い合わせは受け付けておりません。<br>
                                    上記のお問い合わせフォームまたは電話をご利用ください。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('contact-form').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const submitBtn = document.getElementById('submit-btn')
                const originalText = submitBtn.innerHTML
                submitBtn.disabled = true
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>送信中...'
                
                try {
                    const formData = {
                        inquiry_type: document.getElementById('inquiry-type').value,
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('phone').value,
                        subject: document.getElementById('subject').value,
                        message: document.getElementById('message').value
                    }
                    
                    // TODO: お問い合わせAPI実装
                    // const response = await axios.post('/api/contact', formData)
                    
                    // 仮の成功処理
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    
                    alert('お問い合わせを送信しました。\\n担当者より2営業日以内にご連絡いたします。')
                    window.location.href = '/'
                } catch (error) {
                    console.error('Failed to send inquiry:', error)
                    alert('送信に失敗しました。もう一度お試しください。')
                    submitBtn.disabled = false
                    submitBtn.innerHTML = originalText
                }
            })
        </script>
    </body>
    </html>
  `)
})

// お気に入り一覧ページ
app.get('/favorites', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>お気に入り - PARTS HUB（パーツハブ）</title>
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
                <h1 class="text-red-500 font-bold text-lg">お気に入り</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-6xl mx-auto px-4 py-6">
            <!-- 商品グリッド -->
            <div id="favorites-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <!-- JavaScriptで動的に生成 -->
            </div>
            
            <!-- 空状態 -->
            <div id="empty-state" class="hidden text-center py-12">
                <div class="bg-white rounded-xl shadow-sm p-8">
                    <i class="fas fa-heart text-gray-400 text-6xl mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">お気に入りはまだありません</h2>
                    <p class="text-gray-600 mb-6">気になる商品をお気に入りに追加しましょう</p>
                    <a href="/" class="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                        商品を探す
                    </a>
                </div>
            </div>

            <!-- ローディング -->
            <div id="loading" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">読み込み中...</p>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const currentUserId = 1; // TODO: 実際のログインユーザーID
            
            // お気に入り一覧を読み込み
            async function loadFavorites() {
                try {
                    const response = await axios.get(\`/api/mypage/favorites/\${currentUserId}\`);
                    
                    document.getElementById('loading').classList.add('hidden');
                    
                    if (response.data.success && response.data.data.length > 0) {
                        const grid = document.getElementById('favorites-grid');
                        grid.innerHTML = response.data.data.map(item => \`
                            <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <a href="/products/\${item.id}" class="block relative">
                                    <img src="\${item.image_url}" alt="\${item.title}" class="w-full aspect-square object-cover">
                                    \${item.status === 'sold' ? '<div class="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center"><span class="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-lg">SOLD</span></div>' : ''}
                                </a>
                                <div class="p-3">
                                    <a href="/products/\${item.id}" class="block">
                                        <h3 class="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-red-500">\${item.title}</h3>
                                        <p class="text-lg font-bold text-red-500 mb-2">¥\${Number(item.price).toLocaleString()}</p>
                                    </a>
                                    <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                                        <span><i class="fas fa-heart mr-1"></i>\${item.favorite_count}</span>
                                        <span><i class="fas fa-comment mr-1"></i>\${item.comment_count}</span>
                                    </div>
                                    <button onclick="removeFavorite(\${item.id})" 
                                            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm font-semibold transition-colors">
                                        <i class="fas fa-heart-broken mr-1"></i>削除
                                    </button>
                                </div>
                            </div>
                        \`).join('');
                    } else {
                        document.getElementById('empty-state').classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Failed to load favorites:', error);
                    document.getElementById('loading').innerHTML = \`
                        <div class="bg-white rounded-xl shadow-sm p-8">
                            <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                            <p class="text-gray-900 font-semibold mb-2">読み込みに失敗しました</p>
                            <button onclick="loadFavorites()" class="text-red-500 hover:text-red-600 font-semibold">
                                <i class="fas fa-redo mr-1"></i>再試行
                            </button>
                        </div>
                    \`;
                }
            }
            
            // お気に入りから削除
            async function removeFavorite(productId) {
                if (!confirm('このお気に入りを削除しますか？')) return;
                
                try {
                    await axios.delete(\`/api/mypage/favorites/\${productId}\`, {
                        data: { user_id: currentUserId }
                    });
                    
                    // 再読み込み
                    document.getElementById('favorites-grid').innerHTML = '';
                    document.getElementById('loading').classList.remove('hidden');
                    await loadFavorites();
                } catch (error) {
                    console.error('Failed to remove favorite:', error);
                    alert('削除に失敗しました');
                }
            }
            
            // ページ読み込み時に実行
            loadFavorites();
        </script>

        ${Footer()}
    </body>
    </html>
  `)
})

// 検索ページ
app.get('/search', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>商品検索 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-4 py-3 sm:py-4">
                <div class="flex items-center gap-2 sm:gap-3">
                    <button onclick="window.location.href='/'" class="text-gray-600 hover:text-gray-900 flex-shrink-0">
                        <i class="fas fa-arrow-left text-lg sm:text-xl"></i>
                    </button>
                    <div class="flex-1 relative">
                        <input type="text" id="search-input" placeholder="商品名、メーカー、型番で検索" 
                               class="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm sm:text-base">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base"></i>
                    </div>
                </div>
                
                <!-- フィルター -->
                <div class="mt-3 sm:mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button onclick="toggleFilter()" class="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs sm:text-sm font-semibold hover:border-red-500 whitespace-nowrap flex-shrink-0">
                        <i class="fas fa-filter mr-1"></i>フィルター
                    </button>
                    <select id="sort-select" class="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs sm:text-sm font-semibold flex-shrink-0">
                        <option value="newest">新着順</option>
                        <option value="price_asc">価格が安い順</option>
                        <option value="price_desc">価格が高い順</option>
                        <option value="popular">人気順</option>
                    </select>
                </div>
            </div>
        </header>

        <!-- 詳細フィルターパネル -->
        <div id="filter-panel" class="hidden bg-white border-b border-gray-200">
            <div class="max-w-6xl mx-auto px-4 py-4 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">価格帯</label>
                        <div class="flex gap-2 items-center">
                            <input type="number" id="price-min" placeholder="最小" class="flex-1 px-3 py-2 border rounded-lg text-sm">
                            <span class="text-sm">〜</span>
                            <input type="number" id="price-max" placeholder="最大" class="flex-1 px-3 py-2 border rounded-lg text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">商品状態</label>
                        <select id="condition-select" class="w-full px-3 py-2 border rounded-lg">
                            <option value="">すべて</option>
                            <option value="new">新品</option>
                            <option value="like_new">未使用に近い</option>
                            <option value="good">良好</option>
                            <option value="acceptable">可</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="applyFilters()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold">
                        検索
                    </button>
                    <button onclick="clearFilters()" class="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold">
                        クリア
                    </button>
                </div>
            </div>
        </div>

        <main class="max-w-6xl mx-auto px-4 py-6">
            <!-- 検索結果ヘッダー -->
            <div id="result-header" class="hidden mb-4">
                <p class="text-gray-600"><span id="result-count" class="font-bold text-red-500">0</span> 件の商品が見つかりました</p>
            </div>

            <!-- 商品グリッド -->
            <div id="products-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <!-- JavaScriptで動的に生成 -->
            </div>
            
            <!-- 初期状態 -->
            <div id="initial-state" class="text-center py-12">
                <div class="bg-white rounded-xl shadow-sm p-8">
                    <i class="fas fa-search text-gray-400 text-6xl mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">商品を検索</h2>
                    <p class="text-gray-600">キーワードを入力して商品を検索してください</p>
                </div>
            </div>
            
            <!-- ローディング -->
            <div id="loading" class="hidden text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">検索中...</p>
            </div>
            
            <!-- 空状態 -->
            <div id="empty-state" class="hidden text-center py-12">
                <div class="bg-white rounded-xl shadow-sm p-8">
                    <i class="fas fa-inbox text-gray-400 text-6xl mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">商品が見つかりませんでした</h2>
                    <p class="text-gray-600">別のキーワードで検索してみてください</p>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let searchTimeout;
            
            // フィルターパネル切り替え
            function toggleFilter() {
                document.getElementById('filter-panel').classList.toggle('hidden');
            }
            
            // 検索実行
            async function performSearch() {
                const keyword = document.getElementById('search-input').value.trim();
                const sort = document.getElementById('sort-select').value;
                const priceMin = document.getElementById('price-min').value;
                const priceMax = document.getElementById('price-max').value;
                const condition = document.getElementById('condition-select').value;
                
                if (!keyword && !priceMin && !priceMax && !condition) {
                    document.getElementById('initial-state').classList.remove('hidden');
                    document.getElementById('result-header').classList.add('hidden');
                    document.getElementById('products-grid').innerHTML = '';
                    return;
                }
                
                // ローディング表示
                document.getElementById('initial-state').classList.add('hidden');
                document.getElementById('empty-state').classList.add('hidden');
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('result-header').classList.add('hidden');
                
                try {
                    const params = new URLSearchParams();
                    if (keyword) params.append('keyword', keyword);
                    if (sort) params.append('sort', sort);
                    if (priceMin) params.append('price_min', priceMin);
                    if (priceMax) params.append('price_max', priceMax);
                    if (condition) params.append('condition', condition);
                    
                    const response = await axios.get(\`/api/products/search?\${params.toString()}\`);
                    
                    document.getElementById('loading').classList.add('hidden');
                    
                    if (response.data.success && response.data.products.length > 0) {
                        document.getElementById('result-count').textContent = response.data.products.length;
                        document.getElementById('result-header').classList.remove('hidden');
                        
                        const grid = document.getElementById('products-grid');
                        grid.innerHTML = response.data.products.map(product => \`
                            <a href="/products/\${product.id}" class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
                                <div class="relative">
                                    <img src="\${product.image_url}" alt="\${product.title}" class="w-full aspect-square object-cover">
                                    \${product.status === 'sold' ? '<div class="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center"><span class="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-lg">SOLD</span></div>' : ''}
                                </div>
                                <div class="p-3">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">\${product.title}</h3>
                                    <p class="text-lg font-bold text-red-500 mb-2">¥\${Number(product.price).toLocaleString()}</p>
                                    <div class="flex items-center justify-between text-xs text-gray-500">
                                        <span><i class="fas fa-heart mr-1"></i>\${product.favorite_count || 0}</span>
                                        <span><i class="fas fa-comment mr-1"></i>\${product.comment_count || 0}</span>
                                    </div>
                                </div>
                            </a>
                        \`).join('');
                    } else {
                        document.getElementById('empty-state').classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Search failed:', error);
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('empty-state').classList.remove('hidden');
                }
            }
            
            // フィルター適用
            function applyFilters() {
                performSearch();
            }
            
            // フィルタークリア
            function clearFilters() {
                document.getElementById('price-min').value = '';
                document.getElementById('price-max').value = '';
                document.getElementById('condition-select').value = '';
                performSearch();
            }
            
            // 検索入力の監視（デバウンス）
            document.getElementById('search-input').addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(performSearch, 500);
            });
            
            // ソート変更時
            document.getElementById('sort-select').addEventListener('change', performSearch);
            
            // URLパラメータから検索キーワードを取得
            const urlParams = new URLSearchParams(window.location.search);
            const initialKeyword = urlParams.get('q');
            if (initialKeyword) {
                document.getElementById('search-input').value = initialKeyword;
                performSearch();
            }
        </script>

        ${Footer()}
    </body>
    </html>
  `)
})

// プライバシーポリシー
app.get('/privacy', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>プライバシーポリシー - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">プライバシーポリシー</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 space-y-6">
                <div>
                    <p class="text-sm text-gray-600 mb-4">最終更新日：2026年3月22日</p>
                    <p class="text-gray-700 leading-relaxed">
                        株式会社TCI（以下「当社」）が運営するPARTS HUB（パーツハブ）は、ユーザーの皆様の個人情報保護の重要性を認識し、個人情報の保護に関する法律を遵守し、適切に取り扱います。
                    </p>
                </div>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">1. 事業者情報</h2>
                    <div class="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                        <p><strong>事業者名：</strong>株式会社TCI</p>
                        <p><strong>代表者：</strong>代表取締役 尾崎俊行</p>
                        <p><strong>所在地：</strong>〒532-0000 大阪府大阪市淀川区新高1-5-4</p>
                        <p><strong>電話番号：</strong>06-6151-3697</p>
                        <p><strong>受付時間：</strong>平日 10:00～17:00（土日祝日を除く）</p>
                    </div>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">2. 収集する個人情報</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">当社は、以下の情報を収集します：</p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>登録情報：</strong>氏名、メールアドレス、電話番号、住所、生年月日</li>
                        <li><strong>取引情報：</strong>出品・購入履歴、支払情報、配送先情報</li>
                        <li><strong>本人確認情報：</strong>運転免許証、マイナンバーカードなどの本人確認書類（必要な場合のみ）</li>
                        <li><strong>銀行口座情報：</strong>売上金の振込先情報</li>
                        <li><strong>アクセス情報：</strong>IPアドレス、Cookie、閲覧履歴</li>
                        <li><strong>お問い合わせ内容：</strong>カスタマーサポートとのやりとり</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">3. 個人情報の利用目的</h2>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>本サービスの提供、運営、維持</li>
                        <li>会員登録、本人確認、認証</li>
                        <li>商品の売買取引の仲介と管理</li>
                        <li>代金の決済、売上金の支払い</li>
                        <li>商品の配送手配</li>
                        <li>カスタマーサポート対応</li>
                        <li>利用規約違反の調査、不正行為の防止</li>
                        <li>サービス改善のための統計データ分析</li>
                        <li>重要なお知らせ、キャンペーン情報の通知</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">4. 第三者への情報提供</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>ユーザーの同意がある場合：</strong>取引相手への配送先情報の提供など</li>
                        <li><strong>業務委託先への提供：</strong>決済代行会社、配送業者、カスタマーサポート業者など（機密保持契約を締結）</li>
                        <li><strong>法令に基づく場合：</strong>裁判所、警察などの公的機関からの要請</li>
                        <li><strong>緊急の場合：</strong>人の生命、身体、財産の保護のために必要な場合</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">5. 個人情報の保管と管理</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">当社は、以下のセキュリティ対策を実施しています：</p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>SSL/TLS暗号化通信による情報の保護</li>
                        <li>アクセス制限による不正アクセスの防止</li>
                        <li>定期的なセキュリティ監査とシステム更新</li>
                        <li>個人情報取扱責任者の設置</li>
                        <li>従業員への個人情報保護に関する教育</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">6. Cookieの使用</h2>
                    <p class="text-gray-700 leading-relaxed">
                        当社は、サービスの利便性向上のためCookieを使用します。Cookieの設定は、ブラウザの設定から変更できますが、一部機能が利用できなくなる場合があります。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">7. 個人情報の開示・訂正・削除</h2>
                    <p class="text-gray-700 leading-relaxed">
                        ユーザーは、自身の個人情報について、開示・訂正・利用停止・削除を請求できます。マイページから変更いただくか、<a href="/contact" class="text-red-500 hover:underline">お問い合わせフォーム</a>よりご連絡ください。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">8. 個人情報保護方針の変更</h2>
                    <p class="text-gray-700 leading-relaxed">
                        当社は、法令の変更やサービスの改善に伴い、本ポリシーを変更することがあります。重要な変更がある場合は、サイト上で事前に通知します。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">9. お問い合わせ</h2>
                    <div class="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                        <p class="mb-2">個人情報の取り扱いに関するお問い合わせ：</p>
                        <p><strong>株式会社TCI 個人情報保護窓口</strong></p>
                        <p>〒532-0000 大阪府大阪市淀川区新高1-5-4</p>
                        <p>電話：06-6151-3697</p>
                        <p>受付時間：平日 10:00～17:00</p>
                        <p class="mt-2">または<a href="/contact" class="text-red-500 hover:underline font-semibold">お問い合わせフォーム</a>よりご連絡ください。</p>
                    </div>
                </section>
            </div>
        </main>

        ${Footer()}
    </body>
    </html>
  `)
})

// 利用規約
app.get('/terms', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>利用規約 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">利用規約</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 space-y-6">
                <div>
                    <p class="text-sm text-gray-600 mb-4">最終更新日：2026年3月22日</p>
                    <p class="text-gray-700 leading-relaxed mb-4">
                        この利用規約（以下「本規約」）は、株式会社TCI（以下「当社」）が運営するPARTS HUB（パーツハブ、以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく前に、必ずお読みください。
                    </p>
                    <div class="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed text-sm">
                        <p><strong>運営会社：</strong>株式会社TCI</p>
                        <p><strong>代表者：</strong>代表取締役 尾崎俊行</p>
                        <p><strong>所在地：</strong>〒532-0000 大阪府大阪市淀川区新高1-5-4</p>
                        <p><strong>電話：</strong>06-6151-3697</p>
                    </div>
                </div>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第1条（本規約への同意）</h2>
                    <p class="text-gray-700 leading-relaxed">
                        ユーザーは、本規約に同意した上で本サービスを利用するものとします。本サービスの利用を開始した時点で、本規約に同意したものとみなします。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第2条（本サービスの内容）</h2>
                    <p class="text-gray-700 leading-relaxed mb-2">本サービスは、自動車部品の売買を仲介するマーケットプレイスです。主な機能：</p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>自動車部品の出品・購入</li>
                        <li>出品者と購入者のメッセージ機能</li>
                        <li>商品の検索・閲覧</li>
                        <li>代理出品サービス（オプション）</li>
                    </ul>
                    <p class="text-gray-700 leading-relaxed mt-3 text-sm">
                        ※当社は取引の仲介を行うものであり、売買契約の当事者ではありません。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第3条（利用登録）</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        本サービスの利用を希望する者は、以下の条件を満たす必要があります：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>18歳以上であること（未成年者は保護者の同意が必要）</li>
                        <li>反社会的勢力に該当しないこと</li>
                        <li>過去に本サービスから退会処分を受けていないこと</li>
                        <li>真実かつ正確な情報を登録すること</li>
                    </ul>
                    <p class="text-gray-700 leading-relaxed mt-3">
                        当社は、登録申請を審査し、不適切と判断した場合は登録を拒否することができます。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第4条（禁止事項）</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">ユーザーは、以下の行為を行ってはなりません：</p>
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">1. 法令違反行為</h3>
                            <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                                <li>盗品、偽造品、違法薬物などの出品・購入</li>
                                <li>著作権、商標権、特許権などの知的財産権を侵害する行為</li>
                                <li>児童ポルノや暴力的コンテンツの掲載</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">2. 不正行為</h3>
                            <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                                <li>虚偽の情報を登録する行為</li>
                                <li>他人のアカウントを不正に利用する行為</li>
                                <li>複数アカウントの作成（当社が認めた場合を除く）</li>
                                <li>なりすまし行為</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">3. 取引に関する行為</h3>
                            <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                                <li>商品を発送しない、または代金を支払わない</li>
                                <li>説明と異なる商品を発送する</li>
                                <li>本サービス外で直接取引を行う</li>
                                <li>不当に高額または低額な価格設定</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">4. システムへの攻撃</h3>
                            <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                                <li>不正アクセス、ハッキング</li>
                                <li>ウイルスやマルウェアの送信</li>
                                <li>サーバーへの過度な負荷をかける行為</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">5. その他</h3>
                            <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                                <li>誹謗中傷、ハラスメント</li>
                                <li>スパム行為、過度な宣伝</li>
                                <li>公序良俗に反する行為</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第5条（取引の成立と責任）</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        購入者が購入ボタンを押した時点で、売買契約が成立します。当社は取引の仲介のみを行い、以下について責任を負いません：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>商品の品質、適合性、安全性</li>
                        <li>出品者・購入者間のトラブル</li>
                        <li>配送中の事故や遅延</li>
                        <li>商品の瑕疵や不具合</li>
                    </ul>
                    <p class="text-gray-700 leading-relaxed mt-3 text-sm bg-yellow-50 p-3 rounded">
                        <strong>⚠️ 重要：</strong>当社は商品の検品や動作確認を行いません。購入前に必ず出品者に質問し、納得した上で購入してください。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第6条（手数料）</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        本サービスの利用には、以下の手数料が発生します：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>販売手数料：</strong>商品価格の7%（税込）</li>
                        <li><strong>振込手数料：</strong>売上金の出金時に200円</li>
                        <li><strong>代理出品手数料：</strong>別途料金表に基づく</li>
                    </ul>
                    <p class="text-gray-700 leading-relaxed mt-3 text-sm">
                        手数料は予告なく変更する場合があります。変更前に成立した取引には変更前の手数料が適用されます。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第7条（返品・キャンセル）</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        原則として、購入後のキャンセルや返品はできません。ただし、以下の場合は返品を受け付けます：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>商品が説明と著しく異なる場合</li>
                        <li>商品に重大な欠陥がある場合</li>
                        <li>出品者が商品を発送しない場合</li>
                    </ul>
                    <p class="text-gray-700 leading-relaxed mt-3 text-sm">
                        返品を希望する場合は、商品到着後3日以内にカスタマーサポートにご連絡ください。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第8条（アカウントの停止・削除）</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        当社は、以下の場合にアカウントを停止または削除することができます：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>本規約に違反した場合</li>
                        <li>6ヶ月以上ログインがない場合</li>
                        <li>支払いや配送の遅延が複数回ある場合</li>
                        <li>悪質なクレームや迷惑行為が認められた場合</li>
                    </ul>
                    <p class="text-gray-700 leading-relaxed mt-3 text-sm">
                        アカウント削除時、未払いの手数料や売上金は精算されます。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第9条（サービスの変更・停止）</h2>
                    <p class="text-gray-700 leading-relaxed">
                        当社は、以下の場合にサービスの全部または一部を停止できます：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
                        <li>システムメンテナンスの実施</li>
                        <li>サーバーやネットワークの障害</li>
                        <li>法令の改正</li>
                        <li>天災や不可抗力</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第10条（免責事項）</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        当社は、以下について一切の責任を負いません：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>ユーザー間のトラブルや紛争</li>
                        <li>商品の品質や適合性</li>
                        <li>配送業者による遅延や事故</li>
                        <li>システム障害による損害</li>
                        <li>第三者による不正アクセス</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第11条（準拠法・管轄裁判所）</h2>
                    <p class="text-gray-700 leading-relaxed">
                        本規約は日本法に基づいて解釈されます。本サービスに関する紛争は、大阪地方裁判所を第一審の専属的合意管轄裁判所とします。
                    </p>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">第12条（お問い合わせ）</h2>
                    <div class="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                        <p class="mb-2"><strong>株式会社TCI カスタマーサポート</strong></p>
                        <p>〒532-0000 大阪府大阪市淀川区新高1-5-4</p>
                        <p>電話：06-6151-3697（平日 10:00～17:00）</p>
                        <p class="mt-2">または<a href="/contact" class="text-red-500 hover:underline font-semibold">お問い合わせフォーム</a>よりご連絡ください。</p>
                    </div>
                </section>
            </div>
        </main>

        ${Footer()}
    </body>
    </html>
  `)
})

// パスワードリセット
app.get('/password-reset', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>パスワード再設定 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-red-50 to-pink-50 min-h-screen flex items-center justify-center px-4">
        <div class="max-w-md w-full">
            <!-- ロゴ -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-red-500 mb-2">PARTS HUB</h1>
                <p class="text-gray-600">パスワード再設定</p>
            </div>

            <!-- フォーム -->
            <div class="bg-white rounded-2xl shadow-xl p-8">
                <div id="step1">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-key text-red-500 text-2xl"></i>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900 mb-2">パスワードをお忘れですか？</h2>
                        <p class="text-sm text-gray-600">登録済みのメールアドレスを入力してください。<br>パスワード再設定用のリンクをお送りします。</p>
                    </div>

                    <form id="reset-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">メールアドレス</label>
                            <div class="relative">
                                <input type="email" id="email" required
                                       class="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                                       placeholder="example@email.com">
                                <i class="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>

                        <button type="submit" id="submit-btn"
                                class="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 px-6 rounded-lg font-bold transition-all shadow-lg">
                            再設定リンクを送信
                        </button>
                    </form>

                    <div class="mt-6 text-center">
                        <a href="/login" class="text-red-500 hover:text-red-600 font-semibold text-sm">
                            <i class="fas fa-arrow-left mr-1"></i>ログインに戻る
                        </a>
                    </div>
                </div>

                <div id="step2" class="hidden text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check text-green-500 text-2xl"></i>
                    </div>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">送信完了</h2>
                    <p class="text-sm text-gray-600 mb-6">
                        入力されたメールアドレス宛に、パスワード再設定用のリンクを送信しました。<br>
                        メールをご確認ください。
                    </p>
                    <p class="text-xs text-gray-500 mb-6">
                        ※メールが届かない場合は、迷惑メールフォルダをご確認ください。
                    </p>
                    <a href="/login" class="inline-block bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold transition-colors">
                        ログインページへ
                    </a>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('reset-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submit-btn');
                const email = document.getElementById('email').value;
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>送信中...';
                
                try {
                    // TODO: 実際のAPI呼び出し
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // ステップ2を表示
                    document.getElementById('step1').classList.add('hidden');
                    document.getElementById('step2').classList.remove('hidden');
                } catch (error) {
                    alert('送信に失敗しました。もう一度お試しください。');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '再設定リンクを送信';
                }
            });
        </script>
    </body>
    </html>
  `)
})

// セキュリティポリシー
app.get('/security', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>セキュリティポリシー - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">セキュリティポリシー</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 space-y-6">
                <div>
                    <p class="text-sm text-gray-600 mb-4">最終更新日：2026年3月22日</p>
                    <p class="text-gray-700 leading-relaxed">
                        株式会社TCIが運営するPARTS HUB（パーツハブ）は、ユーザーの皆様に安心してご利用いただけるよう、以下のセキュリティ対策を実施しています。
                    </p>
                </div>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">1. 通信の暗号化</h2>
                    <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-3">
                        <div class="flex items-center">
                            <i class="fas fa-lock text-green-600 text-2xl mr-3"></i>
                            <div>
                                <p class="font-semibold text-green-900">SSL/TLS暗号化通信を採用</p>
                                <p class="text-sm text-green-700">全てのページでHTTPS通信を使用し、データを暗号化して保護しています。</p>
                            </div>
                        </div>
                    </div>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>ログイン情報、個人情報、決済情報などすべての通信を暗号化</li>
                        <li>最新のTLS 1.3プロトコルを使用</li>
                        <li>第三者による盗聴や改ざんを防止</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">2. パスワードの保護</h2>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>ハッシュ化：</strong>パスワードは一方向ハッシュ関数で暗号化して保存</li>
                        <li><strong>ソルト付加：</strong>レインボーテーブル攻撃への対策を実施</li>
                        <li><strong>パスワード要件：</strong>8文字以上、英数字の組み合わせを推奨</li>
                        <li><strong>二段階認証：</strong>今後、オプションで提供予定</li>
                    </ul>
                    <div class="bg-yellow-50 p-4 rounded-lg mt-3">
                        <p class="text-sm text-gray-700">
                            <strong>⚠️ パスワード管理のお願い：</strong>他のサービスと同じパスワードを使い回さないでください。定期的な変更をおすすめします。
                        </p>
                    </div>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">3. 決済情報の保護</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        クレジットカード情報など決済に関する情報は、当社のサーバーに保存されません：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>PCI DSS準拠：</strong>国際的なカード情報セキュリティ基準に準拠した決済代行会社を利用</li>
                        <li><strong>トークン化：</strong>カード情報は暗号化されたトークンとして処理</li>
                        <li><strong>3Dセキュア対応：</strong>本人認証サービスに対応</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">4. アクセス制限とログ管理</h2>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>個人情報へのアクセスは、必要最小限の担当者のみに制限</li>
                        <li>すべてのアクセスログを記録し、定期的に監視</li>
                        <li>不正アクセスの検知システムを導入</li>
                        <li>複数回のログイン失敗でアカウントを一時ロック</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">5. データバックアップ</h2>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>ユーザーデータは毎日自動バックアップ</li>
                        <li>複数の地理的に離れた場所に分散保存</li>
                        <li>災害時の迅速な復旧体制を整備</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">6. 脆弱性対策</h2>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>システムの定期的なセキュリティ診断を実施</li>
                        <li>脆弱性が発見された場合、速やかに修正</li>
                        <li>最新のセキュリティパッチを適用</li>
                        <li>外部の専門機関による監査を実施</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">7. 従業員教育</h2>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>全従業員に対してセキュリティ教育を実施</li>
                        <li>個人情報保護に関する社内規程を整備</li>
                        <li>秘密保持契約の締結</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">8. 不正利用の防止</h2>
                    <div class="space-y-3">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-900 mb-2">24時間監視体制</h3>
                            <p class="text-sm text-blue-800">不審な取引や不正アクセスを自動検知し、速やかに対応します。</p>
                        </div>
                        <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>異常なログインパターンの検知</li>
                            <li>高額取引の自動チェック</li>
                            <li>同一IPからの大量アクセスの遮断</li>
                            <li>フィッシングサイト対策</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">9. ユーザーの皆様へのお願い</h2>
                    <div class="bg-red-50 border-l-4 border-red-500 p-4">
                        <ul class="space-y-2 text-gray-700 text-sm">
                            <li>✅ パスワードは他人に教えないでください</li>
                            <li>✅ 共有パソコンではログアウトを忘れずに</li>
                            <li>✅ 不審なメールやリンクにご注意ください</li>
                            <li>✅ 公式サイト以外でのログインにご注意ください</li>
                            <li>✅ 不審な動きを発見したら速やかにご連絡ください</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">10. セキュリティインシデント発生時の対応</h2>
                    <p class="text-gray-700 leading-relaxed mb-3">
                        万が一、セキュリティ事故が発生した場合：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>直ちに被害の拡大防止措置を実施</li>
                        <li>影響を受けるユーザーへ速やかに通知</li>
                        <li>関係機関（警察、個人情報保護委員会など）へ報告</li>
                        <li>原因の究明と再発防止策の実施</li>
                    </ul>
                </section>

                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-3">11. お問い合わせ</h2>
                    <div class="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                        <p class="mb-2">セキュリティに関するお問い合わせ：</p>
                        <p><strong>株式会社TCI セキュリティ窓口</strong></p>
                        <p>〒532-0000 大阪府大阪市淀川区新高1-5-4</p>
                        <p>電話：06-6151-3697（平日 10:00～17:00）</p>
                        <p class="mt-2">または<a href="/contact" class="text-red-500 hover:underline font-semibold">お問い合わせフォーム</a>よりご連絡ください。</p>
                    </div>
                </section>
            </div>
        </main>

        ${Footer()}
    </body>
    </html>
  `)
})

// 特定商取引法に基づく表記
app.get('/legal', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>特定商取引法に基づく表記 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">特定商取引法に基づく表記</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 space-y-6">
                <div>
                    <p class="text-sm text-gray-600 mb-4">最終更新日：2026年3月22日</p>
                    <p class="text-gray-700 leading-relaxed">
                        PARTS HUB（パーツハブ）における特定商取引法に基づく表記は以下の通りです。
                    </p>
                </div>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">販売業者</h2>
                    <p class="text-gray-700">株式会社TCI</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">運営責任者</h2>
                    <p class="text-gray-700">代表取締役 尾崎俊行</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">所在地</h2>
                    <p class="text-gray-700">〒532-0000</p>
                    <p class="text-gray-700">大阪府大阪市淀川区新高1-5-4</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">電話番号</h2>
                    <p class="text-gray-700">06-6151-3697</p>
                    <p class="text-sm text-gray-600">受付時間：平日 10:00～17:00（土日祝日を除く）</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">お問い合わせ</h2>
                    <p class="text-gray-700 mb-2"><a href="/contact" class="text-red-500 hover:underline font-semibold">お問い合わせフォーム</a>をご利用ください</p>
                    <p class="text-sm text-gray-600">※メールでのお問い合わせは受け付けておりません。お問い合わせフォームよりご連絡ください。</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">サービス内容</h2>
                    <p class="text-gray-700 mb-2">自動車部品のオンラインマーケットプレイス</p>
                    <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                        <li>自動車部品の売買仲介サービス</li>
                        <li>代理出品サービス</li>
                        <li>その他関連サービス</li>
                    </ul>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">販売価格</h2>
                    <p class="text-gray-700 mb-2">各商品ページに表示される価格（税込）</p>
                    <p class="text-sm text-gray-600">※商品価格は出品者が設定します</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">手数料</h2>
                    <div class="space-y-2 text-gray-700">
                        <p><strong>販売手数料：</strong>商品価格の7%（税込）</p>
                        <p><strong>振込手数料：</strong>売上金の出金時に200円</p>
                        <p><strong>代理出品手数料：</strong>サービス内容により異なります（別途お見積り）</p>
                    </div>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">商品代金以外の必要料金</h2>
                    <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>配送料（商品・配送方法により異なります）</li>
                        <li>インターネット接続料金</li>
                        <li>振込手数料（銀行振込の場合）</li>
                    </ul>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">支払方法</h2>
                    <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>クレジットカード決済（Visa、Mastercard、JCB、American Express）</li>
                        <li>コンビニ決済</li>
                        <li>銀行振込</li>
                        <li>キャリア決済（docomo、au、SoftBank）</li>
                    </ul>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">支払時期</h2>
                    <p class="text-gray-700">商品購入時に即時決済</p>
                    <p class="text-sm text-gray-600">※商品が発送されるまで、代金は当社が一時預かりします</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">商品の引渡時期</h2>
                    <p class="text-gray-700 mb-2">出品者により異なります（通常1～7日程度）</p>
                    <p class="text-sm text-gray-600">※各商品ページの「発送までの日数」をご確認ください</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">返品・交換について</h2>
                    <div class="space-y-3 text-gray-700">
                        <div>
                            <p class="font-semibold mb-2">返品可能な場合：</p>
                            <ul class="list-disc list-inside space-y-1 ml-4 text-sm">
                                <li>商品が説明と著しく異なる場合</li>
                                <li>商品に重大な欠陥がある場合</li>
                                <li>出品者が商品を発送しない場合</li>
                            </ul>
                        </div>
                        <div>
                            <p class="font-semibold mb-2">返品期限：</p>
                            <p class="text-sm">商品到着後3日以内にご連絡ください</p>
                        </div>
                        <div>
                            <p class="font-semibold mb-2">返品送料：</p>
                            <p class="text-sm">出品者の責めに帰すべき事由の場合は出品者負担、それ以外は購入者負担</p>
                        </div>
                        <div class="bg-yellow-50 p-3 rounded">
                            <p class="text-sm"><strong>注意：</strong>原則として購入後のキャンセルや返品はできません。購入前に必ず商品説明をご確認ください。</p>
                        </div>
                    </div>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">キャンセルについて</h2>
                    <div class="space-y-2 text-gray-700">
                        <p class="font-semibold">購入後のキャンセル：</p>
                        <p class="text-sm">原則として購入後のキャンセルはできません。ただし、以下の場合は例外とします：</p>
                        <ul class="list-disc list-inside space-y-1 ml-4 text-sm">
                            <li>出品者が7日以内に発送しない場合</li>
                            <li>出品者が取引を承諾しない場合</li>
                            <li>その他、当社が正当と認める理由がある場合</li>
                        </ul>
                    </div>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">不良品・誤送品の対応</h2>
                    <p class="text-gray-700 mb-2">商品到着後3日以内にカスタマーサポートまでご連絡ください。</p>
                    <p class="text-sm text-gray-600">確認の上、返品・交換または返金にて対応いたします。</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">免責事項</h2>
                    <div class="space-y-2 text-gray-700 text-sm">
                        <p>当社は取引の仲介を行うものであり、商品の品質・適合性・安全性について責任を負いません。</p>
                        <p>商品に関する問い合わせは、購入前に必ず出品者にご確認ください。</p>
                    </div>
                </section>

                <section>
                    <h2 class="text-lg font-bold text-gray-900 mb-3">お問い合わせ</h2>
                    <div class="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                        <p class="mb-2"><strong>株式会社TCI カスタマーサポート</strong></p>
                        <p>〒532-0000 大阪府大阪市淀川区新高1-5-4</p>
                        <p>電話：06-6151-3697（平日 10:00～17:00）</p>
                        <p class="mt-2"><a href="/contact" class="text-red-500 hover:underline font-semibold">お問い合わせフォーム</a>よりご連絡ください。</p>
                    </div>
                </section>
            </div>
        </main>

        ${Footer()}
    </body>
    </html>
  `)
})

// FAQページ
app.get('/faq', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>よくある質問（FAQ） - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBの利用方法、手数料、配送、返品などについてのよくある質問をまとめています。">
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">

        <!-- 構造化データ（JSON-LD） - FAQ -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [{
            "@type": "Question",
            "name": "PARTS HUB（パーツハブ）とは何ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "PARTS HUB（パーツハブ）は、自動車整備工場向けの部品売買プラットフォームです。手軽に、トヨタ、日産、ホンダなどの純正部品や工具を出品・購入できます。株式会社TCIが運営しています。"
            }
          },{
            "@type": "Question",
            "name": "誰が利用できますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "自動車整備工場、解体業者、部品販売業者が出品でき、整備工場、車検業者、個人のDIYユーザーが購入できます。会員登録（無料）が必要です。"
            }
          },{
            "@type": "Question",
            "name": "手数料はいくらですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "販売手数料は商品価格の7%（税込）です。振込手数料は売上金の出金時に200円かかります。購入者は商品代金と配送料のみで、購入手数料は無料です。"
            }
          },{
            "@type": "Question",
            "name": "どんな商品が売買されていますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "エンジン、ミッション、ドアパネル、バンパー、ヘッドライト、テールランプ、マフラー、タイヤ、ホイール、整備工具など、自動車に関するあらゆる部品を取り扱っています。主な対応メーカー：トヨタ、日産、ホンダ、マツダ、スバル、ダイハツ、スズキ、三菱など国内全メーカーに対応しています。"
            }
          },{
            "@type": "Question",
            "name": "配送方法はどうなっていますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ヤマト運輸、佐川急便、日本郵便など、出品者が選択した配送方法で発送されます。大型部品（エンジン、ミッションなど）の場合は、路線便や直接引き取りも可能です。配送料は商品ページに記載されています。"
            }
          },{
            "@type": "Question",
            "name": "返品・返金は可能ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "商品が説明と異なる場合、破損していた場合は返品・返金が可能です。商品到着後7日以内にお問い合わせフォームよりご連絡ください。お客様都合での返品は原則受け付けておりません。"
            }
          },{
            "@type": "Question",
            "name": "支払い方法は何がありますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "クレジットカード決済（Visa、Mastercard、JCB、American Express）、コンビニ決済、銀行振込に対応しています。クレジットカード決済が最も迅速です。"
            }
          },{
            "@type": "Question",
            "name": "出品するにはどうすればいいですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "会員登録後、「出品する」ボタンから商品情報（写真、タイトル、説明、価格など）を入力するだけで簡単に出品できます。出品は無料で、売れた時のみ販売手数料7%が発生します。"
            }
          },{
            "@type": "Question",
            "name": "売上金の受け取り方法は？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "商品が購入者に届き、取引が完了すると売上金が確定します。マイページから銀行口座を登録し、出金申請を行うことで指定口座に振り込まれます（振込手数料200円）。最低出金額は1,000円からです。"
            }
          },{
            "@type": "Question",
            "name": "代理出品サービスとは何ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "大量の在庫や出品作業が困難な場合、当社スタッフがお客様に代わって撮影・出品・発送までを代行するサービスです。出張代理出品と郵送代理出品の2種類があります。詳細はお問い合わせください。"
            }
          }]
        }
        </script>

        <!-- Open Graph -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="よくある質問（FAQ） - PARTS HUB">
        <meta property="og:description" content="PARTS HUBの利用方法、手数料、配送、返品などについてのよくある質問">
        <meta property="og:url" content="https://parts-hub.com/faq">
        
        <!-- Canonical URL -->
        <link rel="canonical" href="https://parts-hub.com/faq">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-lg">よくある質問</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-8">
            <!-- ページ説明 -->
            <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-3">
                    <i class="fas fa-question-circle text-red-500 mr-2"></i>
                    よくある質問（FAQ）
                </h2>
                <p class="text-gray-700">
                    PARTS HUB（パーツハブ）の利用方法、手数料、配送、返品などについて、よくいただく質問をまとめています。
                    ご不明な点がございましたら、<a href="/contact" class="text-red-500 hover:underline font-semibold">お問い合わせフォーム</a>よりお気軽にご連絡ください。
                </p>
            </div>

            <!-- FAQ一覧 -->
            <div class="space-y-4">
                <!-- FAQ 1 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq1')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                PARTS HUB（パーツハブ）とは何ですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq1"></i>
                    </button>
                    <div id="faq1" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 leading-relaxed">
                                <strong>PARTS HUB（パーツハブ）</strong>は、自動車整備工場向けの部品売買プラットフォームです。
                                手軽に、トヨタ、日産、ホンダなどの純正部品や工具を出品・購入できます。
                                <strong>株式会社TCI</strong>が運営しており、全国の整備工場・解体業者・部品販売業者が利用しています。
                            </p>
                            <div class="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                                <p class="text-sm text-blue-900">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    <strong>特徴：</strong>整備工場専門、手軽な出品・購入、全国配送対応、安心の取引保証
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 2 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq2')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                誰が利用できますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq2"></i>
                    </button>
                    <div id="faq2" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="grid md:grid-cols-2 gap-4">
                                <div class="bg-white p-4 rounded border-2 border-green-200">
                                    <h4 class="font-bold text-green-700 mb-2">
                                        <i class="fas fa-store mr-1"></i>出品者
                                    </h4>
                                    <ul class="text-sm text-gray-700 space-y-1">
                                        <li>✓ 自動車整備工場</li>
                                        <li>✓ 解体業者</li>
                                        <li>✓ 部品販売業者</li>
                                        <li>✓ 法人・個人事業主</li>
                                    </ul>
                                </div>
                                <div class="bg-white p-4 rounded border-2 border-blue-200">
                                    <h4 class="font-bold text-blue-700 mb-2">
                                        <i class="fas fa-shopping-cart mr-1"></i>購入者
                                    </h4>
                                    <ul class="text-sm text-gray-700 space-y-1">
                                        <li>✓ 自動車整備工場</li>
                                        <li>✓ 車検業者</li>
                                        <li>✓ 個人のDIYユーザー</li>
                                        <li>✓ どなたでも購入可能</li>
                                    </ul>
                                </div>
                            </div>
                            <p class="text-sm text-gray-600 mt-3">
                                ※会員登録（無料）が必要です。18歳以上の方が対象です。
                            </p>
                        </div>
                    </div>
                </div>

                <!-- FAQ 3 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq3')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                手数料はいくらですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq3"></i>
                    </button>
                    <div id="faq3" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="space-y-3">
                                <div class="bg-white p-4 rounded border-2 border-red-200">
                                    <h4 class="font-bold text-red-700 mb-2">販売手数料</h4>
                                    <p class="text-2xl font-bold text-red-600 mb-1">7%（税込）</p>
                                    <p class="text-sm text-gray-600">商品が売れた時のみ発生します</p>
                                </div>
                                <div class="bg-white p-4 rounded border-2 border-yellow-200">
                                    <h4 class="font-bold text-yellow-700 mb-2">振込手数料</h4>
                                    <p class="text-2xl font-bold text-yellow-600 mb-1">200円</p>
                                    <p class="text-sm text-gray-600">売上金の出金時に1回のみ</p>
                                </div>
                                <div class="bg-white p-4 rounded border-2 border-blue-200">
                                    <h4 class="font-bold text-blue-700 mb-2">購入手数料</h4>
                                    <p class="text-2xl font-bold text-blue-600 mb-1">無料</p>
                                    <p class="text-sm text-gray-600">購入者は商品代金と配送料のみ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 4 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq4')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                どんな商品が売買されていますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq4"></i>
                    </button>
                    <div id="faq4" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-4">自動車に関するあらゆる部品を取り扱っています：</p>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div class="bg-white p-3 rounded text-center">
                                    <i class="fas fa-cog text-red-500 text-2xl mb-2"></i>
                                    <p class="text-sm font-semibold">エンジン</p>
                                </div>
                                <div class="bg-white p-3 rounded text-center">
                                    <i class="fas fa-tools text-red-500 text-2xl mb-2"></i>
                                    <p class="text-sm font-semibold">ミッション</p>
                                </div>
                                <div class="bg-white p-3 rounded text-center">
                                    <i class="fas fa-car text-red-500 text-2xl mb-2"></i>
                                    <p class="text-sm font-semibold">ドア・パネル</p>
                                </div>
                                <div class="bg-white p-3 rounded text-center">
                                    <i class="fas fa-lightbulb text-red-500 text-2xl mb-2"></i>
                                    <p class="text-sm font-semibold">ライト類</p>
                                </div>
                                <div class="bg-white p-3 rounded text-center">
                                    <i class="fas fa-circle text-red-500 text-2xl mb-2"></i>
                                    <p class="text-sm font-semibold">タイヤ・ホイール</p>
                                </div>
                                <div class="bg-white p-3 rounded text-center">
                                    <i class="fas fa-wrench text-red-500 text-2xl mb-2"></i>
                                    <p class="text-sm font-semibold">整備工具</p>
                                </div>
                            </div>
                            <p class="text-sm text-gray-600 mt-4">
                                <strong>対応メーカー：</strong>トヨタ、日産、ホンダ、マツダ、スバル、ダイハツ、スズキ、三菱など国内全メーカー対応
                            </p>
                        </div>
                    </div>
                </div>

                <!-- FAQ 5 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq5')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                配送方法はどうなっていますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq5"></i>
                    </button>
                    <div id="faq5" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">出品者が選択した配送方法で発送されます：</p>
                            <ul class="space-y-2 text-gray-700">
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                                    <span><strong>小型部品：</strong>ヤマト運輸、佐川急便、日本郵便</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                                    <span><strong>大型部品：</strong>路線便（エンジン、ミッションなど）</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                                    <span><strong>直接引き取り：</strong>近隣の場合は直接受け渡しも可能</span>
                                </li>
                            </ul>
                            <p class="text-sm text-gray-600 mt-3 bg-yellow-50 p-3 rounded">
                                <i class="fas fa-info-circle text-yellow-600 mr-1"></i>
                                配送料は商品ページに記載されています。大型部品は別途お見積りとなる場合があります。
                            </p>
                        </div>
                    </div>
                </div>

                <!-- FAQ 6 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq6')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                返品・返金は可能ですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq6"></i>
                    </button>
                    <div id="faq6" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="space-y-3">
                                <div class="bg-green-50 border-l-4 border-green-500 p-4">
                                    <h4 class="font-bold text-green-800 mb-2">
                                        <i class="fas fa-check-circle mr-1"></i>返品・返金可能な場合
                                    </h4>
                                    <ul class="text-sm text-green-800 space-y-1">
                                        <li>• 商品が説明と明らかに異なる場合</li>
                                        <li>• 商品が破損・故障していた場合</li>
                                        <li>• 配送中の事故で損傷した場合</li>
                                    </ul>
                                    <p class="text-xs text-green-700 mt-2">
                                        ※商品到着後7日以内にお問い合わせフォームよりご連絡ください
                                    </p>
                                </div>
                                <div class="bg-red-50 border-l-4 border-red-500 p-4">
                                    <h4 class="font-bold text-red-800 mb-2">
                                        <i class="fas fa-times-circle mr-1"></i>返品不可の場合
                                    </h4>
                                    <ul class="text-sm text-red-800 space-y-1">
                                        <li>• お客様都合での返品</li>
                                        <li>• イメージ違いなどの主観的理由</li>
                                        <li>• 使用後の返品</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 7 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq7')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                支払い方法は何がありますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq7"></i>
                    </button>
                    <div id="faq7" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="grid md:grid-cols-3 gap-4">
                                <div class="bg-white p-4 rounded text-center border-2 border-blue-200">
                                    <i class="fas fa-credit-card text-blue-500 text-3xl mb-2"></i>
                                    <h4 class="font-bold text-gray-900 mb-1">クレジットカード</h4>
                                    <p class="text-xs text-gray-600">Visa / Mastercard / JCB / Amex</p>
                                    <span class="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">おすすめ</span>
                                </div>
                                <div class="bg-white p-4 rounded text-center border-2 border-green-200">
                                    <i class="fas fa-store text-green-500 text-3xl mb-2"></i>
                                    <h4 class="font-bold text-gray-900 mb-1">コンビニ決済</h4>
                                    <p class="text-xs text-gray-600">セブン / ローソン / ファミマ</p>
                                </div>
                                <div class="bg-white p-4 rounded text-center border-2 border-yellow-200">
                                    <i class="fas fa-university text-yellow-500 text-3xl mb-2"></i>
                                    <h4 class="font-bold text-gray-900 mb-1">銀行振込</h4>
                                    <p class="text-xs text-gray-600">各種銀行対応</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 8 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq8')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                出品するにはどうすればいいですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq8"></i>
                    </button>
                    <div id="faq8" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-4">簡単3ステップで出品できます：</p>
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                                    <div>
                                        <h4 class="font-bold text-gray-900">写真をアップロード</h4>
                                        <p class="text-sm text-gray-600">商品の写真を最大10枚まで登録</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                                    <div>
                                        <h4 class="font-bold text-gray-900">商品情報を入力</h4>
                                        <p class="text-sm text-gray-600">タイトル、説明、価格、カテゴリなどを入力</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                                    <div>
                                        <h4 class="font-bold text-gray-900">出品完了</h4>
                                        <p class="text-sm text-gray-600">「出品する」ボタンを押すだけ</p>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 bg-blue-50 p-3 rounded">
                                <p class="text-sm text-blue-900">
                                    <i class="fas fa-star text-yellow-500 mr-1"></i>
                                    <strong>出品は無料！</strong>売れた時のみ販売手数料7%が発生します
                                </p>
                            </div>
                            <div class="mt-3 text-center">
                                <a href="/listing" class="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                                    <i class="fas fa-plus-circle mr-2"></i>今すぐ出品する
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 9 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq9')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                売上金の受け取り方法は？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq9"></i>
                    </button>
                    <div id="faq9" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-4">取引完了後、以下の流れで売上金を受け取れます：</p>
                            <div class="space-y-2 text-gray-700">
                                <div class="flex items-start">
                                    <i class="fas fa-arrow-right text-red-500 mr-2 mt-1"></i>
                                    <span>商品が購入者に届き、取引が完了すると売上金が確定</span>
                                </div>
                                <div class="flex items-start">
                                    <i class="fas fa-arrow-right text-red-500 mr-2 mt-1"></i>
                                    <span>マイページから銀行口座を登録</span>
                                </div>
                                <div class="flex items-start">
                                    <i class="fas fa-arrow-right text-red-500 mr-2 mt-1"></i>
                                    <span>出金申請を行う（最低1,000円から）</span>
                                </div>
                                <div class="flex items-start">
                                    <i class="fas fa-arrow-right text-red-500 mr-2 mt-1"></i>
                                    <span>指定口座に振込（振込手数料200円）</span>
                                </div>
                            </div>
                            <div class="mt-4 bg-yellow-50 p-3 rounded">
                                <p class="text-sm text-yellow-900">
                                    <i class="fas fa-clock mr-1"></i>
                                    振込は申請後、3～5営業日で完了します
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 10 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq10')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                代理出品サービスとは何ですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq10"></i>
                    </button>
                    <div id="faq10" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-4">
                                大量の在庫や出品作業が困難な場合、当社スタッフがお客様に代わって
                                <strong>撮影・出品・発送まで</strong>を代行するサービスです。
                            </p>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div class="bg-purple-50 p-4 rounded border-2 border-purple-200">
                                    <h4 class="font-bold text-purple-800 mb-2">
                                        <i class="fas fa-truck mr-1"></i>出張代理出品
                                    </h4>
                                    <p class="text-sm text-purple-800 mb-2">
                                        スタッフがお客様の工場・倉庫に伺い、現地で撮影・出品作業を行います。
                                    </p>
                                    <p class="text-xs text-purple-700">
                                        大量在庫の一括出品に最適
                                    </p>
                                </div>
                                <div class="bg-green-50 p-4 rounded border-2 border-green-200">
                                    <h4 class="font-bold text-green-800 mb-2">
                                        <i class="fas fa-box mr-1"></i>郵送代理出品
                                    </h4>
                                    <p class="text-sm text-green-800 mb-2">
                                        商品を当社に郵送いただき、当社で撮影・出品・発送を代行します。
                                    </p>
                                    <p class="text-xs text-green-700">
                                        少量の出品にも対応
                                    </p>
                                </div>
                            </div>
                            <div class="mt-4 text-center">
                                <a href="/contact?type=proxy_onsite" class="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition-colors mr-2">
                                    <i class="fas fa-truck mr-2"></i>出張代理出品
                                </a>
                                <a href="/contact?type=proxy_shipping" class="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                                    <i class="fas fa-box mr-2"></i>郵送代理出品
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- さらに質問がある場合 -->
            <div class="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
                <i class="fas fa-question-circle text-blue-500 text-4xl mb-4"></i>
                <h3 class="text-xl font-bold text-gray-900 mb-2">他にご質問はありますか？</h3>
                <p class="text-gray-700 mb-6">
                    上記で解決しない場合は、お気軽にお問い合わせください。<br>
                    平日10:00～17:00に対応いたします。
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="/contact" class="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                        <i class="fas fa-envelope mr-2"></i>お問い合わせフォーム
                    </a>
                    <a href="tel:06-6151-3697" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                        <i class="fas fa-phone mr-2"></i>06-6151-3697
                    </a>
                </div>
            </div>
        </main>

        ${Footer()}

        <script>
            function toggleFAQ(id) {
                const element = document.getElementById(id);
                const icon = document.getElementById('icon-' + id);
                
                if (element.classList.contains('hidden')) {
                    element.classList.remove('hidden');
                    icon.classList.add('rotate-180');
                } else {
                    element.classList.add('hidden');
                    icon.classList.remove('rotate-180');
                }
            }
        </script>
    </body>
    </html>
  `)
})

// Sitemap.xml生成
app.get('/sitemap.xml', async (c) => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- トップページ -->
  <url>
    <loc>https://parts-hub.com/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 主要ページ -->
  <url>
    <loc>https://parts-hub.com/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://parts-hub.com/listing</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://parts-hub.com/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- 法的ページ -->
  <url>
    <loc>https://parts-hub.com/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub.com/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub.com/security</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub.com/legal</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub.com/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

  c.header('Content-Type', 'application/xml; charset=utf-8');
  return c.body(xml);
})

// ========================================
// 管理画面（Admin Panel）
// ========================================

// 管理画面トップ（ダッシュボード）
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理画面 - PARTS HUB</title>
        <meta name="robots" content="noindex, nofollow">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- ヘッダー -->
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

        <div class="flex">
            <!-- サイドバー -->
            <aside class="w-64 bg-white shadow-lg min-h-screen">
                <nav class="p-4">
                    <a href="/admin" class="flex items-center px-4 py-3 mb-2 bg-red-50 text-red-600 rounded-lg">
                        <i class="fas fa-chart-line w-5"></i>
                        <span class="ml-3 font-medium">ダッシュボード</span>
                    </a>
                    <a href="/admin/users" class="flex items-center px-4 py-3 mb-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <i class="fas fa-users w-5"></i>
                        <span class="ml-3">ユーザー管理</span>
                    </a>
                    <a href="/admin/products" class="flex items-center px-4 py-3 mb-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <i class="fas fa-box w-5"></i>
                        <span class="ml-3">商品管理</span>
                    </a>
                    <a href="/admin/transactions" class="flex items-center px-4 py-3 mb-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <i class="fas fa-exchange-alt w-5"></i>
                        <span class="ml-3">取引管理</span>
                    </a>
                    <a href="/admin/reviews" class="flex items-center px-4 py-3 mb-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <i class="fas fa-star w-5"></i>
                        <span class="ml-3">レビュー管理</span>
                    </a>
                    <a href="/admin/reports" class="flex items-center px-4 py-3 mb-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <i class="fas fa-flag w-5"></i>
                        <span class="ml-3">通報管理</span>
                    </a>
                    <a href="/admin/sales" class="flex items-center px-4 py-3 mb-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <i class="fas fa-yen-sign w-5"></i>
                        <span class="ml-3">売上レポート</span>
                    </a>
                </nav>
            </aside>

            <!-- メインコンテンツ -->
            <main class="flex-1 p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h2>

                <!-- 統計カード -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <!-- 総売上 -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-green-100 rounded-lg">
                                <i class="fas fa-yen-sign text-2xl text-green-600"></i>
                            </div>
                            <span class="text-sm text-gray-500">今月</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-1">総売上</p>
                        <p class="text-2xl font-bold text-gray-800" id="total-sales">¥0</p>
                        <p class="text-xs text-green-600 mt-2">
                            <i class="fas fa-arrow-up"></i> +15.3% 前月比
                        </p>
                    </div>

                    <!-- 新規ユーザー -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-blue-100 rounded-lg">
                                <i class="fas fa-user-plus text-2xl text-blue-600"></i>
                            </div>
                            <span class="text-sm text-gray-500">今月</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-1">新規ユーザー</p>
                        <p class="text-2xl font-bold text-gray-800" id="new-users">0</p>
                        <p class="text-xs text-blue-600 mt-2">
                            <i class="fas fa-arrow-up"></i> +8.2% 前月比
                        </p>
                    </div>

                    <!-- 商品数 -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-purple-100 rounded-lg">
                                <i class="fas fa-box text-2xl text-purple-600"></i>
                            </div>
                            <span class="text-sm text-gray-500">出品中</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-1">出品商品数</p>
                        <p class="text-2xl font-bold text-gray-800" id="total-products">0</p>
                        <p class="text-xs text-purple-600 mt-2">
                            <i class="fas fa-arrow-up"></i> +12.5% 前月比
                        </p>
                    </div>

                    <!-- 取引数 -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center justify-between mb-4">
                            <div class="p-3 bg-orange-100 rounded-lg">
                                <i class="fas fa-handshake text-2xl text-orange-600"></i>
                            </div>
                            <span class="text-sm text-gray-500">今月</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-1">成立取引</p>
                        <p class="text-2xl font-bold text-gray-800" id="total-transactions">0</p>
                        <p class="text-xs text-orange-600 mt-2">
                            <i class="fas fa-arrow-up"></i> +20.1% 前月比
                        </p>
                    </div>
                </div>

                <!-- 最近のアクティビティ -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- 最近の取引 -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-exchange-alt mr-2 text-red-500"></i>
                            最近の取引
                        </h3>
                        <div id="recent-transactions" class="space-y-3">
                            <div class="flex justify-center items-center py-8">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 最近の登録ユーザー -->
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-user-plus mr-2 text-blue-500"></i>
                            最近の登録ユーザー
                        </h3>
                        <div id="recent-users" class="space-y-3">
                            <div class="flex justify-center items-center py-8">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 通報・要対応 -->
                <div class="mt-6 bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2 text-yellow-500"></i>
                        要対応事項
                    </h3>
                    <div id="alerts" class="space-y-3">
                        <div class="flex justify-center items-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // ダッシュボードデータ読み込み
            async function loadDashboard() {
                try {
                    // 統計データ取得
                    const stats = await axios.get('/api/admin/stats');
                    document.getElementById('total-sales').textContent = '¥' + stats.data.totalSales.toLocaleString();
                    document.getElementById('new-users').textContent = stats.data.newUsers;
                    document.getElementById('total-products').textContent = stats.data.totalProducts;
                    document.getElementById('total-transactions').textContent = stats.data.totalTransactions;

                    // 最近の取引
                    const transactions = await axios.get('/api/admin/transactions/recent');
                    renderRecentTransactions(transactions.data);

                    // 最近のユーザー
                    const users = await axios.get('/api/admin/users/recent');
                    renderRecentUsers(users.data);

                    // 要対応事項
                    const alerts = await axios.get('/api/admin/alerts');
                    renderAlerts(alerts.data);
                } catch (error) {
                    console.error('データ読み込みエラー:', error);
                }
            }

            function renderRecentTransactions(transactions) {
                const container = document.getElementById('recent-transactions');
                if (transactions.length === 0) {
                    container.innerHTML = '<p class="text-gray-500 text-center py-4">取引データがありません</p>';
                    return;
                }
                
                container.innerHTML = transactions.map(tx => \`
                    <div class="flex items-center justify-between p-3 border-b hover:bg-gray-50">
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">\${tx.product_title}</p>
                            <p class="text-sm text-gray-500">\${tx.buyer_name} → \${tx.seller_name}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-gray-800">¥\${tx.amount.toLocaleString()}</p>
                            <span class="text-xs px-2 py-1 rounded \${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                                \${tx.status}
                            </span>
                        </div>
                    </div>
                \`).join('');
            }

            function renderRecentUsers(users) {
                const container = document.getElementById('recent-users');
                if (users.length === 0) {
                    container.innerHTML = '<p class="text-gray-500 text-center py-4">ユーザーデータがありません</p>';
                    return;
                }
                
                container.innerHTML = users.map(user => \`
                    <div class="flex items-center justify-between p-3 border-b hover:bg-gray-50">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-gray-500"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">\${user.name}</p>
                                <p class="text-sm text-gray-500">\${user.email}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-500">\${new Date(user.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                    </div>
                \`).join('');
            }

            function renderAlerts(alerts) {
                const container = document.getElementById('alerts');
                if (alerts.length === 0) {
                    container.innerHTML = '<p class="text-gray-500 text-center py-4">要対応事項はありません</p>';
                    return;
                }
                
                container.innerHTML = alerts.map(alert => \`
                    <div class="flex items-center justify-between p-4 border-l-4 \${alert.priority === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'} rounded">
                        <div class="flex-1">
                            <p class="font-medium text-gray-800">\${alert.title}</p>
                            <p class="text-sm text-gray-600 mt-1">\${alert.message}</p>
                        </div>
                        <a href="\${alert.link}" class="px-4 py-2 bg-white border rounded hover:bg-gray-50 text-sm">
                            対応する
                        </a>
                    </div>
                \`).join('');
            }

            // 初期読み込み
            loadDashboard();
        </script>
    </body>
    </html>
  `)
})

export default app
