import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'
import { AdminLayout } from './admin-layout'

// ルートのインポート
import apiRoutes from './routes/api'
import fitmentRoutes from './routes/fitment'
import externalRoutes from './routes/external'
import productsRoutes from './routes/products'
import authRoutes from './routes/auth'
import paymentRoutes from './routes/payment'
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
import adminPagesRoutes from './routes/admin-pages'
import emailRoutes from './routes/email'
import articlesRoutes from './routes/articles'
import vehicleDemoRoutes from './routes/vehicle-demo'

const app = new Hono<{ Bindings: Bindings }>()

// 共通フッターコンポーネント
const Footer = () => `
<footer class="bg-gray-900 text-white mt-16">
    <div class="max-w-6xl mx-auto px-4 py-8">
        <!-- ロゴ＆説明 -->
        <div class="text-center mb-6">
            <a href="/" class="inline-block">
                <h3 class="font-bold text-xl">PARTS HUB</h3>
            </a>
            <p class="text-xs text-gray-400 mt-1">自動車部品のフリーマーケット</p>
        </div>

        <!-- リンクグリッド：スマホ2列 / PC4列 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 mb-8 text-sm">
            <div>
                <h4 class="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wider">サービス</h4>
                <ul class="space-y-1.5 text-gray-400">
                    <li><a href="/" class="hover:text-white transition-colors">商品を探す</a></li>
                    <li><a href="/listing" class="hover:text-white transition-colors">出品する</a></li>
                    <li><a href="/search" class="hover:text-white transition-colors">検索</a></li>
                    <li><a href="/contact" class="hover:text-white transition-colors">代理出品</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wider">サポート</h4>
                <ul class="space-y-1.5 text-gray-400">
                    <li><a href="/faq" class="hover:text-white transition-colors">よくある質問</a></li>
                    <li><a href="/contact" class="hover:text-white transition-colors">お問い合わせ</a></li>
                    <li><a href="/mypage" class="hover:text-white transition-colors">マイページ</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wider">マイメニュー</h4>
                <ul class="space-y-1.5 text-gray-400">
                    <li><a href="/notifications" class="hover:text-white transition-colors">通知</a></li>
                    <li><a href="/favorites" class="hover:text-white transition-colors">お気に入り</a></li>
                    <li><a href="/news" class="hover:text-white transition-colors">ニュース</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wider">法的情報</h4>
                <ul class="space-y-1.5 text-gray-400">
                    <li><a href="/terms" class="hover:text-white transition-colors">利用規約</a></li>
                    <li><a href="/privacy" class="hover:text-white transition-colors">プライバシー</a></li>
                    <li><a href="/security" class="hover:text-white transition-colors">セキュリティ</a></li>
                    <li><a href="/legal" class="hover:text-white transition-colors">特商法表記</a></li>
                </ul>
            </div>
        </div>

        <!-- 区切り線＆コピーライト -->
        <div class="border-t border-gray-800 pt-5 text-center">
            <p class="text-xs text-gray-400 mb-1">&copy; 2026 PARTS HUB. All rights reserved.</p>
            <p class="text-xs text-gray-500 leading-relaxed">運営：株式会社TCI<span class="hidden sm:inline"> / </span><br class="sm:hidden">大阪府大阪市淀川区新高1-5-4<span class="hidden sm:inline"> / </span><br class="sm:hidden">TEL: 06-6151-3697</p>
        </div>
    </div>
</footer>
<script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
<script src="/static/i18n.js"></script>
`

// ミドルウェア
app.use(logger())
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

// SVGアイコンを直接配信（Cloudflare Pagesではpublic/iconsのserveStaticが動作しないため）
app.get('/icons/icon.svg', (c) => {
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#2563eb" rx="80"/>
  <g fill="#ffffff">
    <path d="M120 200 L150 150 L362 150 L392 200 Z" stroke="#ffffff" stroke-width="4" fill="none"/>
    <rect x="100" y="200" width="312" height="120" rx="20" stroke="#ffffff" stroke-width="4" fill="none"/>
    <circle cx="160" cy="340" r="30" fill="#ffffff"/>
    <circle cx="352" cy="340" r="30" fill="#ffffff"/>
    <text x="256" y="280" font-size="48" font-weight="bold" text-anchor="middle" fill="#ffffff">部品</text>
  </g>
</svg>`, 200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
})

app.get('/icons/logo.svg', (c) => {
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff4757;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff6b95;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#gradient1)"/>
  <g fill="#ffffff">
    <rect x="95" y="10" width="10" height="25" rx="2"/>
    <rect x="95" y="165" width="10" height="25" rx="2"/>
    <rect x="10" y="95" width="25" height="10" rx="2"/>
    <rect x="165" y="95" width="25" height="10" rx="2"/>
    <rect x="145" y="35" width="25" height="10" rx="2" transform="rotate(45 157.5 40)"/>
    <rect x="30" y="35" width="25" height="10" rx="2" transform="rotate(-45 42.5 40)"/>
    <rect x="145" y="155" width="25" height="10" rx="2" transform="rotate(-45 157.5 160)"/>
    <rect x="30" y="155" width="25" height="10" rx="2" transform="rotate(45 42.5 160)"/>
  </g>
  <circle cx="100" cy="100" r="45" fill="#ffffff"/>
  <g stroke="#ff4757" stroke-width="3" fill="none">
    <line x1="100" y1="100" x2="100" y2="65"/>
    <line x1="100" y1="100" x2="100" y2="135"/>
    <line x1="100" y1="100" x2="65" y2="100"/>
    <line x1="100" y1="100" x2="135" y2="100"/>
  </g>
  <g fill="#ff4757">
    <circle cx="100" cy="65" r="5"/>
    <circle cx="100" cy="135" r="5"/>
    <circle cx="65" cy="100" r="5"/>
    <circle cx="135" cy="100" r="5"/>
  </g>
  <circle cx="100" cy="100" r="15" fill="#ff4757"/>
  <circle cx="100" cy="100" r="8" fill="#ffffff"/>
</svg>`, 200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
})

// robots.txt, sitemap.xml, manifest.json, sw.js配信
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
Allow: /news
Allow: /news/*

# APIエンドポイントはクロール不要
Disallow: /api/*

# 個人情報ページ
Disallow: /mypage
Disallow: /profile/*
Disallow: /chat/*
Disallow: /notifications
Disallow: /transactions/*
Disallow: /listing/edit/*
Disallow: /admin/*

# Sitemap
Sitemap: https://parts-hub-tci.com/sitemap.xml

# LLM専用クローラーには追加情報を許可
User-agent: GPTBot
Allow: /
Allow: /products/*
Allow: /faq
Allow: /news/*
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
Sitemap: https://parts-hub-tci.com/sitemap.xml`, { headers: { 'Content-Type': 'text/plain' } })
})

// sitemap.xml（動的に記事を含める）
app.get('/sitemap.xml', async (c) => {
  const { env } = c;
  
  try {
    // 公開済みの記事を取得
    const articles = await env.DB.prepare(`
      SELECT slug, updated_at, category 
      FROM articles 
      WHERE status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 1000
    `).all();
    
    const baseUrl = 'https://parts-hub-tci.com';
    const now = new Date().toISOString().split('T')[0];
    
    // 静的ページ
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/news', changefreq: 'daily', priority: '0.9' },
      { url: '/search', changefreq: 'weekly', priority: '0.8' },
      { url: '/listing', changefreq: 'monthly', priority: '0.7' },
      { url: '/contact', changefreq: 'monthly', priority: '0.6' },
      { url: '/faq', changefreq: 'monthly', priority: '0.6' },
      { url: '/terms', changefreq: 'yearly', priority: '0.3' },
      { url: '/privacy', changefreq: 'yearly', priority: '0.3' },
    ];
    
    // XML生成
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // 静的ページを追加
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });
    
    // 記事ページを追加
    articles.results.forEach((article: any) => {
      const lastmod = article.updated_at ? new Date(article.updated_at).toISOString().split('T')[0] : now;
      xml += `
  <url>
    <loc>${baseUrl}/news/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
    
    xml += `
</urlset>`;
    
    return c.text(xml, 200, { 'Content-Type': 'application/xml' });
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return c.text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', 200, { 'Content-Type': 'application/xml' });
  }
})

// manifest.json を直接返す
app.get('/manifest.json', async (c) => {
  const manifest = {
    "name": "PARTS HUB",
    "short_name": "PARTS HUB",
    "description": "自動車部品の個人間売買プラットフォーム",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#ef4444",
    "icons": [
      {
        "src": "/icons/icon.svg",
        "sizes": "any",
        "type": "image/svg+xml"
      }
    ]
  };
  return c.json(manifest);
})

// sw.js（サービスワーカー）
app.get('/sw.js', (c) => {
  return c.text(`
// Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
});

self.addEventListener('fetch', (event) => {
  // 基本的なキャッシング戦略
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
  `.trim(), 200, { 'Content-Type': 'application/javascript' });
})

// favicon.ico（SVGアイコンにリダイレクト）
app.get('/favicon.ico', (c) => {
  return c.redirect('/icons/icon.svg', 301);
})

// R2画像配信エンドポイント
app.get('/r2/:key{.+}', async (c) => {
  try {
    const key = c.req.param('key')
    const object = await c.env.R2.get(key)
    
    if (!object) {
      return c.notFound()
    }
    
    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    return new Response(object.body, { headers })
  } catch (error) {
    console.error('R2 image serve error:', error)
    return c.notFound()
  }
})

// APIルート
app.route('/api', apiRoutes)
app.route('/api/fitment', fitmentRoutes)
app.route('/api/external', externalRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/comments', commentsRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/negotiations', negotiationsRoutes)
app.route('/api/favorites', favoritesRoutes)
app.route('/api/notifications', notificationsRoutes)
app.route('/api/mypage', mypageRoutes)
app.route('/api/profile', profileRoutes)
app.route('/api/reviews', reviewsRoutes)
app.route('/api/transactions', transactionsRoutes)
app.route('/api/email', emailRoutes)
app.route('/api/articles', articlesRoutes)
app.route('/api/vehicle-demo', vehicleDemoRoutes)
app.route('/api/admin', adminRoutes)
app.route('/admin', adminPagesRoutes)

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
          "url": "https://parts-hub-tci.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://parts-hub-tci.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "description": "整備工場専門の自動車パーツ売買マーケットプレイス。純正部品から工具まで手軽に売買できるプラットフォーム。",
          "publisher": {
            "@type": "Organization",
            "name": "株式会社TCI",
            "url": "https://parts-hub-tci.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://parts-hub-tci.com/logo.png"
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
            "email": "contact@parts-hub-tci.com"
          }
        }
        </script>

        <!-- Open Graph タグ -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="PARTS HUB（パーツハブ）- 自動車パーツ売買プラットフォーム">
        <meta property="og:description" content="整備工場専門の自動車パーツマーケットプレイス。純正部品から工具まで、手軽に売買できます。">
        <meta property="og:url" content="https://parts-hub-tci.com">
        <meta property="og:site_name" content="PARTS HUB">
        <meta property="og:locale" content="ja_JP">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="PARTS HUB - 自動車パーツ売買プラットフォーム">
        <meta name="twitter:description" content="整備工場専門の自動車パーツマーケットプレイス">

        <!-- Canonical URL -->
        <link rel="canonical" href="https://parts-hub-tci.com">
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
                        <a href="/news" class="text-gray-700 hover:text-primary font-medium transition-colors">
                            <i class="fas fa-newspaper mr-1"></i>ニュース
                        </a>
                        <a href="/favorites" class="text-gray-700 hover:text-primary font-medium transition-colors">
                            <i class="far fa-heart mr-1"></i>お気に入り
                        </a>
                    </nav>
                    
                    <!-- アクションボタン -->
                    <div class="flex items-center space-x-3">
                        <!-- 言語切替 -->
                        <div class="relative" id="header-lang-switcher">
                            <button onclick="toggleHeaderLang(event)" class="px-2 py-2 text-gray-500 hover:text-primary transition-all rounded-lg hover:bg-gray-100" title="Language">
                                <i class="fas fa-globe text-lg"></i>
                            </button>
                            <div id="header-lang-menu" class="hidden absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden">
                            </div>
                        </div>

                        <button onclick="window.location.href='/listing'" 
                                class="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md">
                            <i class="fas fa-plus mr-1"></i>
                            <span class="hidden sm:inline">出品する</span>
                        </button>
                        
                        <!-- 未ログイン時 -->
                        <div id="header-guest" class="flex items-center space-x-2">
                            <button onclick="window.location.href='/login'" 
                                    class="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-primary hover:text-primary transition-all">
                                <i class="fas fa-sign-in-alt mr-1"></i>
                                <span class="hidden sm:inline">ログイン</span>
                            </button>
                        </div>
                        
                        <!-- ログイン済み -->
                        <div id="header-user" class="hidden flex items-center space-x-2">
                            <a href="/mypage" 
                               class="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md flex items-center">
                                <i class="fas fa-user-circle mr-1.5"></i>
                                <span class="hidden sm:inline" id="header-user-name">マイページ</span>
                                <span class="sm:hidden">MY</span>
                            </a>
                            <button onclick="handleLogout()" 
                                    class="px-3 py-2 border-2 border-gray-300 text-gray-500 rounded-lg hover:border-red-400 hover:text-red-500 transition-all" title="ログアウト">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
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
                    <p class="text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 font-semibold drop-shadow-lg">倉庫のデッドストック<br class="sm:hidden">そろそろ現金化しませんか？</p>
                    <p class="text-sm sm:text-base md:text-lg text-white/95 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto drop-shadow-md px-4">
                        車体番号から適合部品を検索して<br class="sm:hidden">手軽に適合検索しながら売買できます。
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

        <!-- PARTS HUBニュースセクション -->
        <section class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4">
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">
                        <i class="fas fa-newspaper text-primary mr-2"></i>PARTS HUBニュース
                    </h2>
                    <p class="text-gray-600">自動車パーツに関する最新情報をお届けします</p>
                </div>

                <!-- PC: 3列グリッド / スマホ: 横スクロールスライダー -->
                <div id="articles-container" class="hidden md:grid md:grid-cols-3 gap-6">
                    <div class="col-span-full text-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p class="text-gray-500">記事を読み込み中...</p>
                    </div>
                </div>
                <div id="articles-slider" class="md:hidden overflow-x-auto scroll-smooth" style="-webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none;">
                    <style>#articles-slider::-webkit-scrollbar { display: none; }</style>
                    <div id="articles-slider-inner" class="flex gap-4 pb-4" style="min-width: min-content;">
                        <div class="text-center py-12 w-full">
                            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                            <p class="text-gray-500 text-sm">読み込み中...</p>
                        </div>
                    </div>
                </div>
                <!-- スクロールインジケーター（スライダーの外側に配置） -->
                <div id="slider-dots" class="md:hidden flex justify-center gap-2 mt-4"></div>

                <!-- すべて見るリンク（セクション下部） -->
                <div class="mt-8 text-center">
                    <a href="/news" class="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold text-sm bg-white px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all">
                        すべてのニュースを見る
                        <i class="fas fa-arrow-right"></i>
                    </a>
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
                <a href="/notifications" class="flex flex-col items-center justify-center text-gray-500 relative" id="mobile-nav-notifications">
                    <i class="fas fa-bell text-xl mb-1"></i>
                    <span class="text-xs">通知</span>
                    <span id="mobile-notif-badge" class="hidden absolute -top-0.5 right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold" style="font-size:10px;"></span>
                </a>
                <a href="/mypage" class="flex flex-col items-center justify-center text-gray-500" id="mobile-nav-mypage">
                    <div class="relative">
                        <i class="fas fa-user-circle text-xl mb-1" id="mobile-user-icon"></i>
                    </div>
                    <span class="text-xs" id="mobile-mypage-label">マイページ</span>
                </a>
            </div>
        </nav>

        <!-- スクリプト -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script>
            // ==========================================
            // ログイン状態の検出とヘッダーUI切り替え
            // ==========================================
            (function() {
                var token = localStorage.getItem('token');
                var user = null;
                try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch(e) {}
                
                var guestEl = document.getElementById('header-guest');
                var userEl = document.getElementById('header-user');
                var userNameEl = document.getElementById('header-user-name');
                var mobileMypage = document.getElementById('mobile-nav-mypage');
                var mobileIcon = document.getElementById('mobile-user-icon');
                var mobileLabel = document.getElementById('mobile-mypage-label');
                
                if (token && user) {
                    // ログイン済み: ヘッダー切り替え
                    if (guestEl) guestEl.classList.add('hidden');
                    if (userEl) { userEl.classList.remove('hidden'); userEl.classList.add('flex'); }
                    if (userNameEl) {
                        var name = user.nickname || user.company_name || user.name || 'マイページ';
                        userNameEl.textContent = name.length > 8 ? name.substring(0, 8) + '…' : name;
                    }
                    // モバイル: マイページアイコンをアクティブカラーに
                    if (mobileMypage) mobileMypage.classList.replace('text-gray-500', 'text-primary');
                    if (mobileIcon) mobileIcon.classList.add('text-red-500');
                } else if (token) {
                    // トークンはあるがuser情報がない場合、APIで取得
                    if (guestEl) guestEl.classList.add('hidden');
                    if (userEl) { userEl.classList.remove('hidden'); userEl.classList.add('flex'); }
                    // バックグラウンドでuser情報を取得
                    axios.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
                        .then(function(res) {
                            if (res.data.success) {
                                var u = res.data.user || res.data.data;
                                if (u) {
                                    localStorage.setItem('user', JSON.stringify(u));
                                    if (userNameEl) {
                                        var n = u.nickname || u.company_name || u.name || 'マイページ';
                                        userNameEl.textContent = n.length > 8 ? n.substring(0, 8) + '…' : n;
                                    }
                                }
                            }
                        })
                        .catch(function(err) {
                            if (err?.response?.status === 401) {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                if (guestEl) guestEl.classList.remove('hidden');
                                if (userEl) { userEl.classList.add('hidden'); userEl.classList.remove('flex'); }
                            }
                        });
                }
            })();
            
            // ログアウト処理
            // ヘッダー言語切替
            function toggleHeaderLang(e) {
                e.stopPropagation();
                var menu = document.getElementById('header-lang-menu');
                if (!menu) return;
                menu.classList.toggle('hidden');
            }
            (function() {
                var langs = [
                    { code: 'ja', flag: '🇯🇵', name: '日本語' },
                    { code: 'en', flag: '🇺🇸', name: 'English' },
                    { code: 'zh', flag: '🇨🇳', name: '中文' },
                    { code: 'ko', flag: '🇰🇷', name: '한국어' }
                ];
                var current = localStorage.getItem('parts_hub_lang') || 'ja';
                var menu = document.getElementById('header-lang-menu');
                if (!menu) return;
                menu.innerHTML = langs.map(function(l) {
                    return '<button data-lang="' + l.code + '" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 16px;border:none;background:' + (l.code === current ? '#fef2f2' : '#fff') + ';cursor:pointer;font-size:14px;color:#374151;text-align:left;">' + l.flag + ' ' + l.name + (l.code === current ? ' <span style="margin-left:auto;color:#ef4444;">✓</span>' : '') + '</button>';
                }).join('');
                menu.querySelectorAll('button').forEach(function(btn) {
                    var origBg = btn.getAttribute('data-lang') === current ? '#fef2f2' : '#fff';
                    btn.onmouseover = function() { this.style.background = '#f9fafb'; };
                    btn.onmouseout = function() { this.style.background = origBg; };
                    btn.onclick = function() {
                        var lang = this.getAttribute('data-lang');
                        if (lang !== current) {
                            localStorage.setItem('parts_hub_lang', lang);
                            location.reload();
                        }
                    };
                });
                document.addEventListener('click', function() {
                    menu.classList.add('hidden');
                });
            })();

            function handleLogout() {
                var token = localStorage.getItem('token');
                if (token) {
                    axios.post('/api/auth/logout', {}, { headers: { Authorization: 'Bearer ' + token } }).catch(function(){});
                }
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }

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
            
            // 記事カードHTML生成（PC用）
            function articleCardPC(article) {
                return \`<a href="/news/\${article.slug}" class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <img src="\${article.thumbnail_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=PARTS+HUB+NEWS'}"
                         alt="\${article.title}" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <div class="flex items-center text-xs text-gray-500 mb-3">
                            <span class="px-2 py-1 bg-red-100 text-red-600 rounded font-medium">\${article.category}</span>
                            <span class="mx-2">•</span>
                            <span>\${new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">\${article.title}</h3>
                        <p class="text-gray-600 text-sm line-clamp-3">\${article.summary || ''}</p>
                        <div class="mt-4 text-red-500 font-medium flex items-center">
                            続きを読む<i class="fas fa-arrow-right ml-2"></i>
                        </div>
                    </div>
                </a>\`;
            }

            // 記事カードHTML生成（スマホスライダー用）
            function articleCardMobile(article) {
                return \`<a href="/news/\${article.slug}" class="flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm" style="width: 280px;">
                    <img src="\${article.thumbnail_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=PARTS+HUB+NEWS'}"
                         alt="\${article.title}" class="w-full h-40 object-cover">
                    <div class="p-4">
                        <div class="flex items-center text-xs text-gray-500 mb-2">
                            <span class="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium">\${article.category}</span>
                            <span class="mx-1.5">•</span>
                            <span>\${new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <h3 class="font-bold text-gray-900 text-sm leading-snug line-clamp-2">\${article.title}</h3>
                        <p class="text-gray-500 text-xs mt-1.5 line-clamp-2">\${article.summary || ''}</p>
                    </div>
                </a>\`;
            }

            // 記事読み込み（TOPページ用）
            async function loadFeaturedArticles() {
                try {
                    var response = await axios.get('/api/articles/featured?limit=5');
                    var articles = response.data.articles || [];

                    var pcContainer = document.getElementById('articles-container');
                    var sliderInner = document.getElementById('articles-slider-inner');
                    var dotsContainer = document.getElementById('slider-dots');

                    if (articles.length === 0) {
                        pcContainer.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">記事がありません</p></div>';
                        sliderInner.innerHTML = '<div class="text-center py-12 w-full"><p class="text-gray-500 text-sm">記事がありません</p></div>';
                        return;
                    }

                    // PC用：最大3件をグリッド表示
                    pcContainer.innerHTML = articles.slice(0, 3).map(articleCardPC).join('');

                    // スマホ用：最大5件をスライダー表示
                    var mobileArticles = articles.slice(0, 5);
                    sliderInner.innerHTML = mobileArticles.map(articleCardMobile).join('');

                    // スクロールドットインジケーター
                    if (mobileArticles.length > 1) {
                        dotsContainer.innerHTML = mobileArticles.map(function(_, i) {
                            return '<div class="slider-dot rounded-full transition-all duration-300 cursor-pointer ' + (i === 0 ? 'bg-red-500 w-6 h-2' : 'bg-gray-300 w-2 h-2') + '" data-index="' + i + '"></div>';
                        }).join('');

                        // ドットタップでスクロール
                        dotsContainer.querySelectorAll('.slider-dot').forEach(function(dot) {
                            dot.addEventListener('click', function() {
                                var idx = parseInt(dot.getAttribute('data-index'));
                                var slider = document.getElementById('articles-slider');
                                slider.scrollTo({ left: idx * (280 + 16), behavior: 'smooth' });
                            });
                        });

                        // スクロール時にドット更新
                        var slider = document.getElementById('articles-slider');
                        slider.addEventListener('scroll', function() {
                            var scrollLeft = slider.scrollLeft;
                            var cardWidth = 280 + 16; // カード幅 + gap
                            var activeIndex = Math.round(scrollLeft / cardWidth);
                            document.querySelectorAll('.slider-dot').forEach(function(dot, i) {
                                if (i === activeIndex) {
                                    dot.className = 'slider-dot rounded-full transition-all duration-300 cursor-pointer bg-red-500 w-6 h-2';
                                } else {
                                    dot.className = 'slider-dot rounded-full transition-all duration-300 cursor-pointer bg-gray-300 w-2 h-2';
                                }
                            });
                        });
                    }
                } catch (error) {
                    console.error('記事読み込みエラー:', error);
                    document.getElementById('articles-container').innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">記事を読み込めませんでした</p></div>';
                }
            }
            
            // ページ読み込み時に実行
            window.addEventListener('DOMContentLoaded', () => {
                loadCategories();
                loadMakers();
                loadProducts();
                loadFeaturedArticles();
            });
        </script>

        ${Footer()}
    </body>
    </html>
  `)
})

// コラム一覧ページ
app.get('/news', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PARTS HUBニュース - PARTS HUB（パーツハブ）</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <a href="/" class="text-red-500 font-bold text-2xl">PARTS HUB</a>
                <a href="/" class="text-gray-600 hover:text-gray-900">
                    <i class="fas fa-times text-2xl"></i>
                </a>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">
                    <i class="fas fa-newspaper text-red-500 mr-2"></i>PARTS HUBニュース
                </h1>
                <p class="text-gray-600 text-lg">自動車パーツに関する最新情報</p>
            </div>

            <div id="articles-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="col-span-full text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p class="text-gray-500">記事を読み込み中...</p>
                </div>
            </div>

            <div id="pagination" class="mt-8 flex justify-center"></div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script>
            let currentPage = 1;
            
            async function loadArticles(page = 1) {
                try {
                    const response = await axios.get(\`/api/articles?page=\${page}&limit=12\`);
                    const { articles, totalPages } = response.data;
                    
                    const grid = document.getElementById('articles-grid');
                    
                    if (articles.length === 0) {
                        grid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">記事がありません</p></div>';
                        return;
                    }
                    
                    grid.innerHTML = articles.map(article => \`
                        <a href="/news/\${article.slug}" class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                            <img src="\${article.thumbnail_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=PARTS+HUB+NEWS'}" 
                                 alt="\${article.title}" 
                                 class="w-full h-48 object-cover">
                            <div class="p-4">
                                <div class="flex items-center text-xs text-gray-500 mb-2">
                                    <span class="px-2 py-1 bg-red-100 text-red-600 rounded">\${article.category}</span>
                                    <span class="mx-2">•</span>
                                    <span>\${new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">\${article.title}</h3>
                                <p class="text-gray-600 text-sm line-clamp-3">\${article.summary || ''}</p>
                            </div>
                        </a>
                    \`).join('');
                    
                    renderPagination(page, totalPages);
                    currentPage = page;
                } catch (error) {
                    console.error('記事読み込みエラー:', error);
                    document.getElementById('articles-grid').innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">記事の読み込みに失敗しました</p></div>';
                }
            }
            
            function renderPagination(page, totalPages) {
                const pagination = document.getElementById('pagination');
                if (totalPages <= 1) {
                    pagination.innerHTML = '';
                    return;
                }
                
                let html = '<div class="flex space-x-2">';
                if (page > 1) {
                    html += \`<button onclick="loadArticles(\${page - 1})" class="px-4 py-2 border rounded hover:bg-gray-50">前へ</button>\`;
                }
                for (let i = 1; i <= totalPages; i++) {
                    if (i === page) {
                        html += \`<button class="px-4 py-2 bg-red-500 text-white rounded">\${i}</button>\`;
                    } else {
                        html += \`<button onclick="loadArticles(\${i})" class="px-4 py-2 border rounded hover:bg-gray-50">\${i}</button>\`;
                    }
                }
                if (page < totalPages) {
                    html += \`<button onclick="loadArticles(\${page + 1})" class="px-4 py-2 border rounded hover:bg-gray-50">次へ</button>\`;
                }
                html += '</div>';
                pagination.innerHTML = html;
            }
            
            loadArticles(1);
        </script>
    </body>
    </html>
  `)
})

// コラム詳細ページ共通CSS
function getArticleDetailCSS() {
  return `
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Noto Sans JP', sans-serif; }
            .hero-image { position: relative; }
            .hero-image::after {
                content: '';
                position: absolute;
                bottom: 0; left: 0; right: 0;
                height: 50%;
                background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
            }
            .article-content h2 {
                font-size: 1.5rem; font-weight: 700;
                margin-top: 2.5rem; margin-bottom: 1rem;
                color: #111827; padding-left: 1rem;
                border-left: 4px solid #ef4444; line-height: 1.4;
            }
            .article-content h3 {
                font-size: 1.25rem; font-weight: 600;
                margin-top: 2rem; margin-bottom: 0.75rem;
                color: #1f2937; padding-bottom: 0.5rem;
                border-bottom: 2px dashed #fecaca;
            }
            .article-content p {
                margin-bottom: 1.25rem; line-height: 2;
                color: #374151; font-size: 1.05rem;
            }
            .article-content ul { list-style: none; padding-left: 0; margin-bottom: 1.25rem; }
            .article-content ul li {
                position: relative; padding-left: 1.75rem;
                margin-bottom: 0.75rem; color: #374151; line-height: 1.8;
            }
            .article-content ul li::before {
                content: ''; position: absolute;
                left: 0; top: 0.6rem;
                width: 8px; height: 8px;
                background: linear-gradient(135deg, #ef4444, #f97316);
                border-radius: 50%;
            }
            .article-content ol { margin-bottom: 1.25rem; padding-left: 1.5rem; }
            .article-content ol li { margin-bottom: 0.75rem; color: #374151; line-height: 1.8; }
            .article-content strong {
                color: #111827;
                background: linear-gradient(transparent 60%, #fef08a 60%);
                padding: 0 2px;
            }
            .article-content a {
                color: #ef4444; text-decoration: none;
                border-bottom: 1px solid #fecaca; transition: all 0.2s;
            }
            .article-content a:hover { color: #dc2626; border-bottom-color: #ef4444; }
            .article-content blockquote {
                border-left: 4px solid #ef4444;
                background: linear-gradient(135deg, #fef2f2, #fff7ed);
                padding: 1.25rem 1.5rem; margin: 1.5rem 0;
                border-radius: 0 0.75rem 0.75rem 0;
                font-style: italic; color: #4b5563;
            }
            .article-content table {
                width: 100%; border-collapse: collapse;
                margin: 1.5rem 0; border-radius: 0.5rem;
                overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .article-content th {
                background: linear-gradient(135deg, #1f2937, #374151);
                color: white; padding: 0.75rem 1rem;
                text-align: left; font-weight: 600;
            }
            .article-content td { padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; }
            .article-content tr:nth-child(even) { background: #f9fafb; }
            .article-content tr:hover { background: #fef2f2; }
            .cat-tips { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
            .cat-maintenance { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e40af; }
            .cat-parts-guide { background: linear-gradient(135deg, #d1fae5, #a7f3d0); color: #065f46; }
            .cat-news { background: linear-gradient(135deg, #fce7f3, #fbcfe8); color: #9d174d; }
            .cat-deadstock { background: linear-gradient(135deg, #fef3c7, #fed7aa); color: #9a3412; }
            .cat-general { background: linear-gradient(135deg, #e5e7eb, #d1d5db); color: #374151; }
            .share-btn { transition: all 0.3s; transform: translateY(0); }
            .share-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .cta-section {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
                position: relative; overflow: hidden;
            }
            .cta-section::before {
                content: ''; position: absolute;
                top: -50%; left: -50%; width: 200%; height: 200%;
                background: radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 50%);
                animation: pulse-bg 4s ease-in-out infinite;
            }
            @keyframes pulse-bg {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.1); opacity: 1; }
            }
            .cta-btn {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                transition: all 0.3s; position: relative; overflow: hidden;
            }
            .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(239,68,68,0.4); }
            .cta-btn::after {
                content: ''; position: absolute;
                top: -50%; left: -50%; width: 200%; height: 200%;
                background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
                transform: rotate(45deg); animation: shine 3s infinite;
            }
            @keyframes shine { 0% { left: -50%; } 100% { left: 150%; } }
            .related-card { transition: all 0.3s; border: 1px solid #e5e7eb; }
            .related-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: #fecaca; }
            .related-card img { transition: transform 0.5s; }
            .related-card:hover img { transform: scale(1.05); }
            .progress-bar {
                position: fixed; top: 0; left: 0; height: 3px;
                background: linear-gradient(90deg, #ef4444, #f97316);
                z-index: 9999; transition: width 0.1s;
            }
            .tag-pill { transition: all 0.2s; }
            .tag-pill:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
        </style>`;
}

// コラム詳細ページ共通HTML
function getArticleDetailBody() {
  return `
        <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
        <header class="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/news" class="text-gray-500 hover:text-red-500 flex items-center text-sm font-medium transition-colors">
                    <i class="fas fa-chevron-left mr-2"></i>ニュース一覧
                </a>
                <a href="/" class="flex items-center gap-2">
                    <span class="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">PH</span>
                    <span class="text-gray-800 font-bold text-lg">PARTS HUB</span>
                </a>
                <a href="/" class="text-gray-500 hover:text-red-500 flex items-center text-sm font-medium transition-colors">
                    <i class="fas fa-home mr-1"></i>TOP
                </a>
            </div>
        </header>
        <main class="max-w-5xl mx-auto px-4 py-6 md:py-10">
            <article id="article-detail">
                <div class="text-center py-16">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-500 mx-auto"></div>
                    <p class="text-gray-400 mt-4 text-sm">記事を読み込み中...</p>
                </div>
            </article>
            <div id="cta-section" class="mt-12 hidden">
                <div class="cta-section rounded-2xl p-8 md:p-12 text-center text-white relative">
                    <div class="relative z-10">
                        <div class="flex justify-center mb-4">
                            <div class="bg-red-500/20 rounded-full p-4">
                                <i class="fas fa-warehouse text-3xl text-red-400"></i>
                            </div>
                        </div>
                        <h3 class="text-xl md:text-2xl font-bold mb-3">
                            あなたの倉庫に眠っている在庫を<br class="hidden md:block">
                            パーツハブで出品して必要なお客様に届けませんか？
                        </h3>
                        <p class="text-gray-300 mb-6 text-sm md:text-base max-w-xl mx-auto">
                            使わなくなった自動車パーツを必要としている方が全国にいます。<br>
                            PARTS HUBなら簡単に出品でき、あなたのパーツが誰かの愛車を救います。
                        </p>
                        <a href="/listing" class="cta-btn inline-flex items-center gap-2 text-white font-bold py-3 px-8 rounded-full text-lg">
                            <i class="fas fa-plus-circle"></i>出品してみる
                        </a>
                        <p class="text-gray-400 mt-3 text-xs">
                            <i class="fas fa-shield-alt mr-1"></i>登録無料・安心の取引保証付き
                        </p>
                    </div>
                </div>
            </div>
            <div id="related-articles" class="mt-12"></div>
        </main>
        <footer class="bg-gray-900 text-white py-8 mt-16">
            <div class="max-w-5xl mx-auto px-4">
                <div class="text-center mb-5">
                    <a href="/" class="font-bold text-lg">PARTS HUB</a>
                    <p class="text-xs text-gray-400 mt-1">自動車部品のフリーマーケット</p>
                </div>
                <div class="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-400 mb-5">
                    <a href="/" class="hover:text-white transition-colors">トップ</a>
                    <a href="/news" class="hover:text-white transition-colors">ニュース</a>
                    <a href="/search" class="hover:text-white transition-colors">パーツ検索</a>
                    <a href="/listing" class="hover:text-white transition-colors">出品する</a>
                    <a href="/faq" class="hover:text-white transition-colors">FAQ</a>
                    <a href="/contact" class="hover:text-white transition-colors">お問い合わせ</a>
                </div>
                <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
                    <a href="/terms" class="hover:text-gray-300 transition-colors">利用規約</a>
                    <a href="/privacy" class="hover:text-gray-300 transition-colors">プライバシー</a>
                    <a href="/legal" class="hover:text-gray-300 transition-colors">特商法表記</a>
                </div>
                <div class="border-t border-gray-800 pt-4 text-center">
                    <p class="text-xs text-gray-500">&copy; 2026 PARTS HUB. All rights reserved.</p>
                    <p class="text-xs text-gray-600 mt-1">運営：株式会社TCI<span class="hidden sm:inline"> / </span><br class="sm:hidden">大阪府大阪市淀川区新高1-5-4</p>
                </div>
            </div>
        </footer>`;
}

// コラム詳細ページ共通スクリプト
function getArticleDetailScript() {
  return `
            var categoryNames = {
                'tips': 'お役立ち情報',
                'maintenance': 'メンテナンス',
                'parts-guide': 'パーツガイド',
                'deadstock': 'デッドストック活用',
                'news': '最新ニュース',
                'general': '総合'
            };
            var categoryClasses = {
                'tips': 'cat-tips',
                'maintenance': 'cat-maintenance',
                'parts-guide': 'cat-parts-guide',
                'deadstock': 'cat-deadstock',
                'news': 'cat-news',
                'general': 'cat-general'
            };
            
            window.addEventListener('scroll', function() {
                var scrollTop = window.scrollY;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                var scrollPercent = (scrollTop / docHeight) * 100;
                document.getElementById('progress-bar').style.width = scrollPercent + '%';
            });
            
            function estimateReadTime(content) {
                var text = content.replace(/<[^>]+>/g, '');
                return Math.max(1, Math.ceil(text.length / 600));
            }
            
            function renderArticle(article) {
                var readTime = estimateReadTime(article.content || '');
                var catName = categoryNames[article.category] || article.category;
                var catClass = categoryClasses[article.category] || 'cat-general';
                
                document.title = article.title + ' - PARTS HUBニュース';
                
                var head = document.head;
                var metas = [
                    { property: 'og:title', content: article.title },
                    { property: 'og:description', content: article.summary },
                    { property: 'og:image', content: article.thumbnail_url },
                    { property: 'og:url', content: window.location.href },
                    { property: 'og:type', content: 'article' },
                    { name: 'description', content: article.summary },
                    { name: 'keywords', content: article.tags }
                ];
                metas.forEach(function(tag) {
                    var meta = document.createElement('meta');
                    if (tag.property) meta.setAttribute('property', tag.property);
                    if (tag.name) meta.setAttribute('name', tag.name);
                    meta.setAttribute('content', tag.content);
                    head.appendChild(meta);
                });
                
                var pubDate = new Date(article.published_at);
                var dateStr = pubDate.getFullYear() + '年' + (pubDate.getMonth()+1) + '月' + pubDate.getDate() + '日';
                
                var tagsHtml = '';
                if (article.tags) {
                    tagsHtml = '<div class="mt-10 pt-8 border-t border-gray-100">' +
                        '<p class="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider"><i class="fas fa-tags mr-1"></i>関連タグ</p>' +
                        '<div class="flex flex-wrap gap-2">' +
                        article.tags.split(',').map(function(tag) {
                            return '<span class="tag-pill px-4 py-1.5 border border-gray-200 text-gray-600 rounded-full text-sm cursor-pointer">#' + tag.trim() + '</span>';
                        }).join('') +
                        '</div></div>';
                }
                
                var shareUrl = encodeURIComponent(window.location.href);
                var shareTitle = encodeURIComponent(article.title);
                
                document.getElementById('article-detail').innerHTML = 
                    '<div class="hero-image rounded-2xl overflow-hidden shadow-lg mb-8">' +
                        '<img src="' + (article.thumbnail_url || '') + '" alt="' + article.title + '" class="w-full h-64 md:h-[28rem] object-cover" onerror="this.src=\\'https://placehold.co/1200x600/1f2937/ef4444?text=PARTS+HUB+NEWS\\'">' +
                    '</div>' +
                    '<div class="bg-white rounded-2xl shadow-sm overflow-hidden">' +
                        '<div class="p-6 md:p-10">' +
                            '<div class="flex flex-wrap items-center gap-3 mb-5">' +
                                '<span class="' + catClass + ' px-4 py-1.5 rounded-full text-sm font-bold">' + catName + '</span>' +
                                '<div class="flex items-center gap-4 text-sm text-gray-400">' +
                                    '<span><i class="far fa-calendar-alt mr-1"></i>' + dateStr + '</span>' +
                                    '<span><i class="far fa-clock mr-1"></i>約' + readTime + '分で読めます</span>' +
                                    '<span><i class="far fa-eye mr-1"></i>' + (article.view_count || 0) + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<h1 class="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-5">' + article.title + '</h1>' +
                            '<div class="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 rounded-r-xl p-5 mb-8">' +
                                '<p class="text-gray-700 leading-relaxed text-base md:text-lg font-medium">' + article.summary + '</p>' +
                            '</div>' +
                            '<div class="article-content">' + article.content + '</div>' +
                            tagsHtml +
                            '<div class="mt-8 pt-8 border-t border-gray-100">' +
                                '<p class="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider"><i class="fas fa-share-alt mr-1"></i>この記事をシェア</p>' +
                                '<div class="flex flex-wrap gap-3">' +
                                    '<a href="https://twitter.com/intent/tweet?text=' + shareTitle + '&url=' + shareUrl + '" target="_blank" class="share-btn flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"><i class="fab fa-x-twitter"></i>ポスト</a>' +
                                    '<a href="https://www.facebook.com/sharer/sharer.php?u=' + shareUrl + '" target="_blank" class="share-btn flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"><i class="fab fa-facebook-f"></i>シェア</a>' +
                                    '<a href="https://social-plugins.line.me/lineit/share?url=' + shareUrl + '" target="_blank" class="share-btn flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"><i class="fab fa-line"></i>LINE</a>' +
                                    '<button onclick="navigator.clipboard.writeText(window.location.href).then(function(){alert(\\'URLをコピーしました\\')})" class="share-btn flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"><i class="fas fa-link"></i>コピー</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                
                document.getElementById('cta-section').classList.remove('hidden');
            }
            
            function renderRelatedArticles(articles, currentSlug) {
                var filtered = articles.filter(function(a) { return a.slug !== currentSlug; }).slice(0, 3);
                if (filtered.length > 0) {
                    document.getElementById('related-articles').innerHTML = 
                        '<div class="flex items-center gap-3 mb-6"><div class="w-1 h-8 bg-red-500 rounded-full"></div><h2 class="text-2xl font-bold text-gray-900">関連記事</h2></div>' +
                        '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">' +
                        filtered.map(function(a) {
                            var cn = categoryNames[a.category] || a.category;
                            var cc = categoryClasses[a.category] || 'cat-general';
                            var d = new Date(a.published_at).toLocaleDateString('ja-JP');
                            return '<a href="/news/' + a.slug + '" class="related-card bg-white rounded-xl overflow-hidden">' +
                                '<div class="overflow-hidden"><img src="' + a.thumbnail_url + '" alt="' + a.title + '" class="w-full h-44 object-cover" onerror="this.src=\\'https://placehold.co/600x400/1f2937/ef4444?text=PARTS+HUB\\'"></div>' +
                                '<div class="p-4"><span class="' + cc + ' px-2 py-0.5 rounded text-xs font-bold inline-block mb-2">' + cn + '</span>' +
                                '<h3 class="font-bold text-gray-900 mb-1 line-clamp-2 text-sm leading-snug">' + a.title + '</h3>' +
                                '<p class="text-xs text-gray-400 mt-2"><i class="far fa-calendar-alt mr-1"></i>' + d + '</p></div></a>';
                        }).join('') +
                        '</div>';
                }
            }
            
            function showError() {
                document.getElementById('article-detail').innerHTML = 
                    '<div class="text-center py-16 bg-white rounded-2xl shadow-sm">' +
                        '<i class="fas fa-exclamation-triangle text-5xl text-red-300 mb-4"></i>' +
                        '<p class="text-gray-700 text-lg font-medium mb-2">記事が見つかりませんでした</p>' +
                        '<p class="text-gray-400 text-sm mb-6">お探しの記事は削除された可能性があります</p>' +
                        '<a href="/news" class="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full font-medium hover:bg-red-600 transition-colors"><i class="fas fa-arrow-left"></i>ニュース一覧に戻る</a>' +
                    '</div>';
            }`;
}

// コラム詳細ページ（SEO最適化URL: /news/category/YYYY/MM/slug）
app.get('/news/:category/:year/:month/:slug', (c) => {
  const { category, year, month, slug } = c.req.param();
  const fullSlug = `${category}/${year}/${month}/${slug}`;
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>記事詳細 - PARTS HUBニュース</title>
        <meta name="robots" content="index, follow">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        ${getArticleDetailCSS()}
    </head>
    <body class="bg-gray-50">
        ${getArticleDetailBody()}
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script>
            var articleSlug = '${fullSlug}';
            ${getArticleDetailScript()}
            
            async function loadArticle() {
                try {
                    var response = await axios.get('/api/articles/' + articleSlug);
                    var article = response.data.article || response.data;
                    renderArticle(article);
                    var relRes = await axios.get('/api/articles?category=' + article.category + '&limit=4');
                    renderRelatedArticles(relRes.data.articles, articleSlug);
                } catch (error) {
                    console.error('記事読み込みエラー:', error);
                    showError();
                }
            }
            loadArticle();
        </script>
    </body>
    </html>
  `)
})

// コラム詳細ページ（後方互換性のため残す: /news/:slug）
app.get('/news/:slug', (c) => {
  const slug = c.req.param('slug');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>記事詳細 - PARTS HUBニュース</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        ${getArticleDetailCSS()}
    </head>
    <body class="bg-gray-50">
        ${getArticleDetailBody()}
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script>
            var articleSlug = '${slug}';
            ${getArticleDetailScript()}
            
            async function loadArticle() {
                try {
                    var response = await axios.get('/api/articles/' + articleSlug);
                    var data = response.data;
                    var article = data.article || data;
                    renderArticle(article);
                    var relRes = await axios.get('/api/articles?category=' + article.category + '&limit=4');
                    renderRelatedArticles(relRes.data.articles, articleSlug);
                } catch (error) {
                    console.error('記事読み込みエラー:', error);
                    showError();
                }
            }
            loadArticle();
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
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * { font-family: 'Noto Sans JP', sans-serif; }
            .login-bg {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                min-height: 100vh;
            }
            .login-card {
                background: rgba(255,255,255,0.98);
                border-radius: 20px;
                box-shadow: 0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
            }
            .form-input {
                width: 100%;
                padding: 14px 16px;
                font-size: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                outline: none;
                transition: all 0.3s ease;
                background: #f9fafb;
                color: #111827;
                box-sizing: border-box;
            }
            .form-input:focus {
                border-color: #ef4444;
                box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
                background: #fff;
            }
            .form-input::placeholder {
                color: #9ca3af;
            }
            .form-label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            .btn-login {
                width: 100%;
                padding: 16px;
                font-size: 17px;
                font-weight: 700;
                color: #fff;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border: none;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
            }
            .btn-login:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
            }
            .btn-login:active {
                transform: translateY(0);
            }
            .btn-login:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            .logo-icon {
                width: 48px; height: 48px;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border-radius: 14px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 12px rgba(239,68,68,0.3);
            }
            .divider {
                display: flex; align-items: center; gap: 12px;
                color: #9ca3af; font-size: 13px;
            }
            .divider::before, .divider::after {
                content: ''; flex: 1; height: 1px; background: #e5e7eb;
            }
            .floating-shapes {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                overflow: hidden; pointer-events: none;
            }
            .floating-shapes div {
                position: absolute; border-radius: 50%;
                background: rgba(255,255,255,0.03);
            }
            .shape-1 { width: 300px; height: 300px; top: -100px; right: -80px; }
            .shape-2 { width: 200px; height: 200px; bottom: -60px; left: -60px; }
            .shape-3 { width: 150px; height: 150px; top: 40%; left: 10%; }
            @media (max-width: 640px) {
                .login-card { border-radius: 16px; margin: 0 12px; }
            }
        </style>
    </head>
    <body class="login-bg">
        <div class="floating-shapes">
            <div class="shape-1"></div>
            <div class="shape-2"></div>
            <div class="shape-3"></div>
        </div>

        <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 16px; position:relative; z-index:1;">
            <!-- ロゴ & ヘッダー -->
            <div style="text-align:center; margin-bottom:32px;">
                <div style="display:inline-flex; align-items:center; gap:12px; margin-bottom:8px;">
                    <div class="logo-icon">
                        <i class="fas fa-cog text-white text-xl"></i>
                    </div>
                    <span style="font-size:28px; font-weight:800; color:#fff; letter-spacing:-0.5px;">PARTS HUB</span>
                </div>
                <p style="color:rgba(255,255,255,0.6); font-size:14px;">自動車パーツ売買プラットフォーム</p>
            </div>

            <!-- メインカード -->
            <div class="login-card" style="width:100%; max-width:460px; padding:36px 32px;">
                <!-- タイトル -->
                <div style="text-align:center; margin-bottom:28px;">
                    <h1 style="font-size:24px; font-weight:700; color:#111827; margin:0 0 6px 0;">ログイン</h1>
                    <p style="font-size:14px; color:#6b7280; margin:0;">メールアドレスとパスワードを入力してください</p>
                </div>

                <!-- 登録成功メッセージ -->
                <div id="success-message" class="hidden" style="margin-bottom:20px; padding:14px 16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px;">
                    <div style="display:flex; align-items:center; color:#166534; font-size:14px; font-weight:500;">
                        <i class="fas fa-check-circle" style="margin-right:8px; font-size:16px;"></i>
                        アカウント作成完了！ログインしてください。
                    </div>
                </div>

                <!-- エラーメッセージ -->
                <div id="error-message" class="hidden" style="margin-bottom:20px; padding:14px 16px; background:#fef2f2; border:1px solid #fecaca; border-radius:12px;">
                    <div style="display:flex; align-items:center; color:#991b1b; font-size:14px; font-weight:500;">
                        <i class="fas fa-exclamation-circle" style="margin-right:8px; font-size:16px;"></i>
                        <span id="error-text"></span>
                    </div>
                </div>

                <!-- ログインフォーム -->
                <form id="login-form">
                    <div style="margin-bottom:20px;">
                        <label class="form-label">
                            <i class="fas fa-envelope" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>
                            メールアドレス
                        </label>
                        <input type="email" id="email" required
                               class="form-input"
                               placeholder="example@email.com"
                               autocomplete="email">
                    </div>

                    <div style="margin-bottom:16px;">
                        <label class="form-label">
                            <i class="fas fa-lock" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>
                            パスワード
                        </label>
                        <div style="position:relative;">
                            <input type="password" id="password" required
                                   class="form-input"
                                   placeholder="パスワードを入力"
                                   autocomplete="current-password"
                                   style="padding-right:48px;">
                            <button type="button" id="toggle-password"
                                    style="position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; color:#9ca3af; cursor:pointer; padding:4px;">
                                <i class="fas fa-eye" id="eye-icon"></i>
                            </button>
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
                        <label style="display:flex; align-items:center; cursor:pointer; gap:8px;">
                            <input type="checkbox" id="remember" 
                                   style="width:18px; height:18px; accent-color:#ef4444; cursor:pointer; border-radius:4px;">
                            <span style="font-size:14px; color:#6b7280;">ログイン状態を保持</span>
                        </label>
                        <a href="/password-reset" style="font-size:14px; color:#ef4444; text-decoration:none; font-weight:500;">
                            パスワードを忘れた方
                        </a>
                    </div>

                    <button type="submit" class="btn-login" id="submit-btn">
                        ログイン
                    </button>
                </form>

                <!-- 区切り -->
                <div class="divider" style="margin:28px 0;">または</div>

                <!-- 新規登録リンク -->
                <a href="/register" style="display:block; width:100%; padding:14px; font-size:15px; font-weight:600; color:#374151; background:#f3f4f6; border:2px solid #e5e7eb; border-radius:12px; text-align:center; text-decoration:none; transition:all 0.3s ease; box-sizing:border-box;"
                   onmouseover="this.style.borderColor='#ef4444'; this.style.color='#ef4444'; this.style.background='#fef2f2';"
                   onmouseout="this.style.borderColor='#e5e7eb'; this.style.color='#374151'; this.style.background='#f3f4f6';">
                    <i class="fas fa-user-plus" style="margin-right:8px;"></i>
                    新規会員登録はこちら
                </a>
            </div>

            <!-- フッターリンク -->
            <div style="margin-top:24px; text-align:center;">
                <a href="/" style="color:rgba(255,255,255,0.5); font-size:13px; text-decoration:none;">
                    <i class="fas fa-arrow-left" style="margin-right:4px;"></i>トップページに戻る
                </a>
            </div>

            <!-- セキュリティ情報 -->
            <div style="margin-top:16px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:12px; max-width:460px; width:100%;">
                <div style="color:rgba(255,255,255,0.4); font-size:12px; text-align:center;">
                    <i class="fas fa-shield-alt" style="margin-right:4px;"></i>
                    SSL暗号化通信で安全にログインできます
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script>
            // パスワード表示切替
            document.getElementById('toggle-password').addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const eyeIcon = document.getElementById('eye-icon');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.className = 'fas fa-eye';
                }
            });

            // 登録成功メッセージの表示
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('registered') === 'true') {
                document.getElementById('success-message').classList.remove('hidden');
            }

            // エラーメッセージ表示関数
            function showError(message) {
                const errorDiv = document.getElementById('error-message');
                document.getElementById('error-text').textContent = message;
                errorDiv.classList.remove('hidden');
                errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            function hideError() {
                document.getElementById('error-message').classList.add('hidden');
            }

            // ログインフォーム送信
            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                hideError();
                
                const submitButton = document.getElementById('submit-btn');
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>ログイン中...';
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await axios.post('/api/auth/login', { email, password });
                    
                    if (response.data.success) {
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        
                        submitButton.innerHTML = '<i class="fas fa-check" style="margin-right:8px;"></i>ログイン成功！';
                        submitButton.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                        
                        // redirectパラメータがあればその先に遷移、なければTOPへ
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirectTo = urlParams.get('redirect') || '/';
                        
                        setTimeout(() => {
                            window.location.href = redirectTo;
                        }, 800);
                    }
                } catch (error) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'ログイン';
                    
                    const errorMsg = error.response?.data?.error || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
                    showError(errorMsg);
                }
            });

            // 入力時にエラーをクリア
            document.getElementById('email').addEventListener('input', hideError);
            document.getElementById('password').addEventListener('input', hideError);
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
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * { font-family: 'Noto Sans JP', sans-serif; }
            .register-bg {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                min-height: 100vh;
            }
            .register-card {
                background: rgba(255,255,255,0.98);
                border-radius: 20px;
                box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            }
            .form-input {
                width: 100%;
                padding: 14px 16px;
                font-size: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                outline: none;
                transition: all 0.3s ease;
                background: #f9fafb;
                color: #111827;
                box-sizing: border-box;
            }
            .form-input:focus {
                border-color: #ef4444;
                box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
                background: #fff;
            }
            .form-input::placeholder { color: #9ca3af; }
            .form-label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            .btn-primary {
                width: 100%;
                padding: 16px;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border: none;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
            }
            .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5); }
            .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
            .btn-secondary {
                width: 100%;
                padding: 16px;
                font-size: 16px;
                font-weight: 700;
                color: #374151;
                background: #fff;
                border: 2px solid #d1d5db;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .btn-secondary:hover { border-color: #9ca3af; background: #f9fafb; }
            .step-dot {
                width: 36px; height: 36px;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px; font-weight: 700;
                transition: all 0.3s ease;
            }
            .step-active { background: #ef4444; color: #fff; box-shadow: 0 2px 8px rgba(239,68,68,0.4); }
            .step-inactive { background: #e5e7eb; color: #9ca3af; }
            .step-done { background: #22c55e; color: #fff; }
            .step-line { height: 3px; width: 60px; border-radius: 2px; transition: background 0.3s ease; }
            .floating-shapes {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                overflow: hidden; pointer-events: none;
            }
            .floating-shapes div { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.03); }
            .shape-1 { width: 300px; height: 300px; top: -100px; right: -80px; }
            .shape-2 { width: 200px; height: 200px; bottom: -60px; left: -60px; }
            .hint-text { font-size: 13px; color: #9ca3af; margin-top: 6px; }
            .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            @media (max-width: 480px) {
                .grid-2col { grid-template-columns: 1fr; }
                .register-card { border-radius: 16px; margin: 0 4px; }
            }
        </style>
    </head>
    <body class="register-bg">
        <div class="floating-shapes">
            <div class="shape-1"></div>
            <div class="shape-2"></div>
        </div>

        <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 16px; position:relative; z-index:1;">
            <!-- ロゴ -->
            <div style="text-align:center; margin-bottom:24px;">
                <div style="display:inline-flex; align-items:center; gap:12px; margin-bottom:6px;">
                    <div style="width:44px; height:44px; background:linear-gradient(135deg,#ef4444,#dc2626); border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
                        <i class="fas fa-cog text-white text-lg"></i>
                    </div>
                    <span style="font-size:26px; font-weight:800; color:#fff; letter-spacing:-0.5px;">PARTS HUB</span>
                </div>
                <p style="color:rgba(255,255,255,0.6); font-size:13px;">自動車パーツ売買プラットフォーム</p>
            </div>

            <!-- メインカード -->
            <div class="register-card" style="width:100%; max-width:520px; padding:32px 28px;">
                <!-- タイトル -->
                <div style="text-align:center; margin-bottom:24px;">
                    <h1 style="font-size:22px; font-weight:700; color:#111827; margin:0 0 6px 0;">新規会員登録</h1>
                    <p style="font-size:14px; color:#6b7280; margin:0;">自動車パーツの売買を始めましょう</p>
                </div>

                <!-- ステップインジケーター -->
                <div style="display:flex; align-items:center; justify-content:center; gap:0; margin-bottom:28px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div id="step-1" class="step-dot step-active">1</div>
                        <span id="step-1-label" style="font-size:13px; font-weight:600; color:#374151;">基本情報</span>
                    </div>
                    <div id="step-line" class="step-line" style="background:#e5e7eb; margin:0 16px;"></div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div id="step-2" class="step-dot step-inactive">2</div>
                        <span id="step-2-label" style="font-size:13px; font-weight:600; color:#9ca3af;">店舗情報</span>
                    </div>
                </div>

                <!-- エラーメッセージ -->
                <div id="error-message" class="hidden" style="margin-bottom:20px; padding:14px 16px; background:#fef2f2; border:1px solid #fecaca; border-radius:12px;">
                    <div style="display:flex; align-items:center; color:#991b1b; font-size:14px; font-weight:500;">
                        <i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>
                        <span id="error-text"></span>
                    </div>
                </div>

                <form id="register-form">
                    <!-- ステップ1: 基本情報 -->
                    <div id="step-1-content">
                        <div style="margin-bottom:20px;">
                            <label class="form-label">
                                <i class="fas fa-user" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>お名前（実名）
                                <span style="background:#ef4444; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px;">必須</span>
                            </label>
                            <input type="text" id="fullname" required class="form-input" placeholder="例: 山田 太郎" autocomplete="name">
                            <p class="hint-text">取引時の本人確認に使用します（他のユーザーには表示されません）</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label class="form-label">
                                <i class="fas fa-id-badge" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>ニックネーム（表示名）
                                <span style="background:#9ca3af; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px;">任意</span>
                            </label>
                            <input type="text" id="nickname" class="form-input" placeholder="例: ヤマダパーツ">
                            <p class="hint-text">他のユーザーに表示される名前です。未入力の場合はお名前の一部が表示されます</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label class="form-label"><i class="fas fa-envelope" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>メールアドレス
                                <span style="background:#ef4444; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px;">必須</span>
                            </label>
                            <input type="email" id="email" required class="form-input" placeholder="example@email.com" autocomplete="email">
                            <p class="hint-text">ログイン時に使用します</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label class="form-label"><i class="fas fa-lock" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>パスワード
                                <span style="background:#ef4444; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px;">必須</span>
                            </label>
                            <input type="password" id="password" required minlength="8" class="form-input" placeholder="8文字以上の英数字" autocomplete="new-password">
                            <p class="hint-text">8文字以上で設定してください</p>
                        </div>
                        <div style="margin-bottom:24px;">
                            <label class="form-label"><i class="fas fa-lock" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>パスワード（確認）</label>
                            <input type="password" id="password-confirm" required minlength="8" class="form-input" placeholder="もう一度入力してください" autocomplete="new-password">
                        </div>
                        <button type="button" onclick="goToStep2()" class="btn-primary">
                            次へ進む <i class="fas fa-arrow-right" style="margin-left:8px;"></i>
                        </button>
                    </div>

                    <!-- ステップ2 -->
                    <div id="step-2-content" class="hidden">
                        <div style="margin-bottom:20px;">
                            <label class="form-label"><i class="fas fa-store" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>店舗名・屋号</label>
                            <input type="text" id="shop-name" required class="form-input" placeholder="例: 山田自動車整備工場">
                        </div>
                        <div style="margin-bottom:20px;">
                            <label class="form-label"><i class="fas fa-briefcase" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>業態</label>
                            <select id="shop-type" required class="form-input">
                                <option value="">選択してください</option>
                                <option value="factory">整備工場</option>
                                <option value="dealer">ディーラー</option>
                                <option value="parts_shop">パーツショップ</option>
                                <option value="recycler">リサイクルショップ</option>
                                <option value="scrapyard">解体業者</option>
                                <option value="individual">個人</option>
                            </select>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label class="form-label"><i class="fas fa-phone" style="margin-right:6px; color:#9ca3af; font-size:13px;"></i>電話番号</label>
                            <input type="tel" id="phone" class="form-input" placeholder="03-1234-5678">
                            <p class="hint-text">ハイフンありで入力</p>
                        </div>
                        <div class="grid-2col" style="margin-bottom:20px;">
                            <div>
                                <label class="form-label">郵便番号</label>
                                <input type="text" id="postal-code" class="form-input" placeholder="123-4567">
                            </div>
                            <div>
                                <label class="form-label">都道府県</label>
                                <input type="text" id="prefecture" class="form-input" placeholder="東京都">
                            </div>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label class="form-label">市区町村</label>
                            <input type="text" id="city" class="form-input" placeholder="渋谷区神南">
                        </div>
                        <div style="margin-bottom:20px;">
                            <label class="form-label">番地・建物名</label>
                            <input type="text" id="address" class="form-input" placeholder="1-2-3 ビル名 101号室">
                        </div>

                        <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:24px; padding:14px; background:#f9fafb; border-radius:12px;">
                            <input type="checkbox" id="terms" required 
                                   style="width:20px; height:20px; margin-top:2px; accent-color:#ef4444; cursor:pointer; flex-shrink:0;">
                            <label for="terms" style="font-size:14px; color:#4b5563; line-height:1.6; cursor:pointer;">
                                <a href="/terms" target="_blank" style="color:#ef4444; font-weight:600; text-decoration:underline;">利用規約</a>および
                                <a href="/privacy" target="_blank" style="color:#ef4444; font-weight:600; text-decoration:underline;">プライバシーポリシー</a>に同意します
                            </label>
                        </div>

                        <div class="grid-2col">
                            <button type="button" onclick="goToStep1()" class="btn-secondary">
                                <i class="fas fa-arrow-left" style="margin-right:6px;"></i>戻る
                            </button>
                            <button type="submit" id="submit-btn" class="btn-primary">
                                <i class="fas fa-user-plus" style="margin-right:6px;"></i>登録する
                            </button>
                        </div>
                    </div>
                </form>

                <!-- ログインリンク -->
                <div style="margin-top:24px; padding-top:20px; border-top:1px solid #e5e7eb; text-align:center;">
                    <p style="font-size:14px; color:#6b7280; margin:0 0 6px 0;">すでにアカウントをお持ちの方</p>
                    <a href="/login" style="font-size:15px; color:#ef4444; font-weight:600; text-decoration:none;">
                        ログインはこちら <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
                    </a>
                </div>
            </div>

            <!-- フッターリンク -->
            <div style="margin-top:24px; text-align:center;">
                <a href="/" style="color:rgba(255,255,255,0.5); font-size:13px; text-decoration:none;">
                    <i class="fas fa-arrow-left" style="margin-right:4px;"></i>トップページに戻る
                </a>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script>
            function showError(message) {
                var errorDiv = document.getElementById('error-message');
                document.getElementById('error-text').textContent = message;
                errorDiv.classList.remove('hidden');
                errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            function hideError() {
                document.getElementById('error-message').classList.add('hidden');
            }

            function goToStep2() {
                hideError();
                var fullname = document.getElementById('fullname').value.trim();
                var email = document.getElementById('email').value;
                var password = document.getElementById('password').value;
                var passwordConfirm = document.getElementById('password-confirm').value;

                if (!fullname || !email || !password || !passwordConfirm) {
                    showError('お名前、メールアドレス、パスワードは必須です');
                    return;
                }
                if (password !== passwordConfirm) {
                    showError('パスワードが一致しません');
                    return;
                }
                if (password.length < 8) {
                    showError('パスワードは8文字以上で設定してください');
                    return;
                }

                document.getElementById('step-1-content').classList.add('hidden');
                document.getElementById('step-2-content').classList.remove('hidden');
                document.getElementById('step-1').className = 'step-dot step-done';
                document.getElementById('step-1').innerHTML = '<i class="fas fa-check" style="font-size:14px;"></i>';
                document.getElementById('step-2').className = 'step-dot step-active';
                document.getElementById('step-1-label').style.color = '#22c55e';
                document.getElementById('step-2-label').style.color = '#374151';
                document.getElementById('step-line').style.background = '#22c55e';
                window.scrollTo(0, 0);
            }

            function goToStep1() {
                hideError();
                document.getElementById('step-2-content').classList.add('hidden');
                document.getElementById('step-1-content').classList.remove('hidden');
                document.getElementById('step-1').className = 'step-dot step-active';
                document.getElementById('step-1').innerHTML = '1';
                document.getElementById('step-2').className = 'step-dot step-inactive';
                document.getElementById('step-1-label').style.color = '#374151';
                document.getElementById('step-2-label').style.color = '#9ca3af';
                document.getElementById('step-line').style.background = '#e5e7eb';
                window.scrollTo(0, 0);
            }

            document.getElementById('register-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                hideError();
                
                var submitButton = document.getElementById('submit-btn');
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>登録中...';
                
                var data = {
                    name: document.getElementById('fullname').value.trim(),
                    nickname: document.getElementById('nickname').value.trim() || null,
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
                    var response = await axios.post('/api/auth/register', data);
                    
                    if (response.data.success) {
                        // トークンとユーザー情報をlocalStorageに保存（自動ログイン）
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        
                        submitButton.innerHTML = '<i class="fas fa-check" style="margin-right:8px;"></i>登録完了！マイページに移動します...';
                        submitButton.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                        
                        setTimeout(function() {
                            window.location.href = '/mypage';
                        }, 1500);
                    }
                } catch (error) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>登録する';
                    
                    var errorMsg = error.response && error.response.data ? error.response.data.error : '登録に失敗しました。もう一度お試しください。';
                    showError(errorMsg);
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
                            <button id="purchase-btn" onclick="purchaseProduct()" 
                                    class="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                <i class="fas fa-shopping-cart mr-2"></i>購入手続きへ
                            </button>
                            <div id="fee-info"></div>
                            <button id="favorite-btn" onclick="addToFavorites()" data-favorited="false"
                                    class="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center">
                                <i class="far fa-heart mr-2"></i>お気に入り
                            </button>
                            <button onclick="openPriceOfferModal()" 
                                    class="w-full px-6 py-4 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center">
                                <i class="fas fa-tag mr-2"></i>値下げ交渉
                            </button>
                        </div>
                        <button id="contact-btn" onclick="contactSeller()" 
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
                        <label class="form-label">現在の価格</label>
                        <div class="text-2xl font-bold text-gray-900" id="modal-current-price">¥0</div>
                    </div>
                    <div>
                        <label class="form-label">希望価格 *</label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">¥</span>
                            <input type="number" id="offer-price" 
                                   class="w-full px-4 py-3 pl-8 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                                   placeholder="0">
                        </div>
                    </div>
                    <div>
                        <label class="form-label">メッセージ（任意）</label>
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
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
        <meta name="description" content="PARTS HUBで自動車パーツを出品。簡単ステップで今すぐ出品できます。">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * { font-family: 'Noto Sans JP', sans-serif; }

            /* ステッププログレスバー */
            .step-indicator { display: flex; justify-content: center; }
            .step-item {
                display: flex; flex-direction: column; align-items: center;
                flex: 1; position: relative; z-index: 1;
            }
            .step-circle {
                width: 36px; height: 36px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: 700; font-size: 14px; transition: all 0.3s;
                border: 3px solid #e5e7eb; background: #fff; color: #9ca3af;
            }
            .step-item.active .step-circle {
                border-color: #ef4444; background: #ef4444; color: #fff;
                box-shadow: 0 0 0 4px rgba(239,68,68,0.15);
            }
            .step-item.completed .step-circle {
                border-color: #22c55e; background: #22c55e; color: #fff;
            }
            .step-label { font-size: 11px; margin-top: 6px; color: #9ca3af; font-weight: 500; white-space: nowrap; }
            .step-item.active .step-label { color: #ef4444; font-weight: 600; }
            .step-item.completed .step-label { color: #22c55e; }
            .step-connector {
                position: absolute; top: 18px; left: calc(50% + 22px); right: calc(-50% + 22px);
                height: 3px; background: #e5e7eb; z-index: 0;
            }
            .step-item.completed .step-connector { background: #22c55e; }

            /* フォーム入力 */
            .form-input {
                width: 100%; padding: 12px 16px; font-size: 16px;
                border: 2px solid #e5e7eb; border-radius: 12px; outline: none;
                transition: all 0.2s; background: #fff; min-height: 48px;
                -webkit-appearance: none; appearance: none;
            }
            .form-input:focus {
                border-color: #ef4444;
                box-shadow: 0 0 0 4px rgba(239,68,68,0.08);
            }
            .form-input::placeholder { color: #c0c4cc; }
            select.form-input {
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                background-position: right 12px center; background-repeat: no-repeat; background-size: 20px;
                padding-right: 40px;
            }
            .form-label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
            .form-label .required {
                color: #ef4444; font-size: 11px; background: #fef2f2;
                padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 500;
            }
            .form-label .optional {
                color: #9ca3af; font-size: 11px; background: #f9fafb;
                padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 400;
            }
            .form-helper { font-size: 12px; color: #9ca3af; margin-top: 4px; }

            /* セクション */
            .section-card {
                background: #fff; border-radius: 16px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
                overflow: hidden;
            }
            .section-header {
                padding: 16px 20px; border-bottom: 1px solid #f3f4f6;
                display: flex; align-items: center; gap: 10px;
            }
            .section-header-icon {
                width: 32px; height: 32px; border-radius: 8px;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px; flex-shrink: 0;
            }
            .section-body { padding: 20px; }

            /* 画像アップロード */
            .image-upload-zone {
                border: 2px dashed #d1d5db; border-radius: 16px;
                padding: 32px 20px; text-align: center; cursor: pointer;
                transition: all 0.3s; background: #fafbfc;
            }
            .image-upload-zone:hover { border-color: #ef4444; background: #fef7f7; }
            .image-upload-zone.dragover { border-color: #ef4444; background: #fee2e2; }

            /* 画像プレビュー */
            .image-preview-item {
                position: relative; border-radius: 12px; overflow: hidden;
                aspect-ratio: 1; background: #f3f4f6;
            }
            .image-preview-item img { width: 100%; height: 100%; object-fit: cover; }
            .image-preview-item .badge-main {
                position: absolute; top: 4px; left: 4px; background: #ef4444;
                color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600;
            }
            .image-preview-item .remove-btn {
                position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6);
                color: #fff; width: 22px; height: 22px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 10px; cursor: pointer; border: none;
            }

            /* 状態選択チップ */
            .condition-chip {
                padding: 10px 12px; border: 2px solid #e5e7eb; border-radius: 12px;
                cursor: pointer; transition: all 0.2s; text-align: center;
                font-size: 13px; font-weight: 500; background: #fff;
                display: flex; align-items: center; justify-content: center; gap: 4px;
            }
            .condition-chip:hover { border-color: #fca5a5; background: #fff5f5; }
            .condition-chip.selected {
                border-color: #ef4444; background: #fef2f2; color: #dc2626; font-weight: 600;
            }

            /* アコーディオン */
            .accordion-toggle { cursor: pointer; user-select: none; }
            .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
            .accordion-content.open { max-height: 2000px; }
            .accordion-arrow { transition: transform 0.3s; }
            .accordion-arrow.open { transform: rotate(180deg); }

            /* 出品ボタンフッター */
            .submit-footer {
                position: sticky; bottom: 0; background: #fff;
                border-top: 1px solid #f3f4f6; padding: 12px 16px;
                box-shadow: 0 -4px 12px rgba(0,0,0,0.06); z-index: 40;
            }
            .submit-btn {
                width: 100%; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: #fff; padding: 16px; border-radius: 14px;
                font-weight: 700; font-size: 17px; border: none; cursor: pointer;
                transition: all 0.2s; box-shadow: 0 4px 14px rgba(239,68,68,0.35);
            }
            .submit-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(239,68,68,0.45);
            }
            .submit-btn:disabled {
                opacity: 0.6; cursor: not-allowed; transform: none;
                box-shadow: none;
            }

            /* 横並びフィールド */
            .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            @media (max-width: 480px) {
                .field-row.stack-mobile { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen pb-24">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                <button onclick="window.history.back()" class="text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-sm font-medium">
                    <i class="fas fa-chevron-left"></i><span>戻る</span>
                </button>
                <div class="font-bold text-base text-gray-900">商品を出品</div>
                <a href="/faq" class="text-gray-400 hover:text-gray-600 text-sm">
                    <i class="fas fa-question-circle text-lg"></i>
                </a>
            </div>
        </header>

        <!-- ステップインジケーター -->
        <div class="max-w-2xl mx-auto px-6 py-4">
            <div class="step-indicator" id="step-indicator">
                <div class="step-item active" data-step="1">
                    <div class="step-circle">1</div>
                    <div class="step-label">画像</div>
                    <div class="step-connector"></div>
                </div>
                <div class="step-item" data-step="2">
                    <div class="step-circle">2</div>
                    <div class="step-label">基本情報</div>
                    <div class="step-connector"></div>
                </div>
                <div class="step-item" data-step="3">
                    <div class="step-circle">3</div>
                    <div class="step-label">価格</div>
                    <div class="step-connector"></div>
                </div>
                <div class="step-item" data-step="4">
                    <div class="step-circle">4</div>
                    <div class="step-label">車両情報</div>
                </div>
            </div>
        </div>

        <main class="max-w-2xl mx-auto px-4 pb-8">
            <form id="listing-form" class="space-y-5">

                <!-- ===== 1. 画像アップロード ===== -->
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-header-icon bg-red-50 text-red-500">
                            <i class="fas fa-camera"></i>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900">商品画像</div>
                            <div class="text-xs text-gray-400">最大10枚・1枚目がメイン画像</div>
                        </div>
                    </div>
                    <div class="section-body">
                        <!-- ドロップゾーン -->
                        <div id="drop-zone" class="image-upload-zone" onclick="document.getElementById('image-input').click()">
                            <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                            <p class="text-gray-600 text-sm mb-1">クリックまたはドラッグ＆ドロップで画像を追加</p>
                            <p class="text-xs text-gray-400">JPG, PNG, WEBP（最大10MB）</p>
                            <input type="file" id="image-input" accept="image/*" multiple class="hidden">
                        </div>

                        <!-- 画像プレビューグリッド -->
                        <div id="image-previews" class="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mt-4"></div>

                        <!-- カメラ・ギャラリーボタン -->
                        <div class="grid grid-cols-2 gap-2.5 mt-3">
                            <button type="button" onclick="productForm.openCamera()"
                                    class="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600">
                                <i class="fas fa-camera text-red-400"></i>カメラで撮影
                            </button>
                            <button type="button" onclick="productForm.openGallery()"
                                    class="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600">
                                <i class="fas fa-image text-blue-400"></i>ギャラリーから
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ===== 2. 基本情報 ===== -->
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-header-icon bg-blue-50 text-blue-500">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900">基本情報</div>
                            <div class="text-xs text-gray-400">商品の概要を入力</div>
                        </div>
                    </div>
                    <div class="section-body space-y-5">
                        <!-- 商品名 -->
                        <div>
                            <label class="form-label">商品名 <span class="required">必須</span></label>
                            <input type="text" id="product-title" required
                                   class="form-input"
                                   placeholder="例: トヨタ プリウス 30系 フロントドア 左側">
                            <div class="form-helper">ブランド名・車種・部品名を含めると検索されやすくなります</div>
                        </div>

                        <!-- 商品説明 -->
                        <div>
                            <label class="form-label">商品説明 <span class="required">必須</span></label>
                            <textarea id="product-description" required rows="5"
                                      class="form-input" style="resize: vertical; min-height: 120px;"
                                      placeholder="商品の状態、特徴、付属品などを詳しく記載してください"></textarea>
                            <div class="flex justify-between mt-1">
                                <span class="form-helper">購入者が安心できるよう、詳しく記載しましょう</span>
                                <span class="text-xs text-gray-400" id="desc-count">0/2000</span>
                            </div>
                        </div>

                        <!-- カテゴリ（フル幅） -->
                        <div>
                            <label class="form-label">カテゴリ <span class="required">必須</span></label>
                            <select id="category-select" required class="form-input">
                                <option value="">選択してください</option>
                            </select>
                        </div>

                        <!-- サブカテゴリ（フル幅） -->
                        <div>
                            <label class="form-label">サブカテゴリ <span class="optional">任意</span></label>
                            <select id="subcategory-select" class="form-input">
                                <option value="">カテゴリを選択してください</option>
                            </select>
                        </div>

                        <!-- 商品の状態（チップ選択） -->
                        <div>
                            <label class="form-label">商品の状態 <span class="required">必須</span></label>
                            <input type="hidden" id="condition-select" value="">
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-1" id="condition-chips">
                                <div class="condition-chip" data-value="new" onclick="selectCondition(this)">
                                    <i class="fas fa-star text-yellow-400"></i>新品・未使用
                                </div>
                                <div class="condition-chip" data-value="like_new" onclick="selectCondition(this)">
                                    未使用に近い
                                </div>
                                <div class="condition-chip" data-value="excellent" onclick="selectCondition(this)">
                                    目立った傷なし
                                </div>
                                <div class="condition-chip" data-value="good" onclick="selectCondition(this)">
                                    やや傷あり
                                </div>
                                <div class="condition-chip" data-value="acceptable" onclick="selectCondition(this)">
                                    傷・汚れあり
                                </div>
                                <div class="condition-chip" data-value="junk" onclick="selectCondition(this)">
                                    ジャンク品
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== 3. 価格設定 ===== -->
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-header-icon bg-green-50 text-green-500">
                            <i class="fas fa-yen-sign"></i>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900">価格設定</div>
                            <div class="text-xs text-gray-400">税込価格で入力</div>
                        </div>
                    </div>
                    <div class="section-body space-y-5">
                        <!-- 販売価格 -->
                        <div>
                            <label class="form-label">販売価格 <span class="required">必須</span></label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">¥</span>
                                <input type="number" id="product-price" required min="0"
                                       class="form-input text-right text-xl font-bold" style="padding-left: 36px;"
                                       placeholder="0">
                            </div>
                            <div class="flex items-center justify-between mt-2">
                                <span class="form-helper">税込価格を入力してください</span>
                                <span class="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded" id="fee-display">販売手数料 10%：¥0</span>
                            </div>
                        </div>

                        <!-- 在庫数・部品番号 -->
                        <div class="field-row">
                            <div>
                                <label class="form-label">在庫数 <span class="required">必須</span></label>
                                <input type="number" id="stock-quantity" required min="1" value="1"
                                       class="form-input">
                            </div>
                            <div>
                                <label class="form-label">部品番号 <span class="optional">任意</span></label>
                                <input type="text" id="part-number"
                                       class="form-input"
                                       placeholder="例: 04465-12345">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== 4. 適合車両情報（アコーディオン） ===== -->
                <div class="section-card">
                    <div class="section-header accordion-toggle" onclick="toggleAccordion(this)">
                        <div class="section-header-icon bg-purple-50 text-purple-500">
                            <i class="fas fa-car"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-bold text-sm text-gray-900">適合車両情報</div>
                            <div class="text-xs text-gray-400">入力すると検索されやすくなります</div>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 accordion-arrow"></i>
                    </div>
                    <div class="accordion-content" id="vehicle-accordion">
                        <div class="section-body space-y-5">
                            <!-- メーカー・車種 -->
                            <div class="field-row stack-mobile">
                                <div>
                                    <label class="form-label">メーカー <span class="optional">任意</span></label>
                                    <select id="maker-select" class="form-input">
                                        <option value="">選択してください</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="form-label">車種 <span class="optional">任意</span></label>
                                    <select id="model-select" class="form-input">
                                        <option value="">メーカーを選択</option>
                                    </select>
                                </div>
                            </div>

                            <!-- 年式 -->
                            <div class="field-row">
                                <div>
                                    <label class="form-label">年式（始） <span class="optional">任意</span></label>
                                    <input type="number" id="year-from" class="form-input" placeholder="例: 2010" min="1900" max="2099">
                                </div>
                                <div>
                                    <label class="form-label">年式（終） <span class="optional">任意</span></label>
                                    <input type="number" id="year-to" class="form-input" placeholder="例: 2015" min="1900" max="2099">
                                </div>
                            </div>

                            <!-- 型式・グレード -->
                            <div class="field-row stack-mobile">
                                <div>
                                    <label class="form-label">型式 <span class="optional">任意</span></label>
                                    <input type="text" id="model-code" class="form-input" placeholder="例: DAA-ZVW30">
                                </div>
                                <div>
                                    <label class="form-label">グレード <span class="optional">任意</span></label>
                                    <input type="text" id="grade" class="form-input" placeholder="例: S, G">
                                </div>
                            </div>

                            <!-- エンジン型式・駆動方式 -->
                            <div class="field-row stack-mobile">
                                <div>
                                    <label class="form-label">エンジン型式 <span class="optional">任意</span></label>
                                    <input type="text" id="engine-type" class="form-input" placeholder="例: 2ZR-FXE">
                                </div>
                                <div>
                                    <label class="form-label">駆動方式 <span class="optional">任意</span></label>
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

                            <!-- トランスミッション・純正部品番号 -->
                            <div class="field-row stack-mobile">
                                <div>
                                    <label class="form-label">トランスミッション <span class="optional">任意</span></label>
                                    <select id="transmission-type" class="form-input">
                                        <option value="">選択してください</option>
                                        <option value="AT">オートマ（AT）</option>
                                        <option value="MT">マニュアル（MT）</option>
                                        <option value="CVT">CVT</option>
                                        <option value="DCT">DCT</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="form-label">純正部品番号 <span class="optional">任意</span></label>
                                    <input type="text" id="oem-part-number" class="form-input" placeholder="例: 04465-XXXXX">
                                </div>
                            </div>

                            <!-- 確認方法 -->
                            <div>
                                <label class="form-label">確認方法 <span class="optional">任意</span></label>
                                <select id="verification-method" class="form-input">
                                    <option value="">選択してください</option>
                                    <option value="catalog">カタログで確認</option>
                                    <option value="parts_list">部品リストで確認</option>
                                    <option value="actual_vehicle">実車で確認</option>
                                    <option value="dealer">ディーラーに確認</option>
                                    <option value="manufacturer">メーカーに確認</option>
                                </select>
                            </div>

                            <!-- 適合備考 -->
                            <div>
                                <label class="form-label">適合に関する備考 <span class="optional">任意</span></label>
                                <textarea id="fitment-notes" rows="2"
                                          class="form-input" style="resize: vertical; min-height: 70px;"
                                          placeholder="適合に関する注意事項があれば記載してください"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== 代理出品案内 ===== -->
                <div class="section-card" style="background: linear-gradient(135deg, #eff6ff, #eef2ff); border: 1px solid #bfdbfe;">
                    <div class="section-body">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-hands-helping text-white"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-bold text-sm text-gray-900 mb-1">出品が難しい場合は代理出品サービスへ</div>
                                <p class="text-xs text-gray-500 mb-3 leading-relaxed">担当者が出品作業を代行します。出張 or 郵送の2パターン。</p>
                                <button type="button" onclick="showProxyListingModal()"
                                        class="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
                                    <i class="fas fa-info-circle mr-1.5"></i>詳細を見る
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </main>

        <!-- 出品ボタン（固定フッター） -->
        <div class="submit-footer">
            <div class="max-w-2xl mx-auto">
                <button type="button" id="submit-btn" onclick="productForm.submitForm()" class="submit-btn">
                    <i class="fas fa-check mr-2"></i>出品する
                </button>
                <div class="text-center mt-1.5">
                    <span class="text-xs text-gray-400">出品手数料は販売時に10%のみ</span>
                </div>
            </div>
        </div>

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
                                <div class="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-truck text-white text-xl"></i>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900 mb-1">パターン1: 出張代理出品</h4>
                                <p class="text-sm text-gray-600">担当者がお客様の整備工場に出向いて出品作業を行います。</p>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg p-4">
                            <h5 class="font-semibold text-gray-900 mb-2 text-sm"><i class="fas fa-yen-sign text-purple-500 mr-2"></i>料金体系</h5>
                            <ul class="space-y-2 text-sm text-gray-700">
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-green-500 mt-0.5 flex-shrink-0"></i>
                                    <span><strong>出張費用:</strong> 距離により発生（お見積り）</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-green-500 mt-0.5 flex-shrink-0"></i>
                                    <span><strong>出品点数:</strong> 20点まで無料</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-green-500 mt-0.5 flex-shrink-0"></i>
                                    <span><strong>21点以上:</strong> 1点につき330円（税込）</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-exclamation-triangle text-orange-500 mt-0.5 flex-shrink-0"></i>
                                    <span><strong>売買手数料:</strong> 10%</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- パターン2: 郵送 -->
                    <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                        <div class="flex items-start gap-4 mb-4">
                            <div class="flex-shrink-0">
                                <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-box text-white text-xl"></i>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900 mb-1">パターン2: 郵送代理出品（おすすめ）</h4>
                                <p class="text-sm text-gray-600">商品をパーツハブに郵送、当社で出品作業を代行します。</p>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="bg-white rounded-lg p-4">
                                <h5 class="font-semibold text-gray-900 mb-2 text-sm"><i class="fas fa-yen-sign text-green-500 mr-2"></i>料金体系</h5>
                                <ul class="space-y-2 text-sm text-gray-700">
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check text-green-500 mt-0.5 flex-shrink-0"></i>
                                        <span><strong>出張費用:</strong> 無料</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check text-green-500 mt-0.5 flex-shrink-0"></i>
                                        <span><strong>出品作業費:</strong> すべて無料（点数制限なし）</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-exclamation-triangle text-orange-500 mt-0.5 flex-shrink-0"></i>
                                        <span><strong>売買手数料:</strong> 10%</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
                                        <span><strong>送料:</strong> お客様負担</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="bg-green-100 border border-green-300 rounded-lg p-3">
                                <p class="text-sm text-green-800 font-semibold">
                                    <i class="fas fa-star text-yellow-500 mr-1"></i>
                                    郵送なら出張費用＆出品作業費が完全無料！
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 比較表 -->
                    <div class="bg-gray-50 rounded-xl p-5">
                        <h4 class="font-bold text-gray-900 mb-3 text-sm">料金比較表</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b-2 border-gray-300">
                                        <th class="text-left py-2.5 px-2 font-semibold text-gray-700">項目</th>
                                        <th class="text-center py-2.5 px-2 font-semibold text-purple-700">出張</th>
                                        <th class="text-center py-2.5 px-2 font-semibold text-green-700">郵送</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr><td class="py-2.5 px-2 text-gray-700">出張費用</td><td class="py-2.5 px-2 text-center text-orange-600">距離により発生</td><td class="py-2.5 px-2 text-center text-green-600 font-semibold">無料</td></tr>
                                    <tr><td class="py-2.5 px-2 text-gray-700">作業費(20点まで)</td><td class="py-2.5 px-2 text-center text-green-600">無料</td><td class="py-2.5 px-2 text-center text-green-600 font-semibold">無料</td></tr>
                                    <tr><td class="py-2.5 px-2 text-gray-700">作業費(21点〜)</td><td class="py-2.5 px-2 text-center text-orange-600">330円/点</td><td class="py-2.5 px-2 text-center text-green-600 font-semibold">無料</td></tr>
                                    <tr><td class="py-2.5 px-2 text-gray-700">売買手数料</td><td class="py-2.5 px-2 text-center">10%</td><td class="py-2.5 px-2 text-center">10%</td></tr>
                                    <tr><td class="py-2.5 px-2 text-gray-700">送料</td><td class="py-2.5 px-2 text-center text-gray-400">-</td><td class="py-2.5 px-2 text-center">お客様負担</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- お問い合わせボタン -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a href="/contact?type=proxy_onsite"
                           class="bg-purple-500 hover:bg-purple-600 text-white py-3.5 rounded-xl font-bold text-center transition-colors text-sm">
                            <i class="fas fa-truck mr-2"></i>出張代理出品を依頼
                        </a>
                        <a href="/contact?type=proxy_shipping"
                           class="bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-xl font-bold text-center transition-colors text-sm">
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script src="/static/listing.js?v=20260325"></script>
        <script>
            // 状態チップ選択
            function selectCondition(el) {
                document.querySelectorAll('.condition-chip').forEach(function(c) {
                    c.classList.remove('selected');
                    // アイコンを除去してテキストのみに
                    var icon = c.querySelector('.chip-check');
                    if (icon) icon.remove();
                });
                el.classList.add('selected');
                // チェックアイコンを先頭に追加
                if (!el.querySelector('.chip-check')) {
                    var check = document.createElement('i');
                    check.className = 'fas fa-check-circle chip-check';
                    el.insertBefore(check, el.firstChild);
                }
                document.getElementById('condition-select').value = el.getAttribute('data-value');
            }

            // アコーディオン
            function toggleAccordion(el) {
                var content = el.nextElementSibling;
                var arrow = el.querySelector('.accordion-arrow');
                content.classList.toggle('open');
                arrow.classList.toggle('open');
            }

            // 代理出品モーダル
            function showProxyListingModal() {
                document.getElementById('proxy-listing-modal').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
            function closeProxyListingModal() {
                document.getElementById('proxy-listing-modal').classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
            document.getElementById('proxy-listing-modal').addEventListener('click', function(e) {
                if (e.target === this) closeProxyListingModal();
            });

            // 販売手数料リアルタイム表示
            var priceInput = document.getElementById('product-price');
            if (priceInput) {
                priceInput.addEventListener('input', function() {
                    var price = parseInt(this.value) || 0;
                    var fee = Math.floor(price * 0.1);
                    document.getElementById('fee-display').textContent =
                        '販売手数料 10%：¥' + fee.toLocaleString();
                });
            }

            // 説明文字数カウント
            var descInput = document.getElementById('product-description');
            if (descInput) {
                descInput.addEventListener('input', function() {
                    document.getElementById('desc-count').textContent =
                        this.value.length + '/2000';
                });
            }

            // ステップインジケーター自動更新
            function updateStepIndicator() {
                var steps = document.querySelectorAll('.step-item');
                var hasImages = productForm && productForm.uploadedImages && productForm.uploadedImages.length > 0;
                var hasBasicInfo = document.getElementById('product-title').value &&
                                  document.getElementById('product-description').value &&
                                  document.getElementById('condition-select').value &&
                                  document.getElementById('category-select').value;
                var hasPrice = document.getElementById('product-price').value;

                steps.forEach(function(s) {
                    s.classList.remove('active', 'completed');
                });

                if (hasImages) {
                    steps[0].classList.add('completed');
                    steps[0].querySelector('.step-circle').innerHTML = '<i class="fas fa-check text-xs"></i>';
                }
                if (hasBasicInfo) {
                    steps[1].classList.add('completed');
                    steps[1].querySelector('.step-circle').innerHTML = '<i class="fas fa-check text-xs"></i>';
                }
                if (hasPrice) {
                    steps[2].classList.add('completed');
                    steps[2].querySelector('.step-circle').innerHTML = '<i class="fas fa-check text-xs"></i>';
                }

                // 現在のアクティブステップ
                if (!hasImages) { steps[0].classList.add('active'); steps[0].querySelector('.step-circle').textContent = '1'; }
                else if (!hasBasicInfo) { steps[1].classList.add('active'); steps[1].querySelector('.step-circle').textContent = '2'; }
                else if (!hasPrice) { steps[2].classList.add('active'); steps[2].querySelector('.step-circle').textContent = '3'; }
                else { steps[3].classList.add('active'); steps[3].querySelector('.step-circle').textContent = '4'; }
            }

            // 各入力のchangeでステップ更新
            ['product-title', 'product-description', 'product-price', 'category-select'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', updateStepIndicator);
                    el.addEventListener('change', updateStepIndicator);
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
                <button onclick="window.location.href='/mypage'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>マイページ
                </button>
                <h1 class="text-red-500 font-bold text-lg">メッセージ</h1>
                <div class="w-16"></div>
            </div>
        </header>

        <!-- ローディング -->
        <div id="loading-state" class="max-w-4xl mx-auto px-4 py-12 text-center">
            <i class="fas fa-spinner fa-spin text-red-500 text-3xl mb-4"></i>
            <p class="text-gray-600">読み込み中...</p>
        </div>

        <main id="main-content" class="max-w-4xl mx-auto px-4 py-6 hidden">
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script>
            let currentUserId = null;
            let token = null;

            function getAuthHeaders() {
                return { headers: { 'Authorization': 'Bearer ' + token } };
            }

            // ページ読み込み時
            document.addEventListener('DOMContentLoaded', async () => {
                token = localStorage.getItem('token');
                if (!token) {
                    alert('ログインが必要です');
                    window.location.href = '/login?redirect=' + encodeURIComponent('/chat');
                    return;
                }

                // ログインユーザー情報を取得
                try {
                    const res = await axios.get('/api/auth/me', getAuthHeaders());
                    if (res.data.success) {
                        currentUserId = res.data.data?.id || res.data.user?.id;
                        loadChatRooms();
                    } else {
                        throw new Error('auth failed');
                    }
                } catch (e) {
                    if (e?.response?.status === 401) {
                        localStorage.removeItem('token');
                    }
                    window.location.href = '/login?redirect=' + encodeURIComponent('/chat');
                }
            });

            // チャットルーム一覧をロード
            async function loadChatRooms() {
                try {
                    const response = await axios.get('/api/chat/rooms', getAuthHeaders());
                    
                    document.getElementById('loading-state').classList.add('hidden');
                    document.getElementById('main-content').classList.remove('hidden');

                    if (response.data.success) {
                        const rooms = response.data.data;
                        renderChatRooms(rooms);
                    }
                } catch (error) {
                    console.error('Failed to load chat rooms:', error);
                    document.getElementById('loading-state').classList.add('hidden');
                    document.getElementById('main-content').classList.remove('hidden');
                    document.getElementById('chat-rooms-container').classList.add('hidden');
                    document.getElementById('empty-state').classList.remove('hidden');
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
                    const isBuyer = room.buyer_id == currentUserId;
                    const otherUserName = isBuyer ? room.seller_name : room.buyer_name;
                    const roleLabel = isBuyer ? '出品者' : '購入者';
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
                                    \${room.product_image 
                                        ? \`<img src="\${room.product_image}" class="w-14 h-14 rounded-lg object-cover">\`
                                        : \`<div class="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center"><i class="fas fa-box text-gray-400"></i></div>\`
                                    }
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="flex items-center gap-2 min-w-0">
                                            <h3 class="font-semibold text-gray-900 truncate">\${otherUserName}</h3>
                                            <span class="text-xs text-gray-400 flex-shrink-0">\${roleLabel}</span>
                                        </div>
                                        \${room.unread_count > 0 ? \`
                                            <span class="unread-badge bg-red-500 text-white text-xs font-bold rounded-full px-2 ml-2">
                                                \${room.unread_count}
                                            </span>
                                        \` : ''}
                                    </div>
                                    <p class="text-sm text-gray-600 mb-1 truncate">\${room.product_title}</p>
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
                    <div id="header-product-image" class="flex-shrink-0">
                        <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <i class="fas fa-box text-gray-400"></i>
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
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-red-500 text-2xl"></i>
                    </div>
                </div>

                <!-- 送信フォーム -->
                <div class="bg-white border-t border-gray-200 p-4">
                    <div class="flex items-end gap-3">
                        <textarea id="message-input" 
                                  rows="1"
                                  class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                                  placeholder="メッセージを入力..."
                                  onkeydown="handleKeyDown(event)"></textarea>
                        <button id="send-btn" onclick="sendMessage()" 
                                class="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script>
            const roomId = ${roomId};
            let currentUserId = null;
            let token = null;
            let pollingInterval = null;
            let lastMessageId = null;

            function getAuthHeaders() {
                return { headers: { 'Authorization': 'Bearer ' + token } };
            }

            // ページ読み込み時
            document.addEventListener('DOMContentLoaded', async () => {
                token = localStorage.getItem('token');
                if (!token) {
                    alert('ログインが必要です');
                    window.location.href = '/login?redirect=' + encodeURIComponent('/chat/' + roomId);
                    return;
                }

                // ログインユーザー情報を取得
                try {
                    const res = await axios.get('/api/auth/me', getAuthHeaders());
                    if (res.data.success) {
                        currentUserId = res.data.data?.id || res.data.user?.id;
                    } else {
                        throw new Error('auth failed');
                    }
                } catch (e) {
                    if (e?.response?.status === 401) {
                        localStorage.removeItem('token');
                    }
                    window.location.href = '/login?redirect=' + encodeURIComponent('/chat/' + roomId);
                    return;
                }

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
                    const response = await axios.get('/api/chat/rooms', getAuthHeaders());
                    
                    if (response.data.success) {
                        const room = response.data.data.find(r => r.id == roomId);
                        if (room) {
                            const isBuyer = room.buyer_id == currentUserId;
                            const otherUserName = isBuyer ? room.seller_name : room.buyer_name;
                            
                            document.getElementById('other-user-name').textContent = otherUserName;
                            document.getElementById('product-title').textContent = room.product_title;

                            // 商品画像
                            if (room.product_image) {
                                document.getElementById('header-product-image').innerHTML = 
                                    '<img src="' + room.product_image + '" class="w-10 h-10 rounded-lg object-cover">';
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to load room info:', error);
                }
            }

            // メッセージ一覧をロード
            async function loadMessages() {
                try {
                    const response = await axios.get('/api/chat/rooms/' + roomId + '/messages?limit=100', getAuthHeaders());
                    
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
                    document.getElementById('messages-list').innerHTML = 
                        '<div class="text-center py-8 text-red-500"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>メッセージの読み込みに失敗しました</p></div>';
                }
            }

            // 新しいメッセージのみロード（ポーリング用）
            async function loadNewMessages() {
                if (!lastMessageId) return;
                
                try {
                    const response = await axios.get('/api/chat/rooms/' + roomId + '/messages?limit=50', getAuthHeaders());
                    
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
                            <i class="fas fa-comment-dots text-4xl mb-3"></i>
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
                // 空状態のメッセージがあれば除去
                const emptyMsg = container.querySelector('.text-center');
                if (emptyMsg) emptyMsg.remove();
                const html = messages.map(msg => createMessageHTML(msg)).join('');
                container.insertAdjacentHTML('beforeend', html);
            }

            // メッセージHTMLを生成
            function createMessageHTML(msg) {
                const isSent = msg.sender_id == currentUserId;
                const bubbleClass = isSent ? 'message-sent' : 'message-received';
                const timeStr = new Date(msg.created_at).toLocaleString('ja-JP', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                // XSS対策
                const safeText = msg.message_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                const safeName = (msg.sender_name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                
                return \`
                    <div class="flex \${isSent ? 'justify-end' : 'justify-start'}">
                        <div class="message-bubble \${bubbleClass} rounded-2xl px-4 py-2">
                            \${!isSent ? \`<p class="text-xs text-gray-500 mb-1">\${safeName}</p>\` : ''}
                            <p class="\${isSent ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap">\${safeText}</p>
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

                const sendBtn = document.getElementById('send-btn');
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                try {
                    const response = await axios.post('/api/chat/rooms/' + roomId + '/messages', {
                        message_text: text,
                        message_type: 'text'
                    }, getAuthHeaders());
                    
                    if (response.data.success) {
                        input.value = '';
                        input.style.height = 'auto';
                        loadMessages();
                    }
                } catch (error) {
                    console.error('Failed to send message:', error);
                    alert('メッセージの送信に失敗しました');
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
                }
            }

            // メッセージを既読にする
            async function markAsRead() {
                try {
                    await axios.put('/api/chat/rooms/' + roomId + '/read', {}, getAuthHeaders());
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
        <style>
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
                <button onclick="window.location.href='/'" class="text-gray-600 hover:text-gray-900 flex items-center text-sm">
                    <i class="fas fa-arrow-left mr-1 sm:mr-2"></i>戻る
                </button>
                <h1 class="text-red-500 font-bold text-base sm:text-lg">マイページ</h1>
                <button onclick="window.location.href='/notifications'" class="relative">
                    <i class="far fa-bell text-xl sm:text-2xl text-gray-600"></i>
                    <span id="notification-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"></span>
                </button>
            </div>
        </header>

        <main class="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <!-- ユーザー情報カード -->
            <div class="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg p-4 sm:p-6 mb-6 text-white">
                <div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-user text-red-500 text-2xl sm:text-3xl"></i>
                    </div>
                    <div class="flex-1 text-center sm:text-left min-w-0">
                        <h2 id="user-shop-name" class="text-lg sm:text-2xl font-bold mb-1 truncate">読み込み中...</h2>
                        <div id="user-shop-type" class="text-xs text-white/80 mb-1"></div>
                        <div class="flex items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm">
                            <span><i class="fas fa-star mr-1"></i><span id="user-rating">0.0</span> (<span id="review-count">0</span>)</span>
                            <span><i class="fas fa-box mr-1"></i>出品 <span id="listing-count">0</span>件</span>
                        </div>
                    </div>
                    <button onclick="window.location.href='/profile/edit'" class="w-full sm:w-auto bg-white text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm mt-2 sm:mt-0 flex-shrink-0">
                        <i class="fas fa-edit mr-1"></i>プロフィール編集
                    </button>
                </div>
            </div>

            <!-- クイックアクション（モバイル対応） -->
            <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                <a href="/listing" class="flex flex-col items-center bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-full flex items-center justify-center mb-1.5">
                        <i class="fas fa-plus text-red-500 text-base sm:text-lg"></i>
                    </div>
                    <span class="text-xs sm:text-sm font-semibold text-gray-700">出品する</span>
                </a>
                <a href="/chat" class="flex flex-col items-center bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mb-1.5">
                        <i class="fas fa-comments text-blue-500 text-base sm:text-lg"></i>
                    </div>
                    <span class="text-xs sm:text-sm font-semibold text-gray-700">メッセージ</span>
                </a>
                <a href="/notifications" class="flex flex-col items-center bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-full flex items-center justify-center mb-1.5">
                        <i class="fas fa-bell text-yellow-500 text-base sm:text-lg"></i>
                    </div>
                    <span class="text-xs sm:text-sm font-semibold text-gray-700">通知</span>
                </a>
            </div>

            <!-- 統計カード -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">売上合計</div>
                    <div class="text-lg sm:text-2xl font-bold text-gray-900">¥<span id="total-sales">0</span></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">振込可能額</div>
                    <div class="text-lg sm:text-2xl font-bold text-green-600">¥<span id="withdrawable">0</span></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">売却済み</div>
                    <div class="text-lg sm:text-2xl font-bold text-gray-900"><span id="sold-count">0</span>件</div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">購入数</div>
                    <div class="text-lg sm:text-2xl font-bold text-gray-900"><span id="purchase-count">0</span>件</div>
                </div>
            </div>

            <!-- メニュータブ -->
            <div class="bg-white rounded-xl shadow-sm mb-6">
                <div class="flex border-b border-gray-200 overflow-x-auto scrollbar-hide" style="-webkit-overflow-scrolling: touch; -ms-overflow-style: none; scrollbar-width: none;">
                    <button onclick="showTab('listings')" class="tab-btn flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent whitespace-nowrap" data-tab="listings">
                        <i class="fas fa-box sm:mr-1"></i><span class="hidden sm:inline"> </span>出品中
                    </button>
                    <button onclick="showTab('sales')" class="tab-btn flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent whitespace-nowrap" data-tab="sales">
                        <i class="fas fa-yen-sign sm:mr-1"></i><span class="hidden sm:inline"> </span>売上
                    </button>
                    <button onclick="showTab('purchases')" class="tab-btn flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent whitespace-nowrap" data-tab="purchases">
                        <i class="fas fa-shopping-bag sm:mr-1"></i><span class="hidden sm:inline"> </span>購入
                    </button>
                    <button onclick="showTab('favorites')" class="tab-btn flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent whitespace-nowrap" data-tab="favorites">
                        <i class="fas fa-heart sm:mr-1"></i><span class="hidden sm:inline"> </span>お気に入り
                    </button>
                    <button onclick="showTab('negotiations')" class="tab-btn flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent whitespace-nowrap" data-tab="negotiations">
                        <i class="fas fa-handshake sm:mr-1"></i><span class="hidden sm:inline"> </span>交渉
                    </button>
                </div>

                <!-- 出品中タブ -->
                <div id="tab-listings" class="tab-content p-3 sm:p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-base sm:text-lg font-bold text-gray-900">出品中の商品</h3>
                        <select id="listing-status-filter" onchange="filterListings(this.value)" class="text-sm px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none">
                            <option value="all">すべて</option>
                            <option value="active">出品中</option>
                            <option value="draft">下書き</option>
                            <option value="sold">売却済み</option>
                        </select>
                    </div>
                    <div id="listings-container" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- 売上管理タブ -->
                <div id="tab-sales" class="tab-content p-3 sm:p-6 hidden">
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
                <div id="tab-purchases" class="tab-content p-3 sm:p-6 hidden">
                    <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-4">購入履歴</h3>
                    <div id="purchases-container" class="space-y-3">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- お気に入りタブ -->
                <div id="tab-favorites" class="tab-content p-3 sm:p-6 hidden">
                    <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-4">お気に入り商品</h3>
                    <div id="favorites-container" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- 値下げ交渉タブ -->
                <div id="tab-negotiations" class="tab-content p-3 sm:p-6 hidden">
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
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
            .form-label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
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
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">氏名（実名）<span class="text-red-500">*</span></label>
                                <input type="text" id="name" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="山田太郎">
                            </div>
                            <div>
                                <label class="form-label">ニックネーム（表示名）</label>
                                <input type="text" id="nickname" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="やまちゃん">
                            </div>
                        </div>

                        <div>
                            <label class="form-label">会社名・店舗名・工場名</label>
                            <input type="text" id="shop-name" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="山田自動車整備工場">
                        </div>

                        <div>
                            <label class="form-label">店舗種別</label>
                            <select id="shop-type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors">
                                <option value="">選択してください</option>
                                <option value="factory">整備工場</option>
                                <option value="dealer">ディーラー</option>
                                <option value="parts_shop">パーツショップ</option>
                                <option value="recycler">リサイクルショップ</option>
                                <option value="scrapyard">解体業者</option>
                                <option value="individual">個人</option>
                            </select>
                        </div>

                        <div>
                            <label class="form-label">電話番号</label>
                            <input type="tel" id="phone" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="03-1234-5678">
                        </div>

                        <div>
                            <label class="form-label">メールアドレス<span class="text-red-500">*</span></label>
                            <input type="email" id="email" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="info@example.com">
                        </div>

                        <div>
                            <label class="form-label">自己紹介</label>
                            <textarea id="bio" rows="4" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none" placeholder="創業50年の老舗整備工場です。国産車全般の修理・整備を承っております。"></textarea>
                        </div>
                    </div>
                </div>

                <!-- 住所情報 -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-4">住所情報</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="form-label">郵便番号</label>
                            <input type="text" id="postal-code" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="123-4567" maxlength="8">
                        </div>

                        <div>
                            <label class="form-label">都道府県</label>
                            <select id="prefecture" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors">
                                <option value="">選択してください</option>
                                <option value="北海道">北海道</option>
                                <option value="青森県">青森県</option><option value="岩手県">岩手県</option><option value="宮城県">宮城県</option>
                                <option value="秋田県">秋田県</option><option value="山形県">山形県</option><option value="福島県">福島県</option>
                                <option value="茨城県">茨城県</option><option value="栃木県">栃木県</option><option value="群馬県">群馬県</option>
                                <option value="埼玉県">埼玉県</option><option value="千葉県">千葉県</option><option value="東京都">東京都</option>
                                <option value="神奈川県">神奈川県</option>
                                <option value="新潟県">新潟県</option><option value="富山県">富山県</option><option value="石川県">石川県</option>
                                <option value="福井県">福井県</option><option value="山梨県">山梨県</option><option value="長野県">長野県</option>
                                <option value="岐阜県">岐阜県</option><option value="静岡県">静岡県</option><option value="愛知県">愛知県</option>
                                <option value="三重県">三重県</option>
                                <option value="滋賀県">滋賀県</option><option value="京都府">京都府</option><option value="大阪府">大阪府</option>
                                <option value="兵庫県">兵庫県</option><option value="奈良県">奈良県</option><option value="和歌山県">和歌山県</option>
                                <option value="鳥取県">鳥取県</option><option value="島根県">島根県</option><option value="岡山県">岡山県</option>
                                <option value="広島県">広島県</option><option value="山口県">山口県</option>
                                <option value="徳島県">徳島県</option><option value="香川県">香川県</option><option value="愛媛県">愛媛県</option>
                                <option value="高知県">高知県</option>
                                <option value="福岡県">福岡県</option><option value="佐賀県">佐賀県</option><option value="長崎県">長崎県</option>
                                <option value="熊本県">熊本県</option><option value="大分県">大分県</option><option value="宮崎県">宮崎県</option>
                                <option value="鹿児島県">鹿児島県</option><option value="沖縄県">沖縄県</option>
                            </select>
                        </div>

                        <div>
                            <label class="form-label">市区町村</label>
                            <input type="text" id="city" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="渋谷区">
                        </div>

                        <div>
                            <label class="form-label">番地・建物名</label>
                            <input type="text" id="address" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="神南1-2-3 ビル4F">
                        </div>
                    </div>
                </div>

                <!-- 銀行口座情報（振込用） -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-bold text-gray-900 mb-2">
                        <i class="fas fa-university text-red-500 mr-1"></i>銀行口座情報
                    </h2>
                    <p class="text-sm text-gray-600 mb-4">売上金の振込先口座を登録してください</p>
                    
                    <style>
                        .bank-autocomplete { max-height: 240px; overflow-y: auto; scrollbar-width: thin; }
                        .bank-autocomplete::-webkit-scrollbar { width: 5px; }
                        .bank-autocomplete::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
                        .bank-ac-item { transition: background 0.1s; }
                        .bank-ac-item:hover, .bank-ac-item.active { background: #fef2f2; }
                        .bank-field-ok { border-color: #22c55e !important; }
                    </style>

                    <div class="space-y-4">
                        <!-- 金融機関名 -->
                        <div>
                            <label class="form-label">金融機関名 <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <input type="text" id="bank-name"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                                    placeholder="ひらがなで検索（例: みずほ）" autocomplete="off">
                                <input type="hidden" id="bank-code" value="">
                                <div id="bank-dropdown" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 bank-autocomplete"></div>
                            </div>
                            <div id="bank-info" class="hidden mt-1.5 flex items-center gap-2 text-xs">
                                <span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono" id="bank-code-show"></span>
                                <span class="text-green-600"><i class="fas fa-check-circle"></i></span>
                                <button type="button" onclick="window.__bankUI.clearBank()" class="ml-auto text-gray-400 hover:text-red-500"><i class="fas fa-times-circle"></i> クリア</button>
                            </div>
                        </div>

                        <!-- 支店名 -->
                        <div>
                            <label class="form-label">支店名 <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <input type="text" id="branch-name"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                                    placeholder="銀行を先に選択してください" autocomplete="off" disabled>
                                <input type="hidden" id="branch-code" value="">
                                <div id="branch-dropdown" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 bank-autocomplete"></div>
                            </div>
                            <div id="branch-info" class="hidden mt-1.5 flex items-center gap-2 text-xs">
                                <span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono" id="branch-code-show"></span>
                                <span class="text-green-600"><i class="fas fa-check-circle"></i></span>
                                <button type="button" onclick="window.__bankUI.clearBranch()" class="ml-auto text-gray-400 hover:text-red-500"><i class="fas fa-times-circle"></i> クリア</button>
                            </div>
                        </div>

                        <!-- 口座種別 -->
                        <div>
                            <label class="form-label">口座種別</label>
                            <div class="flex gap-3">
                                <label class="flex-1 cursor-pointer">
                                    <input type="radio" name="account-type-radio" value="普通" class="sr-only peer" checked>
                                    <div class="py-2.5 text-center border-2 border-gray-200 rounded-lg text-sm font-medium peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-500 transition-all cursor-pointer">普通</div>
                                </label>
                                <label class="flex-1 cursor-pointer">
                                    <input type="radio" name="account-type-radio" value="当座" class="sr-only peer">
                                    <div class="py-2.5 text-center border-2 border-gray-200 rounded-lg text-sm font-medium peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-500 transition-all cursor-pointer">当座</div>
                                </label>
                                <label class="flex-1 cursor-pointer">
                                    <input type="radio" name="account-type-radio" value="貯蓄" class="sr-only peer">
                                    <div class="py-2.5 text-center border-2 border-gray-200 rounded-lg text-sm font-medium peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-500 transition-all cursor-pointer">貯蓄</div>
                                </label>
                            </div>
                            <input type="hidden" id="account-type" value="普通">
                        </div>

                        <!-- 口座番号 -->
                        <div>
                            <label class="form-label">口座番号 <span class="bank-required-label bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded" style="display:none">必須</span></label>
                            <input type="text" id="account-number" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors font-mono tracking-wider" placeholder="7桁の口座番号" maxlength="7" inputmode="numeric">
                        </div>

                        <!-- 口座名義 -->
                        <div>
                            <label class="form-label">口座名義（カタカナ） <span class="bank-required-label bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded" style="display:none">必須</span></label>
                            <input type="text" id="account-holder" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="ヤマダ タロウ">
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script src="/static/bank-db.js"></script>
        <script src="/static/profile-edit.js?v=20260328"></script>
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
                        <label class="form-label">商品の状態</label>
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
                        <label class="form-label">対応・コミュニケーション</label>
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
                        <label class="form-label">配送</label>
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script src="/static/transaction-detail.js"></script>
    </body>
    </html>
  `)
})

// 決済成功ページ
app.get('/transaction/:id/success', (c) => {
  const transactionId = c.req.param('id')
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>購入完了 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>tailwind.config={theme:{extend:{colors:{primary:'#ff4757','primary-dark':'#ee3b4c'}}}}</script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center">
                <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            </div>
        </header>
        <main class="max-w-2xl mx-auto px-4 py-12">
            <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-check-circle text-4xl text-green-500"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-800 mb-2">購入が完了しました！</h1>
                <p class="text-gray-600 mb-6">ご購入ありがとうございます。出品者に通知されました。</p>
                <div id="transaction-info" class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <p class="text-sm text-gray-500">読み込み中...</p>
                </div>
                <div class="space-y-3">
                    <a href="/transactions/${transactionId}" 
                       class="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all text-center font-semibold">
                        <i class="fas fa-receipt mr-2"></i>取引詳細を見る
                    </a>
                    <a href="/mypage" 
                       class="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-center">
                        <i class="fas fa-user mr-2"></i>マイページに戻る
                    </a>
                    <a href="/" 
                       class="block w-full px-6 py-3 text-gray-500 hover:text-gray-700 text-center">
                        トップページに戻る
                    </a>
                </div>
            </div>
        </main>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
        <script>
            (async function() {
                const token = localStorage.getItem('token');
                if (!token) return;
                try {
                    const res = await axios.get('/api/payment/transaction/${transactionId}/status', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.data.success) {
                        const tx = res.data.transaction;
                        document.getElementById('transaction-info').innerHTML = 
                            '<div class="space-y-2">' +
                            '<div class="flex justify-between"><span class="text-gray-600">商品</span><span class="font-semibold">' + tx.product_title + '</span></div>' +
                            '<div class="flex justify-between"><span class="text-gray-600">金額</span><span class="font-semibold">¥' + Number(tx.amount).toLocaleString() + '</span></div>' +
                            '<div class="flex justify-between"><span class="text-gray-600">出品者</span><span>' + tx.seller_name + '</span></div>' +
                            '<div class="flex justify-between"><span class="text-gray-600">ステータス</span><span class="text-green-600 font-semibold">支払い完了</span></div>' +
                            '</div>';
                    }
                } catch (e) { console.error(e); }
            })();
        </script>
    </body>
    </html>
  `)
})

// 決済キャンセルページ
app.get('/transaction/:id/cancel', (c) => {
  const transactionId = c.req.param('id')
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>決済キャンセル - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>tailwind.config={theme:{extend:{colors:{primary:'#ff4757','primary-dark':'#ee3b4c'}}}}</script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center">
                <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            </div>
        </header>
        <main class="max-w-2xl mx-auto px-4 py-12">
            <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-times-circle text-4xl text-yellow-500"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-800 mb-2">決済がキャンセルされました</h1>
                <p class="text-gray-600 mb-6">決済は完了していません。商品は引き続き購入可能です。</p>
                <div class="space-y-3">
                    <button onclick="window.history.go(-2)" 
                       class="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all text-center font-semibold cursor-pointer">
                        <i class="fas fa-redo mr-2"></i>商品ページに戻る
                    </button>
                    <a href="/" 
                       class="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-center">
                        トップページに戻る
                    </a>
                </div>
            </div>
        </main>
    </body>
    </html>
  `)
})

// 商品編集ページ（出品ページを再利用し、編集モードで動作）
// /listing/new は /listing へリダイレクト（出品ページ）
app.get('/listing/new', (c) => {
  return c.redirect('/listing')
})

app.get('/listing/edit/:id', (c) => {
  const productId = c.req.param('id')
  return c.redirect(`/listing?edit=${productId}`)
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
                    <label class="form-label">お問い合わせ種別<span class="text-red-500">*</span></label>
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
                    <label class="form-label">お名前<span class="text-red-500">*</span></label>
                    <input type="text" id="name" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="山田太郎">
                </div>

                <!-- メールアドレス -->
                <div>
                    <label class="form-label">メールアドレス<span class="text-red-500">*</span></label>
                    <input type="email" id="email" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="example@email.com">
                </div>

                <!-- 電話番号 -->
                <div>
                    <label class="form-label">電話番号</label>
                    <input type="tel" id="phone" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="090-1234-5678">
                </div>

                <!-- 件名 -->
                <div>
                    <label class="form-label">件名<span class="text-red-500">*</span></label>
                    <input type="text" id="subject" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="お問い合わせ内容を簡潔に">
                </div>

                <!-- お問い合わせ内容 -->
                <div>
                    <label class="form-label">お問い合わせ内容<span class="text-red-500">*</span></label>
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
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
          div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
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
                        <label class="form-label">価格帯</label>
                        <div class="flex gap-2 items-center">
                            <input type="number" id="price-min" placeholder="最小" class="flex-1 px-3 py-2 border rounded-lg text-sm">
                            <span class="text-sm">〜</span>
                            <input type="number" id="price-max" placeholder="最大" class="flex-1 px-3 py-2 border rounded-lg text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="form-label">商品状態</label>
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
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
            document.getElementById('search-input').t').addEventListener('input', () => {
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
                        <li><strong>販売手数料：</strong>商品価格の10%（税込）</li>
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
                            <label class="form-label">メールアドレス</label>
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
        <script src="/static/i18n-en.js"></script>
<script src="/static/i18n-zh.js"></script>
<script src="/static/i18n-ko.js"></script>
        <script src="/static/i18n.js"></script>
        <script src="/static/auth-header.js"></script>
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
                        <p><strong>販売手数料：</strong>商品価格の10%（税込）</p>
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

// === 適合車両情報デモページ（本番未使用・サンプルUI） ===
app.get('/vehicle-demo', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>適合車両情報入力デモ - PARTS HUB</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      <style>
        .step-active { background: linear-gradient(135deg, #ef4444, #ec4899); color: white; }
        .step-done { background: #22c55e; color: white; }
        .step-pending { background: #e5e7eb; color: #9ca3af; }
        .cascade-select { transition: all 0.3s ease; }
        .cascade-select:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
        .option-card { transition: all 0.15s ease; }
        .option-card:hover { background: #fef2f2; border-color: #fca5a5; transform: translateY(-1px); }
        .option-card.selected { background: #fef2f2; border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.3); }
        .loading-spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
        .fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .search-input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 12px center; background-size: 20px; padding-left: 40px; }
      </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
      <!-- ヘッダー -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a href="/" class="text-red-500 font-bold text-xl">PARTS HUB</a>
            <span class="text-gray-300">|</span>
            <span class="text-sm text-gray-600"><i class="fas fa-car mr-1"></i>適合車両情報デモ</span>
          </div>
          <span class="badge bg-yellow-100 text-yellow-700">サンプルUI</span>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-8">
        <!-- 説明 -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div class="flex items-start gap-3">
            <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
            <div>
              <p class="text-sm text-blue-800 font-semibold mb-1">カスケード選択デモ</p>
              <p class="text-xs text-blue-600">メーカー → 車種（型式） → 年式 → グレード の順に段階的にデータを取得します。<br>各ステップでサーバーAPIを呼び出しますが、1リクエストあたりの取得量は数十件程度のため、ユーザー操作への影響はほぼありません。</p>
            </div>
          </div>
        </div>

        <!-- パフォーマンス計測パネル -->
        <div id="perf-panel" class="bg-gray-800 text-green-400 rounded-xl p-4 mb-6 font-mono text-xs hidden">
          <div class="flex items-center gap-2 mb-2">
            <i class="fas fa-tachometer-alt"></i>
            <span class="text-white font-semibold">API パフォーマンス</span>
          </div>
          <div id="perf-log" class="space-y-1"></div>
        </div>

        <!-- ステップインジケーター -->
        <div class="flex items-center justify-between mb-8 px-4">
          <div class="flex flex-col items-center gap-1">
            <div id="step-1" class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold step-active"><i class="fas fa-industry"></i></div>
            <span class="text-xs text-gray-500">メーカー</span>
          </div>
          <div class="flex-1 h-0.5 bg-gray-200 mx-2" id="line-1-2"></div>
          <div class="flex flex-col items-center gap-1">
            <div id="step-2" class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold step-pending"><i class="fas fa-car"></i></div>
            <span class="text-xs text-gray-500">車種</span>
          </div>
          <div class="flex-1 h-0.5 bg-gray-200 mx-2" id="line-2-3"></div>
          <div class="flex flex-col items-center gap-1">
            <div id="step-3" class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold step-pending"><i class="fas fa-calendar"></i></div>
            <span class="text-xs text-gray-500">年式</span>
          </div>
          <div class="flex-1 h-0.5 bg-gray-200 mx-2" id="line-3-4"></div>
          <div class="flex flex-col items-center gap-1">
            <div id="step-4" class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold step-pending"><i class="fas fa-star"></i></div>
            <span class="text-xs text-gray-500">グレード</span>
          </div>
        </div>

        <!-- STEP 1: メーカー選択 -->
        <div id="section-maker" class="bg-white rounded-xl shadow-sm border p-6 mb-4 fade-in">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-lg"><i class="fas fa-industry text-red-500 mr-2"></i>メーカー選択</h2>
            <span id="maker-count" class="text-xs text-gray-400"></span>
          </div>
          <!-- 国産/輸入タブ -->
          <div class="flex gap-2 mb-3">
            <button onclick="filterMakers('all')" id="tab-all" class="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-500 text-white">すべて</button>
            <button onclick="filterMakers('JP')" id="tab-JP" class="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">国産</button>
            <button onclick="filterMakers('foreign')" id="tab-foreign" class="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">輸入車</button>
          </div>
          <input type="text" id="maker-search" class="search-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none mb-3" placeholder="メーカー名で検索...">
          <div id="maker-list" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto"></div>
        </div>

        <!-- STEP 2: 車種選択 -->
        <div id="section-model" class="bg-white rounded-xl shadow-sm border p-6 mb-4 opacity-50 pointer-events-none">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-lg"><i class="fas fa-car text-red-500 mr-2"></i>車種選択</h2>
            <div class="flex items-center gap-2">
              <span id="model-count" class="text-xs text-gray-400"></span>
              <button onclick="clearModel()" class="text-xs text-red-500 hover:underline hidden" id="clear-model">クリア</button>
            </div>
          </div>
          <input type="text" id="model-search" class="search-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none mb-3" placeholder="車種名・型式で検索...">
          <div id="model-list" class="space-y-2 max-h-96 overflow-y-auto"></div>
          <div id="model-loading" class="hidden text-center py-8"><div class="loading-spinner inline-block w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full"></div><p class="text-sm text-gray-400 mt-2">車種を読み込み中...</p></div>
        </div>

        <!-- STEP 3: 年式選択 -->
        <div id="section-year" class="bg-white rounded-xl shadow-sm border p-6 mb-4 opacity-50 pointer-events-none">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-lg"><i class="fas fa-calendar text-red-500 mr-2"></i>年式選択</h2>
            <button onclick="clearYear()" class="text-xs text-red-500 hover:underline hidden" id="clear-year">クリア</button>
          </div>
          <div id="year-list" class="flex flex-wrap gap-2"></div>
          <div id="year-loading" class="hidden text-center py-6"><div class="loading-spinner inline-block w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full"></div></div>
        </div>

        <!-- STEP 4: グレード選択 -->
        <div id="section-grade" class="bg-white rounded-xl shadow-sm border p-6 mb-4 opacity-50 pointer-events-none">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-lg"><i class="fas fa-star text-red-500 mr-2"></i>グレード選択</h2>
            <button onclick="clearGrade()" class="text-xs text-red-500 hover:underline hidden" id="clear-grade">クリア</button>
          </div>
          <div id="grade-list" class="space-y-2"></div>
          <div id="grade-loading" class="hidden text-center py-6"><div class="loading-spinner inline-block w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full"></div></div>
          <div id="no-grades" class="hidden text-center py-6 text-sm text-gray-400"><i class="fas fa-info-circle mr-1"></i>この車種のグレード情報はまだ登録されていません<br><span class="text-xs">年式のみの選択で進めることができます</span></div>
        </div>

        <!-- 結果表示 -->
        <div id="result-panel" class="hidden bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6 mb-4 fade-in">
          <h3 class="font-bold text-lg mb-4 text-red-700"><i class="fas fa-check-circle mr-2"></i>選択された適合車両情報</h3>
          <div id="result-content" class="space-y-3"></div>
          <div class="mt-4 pt-4 border-t border-red-200 flex gap-3">
            <button onclick="resetAll()" class="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors"><i class="fas fa-redo mr-1"></i>最初からやり直す</button>
            <button onclick="alert('この適合情報で出品に進みます（デモ）')" class="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition-colors"><i class="fas fa-check mr-1"></i>この情報で確定</button>
          </div>
        </div>

        <!-- データ統計 -->
        <div class="bg-white rounded-xl shadow-sm border p-6 mt-6">
          <h3 class="font-bold text-sm text-gray-700 mb-3"><i class="fas fa-database text-gray-400 mr-2"></i>データベース統計</h3>
          <div id="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="bg-gray-50 rounded-lg p-3">
              <div id="stat-makers" class="text-2xl font-bold text-red-500">-</div>
              <div class="text-xs text-gray-500">メーカー</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div id="stat-models" class="text-2xl font-bold text-blue-500">-</div>
              <div class="text-xs text-gray-500">車種</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div id="stat-grades" class="text-2xl font-bold text-green-500">-</div>
              <div class="text-xs text-gray-500">グレード</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div id="stat-avg-time" class="text-2xl font-bold text-purple-500">-</div>
              <div class="text-xs text-gray-500">平均API応答(ms)</div>
            </div>
          </div>
        </div>
      </main>

      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      <script>
        // ============ 状態管理 ============
        var allMakers = [];
        var allModels = [];
        var selectedMaker = null;
        var selectedModel = null;
        var selectedYear = null;
        var selectedGrade = null;
        var makerFilter = 'all';
        var apiTimes = [];

        // ============ パフォーマンス計測 ============
        function logPerf(label, ms, count) {
          apiTimes.push(ms);
          var panel = document.getElementById('perf-panel');
          panel.classList.remove('hidden');
          var log = document.getElementById('perf-log');
          var color = ms < 100 ? 'text-green-400' : ms < 300 ? 'text-yellow-400' : 'text-red-400';
          log.innerHTML += '<div class="flex justify-between"><span class="text-gray-400">' + new Date().toLocaleTimeString() + '</span><span>' + label + '</span><span class="' + color + '">' + ms + 'ms</span><span class="text-gray-500">' + count + '件</span></div>';
          // 平均を更新
          var avg = Math.round(apiTimes.reduce(function(a,b){return a+b},0) / apiTimes.length);
          document.getElementById('stat-avg-time').textContent = avg;
        }

        // ============ ステップUI更新 ============
        function setStep(n) {
          for (var i = 1; i <= 4; i++) {
            var el = document.getElementById('step-' + i);
            el.className = el.className.replace(/step-\\S+/g, '');
            if (i < n) el.classList.add('step-done');
            else if (i === n) el.classList.add('step-active');
            else el.classList.add('step-pending');
          }
          ['line-1-2','line-2-3','line-3-4'].forEach(function(id, idx) {
            document.getElementById(id).style.background = idx < n - 1 ? '#22c55e' : '#e5e7eb';
          });
        }

        function enableSection(id) {
          var el = document.getElementById(id);
          el.classList.remove('opacity-50', 'pointer-events-none');
          el.classList.add('fade-in');
        }
        function disableSection(id) {
          var el = document.getElementById(id);
          el.classList.add('opacity-50', 'pointer-events-none');
        }

        // ============ STEP 1: メーカー ============
        async function loadMakers() {
          var t0 = Date.now();
          try {
            var res = await axios.get('/api/vehicle-demo/makers');
            var ms = Date.now() - t0;
            allMakers = res.data.data || [];
            document.getElementById('stat-makers').textContent = allMakers.length;
            logPerf('GET /makers', ms, allMakers.length);
            renderMakers();
          } catch(e) { console.error(e); }
        }

        function filterMakers(filter) {
          makerFilter = filter;
          ['all','JP','foreign'].forEach(function(f) {
            var btn = document.getElementById('tab-' + f);
            if (f === filter) { btn.className = 'px-3 py-1.5 text-xs font-semibold rounded-full bg-red-500 text-white'; }
            else { btn.className = 'px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200'; }
          });
          renderMakers();
        }

        function renderMakers() {
          var q = document.getElementById('maker-search').value.toLowerCase();
          var filtered = allMakers.filter(function(m) {
            if (makerFilter === 'JP' && m.country !== 'JP') return false;
            if (makerFilter === 'foreign' && m.country === 'JP') return false;
            if (q && m.name.toLowerCase().indexOf(q) === -1 && (m.name_en||'').toLowerCase().indexOf(q) === -1) return false;
            return true;
          });
          document.getElementById('maker-count').textContent = filtered.length + '社';
          var countryFlags = { JP:'🇯🇵', DE:'🇩🇪', GB:'🇬🇧', FR:'🇫🇷', IT:'🇮🇹', US:'🇺🇸', SE:'🇸🇪', KR:'🇰🇷', CN:'🇨🇳' };
          document.getElementById('maker-list').innerHTML = filtered.map(function(m) {
            var sel = selectedMaker && selectedMaker.id === m.id;
            return '<div class="option-card border-2 rounded-lg p-3 cursor-pointer text-center ' + (sel ? 'selected' : 'border-gray-200') + '" onclick="selectMaker(' + m.id + ')">' +
              '<div class="text-lg mb-1">' + (countryFlags[m.country] || '🌐') + '</div>' +
              '<div class="text-sm font-semibold text-gray-800">' + m.name + '</div>' +
              '<div class="text-xs text-gray-400">' + (m.name_en || '') + '</div></div>';
          }).join('');
        }

        document.getElementById('maker-search').addEventListener('input', renderMakers);

        async function selectMaker(id) {
          selectedMaker = allMakers.find(function(m) { return m.id === id; });
          selectedModel = null; selectedYear = null; selectedGrade = null;
          renderMakers();
          setStep(2);
          enableSection('section-model');
          disableSection('section-year');
          disableSection('section-grade');
          document.getElementById('result-panel').classList.add('hidden');
          document.getElementById('clear-model').classList.remove('hidden');
          document.getElementById('model-search').value = '';

          // 車種読み込み
          document.getElementById('model-list').innerHTML = '';
          document.getElementById('model-loading').classList.remove('hidden');
          var t0 = Date.now();
          try {
            var res = await axios.get('/api/vehicle-demo/makers/' + id + '/models');
            var ms = Date.now() - t0;
            allModels = res.data.data || [];
            logPerf('GET /makers/' + id + '/models', ms, allModels.length);
            document.getElementById('stat-models').textContent = allModels.length;
            renderModels();
          } catch(e) { console.error(e); }
          document.getElementById('model-loading').classList.add('hidden');
        }

        function renderModels() {
          var q = document.getElementById('model-search').value.toLowerCase();
          var filtered = allModels.filter(function(m) {
            if (q && m.name.toLowerCase().indexOf(q) === -1 && (m.model_code||'').toLowerCase().indexOf(q) === -1) return false;
            return true;
          });
          document.getElementById('model-count').textContent = filtered.length + '車種';
          document.getElementById('model-list').innerHTML = filtered.map(function(m) {
            var sel = selectedModel && selectedModel.id === m.id;
            var bodyColors = { 'セダン':'blue', 'SUV':'green', 'ミニバン':'purple', 'ハッチバック':'orange', 'クーペ':'red', '軽自動車':'pink', 'オープン':'yellow', 'ステーションワゴン':'teal', 'ピックアップ':'amber', 'トールワゴン':'indigo', '軽バン':'gray', '軽トラック':'stone' };
            var bc = bodyColors[m.body_type] || 'gray';
            return '<div class="option-card border-2 rounded-lg p-4 cursor-pointer ' + (sel ? 'selected' : 'border-gray-200') + '" onclick="selectModel(' + m.id + ')">' +
              '<div class="flex items-center justify-between">' +
                '<div class="min-w-0 flex-1">' +
                  '<div class="flex items-center gap-2 flex-wrap">' +
                    '<span class="font-bold text-gray-800">' + m.name + '</span>' +
                    (m.generation ? '<span class="badge bg-gray-100 text-gray-600">' + m.generation + '</span>' : '') +
                    (m.body_type ? '<span class="badge bg-' + bc + '-100 text-' + bc + '-600">' + m.body_type + '</span>' : '') +
                  '</div>' +
                  '<div class="flex items-center gap-3 mt-1 text-xs text-gray-500">' +
                    (m.model_code ? '<span><i class="fas fa-hashtag mr-0.5"></i>' + m.model_code + '</span>' : '') +
                    '<span><i class="fas fa-calendar mr-0.5"></i>' + m.year_from + '〜' + (m.year_to >= 2026 ? '現行' : m.year_to) + '</span>' +
                    (m.engine_type ? '<span><i class="fas fa-cog mr-0.5"></i>' + m.engine_type + '</span>' : '') +
                  '</div>' +
                '</div>' +
                '<i class="fas fa-chevron-right text-gray-300 ml-3"></i>' +
              '</div></div>';
          }).join('');
        }

        document.getElementById('model-search').addEventListener('input', renderModels);

        async function selectModel(id) {
          selectedModel = allModels.find(function(m) { return m.id === id; });
          selectedYear = null; selectedGrade = null;
          renderModels();
          setStep(3);
          enableSection('section-year');
          disableSection('section-grade');
          document.getElementById('result-panel').classList.add('hidden');
          document.getElementById('clear-year').classList.add('hidden');

          // 年式読み込み
          document.getElementById('year-list').innerHTML = '';
          document.getElementById('year-loading').classList.remove('hidden');
          var t0 = Date.now();
          try {
            var res = await axios.get('/api/vehicle-demo/models/' + id + '/years');
            var ms = Date.now() - t0;
            var years = res.data.data || [];
            logPerf('GET /models/' + id + '/years', ms, years.length);
            document.getElementById('year-list').innerHTML = years.map(function(y) {
              return '<button class="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-semibold hover:border-red-400 hover:bg-red-50 transition-colors option-card" onclick="selectYear(' + y + ', this)">' + y + '年</button>';
            }).join('');
          } catch(e) { console.error(e); }
          document.getElementById('year-loading').classList.add('hidden');
        }

        async function selectYear(year, el) {
          selectedYear = year; selectedGrade = null;
          document.getElementById('clear-year').classList.remove('hidden');
          document.querySelectorAll('#year-list button').forEach(function(b) { b.classList.remove('selected', '!border-red-500', '!bg-red-50'); });
          if (el) { el.classList.add('selected', '!border-red-500', '!bg-red-50'); }
          setStep(4);
          enableSection('section-grade');

          // グレード読み込み
          document.getElementById('grade-list').innerHTML = '';
          document.getElementById('no-grades').classList.add('hidden');
          document.getElementById('grade-loading').classList.remove('hidden');
          var t0 = Date.now();
          try {
            var res = await axios.get('/api/vehicle-demo/models/' + selectedModel.id + '/grades');
            var ms = Date.now() - t0;
            var grades = res.data.data || [];
            document.getElementById('stat-grades').textContent = grades.length;
            logPerf('GET /models/' + selectedModel.id + '/grades', ms, grades.length);
            if (grades.length === 0) {
              document.getElementById('no-grades').classList.remove('hidden');
              showResult(); // グレードなしでも結果を表示
            } else {
              document.getElementById('grade-list').innerHTML = grades.map(function(g) {
                return '<div class="option-card border-2 border-gray-200 rounded-lg p-4 cursor-pointer" onclick="selectGrade(' + g.id + ', this)">' +
                  '<div class="flex items-center justify-between">' +
                    '<div>' +
                      '<span class="font-bold text-gray-800">' + g.name + '</span>' +
                      '<div class="flex flex-wrap gap-2 mt-1">' +
                        (g.displacement ? '<span class="badge bg-blue-50 text-blue-600">' + g.displacement + 'cc</span>' : '') +
                        (g.transmission ? '<span class="badge bg-green-50 text-green-600">' + g.transmission + '</span>' : '') +
                        (g.drive_type ? '<span class="badge bg-purple-50 text-purple-600">' + g.drive_type + '</span>' : '') +
                        (g.fuel_type ? '<span class="badge bg-orange-50 text-orange-600">' + g.fuel_type + '</span>' : '') +
                      '</div>' +
                    '</div>' +
                    '<i class="fas fa-chevron-right text-gray-300"></i>' +
                  '</div></div>';
              }).join('');
            }
          } catch(e) { console.error(e); }
          document.getElementById('grade-loading').classList.add('hidden');
        }

        function selectGrade(id, el) {
          var grades = []; // 再取得の代わりに DOM から情報取得
          document.querySelectorAll('#grade-list .option-card').forEach(function(c) { c.classList.remove('selected'); });
          if (el) el.classList.add('selected');
          selectedGrade = { id: id, name: el ? el.querySelector('.font-bold').textContent : '' };
          document.getElementById('clear-grade').classList.remove('hidden');
          showResult();
        }

        // ============ 結果表示 ============
        function showResult() {
          var panel = document.getElementById('result-panel');
          panel.classList.remove('hidden');
          var rows = [
            ['メーカー', selectedMaker ? selectedMaker.name + (selectedMaker.name_en ? ' (' + selectedMaker.name_en + ')' : '') : '-'],
            ['車種', selectedModel ? selectedModel.name + (selectedModel.generation ? ' ' + selectedModel.generation : '') : '-'],
            ['型式', selectedModel && selectedModel.model_code ? selectedModel.model_code : '-'],
            ['年式', selectedYear ? selectedYear + '年' : '-'],
            ['グレード', selectedGrade ? selectedGrade.name : '(未選択)'],
            ['ボディタイプ', selectedModel ? (selectedModel.body_type || '-') : '-'],
            ['エンジン型式', selectedModel ? (selectedModel.engine_type || '-') : '-']
          ];
          document.getElementById('result-content').innerHTML = rows.map(function(r) {
            return '<div class="flex justify-between items-center py-2 border-b border-red-100 last:border-0"><span class="text-sm text-gray-500">' + r[0] + '</span><span class="font-semibold text-sm text-gray-800">' + r[1] + '</span></div>';
          }).join('');
        }

        // ============ クリア操作 ============
        function clearModel() {
          selectedModel = null; selectedYear = null; selectedGrade = null;
          allModels = [];
          document.getElementById('model-list').innerHTML = '';
          document.getElementById('clear-model').classList.add('hidden');
          disableSection('section-year');
          disableSection('section-grade');
          document.getElementById('result-panel').classList.add('hidden');
          setStep(2);
        }
        function clearYear() {
          selectedYear = null; selectedGrade = null;
          document.querySelectorAll('#year-list button').forEach(function(b) { b.classList.remove('selected', '!border-red-500', '!bg-red-50'); });
          document.getElementById('clear-year').classList.add('hidden');
          disableSection('section-grade');
          document.getElementById('result-panel').classList.add('hidden');
          setStep(3);
        }
        function clearGrade() {
          selectedGrade = null;
          document.querySelectorAll('#grade-list .option-card').forEach(function(c) { c.classList.remove('selected'); });
          document.getElementById('clear-grade').classList.add('hidden');
        }
        function resetAll() {
          selectedMaker = null; selectedModel = null; selectedYear = null; selectedGrade = null;
          allModels = [];
          setStep(1);
          disableSection('section-model');
          disableSection('section-year');
          disableSection('section-grade');
          document.getElementById('result-panel').classList.add('hidden');
          document.getElementById('maker-search').value = '';
          filterMakers('all');
          renderMakers();
        }

        // ============ 初期化 ============
        loadMakers();
      </script>
    </body>
    </html>
  `)
})

// === 銀行情報入力デモページ（本番未使用・サンプルUI） ===
app.get('/bank-demo', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>銀行口座情報入力デモ - PARTS HUB</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: { extend: { colors: { primary: '#ef4444', 'primary-dark': '#dc2626' } } }
          }
        </script>
        <style>
          .autocomplete-dropdown {
            max-height: 280px;
            overflow-y: auto;
            scrollbar-width: thin;
          }
          .autocomplete-dropdown::-webkit-scrollbar { width: 6px; }
          .autocomplete-dropdown::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
          .autocomplete-item { transition: background 0.1s; }
          .autocomplete-item:hover, .autocomplete-item.active { background: #fef2f2; }
          .autocomplete-item .code { color: #9ca3af; font-size: 12px; font-family: monospace; }
          .autocomplete-item .name { color: #1f2937; font-weight: 500; }
          .autocomplete-item .kana { color: #6b7280; font-size: 12px; }
          .field-success { border-color: #22c55e !important; }
          .field-success + .check-icon { display: flex !important; }
          .step-badge { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
          .step-active { background: #ef4444; color: white; }
          .step-done { background: #22c55e; color: white; }
          .step-pending { background: #e5e7eb; color: #9ca3af; }
          .fade-in { animation: fadeIn 0.2s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
          .katakana-preview { background: #f9fafb; border: 1px dashed #d1d5db; padding: 8px 12px; border-radius: 8px; font-size: 14px; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white shadow-sm border-b sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/" class="flex items-center gap-2 text-gray-800 font-bold text-lg">
                    <i class="fas fa-cog text-primary"></i> PARTS HUB
                </a>
                <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                    <i class="fas fa-flask mr-1"></i>サンプルUI
                </span>
            </div>
        </header>

        <main class="max-w-2xl mx-auto px-4 py-8">
            <!-- タイトル -->
            <div class="text-center mb-8">
                <h1 class="text-2xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-university text-primary mr-2"></i>銀行口座情報入力
                </h1>
                <p class="text-gray-500 text-sm">振込先の銀行口座を簡単に設定できます</p>
            </div>

            <!-- ステップインジケーター -->
            <div class="flex items-center justify-center gap-3 mb-8">
                <div class="flex items-center gap-2">
                    <div class="step-badge step-active" id="step1-badge">1</div>
                    <span class="text-sm font-semibold text-gray-700">金融機関</span>
                </div>
                <div class="w-8 h-0.5 bg-gray-300" id="step-line1"></div>
                <div class="flex items-center gap-2">
                    <div class="step-badge step-pending" id="step2-badge">2</div>
                    <span class="text-sm text-gray-400" id="step2-label">支店</span>
                </div>
                <div class="w-8 h-0.5 bg-gray-300" id="step-line2"></div>
                <div class="flex items-center gap-2">
                    <div class="step-badge step-pending" id="step3-badge">3</div>
                    <span class="text-sm text-gray-400" id="step3-label">口座情報</span>
                </div>
            </div>

            <!-- フォーム -->
            <div class="bg-white rounded-2xl shadow-sm border p-6 space-y-6">

                <!-- STEP 1: 金融機関選択 -->
                <div id="bank-section">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-building text-primary mr-1"></i>金融機関名
                        <span class="text-red-500 ml-1">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" id="bank-input"
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-primary focus:outline-none transition-colors"
                            placeholder="ひらがなで入力（例: みずほ）"
                            autocomplete="off">
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center justify-center w-6 h-6 bg-green-500 rounded-full check-icon">
                            <i class="fas fa-check text-white text-xs"></i>
                        </div>
                        <div id="bank-dropdown" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 autocomplete-dropdown fade-in"></div>
                    </div>
                    <div id="bank-selected-info" class="hidden mt-2 flex items-center gap-2 text-sm">
                        <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono text-xs" id="bank-code-display"></span>
                        <span class="text-gray-700 font-medium" id="bank-name-display"></span>
                        <button onclick="clearBank()" class="ml-auto text-gray-400 hover:text-red-500 text-xs">
                            <i class="fas fa-times-circle"></i> クリア
                        </button>
                    </div>
                    <p class="text-xs text-gray-400 mt-1.5"><i class="fas fa-lightbulb mr-1"></i>ひらがな・カタカナ・漢字・コードで検索できます</p>
                </div>

                <!-- STEP 2: 支店選択 -->
                <div id="branch-section" class="opacity-40 pointer-events-none transition-all duration-300">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-map-marker-alt text-primary mr-1"></i>支店名
                        <span class="text-red-500 ml-1">*</span>
                    </label>
                    <div class="relative">
                        <input type="text" id="branch-input"
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-primary focus:outline-none transition-colors"
                            placeholder="支店名またはコードを入力"
                            autocomplete="off" disabled>
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center justify-center w-6 h-6 bg-green-500 rounded-full check-icon">
                            <i class="fas fa-check text-white text-xs"></i>
                        </div>
                        <div id="branch-dropdown" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 autocomplete-dropdown fade-in"></div>
                    </div>
                    <div id="branch-selected-info" class="hidden mt-2 flex items-center gap-2 text-sm">
                        <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono text-xs" id="branch-code-display"></span>
                        <span class="text-gray-700 font-medium" id="branch-name-display"></span>
                        <button onclick="clearBranch()" class="ml-auto text-gray-400 hover:text-red-500 text-xs">
                            <i class="fas fa-times-circle"></i> クリア
                        </button>
                    </div>
                </div>

                <!-- 区切り線 -->
                <div class="border-t border-dashed border-gray-200"></div>

                <!-- STEP 3: 口座情報入力 -->
                <div id="account-section" class="opacity-40 pointer-events-none transition-all duration-300">
                    <h3 class="text-sm font-semibold text-gray-700 mb-4">
                        <i class="fas fa-credit-card text-primary mr-1"></i>口座情報
                    </h3>

                    <!-- 口座種別 -->
                    <div class="mb-4">
                        <label class="block text-sm text-gray-600 mb-2">口座種別 <span class="text-red-500">*</span></label>
                        <div class="flex gap-3">
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="account-type" value="普通" class="sr-only peer" checked disabled>
                                <div class="py-2.5 text-center border-2 border-gray-200 rounded-xl text-sm font-medium peer-checked:border-primary peer-checked:bg-red-50 peer-checked:text-primary transition-all">
                                    普通
                                </div>
                            </label>
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="account-type" value="当座" class="sr-only peer" disabled>
                                <div class="py-2.5 text-center border-2 border-gray-200 rounded-xl text-sm font-medium peer-checked:border-primary peer-checked:bg-red-50 peer-checked:text-primary transition-all">
                                    当座
                                </div>
                            </label>
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="account-type" value="貯蓄" class="sr-only peer" disabled>
                                <div class="py-2.5 text-center border-2 border-gray-200 rounded-xl text-sm font-medium peer-checked:border-primary peer-checked:bg-red-50 peer-checked:text-primary transition-all">
                                    貯蓄
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- 口座番号 -->
                    <div class="mb-4">
                        <label class="block text-sm text-gray-600 mb-2">口座番号 <span class="text-red-500">*</span></label>
                        <input type="text" id="account-number"
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-mono tracking-wider focus:border-primary focus:outline-none transition-colors"
                            placeholder="7桁の口座番号"
                            maxlength="7" inputmode="numeric" pattern="[0-9]*" disabled>
                    </div>

                    <!-- 口座名義 -->
                    <div class="mb-4">
                        <label class="block text-sm text-gray-600 mb-2">口座名義（カタカナ） <span class="text-red-500">*</span></label>
                        <input type="text" id="account-holder"
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-primary focus:outline-none transition-colors"
                            placeholder="カタカナで入力（例: ヤマダ タロウ）" disabled>
                        <div id="katakana-preview" class="hidden mt-2 katakana-preview">
                            <span class="text-xs text-gray-500">口座名義：</span>
                            <span id="katakana-text" class="font-medium"></span>
                        </div>
                    </div>
                </div>

                <!-- 確認ボタン -->
                <button id="submit-btn" onclick="submitForm()"
                    class="w-full py-3.5 bg-gray-300 text-white rounded-xl font-bold text-base cursor-not-allowed transition-all"
                    disabled>
                    <i class="fas fa-check-circle mr-2"></i>口座情報を確認する
                </button>
            </div>

            <!-- 確認モーダル -->
            <div id="confirm-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 fade-in">
                    <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">
                        <i class="fas fa-clipboard-check text-primary mr-2"></i>入力内容の確認
                    </h3>
                    <div class="space-y-3 mb-6" id="confirm-details"></div>
                    <div class="flex gap-3">
                        <button onclick="closeModal()" class="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50">
                            修正する
                        </button>
                        <button onclick="finalSubmit()" class="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark">
                            登録する
                        </button>
                    </div>
                </div>
            </div>

            <!-- 完了メッセージ -->
            <div id="success-msg" class="hidden mt-6 bg-green-50 border border-green-200 rounded-2xl p-6 text-center fade-in">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-check text-green-500 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-green-700 mb-1">登録完了</h3>
                <p class="text-green-600 text-sm">銀行口座情報が正常に登録されました。</p>
            </div>

            <!-- サンプルUI説明 -->
            <div class="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h4 class="text-sm font-bold text-blue-800 mb-2"><i class="fas fa-info-circle mr-1"></i>このページについて</h4>
                <ul class="text-xs text-blue-700 space-y-1.5">
                    <li>• これはサンプルUIです。実際のデータは保存されません。</li>
                    <li>• 主要銀行（都市銀行・ネット銀行・地方銀行・信用金庫など）<span id="bank-count"></span>行、約<span id="branch-count"></span>支店のデータを内蔵</li>
                    <li>• ひらがな、カタカナ、漢字、金融機関コードで検索可能</li>
                    <li>• 本番実装時は全国銀行協会の完全データ（約1,500行・30,000支店）に拡張予定</li>
                </ul>
            </div>
        </main>

        <script src="/static/bank-db.js"></script>
        <script>
        (function() {
            'use strict';

            // === 状態管理 ===
            var state = {
                selectedBank: null,
                selectedBranch: null,
                bankDropdownIndex: -1,
                branchDropdownIndex: -1
            };

            // データ統計
            var totalBanks = BANK_DB.banks.length;
            var totalBranches = BANK_DB.banks.reduce(function(sum, b) { return sum + b.branches.length; }, 0);
            document.getElementById('bank-count').textContent = totalBanks;
            document.getElementById('branch-count').textContent = totalBranches;

            // === カタカナ→ひらがな変換 ===
            function kataToHira(str) {
                return str.replace(/[\\u30A1-\\u30FA]/g, function(ch) {
                    return String.fromCharCode(ch.charCodeAt(0) - 0x60);
                });
            }

            // === 検索マッチング ===
            function matchBank(bank, query) {
                var q = query.toLowerCase();
                var qHira = kataToHira(q);
                if (bank.kana.indexOf(qHira) !== -1) return true;
                if (bank.name.toLowerCase().indexOf(q) !== -1) return true;
                if (bank.code.indexOf(q) !== -1) return true;
                return false;
            }

            function matchBranch(branch, query) {
                var q = query.toLowerCase();
                var qHira = kataToHira(q);
                if (branch.kana.indexOf(qHira) !== -1) return true;
                if (branch.name.toLowerCase().indexOf(q) !== -1) return true;
                if (branch.code.indexOf(q) !== -1) return true;
                return false;
            }

            // === ハイライト表示 ===
            function highlight(text, query) {
                if (!query) return text;
                var idx = text.toLowerCase().indexOf(query.toLowerCase());
                if (idx === -1) return text;
                return text.substring(0, idx) + '<mark class="bg-yellow-200 rounded px-0.5">' + text.substring(idx, idx + query.length) + '</mark>' + text.substring(idx + query.length);
            }

            // === 銀行検索 ===
            var bankInput = document.getElementById('bank-input');
            var bankDropdown = document.getElementById('bank-dropdown');

            bankInput.addEventListener('input', function() {
                var q = this.value.trim();
                if (q.length === 0) { bankDropdown.classList.add('hidden'); return; }

                var results = BANK_DB.banks.filter(function(b) { return matchBank(b, q); }).slice(0, 15);
                if (results.length === 0) {
                    bankDropdown.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm"><i class="fas fa-search mr-1"></i>該当する金融機関が見つかりません</div>';
                    bankDropdown.classList.remove('hidden');
                    return;
                }

                var html = results.map(function(b, i) {
                    return '<div class="autocomplete-item px-4 py-2.5 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0" data-index="' + i + '" data-code="' + b.code + '">' +
                        '<span class="code w-12 text-center">' + b.code + '</span>' +
                        '<div class="flex-1 min-w-0">' +
                            '<div class="name">' + highlight(b.name, q) + '</div>' +
                            '<div class="kana">' + highlight(b.kana, q) + '</div>' +
                        '</div>' +
                        '<span class="text-xs text-gray-400">' + b.branches.length + '支店</span>' +
                    '</div>';
                }).join('');
                bankDropdown.innerHTML = html;
                bankDropdown.classList.remove('hidden');
                state.bankDropdownIndex = -1;

                bankDropdown.querySelectorAll('.autocomplete-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        var code = this.getAttribute('data-code');
                        selectBank(code);
                    });
                });
            });

            bankInput.addEventListener('keydown', function(e) {
                var items = bankDropdown.querySelectorAll('.autocomplete-item');
                if (items.length === 0) return;
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    state.bankDropdownIndex = Math.min(state.bankDropdownIndex + 1, items.length - 1);
                    updateDropdownHighlight(items, state.bankDropdownIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    state.bankDropdownIndex = Math.max(state.bankDropdownIndex - 1, 0);
                    updateDropdownHighlight(items, state.bankDropdownIndex);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (state.bankDropdownIndex >= 0 && items[state.bankDropdownIndex]) {
                        items[state.bankDropdownIndex].click();
                    }
                }
            });

            function updateDropdownHighlight(items, idx) {
                items.forEach(function(it, i) {
                    it.classList.toggle('active', i === idx);
                    if (i === idx) it.scrollIntoView({ block: 'nearest' });
                });
            }

            function selectBank(code) {
                var bank = BANK_DB.banks.find(function(b) { return b.code === code; });
                if (!bank) return;
                state.selectedBank = bank;
                state.selectedBranch = null;

                bankInput.value = bank.name;
                bankInput.classList.add('field-success');
                bankDropdown.classList.add('hidden');

                document.getElementById('bank-code-display').textContent = bank.code;
                document.getElementById('bank-name-display').textContent = bank.name;
                document.getElementById('bank-selected-info').classList.remove('hidden');

                // Step 2を有効化
                var branchSection = document.getElementById('branch-section');
                branchSection.classList.remove('opacity-40', 'pointer-events-none');
                var branchInput = document.getElementById('branch-input');
                branchInput.disabled = false;
                branchInput.value = '';
                branchInput.placeholder = bank.name + 'の支店名またはコードを入力';
                branchInput.focus();
                document.getElementById('branch-selected-info').classList.add('hidden');
                branchInput.classList.remove('field-success');

                updateSteps(2);
                updateSubmitBtn();
            }

            window.clearBank = function() {
                state.selectedBank = null;
                state.selectedBranch = null;
                bankInput.value = '';
                bankInput.classList.remove('field-success');
                document.getElementById('bank-selected-info').classList.add('hidden');

                var branchSection = document.getElementById('branch-section');
                branchSection.classList.add('opacity-40', 'pointer-events-none');
                document.getElementById('branch-input').disabled = true;
                document.getElementById('branch-input').value = '';
                document.getElementById('branch-input').classList.remove('field-success');
                document.getElementById('branch-selected-info').classList.add('hidden');

                var accountSection = document.getElementById('account-section');
                accountSection.classList.add('opacity-40', 'pointer-events-none');
                disableAccountFields(true);

                updateSteps(1);
                updateSubmitBtn();
                bankInput.focus();
            };

            // === 支店検索 ===
            var branchInput = document.getElementById('branch-input');
            var branchDropdown = document.getElementById('branch-dropdown');

            branchInput.addEventListener('input', function() {
                if (!state.selectedBank) return;
                var q = this.value.trim();

                var branches = state.selectedBank.branches;
                var results = q.length === 0 ? branches.slice(0, 20) : branches.filter(function(b) { return matchBranch(b, q); }).slice(0, 20);

                if (results.length === 0) {
                    branchDropdown.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm"><i class="fas fa-search mr-1"></i>該当する支店が見つかりません</div>';
                    branchDropdown.classList.remove('hidden');
                    return;
                }

                var html = results.map(function(b, i) {
                    return '<div class="autocomplete-item px-4 py-2.5 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0" data-index="' + i + '" data-code="' + b.code + '">' +
                        '<span class="code w-10 text-center">' + b.code + '</span>' +
                        '<div class="flex-1 min-w-0">' +
                            '<div class="name">' + (q ? highlight(b.name, q) : b.name) + '</div>' +
                            '<div class="kana">' + (q ? highlight(b.kana, q) : b.kana) + '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');
                branchDropdown.innerHTML = html;
                branchDropdown.classList.remove('hidden');
                state.branchDropdownIndex = -1;

                branchDropdown.querySelectorAll('.autocomplete-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        var code = this.getAttribute('data-code');
                        selectBranch(code);
                    });
                });
            });

            branchInput.addEventListener('focus', function() {
                if (state.selectedBank && !state.selectedBranch) {
                    this.dispatchEvent(new Event('input'));
                }
            });

            branchInput.addEventListener('keydown', function(e) {
                var items = branchDropdown.querySelectorAll('.autocomplete-item');
                if (items.length === 0) return;
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    state.branchDropdownIndex = Math.min(state.branchDropdownIndex + 1, items.length - 1);
                    updateDropdownHighlight(items, state.branchDropdownIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    state.branchDropdownIndex = Math.max(state.branchDropdownIndex - 1, 0);
                    updateDropdownHighlight(items, state.branchDropdownIndex);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (state.branchDropdownIndex >= 0 && items[state.branchDropdownIndex]) {
                        items[state.branchDropdownIndex].click();
                    }
                }
            });

            function selectBranch(code) {
                var branch = state.selectedBank.branches.find(function(b) { return b.code === code; });
                if (!branch) return;
                state.selectedBranch = branch;

                branchInput.value = branch.name;
                branchInput.classList.add('field-success');
                branchDropdown.classList.add('hidden');

                document.getElementById('branch-code-display').textContent = branch.code;
                document.getElementById('branch-name-display').textContent = branch.name;
                document.getElementById('branch-selected-info').classList.remove('hidden');

                // Step 3を有効化
                var accountSection = document.getElementById('account-section');
                accountSection.classList.remove('opacity-40', 'pointer-events-none');
                disableAccountFields(false);
                document.getElementById('account-number').focus();

                updateSteps(3);
                updateSubmitBtn();
            }

            window.clearBranch = function() {
                state.selectedBranch = null;
                branchInput.value = '';
                branchInput.classList.remove('field-success');
                document.getElementById('branch-selected-info').classList.add('hidden');

                var accountSection = document.getElementById('account-section');
                accountSection.classList.add('opacity-40', 'pointer-events-none');
                disableAccountFields(true);

                updateSteps(2);
                updateSubmitBtn();
                branchInput.focus();
            };

            function disableAccountFields(disabled) {
                document.querySelectorAll('#account-section input').forEach(function(el) { el.disabled = disabled; });
            }

            // === 口座番号バリデーション ===
            document.getElementById('account-number').addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value.length === 7) {
                    this.classList.add('field-success');
                } else {
                    this.classList.remove('field-success');
                }
                updateSubmitBtn();
            });

            // === 口座名義プレビュー ===
            document.getElementById('account-holder').addEventListener('input', function() {
                var val = this.value.trim();
                var preview = document.getElementById('katakana-preview');
                var text = document.getElementById('katakana-text');
                if (val.length > 0) {
                    preview.classList.remove('hidden');
                    text.textContent = val;
                    this.classList.add('field-success');
                } else {
                    preview.classList.add('hidden');
                    this.classList.remove('field-success');
                }
                updateSubmitBtn();
            });

            // === ステップ更新 ===
            function updateSteps(current) {
                for (var i = 1; i <= 3; i++) {
                    var badge = document.getElementById('step' + i + '-badge');
                    badge.className = 'step-badge ' + (i < current ? 'step-done' : (i === current ? 'step-active' : 'step-pending'));
                    if (i < current) badge.innerHTML = '<i class="fas fa-check text-xs"></i>';
                    else badge.textContent = i;
                }
                if (current >= 2) document.getElementById('step2-label').className = 'text-sm font-semibold text-gray-700';
                else document.getElementById('step2-label').className = 'text-sm text-gray-400';
                if (current >= 3) document.getElementById('step3-label').className = 'text-sm font-semibold text-gray-700';
                else document.getElementById('step3-label').className = 'text-sm text-gray-400';
            }

            // === 送信ボタン更新 ===
            function updateSubmitBtn() {
                var btn = document.getElementById('submit-btn');
                var valid = state.selectedBank && state.selectedBranch &&
                    document.getElementById('account-number').value.length === 7 &&
                    document.getElementById('account-holder').value.trim().length > 0;
                if (valid) {
                    btn.disabled = false;
                    btn.className = 'w-full py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-dark transition-all shadow-sm cursor-pointer';
                } else {
                    btn.disabled = true;
                    btn.className = 'w-full py-3.5 bg-gray-300 text-white rounded-xl font-bold text-base cursor-not-allowed transition-all';
                }
            }

            // === 確認モーダル ===
            window.submitForm = function() {
                var accountType = document.querySelector('input[name="account-type"]:checked').value;
                var html = [
                    '<div class="flex justify-between py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">金融機関</span><span class="font-medium text-sm">' + state.selectedBank.name + ' (' + state.selectedBank.code + ')</span></div>',
                    '<div class="flex justify-between py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">支店</span><span class="font-medium text-sm">' + state.selectedBranch.name + ' (' + state.selectedBranch.code + ')</span></div>',
                    '<div class="flex justify-between py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">口座種別</span><span class="font-medium text-sm">' + accountType + '</span></div>',
                    '<div class="flex justify-between py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">口座番号</span><span class="font-medium text-sm font-mono">' + document.getElementById('account-number').value + '</span></div>',
                    '<div class="flex justify-between py-2"><span class="text-gray-500 text-sm">口座名義</span><span class="font-medium text-sm">' + document.getElementById('account-holder').value + '</span></div>',
                ].join('');
                document.getElementById('confirm-details').innerHTML = html;
                document.getElementById('confirm-modal').classList.remove('hidden');
            };

            window.closeModal = function() {
                document.getElementById('confirm-modal').classList.add('hidden');
            };

            window.finalSubmit = function() {
                document.getElementById('confirm-modal').classList.add('hidden');
                document.getElementById('success-msg').classList.remove('hidden');
                document.getElementById('success-msg').scrollIntoView({ behavior: 'smooth', block: 'center' });
            };

            // === ドロップダウン外クリックで閉じる ===
            document.addEventListener('click', function(e) {
                if (!bankInput.contains(e.target) && !bankDropdown.contains(e.target)) {
                    bankDropdown.classList.add('hidden');
                }
                if (!branchInput.contains(e.target) && !branchDropdown.contains(e.target)) {
                    branchDropdown.classList.add('hidden');
                }
            });

        })();
        </script>
    </body>
    </html>
  `);
});

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
              "text": "販売手数料は商品価格の10%（税込）です。振込手数料は売上金の出金時に200円かかります。購入者は商品代金と配送料のみで、購入手数料は無料です。"
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
              "text": "会員登録後、「出品する」ボタンから商品情報（写真、タイトル、説明、価格など）を入力するだけで簡単に出品できます。出品は無料で、売れた時のみ販売手数料10%が発生します。"
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
        <meta property="og:url" content="https://parts-hub-tci.com/faq">
        
        <!-- Canonical URL -->
        <link rel="canonical" href="https://parts-hub-tci.com/faq">
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
                                    <p class="text-2xl font-bold text-red-600 mb-1">10%（税込）</p>
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
                                    <strong>出品は無料！</strong>売れた時のみ販売手数料10%が発生します
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
    <loc>https://parts-hub-tci.com/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 主要ページ -->
  <url>
    <loc>https://parts-hub-tci.com/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://parts-hub-tci.com/listing</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://parts-hub-tci.com/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- 法的ページ -->
  <url>
    <loc>https://parts-hub-tci.com/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub-tci.com/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub-tci.com/security</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub-tci.com/legal</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://parts-hub-tci.com/contact</loc>
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

// 管理画面ログインページ
app.get('/admin/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理者ログイン - PARTS HUB</title>
        <meta name="robots" content="noindex, nofollow">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>tailwind.config={theme:{extend:{colors:{primary:'#ff4757','primary-dark':'#ee3b4c'}}}}</script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-shield-alt text-3xl text-red-500"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-800">PARTS HUB 管理画面</h1>
                <p class="text-gray-500 text-sm mt-1">管理者アカウントでログインしてください</p>
            </div>
            
            <div id="error-msg" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm"></div>
            
            <form id="login-form" onsubmit="handleLogin(event)">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">ログイン名</label>
                    <div class="relative">
                        <i class="fas fa-user absolute left-3 top-3.5 text-gray-400"></i>
                        <input type="text" id="username" name="username" required autocomplete="username"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                               placeholder="ユーザー名">
                    </div>
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                    <div class="relative">
                        <i class="fas fa-lock absolute left-3 top-3.5 text-gray-400"></i>
                        <input type="password" id="password" name="password" required autocomplete="current-password"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                               placeholder="パスワード">
                    </div>
                </div>
                <button type="submit" id="login-btn"
                        class="w-full py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all">
                    <i class="fas fa-sign-in-alt mr-2"></i>ログイン
                </button>
            </form>
            
            <div class="mt-6 text-center">
                <a href="/" class="text-sm text-gray-500 hover:text-gray-700">
                    <i class="fas fa-arrow-left mr-1"></i>サイトに戻る
                </a>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 既にログイン済みならトークンを検証してリダイレクト
            // 注: ループ防止のため、リダイレクト中フラグを使用
            (async function() {
                const t = localStorage.getItem('admin_token');
                if (!t) return;
                // ループ防止: 短時間に連続リダイレクトしない
                const lastRedirect = sessionStorage.getItem('admin_login_redirect_ts');
                if (lastRedirect && (Date.now() - parseInt(lastRedirect)) < 3000) {
                    // 3秒以内の連続リダイレクト → トークン無効とみなしクリア
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_username');
                    sessionStorage.removeItem('admin_login_redirect_ts');
                    return;
                }
                try {
                    const r = await axios.get('/api/admin/settings', {
                        headers: { 'Authorization': 'Bearer ' + t },
                        timeout: 5000
                    });
                    if (r.data.success) {
                        sessionStorage.setItem('admin_login_redirect_ts', Date.now().toString());
                        window.location.replace('/admin');
                    } else {
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_username');
                    }
                } catch(e) {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_username');
                }
            })();

            async function handleLogin(e) {
                e.preventDefault();
                const errorMsg = document.getElementById('error-msg');
                const loginBtn = document.getElementById('login-btn');
                errorMsg.classList.add('hidden');
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>ログイン中...';

                try {
                    const res = await axios.post('/api/admin/login', {
                        username: document.getElementById('username').value,
                        password: document.getElementById('password').value
                    });

                    if (res.data.success) {
                        localStorage.setItem('admin_token', res.data.token);
                        localStorage.setItem('admin_username', res.data.username);
                        window.location.href = '/admin';
                    } else {
                        throw new Error(res.data.error);
                    }
                } catch (err) {
                    const msg = err.response?.data?.error || err.message || 'ログインに失敗しました';
                    errorMsg.textContent = msg;
                    errorMsg.classList.remove('hidden');
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>ログイン';
                }
            }
        </script>
    </body>
    </html>
  `)
})

// 管理画面はadmin-pages.tsに統一（AdminLayout経由で認証チェック付き）
// /admin, /admin/users 等は admin-pages.ts の AdminLayout で提供

export default app

// ===== 以下は admin-pages.ts に移行済みのため未使用 =====
/*
app.get('/admin-old-unused', (c) => {
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

        <!-- パスワード変更モーダル -->
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
                    <button onclick="changePassword()" id="pw-save-btn" class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">保存</button>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // ===== 管理者認証チェック =====
            const adminToken = localStorage.getItem('admin_token');
            if (!adminToken) {
                window.location.href = '/admin/login';
            }

            // axios にデフォルトで認証ヘッダーを付与
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + adminToken;
            
            // 401エラー時に自動リダイレクト
            axios.interceptors.response.use(
                response => response,
                error => {
                    if (error.response && error.response.status === 401) {
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_username');
                        window.location.href = '/admin/login';
                    }
                    return Promise.reject(error);
                }
            );

            // ユーザー名表示
            const adminUsername = localStorage.getItem('admin_username') || '管理者';
            document.getElementById('admin-name').textContent = '管理者: ' + adminUsername;

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
            async function changePassword() {
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
                            document.getElementById('admin-name').textContent = '管理者: ' + newUsername;
                        }
                        // パスワード変更時は再ログインを推奨
                        if (newPw) {
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

// ユーザー管理ページ
app.get('/admin/users', (c) => {
  const content = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">ユーザー管理</h2>
    
    <!-- 検索・フィルター -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" id="search-input" placeholder="名前・メールで検索..." class="px-4 py-2 border rounded-lg">
            <select id="status-filter" class="px-4 py-2 border rounded-lg">
                <option value="">すべてのステータス</option>
                <option value="active">有効</option>
                <option value="suspended">停止中</option>
                <option value="banned">追放</option>
            </select>
            <select id="sort" class="px-4 py-2 border rounded-lg">
                <option value="created_desc">登録日（新しい順）</option>
                <option value="created_asc">登録日（古い順）</option>
                <option value="name_asc">名前（昇順）</option>
            </select>
            <button onclick="searchUsers()" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                <i class="fas fa-search mr-2"></i>検索
            </button>
        </div>
    </div>

    <!-- ユーザー一覧 -->
    <div class="bg-white rounded-lg shadow">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー名</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出品数</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引数</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody id="users-tbody" class="divide-y divide-gray-200">
                    <tr>
                        <td colspan="8" class="px-6 py-12 text-center">
                            <div class="flex justify-center">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- ページネーション -->
        <div id="pagination" class="px-6 py-4 border-t flex justify-between items-center"></div>
    </div>

    <script>
        let currentPage = 1;

        async function loadUsers(page = 1) {
            try {
                const status = document.getElementById('status-filter').value;
                const search = document.getElementById('search-input').value;
                
                let url = \`/api/admin/users?page=\${page}\`;
                if (status) url += \`&status=\${status}\`;
                if (search) url += \`&search=\${search}\`;
                
                const response = await axios.get(url);
                const { users, total, totalPages } = response.data;
                
                renderUsers(users);
                renderPagination(page, totalPages);
                currentPage = page;
            } catch (error) {
                console.error('ユーザー読み込みエラー:', error);
                alert('ユーザーデータの読み込みに失敗しました');
            }
        }

        function renderUsers(users) {
            const tbody = document.getElementById('users-tbody');
            
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">ユーザーが見つかりません</td></tr>';
                return;
            }
            
            tbody.innerHTML = users.map(user => \`
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">\${user.id}</td>
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-user text-gray-500 text-xs"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-900">\${user.name}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${user.email}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs rounded \${user.status === 'active' ? 'bg-green-100 text-green-700' : user.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
                            \${user.status === 'active' ? '有効' : user.status === 'suspended' ? '停止中' : '追放'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${user.products_count || 0}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${user.transactions_count || 0}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">\${new Date(user.created_at).toLocaleDateString('ja-JP')}</td>
                    <td class="px-6 py-4 text-sm">
                        <button onclick="viewUser(\${user.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                            <i class="fas fa-eye"></i>
                        </button>
                        \${user.status === 'active' ? 
                            \`<button onclick="suspendUser(\${user.id})" class="text-yellow-600 hover:text-yellow-800 mr-3" title="停止">
                                <i class="fas fa-pause"></i>
                            </button>\` : 
                            \`<button onclick="activateUser(\${user.id})" class="text-green-600 hover:text-green-800 mr-3" title="有効化">
                                <i class="fas fa-play"></i>
                            </button>\`
                        }
                        <button onclick="banUser(\${user.id})" class="text-red-600 hover:text-red-800" title="追放">
                            <i class="fas fa-ban"></i>
                        </button>
                    </td>
                </tr>
            \`).join('');
        }

        function renderPagination(current, total) {
            const pagination = document.getElementById('pagination');
            
            let html = \`<div class="text-sm text-gray-600">ページ \${current} / \${total}</div><div class="flex space-x-2">\`;
            
            if (current > 1) {
                html += \`<button onclick="loadUsers(\${current - 1})" class="px-3 py-1 border rounded hover:bg-gray-50">前へ</button>\`;
            }
            if (current < total) {
                html += \`<button onclick="loadUsers(\${current + 1})" class="px-3 py-1 border rounded hover:bg-gray-50">次へ</button>\`;
            }
            
            html += '</div>';
            pagination.innerHTML = html;
        }

        function searchUsers() {
            loadUsers(1);
        }

        async function suspendUser(id) {
            if (!confirm('このユーザーを停止しますか？')) return;
            
            try {
                await axios.put(\`/api/admin/users/\${id}/status\`, { status: 'suspended' });
                alert('ユーザーを停止しました');
                loadUsers(currentPage);
            } catch (error) {
                console.error('ユーザー停止エラー:', error);
                alert('ユーザーの停止に失敗しました');
            }
        }

        async function activateUser(id) {
            if (!confirm('このユーザーを有効化しますか？')) return;
            
            try {
                await axios.put(\`/api/admin/users/\${id}/status\`, { status: 'active' });
                alert('ユーザーを有効化しました');
                loadUsers(currentPage);
            } catch (error) {
                console.error('ユーザー有効化エラー:', error);
                alert('ユーザーの有効化に失敗しました');
            }
        }

        async function banUser(id) {
            if (!confirm('このユーザーを追放しますか？この操作は取り消せません。')) return;
            
            try {
                await axios.put(\`/api/admin/users/\${id}/status\`, { status: 'banned' });
                alert('ユーザーを追放しました');
                loadUsers(currentPage);
            } catch (error) {
                console.error('ユーザー追放エラー:', error);
                alert('ユーザーの追放に失敗しました');
            }
        }

        function viewUser(id) {
            window.location.href = \`/admin/users/\${id}\`;
        }

        // 初期読み込み
        loadUsers(1);
        
        // Enterキーで検索
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchUsers();
        });
    </script>
  `;
  
  return c.html(AdminLayout('users', 'ユーザー管理', content));
})
*/
