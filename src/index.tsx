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
import crossBorderRoutes from './routes/cross-border'
import emailRoutes from './routes/email'
import articlesRoutes from './routes/articles'
import vehicleDemoRoutes from './routes/vehicle-demo'
import argosDemoRoutes from './routes/argos-demo'
import argosRoutes from './routes/argos'
import guideApiRoutes from './routes/guide'
import { breadcrumbHtml, BREADCRUMB_CSS } from './breadcrumb'
import franchiseRoutes from './routes/franchise'

const app = new Hono<{ Bindings: Bindings }>()

// キャッシュバスティング用バージョン（デプロイ毎に更新）
const BUILD_VERSION = '20260404a'

// 静的ファイルURLにバージョンを付与するヘルパー
const v = (path: string) => `${path}?v=${BUILD_VERSION}`

// ページ速度最適化: preconnect + DNS prefetch
const PERF_HINTS = `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">`

// Tailwind CSS（ビルド済み本番用CSS）
const TAILWIND_CSS = `<link rel="stylesheet" href="/static/tailwind.css?v=${BUILD_VERSION}">`

// 多言語SEO: hreflangタグ生成ヘルパー
const hreflang = (path: string) => `<link rel="alternate" hreflang="ja" href="https://parts-hub-tci.com${path}">
<link rel="alternate" hreflang="en" href="https://parts-hub-tci.com${path}">
<link rel="alternate" hreflang="zh" href="https://parts-hub-tci.com${path}">
<link rel="alternate" hreflang="ko" href="https://parts-hub-tci.com${path}">
<link rel="alternate" hreflang="x-default" href="https://parts-hub-tci.com${path}">`

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

        <!-- リンクグリッド：スマホ2列 / PC5列 -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-6 mb-8 text-sm">
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
                <h4 class="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wider">コンテンツ</h4>
                <ul class="space-y-1.5 text-gray-400">
                    <li><a href="/area" class="hover:text-white transition-colors">エリア別</a></li>
                    <li><a href="/vehicle" class="hover:text-white transition-colors">車種別パーツ</a></li>
                    <li><a href="/guide" class="hover:text-white transition-colors">整備ガイド</a></li>
                    <li><a href="/partner" class="hover:text-white transition-colors">パートナー</a></li>
                    <li><a href="/news" class="hover:text-white transition-colors">ニュース</a></li>
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
                <h4 class="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wider">パートナー</h4>
                <ul class="space-y-1.5 text-gray-400">
                    <li><a href="/franchise" class="hover:text-white transition-colors">パートナー募集</a></li>
                    <li><a href="/franchise#inquiry-form" class="hover:text-white transition-colors">資料請求</a></li>
                    <li><a href="/notifications" class="hover:text-white transition-colors">通知</a></li>
                    <li><a href="/favorites" class="hover:text-white transition-colors">お気に入り</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-gray-300 mb-2 text-xs uppercase tracking-wider">法的情報</h4>
                <ul class="space-y-1.5 text-gray-400">
                    <li><a href="/terms" class="hover:text-white transition-colors">利用規約</a></li>
                    <li><a href="/privacy" class="hover:text-white transition-colors">プライバシー</a></li>
                    <li><a href="/security" class="hover:text-white transition-colors">セキュリティ</a></li>
                    <li><a href="/legal" class="hover:text-white transition-colors">特商法表記</a></li>
                    <li><a href="/sitemap" class="hover:text-white transition-colors">サイトマップ</a></li>
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
<script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
<script src="${v('/static/i18n.js')}"></script>
`

// ミドルウェア
app.use(logger())
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'Accept'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400
}))

// セキュリティヘッダー（全レスポンス）
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
})

// 静的ファイル配信（キャッシュバスティング: ?v=xxx はCloudflare Pagesが無視してファイルを返す）
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

// OGP画像（1200x630 SVG → SNSシェア用）
app.get('/icons/og-default.png', (c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff4757"/>
      <stop offset="100%" style="stop-color:#ff6b95"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
  <rect x="0" y="624" width="1200" height="6" fill="url(#accent)"/>
  <circle cx="100" cy="315" r="200" fill="#ff4757" opacity="0.05"/>
  <circle cx="1100" cy="315" r="250" fill="#0f3460" opacity="0.3"/>
  <text x="600" y="240" font-family="Arial,Helvetica,sans-serif" font-size="96" font-weight="bold" text-anchor="middle" fill="#ff4757">PARTS HUB</text>
  <text x="600" y="310" font-family="Arial,Helvetica,sans-serif" font-size="36" text-anchor="middle" fill="#ffffff" opacity="0.9">パーツハブ</text>
  <line x1="400" y1="345" x2="800" y2="345" stroke="#ff4757" stroke-width="2" opacity="0.6"/>
  <text x="600" y="400" font-family="Arial,Helvetica,sans-serif" font-size="30" text-anchor="middle" fill="#ffffff" opacity="0.8">整備工場専門 自動車パーツ売買プラットフォーム</text>
  <text x="600" y="460" font-family="Arial,Helvetica,sans-serif" font-size="22" text-anchor="middle" fill="#ffffff" opacity="0.5">純正部品・社外品・工具・SST ｜ 全国の整備工場が出品</text>
  <rect x="430" y="500" width="340" height="50" rx="25" fill="url(#accent)"/>
  <text x="600" y="533" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#ffffff">parts-hub-tci.com</text>
</svg>`;
  return c.body(svg, 200, { 
    'Content-Type': 'image/svg+xml', 
    'Cache-Control': 'public, max-age=604800' 
  });
})

// アイコン 192x192 (PWA用)
app.get('/icons/icon-192x192.png', (c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff4757"/>
      <stop offset="100%" style="stop-color:#ff6b95"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="40" fill="url(#g1)"/>
  <text x="96" y="80" font-family="Arial,Helvetica,sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#ffffff">PARTS</text>
  <text x="96" y="128" font-family="Arial,Helvetica,sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#ffffff">HUB</text>
  <rect x="30" y="148" width="132" height="3" rx="1.5" fill="#ffffff" opacity="0.6"/>
</svg>`;
  return c.body(svg, 200, { 
    'Content-Type': 'image/svg+xml', 
    'Cache-Control': 'public, max-age=604800' 
  });
})

// ========================================
// IndexNow対応（Bing/Yandex/Naver即時インデックス）
// ========================================
const INDEXNOW_KEY = '7f8378e8529bb2b7f7d90488df2cf78c'

// IndexNowキー検証ファイル
app.get('/7f8378e8529bb2b7f7d90488df2cf78c.txt', (c) => {
  return c.text(INDEXNOW_KEY, { headers: { 'Content-Type': 'text/plain' } })
})

// IndexNow API送信エンドポイント（管理者用）
app.post('/api/indexnow', async (c) => {
  try {
    const { urls } = await c.req.json() as { urls?: string[] }
    if (!urls || urls.length === 0) {
      return c.json({ error: 'urls required' }, 400)
    }
    const body = {
      host: 'parts-hub-tci.com',
      key: INDEXNOW_KEY,
      keyLocation: 'https://parts-hub-tci.com/7f8378e8529bb2b7f7d90488df2cf78c.txt',
      urlList: urls.slice(0, 10000)
    }
    const resp = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return c.json({ status: resp.status, submitted: urls.length })
  } catch(e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Sitemap ping通知（Bing/IndexNowへサイトマップ更新を通知）
app.post('/api/sitemap-ping', async (c) => {
  try {
    const sitemapUrl = 'https://parts-hub-tci.com/sitemap.xml'
    const results: Record<string, any> = {}

    // Bing ping
    const bingResp = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    results.bing = { status: bingResp.status }

    // IndexNow（全主要URL一括送信）
    const mainUrls = [
      'https://parts-hub-tci.com/',
      'https://parts-hub-tci.com/search',
      'https://parts-hub-tci.com/news',
      'https://parts-hub-tci.com/faq',
      'https://parts-hub-tci.com/listing',
      'https://parts-hub-tci.com/contact',
      'https://parts-hub-tci.com/sitemap',
    ]
    const indexNowResp = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'parts-hub-tci.com',
        key: INDEXNOW_KEY,
        keyLocation: `https://parts-hub-tci.com/${INDEXNOW_KEY}.txt`,
        urlList: mainUrls
      })
    })
    results.indexnow = { status: indexNowResp.status, submitted: mainUrls.length }

    return c.json({ success: true, results })
  } catch(e: any) {
    return c.json({ error: e.message }, 500)
  }
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
Allow: /vehicle
Allow: /vehicle/*
Allow: /area
Allow: /area/*
Allow: /guide
Allow: /guide/*
Allow: /franchise

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

# Bingbot（Yahoo! JAPAN経由含む）
User-agent: bingbot
Allow: /
Allow: /products/*
Allow: /search
Allow: /news/*
Allow: /faq
Disallow: /mypage
Disallow: /profile/*
Disallow: /chat/*
Disallow: /notifications
Disallow: /transactions/*
Disallow: /api/*
Crawl-delay: 1

# Yandex
User-agent: YandexBot
Allow: /
Allow: /products/*
Allow: /search
Allow: /news/*
Disallow: /mypage
Disallow: /api/*

# Naver
User-agent: Yeti
Allow: /
Allow: /products/*
Allow: /search
Allow: /news/*
Disallow: /mypage
Disallow: /api/*

# Sitemap
Sitemap: https://parts-hub-tci.com/sitemap.xml`, { headers: { 'Content-Type': 'text/plain' } })
})

// sitemap.xml（動的に記事+商品を含める）
app.get('/sitemap.xml', async (c) => {
  const { env } = c;
  
  try {
    const baseUrl = 'https://parts-hub-tci.com';
    // JST基準の日付 (YYYY-MM-DD)
    const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const now = jstDate.toISOString().split('T')[0];
    
    // 公開済みの記事を取得
    const articles = await env.DB.prepare(`
      SELECT slug, updated_at, category 
      FROM articles 
      WHERE status = 'published' 
      ORDER BY published_at DESC 
      LIMIT 1000
    `).all();

    // アクティブ＋売却済み商品を取得（SOLD商品もSEO価値を維持）
    const products = await env.DB.prepare(`
      SELECT p.id, p.title, p.status, p.updated_at, p.created_at,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as main_image
      FROM products p
      WHERE p.status IN ('active', 'sold') 
      ORDER BY p.created_at DESC 
      LIMIT 5000
    `).all();

    // カテゴリを取得
    const categories = await env.DB.prepare(`
      SELECT id, name, slug FROM categories ORDER BY id
    `).all();
    
    // 静的ページ
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/news', changefreq: 'daily', priority: '0.9' },
      { url: '/search', changefreq: 'hourly', priority: '0.9' },
      { url: '/listing', changefreq: 'monthly', priority: '0.7' },
      { url: '/faq', changefreq: 'monthly', priority: '0.6' },
      { url: '/contact', changefreq: 'monthly', priority: '0.5' },
      { url: '/sitemap', changefreq: 'weekly', priority: '0.4' },
      { url: '/legal', changefreq: 'yearly', priority: '0.3' },
      { url: '/security', changefreq: 'yearly', priority: '0.3' },
      { url: '/terms', changefreq: 'yearly', priority: '0.3' },
      { url: '/privacy', changefreq: 'yearly', priority: '0.3' },
      { url: '/area', changefreq: 'weekly', priority: '0.6' },
    ];

    // === 商品があるメーカー・車種のみサイトマップに掲載（クロールバジェット最適化） ===
    // 商品が紐づいているメーカー・車種を取得
    const productMakers = await env.DB.prepare(`
      SELECT DISTINCT vm_maker FROM products WHERE status IN ('active', 'sold') AND vm_maker IS NOT NULL AND vm_maker != ''
    `).all()
    const productModels = await env.DB.prepare(`
      SELECT DISTINCT vm_maker, vm_model FROM products WHERE status IN ('active', 'sold') AND vm_maker IS NOT NULL AND vm_model IS NOT NULL AND vm_maker != '' AND vm_model != ''
    `).all()
    // 汎用品（is_universal=1）があるか確認
    const universalCount = await env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM products WHERE status IN ('active', 'sold') AND is_universal = 1
    `).first() as any
    const hasUniversalProducts = (universalCount?.cnt || 0) > 0
    const makersWithProducts = new Set((productMakers.results || []).map((r: any) => r.vm_maker))
    const modelsWithProducts = new Set((productModels.results || []).map((r: any) => r.vm_maker + '|||' + r.vm_model))
    const hasAnyProducts = makersWithProducts.size > 0 || hasUniversalProducts

    // 47都道府県ページをsitemapに追加
    const prefSlugs = Object.keys(PREFECTURES)
    prefSlugs.forEach(slug => {
      staticPages.push({ url: '/area/' + slug, changefreq: 'weekly', priority: '0.6' })
    })

    // 都道府県×メーカー クロスページ（商品があるメーカー + 汎用品がある場合は主要メーカー）
    if (hasAnyProducts) {
      // 汎用品がある場合は主要12メーカーも含める
      const areaMakers = new Set(makersWithProducts)
      if (hasUniversalProducts) {
        const topMakers = await env.DB.prepare(`
          SELECT maker FROM vehicle_master GROUP BY maker ORDER BY COUNT(DISTINCT model) DESC LIMIT 20
        `).all()
        ;(topMakers.results || []).forEach((m: any) => areaMakers.add(m.maker))
      }
      prefSlugs.forEach(slug => {
        areaMakers.forEach((maker: string) => {
          staticPages.push({
            url: '/area/' + slug + '/' + encodeURIComponent(maker),
            changefreq: 'weekly',
            priority: '0.55'
          })
        })
      })
    }

    // 車種別ページをsitemapに追加（商品がある車種のみ / 汎用品がある場合は全車種）
    staticPages.push({ url: '/vehicle', changefreq: 'weekly', priority: '0.7' })

    if (hasUniversalProducts) {
      // 汎用品がある場合は全メーカー・全車種をsitemapに追加（上位メーカーのみ）
      const allVehicles = await env.DB.prepare(`
        SELECT maker, model FROM vehicle_master GROUP BY maker, model ORDER BY maker, model
      `).all()
      const allMakersSet = new Set<string>()
      ;(allVehicles.results || []).forEach((v: any) => {
        allMakersSet.add(v.maker)
        staticPages.push({
          url: '/vehicle/' + encodeURIComponent(v.maker) + '/' + encodeURIComponent(v.model),
          changefreq: 'weekly',
          priority: '0.55'
        })
      })
      allMakersSet.forEach(maker => {
        staticPages.push({
          url: '/vehicle/' + encodeURIComponent(maker),
          changefreq: 'weekly',
          priority: '0.6'
        })
      })
    } else {
      // メーカー一覧ページ（商品があるメーカーのみ）
      makersWithProducts.forEach(maker => {
        staticPages.push({
          url: '/vehicle/' + encodeURIComponent(maker),
          changefreq: 'weekly',
          priority: '0.65'
        })
      })

      // 車種詳細ページ（商品がある車種のみ）
      modelsWithProducts.forEach(key => {
        const [maker, model] = key.split('|||')
        staticPages.push({
          url: '/vehicle/' + encodeURIComponent(maker) + '/' + encodeURIComponent(model),
          changefreq: 'weekly',
          priority: '0.6'
        })
      })
    }

    // 整備ガイドページをsitemapに追加
    staticPages.push({ url: '/guide', changefreq: 'monthly', priority: '0.6' })
    const guideSlugs = Object.keys(GUIDES)
    guideSlugs.forEach(slug => {
      staticPages.push({ url: '/guide/' + slug, changefreq: 'monthly', priority: '0.6' })
    })

    // パートナーページをsitemapに追加
    staticPages.push({ url: '/partner', changefreq: 'monthly', priority: '0.6' })
    const partnerSlugs = Object.keys(PARTNERS)
    partnerSlugs.forEach(slug => {
      staticPages.push({ url: '/partner/' + slug, changefreq: 'monthly', priority: '0.6' })
    })

    // パートナー募集ページをsitemapに追加
    staticPages.push({ url: '/franchise', changefreq: 'weekly', priority: '0.7' })

    // ウィジェットページをsitemapに追加
    staticPages.push({ url: '/widget', changefreq: 'monthly', priority: '0.5' })

    // DB生成のガイド記事をsitemapに追加（重複排除）
    const dbGuides = await env.DB.prepare(
      "SELECT slug FROM guide_articles WHERE status = 'published'"
    ).all()
    const staticGuideSlugs = new Set(guideSlugs)
    ;(dbGuides.results || []).forEach((g: any) => {
      if (!staticGuideSlugs.has(g.slug)) {
        staticPages.push({ url: '/guide/' + g.slug, changefreq: 'weekly', priority: '0.6' })
      }
    })
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
    
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // カテゴリページ
    categories.results.forEach((cat: any) => {
      xml += `
  <url>
    <loc>${baseUrl}/search?category=${encodeURIComponent(cat.name)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // 商品ページ
    // 商品ページ（active: 高優先度、sold: やや低い優先度で残す）
    products.results.forEach((product: any) => {
      const lastmod = product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : (product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : now);
      const isSold = product.status === 'sold'
      const imgRaw = String(product.main_image || '')
      const imgUrl = imgRaw.startsWith('/r2/') ? imgRaw : imgRaw.startsWith('r2/') ? `/${imgRaw}` : `/r2/${imgRaw}`
      const imageTag = product.main_image ? `
    <image:image>
      <image:loc>https://parts-hub-tci.com${imgUrl}</image:loc>
      <image:title>${String(product.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
    </image:image>` : '';
      xml += `
  <url>
    <loc>${baseUrl}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${isSold ? 'weekly' : 'daily'}</changefreq>
    <priority>${isSold ? '0.6' : '0.8'}</priority>${imageTag}
  </url>`;
    });
    
    // 記事ページ
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
    
    return c.text(xml, 200, { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' });
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return c.text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', 200, { 'Content-Type': 'application/xml' });
  }
})

// ==== LLMO: llms.txt / llms-full.txt（AI検索エンジン最適化） ====
app.get('/llms.txt', (c) => {
  return c.text(`# PARTS HUB（パーツハブ）
> 日本初の整備工場専門 自動車パーツ売買プラットフォーム

## サービス概要
PARTS HUBは、全国の自動車整備工場・板金塗装工場・ディーラーが、純正部品・社外品・工具・SST（特殊工具）をオンラインで売買できるマーケットプレイスです。

## URL
- Webサイト: https://parts-hub-tci.com
- 商品検索: https://parts-hub-tci.com/search
- ニュース・コラム: https://parts-hub-tci.com/news
- FAQ: https://parts-hub-tci.com/faq
- お問い合わせ: https://parts-hub-tci.com/contact
- 利用規約: https://parts-hub-tci.com/terms
- 詳細情報: https://parts-hub-tci.com/llms-full.txt

## 主な機能
- 自動車パーツの出品・購入（Stripe決済）
- 車体番号（VIN）からの適合部品検索
- 16カテゴリ分類（エンジン、ボディ、電装、足回り、工具等）
- 配送追跡（ヤマト運輸/佐川急便/日本郵便/西濃運輸/福山通運）
- リアルタイムチャット機能
- 日本語・英語・中国語・韓国語対応

## 料金
- 会員登録: 無料
- 出品: 無料
- 販売手数料: 商品価格の10%（出品者負担）
- カード決済手数料: 330円（税込）購入者負担
- 銀行振込手数料: 購入者負担（各金融機関により異なる）
- 出金振込手数料: 330円/回（出品者負担）
- 決済: Stripe（クレジットカード）/ 銀行振込
- 送料: 出品者負担または購入者負担（出品時に設定）

## 運営
- 運営: 株式会社TCI
- 所在地: 大阪府
- お問い合わせ: support@parts-hub-tci.com
`, 200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' })
})

app.get('/llms-full.txt', async (c) => {
  const { DB } = c.env as any
  let categoriesList = ''
  let articlesSection = ''
  let productsSection = ''
  try {
    const cats = await DB.prepare('SELECT name FROM categories ORDER BY id').all()
    categoriesList = cats.results.map((c: any) => `- ${c.name}`).join('\n')
    const arts = await DB.prepare("SELECT title, slug, summary FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT 20").all()
    articlesSection = arts.results.map((a: any) => `### ${a.title}\nURL: https://parts-hub-tci.com/news/${a.slug}\n${a.summary || ''}`).join('\n\n')
    const prods = await DB.prepare("SELECT id, title, price, condition FROM products WHERE status='active' ORDER BY created_at DESC LIMIT 20").all()
    productsSection = prods.results.map((p: any) => {
      const condMap: Record<string,string> = { new:'新品', like_new:'未使用に近い', good:'良好', fair:'やや傷あり', poor:'状態不良' }
      return `- ${p.title}（¥${Math.floor(Number(p.price) * 1.1).toLocaleString()} 税込・${condMap[p.condition]||p.condition}）: https://parts-hub-tci.com/products/${p.id}`
    }).join('\n')
  } catch(e) {}
  
  return c.text(`# PARTS HUB（パーツハブ）完全ガイド

## サービス詳細
PARTS HUBは2026年3月にサービスを開始した、日本初の整備工場専門オンラインパーツマーケットプレイスです。
自動車整備工場が日常的に発生するデッドストック（余剰在庫）部品や、工具・SST（特殊工具）を全国の整備工場同士で売買できます。

## 対象ユーザー
- 自動車整備工場（認証工場・指定工場）
- 板金塗装工場
- 自動車ディーラー（トヨタ、日産、ホンダ、マツダ、スバル等）
- カーショップ・カー用品店
- 自動車部品商
- 中古車販売店

## カテゴリ一覧
${categoriesList}

## 取引の流れ
1. 出品者が商品を登録（写真・説明・価格・送料設定）
2. 購入者が商品を検索し、購入ボタンをクリック
3. Stripe決済またはの銀行振込で安全にお支払い（カード決済手数料¥330は購入者負担、販売手数料10%は出品者負担）
4. 出品者に決済完了通知 → 商品を発送
5. 配送業者選択・追跡番号登録 → 購入者に自動通知
6. 購入者が受取確認 → 取引完了
7. レビュー投稿

## 配送対応
以下の主要配送業者に対応し、追跡番号からリアルタイム追跡が可能です：
- ヤマト運輸
- 佐川急便
- 日本郵便（ゆうパック）
- 西濃運輸
- 福山通運

## 安全性
- Stripe決済による安全な取引（SSL/TLS暗号化）
- 本人確認済みユーザーのみ出品可能
- チャット機能で取引前に質問・価格交渉が可能
- 取引完了まで売上金をエスクロー保護
- 24時間有人監視

## 出品中の商品（最新）
${productsSection}

## 最新記事
${articlesSection}

## API（開発者向け）
- 商品一覧: GET https://parts-hub-tci.com/api/products
- 商品詳細: GET https://parts-hub-tci.com/api/products/:id
- カテゴリ一覧: GET https://parts-hub-tci.com/api/categories
- 記事一覧: GET https://parts-hub-tci.com/api/articles
- 記事詳細: GET https://parts-hub-tci.com/api/articles/:slug

## 料金体系
- 会員登録: 無料
- 出品手数料: 無料
- 販売手数料: 商品価格の10%（出品者負担、購入者の手数料は無料）
- 決済方式: Stripe（クレジットカード / デビットカード）
- 送料: 出品者設定（出品者負担 or 購入者負担）
- カード決済手数料: 330円（税込）購入者負担
- 銀行振込手数料: 購入者負担（各金融機関により異なる）
- 出金手数料: 330円/回（最低出金額1,000円）

## 運営会社
- 運営: 株式会社TCI
- 所在地: 大阪府大阪市淀川区新高1-5-4
- お問い合わせ: support@parts-hub-tci.com
- お問い合わせフォーム: https://parts-hub-tci.com/contact
- お問い合わせフォーム: https://parts-hub-tci.com/contact
`, 200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' })
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
app.route('/api/argos-demo', argosDemoRoutes)
app.route('/api/argos', argosRoutes)  // 本番用ARGOS JPC API（ARGOS_API_ENABLED=true時のみ有効、公開予定: 2026年6月〜）
app.route('/api/admin/cross-border', crossBorderRoutes) // 越境EC管理API（adminRouteより先に登録）
app.route('/api/admin', adminRoutes)
app.route('/api/guides', guideApiRoutes) // ガイド記事自動生成API
app.route('/franchise', franchiseRoutes) // パートナー募集LP
app.route('/api/franchise', franchiseRoutes) // パートナー募集API
app.route('/admin', adminPagesRoutes)

// 公開お知らせAPI（認証不要）
app.get('/api/announcements', async (c) => {
  try {
    const { DB } = (c.env as any)
    const limit = parseInt(c.req.query('limit') || '10')
    const now = new Date().toISOString()

    const { results } = await DB.prepare(`
      SELECT id, title, content, type, priority, is_pinned, published_at, expires_at
      FROM announcements
      WHERE is_active = 1
        AND published_at <= ?
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY is_pinned DESC, priority DESC, published_at DESC
      LIMIT ?
    `).bind(now, now, limit).all()

    return c.json({ success: true, data: results || [] })
  } catch (error) {
    // テーブルが存在しない場合も空配列を返す
    return c.json({ success: true, data: [] })
  }
})

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>PARTS HUB（パーツハブ）- 自動車パーツ売買プラットフォーム</title>
        <meta name="description" content="整備工場専門の自動車パーツ売買プラットフォーム。純正部品・社外品・工具・SSTを全国の整備工場同士で売買。Stripe安全決済・配送追跡・チャット機能完備。">
        <link rel="canonical" href="https://parts-hub-tci.com/">
        ${hreflang("/")}
        <meta property="og:type" content="website">
        <meta property="og:title" content="PARTS HUB（パーツハブ）- 自動車パーツ売買プラットフォーム">
        <meta property="og:description" content="整備工場専門の自動車パーツ売買プラットフォーム。純正部品・社外品・工具・SSTを全国の整備工場同士で売買。">
        <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
        <meta property="og:url" content="https://parts-hub-tci.com/">
        <meta property="og:site_name" content="PARTS HUB">
        <meta property="og:locale" content="ja_JP">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="PARTS HUB（パーツハブ）- 自動車パーツ売買プラットフォーム">
        <meta name="twitter:description" content="整備工場専門の自動車パーツ売買プラットフォーム。純正部品・社外品・工具・SSTを全国の整備工場同士で売買。">
        <meta name="twitter:image" content="https://parts-hub-tci.com/icons/og-default.png">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
        
        <!-- 構造化データ -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PARTS HUB",
          "alternateName": "パーツハブ",
          "url": "https://parts-hub-tci.com",
          "description": "整備工場専門の自動車パーツ売買プラットフォーム",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://parts-hub-tci.com/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PARTS HUB",
          "alternateName": "パーツハブ",
          "url": "https://parts-hub-tci.com",
          "logo": "https://parts-hub-tci.com/icons/icon-192x192.png",
          "description": "日本初の整備工場専門 自動車パーツ売買マーケットプレイス",
          "foundingDate": "2026",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "大阪市淀川区",
            "addressRegion": "大阪府",
            "addressCountry": "JP"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "support@parts-hub-tci.com",
            "contactType": "customer service",
            "availableLanguage": ["Japanese", "English"]
          },
          "sameAs": []
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "PARTS HUB",
            "item": "https://parts-hub-tci.com/"
          }]
        }
        </script>
        
        <!-- PWA対応 -->
        <meta name="theme-color" content="#ff4757">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="PARTS HUB">
        <link rel="manifest" href="/manifest.json">
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        
        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/icons/logo.svg">
        
        <!-- スタイル -->
        ${TAILWIND_CSS}
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
                                       class="search-input w-full pl-11 sm:pl-14 pr-4 py-3 sm:py-4 rounded-xl border-0 bg-white text-gray-900 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl placeholder:text-gray-400">
                            </div>
                            <button onclick="performSearch()" 
                                    class="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-2xl hover:shadow-red-500/50 text-base sm:text-lg">
                                <i class="fas fa-search mr-2"></i>検索
                            </button>
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
                <!-- ソートタブ -->
                <div class="flex items-center space-x-1 sm:space-x-4 mb-4 border-b overflow-x-auto" id="sort-tabs">
                    <button onclick="switchSortTab('new')" class="sort-tab active whitespace-nowrap px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base text-primary border-b-2 border-primary" data-sort="new">
                        <i class="fas fa-clock mr-1 sm:mr-2"></i>新着商品
                    </button>
                    <button onclick="switchSortTab('popular')" class="sort-tab whitespace-nowrap px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base text-gray-600 hover:text-primary transition-colors border-b-2 border-transparent" data-sort="popular">
                        <i class="fas fa-fire mr-1 sm:mr-2"></i>人気商品
                    </button>
                    <button onclick="switchSortTab('bargain')" class="sort-tab whitespace-nowrap px-3 sm:px-4 py-3 font-semibold text-sm sm:text-base text-gray-600 hover:text-primary transition-colors border-b-2 border-transparent" data-sort="bargain">
                        <i class="fas fa-tags mr-1 sm:mr-2"></i>お買い得
                    </button>
                </div>

                <!-- カテゴリタブ -->
                <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2" id="category-tabs" style="scrollbar-width:thin;">
                    <button onclick="switchCategoryTab('')" class="cat-tab active whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-red-500 text-white transition-all" data-cat="">
                        すべて
                    </button>
                    <button onclick="switchCategoryTab('car')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="car">
                        <i class="fas fa-car mr-1"></i>乗用車
                    </button>
                    <button onclick="switchCategoryTab('truck')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="truck">
                        <i class="fas fa-truck-moving mr-1"></i>トラック
                    </button>
                    <button onclick="switchCategoryTab('bus')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="bus">
                        <i class="fas fa-bus mr-1"></i>バス
                    </button>
                    <button onclick="switchCategoryTab('motorcycle')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="motorcycle">
                        <i class="fas fa-motorcycle mr-1"></i>バイク
                    </button>
                    <button onclick="switchCategoryTab('forklift')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="forklift">
                        <i class="fas fa-pallet mr-1"></i>フォークリフト
                    </button>
                    <button onclick="switchCategoryTab('heavy_equipment')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="heavy_equipment">
                        <i class="fas fa-hard-hat mr-1"></i>重機
                    </button>
                    <button onclick="switchCategoryTab('ship')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="ship">
                        <i class="fas fa-ship mr-1"></i>船舶
                    </button>
                    <button onclick="switchCategoryTab('agriculture')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="agriculture">
                        <i class="fas fa-tractor mr-1"></i>農機具
                    </button>
                    <button onclick="switchCategoryTab('tools')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="tools">
                        <i class="fas fa-tools mr-1"></i>工具
                    </button>
                    <button onclick="switchCategoryTab('rebuilt')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="rebuilt">
                        <i class="fas fa-sync-alt mr-1"></i>リビルト
                    </button>
                    <button onclick="switchCategoryTab('electrical')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="electrical">
                        <i class="fas fa-bolt mr-1"></i>電装
                    </button>
                    <button onclick="switchCategoryTab('other')" class="cat-tab whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all" data-cat="other">
                        <i class="fas fa-ellipsis-h mr-1"></i>その他車両
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

        <!-- バナー広告スライダーセクション -->
        <section id="banner-slider-section" class="hidden bg-white py-8">
            <div class="max-w-7xl mx-auto px-4">
                <div class="relative overflow-hidden rounded-2xl shadow-lg" id="banner-slider-wrapper">
                    <div id="banner-slider-track" class="flex transition-transform duration-500 ease-in-out" style="will-change:transform;">
                        <!-- バナーがAPIから動的に挿入される -->
                    </div>
                    <!-- ドットインジケーター -->
                    <div id="banner-dots" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10"></div>
                    <!-- 左右矢印（PC用） -->
                    <button id="banner-prev" class="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full items-center justify-center transition-colors z-10" aria-label="前へ">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button id="banner-next" class="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full items-center justify-center transition-colors z-10" aria-label="次へ">
                        <i class="fas fa-chevron-right"></i>
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

        <!-- お知らせセクション -->
        <section id="announcements-section" class="hidden py-10 bg-white">
            <div class="max-w-7xl mx-auto px-4">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-1">
                        <i class="fas fa-bullhorn text-red-500 mr-2"></i>お知らせ
                    </h2>
                    <p class="text-gray-500 text-sm">メンテナンス情報や重要なお知らせをお届けします</p>
                </div>
                <div id="announcements-container" class="space-y-3"></div>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
            let currentSortTab = 'new';
            let currentCategoryTab = '';

            // カテゴリタブ→フィルター値のマッピング（top_categoryベース）
            const categoryTabMap = {
                '': {},
                'car': { top_category: 'car' },
                'truck': { top_category: 'truck' },
                'bus': { top_category: 'bus' },
                'motorcycle': { top_category: 'motorcycle' },
                'forklift': { top_category: 'forklift' },
                'heavy_equipment': { top_category: 'heavy_equipment' },
                'ship': { top_category: 'ship' },
                'agriculture': { top_category: 'agriculture' },
                'tools': { top_category: 'tools' },
                'rebuilt': { top_category: 'rebuilt' },
                'electrical': { top_category: 'electrical' },
                'other': { top_category: 'other' }
            };

            // ソートタブ切り替え
            function switchSortTab(tab) {
                currentSortTab = tab;
                // UI更新
                document.querySelectorAll('.sort-tab').forEach(function(btn) {
                    if (btn.getAttribute('data-sort') === tab) {
                        btn.classList.add('active', 'text-primary', 'border-primary');
                        btn.classList.remove('text-gray-600', 'border-transparent');
                    } else {
                        btn.classList.remove('active', 'text-primary', 'border-primary');
                        btn.classList.add('text-gray-600', 'border-transparent');
                    }
                });
                // フィルター適用
                if (tab === 'new') {
                    currentFilters.sort = 'created_desc';
                } else if (tab === 'popular') {
                    currentFilters.sort = 'popular';
                } else if (tab === 'bargain') {
                    currentFilters.sort = 'price_asc';
                }
                // ソートプルダウンも同期
                var sortSelect = document.getElementById('sort-filter');
                if (sortSelect) sortSelect.value = currentFilters.sort;
                currentPage = 1;
                loadProducts();
            }

            // カテゴリタブ切り替え
            function switchCategoryTab(cat) {
                currentCategoryTab = cat;
                // UI更新
                document.querySelectorAll('.cat-tab').forEach(function(btn) {
                    if (btn.getAttribute('data-cat') === cat) {
                        btn.classList.add('active', 'bg-red-500', 'text-white');
                        btn.classList.remove('bg-gray-100', 'text-gray-600');
                    } else {
                        btn.classList.remove('active', 'bg-red-500', 'text-white');
                        btn.classList.add('bg-gray-100', 'text-gray-600');
                    }
                });
                // カテゴリフィルター適用（top_categoryベース）
                var catConfig = categoryTabMap[cat] || {};
                // 既存のカテゴリフィルターをクリア
                delete currentFilters.category_id;
                delete currentFilters.cat_query;
                delete currentFilters.top_category;
                if (catConfig.top_category) {
                    currentFilters.top_category = catConfig.top_category;
                }
                currentPage = 1;
                loadProducts();
            }
            
            // 検索実行
            function performSearch() {
                const query = document.getElementById('search-input').value.trim();
                if (query) {
                    currentFilters.query = query;
                } else {
                    delete currentFilters.query;
                }
                currentPage = 1;
                loadProducts();
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
                    // フィルターをそのままAPIに渡す（top_categoryも含む）
                    const apiFilters = {};
                    Object.keys(currentFilters).forEach(function(k) {
                        apiFilters[k] = currentFilters[k];
                    });
                    
                    const params = new URLSearchParams({
                        page: currentPage,
                        limit: 20,
                        ...apiFilters
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
                            <img loading="lazy" src="\${product.main_image || 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'}" 
                                 alt="\${product.title}" 
                                 class="w-full h-full object-cover\${product.status === 'sold' ? ' opacity-60' : ''}"
                                 loading="lazy"
                                 onerror="this.src='https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'">
                            
                            \${product.status === 'sold' ? \`
                            <!-- SOLDオーバーレイ -->
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div style="background:rgba(220,38,38,0.85); transform:rotate(-20deg); padding:8px 36px; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                                    <span style="font-size:1.5rem; font-weight:900; color:#fff; letter-spacing:0.15em; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">SOLD</span>
                                </div>
                            </div>
                            \` : ''}

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
                                    <span class="text-xl font-bold text-gray-900">¥\${Math.floor(Number(product.price) * 1.1).toLocaleString()}</span>
                                    <span class="text-xs text-gray-500 ml-1">税込</span>
                                </div>
                                \${product.shipping_type === 'seller_paid'
                                    ? '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-semibold rounded">送料込</span>'
                                    : '<span class="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-semibold rounded">着払い</span>'}
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
            
            // =============================================
            // バナー広告スライダー
            // =============================================
            (async function initBannerSlider() {
                try {
                    const res = await axios.get('/api/banners?placement=top');
                    const banners = (res.data.banners || []).slice(0, 5);
                    if (!banners.length) return;

                    const section = document.getElementById('banner-slider-section');
                    const track = document.getElementById('banner-slider-track');
                    const dotsWrap = document.getElementById('banner-dots');
                    if (!section || !track || !dotsWrap) return;

                    // バナーHTML生成
                    track.innerHTML = banners.map((b, i) => {
                        const imgUrl = b.image_url.startsWith('/r2/') ? b.image_url : '/r2/' + b.image_url;
                        const inner = '<img src=\"' + imgUrl + '\" alt=\"' + (b.title || '広告') + '\" class=\"w-full h-full object-cover\" loading=\"' + (i === 0 ? 'eager' : 'lazy') + '\" draggable=\"false\">';
                        if (b.link_url) {
                            return '<a href=\"' + b.link_url + '\" target=\"_blank\" rel=\"noopener\" class=\"flex-shrink-0 w-full block\" style=\"aspect-ratio:3/1;\" data-banner-id=\"' + b.id + '\" onclick=\"trackBannerClick(' + b.id + ')\">' + inner + '</a>';
                        }
                        return '<div class=\"flex-shrink-0 w-full\" style=\"aspect-ratio:3/1;\">' + inner + '</div>';
                    }).join('');

                    // ドット生成
                    dotsWrap.innerHTML = banners.map((_, i) =>
                        '<button class=\"w-2.5 h-2.5 rounded-full transition-all ' + (i === 0 ? 'bg-white scale-110' : 'bg-white/50') + '\" data-dot=\"' + i + '\"></button>'
                    ).join('');

                    section.classList.remove('hidden');

                    let current = 0;
                    const total = banners.length;
                    if (total <= 1) {
                        document.getElementById('banner-prev')?.classList.add('!hidden');
                        document.getElementById('banner-next')?.classList.add('!hidden');
                        dotsWrap.classList.add('hidden');
                        return;
                    }

                    function goTo(idx) {
                        current = ((idx % total) + total) % total;
                        track.style.transform = 'translateX(-' + (current * 100) + '%)';
                        dotsWrap.querySelectorAll('button').forEach((d, i) => {
                            d.className = 'w-2.5 h-2.5 rounded-full transition-all ' + (i === current ? 'bg-white scale-110' : 'bg-white/50');
                        });
                    }

                    // 自動スライド（1秒間隔）
                    let autoTimer = setInterval(() => goTo(current + 1), 1000);
                    const wrapper = document.getElementById('banner-slider-wrapper');

                    // ホバー時は一時停止
                    wrapper?.addEventListener('mouseenter', () => clearInterval(autoTimer));
                    wrapper?.addEventListener('mouseleave', () => { autoTimer = setInterval(() => goTo(current + 1), 1000); });

                    // 矢印クリック
                    document.getElementById('banner-prev')?.addEventListener('click', () => { clearInterval(autoTimer); goTo(current - 1); autoTimer = setInterval(() => goTo(current + 1), 1000); });
                    document.getElementById('banner-next')?.addEventListener('click', () => { clearInterval(autoTimer); goTo(current + 1); autoTimer = setInterval(() => goTo(current + 1), 1000); });

                    // ドットクリック
                    dotsWrap.querySelectorAll('button').forEach(d => {
                        d.addEventListener('click', () => { clearInterval(autoTimer); goTo(Number(d.dataset.dot)); autoTimer = setInterval(() => goTo(current + 1), 1000); });
                    });

                    // スワイプ対応（モバイル）
                    let touchStartX = 0;
                    wrapper?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; clearInterval(autoTimer); }, { passive: true });
                    wrapper?.addEventListener('touchend', (e) => {
                        const diff = touchStartX - e.changedTouches[0].clientX;
                        if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
                        autoTimer = setInterval(() => goTo(current + 1), 1000);
                    }, { passive: true });

                } catch (e) { console.log('Banner load skipped:', e); }
            })();

            // バナークリック計測
            window.trackBannerClick = function(id) {
                axios.post('/api/admin/banners/' + id + '/click').catch(() => {});
            };

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
            
            // 検索入力クリア時に全商品一覧に戻す
            document.getElementById('search-input')?.addEventListener('input', (e) => {
                if (!e.target.value.trim()) {
                    delete currentFilters.query;
                    currentPage = 1;
                    loadProducts();
                }
            });
            
            // 記事カードHTML生成（PC用）
            function articleCardPC(article) {
                return \`<a href="/news/\${article.slug}" class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <img loading="lazy" src="\${article.thumbnail_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=PARTS+HUB+NEWS'}"
                         alt="\${article.title}" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <div class="flex items-center text-xs text-gray-500 mb-3">
                            <span class="px-2 py-1 bg-red-100 text-red-600 rounded font-medium">\${article.category}</span>
                            <span class="mx-2">•</span>
                            <span>\${new Date(article.published_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</span>
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
                    <img loading="lazy" src="\${article.thumbnail_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=PARTS+HUB+NEWS'}"
                         alt="\${article.title}" class="w-full h-40 object-cover">
                    <div class="p-4">
                        <div class="flex items-center text-xs text-gray-500 mb-2">
                            <span class="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium">\${article.category}</span>
                            <span class="mx-1.5">•</span>
                            <span>\${new Date(article.published_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</span>
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
            
            // お知らせ読み込み
            async function loadAnnouncements() {
                try {
                    const res = await fetch('/api/announcements?limit=5');
                    const data = await res.json();
                    if (!data.success || !data.data || data.data.length === 0) return;

                    const section = document.getElementById('announcements-section');
                    const container = document.getElementById('announcements-container');
                    if (!section || !container) return;

                    const typeConfig = {
                        'maintenance': { icon: 'fa-wrench', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', label: 'メンテナンス' },
                        'important':   { icon: 'fa-exclamation-triangle', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-100 text-red-700', label: '重要' },
                        'update':      { icon: 'fa-sync-alt', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', label: 'アップデート' },
                        'campaign':    { icon: 'fa-gift', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-100 text-green-700', label: 'キャンペーン' },
                        'info':        { icon: 'fa-info-circle', bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-700', label: 'お知らせ' }
                    };

                    container.innerHTML = data.data.map(function(a) {
                        var cfg = typeConfig[a.type] || typeConfig['info'];
                        var dateStr = '';
                        if (a.published_at) {
                            dateStr = new Date(a.published_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
                        }
                        var pinIcon = a.is_pinned ? '<i class="fas fa-thumbtack text-red-400 mr-1" title="ピン留め"></i>' : '';
                        return '<div class="' + cfg.bg + ' border ' + cfg.border + ' rounded-xl p-4 transition-all hover:shadow-sm">' +
                            '<div class="flex items-start gap-3">' +
                                '<div class="flex-shrink-0 mt-0.5"><i class="fas ' + cfg.icon + ' ' + cfg.text + ' text-lg"></i></div>' +
                                '<div class="flex-1 min-w-0">' +
                                    '<div class="flex items-center gap-2 mb-1 flex-wrap">' +
                                        '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ' + cfg.badge + '">' + cfg.label + '</span>' +
                                        pinIcon +
                                        '<span class="text-xs text-gray-400">' + dateStr + '</span>' +
                                    '</div>' +
                                    '<h3 class="font-bold ' + cfg.text + ' text-sm mb-1">' + a.title + '</h3>' +
                                    '<p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">' + a.content + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('');

                    section.classList.remove('hidden');
                } catch (e) {
                    console.log('お知らせ読み込みスキップ:', e);
                }
            }

            // ページ読み込み時に実行
            window.addEventListener('DOMContentLoaded', () => {
                loadCategories();
                loadMakers();
                loadProducts();
                loadFeaturedArticles();
                loadAnnouncements();
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PARTS HUBニュース - 自動車パーツ・整備の最新情報 | PARTS HUB</title>
        <meta name="description" content="自動車整備・パーツに関する最新ニュース、メンテナンスガイド、デッドストック活用術、コスト削減のコツを配信。整備工場の経営改善に役立つ情報が満載。">
        <link rel="canonical" href="https://parts-hub-tci.com/news">
        ${hreflang("/news")}
        <meta property="og:type" content="website">
        <meta property="og:title" content="PARTS HUBニュース - 自動車パーツ・整備の最新情報">
        <meta property="og:description" content="自動車整備・パーツに関する最新ニュース、メンテナンスガイド、デッドストック活用術を配信。">
        <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
        <meta property="og:url" content="https://parts-hub-tci.com/news">
        <meta property="og:site_name" content="PARTS HUB">
        <meta property="og:locale" content="ja_JP">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="PARTS HUBニュース - 自動車パーツ・整備の最新情報">
        <meta name="twitter:description" content="自動車整備・パーツに関する最新ニュース、メンテナンスガイド、デッドストック活用術を配信。">
        <meta name="twitter:image" content="https://parts-hub-tci.com/icons/og-default.png">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "PARTS HUBニュース",
          "description": "自動車パーツ・整備に関する最新ニュース一覧",
          "url": "https://parts-hub-tci.com/news",
          "isPartOf": { "@type": "WebSite", "name": "PARTS HUB", "url": "https://parts-hub-tci.com" }
        }
        </script>
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${BREADCRUMB_CSS}</style>
    </head>
    <body class="bg-gray-50">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-gray-600 hover:text-gray-900 flex-shrink-0">
                        <i class="fas fa-arrow-left text-lg sm:text-xl"></i>
                    </a>
                    <a href="/" class="text-red-500 font-bold text-xl sm:text-2xl">PARTS HUB</a>
                </div>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'ニュース'}])}

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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
                            <img loading="lazy" src="\${article.thumbnail_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=PARTS+HUB+NEWS'}" 
                                 alt="\${article.title}" 
                                 class="w-full h-48 object-cover">
                            <div class="p-4">
                                <div class="flex items-center text-xs text-gray-500 mb-2">
                                    <span class="px-2 py-1 bg-red-100 text-red-600 rounded">\${article.category}</span>
                                    <span class="mx-2">•</span>
                                    <span>\${new Date(article.published_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</span>
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
                    <a href="/area" class="hover:text-white transition-colors">エリア別</a>
                    <a href="/vehicle" class="hover:text-white transition-colors">車種別</a>
                    <a href="/guide" class="hover:text-white transition-colors">整備ガイド</a>
                    <a href="/partner" class="hover:text-white transition-colors">パートナー</a>
                    <a href="/franchise" class="hover:text-white transition-colors">パートナー募集</a>
                    <a href="/faq" class="hover:text-white transition-colors">FAQ</a>
                    <a href="/contact" class="hover:text-white transition-colors">お問い合わせ</a>
                </div>
                <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
                    <a href="/terms" class="hover:text-gray-300 transition-colors">利用規約</a>
                    <a href="/privacy" class="hover:text-gray-300 transition-colors">プライバシー</a>
                    <a href="/legal" class="hover:text-gray-300 transition-colors">特商法表記</a>
                    <a href="/sitemap" class="hover:text-gray-300 transition-colors">サイトマップ</a>
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
                var dateStr = pubDate.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric'});
                
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
                            var d = new Date(a.published_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
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
app.get('/news/:category/:year/:month/:slug', async (c) => {
  const { category, year, month, slug } = c.req.param();
  const fullSlug = `${category}/${year}/${month}/${slug}`;
  const { DB } = c.env as any
  let seoTitle = '記事詳細 - PARTS HUBニュース'
  let seoDesc = '自動車パーツ・整備に関する最新情報 - PARTS HUB'
  let seoImage = 'https://parts-hub-tci.com/icons/og-default.png'
  const seoUrl = `https://parts-hub-tci.com/news/${fullSlug}`
  let articleJsonLd = ''
  let breadcrumbJsonLd = ''
  try {
    const art = await DB.prepare(`SELECT * FROM articles WHERE slug = ? AND status = 'published'`).bind(fullSlug).first()
    if (art) {
      const aTitle = String(art.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;')
      const aSummary = String(art.summary || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').substring(0, 160)
      seoTitle = `${aTitle} - PARTS HUBニュース`
      seoDesc = aSummary || `${aTitle}｜自動車パーツ・整備の最新情報`
      seoImage = art.thumbnail_url ? String(art.thumbnail_url) : seoImage
      const catLabels: Record<string,string> = { 'parts-guide': 'パーツガイド', 'maintenance': 'メンテナンス', 'tips': '整備のコツ', 'deadstock': 'デッドストック活用' }
      const catLabel = catLabels[category] || category
      articleJsonLd = `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": art.title,
        "description": aSummary,
        "image": seoImage,
        "url": seoUrl,
        "datePublished": art.published_at || art.created_at,
        "dateModified": art.updated_at || art.published_at,
        "author": { "@type": "Organization", "name": "PARTS HUB", "url": "https://parts-hub-tci.com" },
        "publisher": { "@type": "Organization", "name": "PARTS HUB", "logo": { "@type": "ImageObject", "url": "https://parts-hub-tci.com/icons/icon-192x192.png" } },
        "mainEntityOfPage": { "@type": "WebPage", "@id": seoUrl }
      })}</script>`
      breadcrumbJsonLd = `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": "ニュース", "item": "https://parts-hub-tci.com/news" },
          { "@type": "ListItem", "position": 3, "name": catLabel, "item": `https://parts-hub-tci.com/news?category=${category}` },
          { "@type": "ListItem", "position": 4, "name": art.title }
        ]
      })}</script>`
    }
  } catch(e) { console.error('Article SSR SEO error:', e) }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${seoTitle}</title>
        <meta name="description" content="${seoDesc}">
        <link rel="canonical" href="${seoUrl}">
        <meta property="og:type" content="article">
        <meta property="og:title" content="${seoTitle}">
        <meta property="og:description" content="${seoDesc}">
        <meta property="og:image" content="${seoImage}">
        <meta property="og:url" content="${seoUrl}">
        <meta property="og:site_name" content="PARTS HUB">
        <meta property="og:locale" content="ja_JP">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${seoTitle}">
        <meta name="twitter:description" content="${seoDesc}">
        <meta name="twitter:image" content="${seoImage}">
        ${articleJsonLd}
        ${breadcrumbJsonLd}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        ${getArticleDetailCSS()}
    </head>
    <body class="bg-gray-50">
        ${getArticleDetailBody()}
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>記事詳細 - PARTS HUBニュース</title>
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        ${getArticleDetailCSS()}
    </head>
    <body class="bg-gray-50">
        ${getArticleDetailBody()}
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ログイン - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBにログイン。自動車パーツの売買・出品を始めましょう。">
        <meta name="robots" content="noindex, follow">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新規会員登録 - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBに新規登録。無料で自動車パーツの売買が始められます。">
        <meta name="robots" content="noindex, follow">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
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
app.get('/products/:id', async (c) => {
  // SSR: DBから商品情報を取得してSEOメタを動的生成
  const productId = c.req.param('id')
  const { DB } = c.env as any
  let seoTitle = '商品詳細 - PARTS HUB（パーツハブ）'
  let seoDesc = '自動車パーツの詳細情報、適合車両、価格など - PARTS HUB'
  let seoImage = 'https://parts-hub-tci.com/icons/og-default.png'
  let seoUrl = `https://parts-hub-tci.com/products/${productId}`
  let productJsonLd = ''
  let breadcrumbJsonLd = ''
  let seoPrice = '0'
  // SSR body用プリセット変数（Googlebotが初期HTMLで読める）
  let ssrTitle = ''
  let ssrPrice = ''
  let ssrPriceLabel = '（税込）'
  let ssrDescription = ''
  let ssrCategory = '-'
  let ssrPartNumber = '-'
  let ssrConditionBadge = ''
  let ssrBcTitle = '商品詳細'
  let ssrMainImage = ''
  let ssrSellerName = '-'
  let ssrShippingType = '-'
  let ssrStockQty = '-'
  let ssrManufacturer = ''
  let ssrProductNumber = ''
  let ssrJanCode = ''
  let ssrManufacturerUrl = ''
  let ssrIsUniversal = false
  let ssrRelatedProducts: any[] = []
  let productNotFound = false
  try {
    const p = await DB.prepare(`
      SELECT p.*, c.name as category_name,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        u.id as seller_user_id,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as main_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(productId).first()
    if (p) {
      const pTitle = String(p.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;')
      // 改行・連続空白を除去した1行テキスト（meta description用の素材）
      const pDescClean = String(p.description || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/"/g, '&quot;').replace(/</g, '&lt;').trim()
      const pPrice = Number(p.price || 0)
      const pPriceTaxIncluded = Math.floor(pPrice * 1.1)
      const rawImg = String(p.main_image || '')
      const imgPath = rawImg.startsWith('/r2/') ? rawImg : rawImg.startsWith('r2/') ? `/${rawImg}` : `/r2/${rawImg}`
      const pImage = p.main_image ? `https://parts-hub-tci.com${imgPath}` : seoImage
      const pCat = String(p.category_name || '自動車パーツ')
      const pSeller = String(p.seller_name || 'PARTS HUB出品者').replace(/"/g, '&quot;')
      const pCondMap: Record<string, string> = { new: '新品', like_new: '未使用に近い', good: '目立った傷や汚れなし', fair: 'やや傷や汚れあり', poor: '状態が悪い' }
      const pCondLabel = pCondMap[String(p.condition)] || String(p.condition || '中古')
      const pAvail = p.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut'
      // タイトルに品番を含めることで品番検索でのヒット率を向上
      const titleParts: string[] = [pTitle]
      if (p.part_number && !pTitle.includes(p.part_number)) titleParts.push(p.part_number)
      if ((p.manufacturer_name || p.manufacturer) && !pTitle.includes(p.manufacturer_name || p.manufacturer)) titleParts.push(p.manufacturer_name || p.manufacturer)
      // Google検索で全文表示されるよう60文字以内に収める
      const titleBody = titleParts.join(' ')
      seoTitle = titleBody.length > 45 
        ? `${titleBody.substring(0, 45)}… - PARTS HUB`
        : `${titleBody} - PARTS HUB（パーツハブ）`
      // 品番・メーカー・価格・カテゴリを必ず含む構造化 meta description
      const descParts: string[] = [pTitle]
      if (p.part_number) descParts.push(`品番:${p.part_number}`)
      if (p.manufacturer_name || p.manufacturer) descParts.push(`${p.manufacturer_name || p.manufacturer}`)
      if (p.product_number) descParts.push(`製品番号:${p.product_number}`)
      descParts.push(pCat)
      descParts.push(`¥${pPriceTaxIncluded.toLocaleString()}(税込)`)
      descParts.push(pCondLabel)
      // 構造化パートを組み立て、残り文字数で説明文の要約を追加
      const structuredPart = descParts.join('｜')
      const remainLen = 155 - structuredPart.length
      if (remainLen > 15 && pDescClean) {
        const excerpt = pDescClean.substring(0, remainLen - 1)
        seoDesc = `${structuredPart}。${excerpt}`
      } else {
        seoDesc = structuredPart
      }
      seoDesc = seoDesc.substring(0, 160)
      seoImage = pImage
      seoPrice = String(pPriceTaxIncluded)

      // SSR body用データをセット（Googlebotが初期HTMLで読めるようにする）
      ssrTitle = pTitle
      ssrPrice = `¥${pPriceTaxIncluded.toLocaleString()}`
      ssrPriceLabel = p.shipping_type === 'seller_paid' ? '（税込・送料込）' : '（税込・送料別）'
      ssrDescription = String(p.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      ssrCategory = pCat
      ssrPartNumber = String(p.part_number || '-')
      ssrBcTitle = pTitle.length > 30 ? pTitle.substring(0, 30) + '...' : pTitle
      ssrMainImage = pImage
      ssrSellerName = pSeller
      ssrStockQty = String(p.stock_quantity || '1')
      ssrManufacturer = String(p.manufacturer || p.manufacturer_name || '')
      ssrProductNumber = String(p.product_number || '')
      ssrJanCode = String(p.jan_code || '')
      ssrManufacturerUrl = String(p.manufacturer_url || '')
      ssrIsUniversal = !!p.is_universal
      ssrShippingType = p.shipping_type === 'seller_paid' 
        ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold"><i class="fas fa-check-circle"></i>送料込み（出品者負担）</span>'
        : '<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"><i class="fas fa-box"></i>着払い（購入者負担）</span>'
      const condColorMap: Record<string, string> = { new: 'bg-green-100 text-green-800', like_new: 'bg-blue-100 text-blue-800', good: 'bg-gray-100 text-gray-800', fair: 'bg-yellow-100 text-yellow-800', poor: 'bg-red-100 text-red-800' }
      const condColor = condColorMap[String(p.condition)] || 'bg-gray-100 text-gray-800'
      ssrConditionBadge = `<span class="px-3 py-1 rounded-full text-xs font-semibold ${condColor}">${pCondLabel}</span>${p.status === 'sold' ? ' <span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">SOLD OUT</span>' : ''}`

      // 全商品画像を取得
      const allImages: string[] = [pImage]
      try {
        const { results: imgs } = await DB.prepare(
          'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order'
        ).bind(productId).all()
        ;(imgs || []).forEach((img: any, i: number) => {
          if (i === 0) return // メイン画像はすでに追加済み
          const raw = String(img.image_url || '')
          const path = raw.startsWith('/r2/') ? raw : raw.startsWith('r2/') ? `/${raw}` : `/r2/${raw}`
          allImages.push(`https://parts-hub-tci.com${path}`)
        })
      } catch(e) { /* 画像取得エラーは無視 */ }

      // 出品者のレビュー集計を取得（AggregateRating用）
      let aggregateRating: any = null
      try {
        const sellerId = p.seller_user_id || p.user_id
        if (sellerId) {
          const reviewStats = await DB.prepare(`
            SELECT COUNT(*) as cnt, COALESCE(AVG(rating), 0) as avg
            FROM reviews WHERE reviewee_id = ? OR reviewed_user_id = ?
          `).bind(sellerId, sellerId).first() as any
          if (reviewStats && Number(reviewStats.cnt) > 0) {
            aggregateRating = {
              "@type": "AggregateRating",
              "ratingValue": (Math.round(Number(reviewStats.avg) * 10) / 10).toString(),
              "reviewCount": Number(reviewStats.cnt).toString(),
              "bestRating": "5",
              "worstRating": "1"
            }
          }
        }
      } catch(e) { /* レビュー取得エラーは無視 */ }

      // 拡充版 Product JSON-LD
      const productSchema: any = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.title,
        "description": pDescClean.substring(0, 500) || seoDesc,
        "image": allImages.length > 1 ? allImages : pImage,
        "url": seoUrl,
        "category": pCat,
        "brand": { "@type": "Brand", "name": (p.manufacturer_name || p.manufacturer || pCat) },
        "sku": p.part_number || `PH-${p.id}`,
        "itemCondition": p.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
        "offers": {
          "@type": "Offer",
          "url": seoUrl,
          "priceCurrency": "JPY",
          "price": pPriceTaxIncluded,
          "availability": pAvail,
          "priceValidUntil": new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          "seller": { "@type": "AutoPartsStore", "name": pSeller, "url": `https://parts-hub-tci.com/seller/${p.seller_user_id || p.user_id}` },
          "itemCondition": p.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "JP" },
            "deliveryTime": { "@type": "ShippingDeliveryTime", "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" }, "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 5, "unitCode": "DAY" } }
          },
          "hasMerchantReturnPolicy": { "@type": "MerchantReturnPolicy", "applicableCountry": "JP", "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow", "merchantReturnDays": 7, "returnMethod": "https://schema.org/ReturnByMail" }
        }
      }
      // 品番がある場合 mpn を追加
      if (p.part_number) productSchema.mpn = p.part_number
      // JANコード（GTIN）がある場合
      if (p.jan_code) productSchema.gtin13 = p.jan_code
      // メーカー名がある場合
      if (p.manufacturer_name || p.manufacturer) productSchema.brand = { "@type": "Brand", "name": p.manufacturer_name || p.manufacturer }
      // 製品番号がある場合
      if (p.product_number) productSchema.productID = p.product_number
      // AggregateRating があれば追加
      if (aggregateRating) productSchema.aggregateRating = aggregateRating

      // 同カテゴリの関連商品を取得（SEO内部リンク構築）
      try {
        const { results: related } = await DB.prepare(`
          SELECT p.id, p.title, p.price, p.condition, p.shipping_type,
            (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as main_image
          FROM products p
          WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
          ORDER BY p.created_at DESC LIMIT 6
        `).bind(p.category_id, productId).all()
        ssrRelatedProducts = related || []
      } catch(e) { /* 関連商品取得エラーは無視 */ }

      productJsonLd = `<script type="application/ld+json">${JSON.stringify(productSchema)}</script>`
      breadcrumbJsonLd = `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": pCat, "item": `https://parts-hub-tci.com/search?category=${encodeURIComponent(pCat)}` },
          { "@type": "ListItem", "position": 3, "name": p.title }
        ]
      })}</script>`
    } else {
      productNotFound = true
    }
  } catch(e) { console.error('Product SSR SEO error:', e) }

  // 商品が存在しない場合は404を返す
  if (productNotFound) {
    return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>商品が見つかりません - PARTS HUB</title>
        <meta name="robots" content="noindex, nofollow">
        <meta name="description" content="お探しの商品は存在しないか、削除された可能性があります。">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <header class="bg-white border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            </div>
        </header>
        <main class="max-w-2xl mx-auto px-4 py-20 text-center">
            <div class="text-6xl text-gray-300 mb-6"><i class="fas fa-box-open"></i></div>
            <h1 class="text-2xl font-bold text-gray-900 mb-4">商品が見つかりません</h1>
            <p class="text-gray-600 mb-8">お探しの商品は存在しないか、既に削除された可能性があります。</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/search" class="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors">
                    <i class="fas fa-search mr-2"></i>パーツを検索する
                </a>
                <a href="/" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    <i class="fas fa-home mr-2"></i>トップページへ
                </a>
            </div>
        </main>
    </body>
    </html>
    `, 404)
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${seoTitle}</title>
        <meta name="description" content="${seoDesc}">
        <link rel="canonical" href="${seoUrl}">
        ${hreflang("/products/" + productId)}
        <meta property="og:type" content="product">
        <meta property="og:title" content="${seoTitle}">
        <meta property="og:description" content="${seoDesc}">
        <meta property="og:image" content="${seoImage}">
        <meta property="og:url" content="${seoUrl}">
        <meta property="og:site_name" content="PARTS HUB">
        <meta property="og:locale" content="ja_JP">
        <meta property="product:price:amount" content="${seoPrice}">
        <meta property="product:price:currency" content="JPY">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${seoTitle}">
        <meta name="twitter:description" content="${seoDesc}">
        <meta name="twitter:image" content="${seoImage}">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        ${productJsonLd}
        ${breadcrumbJsonLd}
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
            ${BREADCRUMB_CSS}
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
        <nav aria-label="パンくずリスト" class="bc-nav"><div class="bc-wrap"><a href="/" class="bc-link">PARTS HUB</a><span class="bc-sep"><i class="fas fa-chevron-right"></i></span><a href="/search" class="bc-link">パーツ検索</a><span class="bc-sep"><i class="fas fa-chevron-right"></i></span><span id="bc-product-title" class="bc-current">${ssrBcTitle}</span></div></nav>

        <!-- メインコンテンツ -->
        <main id="product-detail-container" class="max-w-6xl mx-auto px-4 py-6">
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <!-- 左カラム：画像ギャラリー (3カラム) -->
                <div class="lg:col-span-3">
                    <!-- メイン画像 -->
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                        <div class="aspect-square bg-gray-100 flex items-center justify-center">
                            <img id="main-product-image" 
                                 src="${ssrMainImage || 'https://placehold.co/600x600/e2e8f0/64748b?text=Loading...'}" 
                                 alt="${ssrTitle || '商品画像'}" 
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
                            ${ssrTitle || '読み込み中...'}
                        </h1>
                        
                        <!-- 状態バッジ -->
                        <div id="product-condition-badge" class="inline-block mb-4">
                            ${ssrConditionBadge}
                        </div>
                        
                        <!-- 価格 -->
                        <div class="mb-6">
                            <div class="flex items-baseline space-x-2">
                                <span id="product-price" class="text-4xl font-bold text-gray-900">${ssrPrice || '¥0'}</span>
                                <span id="product-price-label" class="text-gray-500 text-sm">${ssrPriceLabel}</span>
                            </div>
                            <div id="tax-detail" class="mt-1"></div>
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
                            <button id="negotiate-btn" onclick="openPriceOfferModal()" 
                                    class="w-full px-6 py-4 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center">
                                <i class="fas fa-tag mr-2"></i>値下げ交渉
                            </button>
                        </div>
                        <button id="contact-btn" onclick="contactSeller()" 
                                class="w-full px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center">
                            <i class="fas fa-comment-dots mr-2"></i>出品者に質問
                        </button>
                        <div class="mt-3 pt-3 border-t border-gray-100">
                            <p class="text-xs text-gray-400 text-center mb-2">この商品をシェア</p>
                            <div class="flex justify-center gap-2" id="share-buttons">
                                <a id="share-line" href="#" target="_blank" rel="noopener" class="w-10 h-10 flex items-center justify-center rounded-full bg-[#06C755] text-white hover:opacity-80 transition-opacity" title="LINEでシェア"><i class="fab fa-line text-lg"></i></a>
                                <a id="share-x" href="#" target="_blank" rel="noopener" class="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:opacity-80 transition-opacity" title="Xでシェア"><i class="fab fa-x-twitter text-lg"></i></a>
                                <a id="share-facebook" href="#" target="_blank" rel="noopener" class="w-10 h-10 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-80 transition-opacity" title="Facebookでシェア"><i class="fab fa-facebook-f text-lg"></i></a>
                                <button id="share-copy" onclick="copyProductUrl()" class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors" title="URLをコピー"><i class="fas fa-link text-sm"></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 商品詳細テーブル -->
                    <div class="bg-white rounded-xl shadow-sm p-5 mb-4">
                        <h2 class="font-bold text-gray-900 mb-4 text-lg">商品の情報</h2>
                        <table class="w-full text-sm">
                            <tbody>
                                <tr class="border-b">
                                    <td class="py-3 text-gray-600 font-medium">カテゴリ</td>
                                    <td id="product-category" class="py-3 text-gray-900 text-right">${ssrCategory}</td>
                                </tr>
                                <tr class="border-b">
                                    <td class="py-3 text-gray-600 font-medium">部品番号</td>
                                    <td id="product-part-number" class="py-3 text-gray-900 text-right">${ssrPartNumber}</td>
                                </tr>
                                <tr class="border-b">
                                    <td class="py-3 text-gray-600 font-medium">在庫数</td>
                                    <td id="product-stock" class="py-3 text-gray-900 text-right">${ssrStockQty}</td>
                                </tr>
                                <tr>
                                    <td class="py-3 text-gray-600 font-medium">送料負担</td>
                                    <td id="product-shipping-type" class="py-3 text-gray-900 text-right">${ssrShippingType}</td>
                                </tr>
                                <tr id="product-universal-row" style="${ssrIsUniversal ? '' : 'display:none;'}">
                                    <td class="py-3 text-gray-600 font-medium">適合範囲</td>
                                    <td class="py-3 text-right"><span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold"><i class="fas fa-globe"></i>全車種対応（汎用品）</span></td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- OEM品番情報（ARGOS JPC連携時に表示） -->
                        <div id="oem-parts-section" style="display:none;" class="mt-4 pt-4 border-t">
                            <h3 class="text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-barcode text-red-400 mr-1.5"></i>OEM品番情報
                                <span style="font-size:10px; background:#fef2f2; color:#ef4444; padding:1px 6px; border-radius:9999px; margin-left:4px;">ARGOS JPC</span>
                            </h3>
                            <div id="oem-parts-list" class="space-y-1.5"></div>
                        </div>
                    </div>

                    <!-- 製品スペック情報 -->
                    <div id="product-specs-section" style="${(ssrJanCode && ssrJanCode !== '' && ssrJanCode !== 'undefined') || (ssrManufacturer && ssrManufacturer !== '' && ssrManufacturer !== 'undefined') || (ssrProductNumber && ssrProductNumber !== '' && ssrProductNumber !== 'undefined') || (ssrManufacturerUrl && ssrManufacturerUrl !== '' && ssrManufacturerUrl !== 'undefined') ? '' : 'display:none;'}" class="bg-white rounded-xl shadow-sm p-5 mb-4">
                        <h2 class="font-bold text-gray-900 mb-4 text-lg">
                            <i class="fas fa-microchip text-cyan-500 mr-2"></i>製品スペック情報
                        </h2>
                        <table class="w-full text-sm">
                            <tbody>
                                <tr id="spec-jan-code-row" style="${ssrJanCode && ssrJanCode !== '' && ssrJanCode !== 'undefined' ? '' : 'display:none;'}" class="border-b">
                                    <td class="py-3 text-gray-600 font-medium w-1/3">
                                        <i class="fas fa-barcode text-gray-400 mr-1.5"></i>JANコード
                                    </td>
                                    <td id="spec-jan-code" class="py-3 text-gray-900 text-right font-mono">${ssrJanCode || '-'}</td>
                                </tr>
                                <tr id="spec-manufacturer-row" style="${ssrManufacturer && ssrManufacturer !== '' && ssrManufacturer !== 'undefined' ? '' : 'display:none;'}" class="border-b">
                                    <td class="py-3 text-gray-600 font-medium w-1/3">
                                        <i class="fas fa-industry text-gray-400 mr-1.5"></i>メーカー名
                                    </td>
                                    <td id="spec-manufacturer" class="py-3 text-gray-900 text-right font-semibold">${ssrManufacturer || '-'}</td>
                                </tr>
                                <tr id="spec-part-number-row" style="${ssrPartNumber && ssrPartNumber !== '-' && ssrPartNumber !== '' && ssrPartNumber !== 'undefined' ? '' : 'display:none;'}" class="border-b">
                                    <td class="py-3 text-gray-600 font-medium w-1/3">
                                        <i class="fas fa-hashtag text-gray-400 mr-1.5"></i>品番
                                    </td>
                                    <td id="spec-part-number" class="py-3 text-gray-900 text-right font-mono">${ssrPartNumber || '-'}</td>
                                </tr>
                                <tr id="spec-product-number-row" style="${ssrProductNumber && ssrProductNumber !== '' && ssrProductNumber !== 'undefined' ? '' : 'display:none;'}" class="border-b">
                                    <td class="py-3 text-gray-600 font-medium w-1/3">
                                        <i class="fas fa-tag text-gray-400 mr-1.5"></i>製品番号
                                    </td>
                                    <td id="spec-product-number" class="py-3 text-gray-900 text-right font-mono">${ssrProductNumber || '-'}</td>
                                </tr>
                                <tr id="spec-manufacturer-url-row" style="${ssrManufacturerUrl && ssrManufacturerUrl !== '' && ssrManufacturerUrl !== 'undefined' ? '' : 'display:none;'}">
                                    <td class="py-3 text-gray-600 font-medium w-1/3">
                                        <i class="fas fa-external-link-alt text-gray-400 mr-1.5"></i>メーカーページ
                                    </td>
                                    <td id="spec-manufacturer-url" class="py-3 text-right">
                                        <a id="spec-manufacturer-link" href="${ssrManufacturerUrl || '#'}" target="_blank" rel="noopener noreferrer"
                                           class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100 transition-colors">
                                            <i class="fas fa-external-link-alt"></i>カタログを確認する
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 出品者情報カード（レビュー・バッジ付き） -->
                    <div class="bg-white rounded-xl shadow-sm p-5">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="font-bold text-gray-900 text-lg">出品者</h2>
                            <div id="seller-badge-area" class="flex items-center text-sm">
                                <!-- バッジがJSで挿入される -->
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden" id="seller-avatar">
                                    <i class="fas fa-store text-gray-400 text-lg"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <a id="seller-shop-link" href="#" class="hover:underline">
                                        <div id="seller-shop-name" class="font-semibold text-gray-900 truncate">${ssrSellerName}</div>
                                    </a>
                                    <div class="flex items-center flex-wrap gap-1 text-sm text-gray-500">
                                        <span id="seller-shop-type">-</span>
                                        <span id="seller-verified" class="ml-1"><!-- 認証バッジ --></span>
                                    </div>
                                </div>
                            </div>
                            <!-- 評価サマリー -->
                            <div id="seller-review-summary" class="border-t pt-3 mt-2">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <div id="seller-stars" class="flex text-yellow-400 text-sm mr-1.5"></div>
                                        <span id="seller-rating" class="font-bold text-gray-900">-</span>
                                    </div>
                                    <span id="seller-review-count" class="text-xs text-gray-500">レビュー 0件</span>
                                </div>
                                <!-- 評価バー -->
                                <div id="seller-rating-bars" class="space-y-1"></div>
                            </div>
                            <!-- 取引実績 -->
                            <div class="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                                <span><i class="fas fa-handshake mr-1"></i>取引完了 <span id="seller-tx-count">0</span>件</span>
                                <a id="seller-all-reviews-link" href="#" class="text-red-500 hover:underline font-semibold">全てのレビューを見る <i class="fas fa-chevron-right text-[10px]"></i></a>
                            </div>
                            <!-- 直近レビュー（最新1件） -->
                            <div id="seller-latest-review" class="hidden border-t pt-3">
                                <!-- JSで挿入 -->
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
                        ${ssrDescription || '読み込み中...'}
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
                        ${ssrIsUniversal ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold"><i class="fas fa-globe"></i>全車種対応（汎用品）</span>' : '<p class="text-gray-500 text-sm">適合車両情報は商品詳細から確認できます</p>'}
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
            <!-- 関連商品セクション（SSR内部リンク構築） -->
            ${ssrRelatedProducts.length > 0 ? `
            <div class="mt-6">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-th-large text-primary mr-2"></i>同じカテゴリの商品
                    </h2>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        ${ssrRelatedProducts.map((rp: any) => {
                          const rpPrice = Math.floor(Number(rp.price || 0) * 1.1)
                          const rpImg = rp.main_image ? (String(rp.main_image).startsWith('/r2/') ? `https://parts-hub-tci.com${rp.main_image}` : `https://parts-hub-tci.com/r2/${String(rp.main_image).replace(/^\/?(r2\/)?/, '')}`) : 'https://placehold.co/300x300/e2e8f0/64748b?text=No+Image'
                          const rpTitle = String(rp.title || '').replace(/</g, '&lt;')
                          const rpCondMap: Record<string, string> = { new: '新品', like_new: '未使用に近い', good: '目立った傷なし', fair: 'やや傷あり', poor: '状態悪い' }
                          const rpCond = rpCondMap[String(rp.condition)] || '中古'
                          return `
                        <a href="/products/${rp.id}" class="block group">
                            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                                <img src="${rpImg}" alt="${rpTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy">
                            </div>
                            <h3 class="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-red-500 transition-colors">${rpTitle}</h3>
                            <p class="text-lg font-bold text-gray-900 mt-1">¥${rpPrice.toLocaleString()}</p>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-gray-500">${rpCond}</span>
                                ${rp.shipping_type === 'seller_paid' ? '<span class="text-xs text-green-600">送料込み</span>' : ''}
                            </div>
                        </a>`
                        }).join('')}
                    </div>
                    <div class="mt-4 text-center">
                        <a href="/search?category=${encodeURIComponent(ssrCategory)}" class="text-red-500 hover:text-red-600 font-semibold text-sm">
                            ${ssrCategory}の商品をもっと見る <i class="fas fa-chevron-right text-xs"></i>
                        </a>
                    </div>
                </div>
            </div>
            ` : ''}
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script src="${v('/static/product-detail.js')}"></script>
        <script src="${v('/static/comments.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>商品を出品 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        <meta name="description" content="PARTS HUBで自動車パーツを出品。写真撮影・価格設定・カテゴリ選択の簡単ステップで今すぐ出品できます。出品手数料無料。">
        <link rel="canonical" href="https://parts-hub-tci.com/listing">
        ${hreflang("/listing")}
        <meta property="og:title" content="商品を出品 - PARTS HUB">
        <meta property="og:description" content="自動車パーツを簡単3ステップで出品。購入者の手数料は無料。売れた時だけ出品者が販売手数料10%を負担。出品無料。">
        <meta property="og:url" content="https://parts-hub-tci.com/listing">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        ${TAILWIND_CSS}
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

            /* 大枠カテゴリ選択チップ */
            .tc-chip {
                padding: 8px 14px; border: 2px solid #e5e7eb; border-radius: 10px;
                cursor: pointer; transition: all 0.2s; background: #fff;
                font-size: 13px; font-weight: 600; color: #374151; white-space: nowrap;
            }
            .tc-chip:hover { border-color: #818cf8; background: #eef2ff; }
            .tc-chip.active {
                border-color: #6366f1; background: #eef2ff; color: #4338ca; box-shadow: 0 0 0 1px #6366f1;
            }

            /* 都道府県選択チップ */
            .pref-chip {
                padding: 6px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px;
                cursor: pointer; transition: all 0.2s; background: #fff;
                font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap;
            }
            .pref-chip:hover { border-color: #2dd4bf; background: #f0fdfa; }
            .pref-chip.active {
                border-color: #14b8a6; background: #f0fdfa; color: #0f766e; box-shadow: 0 0 0 1px #14b8a6;
            }

            /* 送料選択チップ */
            .shipping-chip {
                padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 14px;
                cursor: pointer; transition: all 0.2s; background: #fff;
            }
            .shipping-chip:hover { border-color: #93c5fd; background: #eff6ff; }
            .shipping-chip.active {
                border-color: #3b82f6; background: #eff6ff; box-shadow: 0 0 0 1px #3b82f6;
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
            .draft-btn {
                width: 100%; background: #fff;
                color: #6366f1; padding: 14px; border-radius: 14px;
                font-weight: 700; font-size: 15px; border: 2px solid #6366f1; cursor: pointer;
                transition: all 0.2s;
            }
            .draft-btn:hover {
                background: #eef2ff;
            }
            .draft-btn:disabled {
                opacity: 0.6; cursor: not-allowed;
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
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                    <button onclick="window.history.back()" class="text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-sm font-medium">
                        <i class="fas fa-chevron-left"></i><span>戻る</span>
                    </button>
                </div>
                <div class="font-bold text-base text-gray-900">商品を出品</div>
                <a href="/faq" class="text-gray-400 hover:text-gray-600 text-sm">
                    <i class="fas fa-question-circle text-lg"></i>
                </a>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'出品する'}])}

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
                            <div class="text-xs text-gray-400">税抜き価格を入力（税込み価格は自動計算されます）</div>
                        </div>
                    </div>
                    <div class="section-body space-y-5">
                        <!-- 販売価格 -->
                        <div>
                            <label class="form-label">販売価格（税抜き） <span class="required">必須</span></label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">¥</span>
                                <input type="number" id="product-price" required min="0"
                                       class="form-input text-right text-xl font-bold" style="padding-left: 36px;"
                                       placeholder="0">
                            </div>
                            <div class="mt-2 space-y-1">
                                <div class="flex items-center justify-between">
                                    <span class="form-helper">税抜き価格を入力してください</span>
                                    <span class="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded" id="tax-included-display">税込価格：¥0</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-gray-400">消費税10%が自動加算されます</span>
                                    <span class="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded" id="fee-display">販売手数料 10%：¥0</span>
                                </div>
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

                <!-- ===== 製品スペック情報 ===== -->
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-header-icon bg-cyan-50 text-cyan-500">
                            <i class="fas fa-barcode"></i>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900">製品スペック情報 <span class="optional">任意</span></div>
                            <div class="text-xs text-gray-400">入力すると商品詳細ページに表示され、購入者が製品を特定しやすくなります</div>
                        </div>
                    </div>
                    <div class="section-body">
                        <div class="field-row">
                            <div>
                                <label class="form-label">JANコード <span class="optional">任意</span></label>
                                <input type="text" id="jan-code"
                                       class="form-input"
                                       placeholder="例: 4901234567890"
                                       maxlength="13"
                                       pattern="[0-9]*"
                                       inputmode="numeric">
                            </div>
                            <div>
                                <label class="form-label">メーカー名 <span class="optional">任意</span></label>
                                <input type="text" id="manufacturer-name"
                                       class="form-input"
                                       placeholder="例: DENSO, NGK, AISIN">
                            </div>
                        </div>
                        <div class="field-row">
                            <div>
                                <label class="form-label">品番 <span class="optional">任意</span></label>
                                <input type="text" id="product-number"
                                       class="form-input"
                                       placeholder="例: DFP-0105">
                            </div>
                            <div>
                                <label class="form-label">メーカーページリンク <span class="optional">任意</span></label>
                                <input type="url" id="manufacturer-url"
                                       class="form-input"
                                       placeholder="https://www.denso.com/jp/ja/products/..."
                                       style="font-size: 0.85rem;">
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-2"><i class="fas fa-info-circle mr-1"></i>メーカーページリンクを入力すると、購入者がメーカーカタログを直接確認できます</p>
                    </div>
                </div>

                <!-- ===== 大枠カテゴリ選択 ===== -->
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-header-icon bg-indigo-50 text-indigo-500">
                            <i class="fas fa-th-large"></i>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900">車両・商品カテゴリ <span class="required">必須</span></div>
                            <div class="text-xs text-gray-400">TOPページの表示カテゴリを選択してください</div>
                        </div>
                    </div>
                    <div class="section-body">
                        <input type="hidden" id="top-category" value="">
                        <div class="flex flex-wrap gap-2" id="top-category-chips">
                            <button type="button" class="tc-chip" data-value="car" onclick="selectTopCategory(this)"><i class="fas fa-car mr-1"></i>乗用車</button>
                            <button type="button" class="tc-chip" data-value="truck" onclick="selectTopCategory(this)"><i class="fas fa-truck-moving mr-1"></i>トラック</button>
                            <button type="button" class="tc-chip" data-value="bus" onclick="selectTopCategory(this)"><i class="fas fa-bus mr-1"></i>バス</button>
                            <button type="button" class="tc-chip" data-value="motorcycle" onclick="selectTopCategory(this)"><i class="fas fa-motorcycle mr-1"></i>バイク</button>
                            <button type="button" class="tc-chip" data-value="forklift" onclick="selectTopCategory(this)"><i class="fas fa-pallet mr-1"></i>フォークリフト</button>
                            <button type="button" class="tc-chip" data-value="heavy_equipment" onclick="selectTopCategory(this)"><i class="fas fa-hard-hat mr-1"></i>重機</button>
                            <button type="button" class="tc-chip" data-value="ship" onclick="selectTopCategory(this)"><i class="fas fa-ship mr-1"></i>船舶</button>
                            <button type="button" class="tc-chip" data-value="agriculture" onclick="selectTopCategory(this)"><i class="fas fa-tractor mr-1"></i>農機具</button>
                            <button type="button" class="tc-chip" data-value="tools" onclick="selectTopCategory(this)"><i class="fas fa-tools mr-1"></i>工具</button>
                            <button type="button" class="tc-chip" data-value="rebuilt" onclick="selectTopCategory(this)"><i class="fas fa-sync-alt mr-1"></i>リビルト</button>
                            <button type="button" class="tc-chip" data-value="electrical" onclick="selectTopCategory(this)"><i class="fas fa-bolt mr-1"></i>電装</button>
                            <button type="button" class="tc-chip" data-value="other" onclick="selectTopCategory(this)"><i class="fas fa-ellipsis-h mr-1"></i>その他車両</button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2"><i class="fas fa-info-circle mr-1"></i>複数選択できます</p>
                    </div>
                </div>

                <!-- ===== エリア選択 ===== -->
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-header-icon bg-teal-50 text-teal-500">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900">出品エリア</div>
                            <div class="text-xs text-gray-400">商品の発送元エリアを選択してください（デフォルト: 全国対応）</div>
                        </div>
                    </div>
                    <div class="section-body">
                        <input type="hidden" id="prefecture" value="all">
                        <div class="flex flex-wrap gap-2" id="prefecture-chips">
                            <button type="button" class="pref-chip active" data-value="all" onclick="selectPrefecture(this)"><i class="fas fa-globe-asia mr-1"></i>全国</button>
                        </div>
                        <div class="mt-3">
                            <div class="text-xs font-bold text-gray-500 mb-1.5">北海道・東北</div>
                            <div class="flex flex-wrap gap-1.5 mb-2" id="pref-tohoku">
                                <button type="button" class="pref-chip" data-value="hokkaido" onclick="selectPrefecture(this)">北海道</button>
                                <button type="button" class="pref-chip" data-value="aomori" onclick="selectPrefecture(this)">青森</button>
                                <button type="button" class="pref-chip" data-value="iwate" onclick="selectPrefecture(this)">岩手</button>
                                <button type="button" class="pref-chip" data-value="miyagi" onclick="selectPrefecture(this)">宮城</button>
                                <button type="button" class="pref-chip" data-value="akita" onclick="selectPrefecture(this)">秋田</button>
                                <button type="button" class="pref-chip" data-value="yamagata" onclick="selectPrefecture(this)">山形</button>
                                <button type="button" class="pref-chip" data-value="fukushima" onclick="selectPrefecture(this)">福島</button>
                            </div>
                            <div class="text-xs font-bold text-gray-500 mb-1.5">関東</div>
                            <div class="flex flex-wrap gap-1.5 mb-2">
                                <button type="button" class="pref-chip" data-value="tokyo" onclick="selectPrefecture(this)">東京</button>
                                <button type="button" class="pref-chip" data-value="kanagawa" onclick="selectPrefecture(this)">神奈川</button>
                                <button type="button" class="pref-chip" data-value="saitama" onclick="selectPrefecture(this)">埼玉</button>
                                <button type="button" class="pref-chip" data-value="chiba" onclick="selectPrefecture(this)">千葉</button>
                                <button type="button" class="pref-chip" data-value="ibaraki" onclick="selectPrefecture(this)">茨城</button>
                                <button type="button" class="pref-chip" data-value="tochigi" onclick="selectPrefecture(this)">栃木</button>
                                <button type="button" class="pref-chip" data-value="gunma" onclick="selectPrefecture(this)">群馬</button>
                            </div>
                            <div class="text-xs font-bold text-gray-500 mb-1.5">中部</div>
                            <div class="flex flex-wrap gap-1.5 mb-2">
                                <button type="button" class="pref-chip" data-value="niigata" onclick="selectPrefecture(this)">新潟</button>
                                <button type="button" class="pref-chip" data-value="toyama" onclick="selectPrefecture(this)">富山</button>
                                <button type="button" class="pref-chip" data-value="ishikawa" onclick="selectPrefecture(this)">石川</button>
                                <button type="button" class="pref-chip" data-value="fukui" onclick="selectPrefecture(this)">福井</button>
                                <button type="button" class="pref-chip" data-value="yamanashi" onclick="selectPrefecture(this)">山梨</button>
                                <button type="button" class="pref-chip" data-value="nagano" onclick="selectPrefecture(this)">長野</button>
                                <button type="button" class="pref-chip" data-value="gifu" onclick="selectPrefecture(this)">岐阜</button>
                                <button type="button" class="pref-chip" data-value="shizuoka" onclick="selectPrefecture(this)">静岡</button>
                                <button type="button" class="pref-chip" data-value="aichi" onclick="selectPrefecture(this)">愛知</button>
                            </div>
                            <div class="text-xs font-bold text-gray-500 mb-1.5">近畿</div>
                            <div class="flex flex-wrap gap-1.5 mb-2">
                                <button type="button" class="pref-chip" data-value="mie" onclick="selectPrefecture(this)">三重</button>
                                <button type="button" class="pref-chip" data-value="shiga" onclick="selectPrefecture(this)">滋賀</button>
                                <button type="button" class="pref-chip" data-value="kyoto" onclick="selectPrefecture(this)">京都</button>
                                <button type="button" class="pref-chip" data-value="osaka" onclick="selectPrefecture(this)">大阪</button>
                                <button type="button" class="pref-chip" data-value="hyogo" onclick="selectPrefecture(this)">兵庫</button>
                                <button type="button" class="pref-chip" data-value="nara" onclick="selectPrefecture(this)">奈良</button>
                                <button type="button" class="pref-chip" data-value="wakayama" onclick="selectPrefecture(this)">和歌山</button>
                            </div>
                            <div class="text-xs font-bold text-gray-500 mb-1.5">中国・四国</div>
                            <div class="flex flex-wrap gap-1.5 mb-2">
                                <button type="button" class="pref-chip" data-value="tottori" onclick="selectPrefecture(this)">鳥取</button>
                                <button type="button" class="pref-chip" data-value="shimane" onclick="selectPrefecture(this)">島根</button>
                                <button type="button" class="pref-chip" data-value="okayama" onclick="selectPrefecture(this)">岡山</button>
                                <button type="button" class="pref-chip" data-value="hiroshima" onclick="selectPrefecture(this)">広島</button>
                                <button type="button" class="pref-chip" data-value="yamaguchi" onclick="selectPrefecture(this)">山口</button>
                                <button type="button" class="pref-chip" data-value="tokushima" onclick="selectPrefecture(this)">徳島</button>
                                <button type="button" class="pref-chip" data-value="kagawa" onclick="selectPrefecture(this)">香川</button>
                                <button type="button" class="pref-chip" data-value="ehime" onclick="selectPrefecture(this)">愛媛</button>
                                <button type="button" class="pref-chip" data-value="kochi" onclick="selectPrefecture(this)">高知</button>
                            </div>
                            <div class="text-xs font-bold text-gray-500 mb-1.5">九州・沖縄</div>
                            <div class="flex flex-wrap gap-1.5">
                                <button type="button" class="pref-chip" data-value="fukuoka" onclick="selectPrefecture(this)">福岡</button>
                                <button type="button" class="pref-chip" data-value="saga" onclick="selectPrefecture(this)">佐賀</button>
                                <button type="button" class="pref-chip" data-value="nagasaki" onclick="selectPrefecture(this)">長崎</button>
                                <button type="button" class="pref-chip" data-value="kumamoto" onclick="selectPrefecture(this)">熊本</button>
                                <button type="button" class="pref-chip" data-value="oita" onclick="selectPrefecture(this)">大分</button>
                                <button type="button" class="pref-chip" data-value="miyazaki" onclick="selectPrefecture(this)">宮崎</button>
                                <button type="button" class="pref-chip" data-value="kagoshima" onclick="selectPrefecture(this)">鹿児島</button>
                                <button type="button" class="pref-chip" data-value="okinawa" onclick="selectPrefecture(this)">沖縄</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== 送料設定 ===== -->
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-header-icon bg-orange-50 text-orange-500">
                            <i class="fas fa-truck"></i>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900">送料設定</div>
                            <div class="text-xs text-gray-400">配送料の負担者を選択してください</div>
                        </div>
                    </div>
                    <div class="section-body">
                        <input type="hidden" id="shipping-type" value="buyer_paid">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="shipping-chips">
                            <div class="shipping-chip active" data-value="buyer_paid" onclick="selectShippingType(this)">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <i class="fas fa-box text-blue-500"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-sm text-gray-900">着払い（購入者負担）</div>
                                        <div class="text-xs text-gray-500 mt-0.5">送料は購入者が配送時にお支払い</div>
                                    </div>
                                </div>
                            </div>
                            <div class="shipping-chip" data-value="seller_paid" onclick="selectShippingType(this)">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <i class="fas fa-hand-holding-usd text-green-500"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-sm text-gray-900">送料込み（出品者負担）</div>
                                        <div class="text-xs text-gray-500 mt-0.5">販売価格に送料を含めて設定</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <p class="text-xs text-amber-700 leading-relaxed">
                                <i class="fas fa-info-circle mr-1"></i>
                                <strong>ご注意：</strong>送料は商品の大きさ・重量・配送先エリアによって異なります。着払いの場合、購入者が配送業者へ直接お支払いください。送料込みの場合は、送料を考慮した価格設定をお願いします。
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ===== VIN自動入力（ARGOS JPC連携・2026年6月公開予定） ===== -->
                <div class="section-card" id="argos-vin-section" style="display:none;">
                    <div class="section-header" style="background: linear-gradient(135deg, #fef2f2, #fff1f2); border-bottom: 2px solid #fecdd3;">
                        <div class="section-header-icon bg-red-50 text-red-500">
                            <i class="fas fa-magic"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-bold text-sm text-gray-900 flex items-center gap-2">
                                VIN自動入力
                                <span style="font-size:10px; background:#fef2f2; color:#ef4444; padding:1px 8px; border-radius:9999px; font-weight:600;">NEW</span>
                            </div>
                            <div class="text-xs text-gray-500">車台番号を入力すると適合情報・OEM品番を自動取得</div>
                        </div>
                    </div>
                    <div class="section-body">
                        <div style="display:flex; gap:8px; margin-bottom:12px;">
                            <input type="text" id="argos-vin-input"
                                   class="form-input" style="flex:1; font-family:monospace; letter-spacing:2px; text-transform:uppercase;"
                                   placeholder="車台番号を入力（例: JTDKN3DU5P0000001）" maxlength="30">
                            <button type="button" onclick="argosVinSearch()" id="argos-vin-btn"
                                    style="background:linear-gradient(135deg,#ef4444,#ec4899); color:#fff; border:none; padding:0 20px; border-radius:12px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; min-height:48px;">
                                <i class="fas fa-search" style="margin-right:4px;"></i>検索
                            </button>
                        </div>
                        <div id="argos-vin-loading" style="display:none; text-align:center; padding:16px;">
                            <div style="width:24px; height:24px; border:3px solid #fecdd3; border-top-color:#ef4444; border-radius:50%; animation:spin 0.8s linear infinite; display:inline-block;"></div>
                            <p style="font-size:12px; color:#9ca3af; margin-top:8px;">ARGOS JPC APIで車両情報を取得中...</p>
                        </div>
                        <div id="argos-vin-error" style="display:none; background:#fef2f2; border:1px solid #fecdd3; border-radius:12px; padding:12px; margin-top:8px;">
                            <p style="font-size:13px; color:#dc2626;"><i class="fas fa-exclamation-triangle" style="margin-right:4px;"></i><span id="argos-vin-error-msg"></span></p>
                        </div>
                        <div id="argos-vin-result" style="display:none; margin-top:12px;">
                            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:12px; margin-bottom:12px;">
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                                    <i class="fas fa-check-circle" style="color:#22c55e;"></i>
                                    <span style="font-weight:700; font-size:14px; color:#15803d;">車両特定完了</span>
                                    <span id="argos-vin-vehicle-name" style="font-size:12px; color:#6b7280;"></span>
                                </div>
                                <div id="argos-vin-details" style="display:grid; grid-template-columns:1fr 1fr; gap:4px 16px; font-size:12px;"></div>
                            </div>
                            <button type="button" onclick="argosApplyToForm()"
                                    style="width:100%; padding:12px; background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; border:none; border-radius:12px; font-weight:700; font-size:14px; cursor:pointer;">
                                <i class="fas fa-arrow-down" style="margin-right:6px;"></i>この車両情報を適合情報に反映する
                            </button>
                        </div>
                        <p style="font-size:11px; color:#d1d5db; margin-top:8px;">
                            <i class="fas fa-info-circle" style="margin-right:4px;"></i>
                            Powered by ARGOS JPC (Level Bridge Inc.) - 対応: トヨタ/ホンダ/日産/三菱/ダイハツ/マツダ/スバル/スズキ
                        </p>
                    </div>
                </div>

                <!-- ===== 4. 全車種対応（汎用品）チェック ===== -->
                <div class="section-card">
                    <label class="flex items-center gap-3 p-4 cursor-pointer rounded-xl hover:bg-green-50 transition-colors" id="universal-label">
                        <input type="checkbox" id="is-universal" onchange="toggleUniversal(this.checked)" class="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer" style="accent-color:#16a34a;">
                        <div class="section-header-icon bg-green-50 text-green-600" style="width:36px;height:36px;min-width:36px;">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-bold text-sm text-gray-900">全車種対応（汎用品）</div>
                            <div class="text-xs text-gray-400">チェックすると全ての車種ページ・エリアページに表示されます</div>
                        </div>
                    </label>
                    <div id="universal-notice" class="hidden px-4 pb-4">
                        <div class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                            <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
                            <div class="text-xs text-green-700 leading-relaxed">
                                <strong>汎用品として出品されます。</strong>すべての車種別ページとエリア別ページの商品一覧に自動的に表示されます。下の適合車両情報は任意ですが、入力するとより検索されやすくなります。
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== 5. 適合車両情報（アコーディオン） ===== -->
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

                            <!-- マスターデータ連動: メーカー・車種・グレード・タイヤ -->
                            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-database text-blue-500"></i>
                                    <span class="text-sm font-bold text-blue-800">車両データベースから選択</span>
                                    <span class="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">3,898車種収録</span>
                                </div>

                                <!-- メーカー -->
                                <div class="mb-3">
                                    <label class="form-label">メーカー <span class="optional">任意</span></label>
                                    <select id="vm-maker-select" class="form-input">
                                        <option value="">メーカーを選択</option>
                                    </select>
                                </div>

                                <!-- 車種 -->
                                <div class="mb-3">
                                    <label class="form-label">車種 <span class="optional">任意</span></label>
                                    <select id="vm-model-select" class="form-input" disabled>
                                        <option value="">メーカーを先に選択してください</option>
                                    </select>
                                </div>

                                <!-- グレード -->
                                <div class="mb-3">
                                    <label class="form-label">グレード <span class="optional">任意</span></label>
                                    <select id="vm-grade-select" class="form-input" disabled>
                                        <option value="">車種を先に選択してください</option>
                                    </select>
                                    <div class="form-helper" id="vm-grade-hint"></div>
                                </div>

                                <!-- タイヤサイズ（自動表示） -->
                                <div id="vm-tire-display" class="hidden">
                                    <label class="form-label">タイヤサイズ <span class="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded ml-1">自動取得</span></label>
                                    <div id="vm-tire-value" class="bg-white border-2 border-green-300 rounded-xl p-3 text-sm font-mono font-bold text-green-700 flex items-center gap-2">
                                        <i class="fas fa-check-circle text-green-500"></i>
                                        <span id="vm-tire-text"></span>
                                    </div>
                                </div>

                                <!-- 駆動方式（自動表示） -->
                                <div id="vm-drive-display" class="hidden mt-3">
                                    <label class="form-label">駆動方式 <span class="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded ml-1">自動取得</span></label>
                                    <div class="bg-white border-2 border-green-300 rounded-xl p-3 text-sm font-bold text-green-700 flex items-center gap-2">
                                        <i class="fas fa-check-circle text-green-500"></i>
                                        <span id="vm-drive-text"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- 隠しフィールド（既存form互換用） -->
                            <input type="hidden" id="maker-select" value="">
                            <input type="hidden" id="model-select" value="">
                            <input type="hidden" id="grade" value="">
                            <input type="hidden" id="vm-maker-name" value="">
                            <input type="hidden" id="vm-model-name" value="">
                            <input type="hidden" id="vm-grade-name" value="">
                            <input type="hidden" id="vm-tire-size" value="">

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

                            <!-- 型式・エンジン型式 -->
                            <div class="field-row stack-mobile">
                                <div>
                                    <label class="form-label">型式 <span class="optional">任意</span></label>
                                    <input type="text" id="model-code" class="form-input" placeholder="例: DAA-ZVW30">
                                </div>
                                <div>
                                    <label class="form-label">エンジン型式 <span class="optional">任意</span></label>
                                    <input type="text" id="engine-type" class="form-input" placeholder="例: 2ZR-FXE">
                                </div>
                            </div>

                            <!-- 駆動方式（手動・マスター未選択時用） -->
                            <div class="field-row stack-mobile">
                                <div id="drive-type-manual-wrap">
                                    <label class="form-label">駆動方式 <span class="optional">任意</span></label>
                                    <select id="drive-type" class="form-input">
                                        <option value="">選択してください</option>
                                        <option value="FF">FF</option>
                                        <option value="FR">FR</option>
                                        <option value="4WD">4WD</option>
                                        <option value="MR">MR</option>
                                        <option value="RR">RR</option>
                                        <option value="AWD">AWD</option>
                                    </select>
                                </div>
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
                            </div>

                            <!-- 純正部品番号 -->
                            <div>
                                <label class="form-label">純正部品番号 <span class="optional">任意</span></label>
                                <input type="text" id="oem-part-number" class="form-input" placeholder="例: 04465-XXXXX">
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
                <button type="button" id="draft-btn" onclick="productForm.saveDraft()" class="draft-btn mt-2">
                    <i class="far fa-save mr-1.5"></i>下書き保存
                </button>
                <div class="text-center mt-1.5">
                    <span class="text-xs text-gray-400">販売手数料10%（出品者負担）｜出金時に振込手数料¥330/回</span>
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
                                    <span><strong>販売手数料（出品者負担）:</strong> 10%</span>
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
                                        <span><strong>販売手数料（出品者負担）:</strong> 10%</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
                                        <span><strong>送料:</strong> 出品者負担 or 着払い（出品時に選択）</span>
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
                                    <tr><td class="py-2.5 px-2 text-gray-700">販売手数料（出品者負担）</td><td class="py-2.5 px-2 text-center">10%</td><td class="py-2.5 px-2 text-center">10%</td></tr>
                                    <tr><td class="py-2.5 px-2 text-gray-700">送料</td><td class="py-2.5 px-2 text-center text-gray-400">-</td><td class="py-2.5 px-2 text-center">出品者が選択</td></tr>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script src="${v('/static/listing.js?v=20260406')}"></script>
        <script>
            // ========== ARGOS JPC VIN連携（フィーチャーフラグ制御） ==========
            var _argosVehicle = null;
            (async function checkArgosEnabled() {
              try {
                var res = await fetch('/api/argos/status');
                if (!res.ok) return; // 503等 → 非表示のまま（コンソール抑制）
                var data = await res.json();
                if (data.success && data.enabled) {
                  var el = document.getElementById('argos-vin-section');
                  if (el) el.style.display = '';
                }
              } catch(e) { /* ARGOS未有効 → セクション非表示のまま */ }
            })();

            async function argosVinSearch() {
              var vin = document.getElementById('argos-vin-input').value.trim().toUpperCase();
              if (!vin) { alert('車台番号を入力してください'); return; }
              document.getElementById('argos-vin-loading').style.display = '';
              document.getElementById('argos-vin-error').style.display = 'none';
              document.getElementById('argos-vin-result').style.display = 'none';
              try {
                var res = await axios.get('/api/argos/vin/' + encodeURIComponent(vin));
                _argosVehicle = res.data.data;
                document.getElementById('argos-vin-vehicle-name').textContent =
                  _argosVehicle.brand_ja + ' ' + _argosVehicle.model_ja + ' ' + _argosVehicle.grade;
                var fields = [
                  ['型式', _argosVehicle.katashiki],
                  ['年式', _argosVehicle.year + '年' + _argosVehicle.month + '月'],
                  ['エンジン', _argosVehicle.engine],
                  ['駆動', _argosVehicle.drive],
                  ['ミッション', _argosVehicle.transmission],
                  ['燃料', _argosVehicle.fuel]
                ];
                document.getElementById('argos-vin-details').innerHTML = fields.map(function(f) {
                  return '<div><span style="color:#9ca3af;">' + f[0] + ':</span> <strong>' + f[1] + '</strong></div>';
                }).join('');
                document.getElementById('argos-vin-result').style.display = '';
              } catch(e) {
                var errData = e.response && e.response.data;
                document.getElementById('argos-vin-error').style.display = '';
                document.getElementById('argos-vin-error-msg').textContent =
                  errData ? errData.error : '検索に失敗しました';
              }
              document.getElementById('argos-vin-loading').style.display = 'none';
            }

            function argosApplyToForm() {
              if (!_argosVehicle) return;
              var v = _argosVehicle;
              // 型式
              var mc = document.getElementById('model-code');
              if (mc) mc.value = v.katashiki || '';
              // グレード
              var gr = document.getElementById('grade');
              if (gr) gr.value = v.grade || '';
              var vmGradeName = document.getElementById('vm-grade-name');
              if (vmGradeName) vmGradeName.value = v.grade || '';
              // エンジン型式
              var et = document.getElementById('engine-type');
              if (et) et.value = v.engine || '';
              // 駆動方式マッピング
              var dt = document.getElementById('drive-type');
              if (dt) {
                var driveMap = { 'FF': 'FF', '4WD': '4WD', 'FR': 'FR', 'MR': 'MR', 'RR': 'RR', 'E-Four': '4WD', 'AWD': 'AWD' };
                dt.value = driveMap[v.drive] || '';
              }
              // ミッション
              var tt = document.getElementById('transmission-type');
              if (tt) {
                var tmMap = { 'AT': 'AT', 'MT': 'MT', 'CVT': 'CVT', 'eCVT': 'CVT', 'DCT': 'DCT', '4AT': 'AT', '5AT': 'AT', '6AT': 'AT', '8AT': 'AT', '5MT': 'MT', '6MT': 'MT' };
                tt.value = tmMap[v.transmission] || '';
              }
              // 年式
              var yf = document.getElementById('year-from');
              if (yf && v.year) yf.value = v.year;
              var yt = document.getElementById('year-to');
              if (yt && v.year) yt.value = v.year;

              // アコーディオンを開く
              var accordion = document.getElementById('vehicle-accordion');
              if (accordion && !accordion.classList.contains('open')) {
                accordion.classList.add('open');
                var arrow = accordion.previousElementSibling.querySelector('.accordion-arrow');
                if (arrow) arrow.classList.add('open');
              }

              alert('車両情報を適合情報欄に反映しました');
            }

            document.getElementById('argos-vin-input').addEventListener('keydown', function(e) {
              if (e.key === 'Enter') { e.preventDefault(); argosVinSearch(); }
            });
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

            // 大枠カテゴリ選択（複数選択対応）
            function selectTopCategory(el) {
                el.classList.toggle('active');
                // 選択中のカテゴリをカンマ区切りで取得
                var selected = [];
                document.querySelectorAll('.tc-chip.active').forEach(function(c) {
                    selected.push(c.getAttribute('data-value'));
                });
                document.getElementById('top-category').value = selected.length > 0 ? selected.join(',') : 'other';
            }

            // 都道府県選択
            function selectPrefecture(el) {
                document.querySelectorAll('.pref-chip').forEach(function(c) {
                    c.classList.remove('active');
                });
                el.classList.add('active');
                document.getElementById('prefecture').value = el.getAttribute('data-value');
            }

            // 送料タイプ選択
            function selectShippingType(el) {
                document.querySelectorAll('.shipping-chip').forEach(function(c) {
                    c.classList.remove('active');
                });
                el.classList.add('active');
                document.getElementById('shipping-type').value = el.getAttribute('data-value');
            }

            // 全車種対応（汎用品）トグル
            function toggleUniversal(checked) {
                var notice = document.getElementById('universal-notice');
                var label = document.getElementById('universal-label');
                if (checked) {
                    notice.classList.remove('hidden');
                    label.style.background = '#f0fdf4';
                    label.style.borderColor = '#86efac';
                } else {
                    notice.classList.add('hidden');
                    label.style.background = '';
                    label.style.borderColor = '';
                }
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

            // 販売手数料・税込み価格リアルタイム表示
            var priceInput = document.getElementById('product-price');
            if (priceInput) {
                priceInput.addEventListener('input', function() {
                    var price = parseInt(this.value) || 0;
                    var fee = Math.floor(price * 0.1);
                    var taxAmount = Math.floor(price * 0.1);
                    var taxIncluded = Math.floor(price * 1.1);
                    document.getElementById('fee-display').textContent =
                        '販売手数料 10%：¥' + fee.toLocaleString();
                    var taxDisplay = document.getElementById('tax-included-display');
                    if (taxDisplay) {
                        taxDisplay.textContent = '税込価格：¥' + taxIncluded.toLocaleString();
                    }
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>メッセージ - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.location.href='/mypage'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>マイページ
                </button>
                </div>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
                            timeZone: 'Asia/Tokyo',
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '';
                    
                    // 既読マーク: 自分が送ったメッセージが既読かどうか
                    const iMyLastMsg = room.last_message_sender_id == currentUserId;
                    const lastMsgRead = room.last_message_is_read == 1;
                    let readIcon = '';
                    if (iMyLastMsg && lastMsgRead) {
                        readIcon = '<i class="fas fa-check-double text-blue-500 text-[10px] mr-1" title="既読"></i>';
                    } else if (iMyLastMsg && !lastMsgRead) {
                        readIcon = '<i class="fas fa-check text-gray-400 text-[10px] mr-1" title="送信済み"></i>';
                    }

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
                                        <p class="text-sm \${room.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'} truncate flex-1 mr-2">
                                            \${readIcon}\${lastMessage}
                                        </p>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>メッセージ - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
                    <div class="flex items-center gap-3">
                        <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                    <button onclick="window.location.href='/chat'" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    </div>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
                    timeZone: 'Asia/Tokyo',
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                // XSS対策
                const safeText = msg.message_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                const safeName = (msg.sender_name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                
                // 既読マーク（自分が送信したメッセージのみ）
                let readMark = '';
                if (isSent) {
                    if (msg.is_read) {
                        readMark = '<span class="inline-flex items-center ml-1" title="既読"><i class="fas fa-check-double text-blue-300"></i></span>';
                    } else {
                        readMark = '<span class="inline-flex items-center ml-1" title="送信済み"><i class="fas fa-check text-red-200"></i></span>';
                    }
                }

                return \`
                    <div class="flex \${isSent ? 'justify-end' : 'justify-start'}" data-msg-id="\${msg.id}">
                        <div class="message-bubble \${bubbleClass} rounded-2xl px-4 py-2">
                            \${!isSent ? \`<p class="text-xs text-gray-500 mb-1">\${safeName}</p>\` : ''}
                            <p class="\${isSent ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap">\${safeText}</p>
                            <p class="text-xs \${isSent ? 'text-red-100' : 'text-gray-400'} mt-1 text-right flex items-center justify-end gap-0.5">
                                \${timeStr}\${readMark}
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
                    var currentToken = localStorage.getItem('token');
                    if (!currentToken) return;
                    token = currentToken;
                    var res = await fetch('/api/chat/rooms/' + roomId + '/read', {
                        method: 'PUT',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (res.status === 401) {
                        console.warn('Chat markAsRead: token expired');
                    }
                    if (window.__notifBadge) window.__notifBadge.refresh();
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>マイページ - PARTS HUB（パーツハブ）</title>
        <meta name="robots" content="noindex, nofollow">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
                <div class="flex items-center gap-2">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                    <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center text-sm">
                        <i class="fas fa-arrow-left mr-1 sm:mr-2"></i>戻る
                    </button>
                </div>
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
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow" onclick="showTab('transactions')">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">進行中取引</div>
                    <div class="text-lg sm:text-2xl font-bold text-orange-500 flex items-baseline gap-1">
                        <span id="active-tx-count">0</span><span class="text-sm font-normal text-gray-500">件</span>
                    </div>
                    <div id="action-required-line" class="hidden text-xs text-red-500 font-semibold mt-0.5"><i class="fas fa-exclamation-circle mr-1"></i><span id="action-required-count">0</span>件 要対応</div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">売上合計</div>
                    <div class="text-lg sm:text-2xl font-bold text-gray-900">¥<span id="total-sales">0</span></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">振込可能額</div>
                    <div class="text-lg sm:text-2xl font-bold text-green-600">¥<span id="withdrawable">0</span></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div class="text-gray-600 text-xs sm:text-sm mb-1">売却済み / 購入</div>
                    <div class="text-lg sm:text-2xl font-bold text-gray-900"><span id="sold-count">0</span> / <span id="purchase-count">0</span></div>
                </div>
            </div>

            <!-- メニュータブ -->
            <div class="bg-white rounded-xl shadow-sm mb-6">
                <div class="flex border-b border-gray-200 overflow-x-auto scrollbar-hide" style="-webkit-overflow-scrolling: touch; -ms-overflow-style: none; scrollbar-width: none;">
                    <button onclick="showTab('transactions')" class="tab-btn flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-500 border-b-2 border-transparent whitespace-nowrap relative" data-tab="transactions">
                        <i class="fas fa-exchange-alt sm:mr-1"></i><span class="hidden sm:inline"> </span>取引<span id="tx-action-badge" class="hidden absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none"></span>
                    </button>
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

                <!-- 取引タブ -->
                <div id="tab-transactions" class="tab-content p-3 sm:p-6 hidden">
                    <!-- 要対応バナー -->
                    <div id="tx-action-required-banner" class="hidden bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 mb-4">
                        <div class="flex items-center gap-2 text-red-800 font-bold text-sm">
                            <i class="fas fa-exclamation-circle"></i>
                            <span id="tx-action-required-text">対応が必要な取引があります</span>
                        </div>
                    </div>
                    <!-- フィルター -->
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-base sm:text-lg font-bold text-gray-900">取引一覧</h3>
                        <select id="tx-filter" onchange="filterTransactions(this.value)" class="text-sm px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none">
                            <option value="all">すべて</option>
                            <option value="action">要対応</option>
                            <option value="pending">支払い待ち</option>
                            <option value="paid">発送待ち</option>
                            <option value="shipped">受取待ち</option>
                            <option value="completed">完了</option>
                        </select>
                    </div>
                    <div id="transactions-container" class="space-y-3">
                        <!-- JavaScriptで動的に生成 -->
                    </div>
                </div>

                <!-- 出品中タブ -->
                <div id="tab-listings" class="tab-content p-3 sm:p-6 hidden">
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
                            <h3 class="text-lg font-bold text-gray-900 mb-4">販売状況</h3>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/mypage.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>通知 - PARTS HUB（パーツハブ）</title>
        <meta name="robots" content="noindex, nofollow">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.location.href='/mypage'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
                <h1 class="text-red-500 font-bold text-lg">通知</h1>
                <button onclick="markAllAsRead()" class="text-sm text-blue-600 hover:underline">
                    すべて既読
                </button>
            </div>
        </header>

        <main class="max-w-6xl mx-auto px-4 py-6">
            <!-- フィルタータブ -->
            <div class="bg-white rounded-xl shadow-sm mb-6">
                <div class="flex border-b border-gray-200 overflow-x-auto" style="-webkit-overflow-scrolling:touch;scrollbar-width:none;">
                    <button onclick="filterNotifications('all')" class="filter-tab whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-red-500 border-b-2 border-red-500" data-filter="all">
                        すべて
                    </button>
                    <button onclick="filterNotifications('unread')" class="filter-tab whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="unread">
                        未読
                    </button>
                    <button onclick="filterNotifications('comment')" class="filter-tab whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="comment">
                        コメント
                    </button>
                    <button onclick="filterNotifications('negotiation')" class="filter-tab whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="negotiation">
                        値下げ交渉
                    </button>
                    <button onclick="filterNotifications('transaction')" class="filter-tab whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 border-b-2 border-transparent hover:text-red-500" data-filter="transaction">
                        取引
                    </button>
                </div>
                <style>.filter-tab::-webkit-scrollbar{display:none;}</style>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script src="${v('/static/notifications.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>プロフィール編集 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.location.href='/mypage'" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
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

            <!-- 退会セクション -->
            <div class="mt-8 mb-12 bg-white rounded-xl shadow-sm p-6 border border-red-100">
                <h2 class="text-base font-bold text-red-600 mb-2"><i class="fas fa-exclamation-triangle mr-1"></i>アカウント削除（退会）</h2>
                <p class="text-xs text-gray-500 mb-3">退会すると個人情報・出品商品が削除され、元に戻すことはできません。</p>
                <button onclick="showDeleteAccountModal()" class="bg-white border-2 border-red-300 text-red-500 hover:bg-red-50 hover:border-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    <i class="fas fa-user-slash mr-1"></i>退会する
                </button>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script src="${v('/static/bank-db.js')}"></script>
        <script src="${v('/static/profile-edit.js?v=20260328')}"></script>
    </body>
    </html>
  `)
})

// ===== 埋め込みウィジェット ドキュメント＆デモページ =====
app.get('/widget', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>埋め込みウィジェット - PARTS HUB（パーツハブ）</title>
    <meta name="description" content="PARTS HUBのパーツ検索ウィジェットを外部サイトに埋め込む方法。整備工場のWebサイトやブログに貼り付けて、パーツ検索機能を提供できます。">
    <link rel="canonical" href="https://parts-hub-tci.com/widget">
    <meta property="og:title" content="埋め込みウィジェット - PARTS HUB">
    <meta property="og:description" content="外部サイトにPARTS HUBのパーツ検索機能を埋め込むウィジェット">
    <meta property="og:url" content="https://parts-hub-tci.com/widget">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans JP', sans-serif; }
        code, .code-block { font-family: 'JetBrains Mono', monospace; }
        .code-block { background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 12px; overflow-x: auto; font-size: 13px; line-height: 1.7; position: relative; }
        .code-block .copy-btn { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.1); border: none; color: #94a3b8; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .code-block .copy-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .tag { color: #f472b6; }
        .attr { color: #67e8f9; }
        .val { color: #a5f3fc; }
        .str { color: #86efac; }
        .cmt { color: #64748b; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">トップ</span></a>
            <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            <div class="w-16"></div>
        </div>
    </header>

    <!-- ヒーロー -->
    <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12 sm:py-16">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <span class="inline-block px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full mb-4"><i class="fas fa-code mr-1"></i>EMBED WIDGET</span>
            <h1 class="text-2xl sm:text-3xl font-bold mb-3">埋め込みウィジェット</h1>
            <p class="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">あなたのWebサイトにPARTS HUBのパーツ検索機能を簡単に埋め込めます。<br>コピー&ペーストするだけで設置完了。</p>
        </div>
    </div>

    <main class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <!-- ステップ -->
        <div class="mb-12">
            <h2 class="text-lg font-bold text-gray-900 mb-6"><i class="fas fa-list-ol text-red-500 mr-2"></i>設置方法（3ステップ）</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3"><span class="text-red-500 font-bold">1</span></div>
                    <h3 class="font-bold text-gray-900 mb-1 text-sm">コードをコピー</h3>
                    <p class="text-xs text-gray-500">下記の埋め込みコードをコピーします</p>
                </div>
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3"><span class="text-red-500 font-bold">2</span></div>
                    <h3 class="font-bold text-gray-900 mb-1 text-sm">HTMLに貼り付け</h3>
                    <p class="text-xs text-gray-500">ウィジェットを表示したい場所に貼り付けます</p>
                </div>
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3"><span class="text-red-500 font-bold">3</span></div>
                    <h3 class="font-bold text-gray-900 mb-1 text-sm">完了！</h3>
                    <p class="text-xs text-gray-500">パーツ検索機能が自動的に表示されます</p>
                </div>
            </div>
        </div>

        <!-- 基本コード -->
        <div class="mb-10">
            <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fas fa-code text-red-500 mr-2"></i>基本の埋め込みコード</h2>
            <div class="code-block" id="code-basic">
                <button class="copy-btn" onclick="copyCode('code-basic')"><i class="far fa-copy mr-1"></i>コピー</button>
<span class="cmt">&lt;!-- PARTS HUB パーツ検索ウィジェット --&gt;</span>
<span class="tag">&lt;div</span> <span class="attr">id</span>=<span class="str">"parts-hub-widget"</span><span class="tag">&gt;&lt;/div&gt;</span>
<span class="tag">&lt;script</span> <span class="attr">src</span>=<span class="str">"https://parts-hub-tci.com/static/widget.js"</span><span class="tag">&gt;&lt;/script&gt;</span>
            </div>
        </div>

        <!-- カスタマイズオプション -->
        <div class="mb-10">
            <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fas fa-sliders-h text-red-500 mr-2"></i>カスタマイズオプション</h2>
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead><tr class="bg-gray-50 border-b"><th class="px-4 py-3 text-left font-semibold text-gray-700">属性</th><th class="px-4 py-3 text-left font-semibold text-gray-700">説明</th><th class="px-4 py-3 text-left font-semibold text-gray-700">デフォルト</th></tr></thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr><td class="px-4 py-3"><code class="text-red-500 text-xs bg-red-50 px-1.5 py-0.5 rounded">data-theme</code></td><td class="px-4 py-3 text-gray-600">テーマ（<code>light</code> / <code>dark</code>）</td><td class="px-4 py-3 text-gray-400">light</td></tr>
                        <tr><td class="px-4 py-3"><code class="text-red-500 text-xs bg-red-50 px-1.5 py-0.5 rounded">data-category</code></td><td class="px-4 py-3 text-gray-600">初期カテゴリ（all/engine/body/tools等）</td><td class="px-4 py-3 text-gray-400">all</td></tr>
                        <tr><td class="px-4 py-3"><code class="text-red-500 text-xs bg-red-50 px-1.5 py-0.5 rounded">data-compact</code></td><td class="px-4 py-3 text-gray-600">コンパクト表示（カテゴリ非表示）</td><td class="px-4 py-3 text-gray-400">false</td></tr>
                        <tr><td class="px-4 py-3"><code class="text-red-500 text-xs bg-red-50 px-1.5 py-0.5 rounded">data-max-results</code></td><td class="px-4 py-3 text-gray-600">最大表示件数</td><td class="px-4 py-3 text-gray-400">6</td></tr>
                        <tr><td class="px-4 py-3"><code class="text-red-500 text-xs bg-red-50 px-1.5 py-0.5 rounded">data-target</code></td><td class="px-4 py-3 text-gray-600">挿入先のHTML要素ID</td><td class="px-4 py-3 text-gray-400">parts-hub-widget</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ダークテーマコード -->
        <div class="mb-10">
            <h3 class="font-bold text-gray-900 mb-3 text-sm">ダークテーマの場合</h3>
            <div class="code-block" id="code-dark">
                <button class="copy-btn" onclick="copyCode('code-dark')"><i class="far fa-copy mr-1"></i>コピー</button>
<span class="tag">&lt;div</span> <span class="attr">id</span>=<span class="str">"parts-hub-widget"</span><span class="tag">&gt;&lt;/div&gt;</span>
<span class="tag">&lt;script</span> <span class="attr">src</span>=<span class="str">"https://parts-hub-tci.com/static/widget.js"</span>
  <span class="attr">data-theme</span>=<span class="str">"dark"</span>
  <span class="attr">data-max-results</span>=<span class="str">"4"</span><span class="tag">&gt;&lt;/script&gt;</span>
            </div>
        </div>

        <!-- ライブデモ -->
        <div class="mb-10">
            <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fas fa-eye text-red-500 mr-2"></i>ライブデモ</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="text-sm font-bold text-gray-700 mb-3">ライトテーマ</h3>
                    <div id="demo-light"></div>
                </div>
                <div class="bg-gray-900 rounded-xl p-4">
                    <h3 class="text-sm font-bold text-gray-300 mb-3">ダークテーマ</h3>
                    <div id="demo-dark"></div>
                </div>
            </div>
        </div>

        <!-- 利用規約 -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
            <h3 class="font-bold text-amber-800 mb-2 text-sm"><i class="fas fa-info-circle mr-1"></i>ご利用にあたって</h3>
            <ul class="text-xs text-amber-700 space-y-1">
                <li>・ウィジェットの利用は無料です</li>
                <li>・商用サイトでもご利用いただけます</li>
                <li>・ウィジェットのソースコードの改変は禁止です</li>
                <li>・「PARTS HUB」のクレジット表示を削除しないでください</li>
                <li>・大量のAPIリクエストが発生する場合は事前にご連絡ください</li>
            </ul>
        </div>
    </main>

    ${Footer()}

    <!-- ウィジェット読み込み（デモ用） -->
    <script>
    function copyCode(id) {
        var el = document.getElementById(id);
        var text = el.innerText.replace('コピー', '').trim();
        navigator.clipboard.writeText(text).then(function() {
            var btn = el.querySelector('.copy-btn');
            btn.innerHTML = '<i class="fas fa-check mr-1"></i>コピー済み';
            setTimeout(function() { btn.innerHTML = '<i class="far fa-copy mr-1"></i>コピー'; }, 2000);
        });
    }
    </script>
    <script src="${v('/static/widget.js')}" data-theme="light" data-target="demo-light" data-max-results="3"></script>
    <script src="${v('/static/widget.js')}" data-theme="dark" data-target="demo-dark" data-compact="true" data-max-results="3"></script>
</body>
</html>`)
})

// ===== 出品者公開プロフィール（レビュー一覧・バッジ付き） =====
app.get('/seller/:id', async (c) => {
  const sellerId = c.req.param('id')
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>出品者プロフィール - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBの出品者プロフィールとレビュー一覧です。取引実績やバッジ、評価を確認できます。">
        <meta name="robots" content="noindex">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Noto Sans JP', 'Inter', sans-serif; }
            .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            .sp-card { display: block; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; text-decoration: none; transition: all 0.2s; position: relative; }
            .sp-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
            .sp-card-img { aspect-ratio: 1; overflow: hidden; background: #f9fafb; }
            .sp-card-img img { width: 100%; height: 100%; object-fit: cover; }
            .sp-card-body { padding: 10px 12px; }
            .sp-card-title { font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
            .sp-card-price { font-size: 15px; font-weight: 800; color: #dc2626; margin-top: 4px; }
            .sp-sold-badge { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.75); color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="sticky top-0 z-50 bg-white shadow-sm">
            <div class="max-w-4xl mx-auto px-4 py-3 flex items-center">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="history.back()" class="mr-3 text-gray-600 hover:text-gray-900"><i class="fas fa-arrow-left"></i></button>
                </div>
                <h1 class="font-bold text-gray-900">出品者プロフィール</h1>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            <!-- プロフィールカード -->
            <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" id="seller-avatar">
                        <i class="fas fa-store text-gray-400 text-2xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center flex-wrap gap-2 mb-1">
                            <h2 id="seller-name" class="text-xl font-bold text-gray-900 truncate">読み込み中...</h2>
                            <span id="seller-badge" class="hidden"></span>
                        </div>
                        <div id="seller-type" class="text-sm text-gray-500 mb-2"></div>
                        <div class="flex items-center flex-wrap gap-3 text-sm">
                            <div class="flex items-center">
                                <div id="seller-stars" class="flex text-yellow-400 mr-1"></div>
                                <span id="seller-avg" class="font-bold text-gray-900">-</span>
                            </div>
                            <span class="text-gray-400">|</span>
                            <span class="text-gray-600"><i class="fas fa-comment-dots mr-1"></i><span id="review-total">0</span> レビュー</span>
                            <span class="text-gray-400">|</span>
                            <span class="text-gray-600"><i class="fas fa-handshake mr-1"></i><span id="tx-total">0</span> 取引</span>
                        </div>
                    </div>
                </div>

                <!-- バッジ進捗 -->
                <div id="badge-progress" class="hidden mt-4 p-3 bg-gray-50 rounded-xl">
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span id="badge-current-label">現在のバッジ</span>
                        <span id="badge-next-label">次のバッジまで</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="badge-progress-bar" class="h-2 rounded-full transition-all duration-500" style="width:0%"></div>
                    </div>
                </div>
            </div>

            <!-- 評価内訳 -->
            <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h3 class="font-bold text-gray-900 mb-4">評価内訳</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- 評価バー -->
                    <div>
                        <div id="rating-bars" class="space-y-2"></div>
                    </div>
                    <!-- 詳細評価 -->
                    <div id="detail-ratings" class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600"><i class="fas fa-box mr-2 text-blue-400"></i>商品状態</span>
                            <div class="flex items-center"><div class="w-24 bg-gray-100 rounded-full h-2 mr-2"><div id="bar-condition" class="bg-blue-400 h-2 rounded-full" style="width:0%"></div></div><span id="avg-condition" class="text-sm font-bold w-6 text-right">-</span></div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600"><i class="fas fa-comments mr-2 text-green-400"></i>コミュニケーション</span>
                            <div class="flex items-center"><div class="w-24 bg-gray-100 rounded-full h-2 mr-2"><div id="bar-communication" class="bg-green-400 h-2 rounded-full" style="width:0%"></div></div><span id="avg-communication" class="text-sm font-bold w-6 text-right">-</span></div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600"><i class="fas fa-truck mr-2 text-orange-400"></i>配送</span>
                            <div class="flex items-center"><div class="w-24 bg-gray-100 rounded-full h-2 mr-2"><div id="bar-shipping" class="bg-orange-400 h-2 rounded-full" style="width:0%"></div></div><span id="avg-shipping" class="text-sm font-bold w-6 text-right">-</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- タブ切り替え -->
            <div class="flex border-b border-gray-200 mb-6">
                <button onclick="switchSellerTab('products')" id="tab-products" class="seller-tab flex-1 py-3 text-center text-sm font-bold border-b-2 border-red-500 text-red-500 transition-colors">
                    <i class="fas fa-box mr-1.5"></i>出品商品 <span id="products-count-badge" class="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">-</span>
                </button>
                <button onclick="switchSellerTab('reviews')" id="tab-reviews" class="seller-tab flex-1 py-3 text-center text-sm font-bold border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-star mr-1.5"></i>レビュー <span id="reviews-count-badge" class="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">-</span>
                </button>
            </div>

            <!-- ===== 出品商品タブ ===== -->
            <div id="panel-products">
                <div id="seller-products-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div class="col-span-full text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="mt-2 text-sm">出品商品を読み込み中...</p></div>
                </div>
                <div id="load-more-products" class="hidden text-center mt-6">
                    <button onclick="loadMoreProducts()" class="px-6 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <i class="fas fa-chevron-down mr-1"></i>もっと見る
                    </button>
                </div>
            </div>

            <!-- ===== レビュータブ ===== -->
            <div id="panel-reviews" class="hidden">
                <!-- フィルター -->
                <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    <button onclick="filterReviews(0)" class="filter-btn active px-3 py-1.5 text-xs font-semibold rounded-full bg-red-500 text-white" data-rating="0">すべて</button>
                    <button onclick="filterReviews(5)" class="filter-btn px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200" data-rating="5"><i class="fas fa-star text-yellow-400 mr-0.5"></i>5</button>
                    <button onclick="filterReviews(4)" class="filter-btn px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200" data-rating="4"><i class="fas fa-star text-yellow-400 mr-0.5"></i>4</button>
                    <button onclick="filterReviews(3)" class="filter-btn px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200" data-rating="3"><i class="fas fa-star text-yellow-400 mr-0.5"></i>3</button>
                    <button onclick="filterReviews(2)" class="filter-btn px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200" data-rating="2"><i class="fas fa-star text-yellow-400 mr-0.5"></i>2</button>
                    <button onclick="filterReviews(1)" class="filter-btn px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200" data-rating="1"><i class="fas fa-star text-yellow-400 mr-0.5"></i>1</button>
                </div>

                <!-- レビュー一覧 -->
                <div id="reviews-list" class="space-y-4">
                    <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="mt-2 text-sm">レビューを読み込み中...</p></div>
                </div>

                <!-- もっと見る -->
                <div id="load-more" class="hidden text-center mt-6">
                    <button onclick="loadMoreReviews()" class="px-6 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <i class="fas fa-chevron-down mr-1"></i>もっと見る
                    </button>
                </div>
            </div>
        </main>

        ${Footer()}

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
        const SELLER_ID = '${sellerId}';
        let currentOffset = 0;
        let currentRatingFilter = 0;
        const LIMIT = 20;
        let productsLoaded = false;
        let productsOffset = 0;
        const PRODUCTS_LIMIT = 30;

        document.addEventListener('DOMContentLoaded', () => { loadSummary(); loadSellerProducts(); });

        async function loadSummary() {
            try {
                const res = await axios.get('/api/reviews/seller/' + SELLER_ID + '/summary');
                if (!res.data.success) return;
                const d = res.data.data;
                const b = d.badge;

                // 名前は別APIで取得
                try {
                    const uRes = await axios.get('/api/seller/' + SELLER_ID + '/profile');
                    if (uRes.data.success && uRes.data.seller) {
                        const s = uRes.data.seller;
                        document.getElementById('seller-name').textContent = s.nickname || s.company_name || s.name || '出品者 #' + SELLER_ID;
                        document.getElementById('seller-type').textContent = getShopTypeLabel(s.shop_type);
                        if (s.profile_image_url) {
                            const avatar = document.getElementById('seller-avatar');
                            avatar.innerHTML = '<img src="' + s.profile_image_url + '" alt="" class="w-full h-full object-cover">';
                        }
                    } else {
                        document.getElementById('seller-name').textContent = '出品者 #' + SELLER_ID;
                    }
                } catch(e) {
                    document.getElementById('seller-name').textContent = '出品者 #' + SELLER_ID;
                }

                // バッジ
                if (b && b.level !== 'new') {
                    const badge = document.getElementById('seller-badge');
                    badge.classList.remove('hidden');
                    badge.innerHTML = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style="background:' + b.bgColor + ';color:' + b.color + '"><i class="fas ' + b.icon + ' mr-1"></i>' + b.label + '</span>';
                }

                // バッジ進捗
                if (b && b.nextLevel) {
                    const prog = document.getElementById('badge-progress');
                    prog.classList.remove('hidden');
                    document.getElementById('badge-current-label').textContent = b.label;
                    document.getElementById('badge-next-label').textContent = b.nextLevel + 'まであと' + Math.max(0, b.nextThreshold - d.total_reviews) + '件';
                    const bar = document.getElementById('badge-progress-bar');
                    bar.style.width = b.progress + '%';
                    bar.style.background = b.color;
                }

                // 星
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= Math.floor(d.avg_rating)) starsHtml += '<i class="fas fa-star"></i>';
                    else if (i - d.avg_rating < 1 && i - d.avg_rating > 0) starsHtml += '<i class="fas fa-star-half-alt"></i>';
                    else starsHtml += '<i class="far fa-star text-gray-300"></i>';
                }
                document.getElementById('seller-stars').innerHTML = starsHtml;
                document.getElementById('seller-avg').textContent = d.avg_rating > 0 ? d.avg_rating.toFixed(1) : '-';
                document.getElementById('review-total').textContent = d.total_reviews;
                document.getElementById('tx-total').textContent = d.completed_transactions;

                // 評価バー
                const dist = d.distribution;
                const labels = [{s:5,c:dist.five},{s:4,c:dist.four},{s:3,c:dist.three},{s:2,c:dist.two},{s:1,c:dist.one}];
                document.getElementById('rating-bars').innerHTML = labels.map(function(item) {
                    const pct = d.total_reviews > 0 ? Math.round((item.c / d.total_reviews) * 100) : 0;
                    return '<div class="flex items-center gap-2"><span class="text-sm font-medium text-gray-500 w-4">' + item.s + '</span><div class="flex-1 bg-gray-100 rounded-full h-2.5"><div class="bg-yellow-400 h-full rounded-full" style="width:' + pct + '%"></div></div><span class="text-sm text-gray-400 w-8 text-right">' + item.c + '</span></div>';
                }).join('');

                // 詳細評価
                const da = d.detail_averages;
                ['condition','communication','shipping'].forEach(function(key) {
                    const val = da[key] || 0;
                    const bar = document.getElementById('bar-' + key);
                    const avg = document.getElementById('avg-' + key);
                    if (bar) bar.style.width = (val / 5 * 100) + '%';
                    if (avg) avg.textContent = val > 0 ? val.toFixed(1) : '-';
                });
            } catch(e) {
                console.error('Summary load error:', e);
            }
        }

        async function loadReviews() {
            try {
                let url = '/api/reviews/user/' + SELLER_ID + '/received?limit=' + LIMIT + '&offset=' + currentOffset;
                if (currentRatingFilter > 0) url += '&rating=' + currentRatingFilter;
                const res = await axios.get(url);
                const reviews = res.data.data || [];

                if (currentOffset === 0 && reviews.length === 0) {
                    document.getElementById('reviews-list').innerHTML = '<div class="text-center py-12 bg-white rounded-2xl"><i class="far fa-comment-dots text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">まだレビューはありません</p></div>';
                    document.getElementById('load-more').classList.add('hidden');
                    return;
                }

                const html = reviews.map(function(r) {
                    let stars = '';
                    for (let i = 1; i <= 5; i++) stars += i <= r.rating ? '<i class="fas fa-star text-yellow-400"></i>' : '<i class="far fa-star text-gray-300"></i>';
                    const date = new Date(r.created_at);
                    const dateStr = date.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'});
                    return '<div class="bg-white rounded-xl shadow-sm p-4 sm:p-5">' +
                        '<div class="flex items-start justify-between mb-2">' +
                        '<div class="flex items-center gap-2">' +
                        '<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><i class="fas fa-user text-gray-400 text-xs"></i></div>' +
                        '<div><div class="text-sm font-semibold text-gray-900">' + (r.reviewer_name || '匿名') + '</div><div class="flex items-center gap-1 text-xs">' + stars + '</div></div>' +
                        '</div>' +
                        '<span class="text-xs text-gray-400 flex-shrink-0">' + dateStr + '</span>' +
                        '</div>' +
                        (r.product_title ? '<div class="text-xs text-gray-400 mb-2 flex items-center"><i class="fas fa-box mr-1"></i>' + r.product_title + '</div>' : '') +
                        '<p class="text-sm text-gray-700 leading-relaxed">' + (r.comment || '') + '</p>' +
                        (r.product_condition_rating || r.communication_rating || r.shipping_rating ?
                            '<div class="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 border-t pt-2">' +
                            (r.product_condition_rating ? '<span><i class="fas fa-box text-blue-400 mr-1"></i>商品状態 ' + r.product_condition_rating + '</span>' : '') +
                            (r.communication_rating ? '<span><i class="fas fa-comments text-green-400 mr-1"></i>対応 ' + r.communication_rating + '</span>' : '') +
                            (r.shipping_rating ? '<span><i class="fas fa-truck text-orange-400 mr-1"></i>配送 ' + r.shipping_rating + '</span>' : '') +
                            '</div>' : '') +
                        '</div>';
                }).join('');

                if (currentOffset === 0) {
                    document.getElementById('reviews-list').innerHTML = html;
                } else {
                    document.getElementById('reviews-list').insertAdjacentHTML('beforeend', html);
                }

                document.getElementById('load-more').classList.toggle('hidden', reviews.length < LIMIT);
                currentOffset += reviews.length;
            } catch(e) {
                console.error('Reviews load error:', e);
                if (currentOffset === 0) {
                    document.getElementById('reviews-list').innerHTML = '<div class="text-center py-8 text-gray-400"><p>レビューの読み込みに失敗しました</p></div>';
                }
            }
        }

        function filterReviews(rating) {
            currentRatingFilter = rating;
            currentOffset = 0;
            document.querySelectorAll('.filter-btn').forEach(function(btn) {
                if (parseInt(btn.dataset.rating) === rating) {
                    btn.className = 'filter-btn active px-3 py-1.5 text-xs font-semibold rounded-full bg-red-500 text-white';
                } else {
                    btn.className = 'filter-btn px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200';
                }
            });
            loadReviews();
        }

        function loadMoreReviews() { loadReviews(); }

        // === 出品商品 ===
        async function loadSellerProducts() {
            try {
                const res = await axios.get('/api/products/search?seller_id=' + SELLER_ID + '&limit=' + PRODUCTS_LIMIT + '&offset=' + productsOffset);
                const products = (res.data.success ? res.data.products : []) || [];
                const grid = document.getElementById('seller-products-grid');

                // 件数バッジ更新
                if (productsOffset === 0) {
                    // 総件数を別途取得（上限なし）
                    try {
                        const cntRes = await axios.get('/api/products/search?seller_id=' + SELLER_ID + '&count_only=1');
                        const total = cntRes.data.total || products.length;
                        document.getElementById('products-count-badge').textContent = total;
                    } catch(e) {
                        document.getElementById('products-count-badge').textContent = products.length;
                    }
                }

                if (productsOffset === 0 && products.length === 0) {
                    grid.innerHTML = '<div class="col-span-full text-center py-12 bg-white rounded-2xl"><i class="fas fa-box-open text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">出品中の商品はありません</p></div>';
                    document.getElementById('load-more-products').classList.add('hidden');
                    return;
                }

                const condLabels = { new:'新品', like_new:'未使用に近い', good:'目立った傷や汚れなし', fair:'やや傷や汚れあり', poor:'傷や汚れあり', junk:'ジャンク品' };
                const html = products.map(function(p) {
                    const img = p.image_url || '/icons/icon.svg';
                    const taxPrice = Math.floor(p.price * 1.1).toLocaleString();
                    const condLabel = condLabels[p.condition] || p.condition || '';
                    const isSold = p.status === 'sold';
                    const shippingBadge = p.shipping_type === 'seller_paid'
                        ? '<span class="text-xs text-emerald-600 font-bold">送料込</span>'
                        : '<span class="text-xs text-blue-600 font-bold">着払い</span>';
                    const universalBadge = p.is_universal ? '<span class="inline-block bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1">汎用品</span>' : '';
                    return '<a href="/products/' + p.id + '" class="sp-card">' +
                        (isSold ? '<div class="sp-sold-badge">SOLD</div>' : '') +
                        '<div class="sp-card-img"><img src="' + img + '" alt="" loading="lazy" onerror="this.src=&quot;/icons/icon.svg&quot;"></div>' +
                        '<div class="sp-card-body">' +
                        '<div class="sp-card-title">' + (p.title || '').replace(/</g, '&lt;') + '</div>' +
                        universalBadge +
                        '<div class="sp-card-price">¥' + taxPrice + '<span class="text-[10px] text-gray-500 font-normal ml-0.5">税込</span></div>' +
                        '<div class="flex items-center justify-between mt-1">' +
                        '<span class="text-[10px] text-gray-400">' + condLabel + '</span>' +
                        shippingBadge +
                        '</div>' +
                        '</div></a>';
                }).join('');

                if (productsOffset === 0) {
                    grid.innerHTML = html;
                } else {
                    grid.insertAdjacentHTML('beforeend', html);
                }

                productsOffset += products.length;
                document.getElementById('load-more-products').classList.toggle('hidden', products.length < PRODUCTS_LIMIT);
                productsLoaded = true;
            } catch(e) {
                console.error('Products load error:', e);
                if (productsOffset === 0) {
                    document.getElementById('seller-products-grid').innerHTML = '<div class="col-span-full text-center py-8 text-gray-400"><p>商品の読み込みに失敗しました</p></div>';
                }
            }
        }

        function loadMoreProducts() { loadSellerProducts(); }

        // === タブ切り替え ===
        function switchSellerTab(tab) {
            const tabs = ['products', 'reviews'];
            tabs.forEach(function(t) {
                const btn = document.getElementById('tab-' + t);
                const panel = document.getElementById('panel-' + t);
                if (t === tab) {
                    btn.className = 'seller-tab flex-1 py-3 text-center text-sm font-bold border-b-2 border-red-500 text-red-500 transition-colors';
                    panel.classList.remove('hidden');
                } else {
                    btn.className = 'seller-tab flex-1 py-3 text-center text-sm font-bold border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition-colors';
                    panel.classList.add('hidden');
                }
            });
            // レビュータブ初回表示時にロード
            if (tab === 'reviews' && currentOffset === 0) { loadReviews(); }
        }

        function getShopTypeLabel(type) {
            const labels = { factory:'整備工場', dealer:'ディーラー', parts_shop:'パーツショップ', recycler:'リサイクルショップ', individual:'個人' };
            return labels[type] || type || '';
        }
        </script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>レビューを書く - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
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
                    <textarea id="comment" required rows="6" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none" placeholder="商品の状態、対応、配送などについてお書きください（5文字以上）"></textarea>
                    <p class="text-sm text-gray-600 mt-2"><span id="char-count">0</span> 文字（5文字以上）</p>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script src="${v('/static/reviews.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>取引詳細 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script src="${v('/static/transaction-detail.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>購入完了 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @keyframes checkmark { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
            @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
            .fade-in { animation: fadeIn 0.6s ease-out forwards; }
            .fade-in-delay { animation: fadeIn 0.6s ease-out 0.3s forwards; opacity:0; }
            .pulse-anim { animation: pulse 1.5s infinite; }
            .step-active { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
            .step-pending { background: #e5e7eb; color: #9ca3af; }
            .step-line-active { background: #22c55e; }
            .step-line-pending { background: #e5e7eb; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center">
                <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            </div>
        </header>
        <main class="max-w-2xl mx-auto px-4 py-8">
            <!-- 決済確認中の表示 -->
            <div id="verifying-section" class="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div class="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full mx-auto mb-4 pulse-anim" style="animation: spin 1s linear infinite;">
                </div>
                <h1 class="text-xl font-bold text-gray-800 mb-2">決済を確認しています...</h1>
                <p class="text-gray-500 text-sm">しばらくお待ちください</p>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </div>

            <!-- 決済完了後の表示 -->
            <div id="success-section" style="display:none;">
                <div class="bg-white rounded-2xl shadow-lg p-8 text-center fade-in">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check-circle text-5xl text-green-500"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800 mb-1">購入が完了しました！</h1>
                    <p class="text-gray-500 mb-6">ご購入ありがとうございます</p>

                    <!-- 取引情報 -->
                    <div id="transaction-info" class="bg-gray-50 rounded-xl p-5 mb-6 text-left">
                        <div class="space-y-3" id="tx-details"></div>
                    </div>

                    <!-- 進行ステップ -->
                    <div class="bg-blue-50 rounded-xl p-5 mb-6 text-left fade-in-delay">
                        <h3 class="font-bold text-sm text-blue-900 mb-4"><i class="fas fa-truck mr-1.5"></i>取引の流れ</h3>
                        <div class="flex items-start gap-3">
                            <div class="flex flex-col items-center">
                                <div class="w-8 h-8 rounded-full step-active flex items-center justify-center text-xs font-bold"><i class="fas fa-check"></i></div>
                                <div class="w-0.5 h-8 step-line-active mt-1"></div>
                            </div>
                            <div class="pt-1"><div class="font-semibold text-sm text-green-700">決済完了</div><div class="text-xs text-gray-500">お支払いが確認されました</div></div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="flex flex-col items-center">
                                <div class="w-8 h-8 rounded-full step-active flex items-center justify-center text-xs font-bold"><i class="fas fa-check"></i></div>
                                <div class="w-0.5 h-8 step-line-active mt-1"></div>
                            </div>
                            <div class="pt-1"><div class="font-semibold text-sm text-green-700">出品者に通知済み</div><div class="text-xs text-gray-500">メールとアプリ内通知を送信しました</div></div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="flex flex-col items-center">
                                <div class="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center text-xs font-bold pulse-anim"><i class="fas fa-box"></i></div>
                                <div class="w-0.5 h-8 step-line-pending mt-1"></div>
                            </div>
                            <div class="pt-1"><div class="font-semibold text-sm text-yellow-700">発送準備中</div><div class="text-xs text-gray-500">出品者が発送準備を進めています</div></div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="flex flex-col items-center">
                                <div class="w-8 h-8 rounded-full step-pending flex items-center justify-center text-xs font-bold">4</div>
                            </div>
                            <div class="pt-1"><div class="font-semibold text-sm text-gray-400">受取確認</div><div class="text-xs text-gray-400">商品到着後に確認してください</div></div>
                        </div>
                    </div>

                    <!-- アクションボタン -->
                    <div class="space-y-3 fade-in-delay">
                        <a href="/transactions/${transactionId}" 
                           class="block w-full px-6 py-3.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all text-center font-bold shadow-md">
                            <i class="fas fa-receipt mr-2"></i>取引詳細を見る
                        </a>
                        <a href="/mypage" 
                           class="block w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-center font-semibold">
                            <i class="fas fa-user mr-2"></i>マイページに戻る
                        </a>
                        <a href="/" 
                           class="block w-full px-6 py-2 text-gray-400 hover:text-gray-700 text-center text-sm">
                            トップページに戻る
                        </a>
                    </div>
                </div>
            </div>

            <!-- 決済エラー時の表示 -->
            <div id="error-section" style="display:none;">
                <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-circle text-5xl text-red-400"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">決済の確認に問題が発生しました</h1>
                    <p id="error-message" class="text-gray-500 mb-6"></p>
                    <div class="space-y-3">
                        <a href="/transactions/${transactionId}" 
                           class="block w-full px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all text-center font-semibold">
                            取引詳細を確認する
                        </a>
                        <a href="/mypage" class="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-center">
                            マイページに戻る
                        </a>
                    </div>
                </div>
            </div>
        </main>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script>
            (async function() {
                var token = localStorage.getItem('token');
                if (!token) {
                    showError('ログインセッションが見つかりません。マイページから取引を確認してください。');
                    return;
                }

                // URLからsession_idを取得
                var urlParams = new URLSearchParams(window.location.search);
                var sessionId = urlParams.get('session_id');

                try {
                    // 1. verify-session で決済を確認＆処理（フォールバック）
                    var verifyRes = await axios.post('/api/payment/verify-session', {
                        transaction_id: ${transactionId},
                        session_id: sessionId
                    }, {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });

                    if (verifyRes.data.success && (verifyRes.data.status === 'paid' || verifyRes.data.status === 'shipped' || verifyRes.data.status === 'completed')) {
                        // 決済確認成功
                        showSuccess();
                        
                        // 2. 取引詳細を表示
                        try {
                            var statusRes = await axios.get('/api/payment/transaction/${transactionId}/status', {
                                headers: { 'Authorization': 'Bearer ' + token }
                            });
                            if (statusRes.data.success) {
                                var tx = statusRes.data.transaction;
                                var statusLabel = {
                                    'paid': '<span class="text-green-600 font-bold">決済完了</span>',
                                    'shipped': '<span class="text-blue-600 font-bold">発送済み</span>',
                                    'completed': '<span class="text-purple-600 font-bold">取引完了</span>'
                                }[tx.status] || '<span class="text-gray-600">' + tx.status + '</span>';
                                
                                document.getElementById('tx-details').innerHTML = 
                                    '<div class="flex justify-between items-center py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">商品名</span><span class="font-bold text-gray-900">' + tx.product_title + '</span></div>' +
                                    '<div class="flex justify-between items-center py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">お支払い金額</span><span class="font-bold text-lg text-primary">¥' + Number(tx.amount).toLocaleString() + '</span></div>' +
                                    '<div class="flex justify-between items-center py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">出品者</span><span class="text-gray-900">' + tx.seller_name + '</span></div>' +
                                    '<div class="flex justify-between items-center py-2 border-b border-gray-100"><span class="text-gray-500 text-sm">注文番号</span><span class="font-mono text-gray-700">#' + tx.id + '</span></div>' +
                                    '<div class="flex justify-between items-center py-2"><span class="text-gray-500 text-sm">ステータス</span>' + statusLabel + '</div>';
                            }
                        } catch (e) { console.error('Failed to load tx details:', e); }
                    } else {
                        showError('決済がまだ完了していない可能性があります。しばらく経ってからマイページで確認してください。');
                    }
                } catch (e) {
                    console.error('Verify error:', e);
                    // verify-sessionが失敗しても、statusで確認してみる
                    try {
                        var fallback = await axios.get('/api/payment/transaction/${transactionId}/status', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        if (fallback.data.success && fallback.data.transaction.status === 'paid') {
                            showSuccess();
                        } else {
                            showError('決済の確認中にエラーが発生しました。マイページから取引状況をご確認ください。');
                        }
                    } catch (e2) {
                        showError('決済の確認中にエラーが発生しました。マイページから取引状況をご確認ください。');
                    }
                }

                function showSuccess() {
                    document.getElementById('verifying-section').style.display = 'none';
                    document.getElementById('success-section').style.display = '';
                }
                function showError(msg) {
                    document.getElementById('verifying-section').style.display = 'none';
                    document.getElementById('error-section').style.display = '';
                    document.getElementById('error-message').textContent = msg;
                }
            })();
        </script>
    </body>
    </html>
  `)
})

// 決済キャンセルページ
app.get('/transaction/:id/cancel', async (c) => {
  const transactionId = c.req.param('id')
  
  // キャンセル時に商品をactiveに戻す
  try {
    const tx = await c.env.DB.prepare(`
      SELECT product_id, status, stripe_session_id FROM transactions WHERE id = ?
    `).bind(transactionId).first()
    
    if (tx && tx.status === 'pending') {
      // ★ 安全チェック: Stripeセッションで支払い済みなら、キャンセルではなく完了処理をする
      let isPaid = false
      if (tx.stripe_session_id) {
        try {
          const Stripe = (await import('stripe')).default
          const stripe = new Stripe((c.env as any).STRIPE_SECRET_KEY)
          const session = await stripe.checkout.sessions.retrieve(tx.stripe_session_id as string)
          if (session.payment_status === 'paid') {
            isPaid = true
            console.log('Cancel page: Session actually paid! Redirecting to success page.')
          }
        } catch (stripeErr) {
          console.error('Cancel page: Stripe check failed:', stripeErr)
        }
      }

      if (isPaid) {
        // 支払い済み → 成功ページにリダイレクト
        return c.redirect(`/transaction/${transactionId}/success?session_id=${tx.stripe_session_id}`)
      }

      // 取引をキャンセルに
      await c.env.DB.prepare(`
        UPDATE transactions SET status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status = 'pending'
      `).bind(transactionId).run()
      
      // 商品をactiveに戻す（sold状態の場合のみ・他のpaid/pending取引がない場合）
      const otherActive = await c.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM transactions WHERE product_id = ? AND status IN ('pending', 'paid', 'shipped', 'completed') AND id != ?"
      ).bind(tx.product_id, transactionId).first()
      
      if (!otherActive || (otherActive.cnt as number) === 0) {
        await c.env.DB.prepare(
          "UPDATE products SET status = 'active', updated_at = datetime('now') WHERE id = ? AND status = 'sold'"
        ).bind(tx.product_id).run()
      }
      
      console.log('Cancel page: Transaction ' + transactionId + ' cancelled, product ' + tx.product_id + ' restored to active')
    }
  } catch (e) {
    console.error('Cancel page cleanup error:', e)
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>決済キャンセル - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        
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
                <p class="text-gray-600 mb-2">決済は完了していません。</p>
                <p class="text-gray-500 text-sm mb-6">商品は再度購入可能な状態に戻りました。</p>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>お問い合わせ - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBへのお問い合わせはこちら。サービスに関するご質問、代理出品のご依頼、不具合報告などお気軽にご連絡ください。">
        <link rel="canonical" href="https://parts-hub-tci.com/contact">
        ${hreflang("/contact")}
        <meta property="og:title" content="お問い合わせ - PARTS HUB">
        <meta property="og:description" content="PARTS HUBへのお問い合わせ。サービスに関するご質問、代理出品のご依頼などお気軽にどうぞ。">
        <meta property="og:url" content="https://parts-hub-tci.com/contact">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${BREADCRUMB_CSS}</style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
                <h1 class="text-red-500 font-bold text-lg">お問い合わせ</h1>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'お問い合わせ'}])}

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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>お気に入り - PARTS HUB（パーツハブ）</title>
        <meta name="robots" content="noindex, nofollow">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                    <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                        <i class="fas fa-arrow-left mr-2"></i>戻る
                    </button>
                </div>
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
                                    <img loading="lazy" src="\${item.image_url}" alt="\${item.title}" class="w-full aspect-square object-cover\${item.status === 'sold' ? ' opacity-60' : ''}">
                                    \${item.status === 'sold' ? '<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div style="background:rgba(220,38,38,0.85);transform:rotate(-20deg);padding:8px 36px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><span style="font-size:1.5rem;font-weight:900;color:#fff;letter-spacing:0.15em;text-shadow:1px 1px 2px rgba(0,0,0,0.3);">SOLD</span></div></div>' : ''}
                                </a>
                                <div class="p-3">
                                    <a href="/products/\${item.id}" class="block">
                                        <h3 class="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-red-500">\${item.title}</h3>
                                        <p class="text-lg font-bold text-red-500 mb-2">¥\${Math.floor(Number(item.price) * 1.1).toLocaleString()} <span class="text-xs font-normal text-gray-500">税込</span></p>
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

// 検索ページ（強化版）
app.get('/search', (c) => {
  const q = c.req.query('q') || ''
  const cat = c.req.query('category') || ''
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${cat ? cat + 'の検索結果' : '商品検索'} - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="自動車パーツ・純正部品・工具をキーワード・カテゴリ・車種から検索。全国の整備工場が出品する中古・新品パーツを簡単に見つけられます。">
        <link rel="canonical" href="https://parts-hub-tci.com/search">
        ${hreflang("/search")}
        <meta property="og:type" content="website">
        <meta property="og:title" content="自動車パーツ検索 - PARTS HUB">
        <meta property="og:description" content="純正部品・社外品・工具を全国の整備工場から検索。中古パーツも新品パーツも見つかる。">
        <meta property="og:url" content="https://parts-hub-tci.com/search">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="自動車パーツ検索 - PARTS HUB">
        <meta name="twitter:description" content="純正部品・社外品・工具を全国の整備工場から検索。中古パーツも新品パーツも見つかる。">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          "name": "自動車パーツ検索",
          "description": "自動車パーツ・純正部品・工具をキーワード・カテゴリ・車種から検索",
          "url": "https://parts-hub-tci.com/search",
          "isPartOf": { "@type": "WebSite", "name": "PARTS HUB", "url": "https://parts-hub-tci.com" }
        }
        </script>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            ${BREADCRUMB_CSS}
            /* 検索ページ専用スタイル */
            .cat-grid-item { transition: all 0.2s; cursor: pointer; border: 2px solid transparent; }
            .cat-grid-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #ef4444; }
            .cat-grid-item.active { border-color: #ef4444; background: #fef2f2; }
            .cat-grid-item.active .cat-icon { color: #ef4444; }
            .cat-grid-item.active .cat-name { color: #dc2626; font-weight: 700; }
            .cat-chip{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;border:2px solid #e5e7eb;background:#fff;color:#374151;cursor:pointer;transition:all .15s;flex-shrink:0}
            .cat-chip:hover{border-color:#ef4444;color:#ef4444;background:#fef2f2}
            .cat-chip.active{border-color:#ef4444;background:#ef4444;color:#fff}
            .cat-chip i{font-size:14px}
            .filter-tag{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;cursor:pointer}
            .filter-tag:hover{background:#fee2e2}
            .filter-tag .remove{font-size:14px;margin-left:2px;opacity:0.6}
            .filter-tag .remove:hover{opacity:1}
            .search-stats{font-size:12px;color:#6b7280;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
            .search-stats span{display:flex;align-items:center;gap:4px}
            .suggest-chip { display:inline-flex; align-items:center; gap:4px; padding:6px 14px; border-radius:999px; font-size:12px; background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8); cursor:pointer; transition:all 0.15s; border:1px solid rgba(255,255,255,0.2); }
            .suggest-chip:hover { background:rgba(255,255,255,0.2); color:#fff; border-color:rgba(255,255,255,0.4); }
            .product-card { transition: all 0.2s; }
            .product-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
            .view-toggle-btn { padding: 6px 10px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.15s; }
            .view-toggle-btn.active { background: #ef4444; color: #fff; border-color: #ef4444; }
            @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
            .fade-in { animation: fadeInUp 0.3s ease forwards; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- ヘッダー（TOPページと共通） -->
        <header class="bg-white shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center space-x-3">
                            <div class="w-10 h-10 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
                                  <defs>
                                    <linearGradient id="logoGradS" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" style="stop-color:#ff4757;stop-opacity:1" />
                                      <stop offset="100%" style="stop-color:#ff6b95;stop-opacity:1" />
                                    </linearGradient>
                                  </defs>
                                  <circle cx="50" cy="50" r="48" fill="url(#logoGradS)"/>
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
                    <nav class="hidden md:flex items-center space-x-6">
                        <a href="/" class="text-gray-700 hover:text-red-500 font-medium transition-colors">
                            <i class="fas fa-home mr-1"></i>ホーム
                        </a>
                        <a href="/search" class="text-red-500 font-medium transition-colors">
                            <i class="fas fa-search mr-1"></i>検索
                        </a>
                        <a href="/news" class="text-gray-700 hover:text-red-500 font-medium transition-colors">
                            <i class="fas fa-newspaper mr-1"></i>ニュース
                        </a>
                        <a href="/favorites" class="text-gray-700 hover:text-red-500 font-medium transition-colors">
                            <i class="far fa-heart mr-1"></i>お気に入り
                        </a>
                    </nav>
                    <div class="flex items-center space-x-3">
                        <div class="relative" id="header-lang-switcher">
                            <button onclick="toggleHeaderLang(event)" class="px-2 py-2 text-gray-500 hover:text-red-500 transition-all rounded-lg hover:bg-gray-100" title="Language">
                                <i class="fas fa-globe text-lg"></i>
                            </button>
                            <div id="header-lang-menu" class="hidden absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden">
                            </div>
                        </div>
                        <button onclick="window.location.href='/listing'" 
                                class="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-sm hover:shadow-md">
                            <i class="fas fa-plus mr-1"></i>
                            <span class="hidden sm:inline">出品する</span>
                        </button>
                        <div id="header-guest" class="flex items-center space-x-2">
                            <button onclick="window.location.href='/login'" 
                                    class="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-red-500 hover:text-red-500 transition-all">
                                <i class="fas fa-sign-in-alt mr-1"></i>
                                <span class="hidden sm:inline">ログイン</span>
                            </button>
                        </div>
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

        <!-- ============================================ -->
        <!-- ヒーローセクション（TOPページと同じ） -->
        <!-- ============================================ -->
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
                        <div class="w-20 h-20 mr-4 flex-shrink-0 drop-shadow-2xl" style="animation:float 6s ease-in-out infinite">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
                              <defs>
                                <linearGradient id="heroLogoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                                  <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.9" />
                                </linearGradient>
                              </defs>
                              <circle cx="50" cy="50" r="48" fill="none" stroke="url(#heroLogoGrad2)" stroke-width="2"/>
                              <g fill="url(#heroLogoGrad2)">
                                <rect x="47" y="5" width="6" height="15" rx="1"/>
                                <rect x="47" y="80" width="6" height="15" rx="1"/>
                                <rect x="5" y="47" width="15" height="6" rx="1"/>
                                <rect x="80" y="47" width="15" height="6" rx="1"/>
                                <rect x="72" y="18" width="15" height="6" rx="1" transform="rotate(45 79.5 21)"/>
                                <rect x="13" y="18" width="15" height="6" rx="1" transform="rotate(-45 20.5 21)"/>
                                <rect x="72" y="76" width="15" height="6" rx="1" transform="rotate(-45 79.5 79)"/>
                                <rect x="13" y="76" width="15" height="6" rx="1" transform="rotate(45 20.5 79)"/>
                              </g>
                              <circle cx="50" cy="50" r="22" fill="url(#heroLogoGrad2)"/>
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
                                       value="${q.replace(/"/g, '&quot;')}"
                                       class="w-full pl-11 sm:pl-14 pr-4 py-3 sm:py-4 rounded-xl border-0 bg-white text-gray-900 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl placeholder:text-gray-400">
                            </div>
                            <button onclick="performSearch()" 
                                    class="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-2xl hover:shadow-red-500/50 text-base sm:text-lg">
                                <i class="fas fa-search mr-2"></i>検索
                            </button>
                        </div>
                        <!-- 人気キーワード -->
                        <div class="mt-4 flex items-center justify-center gap-2 flex-wrap">
                            <span class="text-white/40 text-xs"><i class="fas fa-fire text-orange-400 mr-1"></i>人気:</span>
                            <button class="suggest-chip" onclick="quickSearch('LED ヘッドライト')">LED ヘッドライト</button>
                            <button class="suggest-chip" onclick="quickSearch('ブレーキパッド')">ブレーキパッド</button>
                            <button class="suggest-chip" onclick="quickSearch('オイルフィルター')">オイルフィルター</button>
                            <button class="suggest-chip" onclick="quickSearch('ワークランプ')">ワークランプ</button>
                            <button class="suggest-chip" onclick="quickSearch('SST')">SST</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'パーツ検索'}])}

        <!-- ============================================ -->
        <!-- カテゴリグリッド（常時表示・TOPとの差別化ポイント） -->
        <!-- ============================================ -->
        <section class="bg-white border-b border-gray-200 py-5">
            <div class="max-w-5xl mx-auto px-4">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-sm font-bold text-gray-800"><i class="fas fa-th-large text-red-500 mr-1.5"></i>カテゴリから探す</h2>
                    <button id="cat-expand-btn" onclick="toggleCategoryGrid()" class="text-xs text-gray-400 hover:text-red-500 transition-colors hidden sm:inline-flex items-center gap-1">
                        <span id="cat-expand-text">もっと見る</span>
                        <i id="cat-expand-icon" class="fas fa-chevron-down text-[10px]"></i>
                    </button>
                </div>
                <div id="category-grid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    <div class="cat-grid-item active rounded-xl p-2.5 text-center bg-white" data-cat="" onclick="selectCategoryGrid(this, '')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-th-large"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">すべて</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white" data-cat="エンジンパーツ" onclick="selectCategoryGrid(this, 'エンジンパーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-cog"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">エンジン</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white" data-cat="ブレーキパーツ" onclick="selectCategoryGrid(this, 'ブレーキパーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-circle-stop"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">ブレーキ</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white" data-cat="サスペンション" onclick="selectCategoryGrid(this, 'サスペンション')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-arrows-up-down"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">足回り</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white" data-cat="電装パーツ" onclick="selectCategoryGrid(this, '電装パーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-bolt"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">電装</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white" data-cat="外装パーツ" onclick="selectCategoryGrid(this, '外装パーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-car"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">外装</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white" data-cat="内装パーツ" onclick="selectCategoryGrid(this, '内装パーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-couch"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">内装</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white" data-cat="ホイール・タイヤ" onclick="selectCategoryGrid(this, 'ホイール・タイヤ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-tire"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">タイヤ</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="排気系パーツ" onclick="selectCategoryGrid(this, '排気系パーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-wind"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">排気系</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="駆動系パーツ" onclick="selectCategoryGrid(this, '駆動系パーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-gears"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">駆動系</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="冷却系パーツ" onclick="selectCategoryGrid(this, '冷却系パーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-temperature-low"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">冷却系</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="ボディパーツ" onclick="selectCategoryGrid(this, 'ボディパーツ')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-car-side"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">ボディ</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="工具" onclick="selectCategoryGrid(this, '工具')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-wrench"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">工具</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="SST（特殊工具）" onclick="selectCategoryGrid(this, 'SST（特殊工具）')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-screwdriver-wrench"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">SST</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="リビルト品" onclick="selectCategoryGrid(this, 'リビルト品')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-recycle"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">リビルト</div>
                    </div>
                    <div class="cat-grid-item rounded-xl p-2.5 text-center bg-white extra-cat" data-cat="設備" onclick="selectCategoryGrid(this, '設備')">
                        <div class="cat-icon text-xl mb-1 text-gray-500"><i class="fas fa-industry"></i></div>
                        <div class="cat-name text-[11px] text-gray-600 leading-tight">設備</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 車種フィルタバナー（動的挿入用） -->
        <div id="filter-panel" class="hidden bg-white border-b border-gray-200 shadow-lg" style="position:relative;z-index:40;">
            <div class="max-w-5xl mx-auto px-4 py-5 space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-gray-900"><i class="fas fa-sliders-h text-red-500 mr-2"></i>詳細フィルター</h3>
                    <button onclick="toggleFilter()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-lg"></i></button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1.5">価格帯</label>
                        <div class="flex gap-2 items-center">
                            <input type="number" id="price-min" placeholder="¥ 下限" class="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-red-500 focus:outline-none">
                            <span class="text-gray-400 text-sm">〜</span>
                            <input type="number" id="price-max" placeholder="¥ 上限" class="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-red-500 focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1.5">商品状態</label>
                        <select id="condition-select" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-red-500 focus:outline-none">
                            <option value="">すべて</option>
                            <option value="new">新品</option>
                            <option value="like_new">未使用に近い</option>
                            <option value="good">良好</option>
                            <option value="fair">やや傷あり</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1.5">送料</label>
                        <select id="shipping-select" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-red-500 focus:outline-none">
                            <option value="">すべて</option>
                            <option value="seller_paid">送料込み</option>
                            <option value="buyer_paid">着払い</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1.5">並び替え</label>
                        <select id="sort-select" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-red-500 focus:outline-none">
                            <option value="newest">新着順</option>
                            <option value="price_asc">価格が安い順</option>
                            <option value="price_desc">価格が高い順</option>
                            <option value="popular">人気順</option>
                        </select>
                    </div>
                </div>
                <!-- チェックボックスフィルター -->
                <div class="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
                    <label class="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" id="filter-universal" class="w-4 h-4 text-red-500 rounded border-gray-300">
                        <span><i class="fas fa-globe text-amber-500 mr-1"></i>汎用品のみ</span>
                    </label>
                    <label class="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" id="filter-active-only" checked class="w-4 h-4 text-red-500 rounded border-gray-300">
                        <span><i class="fas fa-shopping-cart text-green-500 mr-1"></i>購入可能のみ</span>
                    </label>
                </div>
                <div class="flex gap-2 pt-2">
                    <button onclick="applyFilters()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-bold text-sm transition-colors">
                        <i class="fas fa-search mr-1"></i>この条件で検索
                    </button>
                    <button onclick="clearFilters()" class="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                        クリア
                    </button>
                </div>
            </div>
        </div>

        <!-- 車種フィルタバナー（動的挿入用） -->
        <div id="vm-filter-banner-slot"></div>

        <!-- ============================================ -->
        <!-- メインコンテンツ -->
        <!-- ============================================ -->
        <main class="max-w-5xl mx-auto px-4 py-4">
            <!-- アクティブフィルタータグ -->
            <div id="active-filters" class="flex flex-wrap gap-2 mb-3" style="display:none;"></div>

            <!-- 検索結果ヘッダー -->
            <div id="result-header" class="hidden mb-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div class="flex items-center gap-3">
                        <p class="text-gray-700 text-sm font-semibold">
                            <i class="fas fa-box text-red-500 mr-1"></i>
                            <span id="result-count" class="text-red-500 text-lg font-bold">0</span> 件
                            <span id="result-label" class="text-gray-500 font-normal ml-1"></span>
                        </p>
                        <div class="search-stats">
                            <span id="stat-active"><i class="fas fa-circle text-green-400" style="font-size:8px;"></i> 販売中: <b id="count-active">0</b></span>
                            <span id="stat-sold"><i class="fas fa-circle text-gray-300" style="font-size:8px;"></i> 売切: <b id="count-sold">0</b></span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <!-- 表示切替・並び替え -->
                        <div class="flex gap-1">
                            <button class="view-toggle-btn active" id="view-grid" onclick="setView('grid')" title="グリッド表示">
                                <i class="fas fa-th text-xs"></i>
                            </button>
                            <button class="view-toggle-btn" id="view-list" onclick="setView('list')" title="リスト表示">
                                <i class="fas fa-list text-xs"></i>
                            </button>
                        </div>
                        <select id="inline-sort" onchange="changeSort(this.value)" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-red-400">
                            <option value="newest">新着順</option>
                            <option value="price_asc">安い順</option>
                            <option value="price_desc">高い順</option>
                            <option value="popular">人気順</option>
                        </select>
                        <button onclick="toggleFilter()" class="text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors">
                            <i class="fas fa-sliders-h mr-1"></i>絞込
                        </button>
                    </div>
                </div>
            </div>

            <!-- 商品グリッド -->
            <div id="products-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <!-- JavaScriptで動的に生成 -->
            </div>
            
            <!-- 初期状態（新着商品ローディング） -->
            <div id="initial-state" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-3xl text-gray-300 mb-3"></i>
                <p class="text-gray-400 text-sm">新着商品を読み込み中...</p>
            </div>
            
            <!-- ローディング -->
            <div id="loading" class="hidden text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-red-400 mb-4"></i>
                <p class="text-gray-500 text-sm">検索中...</p>
            </div>
            
            <!-- 空状態 -->
            <div id="empty-state" class="hidden text-center py-12">
                <div class="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
                    <i class="fas fa-search text-gray-300 text-5xl mb-4"></i>
                    <h2 class="text-lg font-bold text-gray-900 mb-2">商品が見つかりませんでした</h2>
                    <p class="text-gray-500 text-sm mb-4">別のキーワードやカテゴリで検索してみてください</p>
                    <button onclick="clearAllAndReload()" class="px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
                        <i class="fas fa-redo mr-1"></i>検索条件をリセット
                    </button>
                </div>
            </div>

            <!-- ============================================ -->
            <!-- 出品促進CTA（検索ページ独自） -->
            <!-- ============================================ -->
            <div id="listing-cta" class="hidden mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div class="flex flex-col sm:flex-row items-center gap-4">
                    <div class="flex-shrink-0 w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <i class="fas fa-plus-circle text-indigo-500 text-2xl"></i>
                    </div>
                    <div class="flex-1 text-center sm:text-left">
                        <h3 class="font-bold text-gray-900 mb-1">お探しのパーツが見つかりませんか？</h3>
                        <p class="text-gray-500 text-sm">お持ちのパーツを出品して他の整備工場とつながりましょう。出品手数料は無料です。</p>
                    </div>
                    <a href="/listing" class="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
                        <i class="fas fa-rocket mr-1.5"></i>無料で出品する
                    </a>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
        <script>
            // ヘッダー言語切替
            function toggleHeaderLang(e) {
                e.stopPropagation();
                var menu = document.getElementById('header-lang-menu');
                if (!menu) return;
                menu.classList.toggle('hidden');
            }
            (function() {
                var langs = [
                    { code: 'ja', flag: '\u{1F1EF}\u{1F1F5}', name: '\u65E5\u672C\u8A9E' },
                    { code: 'en', flag: '\u{1F1FA}\u{1F1F8}', name: 'English' },
                    { code: 'zh', flag: '\u{1F1E8}\u{1F1F3}', name: '\u4E2D\u6587' },
                    { code: 'ko', flag: '\u{1F1F0}\u{1F1F7}', name: '\uD55C\uAD6D\uC5B4' }
                ];
                var current = localStorage.getItem('parts_hub_lang') || 'ja';
                var menu = document.getElementById('header-lang-menu');
                if (!menu) return;
                menu.innerHTML = langs.map(function(l) {
                    return '<button data-lang="' + l.code + '" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 16px;border:none;background:' + (l.code === current ? '#fef2f2' : '#fff') + ';cursor:pointer;font-size:14px;color:#374151;text-align:left;">' + l.flag + ' ' + l.name + (l.code === current ? ' <span style="margin-left:auto;color:#ef4444;">\u2713</span>' : '') + '</button>';
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

            let searchTimeout;
            let currentCategory = '';
            let currentView = 'grid';
            const urlParams = new URLSearchParams(window.location.search);
            const vmMakerParam = urlParams.get('vm_maker') || '';
            const vmModelParam = urlParams.get('vm_model') || '';
            const initialKeyword = urlParams.get('q') || '';
            const initialCategory = urlParams.get('category') || '';

            // 初期化
            document.addEventListener('DOMContentLoaded', function() {
                // URLのカテゴリパラメータで初期選択
                if (initialCategory) {
                    currentCategory = initialCategory;
                    document.querySelectorAll('.cat-grid-item').forEach(c => {
                        c.classList.toggle('active', c.dataset.cat === initialCategory);
                    });
                }
                if (initialKeyword) {
                    document.getElementById('search-input').value = initialKeyword;
                }
                // 車種フィルタバナー
                if (vmMakerParam || vmModelParam) {
                    const slot = document.getElementById('vm-filter-banner-slot');
                    if (slot) {
                        slot.innerHTML = '<div style="background:linear-gradient(135deg,#fef2f2,#fff1f2);border-bottom:1px solid #fecaca;padding:8px 16px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;">'
                            + '<i class="fas fa-car text-red-400" style="font-size:12px;"></i>'
                            + '<span style="font-size:13px;font-weight:600;color:#991b1b;">' + (vmMakerParam || '') + ' ' + (vmModelParam || '') + ' の適合パーツを表示中</span>'
                            + '<a href="/search" style="font-size:11px;color:#6b7280;text-decoration:underline;margin-left:8px;">解除</a>'
                            + '</div>';
                    }
                }
                // 常に自動検索（新着表示 or 条件付き）
                performSearch();
                updateClearBtn();
            });

            // 検索入力のクリアボタン制御
            function updateClearBtn() {
                // clear button is optional (hero layout may not have it)
                var v = document.getElementById('search-input').value;
                var btn = document.getElementById('clear-search-btn');
                if (btn) btn.classList.toggle('hidden', !v);
            }
            function clearSearchInput() {
                document.getElementById('search-input').value = '';
                updateClearBtn();
                performSearch();
            }

            // 人気キーワード検索
            function quickSearch(keyword) {
                document.getElementById('search-input').value = keyword;
                updateClearBtn();
                performSearch();
                // 結果エリアまでスクロール
                document.getElementById('result-header').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // カテゴリグリッド選択
            function selectCategoryGrid(el, cat) {
                currentCategory = cat;
                document.querySelectorAll('.cat-grid-item').forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                performSearch();
            }
            // カテゴリグリッド展開
            var catExpanded = false;
            function toggleCategoryGrid() {
                catExpanded = !catExpanded;
                document.querySelectorAll('.extra-cat').forEach(function(el) {
                    el.style.display = catExpanded ? '' : '';
                });
                document.getElementById('cat-expand-text').textContent = catExpanded ? '閉じる' : 'もっと見る';
                document.getElementById('cat-expand-icon').classList.toggle('fa-chevron-up', catExpanded);
                document.getElementById('cat-expand-icon').classList.toggle('fa-chevron-down', !catExpanded);
            }

            // フィルターパネル切り替え
            function toggleFilter() {
                const panel = document.getElementById('filter-panel');
                panel.classList.toggle('hidden');
            }

            // 表示切替（グリッド/リスト）
            function setView(mode) {
                currentView = mode;
                document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
                document.getElementById('view-list').classList.toggle('active', mode === 'list');
                const grid = document.getElementById('products-grid');
                if (mode === 'list') {
                    grid.className = 'flex flex-col gap-3';
                } else {
                    grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4';
                }
                // 現在の検索結果を再レンダリング
                if (window._lastProducts) renderProducts(window._lastProducts);
            }

            // 並び替え変更
            function changeSort(val) {
                document.getElementById('sort-select').value = val;
                performSearch();
            }

            // アクティブフィルタータグ更新
            function updateActiveFilters() {
                const container = document.getElementById('active-filters');
                const tags = [];
                if (currentCategory) tags.push({label: currentCategory, clear: function() { selectCategoryGrid(document.querySelector('.cat-grid-item[data-cat=""]'), ''); }});
                const kw = document.getElementById('search-input').value.trim();
                if (kw) tags.push({label: '"' + kw + '"', clear: clearSearchInput});
                const cond = document.getElementById('condition-select');
                if (cond.value) tags.push({label: cond.options[cond.selectedIndex].text, clear: function() { cond.value = ''; performSearch(); }});
                const ship = document.getElementById('shipping-select');
                if (ship.value) tags.push({label: ship.value === 'seller_paid' ? '送料込み' : '着払い', clear: function() { ship.value = ''; performSearch(); }});
                if (document.getElementById('filter-universal').checked) tags.push({label: '汎用品', clear: function() { document.getElementById('filter-universal').checked = false; performSearch(); }});

                if (tags.length === 0) { container.style.display = 'none'; return; }
                container.style.display = 'flex';
                container.innerHTML = tags.map(function(t, i) { return '<span class="filter-tag" onclick="window._clearFilter' + i + '()">' + t.label + '<span class="remove">&times;</span></span>'; }).join('');
                tags.forEach(function(t, i) { window['_clearFilter' + i] = t.clear; });
            }

            // 商品カードレンダリング
            function renderProducts(products) {
                window._lastProducts = products;
                const grid = document.getElementById('products-grid');
                
                if (currentView === 'list') {
                    grid.innerHTML = products.map(function(product, idx) {
                        var priceInc = Math.ceil(Number(product.price) * 1.1);
                        var isSold = product.status === 'sold';
                        var condMap = {new:'新品',like_new:'未使用に近い',good:'良好',fair:'やや傷あり',poor:'状態悪い'};
                        var condLabel = condMap[product.condition] || '';
                        var condColor = product.condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
                        return '<a href="/products/' + product.id + '" class="product-card bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all flex group fade-in" style="animation-delay:' + (idx*30) + 'ms">'
                            + '<div class="relative w-28 sm:w-36 flex-shrink-0">'
                            + '<img loading="lazy" src="' + product.image_url + '" alt="' + (product.title||'').replace(/"/g,'&quot;') + '" class="w-full h-full object-cover' + (isSold ? ' opacity-50' : '') + '">'
                            + (isSold ? '<div class="absolute inset-0 flex items-center justify-center"><div style="background:rgba(220,38,38,0.85);transform:rotate(-15deg);padding:4px 16px;border-radius:4px;"><span style="font-size:0.8rem;font-weight:900;color:#fff;letter-spacing:0.1em;">SOLD</span></div></div>' : '')
                            + '</div>'
                            + '<div class="flex-1 p-3 flex flex-col justify-between">'
                            + '<div>'
                            + '<h3 class="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">' + (product.title||'') + '</h3>'
                            + '<div class="flex items-center gap-2 mb-1">'
                            + (condLabel ? '<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded ' + condColor + '">' + condLabel + '</span>' : '')
                            + (product.shipping_type === 'seller_paid' && !isSold ? '<span class="text-[10px] font-bold text-green-600"><i class="fas fa-truck text-[8px] mr-0.5"></i>送料込</span>' : '')
                            + (product.is_universal ? '<span class="text-[10px] font-bold text-amber-600"><i class="fas fa-globe text-[8px] mr-0.5"></i>汎用</span>' : '')
                            + '</div></div>'
                            + '<div class="flex items-center justify-between">'
                            + '<p class="text-base font-bold text-red-500">¥' + priceInc.toLocaleString() + ' <span class="text-[10px] font-normal text-gray-400">税込</span></p>'
                            + '<div class="flex items-center gap-2 text-[10px] text-gray-400">'
                            + '<span><i class="far fa-heart"></i> ' + (product.favorite_count||0) + '</span>'
                            + '<span><i class="far fa-comment"></i> ' + (product.comment_count||0) + '</span>'
                            + '</div></div></div></a>';
                    }).join('');
                } else {
                    grid.innerHTML = products.map(function(product, idx) {
                        var priceInc = Math.ceil(Number(product.price) * 1.1);
                        var isSold = product.status === 'sold';
                        var condMap = {new:'新品',like_new:'未使用に近い',good:'良好',fair:'やや傷あり',poor:'状態悪い'};
                        var condLabel = condMap[product.condition] || '';
                        var condColor = product.condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
                        return '<a href="/products/' + product.id + '" class="product-card bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all block group fade-in" style="animation-delay:' + (idx*30) + 'ms">'
                            + '<div class="relative">'
                            + '<img loading="lazy" src="' + product.image_url + '" alt="' + (product.title||'').replace(/"/g,'&quot;') + '" class="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform' + (isSold ? ' opacity-50' : '') + '">'
                            + (isSold ? '<div class="absolute inset-0 flex items-center justify-center"><div style="background:rgba(220,38,38,0.85);transform:rotate(-15deg);padding:6px 32px;border-radius:4px;"><span style="font-size:1.1rem;font-weight:900;color:#fff;letter-spacing:0.15em;">SOLD</span></div></div>' : '')
                            + (product.shipping_type === 'seller_paid' && !isSold ? '<span class="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">送料込</span>' : '')
                            + (product.is_universal ? '<span class="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">汎用</span>' : '')
                            + '</div>'
                            + '<div class="p-3">'
                            + '<h3 class="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 leading-tight">' + (product.title||'') + '</h3>'
                            + '<p class="text-base sm:text-lg font-bold text-red-500 mb-1">¥' + priceInc.toLocaleString() + ' <span class="text-[10px] font-normal text-gray-400">税込</span></p>'
                            + '<div class="flex items-center justify-between">'
                            + (condLabel ? '<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded ' + condColor + '">' + condLabel + '</span>' : '<span></span>')
                            + '<div class="flex items-center gap-2 text-[10px] text-gray-400">'
                            + '<span><i class="far fa-heart"></i> ' + (product.favorite_count||0) + '</span>'
                            + '<span><i class="far fa-comment"></i> ' + (product.comment_count||0) + '</span>'
                            + '</div></div></div></a>';
                    }).join('');
                }
            }
            
            // 検索実行
            async function performSearch() {
                const keyword = document.getElementById('search-input').value.trim();
                const sort = document.getElementById('sort-select').value;
                const priceMin = document.getElementById('price-min').value;
                const priceMax = document.getElementById('price-max').value;
                const condition = document.getElementById('condition-select').value;
                const shipping = document.getElementById('shipping-select').value;
                const universalOnly = document.getElementById('filter-universal').checked;
                const activeOnly = document.getElementById('filter-active-only').checked;
                
                // ローディング表示
                document.getElementById('initial-state').classList.add('hidden');
                document.getElementById('empty-state').classList.add('hidden');
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('result-header').classList.add('hidden');
                document.getElementById('listing-cta').classList.add('hidden');
                
                updateActiveFilters();
                // inline-sortの同期
                document.getElementById('inline-sort').value = sort;

                try {
                    const params = new URLSearchParams();
                    if (keyword) params.append('keyword', keyword);
                    if (sort) params.append('sort', sort);
                    if (priceMin) params.append('price_min', priceMin);
                    if (priceMax) params.append('price_max', priceMax);
                    if (vmMakerParam) params.append('vm_maker', vmMakerParam);
                    if (vmModelParam) params.append('vm_model', vmModelParam);
                    if (condition) params.append('condition', condition);
                    if (currentCategory) params.append('category', currentCategory);
                    if (shipping) params.append('shipping_type', shipping);
                    if (universalOnly) params.append('is_universal', '1');
                    if (activeOnly) params.append('status', 'active');
                    
                    const response = await axios.get('/api/products/search?' + params.toString());
                    
                    document.getElementById('loading').classList.add('hidden');
                    
                    if (response.data.success && response.data.products && response.data.products.length > 0) {
                        const products = response.data.products;
                        const activeCount = products.filter(function(p) { return p.status === 'active'; }).length;
                        const soldCount = products.filter(function(p) { return p.status === 'sold'; }).length;
                        
                        document.getElementById('result-count').textContent = products.length;
                        document.getElementById('count-active').textContent = activeCount;
                        document.getElementById('count-sold').textContent = soldCount;
                        document.getElementById('result-label').textContent = currentCategory ? '（' + currentCategory + '）' : keyword ? '「' + keyword + '」の検索結果' : '新着商品';
                        document.getElementById('result-header').classList.remove('hidden');
                        
                        renderProducts(products);
                        
                        // 出品CTAは結果が少ないときに表示
                        if (products.length <= 5) {
                            document.getElementById('listing-cta').classList.remove('hidden');
                        }
                    } else {
                        document.getElementById('empty-state').classList.remove('hidden');
                        document.getElementById('listing-cta').classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Search failed:', error);
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('empty-state').classList.remove('hidden');
                }
            }
            
            function applyFilters() {
                toggleFilter();
                performSearch();
            }
            
            function clearFilters() {
                document.getElementById('price-min').value = '';
                document.getElementById('price-max').value = '';
                document.getElementById('condition-select').value = '';
                document.getElementById('shipping-select').value = '';
                document.getElementById('filter-universal').checked = false;
                document.getElementById('filter-active-only').checked = true;
                performSearch();
            }

            function clearAllAndReload() {
                document.getElementById('search-input').value = '';
                currentCategory = '';
                document.querySelectorAll('.cat-grid-item').forEach(function(c) { c.classList.toggle('active', !c.dataset.cat); });
                clearFilters();
            }
            
            // 検索入力の監視（デバウンス）
            document.getElementById('search-input').addEventListener('input', function() {
                clearTimeout(searchTimeout);
                updateClearBtn();
                searchTimeout = setTimeout(performSearch, 400);
            });
            
            // Enterキーで即時検索
            document.getElementById('search-input').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { clearTimeout(searchTimeout); performSearch(); }
            });
            
            // ソート変更時
            document.getElementById('sort-select').addEventListener('change', performSearch);
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>プライバシーポリシー - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBのプライバシーポリシー。個人情報の取り扱い、利用目的、第三者提供、Cookie利用について定めています。">
        <link rel="canonical" href="https://parts-hub-tci.com/privacy">
        ${hreflang("/privacy")}
        <meta property="og:title" content="プライバシーポリシー - PARTS HUB">
        <meta property="og:url" content="https://parts-hub-tci.com/privacy">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${BREADCRUMB_CSS}</style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
                <h1 class="text-red-500 font-bold text-lg">プライバシーポリシー</h1>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'プライバシーポリシー'}])}

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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>利用規約 - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBの利用規約。サービス利用条件、禁止事項、手数料、取引ルール、免責事項について定めています。">
        <link rel="canonical" href="https://parts-hub-tci.com/terms">
        ${hreflang("/terms")}
        <meta property="og:title" content="利用規約 - PARTS HUB">
        <meta property="og:url" content="https://parts-hub-tci.com/terms">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${BREADCRUMB_CSS}</style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
                <h1 class="text-red-500 font-bold text-lg">利用規約</h1>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'利用規約'}])}

        <main class="max-w-4xl mx-auto px-4 py-8">
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
                        本サービスの利用には、以下の手数料が発生します（購入者のサービス手数料は無料です）：
                    </p>
                    <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>販売手数料（出品者負担）：</strong>商品価格（税抜）の10%</li>
                        <li><strong>カード決済手数料（購入者負担）：</strong>330円（税込）</li>
                        <li><strong>銀行振込手数料（購入者負担）：</strong>各金融機関の定める手数料</li>
                        <li><strong>出金振込手数料（出品者負担）：</strong>振込申請のたびに330円</li>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>パスワード再設定 - PARTS HUB（パーツハブ）</title>
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
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
        <script src="${v('/static/i18n-en.js')}"></script>
<script src="${v('/static/i18n-zh.js')}"></script>
<script src="${v('/static/i18n-ko.js')}"></script>
        <script src="${v('/static/i18n.js')}"></script>
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>セキュリティポリシー - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBのセキュリティポリシー。Stripe決済の安全性、SSL暗号化、データ保護、不正利用対策について説明しています。">
        <link rel="canonical" href="https://parts-hub-tci.com/security">
        ${hreflang("/security")}
        <meta property="og:title" content="セキュリティポリシー - PARTS HUB">
        <meta property="og:url" content="https://parts-hub-tci.com/security">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${BREADCRUMB_CSS}</style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
                <h1 class="text-red-500 font-bold text-lg">セキュリティポリシー</h1>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'セキュリティポリシー'}])}

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

// ========================================
// 地域別ランディングページ（/area/:prefecture）
// ========================================
const PREFECTURES: Record<string, { name: string; nameEn: string; region: string; shops: number; desc: string }> = {
  hokkaido: { name: '北海道', nameEn: 'Hokkaido', region: '北海道', shops: 5200, desc: '広大な面積を持つ北海道では、厳しい寒冷地仕様パーツの需要が高く、冬季タイヤやバッテリー、暖機系部品の取引が活発です。' },
  aomori: { name: '青森県', nameEn: 'Aomori', region: '東北', shops: 1180, desc: '積雪地域ならではの防錆パーツや4WD関連部品、融雪剤対策用アンダーコート資材の需要があります。' },
  iwate: { name: '岩手県', nameEn: 'Iwate', region: '東北', shops: 1150, desc: '県土の広さに伴う長距離走行車が多く、足回りやブレーキパーツの交換需要が安定しています。' },
  miyagi: { name: '宮城県', nameEn: 'Miyagi', region: '東北', shops: 1580, desc: '東北最大の都市仙台を擁し、乗用車からトラックまで幅広い車種のパーツ流通が見込めます。' },
  akita: { name: '秋田県', nameEn: 'Akita', region: '東北', shops: 880, desc: '豪雪地帯特有の冬季パーツ需要に加え、農業機械関連の整備工場も多い地域です。' },
  yamagata: { name: '山形県', nameEn: 'Yamagata', region: '東北', shops: 960, desc: 'さくらんぼ・米どころを支える物流車両の整備需要が高く、商用車パーツの流通が盛んです。' },
  fukushima: { name: '福島県', nameEn: 'Fukushima', region: '東北', shops: 1520, desc: '東北の南の玄関口として物流拠点が多く、トラック・商用車の整備工場が集積しています。' },
  ibaraki: { name: '茨城県', nameEn: 'Ibaraki', region: '関東', shops: 2180, desc: '自動車保有台数が全国上位で、日立・つくば周辺の工業地帯を中心に整備需要が高い地域です。' },
  tochigi: { name: '栃木県', nameEn: 'Tochigi', region: '関東', shops: 1520, desc: 'SUBARUやHONDAの工場が立地し、自動車産業が盛んな地域。テスト車両用パーツの需要もあります。' },
  gunma: { name: '群馬県', nameEn: 'Gunma', region: '関東', shops: 1620, desc: 'SUBARUの本拠地として知られ、自動車関連産業の集積度が高い県です。' },
  saitama: { name: '埼玉県', nameEn: 'Saitama', region: '関東', shops: 3800, desc: '首都圏のベッドタウンとして自動車保有台数が多く、乗用車の整備需要が非常に高い地域です。' },
  chiba: { name: '千葉県', nameEn: 'Chiba', region: '関東', shops: 3200, desc: '京葉工業地帯の物流を支える商用車と、住宅地の乗用車、双方の整備需要があります。' },
  tokyo: { name: '東京都', nameEn: 'Tokyo', region: '関東', shops: 4800, desc: '全国最大の自動車市場。高級車からハイブリッド・EVまで、先端技術パーツの需要が集中します。' },
  kanagawa: { name: '神奈川県', nameEn: 'Kanagawa', region: '関東', shops: 3600, desc: '日産自動車の本社所在地。横浜・川崎の工業地帯を中心に、多種多様なパーツ需要があります。' },
  niigata: { name: '新潟県', nameEn: 'Niigata', region: '中部', shops: 1800, desc: '日本有数の豪雪地帯で、スタッドレスタイヤや寒冷地仕様パーツの取引が年間を通じて活発です。' },
  toyama: { name: '富山県', nameEn: 'Toyama', region: '中部', shops: 820, desc: 'ものづくり県として精密部品の品質への意識が高く、純正パーツの需要が根強い地域です。' },
  ishikawa: { name: '石川県', nameEn: 'Ishikawa', region: '中部', shops: 880, desc: '金沢を中心に観光関連の送迎車両が多く、業務用車両のメンテナンスパーツの需要があります。' },
  fukui: { name: '福井県', nameEn: 'Fukui', region: '中部', shops: 620, desc: '繊維・眼鏡産業を支える物流車両の整備に加え、一家に一台以上の車社会でパーツ需要が安定しています。' },
  yamanashi: { name: '山梨県', nameEn: 'Yamanashi', region: '中部', shops: 680, desc: '山間部の走行が多く、ブレーキやサスペンション等の足回りパーツの消耗が早い地域特性があります。' },
  nagano: { name: '長野県', nameEn: 'Nagano', region: '中部', shops: 1720, desc: '標高差のある山岳地帯での走行が多く、エンジン・冷却系パーツへの需要が高い県です。' },
  gifu: { name: '岐阜県', nameEn: 'Gifu', region: '中部', shops: 1580, desc: '中京工業地帯の一角として、商用車から乗用車まで幅広い整備需要を持つ地域です。' },
  shizuoka: { name: '静岡県', nameEn: 'Shizuoka', region: '中部', shops: 2600, desc: 'SUZUKIやYAMAHAの本拠地。バイク・自動車の両面でパーツ市場が活発です。' },
  aichi: { name: '愛知県', nameEn: 'Aichi', region: '中部', shops: 4200, desc: 'トヨタ自動車のお膝元。日本最大の自動車産業集積地として、あらゆるパーツの流通量が群を抜きます。' },
  mie: { name: '三重県', nameEn: 'Mie', region: '近畿', shops: 1320, desc: 'HONDAの鈴鹿製作所を擁し、モータースポーツの聖地としてチューニングパーツの需要もあります。' },
  shiga: { name: '滋賀県', nameEn: 'Shiga', region: '近畿', shops: 920, desc: '京阪神のベッドタウンとして自動車通勤率が高く、消耗品パーツの回転が早い地域です。' },
  kyoto: { name: '京都府', nameEn: 'Kyoto', region: '近畿', shops: 1480, desc: '観光地特有のタクシー・バス向け業務用パーツと、一般乗用車の二面的な需要があります。' },
  osaka: { name: '大阪府', nameEn: 'Osaka', region: '近畿', shops: 3800, desc: '西日本最大の経済圏。ダイハツ本社を擁し、軽自動車から商用車まで幅広いパーツ市場を形成しています。' },
  hyogo: { name: '兵庫県', nameEn: 'Hyogo', region: '近畿', shops: 2800, desc: '神戸港を通じた輸入車パーツの流通に加え、播磨地域の工業地帯での商用車整備需要も高い県です。' },
  nara: { name: '奈良県', nameEn: 'Nara', region: '近畿', shops: 820, desc: '大阪への通勤車両が多く、日常的な消耗パーツ（オイルフィルター、ブレーキパッド等）の需要が安定しています。' },
  wakayama: { name: '和歌山県', nameEn: 'Wakayama', region: '近畿', shops: 720, desc: '南北に長い県土と山間部が多く、足回り・駆動系パーツの需要が恒常的に高い地域です。' },
  tottori: { name: '鳥取県', nameEn: 'Tottori', region: '中国', shops: 480, desc: '日本で最も人口の少ない県ですが、車社会のため一人当たりの自動車保有率は高い地域です。' },
  shimane: { name: '島根県', nameEn: 'Shimane', region: '中国', shops: 560, desc: '中山間地域が多く、軽トラック・四駆車の整備需要が特に高い特徴があります。' },
  okayama: { name: '岡山県', nameEn: 'Okayama', region: '中国', shops: 1420, desc: '三菱自動車の工場があり、中国・四国地方の物流ハブとして商用車パーツの取引が盛んです。' },
  hiroshima: { name: '広島県', nameEn: 'Hiroshima', region: '中国', shops: 1820, desc: 'MAZDAの本社所在地。マツダ車の純正・社外パーツの流通量が特に多い地域です。' },
  yamaguchi: { name: '山口県', nameEn: 'Yamaguchi', region: '中国', shops: 1080, desc: '化学工業地帯を支える特殊車両の整備に加え、九州との結節点として物流車両の通過需要もあります。' },
  tokushima: { name: '徳島県', nameEn: 'Tokushima', region: '四国', shops: 580, desc: '四国の東の玄関口として、京阪神との物流を担う商用車の整備拠点が集まっています。' },
  kagawa: { name: '香川県', nameEn: 'Kagawa', region: '四国', shops: 720, desc: '面積最小の県ながら自動車密度が高く、都市部のコンパクトカー・軽自動車のパーツ需要が中心です。' },
  ehime: { name: '愛媛県', nameEn: 'Ehime', region: '四国', shops: 1020, desc: '造船・タオル産業を支える物流網があり、トラック整備を中心としたパーツ需要が安定しています。' },
  kochi: { name: '高知県', nameEn: 'Kochi', region: '四国', shops: 540, desc: '東西に長い県土で走行距離が伸びやすく、エンジン・排気系パーツの交換頻度が高い傾向にあります。' },
  fukuoka: { name: '福岡県', nameEn: 'Fukuoka', region: '九州', shops: 3200, desc: '九州最大の経済圏。日産・トヨタの工場も立地し、西日本有数のパーツ市場を形成しています。' },
  saga: { name: '佐賀県', nameEn: 'Saga', region: '九州', shops: 620, desc: '農業県として軽トラック・農業機械の整備需要が高く、実用車向けパーツの取引が多い地域です。' },
  nagasaki: { name: '長崎県', nameEn: 'Nagasaki', region: '九州', shops: 920, desc: '離島を多く抱え、船舶輸送コストからパーツの効率的な調達手段としてオンライン取引の意義が大きい県です。' },
  kumamoto: { name: '熊本県', nameEn: 'Kumamoto', region: '九州', shops: 1280, desc: 'HONDAの工場が立地。半導体産業の成長に伴い物流車両も増加し、整備需要が拡大中です。' },
  oita: { name: '大分県', nameEn: 'Oita', region: '九州', shops: 880, desc: 'ダイハツの工場があり、軽自動車関連パーツの流通が活発な地域です。' },
  miyazaki: { name: '宮崎県', nameEn: 'Miyazaki', region: '九州', shops: 820, desc: '農畜産業を支える商用車の整備に加え、温暖な気候で錆が少なく良質な中古パーツが出回る地域です。' },
  kagoshima: { name: '鹿児島県', nameEn: 'Kagoshima', region: '九州', shops: 1220, desc: '火山灰対策としてエアフィルターやワイパー等の消耗品需要が特徴的な地域です。' },
  okinawa: { name: '沖縄県', nameEn: 'Okinawa', region: '沖縄', shops: 780, desc: '塩害によるボディ・下回り腐食が深刻で、防錆パーツや外装部品の需要が非常に高い地域です。' }
}

const REGION_LIST = ['北海道','東北','関東','中部','近畿','中国','四国','九州','沖縄']

// 地域一覧ページ
app.get('/area', (c) => {
  const regionGroups: Record<string, { slug: string; name: string }[]> = {}
  for (const r of REGION_LIST) { regionGroups[r] = [] }
  for (const [slug, data] of Object.entries(PREFECTURES)) {
    if (regionGroups[data.region]) {
      regionGroups[data.region].push({ slug, name: data.name })
    }
  }

  let regionCards = ''
  for (const region of REGION_LIST) {
    const prefs = regionGroups[region]
    let prefLinks = ''
    for (const p of prefs) {
      prefLinks += '<a href="/area/' + p.slug + '" class="area-chip">' + p.name + '</a>'
    }
    regionCards += '<div class="region-card"><h3 class="region-title">' + region + '</h3><div class="pref-grid">' + prefLinks + '</div></div>'
  }

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>エリアから探す - PARTS HUB（パーツハブ）</title>
    <meta name="description" content="PARTS HUBは全国47都道府県の整備工場をつなぐパーツ売買プラットフォームです。お近くのエリアの出品状況をご覧ください。">
    <link rel="canonical" href="https://parts-hub-tci.com/area">
        ${hreflang("/area")}
    <meta property="og:title" content="エリアから探す - PARTS HUB">
    <meta property="og:description" content="全国47都道府県の整備工場をつなぐパーツ売買プラットフォーム">
    <meta property="og:url" content="https://parts-hub-tci.com/area">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Noto Sans JP', sans-serif; }
      .region-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; }
      .region-title { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #fee2e2; }
      .pref-grid { display: flex; flex-wrap: wrap; gap: 6px; }
      .area-chip { display: inline-block; padding: 7px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; color: #374151; font-size: 13px; font-weight: 500; text-decoration: none; transition: all 0.15s; }
      .area-chip:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
      @media (min-width: 640px) {
        .region-card { padding: 24px; }
        .region-title { font-size: 15px; margin-bottom: 14px; padding-bottom: 10px; }
        .pref-grid { gap: 8px; }
        .area-chip { padding: 8px 16px; font-size: 14px; }
      }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">トップ</span></a>
            <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            <div class="w-16"></div>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'エリアから探す'}])}
    <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-10 sm:py-14 lg:py-16">
        <div class="max-w-6xl mx-auto px-4 text-center">
            <p class="text-red-400 text-xs sm:text-sm font-semibold tracking-wider mb-2 sm:mb-3">AREA NETWORK</p>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">エリアから探す</h1>
            <p class="text-slate-400 text-xs sm:text-sm lg:text-base max-w-xl mx-auto px-2">全国47都道府県の整備工場をつなぐネットワーク。お近くのエリアを選んで、地域の出品状況をご確認ください。</p>
        </div>
    </div>
    <main class="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 lg:py-12">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            ${regionCards}
        </div>
    </main>
    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
})

// 都道府県別ランディングページ
app.get('/area/:pref', async (c) => {
  const prefSlug = c.req.param('pref')
  const pref = PREFECTURES[prefSlug]
  if (!pref) return c.redirect('/area', 302)

  const { DB } = c.env as any
  let productsHtml = ''
  let productsCount = 0
  let categoriesHtml = ''

  try {
    // 最新の出品商品を取得（該当エリア + 全国対応の商品）
    const prods = await DB.prepare(
      "SELECT p.id, p.title, p.price, p.condition, p.status, p.shipping_type, p.is_universal, (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as image_url FROM products p WHERE p.status = 'active' AND (p.prefecture = ? OR p.prefecture = 'all') ORDER BY p.created_at DESC LIMIT 8"
    ).bind(prefSlug).all()
    productsCount = prods.results.length
    const condMap: Record<string,string> = { new:'新品', like_new:'未使用に近い', good:'良好', fair:'やや傷あり', poor:'状態不良' }
    productsHtml = prods.results.map((p: any) => {
      const priceTaxIncluded = Math.floor(Number(p.price || 0) * 1.1).toLocaleString()
      const cond = condMap[p.condition] || p.condition || '中古'
      const safeTitle = String(p.title || '').replace(/</g, '&lt;')
      const imgUrl = p.image_url ? '/r2/' + p.image_url : '/icons/icon.svg'
      const shippingBadge = p.shipping_type === 'seller_paid'
        ? '<span style="font-size:9px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:4px;font-weight:600;">送料込</span>'
        : '<span style="font-size:9px;background:#dbeafe;color:#1d4ed8;padding:1px 5px;border-radius:4px;font-weight:600;">着払い</span>'
      return '<a href="/products/' + p.id + '" class="product-card">' +
        '<div class="product-img-wrap"><img src="' + imgUrl + '" alt="' + safeTitle + '" class="product-img" loading="lazy"></div>' +
        '<div class="product-info">' +
        '<p class="product-title">' + safeTitle + '</p>' +
        '<p class="product-price">&yen;' + priceTaxIncluded + '<span class="product-tax-label" style="font-size:10px;font-weight:400;color:#6b7280;margin-left:2px;">税込</span><span class="product-cond">' + cond + '</span></p>' +
        '<div style="margin-top:4px;">' + shippingBadge + '</div>' +
        '</div></a>'
    }).join('')

    // カテゴリ取得
    const cats = await DB.prepare('SELECT id, name FROM categories ORDER BY id').all()
    categoriesHtml = cats.results.map((cat: any) =>
      '<a href="/search?category=' + encodeURIComponent(cat.name) + '" class="cat-tag">' + cat.name + '</a>'
    ).join('')
  } catch(e) { console.error('Area LP error:', e) }

  // 近隣の都道府県
  const sameRegion = Object.entries(PREFECTURES)
    .filter(([slug, d]) => d.region === pref.region && slug !== prefSlug)
    .map(([slug, d]) => '<a href="/area/' + slug + '" class="nearby-link">' + d.name + '</a>')
    .join('')

  const totalShops = Object.values(PREFECTURES).reduce((s, p) => s + p.shops, 0)

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pref.name}の整備工場向けパーツ売買 - PARTS HUB（パーツハブ）</title>
    <meta name="description" content="${pref.name}の整備工場の皆様へ。PARTS HUBは余剰パーツ・工具・SSTを全国の整備工場同士で売買できるプラットフォームです。${pref.desc}">
    <link rel="canonical" href="https://parts-hub-tci.com/area/${prefSlug}">
    ${hreflang("/area/" + prefSlug)}
    <meta property="og:type" content="website">
    <meta property="og:title" content="${pref.name}の整備工場向けパーツ売買 - PARTS HUB">
    <meta property="og:description" content="${pref.name}の整備工場の皆様へ。余剰パーツを全国の整備工場と売買。登録無料・Stripe安全決済。">
    <meta property="og:url" content="https://parts-hub-tci.com/area/${prefSlug}">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta property="og:locale" content="ja_JP">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${pref.name}の整備工場向けパーツ売買 - PARTS HUB">
    <meta name="twitter:description" content="${pref.name}の整備工場の皆様へ。余剰パーツを全国の整備工場と売買。">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": pref.name + "の整備工場向けパーツ売買 - PARTS HUB",
      "description": pref.name + "の整備工場の皆様へ。PARTS HUBは余剰パーツを全国の整備工場同士で売買できるプラットフォームです。",
      "url": "https://parts-hub-tci.com/area/" + prefSlug,
      "isPartOf": { "@type": "WebSite", "name": "PARTS HUB", "url": "https://parts-hub-tci.com/" },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": "エリア", "item": "https://parts-hub-tci.com/area" },
          { "@type": "ListItem", "position": 3, "name": pref.name }
        ]
      }
    })}</script>
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Noto Sans JP', sans-serif; }
      .hero-area { background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%); }
      .stat-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 10px; text-align: center; }
      .stat-number { font-size: 20px; font-weight: 900; background: linear-gradient(135deg, #f87171, #fb923c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; white-space: nowrap; }
      .stat-label { font-size: 10px; color: #94a3b8; margin-top: 4px; line-height: 1.4; }
      @media (min-width: 400px) {
        .stat-card { padding: 16px 12px; }
        .stat-number { font-size: 24px; }
        .stat-label { font-size: 11px; }
      }
      @media (min-width: 640px) {
        .stat-card { padding: 20px; }
        .stat-number { font-size: 30px; }
        .stat-label { font-size: 12px; }
      }
      .section-heading { font-size: 17px; font-weight: 700; color: #1f2937; position: relative; padding-left: 14px; }
      .section-heading::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 3px; background: linear-gradient(180deg, #ef4444, #f97316); border-radius: 2px; }
      @media (min-width: 640px) { .section-heading { font-size: 20px; padding-left: 16px; } .section-heading::before { width: 4px; } }
      .product-card { display: block; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; text-decoration: none; transition: all 0.2s; }
      .product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
      .product-img-wrap { aspect-ratio: 1; overflow: hidden; background: #f9fafb; }
      .product-img { width: 100%; height: 100%; object-fit: cover; }
      .product-info { padding: 10px; }
      .product-title { font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
      .product-price { font-size: 14px; font-weight: 800; color: #dc2626; margin-top: 4px; }
      .product-cond { font-size: 10px; font-weight: 400; color: #9ca3af; margin-left: 6px; }
      @media (min-width: 640px) {
        .product-card { border-radius: 12px; }
        .product-info { padding: 12px; }
        .product-title { font-size: 13px; min-height: 36px; }
        .product-price { font-size: 16px; margin-top: 6px; }
        .product-cond { font-size: 11px; margin-left: 8px; }
      }
      .feature-card { background: white; border-radius: 12px; padding: 20px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; }
      .feature-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 12px; }
      @media (min-width: 640px) {
        .feature-card { padding: 28px 24px; }
        .feature-icon { width: 48px; height: 48px; border-radius: 12px; font-size: 20px; margin-bottom: 16px; }
      }
      .cat-tag { display: inline-block; padding: 5px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; color: #374151; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.15s; margin: 2px; }
      .cat-tag:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
      .nearby-link { display: inline-block; padding: 7px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; color: #374151; font-size: 13px; font-weight: 500; text-decoration: none; transition: all 0.15s; margin: 2px; }
      .nearby-link:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
      @media (min-width: 640px) {
        .cat-tag { padding: 6px 14px; font-size: 13px; margin: 3px; }
        .nearby-link { padding: 8px 16px; font-size: 14px; margin: 3px; }
      }
      .step-line { position: relative; padding-left: 44px; }
      .step-line::before { content: ''; position: absolute; left: 15px; top: 36px; bottom: -20px; width: 2px; background: #e5e7eb; }
      .step-line:last-child::before { display: none; }
      .step-num { position: absolute; left: 0; top: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; }
      @media (min-width: 640px) {
        .step-line { padding-left: 48px; }
        .step-line::before { left: 19px; top: 40px; }
        .step-num { width: 40px; height: 40px; font-size: 14px; }
      }
      .cta-section { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- ヘッダー -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/area" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">エリア一覧</span></a>
            <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            <a href="/register" class="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg transition-colors">無料登録</a>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'エリア',url:'/area'},{name:pref.name}])}

    <!-- ヒーロー -->
    <section class="hero-area text-white py-10 sm:py-16 lg:py-20">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-8 sm:mb-10">
                <div class="inline-block px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full tracking-wider mb-3 sm:mb-4">${pref.region} / ${pref.name}</div>
                <h1 class="text-xl sm:text-2xl lg:text-4xl font-bold leading-tight mb-3 sm:mb-4">${pref.name}の整備工場の皆様へ</h1>
                <p class="text-slate-400 text-xs sm:text-sm lg:text-base max-w-2xl mx-auto leading-relaxed px-2">${pref.desc}</p>
            </div>
            <div class="grid grid-cols-3 gap-2 sm:gap-4 max-w-md sm:max-w-lg mx-auto">
                <div class="stat-card">
                    <div class="stat-number">${pref.shops.toLocaleString()}</div>
                    <div class="stat-label">${pref.name}の<br class="sm:hidden">整備工場数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalShops.toLocaleString()}</div>
                    <div class="stat-label">全国の<br class="sm:hidden">整備工場数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">0%</div>
                    <div class="stat-label">出品手数料</div>
                </div>
            </div>
        </div>
    </section>

    <main class="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-14">

        <!-- PARTS HUBの特長 -->
        <section class="mb-10 sm:mb-14">
            <h2 class="section-heading mb-6 sm:mb-8">PARTS HUBが選ばれる理由</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                <div class="feature-card">
                    <div class="feature-icon bg-red-50 text-red-500"><i class="fas fa-yen-sign"></i></div>
                    <h3 class="font-bold text-gray-900 mb-2">出品無料・低手数料</h3>
                    <p class="text-sm text-gray-500 leading-relaxed">出品は完全無料。売れた時だけ販売価格の10%が手数料として発生します。購入者のサービス手数料はかかりません。</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon bg-blue-50 text-blue-500"><i class="fas fa-shield-alt"></i></div>
                    <h3 class="font-bold text-gray-900 mb-2">Stripe安全決済</h3>
                    <p class="text-sm text-gray-500 leading-relaxed">クレジットカード決済をStripeが仲介。取引完了まで売上金をエスクロー保護します。</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon bg-emerald-50 text-emerald-500"><i class="fas fa-truck"></i></div>
                    <h3 class="font-bold text-gray-900 mb-2">配送追跡対応</h3>
                    <p class="text-sm text-gray-500 leading-relaxed">ヤマト運輸・佐川急便・日本郵便・西濃運輸・福山通運に対応。追跡番号で状況確認。</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon bg-amber-50 text-amber-500"><i class="fas fa-comments"></i></div>
                    <h3 class="font-bold text-gray-900 mb-2">チャット機能</h3>
                    <p class="text-sm text-gray-500 leading-relaxed">購入前に出品者へ直接質問が可能。適合確認や価格交渉がスムーズに行えます。</p>
                </div>
            </div>
        </section>

        <!-- 出品中の商品 -->
        ${productsHtml ? '<section class="mb-10 sm:mb-14"><div class="flex items-center justify-between mb-6 sm:mb-8"><h2 class="section-heading">出品中のパーツ</h2><a href="/search" class="text-xs sm:text-sm text-red-500 font-semibold hover:underline">すべて見る<i class="fas fa-chevron-right ml-1 text-xs"></i></a></div><div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">' + productsHtml + '</div></section>' : ''}

        <!-- カテゴリ -->
        ${categoriesHtml ? '<section class="mb-10 sm:mb-14"><h2 class="section-heading mb-4 sm:mb-6">カテゴリから探す</h2><div class="flex flex-wrap">' + categoriesHtml + '</div></section>' : ''}

        <!-- 取引の流れ -->
        <section class="mb-10 sm:mb-14">
            <h2 class="section-heading mb-6 sm:mb-8">取引の流れ</h2>
            <div class="max-w-xl mx-auto space-y-6 sm:space-y-8">
                <div class="step-line">
                    <div class="step-num bg-red-500">1</div>
                    <h3 class="font-bold text-gray-900 mb-1">無料会員登録</h3>
                    <p class="text-sm text-gray-500">メールアドレスだけで簡単登録。最短1分で出品・購入が可能に。</p>
                </div>
                <div class="step-line">
                    <div class="step-num bg-orange-500">2</div>
                    <h3 class="font-bold text-gray-900 mb-1">商品を出品 or 検索</h3>
                    <p class="text-sm text-gray-500">写真を撮って出品、またはキーワード・カテゴリで必要なパーツを検索。</p>
                </div>
                <div class="step-line">
                    <div class="step-num bg-blue-500">3</div>
                    <h3 class="font-bold text-gray-900 mb-1">チャットで確認</h3>
                    <p class="text-sm text-gray-500">適合や状態について、出品者に直接質問して確認できます。</p>
                </div>
                <div class="step-line">
                    <div class="step-num bg-emerald-500">4</div>
                    <h3 class="font-bold text-gray-900 mb-1">安全に決済・配送</h3>
                    <p class="text-sm text-gray-500">Stripeによる安全決済と追跡番号付き配送で、安心して取引完了。</p>
                </div>
            </div>
        </section>

        <!-- メーカー別パーツ検索 -->
        <section class="mb-10 sm:mb-14">
            <h2 class="section-heading mb-4 sm:mb-6">${pref.name}のメーカー別パーツ</h2>
            <div class="flex flex-wrap">
                ${['トヨタ','日産','ホンダ','スズキ','ダイハツ','スバル','マツダ','三菱','いすゞ','レクサス','ＢＭＷ','メルセデス・ベンツ','アウディ','フォルクスワーゲン','フェラーリ'].map(m => '<a href="/area/' + prefSlug + '/' + encodeURIComponent(m) + '" class="cat-tag"><i class="fas fa-car text-xs mr-1 text-gray-400"></i>' + m + '</a>').join('')}
            </div>
        </section>

        <!-- 近隣エリア -->
        ${sameRegion ? '<section class="mb-10 sm:mb-14"><h2 class="section-heading mb-4 sm:mb-6">' + pref.region + 'の他のエリア</h2><div class="flex flex-wrap">' + sameRegion + '</div></section>' : ''}

        <!-- パートナー募集バナー -->
        <section class="mb-10 sm:mb-14">
            <div class="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5 sm:p-8">
                <div class="flex flex-col sm:flex-row items-center gap-4">
                    <div class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-2xl flex-shrink-0"><i class="fas fa-handshake"></i></div>
                    <div class="text-center sm:text-left flex-1">
                        <h3 class="font-bold text-gray-900 mb-1">${pref.name}で出品代行パートナー募集中</h3>
                        <p class="text-xs text-gray-500 leading-relaxed">地域の整備工場の余剰パーツをPARTS HUBで代行出品。副業からスタートOK、在庫リスクなし。</p>
                    </div>
                    <a href="/franchise" class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm whitespace-nowrap shadow-sm"><i class="fas fa-arrow-right"></i>詳しく見る</a>
                </div>
            </div>
        </section>
    </main>

    <!-- CTA -->
    <section class="cta-section text-white py-12 sm:py-16 lg:py-20">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">眠っているパーツを、必要としている工場へ</h2>
            <p class="text-slate-400 text-xs sm:text-sm lg:text-base mb-6 sm:mb-8 leading-relaxed">PARTS HUBは全国の整備工場同士をつなぐプラットフォームです。<br class="hidden sm:block">余剰在庫の削減と、必要なパーツの効率的な調達を実現します。</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/register" class="inline-block px-6 sm:px-8 py-3 sm:py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm sm:text-base shadow-lg shadow-red-500/20">無料で会員登録</a>
                <a href="/search" class="inline-block px-6 sm:px-8 py-3 sm:py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm sm:text-base border border-white/20">商品を探す</a>
            </div>
        </div>
    </section>

    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
})

// ========================================
// 都道府県×メーカー×車種 クロスページ（SEO最適化）
// ========================================

// 都道府県×メーカー一覧ページ（例：/area/tokyo/トヨタ）
app.get('/area/:pref/:maker', async (c) => {
  const prefSlug = c.req.param('pref')
  const pref = PREFECTURES[prefSlug]
  if (!pref) return c.redirect('/area', 302)

  const maker = decodeURIComponent(c.req.param('maker'))
  const { DB } = c.env as any

  try {
    const { results: models } = await DB.prepare(`
      SELECT model, COUNT(*) as grade_count,
        SUM(CASE WHEN tire_size IS NOT NULL AND tire_size != '' THEN 1 ELSE 0 END) as tire_count
      FROM vehicle_master WHERE maker = ? GROUP BY model ORDER BY model ASC
    `).bind(maker).all()

    if (models.length === 0) return c.redirect('/area/' + prefSlug, 302)

    const safeMaker = maker.replace(/</g, '&lt;')
    const safePref = pref.name
    const totalModels = models.length

    // 出品商品数（この都道府県×メーカー / 汎用品含む）
    let productCount = 0
    try {
      const cnt = await DB.prepare(`
        SELECT COUNT(DISTINCT p.id) as cnt FROM products p
        WHERE p.status IN ('active','sold') AND (p.is_universal = 1 OR p.vm_maker = ?)
        AND (p.prefecture = ? OR p.prefecture = 'all')
      `).bind(maker, prefSlug).first() as any
      productCount = cnt?.cnt || 0
    } catch(e) {}

    const domesticSet = new Set(['トヨタ','日産','ホンダ','スズキ','ダイハツ','スバル','マツダ','三菱','いすゞ','日野','レクサス','光岡自動車'])
    const isDomestic = domesticSet.has(maker)

    // 人気車種TOP5
    const popularModels = [...models].sort((a: any, b: any) => b.grade_count - a.grade_count).slice(0, 5)

    // 車種リスト
    const modelListHtml = models.map((m: any) => {
      const meta: string[] = []
      if (m.grade_count > 0) meta.push(m.grade_count + 'グレード')
      if (m.tire_count > 0) meta.push('タイヤサイズ有')
      return '<a href="/area/' + prefSlug + '/' + encodeURIComponent(maker) + '/' + encodeURIComponent(m.model) + '" class="model-item">' +
        '<span class="model-name">' + String(m.model).replace(/</g, '&lt;') + '</span>' +
        '<span class="model-meta">' + meta.join(' / ') + '</span>' +
        '<i class="fas fa-chevron-right" style="color:#d1d5db;font-size:10px;"></i></a>'
    }).join('')

    // 同都道府県の他メーカーリンク
    const { results: topMakers } = await DB.prepare(`
      SELECT maker, COUNT(DISTINCT model) as cnt FROM vehicle_master GROUP BY maker ORDER BY cnt DESC LIMIT 12
    `).all()
    const otherMakersHtml = topMakers.filter((mk: any) => mk.maker !== maker).slice(0, 10).map((mk: any) =>
      '<a href="/area/' + prefSlug + '/' + encodeURIComponent(mk.maker) + '" class="nearby-link">' + String(mk.maker).replace(/</g, '&lt;') + '</a>'
    ).join('')

    // 構造化データ
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": safePref + 'の' + safeMaker + '車パーツガイド',
      "description": safePref + 'で' + safeMaker + 'の中古パーツをお探しなら。' + totalModels + '車種のグレード・タイヤサイズ情報を収録。',
      "url": 'https://parts-hub-tci.com/area/' + prefSlug + '/' + encodeURIComponent(maker),
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": "エリア", "item": "https://parts-hub-tci.com/area" },
          { "@type": "ListItem", "position": 3, "name": safePref, "item": "https://parts-hub-tci.com/area/" + prefSlug },
          { "@type": "ListItem", "position": 4, "name": safeMaker }
        ]
      }
    })

    return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safePref}の${safeMaker}パーツ｜${totalModels}車種対応 - PARTS HUB</title>
    <meta name="description" content="${safePref}で${safeMaker}の中古パーツ・整備部品をお探しなら PARTS HUB。${popularModels.slice(0,3).map((m:any)=>m.model).join('・')}など${totalModels}車種に対応。全国の整備工場から適合パーツを検索。">
    <link rel="canonical" href="https://parts-hub-tci.com/area/${prefSlug}/${encodeURIComponent(maker)}">
    ${hreflang('/area/' + prefSlug + '/' + encodeURIComponent(maker))}
    <meta property="og:title" content="${safePref}の${safeMaker}パーツ - PARTS HUB">
    <meta property="og:description" content="${safePref}で${safeMaker}の中古パーツを検索。${totalModels}車種対応。">
    <meta property="og:url" content="https://parts-hub-tci.com/area/${prefSlug}/${encodeURIComponent(maker)}">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta name="robots" content="${productCount > 0 ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, follow'}">
    <script type="application/ld+json">${jsonLd}</script>
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body{font-family:'Noto Sans JP',sans-serif}
      .model-item{display:flex;align-items:center;gap:10px;padding:14px 16px;background:white;border:1px solid #f3f4f6;border-radius:10px;text-decoration:none;transition:all .15s}
      .model-item:hover{background:#fef2f2;border-color:#fca5a5;transform:translateX(2px)}
      .model-name{font-size:14px;font-weight:600;color:#1f2937;flex:1}
      .model-meta{font-size:11px;color:#9ca3af;white-space:nowrap}
      .section-heading{font-size:17px;font-weight:700;color:#1f2937;position:relative;padding-left:14px}
      .section-heading::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:3px;background:linear-gradient(180deg,#ef4444,#f97316);border-radius:2px}
      .nearby-link{display:inline-flex;align-items:center;padding:6px 12px;background:white;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;font-weight:500;color:#374151;text-decoration:none;transition:all .15s;margin:2px}
      .nearby-link:hover{background:#fef2f2;border-color:#fca5a5;color:#dc2626}
      .stat-pill{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:50px;font-size:13px;color:#cbd5e1}
      .stat-pill strong{color:white;font-weight:800}
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/area/${prefSlug}" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">${safePref}</span></a>
            <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
            <a href="/search?vm_maker=${encodeURIComponent(maker)}" class="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"><i class="fas fa-search mr-1"></i>検索</a>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'エリア',url:'/area'},{name:safePref,url:'/area/'+prefSlug},{name:safeMaker}])}

    <section class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-10 sm:py-14">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <span class="inline-block px-3 py-1 ${isDomestic ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'} text-xs font-semibold rounded-full mb-4">${pref.region} / ${safePref}</span>
            <h1 class="text-2xl sm:text-3xl font-bold mb-3">${safePref}の${safeMaker}パーツガイド</h1>
            <p class="text-slate-400 text-sm max-w-xl mx-auto mb-6">${safePref}で${safeMaker}の中古パーツ・整備部品をお探しなら。<br class="hidden sm:block">${totalModels}車種のグレード・タイヤサイズ情報を収録。</p>
            <div class="flex flex-wrap justify-center gap-2">
                <span class="stat-pill"><i class="fas fa-car text-red-400"></i><strong>${totalModels}</strong>車種</span>
                ${productCount > 0 ? '<span class="stat-pill"><i class="fas fa-box text-yellow-400"></i><strong>' + productCount + '</strong>件出品中</span>' : ''}
                <span class="stat-pill"><i class="fas fa-map-marker-alt text-blue-400"></i>${safePref}</span>
            </div>
        </div>
    </section>

    <main class="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <section class="mb-12">
            <h2 class="section-heading mb-6">${safeMaker}の全${totalModels}車種</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${modelListHtml}</div>
        </section>

        ${productCount > 0 ? '<section class="mb-12 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 text-center"><h2 class="text-lg font-bold text-gray-900 mb-2"><i class="fas fa-search text-red-500 mr-2"></i>' + safePref + 'の' + safeMaker + 'パーツ ' + productCount + '件</h2><a href="/search?vm_maker=' + encodeURIComponent(maker) + '" class="inline-block mt-3 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"><i class="fas fa-search mr-2"></i>パーツを検索</a></section>' : ''}

        <section class="mb-12">
            <h2 class="section-heading mb-6">${safePref}の他のメーカー</h2>
            <div class="flex flex-wrap">${otherMakersHtml}</div>
            <div class="mt-4 text-center"><a href="/area/${prefSlug}" class="text-sm text-red-500 font-semibold hover:underline">${safePref}のパーツ情報トップへ<i class="fas fa-chevron-right text-xs ml-1"></i></a></div>
        </section>
    </main>

    <section class="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-xl sm:text-2xl font-bold mb-4">${safePref}で${safeMaker}のパーツを探す</h2>
            <p class="text-slate-400 text-sm mb-8">PARTS HUBなら全国の整備工場から${safeMaker}車用パーツが見つかります。</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/search?vm_maker=${encodeURIComponent(maker)}" class="inline-block px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"><i class="fas fa-search mr-2"></i>パーツを検索</a>
                <a href="/vehicle/${encodeURIComponent(maker)}" class="inline-block px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/20"><i class="fas fa-book mr-2"></i>${safeMaker}の車種ガイド</a>
            </div>
        </div>
    </section>
    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
  } catch(e) {
    console.error('Area×Maker error:', e)
    return c.redirect('/area/' + prefSlug, 302)
  }
})

// 都道府県×メーカー×車種ページ（例：/area/tokyo/トヨタ/プリウス）
app.get('/area/:pref/:maker/:model', async (c) => {
  const prefSlug = c.req.param('pref')
  const pref = PREFECTURES[prefSlug]
  if (!pref) return c.redirect('/area', 302)

  const maker = decodeURIComponent(c.req.param('maker'))
  const model = decodeURIComponent(c.req.param('model'))
  const { DB } = c.env as any

  try {
    const { results: grades } = await DB.prepare(`
      SELECT grade_name, drive_type, tire_size FROM vehicle_master
      WHERE maker = ? AND model = ? ORDER BY grade_name ASC
    `).bind(maker, model).all()

    if (grades.length === 0) return c.redirect('/area/' + prefSlug + '/' + encodeURIComponent(maker), 302)

    const safeMaker = maker.replace(/</g, '&lt;')
    const safeModel = model.replace(/</g, '&lt;')
    const safePref = pref.name
    const hasTire = grades.some((g: any) => g.tire_size)
    const driveTypes = [...new Set(grades.filter((g: any) => g.drive_type).map((g: any) => g.drive_type))]

    // 出品商品数（汎用品含む）
    let productCount = 0
    try {
      const cnt = await DB.prepare(`
        SELECT COUNT(DISTINCT p.id) as cnt FROM products p
        WHERE p.status IN ('active','sold') AND (p.is_universal = 1 OR (p.vm_maker = ? AND p.vm_model = ?))
        AND (p.prefecture = ? OR p.prefecture = 'all')
      `).bind(maker, model, prefSlug).first() as any
      productCount = cnt?.cnt || 0
    } catch(e) {}

    // リッチデータ
    const richData = Object.values(VEHICLES).find(v => v.maker === maker && v.name === model)
    const descText = richData ? richData.desc : safePref + 'で' + safeMaker + ' ' + safeModel + 'の中古パーツをお探しなら。グレード・タイヤサイズ情報と適合パーツを検索。'
    const keywordsHtml = richData ? richData.keywords.map(k => '<span class="keyword-tag">' + k + '</span>').join('') : ''

    // グレードテーブル
    const uniqueGrades = grades.filter((g: any) => g.grade_name)
    let gradeTableHtml = ''
    if (uniqueGrades.length > 0) {
      const rows = uniqueGrades.map((g: any) =>
        '<tr><td style="font-weight:600;color:#1f2937">' + g.grade_name + '</td><td style="font-size:12px">' + (g.drive_type || '-') + '</td><td style="font-size:12px;font-family:monospace">' + (g.tire_size || '-') + '</td></tr>'
      ).join('')
      gradeTableHtml = '<div class="overflow-x-auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f9fafb"><th style="padding:10px 12px;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;text-align:left;font-size:12px">グレード</th><th style="padding:10px 12px;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;text-align:left;font-size:12px">駆動方式</th><th style="padding:10px 12px;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;text-align:left;font-size:12px">タイヤサイズ</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    }

    // 同メーカー他車種
    const { results: sameModels } = await DB.prepare(
      'SELECT DISTINCT model FROM vehicle_master WHERE maker = ? AND model != ? ORDER BY model ASC LIMIT 15'
    ).bind(maker, model).all()
    const sameMakerHtml = sameModels.map((m: any) =>
      '<a href="/area/' + prefSlug + '/' + encodeURIComponent(maker) + '/' + encodeURIComponent(m.model) + '" class="nearby-link">' + String(m.model).replace(/</g, '&lt;') + '</a>'
    ).join('')

    const searchUrl = '/search?vm_maker=' + encodeURIComponent(maker) + '&vm_model=' + encodeURIComponent(model)

    // 構造化データ
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": safePref + 'の' + safeMaker + ' ' + safeModel + 'パーツガイド',
      "description": descText,
      "url": 'https://parts-hub-tci.com/area/' + prefSlug + '/' + encodeURIComponent(maker) + '/' + encodeURIComponent(model),
      "about": { "@type": "Vehicle", "name": model, "manufacturer": { "@type": "Organization", "name": maker } },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": "エリア", "item": "https://parts-hub-tci.com/area" },
          { "@type": "ListItem", "position": 3, "name": safePref, "item": "https://parts-hub-tci.com/area/" + prefSlug },
          { "@type": "ListItem", "position": 4, "name": safeMaker, "item": "https://parts-hub-tci.com/area/" + prefSlug + '/' + encodeURIComponent(maker) },
          { "@type": "ListItem", "position": 5, "name": safeModel }
        ]
      }
    })

    return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safePref}の${safeMaker} ${safeModel}パーツ・整備ガイド - PARTS HUB</title>
    <meta name="description" content="${safePref}で${safeMaker} ${safeModel}の中古パーツ・整備部品をお探しなら。${uniqueGrades.length}グレード収録${hasTire ? '、タイヤサイズ情報あり' : ''}。適合パーツを検索できます。">
    <link rel="canonical" href="https://parts-hub-tci.com/area/${prefSlug}/${encodeURIComponent(maker)}/${encodeURIComponent(model)}">
    ${hreflang('/area/' + prefSlug + '/' + encodeURIComponent(maker) + '/' + encodeURIComponent(model))}
    <meta property="og:title" content="${safePref}の${safeMaker} ${safeModel}パーツ - PARTS HUB">
    <meta property="og:description" content="${safePref}で${safeModel}の中古パーツを検索。${uniqueGrades.length}グレード対応。">
    <meta property="og:url" content="https://parts-hub-tci.com/area/${prefSlug}/${encodeURIComponent(maker)}/${encodeURIComponent(model)}">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta name="robots" content="${productCount > 0 ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, follow'}">
    <script type="application/ld+json">${jsonLd}</script>
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body{font-family:'Noto Sans JP',sans-serif}
      .section-heading{font-size:17px;font-weight:700;color:#1f2937;position:relative;padding-left:14px}
      .section-heading::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:3px;background:linear-gradient(180deg,#ef4444,#f97316);border-radius:2px}
      .keyword-tag{display:inline-block;padding:8px 16px;background:white;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;font-weight:500;color:#374151;margin:3px}
      .nearby-link{display:inline-block;padding:7px 12px;background:white;border:1px solid #e5e7eb;border-radius:8px;color:#374151;font-size:13px;font-weight:500;text-decoration:none;transition:all .15s;margin:2px}
      .nearby-link:hover{background:#fef2f2;border-color:#fca5a5;color:#dc2626}
      .info-card{background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f3f4f6}
      table tr:hover td{background:#fefce8}
      table td{padding:9px 12px;border-bottom:1px solid #f3f4f6;color:#4b5563}
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/area/${prefSlug}/${encodeURIComponent(maker)}" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">${safeMaker}</span></a>
            <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
            <a href="${searchUrl}" class="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"><i class="fas fa-search mr-1"></i>検索</a>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'エリア',url:'/area'},{name:safePref,url:'/area/'+prefSlug},{name:safeMaker,url:'/area/'+prefSlug+'/'+encodeURIComponent(maker)},{name:safeModel}])}

    <section class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-10 sm:py-14">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <span class="inline-block px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full mb-4">${pref.region} / ${safePref}</span>
            <h1 class="text-2xl sm:text-3xl font-bold mb-2">${safePref}の${safeMaker} ${safeModel}</h1>
            <p class="text-slate-400 text-sm mb-4">${uniqueGrades.length}グレード収録${hasTire ? ' / タイヤサイズ情報あり' : ''}${driveTypes.length > 0 ? ' / ' + driveTypes.join('・') : ''}</p>
            ${productCount > 0 ? '<a href="' + searchUrl + '" class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors shadow-lg shadow-red-500/20"><i class="fas fa-search"></i>' + safeModel + 'のパーツ ' + productCount + '件</a>' : ''}
        </div>
    </section>

    <main class="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        ${richData ? '<section class="mb-12"><h2 class="section-heading mb-6">整備・パーツの特徴</h2><div class="info-card"><p class="text-sm text-gray-700 leading-relaxed">' + richData.desc + '</p></div></section>' : ''}
        ${keywordsHtml ? '<section class="mb-12"><h2 class="section-heading mb-6">よく交換されるパーツ</h2><div class="flex flex-wrap">' + keywordsHtml + '</div></section>' : ''}
        ${gradeTableHtml ? '<section class="mb-12"><h2 class="section-heading mb-6">グレード・タイヤサイズ一覧</h2><div class="info-card" style="padding:0;overflow:hidden">' + gradeTableHtml + '</div></section>' : ''}

        <section class="mb-12 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 text-center">
            <p class="text-sm text-gray-600 mb-3">${safePref}で${safeModel}のパーツを探す</p>
            <a href="${searchUrl}" class="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"><i class="fas fa-search mr-2"></i>適合パーツを検索</a>
            <a href="/vehicle/${encodeURIComponent(maker)}/${encodeURIComponent(model)}" class="inline-block ml-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200"><i class="fas fa-book mr-2"></i>車種ガイドを見る</a>
        </section>

        ${sameMakerHtml ? '<section class="mb-12"><h2 class="section-heading mb-6">' + safePref + 'の' + safeMaker + ' 他の車種</h2><div class="flex flex-wrap">' + sameMakerHtml + '</div></section>' : ''}
    </main>

    <section class="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-xl font-bold mb-4">${safePref}で${safeModel}のパーツをお探しですか？</h2>
            <p class="text-slate-400 text-sm mb-8">PARTS HUBなら全国の整備工場から適合パーツが見つかります。</p>
            <a href="${searchUrl}" class="inline-block px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"><i class="fas fa-search mr-2"></i>パーツを検索する</a>
        </div>
    </section>
    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
  } catch(e) {
    console.error('Area×Maker×Model error:', e)
    return c.redirect('/area/' + prefSlug, 302)
  }
})

// ========================================
// 車種別パーツガイドページ（/vehicle）
// ========================================
const VEHICLES: Record<string, { maker: string; name: string; nameEn: string; years: string; type: string; desc: string; keywords: string[] }> = {
  'toyota-prius': { maker: 'トヨタ', name: 'プリウス', nameEn: 'Prius', years: '2009-2023', type: 'ハイブリッド', desc: '世界初の量産ハイブリッドカー。HVバッテリーやインバーター等の専用パーツに加え、ブレーキパッド・フィルター類の消耗品も定期交換が必要です。走行距離10万km超えの個体が増加し、リビルトパーツの需要が拡大しています。', keywords: ['HVバッテリー','インバーター','ウォーターポンプ','ブレーキパッド','エアフィルター'] },
  'toyota-aqua': { maker: 'トヨタ', name: 'アクア', nameEn: 'Aqua', years: '2011-2023', type: 'ハイブリッド', desc: 'コンパクトHVの定番車種。プリウスと共通のハイブリッドシステムを採用しており、HVバッテリーの交換需要が高い車種です。小型ゆえにDIY整備を行うオーナーも多く、パーツの個人向け需要もあります。', keywords: ['HVバッテリー','ヘッドライト','ドアミラー','エアコンフィルター','ワイパーブレード'] },
  'toyota-hiace': { maker: 'トヨタ', name: 'ハイエース', nameEn: 'HiAce', years: '2004-2023', type: '商用バン', desc: '整備工場で最も取り扱いの多い商用車の一つ。走行距離が伸びやすく、エンジンパーツ・足回り・ブレーキの交換頻度が高い車種です。カスタム需要も根強く、外装・内装パーツの流通も活発です。', keywords: ['ディーゼルエンジン部品','ターボチャージャー','ブレーキローター','サスペンション','スライドドア部品'] },
  'toyota-alphard': { maker: 'トヨタ', name: 'アルファード', nameEn: 'Alphard', years: '2015-2023', type: 'ミニバン', desc: '高級ミニバンの代名詞。電装品が多く、パワースライドドアやデジタルミラー等の修理パーツ需要が特徴的です。中古車価格が高いため、リビルト・中古パーツでの修理コスト削減ニーズが強い車種です。', keywords: ['パワースライドドア','デジタルインナーミラー','エアサスペンション','LEDヘッドライト','オーディオユニット'] },
  'toyota-corolla': { maker: 'トヨタ', name: 'カローラ', nameEn: 'Corolla', years: '2006-2023', type: 'セダン/ワゴン', desc: '世界累計販売台数No.1の車種。歴代モデルが幅広く現役で走行しており、年式ごとのパーツ互換性の確認が重要です。消耗品からボディパーツまで、安定した取引量があります。', keywords: ['ブレーキパッド','エアフィルター','スパークプラグ','ドライブシャフト','テールランプ'] },
  'toyota-landcruiser': { maker: 'トヨタ', name: 'ランドクルーザー', nameEn: 'Land Cruiser', years: '2007-2023', type: 'SUV', desc: '世界中で愛されるSUV。国内外からの需要が高く、特にランクル70系・80系・100系の旧型パーツは希少価値があります。オフロード走行による足回りの消耗が早く、サスペンション・ブレーキの交換頻度が高い車種です。', keywords: ['サスペンション','デフオイル','トランスファー','ブレーキキャリパー','フロントグリル'] },
  'nissan-note': { maker: '日産', name: 'ノート', nameEn: 'Note', years: '2012-2023', type: 'コンパクト', desc: 'e-POWER搭載で人気のコンパクトカー。独自の電動パワートレインにより、専用モーターやインバーターの整備需要があります。販売台数が多いため、消耗品の回転率も高い車種です。', keywords: ['e-POWERモーター','インバーター','CVTフルード','ブレーキパッド','ドアミラー'] },
  'nissan-serena': { maker: '日産', name: 'セレナ', nameEn: 'Serena', years: '2010-2023', type: 'ミニバン', desc: 'ファミリーミニバンの定番。スライドドア機構やプロパイロット関連の電装品修理が増加傾向にあります。走行距離の多い個体ではCVTの不具合も報告されており、駆動系パーツの需要も高い車種です。', keywords: ['CVTアッセンブリー','スライドドアモーター','プロパイロットセンサー','エアコンコンプレッサー','オルタネーター'] },
  'honda-nbox': { maker: 'ホンダ', name: 'N-BOX', nameEn: 'N-BOX', years: '2011-2023', type: '軽自動車', desc: '軽自動車販売台数No.1。全国の整備工場で最も入庫頻度の高い車種の一つです。ターボモデルのエンジン系パーツや、スライドドア機構の修理需要が特に多い車種です。', keywords: ['ターボチャージャー','CVTフルード','スライドドアワイヤー','エアコンコンプレッサー','ドライブシャフトブーツ'] },
  'honda-fit': { maker: 'ホンダ', name: 'フィット', nameEn: 'Fit', years: '2007-2023', type: 'コンパクト', desc: 'ホンダの主力コンパクトカー。e:HEV搭載モデルの普及に伴い、ハイブリッド関連パーツの整備需要が拡大中。歴代モデル共通のパーツも多く、在庫管理がしやすい車種です。', keywords: ['e:HEVバッテリー','CVTフルード','ブレーキディスク','パワーウィンドウモーター','エアフィルター'] },
  'honda-freed': { maker: 'ホンダ', name: 'フリード', nameEn: 'Freed', years: '2008-2023', type: 'コンパクトミニバン', desc: 'コンパクトミニバンの先駆者。3列シート車特有のスライドドア機構やシートアレンジ関連の修理需要があります。e:HEVモデルも増加し、電動系パーツの取り扱いも必要な車種です。', keywords: ['スライドドアモーター','シートベルトプリテンショナー','e:HEVユニット','リアゲートダンパー','CVTフルード'] },
  'suzuki-jimny': { maker: 'スズキ', name: 'ジムニー', nameEn: 'Jimny', years: '1998-2023', type: '軽SUV', desc: '根強いファンを持つ軽SUV。オフロード走行による過酷な使用条件から、足回り・駆動系パーツの消耗が早い車種です。JB23/JB64問わずカスタムパーツの需要も非常に高い特徴があります。', keywords: ['リフトアップキット','トランスファーギア','ラテラルロッド','マフラー','フロントバンパー'] },
  'suzuki-swift': { maker: 'スズキ', name: 'スイフト', nameEn: 'Swift', years: '2004-2023', type: 'コンパクト', desc: 'スポーティなコンパクトカー。スイフトスポーツはモータースポーツベースとしても人気が高く、チューニングパーツの需要があります。通常モデルも燃費性能の高さから法人車両として採用が多い車種です。', keywords: ['ブレーキパッド','クラッチキット','マフラー','サスペンション','エアフィルター'] },
  'suzuki-hustler': { maker: 'スズキ', name: 'ハスラー', nameEn: 'Hustler', years: '2014-2023', type: '軽SUV', desc: 'クロスオーバーSUVスタイルの軽自動車。若年層のユーザーが多く、外装カスタムパーツの需要が特徴的です。マイルドハイブリッドシステム搭載車も増え、電装系パーツの取り扱いも必要になっています。', keywords: ['マイルドハイブリッドバッテリー','ルーフレール','フォグランプ','サスペンション','CVTフルード'] },
  'daihatsu-tanto': { maker: 'ダイハツ', name: 'タント', nameEn: 'Tanto', years: '2003-2023', type: '軽自動車', desc: '軽スーパーハイトワゴンの先駆け。ミラクルオープンドアやパワースライドドアの機構部品の修理需要が高い車種です。ファミリーユースが中心で、チャイルドシート関連の内装パーツ需要もあります。', keywords: ['パワースライドドアモーター','ミラクルオープンドアヒンジ','CVTベルト','エアコンコンプレッサー','ドライブシャフト'] },
  'daihatsu-move': { maker: 'ダイハツ', name: 'ムーヴ', nameEn: 'Move', years: '2006-2023', type: '軽自動車', desc: 'ダイハツの主力軽自動車。長い販売歴から多数の現役車両が存在し、年式を問わず安定したパーツ需要があります。ムーヴキャンバスなど派生モデルとのパーツ共通性も高い車種です。', keywords: ['CVTフルード','ターボチャージャー','ブレーキパッド','パワーウィンドウレギュレーター','エアコンフィルター'] },
  'subaru-forester': { maker: 'スバル', name: 'フォレスター', nameEn: 'Forester', years: '2007-2023', type: 'SUV', desc: 'スバルのAWD技術を結集したSUV。水平対向エンジン特有の整備性から、オイル漏れ修理やヘッドガスケット交換の需要があります。雪国での使用率が高く、防錆・下回りパーツの需要も強い車種です。', keywords: ['ヘッドガスケット','CVTフルード','ブレーキローター','マフラー遮熱板','フロントハブベアリング'] },
  'mazda-cx5': { maker: 'マツダ', name: 'CX-5', nameEn: 'CX-5', years: '2012-2023', type: 'SUV', desc: 'マツダのクリーンディーゼルSUV。SKYACTIV-Dエンジンの煤（すす）詰まり対策としてDPF関連パーツの需要が高い車種です。デザイン性の高い外装パーツも中古市場で人気があります。', keywords: ['DPFフィルター','ディーゼルインジェクター','フロントグリル','ブレーキキャリパー','エアコンコンプレッサー'] },
  'mitsubishi-delica': { maker: '三菱', name: 'デリカD:5', nameEn: 'Delica D:5', years: '2007-2023', type: 'ミニバンSUV', desc: '唯一無二のオールラウンドミニバン。オフロード走行にも対応する足回りの頑丈さが特徴ですが、ディーゼルモデルのDPFやターボの整備需要が高い車種です。アウトドアユーザーからの根強い人気があります。', keywords: ['ディーゼルターボ','DPFフィルター','4WDトランスファー','サスペンションアーム','フロントバンパー'] },
  'isuzu-elf': { maker: 'いすゞ', name: 'エルフ', nameEn: 'Elf', years: '2006-2023', type: '小型トラック', desc: '小型トラック市場シェアNo.1。物流を支える主力車種として全国の整備工場で日常的に入庫します。ディーゼルエンジンの耐久性が高い一方、DPF・尿素SCR系の定期メンテナンスが必須の車種です。', keywords: ['DPFフィルター','尿素SCRシステム','クラッチディスク','ブレーキライニング','オルタネーター'] },
  'hino-dutro': { maker: '日野', name: 'デュトロ', nameEn: 'Dutro', years: '2011-2023', type: '小型トラック', desc: '日野自動車の主力小型トラック。トヨタグループの品質管理のもと高い信頼性を誇りますが、商用車ゆえの高稼働により消耗品の定期交換が不可欠です。エルフとともにパーツ需要が安定した車種です。', keywords: ['ディーゼルインジェクター','DPFフィルター','ブレーキシュー','エアドライヤー','ファンベルト'] }
}

const MAKER_ORDER = ['トヨタ','日産','ホンダ','スズキ','ダイハツ','スバル','マツダ','三菱','いすゞ','日野']

// 車種一覧ページ（DB動的取得：125メーカー・3,898車種）
app.get('/vehicle', async (c) => {
  const { DB } = c.env as any
  let makerCards = ''
  let totalMakers = 0
  let totalModels = 0

  try {
    // メーカー別車種数を取得
    const { results: makers } = await DB.prepare(`
      SELECT maker, COUNT(DISTINCT model) as model_count
      FROM vehicle_master
      GROUP BY maker
      ORDER BY model_count DESC
    `).all()

    totalMakers = makers.length
    totalModels = makers.reduce((sum: number, m: any) => sum + m.model_count, 0)

    // 国内主要メーカーを優先表示
    const domesticOrder = ['トヨタ','日産','ホンダ','スズキ','ダイハツ','スバル','マツダ','三菱','いすゞ','日野','レクサス','光岡自動車']
    const domesticSet = new Set(domesticOrder)
    const sortedMakers = [
      ...domesticOrder.filter(m => makers.some((mk: any) => mk.maker === m)),
      ...makers.filter((mk: any) => !domesticSet.has(mk.maker)).map((mk: any) => mk.maker)
    ]

    let makerIndex = 0
    for (const makerName of sortedMakers) {
      const makerData = makers.find((mk: any) => mk.maker === makerName) as any
      if (!makerData) continue
      const isDomestic = domesticSet.has(makerName)
      const badgeHtml = isDomestic
        ? '<span style="font-size:10px;background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:4px;margin-left:8px;">国内</span>'
        : '<span style="font-size:10px;background:#f0fdf4;color:#16a34a;padding:1px 6px;border-radius:4px;margin-left:8px;">海外</span>'
      const listId = 'models-' + makerIndex
      const makerUrl = '/vehicle/' + encodeURIComponent(makerName)
      makerCards += `<div class="maker-card" data-maker="${makerName.replace(/"/g, '&quot;')}">
        <h3 class="maker-title"><a href="${makerUrl}" style="color:inherit;text-decoration:none;display:flex;align-items:center;flex:1;"><span>${makerName}</span>${badgeHtml}</a><span style="font-size:11px;color:#9ca3af;margin-left:auto;">${makerData.model_count}車種</span></h3>
        <div class="vehicle-list" id="${listId}" style="display:none;">
          <div class="text-center py-4 text-gray-400 text-sm"><i class="fas fa-spinner fa-spin mr-1"></i>読み込み中...</div>
        </div>
        <div class="maker-actions">
          <button class="model-toggle-btn" onclick="toggleMaker(this, '${makerName.replace(/'/g, "\\'")}', '${listId}')" data-loaded="false">
            <span>車種を表示</span><i class="fas fa-chevron-down" style="font-size:10px;margin-left:4px;"></i>
          </button>
          <a href="${makerUrl}" class="maker-detail-link" title="${makerName}の全車種を見る"><i class="fas fa-external-link-alt" style="font-size:10px;"></i></a>
        </div>
      </div>`
      makerIndex++
    }
  } catch (e) {
    console.error('Vehicle guide error:', e)
    makerCards = '<div class="col-span-full text-center py-8 text-gray-500">データの読み込みに失敗しました</div>'
  }

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>車種別パーツガイド｜${totalMakers}メーカー・${totalModels.toLocaleString()}車種収録 - PARTS HUB（パーツハブ）</title>
    <meta name="description" content="車種別の整備・交換パーツガイド。${totalMakers}メーカー・${totalModels.toLocaleString()}車種のグレード・タイヤサイズ情報を収録。車種に適合するパーツを検索できます。">
    <link rel="canonical" href="https://parts-hub-tci.com/vehicle">
        ${hreflang("/vehicle")}
    <meta property="og:title" content="車種別パーツガイド - PARTS HUB">
    <meta property="og:description" content="${totalMakers}メーカー・${totalModels.toLocaleString()}車種収録。車種別にパーツを検索">
    <meta property="og:url" content="https://parts-hub-tci.com/vehicle">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Noto Sans JP', sans-serif; }
      .maker-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; }
      .maker-title { font-size: 15px; font-weight: 700; color: #1f2937; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #fee2e2; display:flex; align-items:center; }
      .vehicle-list { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; }
      .vehicle-chip { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; color: #374151; text-decoration: none; transition: all 0.15s; }
      .vehicle-chip:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
      .vehicle-name { font-size: 13px; font-weight: 600; }
      .vehicle-meta { font-size: 10px; color: #9ca3af; }
      .maker-actions { display:flex; flex-direction:row; gap:6px; margin-top:8px; }
      .model-toggle-btn { flex:1; padding:8px; text-align:center; font-size:13px; font-weight:600; color:#ef4444; background:none; border:1px solid #fee2e2; border-radius:8px; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center; justify-content:center; }
      .model-toggle-btn:hover { background:#fef2f2; }
      .maker-detail-link { display:flex; align-items:center; justify-content:center; width:36px; flex-shrink:0; padding:8px; color:#ef4444; background:none; border:1px solid #fee2e2; border-radius:8px; cursor:pointer; transition:all 0.15s; text-decoration:none; }
      .maker-detail-link:hover { background:#fef2f2; }
      .search-box { max-width:500px; margin:0 auto; position:relative; z-index:10; }
      .search-box input { width:100%; padding:12px 16px 12px 42px; border:2px solid #e5e7eb; border-radius:12px; font-size:14px; outline:none; transition:border-color 0.2s; background:white; color:#1f2937; }
      .search-box input:focus { border-color:#ef4444; }
      .search-box i { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#9ca3af; pointer-events:none; }
      .stat-card { background:rgba(255,255,255,0.08); border-radius:12px; padding:16px 20px; text-align:center; border:1px solid rgba(255,255,255,0.1); }
      .stat-value { font-size:24px; font-weight:900; color:#f87171; }
      .stat-label { font-size:11px; color:#94a3b8; margin-top:2px; }
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">トップ</span></a>
            <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            <div class="w-16"></div>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'車種別パーツガイド'}])}
    <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-10 sm:py-14">
        <div class="max-w-6xl mx-auto px-4 text-center">
            <p class="text-red-400 text-sm font-semibold tracking-wider mb-3">VEHICLE PARTS GUIDE</p>
            <h1 class="text-2xl sm:text-3xl font-bold mb-3">車種別パーツガイド</h1>
            <p class="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-6">${totalMakers}メーカー・${totalModels.toLocaleString()}車種のグレード・タイヤサイズ情報を収録。<br class="hidden sm:block">車種に合ったパーツを探せます。</p>
            <div class="flex justify-center gap-3 sm:gap-4 mb-8">
                <div class="stat-card"><div class="stat-value">${totalMakers}</div><div class="stat-label">メーカー</div></div>
                <div class="stat-card"><div class="stat-value">${totalModels.toLocaleString()}</div><div class="stat-label">車種</div></div>
                <div class="stat-card"><div class="stat-value">17,673</div><div class="stat-label">グレード</div></div>
            </div>
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="maker-search" placeholder="メーカー名で絞り込み（例：トヨタ、BMW）" oninput="filterMakers(this.value)">
            </div>
        </div>
    </div>
    <main class="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div id="maker-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            ${makerCards}
        </div>
    </main>
    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
    <script>
    function filterMakers(q) {
      const cards = document.querySelectorAll('.maker-card')
      const lower = q.toLowerCase()
      cards.forEach(card => {
        const maker = card.getAttribute('data-maker') || ''
        card.style.display = maker.toLowerCase().includes(lower) ? '' : 'none'
      })
    }

    async function toggleMaker(btn, maker, listId) {
      const list = document.getElementById(listId)
      if (!list) return
      const isOpen = list.style.display !== 'none'
      if (isOpen) {
        list.style.display = 'none'
        btn.querySelector('span').textContent = '車種を表示'
        btn.querySelector('i').className = 'fas fa-chevron-down'
        btn.querySelector('i').style.fontSize = '10px'
        btn.querySelector('i').style.marginLeft = '4px'
        return
      }
      list.style.display = ''
      btn.querySelector('span').textContent = '閉じる'
      btn.querySelector('i').className = 'fas fa-chevron-up'
      btn.querySelector('i').style.fontSize = '10px'
      btn.querySelector('i').style.marginLeft = '4px'

      if (btn.getAttribute('data-loaded') === 'true') return
      try {
        const res = await fetch('/api/vehicle-master/guide/models?maker=' + encodeURIComponent(maker))
        const json = await res.json()
        if (json.success && json.data.length > 0) {
          list.innerHTML = json.data.map(m => {
            const slug = encodeURIComponent(maker) + '/' + encodeURIComponent(m.model)
            const meta = []
            if (m.grade_count > 0) meta.push(m.grade_count + 'グレード')
            if (m.tire_size_count > 0) meta.push('タイヤサイズ有')
            return '<a href="/vehicle/' + slug + '" class="vehicle-chip"><span class="vehicle-name">' + m.model + '</span><span class="vehicle-meta">' + meta.join(' / ') + '</span></a>'
          }).join('')
          btn.setAttribute('data-loaded', 'true')
        } else {
          list.innerHTML = '<div class="text-center py-3 text-gray-400 text-sm">車種データがありません</div>'
        }
      } catch(e) {
        list.innerHTML = '<div class="text-center py-3 text-red-400 text-sm">読み込みエラー</div>'
      }
    }
    </script>
</body>
</html>`)
})

// メーカー別ページ + 旧slug形式のリダイレクト
app.get('/vehicle/:makerOrSlug', async (c) => {
  const param = decodeURIComponent(c.req.param('makerOrSlug'))
  
  // 旧slug形式（toyota-prius等）なら301リダイレクト
  const vehicle = VEHICLES[param]
  if (vehicle) {
    return c.redirect('/vehicle/' + encodeURIComponent(vehicle.maker) + '/' + encodeURIComponent(vehicle.name), 301)
  }

  // DBにメーカーとして存在するか確認
  const { DB } = c.env as any
  try {
    const { results: models } = await DB.prepare(`
      SELECT model, COUNT(*) as grade_count,
        SUM(CASE WHEN tire_size IS NOT NULL AND tire_size != '' THEN 1 ELSE 0 END) as tire_count
      FROM vehicle_master
      WHERE maker = ?
      GROUP BY model
      ORDER BY model ASC
    `).bind(param).all()

    if (models.length === 0) return c.redirect('/vehicle', 302)

    const safeMaker = param.replace(/</g, '&lt;')
    const totalModels = models.length
    const totalGrades = models.reduce((s: number, m: any) => s + m.grade_count, 0)
    const hasTire = models.some((m: any) => m.tire_count > 0)

    // 同メーカーの出品商品数（汎用品を含む）
    let productCount = 0
    try {
      const cnt = await DB.prepare(`
        SELECT COUNT(DISTINCT p.id) as cnt FROM products p
        WHERE p.status IN ('active','sold')
          AND (p.is_universal = 1 OR p.vm_maker = ? OR EXISTS (SELECT 1 FROM product_compatibility pc WHERE pc.product_id = p.id AND pc.vm_maker = ?))
      `).bind(param, param).first() as any
      productCount = cnt?.cnt || 0
    } catch(e) {}

    // 人気車種（グレード数順上位10）
    const popularModels = [...models].sort((a: any, b: any) => b.grade_count - a.grade_count).slice(0, 10)

    // 全メーカー一覧（サイドナビ用）
    const { results: allMakers } = await DB.prepare(`
      SELECT maker, COUNT(DISTINCT model) as cnt FROM vehicle_master GROUP BY maker ORDER BY cnt DESC LIMIT 30
    `).all()

    const domesticSet = new Set(['トヨタ','日産','ホンダ','スズキ','ダイハツ','スバル','マツダ','三菱','いすゞ','日野','レクサス','光岡自動車'])
    const isDomestic = domesticSet.has(param)
    const badgeText = isDomestic ? '国内メーカー' : '海外メーカー'
    const badgeColor = isDomestic ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'

    // 車種リストHTML
    const modelListHtml = models.map((m: any) => {
      const meta: string[] = []
      if (m.grade_count > 0) meta.push(m.grade_count + 'グレード')
      if (m.tire_count > 0) meta.push('タイヤサイズ有')
      return `<a href="/vehicle/${encodeURIComponent(param)}/${encodeURIComponent(m.model)}" class="model-item">
        <span class="model-name">${String(m.model).replace(/</g, '&lt;')}</span>
        <span class="model-meta">${meta.join(' / ')}</span>
        <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
      </a>`
    }).join('')

    // 他メーカーリンク
    const otherMakersHtml = allMakers.filter((mk: any) => mk.maker !== param).slice(0, 20).map((mk: any) =>
      `<a href="/vehicle/${encodeURIComponent(mk.maker)}" class="other-maker-link">${String(mk.maker).replace(/</g, '&lt;')}<span class="text-xs text-gray-400 ml-1">(${mk.cnt})</span></a>`
    ).join('')

    // 構造化データ
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": safeMaker + 'の車種別パーツガイド',
      "description": safeMaker + 'の全' + totalModels + '車種のグレード・タイヤサイズ情報。適合する中古パーツを検索できます。',
      "url": 'https://parts-hub-tci.com/vehicle/' + encodeURIComponent(param),
      "numberOfItems": totalModels,
      "publisher": { "@type": "Organization", "name": "PARTS HUB", "url": "https://parts-hub-tci.com/" },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": "車種別パーツガイド", "item": "https://parts-hub-tci.com/vehicle" },
          { "@type": "ListItem", "position": 3, "name": safeMaker }
        ]
      },
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": popularModels.map((m: any, i: number) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": param + ' ' + m.model,
          "url": 'https://parts-hub-tci.com/vehicle/' + encodeURIComponent(param) + '/' + encodeURIComponent(m.model)
        }))
      }
    })

    return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeMaker}の車種別パーツガイド｜${totalModels}車種収録 - PARTS HUB</title>
    <meta name="description" content="${safeMaker}の全${totalModels}車種のグレード・タイヤサイズ情報を収録。${safeMaker}車に適合する中古パーツを検索できます。${popularModels.slice(0,5).map((m:any)=>m.model).join('・')}など。">
    <link rel="canonical" href="https://parts-hub-tci.com/vehicle/${encodeURIComponent(param)}">
    ${hreflang("/vehicle/" + encodeURIComponent(param))}
    <meta property="og:type" content="website">
    <meta property="og:title" content="${safeMaker}の車種別パーツガイド｜${totalModels}車種収録 - PARTS HUB">
    <meta property="og:description" content="${safeMaker}の全${totalModels}車種のグレード・タイヤサイズ情報と適合パーツ検索">
    <meta property="og:url" content="https://parts-hub-tci.com/vehicle/${encodeURIComponent(param)}">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta property="og:locale" content="ja_JP">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeMaker}の車種別パーツガイド - PARTS HUB">
    <meta name="robots" content="${productCount > 0 ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, follow'}">
    <script type="application/ld+json">${jsonLd}</script>
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Noto Sans JP', sans-serif; }
      .model-item { display:flex; align-items:center; gap:10px; padding:14px 16px; background:white; border:1px solid #f3f4f6; border-radius:10px; text-decoration:none; transition:all 0.15s; }
      .model-item:hover { background:#fef2f2; border-color:#fca5a5; transform:translateX(2px); }
      .model-name { font-size:14px; font-weight:600; color:#1f2937; flex:1; }
      .model-meta { font-size:11px; color:#9ca3af; white-space:nowrap; }
      .other-maker-link { display:inline-flex; align-items:center; padding:6px 12px; background:white; border:1px solid #e5e7eb; border-radius:8px; font-size:12px; font-weight:500; color:#374151; text-decoration:none; transition:all 0.15s; margin:2px; }
      .other-maker-link:hover { background:#fef2f2; border-color:#fca5a5; color:#dc2626; }
      .stat-pill { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); border-radius:50px; font-size:13px; color:#cbd5e1; }
      .stat-pill strong { color:white; font-weight:800; }
      .section-heading { font-size:17px; font-weight:700; color:#1f2937; position:relative; padding-left:14px; }
      .section-heading::before { content:''; position:absolute; left:0; top:2px; bottom:2px; width:3px; background:linear-gradient(180deg,#ef4444,#f97316); border-radius:2px; }
      .popular-card { display:flex; align-items:center; gap:12px; padding:14px 16px; background:white; border-radius:10px; border:1px solid #f3f4f6; text-decoration:none; transition:all 0.15s; }
      .popular-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); transform:translateY(-1px); }
      .popular-rank { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:12px; font-weight:800; flex-shrink:0; }
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/vehicle" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">車種一覧</span></a>
            <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
            <a href="/search?vm_maker=${encodeURIComponent(param)}" class="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"><i class="fas fa-search mr-1"></i>パーツ検索</a>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'車種別パーツガイド',url:'/vehicle'},{name:safeMaker}])}

    <section class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-10 sm:py-14">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <span class="inline-block px-3 py-1 ${badgeColor} text-xs font-semibold rounded-full mb-4">${badgeText}</span>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">${safeMaker}の車種別パーツガイド</h1>
            <p class="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-6">全${totalModels}車種・${totalGrades.toLocaleString()}グレードのタイヤサイズ・駆動方式情報を収録。<br class="hidden sm:block">${safeMaker}車に適合するパーツを探せます。</p>
            <div class="flex flex-wrap justify-center gap-2 sm:gap-3">
                <span class="stat-pill"><i class="fas fa-car text-red-400"></i><strong>${totalModels}</strong>車種</span>
                <span class="stat-pill"><i class="fas fa-list text-blue-400"></i><strong>${totalGrades.toLocaleString()}</strong>グレード</span>
                ${hasTire ? '<span class="stat-pill"><i class="fas fa-circle text-green-400"></i>タイヤサイズ情報あり</span>' : ''}
                ${productCount > 0 ? '<span class="stat-pill"><i class="fas fa-box text-yellow-400"></i><strong>' + productCount + '</strong>件出品中</span>' : ''}
            </div>
        </div>
    </section>

    <main class="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        ${popularModels.length >= 5 ? `
        <section class="mb-12">
            <h2 class="section-heading mb-6"><i class="fas fa-fire text-red-400 mr-2" style="font-size:14px;"></i>人気車種 TOP10</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${popularModels.map((m: any, i: number) => {
                  const colors = i < 3 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                  return `<a href="/vehicle/${encodeURIComponent(param)}/${encodeURIComponent(m.model)}" class="popular-card">
                    <span class="popular-rank ${colors}">${i+1}</span>
                    <span class="model-name">${String(m.model).replace(/</g, '&lt;')}</span>
                    <span class="model-meta">${m.grade_count}グレード${m.tire_count > 0 ? ' / タイヤサイズ有' : ''}</span>
                  </a>`
                }).join('')}
            </div>
        </section>` : ''}

        <section class="mb-12">
            <div class="flex items-center justify-between mb-6">
                <h2 class="section-heading">全${totalModels}車種一覧</h2>
                <span class="text-xs text-gray-400">50音順</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${modelListHtml}
            </div>
        </section>

        ${productCount > 0 ? `
        <section class="mb-12 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 sm:p-8 text-center">
            <h2 class="text-lg font-bold text-gray-900 mb-2"><i class="fas fa-search text-red-500 mr-2"></i>${safeMaker}の適合パーツ ${productCount}件</h2>
            <p class="text-sm text-gray-500 mb-4">PARTS HUBに出品されている${safeMaker}車用パーツを検索</p>
            <a href="/search?vm_maker=${encodeURIComponent(param)}" class="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"><i class="fas fa-search mr-2"></i>パーツを検索する</a>
        </section>` : ''}

        <section class="mb-12">
            <h2 class="section-heading mb-6">他のメーカーを見る</h2>
            <div class="flex flex-wrap">${otherMakersHtml}</div>
            <div class="mt-4 text-center">
                <a href="/vehicle" class="text-sm text-red-500 font-semibold hover:underline">全${(allMakers.length || 125)}メーカーを見る <i class="fas fa-chevron-right text-xs ml-1"></i></a>
            </div>
        </section>
    </main>

    <section class="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14 sm:py-20">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-xl sm:text-2xl font-bold mb-4">${safeMaker}のパーツをお探しですか？</h2>
            <p class="text-slate-400 text-sm sm:text-base mb-8">全国の整備工場が出品する中古・リビルトパーツから、${safeMaker}車用パーツが見つかります。</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/search?vm_maker=${encodeURIComponent(param)}" class="inline-block px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-base shadow-lg shadow-red-500/20"><i class="fas fa-search mr-2"></i>${safeMaker}のパーツを検索</a>
                <a href="/listing" class="inline-block px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-base border border-white/20"><i class="fas fa-plus mr-2"></i>パーツを出品する</a>
            </div>
        </div>
    </section>

    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
  } catch(e) {
    console.error('Maker page error:', e)
    return c.redirect('/vehicle', 302)
  }
})

// 車種別詳細ページ（DB動的取得：メーカー/車種名）
app.get('/vehicle/:maker/:model', async (c) => {
  const maker = decodeURIComponent(c.req.param('maker'))
  const model = decodeURIComponent(c.req.param('model'))
  const { DB } = c.env as any

  // vehicle_masterからグレード・タイヤサイズ一覧取得
  let grades: any[] = []
  let productCount = 0
  let driveTypes: string[] = []

  try {
    const { results } = await DB.prepare(`
      SELECT grade_name, drive_type, tire_size
      FROM vehicle_master
      WHERE maker = ? AND model = ?
      ORDER BY grade_name ASC
    `).bind(maker, model).all()

    if (results.length === 0) return c.redirect('/vehicle', 302)
    grades = results

    // ユニークな駆動方式
    driveTypes = [...new Set(results.filter((r: any) => r.drive_type).map((r: any) => r.drive_type))]

    // この車種の出品商品数（汎用品を含む）
    const cnt = await DB.prepare(`
      SELECT COUNT(DISTINCT p.id) as cnt FROM products p
      WHERE p.status IN ('active', 'sold')
        AND (
          p.is_universal = 1
          OR p.vm_maker = ?
          OR EXISTS (SELECT 1 FROM product_compatibility pc WHERE pc.product_id = p.id AND pc.vm_maker = ?)
        )
        AND (
          p.is_universal = 1
          OR p.vm_model = ?
          OR EXISTS (SELECT 1 FROM product_compatibility pc WHERE pc.product_id = p.id AND pc.vm_model = ?)
        )
    `).bind(maker, maker, model, model).first() as any
    productCount = cnt?.cnt || 0
  } catch (e) {
    console.error('Vehicle detail error:', e)
    return c.redirect('/vehicle', 302)
  }

  // 既存リッチデータ（VEHICLES）の照合
  const richData = Object.values(VEHICLES).find(v => v.maker === maker && v.name === model)

  // この車種の出品商品一覧（最大8件）
  let productsHtml = ''
  try {
    const prods = await DB.prepare(`
      SELECT DISTINCT p.id, p.title, p.price, p.condition, p.status, p.is_universal, p.shipping_type,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM products p
      LEFT JOIN product_compatibility pc ON pc.product_id = p.id
      WHERE p.status IN ('active', 'sold')
        AND (p.is_universal = 1 OR p.vm_maker = ? OR pc.vm_maker = ?)
        AND (p.is_universal = 1 OR p.vm_model = ? OR pc.vm_model = ?)
      ORDER BY p.is_universal ASC, p.created_at DESC LIMIT 8
    `).bind(maker, maker, model, model).all()

    const condMap: Record<string,string> = { new:'新品', like_new:'未使用に近い', good:'良好', fair:'やや傷あり', poor:'状態不良' }
    productsHtml = prods.results.map((p: any) => {
      const priceTaxIncluded = Math.floor(Number(p.price || 0) * 1.1).toLocaleString()
      const cond = condMap[p.condition] || p.condition || '中古'
      const safeTitle = String(p.title || '').replace(/</g, '&lt;')
      const imgUrl = p.image_url ? '/r2/' + p.image_url : '/icons/icon.svg'
      const soldBadge = p.status === 'sold' ? '<div style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.7);color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;">SOLD</div>' : ''
      const shippingBadge = p.shipping_type === 'seller_paid'
        ? '<span style="font-size:9px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:4px;font-weight:600;">送料込</span>'
        : '<span style="font-size:9px;background:#dbeafe;color:#1d4ed8;padding:1px 5px;border-radius:4px;font-weight:600;">着払い</span>'
      const universalBadge = p.is_universal ? '<span style="font-size:9px;background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-weight:600;margin-left:3px;">汎用品</span>' : ''
      return '<a href="/products/' + p.id + '" class="product-card" style="position:relative;">' + soldBadge + '<div class="product-img-wrap"><img src="' + imgUrl + '" alt="' + safeTitle + '" class="product-img" loading="lazy"></div><div class="product-info"><p class="product-title">' + safeTitle + '</p><p class="product-price">&yen;' + priceTaxIncluded + '<span style="font-size:10px;font-weight:400;color:#6b7280;margin-left:2px;">税込</span><span class="product-cond">' + cond + '</span></p><div style="margin-top:4px;">' + shippingBadge + universalBadge + '</div></div></a>'
    }).join('')
  } catch(e) { console.error('Vehicle products error:', e) }

  // 同メーカー他車種
  let sameMakerHtml = ''
  try {
    const { results: sameModels } = await DB.prepare(`
      SELECT DISTINCT model FROM vehicle_master WHERE maker = ? AND model != ? ORDER BY model ASC LIMIT 20
    `).bind(maker, model).all()
    sameMakerHtml = sameModels.map((m: any) =>
      '<a href="/vehicle/' + encodeURIComponent(maker) + '/' + encodeURIComponent(m.model) + '" class="nearby-link">' + m.model + '</a>'
    ).join('')
  } catch(e) {}

  // グレード・タイヤサイズテーブル
  const uniqueGrades = grades.filter((g: any) => g.grade_name)
  const hasTireData = grades.some((g: any) => g.tire_size)
  let gradeTableHtml = ''
  if (uniqueGrades.length > 0) {
    let rows = uniqueGrades.map((g: any) => {
      const ts = g.tire_size || '-'
      const dt = g.drive_type || '-'
      return '<tr><td class="grade-cell">' + g.grade_name + '</td><td class="drive-cell">' + dt + '</td><td class="tire-cell">' + ts + '</td></tr>'
    }).join('')
    gradeTableHtml = `
      <div class="overflow-x-auto">
        <table class="grade-table">
          <thead><tr><th>グレード</th><th>駆動方式</th><th>タイヤサイズ</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }

  // 商品検索URL
  const searchUrl = '/search?vm_maker=' + encodeURIComponent(maker) + '&vm_model=' + encodeURIComponent(model)

  const safeModel = model.replace(/</g, '&lt;')
  const safeMaker = maker.replace(/</g, '&lt;')
  const descText = richData ? richData.desc : safeMaker + ' ' + safeModel + 'のグレード・タイヤサイズ情報と、適合する中古パーツを検索できます。'
  const keywordsHtml = richData ? richData.keywords.map(k => '<span class="keyword-tag">' + k + '</span>').join('') : ''

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeMaker} ${safeModel}のパーツ・整備ガイド - PARTS HUB</title>
    <meta name="description" content="${safeMaker} ${safeModel}の整備・交換パーツガイド。${uniqueGrades.length}グレード収録。適合する中古パーツを検索できます。">
    <link rel="canonical" href="https://parts-hub-tci.com/vehicle/${encodeURIComponent(maker)}/${encodeURIComponent(model)}">
    ${hreflang("/vehicle/" + encodeURIComponent(maker) + "/" + encodeURIComponent(model))}
    <meta property="og:type" content="article">
    <meta property="og:title" content="${safeMaker} ${safeModel}のパーツ・整備ガイド - PARTS HUB">
    <meta property="og:description" content="${safeModel}の${uniqueGrades.length}グレード情報と適合パーツ検索">
    <meta property="og:url" content="https://parts-hub-tci.com/vehicle/${encodeURIComponent(maker)}/${encodeURIComponent(model)}">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta property="og:locale" content="ja_JP">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeMaker} ${safeModel}のパーツ・整備ガイド">
    <meta name="robots" content="${productCount > 0 ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, follow'}">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": maker + ' ' + model + 'のパーツ・整備ガイド',
      "description": descText,
      "url": 'https://parts-hub-tci.com/vehicle/' + encodeURIComponent(maker) + '/' + encodeURIComponent(model),
      "publisher": { "@type": "Organization", "name": "PARTS HUB", "url": "https://parts-hub-tci.com/" },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": "車種別パーツガイド", "item": "https://parts-hub-tci.com/vehicle" },
          { "@type": "ListItem", "position": 3, "name": maker, "item": "https://parts-hub-tci.com/vehicle/" + encodeURIComponent(maker) },
          { "@type": "ListItem", "position": 4, "name": maker + ' ' + model }
        ]
      },
      "about": {
        "@type": "Vehicle",
        "name": model,
        "manufacturer": { "@type": "Organization", "name": maker },
        "vehicleConfiguration": uniqueGrades.length + 'グレード' + (hasTireData ? ' / タイヤサイズ情報あり' : ''),
        ...(driveTypes.length > 0 ? { "driveWheelConfiguration": driveTypes.join(' / ') } : {})
      },
      "mainEntity": {
        "@type": "ItemList",
        "name": maker + ' ' + model + 'のグレード一覧',
        "numberOfItems": uniqueGrades.length,
        "itemListElement": uniqueGrades.slice(0, 20).map((g: any, i: number) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": g.grade_name + (g.drive_type ? ' (' + g.drive_type + ')' : '') + (g.tire_size ? ' - ' + g.tire_size : '')
        }))
      }
    })}</script>
    ${productCount > 0 ? '<script type="application/ld+json">' + JSON.stringify({
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      "name": maker + ' ' + model + '用の中古パーツ',
      "numberOfItems": productCount,
      "url": 'https://parts-hub-tci.com/search?vm_maker=' + encodeURIComponent(maker) + '&vm_model=' + encodeURIComponent(model),
      "itemListOrder": "https://schema.org/ItemListUnordered"
    }) + '</script>' : ''}
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Noto Sans JP', sans-serif; }
      .hero-vehicle { background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%); }
      .spec-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .spec-label { font-size: 12px; color: #94a3b8; width: 90px; flex-shrink: 0; }
      .spec-value { font-size: 14px; font-weight: 600; color: white; }
      .section-heading { font-size: 17px; font-weight: 700; color: #1f2937; position: relative; padding-left: 14px; }
      .section-heading::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 3px; background: linear-gradient(180deg, #ef4444, #f97316); border-radius: 2px; }
      @media (min-width: 640px) { .section-heading { font-size: 20px; padding-left: 16px; } .section-heading::before { width: 4px; } }
      .keyword-tag { display: inline-block; padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; margin: 3px; }
      .product-card { display: block; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; text-decoration: none; transition: all 0.2s; }
      .product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
      .product-img-wrap { aspect-ratio: 1; overflow: hidden; background: #f9fafb; }
      .product-img { width: 100%; height: 100%; object-fit: cover; }
      .product-info { padding: 10px; }
      .product-title { font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
      .product-price { font-size: 14px; font-weight: 800; color: #dc2626; margin-top: 4px; }
      .product-cond { font-size: 10px; font-weight: 400; color: #9ca3af; margin-left: 6px; }
      @media (min-width: 640px) { .product-card { border-radius: 12px; } .product-info { padding: 12px; } .product-title { font-size: 13px; min-height: 36px; } .product-price { font-size: 16px; margin-top: 6px; } .product-cond { font-size: 11px; margin-left: 8px; } }
      .nearby-link { display: inline-block; padding: 7px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; color: #374151; font-size: 13px; font-weight: 500; text-decoration: none; transition: all 0.15s; margin: 2px; }
      .nearby-link:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
      .info-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; }
      .cta-section { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
      .grade-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .grade-table th { background: #f9fafb; padding: 10px 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 12px; white-space: nowrap; }
      .grade-table td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
      .grade-table tr:hover td { background: #fefce8; }
      .grade-cell { font-weight: 600; color: #1f2937; }
      .drive-cell { font-size: 12px; }
      .tire-cell { font-size: 12px; font-family: monospace; }
      .product-count-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; background: #dc2626; color: white; font-size: 14px; font-weight: 700; border-radius: 50px; text-decoration: none; transition: all 0.2s; box-shadow: 0 2px 8px rgba(220,38,38,0.3); }
      .product-count-badge:hover { background: #b91c1c; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(220,38,38,0.4); }
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/vehicle/${encodeURIComponent(maker)}" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">${safeMaker}</span></a>
            <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
            <a href="${searchUrl}" class="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"><i class="fas fa-search mr-1"></i>パーツ検索</a>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'車種別パーツガイド',url:'/vehicle'},{name:safeMaker,url:'/vehicle/'+encodeURIComponent(maker)},{name:safeModel}])}

    <section class="hero-vehicle text-white py-10 sm:py-14">
        <div class="max-w-4xl mx-auto px-4">
            <div class="text-center mb-6">
                <div class="inline-block px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full tracking-wider mb-4">${safeMaker}${driveTypes.length > 0 ? ' / ' + driveTypes.join('・') : ''}</div>
                <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">${safeMaker} ${safeModel}</h1>
                <p class="text-slate-400 text-sm">${uniqueGrades.length}グレード収録${hasTireData ? ' / タイヤサイズ情報あり' : ''}</p>
            </div>
            <div class="max-w-md mx-auto">
                <div class="spec-item"><span class="spec-label">メーカー</span><span class="spec-value">${safeMaker}</span></div>
                <div class="spec-item"><span class="spec-label">車種名</span><span class="spec-value">${safeModel}</span></div>
                <div class="spec-item"><span class="spec-label">グレード数</span><span class="spec-value">${uniqueGrades.length}</span></div>
                ${driveTypes.length > 0 ? '<div class="spec-item"><span class="spec-label">駆動方式</span><span class="spec-value">' + driveTypes.join(' / ') + '</span></div>' : ''}
                <div class="spec-item" style="border-bottom:none"><span class="spec-label">適合パーツ</span><span class="spec-value">${productCount > 0 ? productCount + '件出品中' : '出品を待つ'}</span></div>
            </div>
            ${productCount > 0 ? '<div class="text-center mt-6"><a href="' + searchUrl + '" class="product-count-badge"><i class="fas fa-search"></i>' + safeModel + 'の適合パーツ ' + productCount + '件を見る</a></div>' : ''}
        </div>
    </section>

    <main class="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        ${richData ? '<section class="mb-12"><h2 class="section-heading mb-6">整備・パーツの特徴</h2><div class="info-card"><p class="text-sm text-gray-700 leading-relaxed">' + richData.desc + '</p></div></section>' : ''}

        ${keywordsHtml ? '<section class="mb-12"><h2 class="section-heading mb-6">よく交換されるパーツ</h2><div class="flex flex-wrap">' + keywordsHtml + '</div><div class="mt-4"><a href="' + searchUrl + '" class="inline-flex items-center text-sm text-red-500 font-semibold hover:underline">' + safeModel + 'の適合パーツを検索する<i class="fas fa-chevron-right ml-1 text-xs"></i></a></div></section>' : ''}

        ${gradeTableHtml ? '<section class="mb-12"><h2 class="section-heading mb-6">グレード・タイヤサイズ一覧</h2><div class="info-card p-0 sm:p-0" style="padding:0;overflow:hidden;">' + gradeTableHtml + '</div></section>' : ''}

        ${productsHtml ? '<section class="mb-12"><div class="flex items-center justify-between mb-6"><h2 class="section-heading">この車種の出品パーツ</h2><a href="' + searchUrl + '" class="text-sm text-red-500 font-semibold hover:underline">すべて見る<i class="fas fa-chevron-right ml-1 text-xs"></i></a></div><div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">' + productsHtml + '</div></section>' : '<section class="mb-12"><h2 class="section-heading mb-6">この車種の出品パーツ</h2><div class="info-card text-center py-10"><div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-box-open text-gray-300 text-2xl"></i></div><p class="text-gray-700 font-semibold mb-1">' + safeModel + 'の中古パーツは準備中です</p><p class="text-gray-400 text-xs mb-5">商品が登録され次第、こちらに掲載されます。<br>お持ちのパーツがあれば出品もお待ちしています。</p><div class="flex flex-col sm:flex-row gap-3 justify-center"><a href="/listing" class="inline-block px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors"><i class="fas fa-plus mr-1"></i>パーツを出品する</a><a href="/search" class="inline-block px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 font-semibold rounded-lg text-sm transition-colors"><i class="fas fa-search mr-1"></i>他の車種で探す</a></div></div></section>'}

        <section class="mb-12">
            <h2 class="section-heading mb-6">PARTS HUBで中古パーツを探すメリット</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="info-card text-center"><div class="text-2xl font-black text-red-500 mb-2">0円</div><p class="text-xs text-gray-500">出品手数料</p></div>
                <div class="info-card text-center"><div class="text-2xl font-black text-red-500 mb-2">10%</div><p class="text-xs text-gray-500">販売手数料（出品者負担）</p></div>
                <div class="info-card text-center"><div class="text-2xl font-black text-red-500 mb-2">Stripe</div><p class="text-xs text-gray-500">安全なエスクロー決済</p></div>
            </div>
        </section>

        ${sameMakerHtml ? '<section class="mb-12"><h2 class="section-heading mb-6">' + safeMaker + 'の他の車種</h2><div class="flex flex-wrap">' + sameMakerHtml + '</div></section>' : ''}
    </main>

    <section class="cta-section text-white py-14 sm:py-20">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-xl sm:text-2xl font-bold mb-4">${safeModel}のパーツをお探しですか？</h2>
            <p class="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">PARTS HUBなら全国の整備工場が出品する中古・リビルトパーツから、<br class="hidden sm:block">お探しの${safeModel}用パーツが見つかるかもしれません。</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="${searchUrl}" class="inline-block px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-base shadow-lg shadow-red-500/20"><i class="fas fa-search mr-2"></i>${safeModel}の適合パーツを検索</a>
                <a href="/listing" class="inline-block px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-base border border-white/20"><i class="fas fa-plus mr-2"></i>パーツを出品する</a>
            </div>
        </div>
    </section>

    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
})

// ========================================
// 整備団体向けパートナーLP（/partner）
// ========================================

const PARTNERS: Record<string, {
  name: string; abbr: string; fullName: string; type: string;
  memberCount: string; desc: string; targetAudience: string;
  benefits: { icon: string; title: string; text: string }[];
  stats: { label: string; value: string }[];
  useCases: { title: string; text: string }[];
}> = {
  'jaspa': {
    name: '自動車整備振興会',
    abbr: 'JASPA',
    fullName: '一般社団法人 日本自動車整備振興会連合会',
    type: '振興会',
    memberCount: '約92,000事業場',
    desc: '全国の自動車整備振興会の会員工場向けに、パーツ調達コスト削減と余剰在庫の収益化を支援します。日整連加盟の整備工場が安心して利用できるプラットフォームです。',
    targetAudience: '振興会加盟の認証工場・指定工場',
    benefits: [
      { icon: 'fa-yen-sign', title: '仕入れコスト平均30〜60%削減', text: '純正品・社外品を全国の整備工場から直接調達。部品商経由の中間マージンをカット。' },
      { icon: 'fa-warehouse', title: '余剰在庫の即時現金化', text: '車検用に仕入れたが不要になった部品、廃車取り外しパーツを全国に販売。在庫保有コスト年間15〜25%を削減。' },
      { icon: 'fa-shield-alt', title: '安心の取引保証', text: 'Stripe決済・エスクロー方式で代金を保全。会員同士の信頼性の高い取引を実現。' },
      { icon: 'fa-truck', title: '全国配送ネットワーク', text: 'ヤマト・佐川・西濃・福山の主要運送会社対応。大型部品のパレット配送も可能。' }
    ],
    stats: [
      { label: '全国整備事業場数', value: '92,000+' },
      { label: '整備士数', value: '333,000+人' },
      { label: '業界総売上高', value: '6.6兆円' },
      { label: 'PARTS HUB手数料', value: '10%のみ' }
    ],
    useCases: [
      { title: '緊急パーツ調達', text: '車検期限が迫る中、ディーラー取り寄せでは間に合わないケースで、PARTS HUBなら在庫を持つ工場から即日出荷のパーツを見つけられます。' },
      { title: '専用工具(SST)のシェア', text: '年に数回しか使わない高額SSTを、必要な時だけ中古で調達。使い終わったら再出品して次の工場へ。' },
      { title: '廃業工場の在庫一括処分', text: '代理出品サービスを活用して、閉業する工場の在庫を一括で出品。スタッフが訪問して撮影・出品を代行します。' }
    ]
  },
  'jasca': {
    name: '自動車整備商工組合',
    abbr: 'JASCA',
    fullName: '日本自動車整備商工組合連合会（整商連）',
    type: '商工組合',
    memberCount: '全国46都府県組合',
    desc: '整商連加盟の中小整備事業者向けに、経営改善と収益向上を支援するパーツ売買プラットフォームです。組合員同士のパーツ流通で仕入れコストを最適化できます。',
    targetAudience: '商工組合加盟の中小整備事業者',
    benefits: [
      { icon: 'fa-handshake', title: '中小事業者に最適な仕入れ', text: '大量仕入れが難しい中小工場でも、必要な分だけ適正価格で調達。少量多品種の仕入れニーズに対応。' },
      { icon: 'fa-chart-line', title: '経営改善に直結', text: '仕入れコスト削減＋余剰在庫の売却で、キャッシュフローを改善。年間数十万円の経費削減を実現した工場も。' },
      { icon: 'fa-mobile-alt', title: 'スマホで簡単出品', text: '写真を撮って数分で出品完了。ITに不慣れなスタッフでも直感的に操作できるシンプルUI。' },
      { icon: 'fa-users', title: '全国の工場とつながる', text: '地域の部品商だけでなく、全国92,000の整備工場が取引相手に。売れ残りリスクを大幅に低減。' }
    ],
    stats: [
      { label: '加盟組合数', value: '46組合' },
      { label: '中小事業者比率', value: '約85%' },
      { label: '出品手数料', value: '0円' },
      { label: '販売手数料', value: '10%のみ' }
    ],
    useCases: [
      { title: '組合内でのパーツ共有', text: '近隣の組合員同士で在庫情報を共有。「うちに余っているパーツが隣の工場で必要」というマッチングを実現。' },
      { title: '共同仕入れの代替手段', text: '共同購入では最低ロットが大きすぎる場合、PARTS HUBで必要な分だけ調達。無駄な在庫を持たない経営へ。' },
      { title: '技術情報の共有', text: 'チャット機能を活用して、パーツの適合確認や整備のコツを出品者に質問。同業者ならではの実践的アドバイスを得られます。' }
    ]
  },
  'body-shop': {
    name: '車体整備事業者',
    abbr: '鈑金塗装',
    fullName: '自動車車体整備事業者・鈑金塗装工場',
    type: '車体整備',
    memberCount: '全国約15,000事業場',
    desc: '鈑金塗装・車体整備を行う事業者向けに、外装パーツの調達コスト削減を支援します。ドアパネル、バンパー、ライト類など、車体修理に必要なパーツを全国から調達できます。',
    targetAudience: '鈑金塗装工場・車体整備事業者',
    benefits: [
      { icon: 'fa-car-crash', title: '外装パーツの豊富な在庫', text: 'ドア・バンパー・フェンダー・ボンネット・テールランプなど、車体修理で需要の高いパーツが多数出品されています。' },
      { icon: 'fa-palette', title: '色付きパーツで工程短縮', text: '同色のパーツを見つければ再塗装が不要に。作業時間と塗料コストを大幅に削減できます。' },
      { icon: 'fa-search', title: '車種・型式で簡単検索', text: '車種名や型式番号で検索して、適合パーツをすぐに見つけられます。品番検索にも対応。' },
      { icon: 'fa-hand-holding-usd', title: '保険修理の利益率向上', text: '修理見積もりと実際のパーツ調達コストの差額を最大化。中古パーツ活用で利益率を改善。' }
    ],
    stats: [
      { label: '車体整備工場数', value: '15,000+' },
      { label: '外装パーツ比率', value: '出品の約40%' },
      { label: '平均調達削減率', value: '40〜70%' },
      { label: '送料', value: '出品者負担 or 着払い（出品時選択）' }
    ],
    useCases: [
      { title: '事故車修理のコスト削減', text: '保険会社の見積もりでは新品パーツ代が計上されますが、中古パーツを活用すれば差額が利益に。お客様の自己負担軽減にもつながります。' },
      { title: '同色パーツの調達', text: '再塗装なしで交換可能な同色パーツを検索。色番号と車種名で絞り込み、チャットで色味を確認してから購入できます。' },
      { title: '廃車からのパーツ販売', text: '修理不能と判断した事故車から取り外した良品パーツを出品。廃車処理費用の一部を回収できます。' }
    ]
  },
  'denso-seibi': {
    name: '自動車電装整備事業者',
    abbr: '電装整備',
    fullName: '全国自動車電装品整備商工組合連合会',
    type: '電装整備',
    memberCount: '全国約3,500事業場',
    desc: 'カーエアコン・オルタネーター・スターター・ECU等の電装品を専門に扱う整備事業者向けに、リビルト電装品の調達と不要電装品の販売を支援します。',
    targetAudience: '電装品整備専門事業者・電装品取扱工場',
    benefits: [
      { icon: 'fa-bolt', title: 'リビルト電装品の豊富な品揃え', text: 'オルタネーター、スターター、コンプレッサー等のリビルト品を、新品の50〜70%の価格で調達可能。' },
      { icon: 'fa-microchip', title: 'ECU・センサー類の調達', text: '新品では高額なECU・各種センサーの中古品を全国から検索。適合確認はチャットで出品者に直接質問可能。' },
      { icon: 'fa-recycle', title: 'コア返却不要', text: 'リビルトメーカーへのコア返却が不要な場合も。出品者との条件交渉で柔軟な取引が可能です。' },
      { icon: 'fa-tools', title: '診断機・テスターの売買', text: '高額な電装系診断機やテスターの中古品も出品。設備投資コストを抑えて最新機器を導入。' }
    ],
    stats: [
      { label: '電装品整備事業場数', value: '3,500+' },
      { label: '電装品リビルト品', value: '出品多数' },
      { label: 'ECU・センサー', value: '常時出品' },
      { label: '販売手数料', value: '10%のみ' }
    ],
    useCases: [
      { title: 'エアコン修理のコスト削減', text: 'コンプレッサーやエバポレーター等の高額部品をリビルト品で調達し、修理コストを50%以上削減。' },
      { title: '旧車の電装品確保', text: '生産終了した旧車の電装品は新品入手が困難。PARTS HUBで全国の在庫から必要な電装品を見つけられます。' },
      { title: '取り外し電装品の販売', text: '交換で取り外した動作品のオルタネーター・スターターを出品。修理のコア材料として需要があります。' }
    ]
  },
  'parts-dealer': {
    name: '自動車部品卸商',
    abbr: '部品商',
    fullName: '全日本自動車部品卸商協同組合',
    type: '部品販売',
    memberCount: '全国約5,000事業者',
    desc: '自動車部品の卸売・小売を行う事業者向けに、新たな販売チャネルとしてPARTS HUBを活用いただけます。在庫の回転率向上と販路拡大を支援します。',
    targetAudience: '部品卸売業者・小売業者・パーツ販売店',
    benefits: [
      { icon: 'fa-store', title: '全国への販路拡大', text: '地域限定の営業圏を全国に拡大。これまでリーチできなかった遠方の整備工場にもパーツを販売可能。' },
      { icon: 'fa-boxes', title: '滞留在庫の収益化', text: '長期在庫や動きの遅い品番を全国市場に出品。地域では売れにくいパーツも、全国なら需要が見つかります。' },
      { icon: 'fa-tags', title: '出品無料・成功報酬型', text: '出品にかかる費用はゼロ。売れた時だけ出品者が10%の手数料を負担。購入者の手数料は無料。リスクなく新しい販売チャネルを試せます。' },
      { icon: 'fa-truck-loading', title: '代理出品で大量処理', text: '在庫が大量にある場合、代理出品サービスで撮影・出品を一括代行。手間をかけずに販路開拓が可能です。' }
    ],
    stats: [
      { label: '部品卸商数', value: '5,000+' },
      { label: '出品費用', value: '0円' },
      { label: '販売手数料', value: '10%のみ' },
      { label: '代理出品', value: '対応可' }
    ],
    useCases: [
      { title: '品番別の在庫整理', text: '特定車種向けの在庫が余っている場合、品番を明記して出品。全国の整備工場から品番検索でアクセスされます。' },
      { title: 'リビルト品の販売強化', text: '自社リビルト品の販売チャネルとしてPARTS HUBを活用。製品写真と詳細スペックで品質をアピール。' },
      { title: '季節商品の在庫処分', text: 'エアコン関連部品やスタッドレスタイヤなど、季節性の高い在庫をシーズン前に集中出品。' }
    ]
  }
}

// パートナー一覧ページ
app.get('/partner', (c) => {
  let cardsHtml = ''
  for (const [slug, p] of Object.entries(PARTNERS)) {
    cardsHtml += '<a href="/partner/' + slug + '" class="partner-card group">' +
      '<div class="flex items-start gap-4">' +
      '<div class="w-14 h-14 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0 group-hover:from-red-100 group-hover:to-red-200 transition-colors">' +
      '<span class="text-red-500 font-bold text-xs">' + p.abbr + '</span></div>' +
      '<div class="min-w-0 flex-1">' +
      '<div class="flex items-center gap-2 mb-1"><span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">' + p.type + '</span>' +
      '<span class="text-xs text-gray-400">' + p.memberCount + '</span></div>' +
      '<h3 class="font-bold text-gray-900 text-base mb-1 group-hover:text-red-600 transition-colors">' + p.name + '</h3>' +
      '<p class="text-sm text-gray-500 leading-relaxed line-clamp-2">' + p.desc.slice(0, 80) + '...</p>' +
      '</div>' +
      '<i class="fas fa-chevron-right text-gray-300 group-hover:text-red-400 transition-colors mt-4 flex-shrink-0"></i>' +
      '</div></a>'
  }

  return c.html('<!DOCTYPE html><html lang="ja"><head>' +
    '<meta charset="UTF-8"><meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>パートナー（整備団体向け） - PARTS HUB（パーツハブ）</title>' +
    '<meta name="description" content="PARTS HUBは全国の自動車整備振興会、商工組合、車体整備、電装整備事業者、部品卸商向けにパーツ調達コスト削減と余剰在庫の収益化を支援するプラットフォームです。">' +
    '<link rel="canonical" href="https://parts-hub-tci.com/partner">' +
    hreflang('/partner') +
    '<meta property="og:title" content="パートナー（整備団体向け） - PARTS HUB">' +
    '<meta property="og:description" content="自動車整備振興会・商工組合・車体整備事業者向けのパーツ売買プラットフォーム">' +
    '<meta property="og:url" content="https://parts-hub-tci.com/partner">' +
    '<meta property="og:site_name" content="PARTS HUB"><meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">' +
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"PARTS HUB","item":"https://parts-hub-tci.com/"},{"@type":"ListItem","position":2,"name":"パートナー"}]}</script>' +
    '<meta name="theme-color" content="#ff4757">' +
    '<link rel="stylesheet" href="/static/tailwind.css?v=' + BUILD_VERSION + '">' +
    '<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">' +
    '<style>' +
    'body{font-family:"Noto Sans JP",sans-serif}' +
    '.partner-card{display:block;background:white;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #f3f4f6;text-decoration:none;transition:all 0.2s}' +
    '.partner-card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.1);transform:translateY(-2px)}' +
    '.hero-gradient{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)}' +
    '.line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
    '</style></head>' +
    '<body class="bg-gray-50 min-h-screen">' +
    '<header class="bg-white border-b border-gray-200 sticky top-0 z-50">' +
    '<div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">' +
    '<a href="/" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">トップ</span></a>' +
    '<a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>' +
    '<div class="w-16"></div></div></header>' +
    breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'パートナー'}]) +
    '<div class="hero-gradient text-white py-12 sm:py-16"><div class="max-w-5xl mx-auto px-4 text-center">' +
    '<div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4"><i class="fas fa-handshake text-2xl text-red-400"></i></div>' +
    '<h1 class="text-2xl sm:text-3xl font-bold mb-3">パートナープログラム</h1>' +
    '<p class="text-gray-300 text-sm sm:text-base max-w-xl mx-auto">全国の自動車整備団体・事業者団体向けに、PARTS HUBを活用した<br class="hidden sm:inline">パーツ調達コスト削減と余剰在庫の収益化を支援します。</p>' +
    '</div></div>' +
    '<main class="max-w-5xl mx-auto px-4 py-8 sm:py-12">' +
    '<div class="mb-8 text-center"><p class="text-sm text-gray-500">対象団体を選択してください</p></div>' +
    '<div class="grid grid-cols-1 gap-4">' + cardsHtml + '</div>' +
    '<div class="mt-12 bg-white rounded-2xl p-8 sm:p-10 text-center shadow-sm border border-gray-100">' +
    '<h2 class="text-xl font-bold text-gray-900 mb-3">団体・組合単位でのご導入について</h2>' +
    '<p class="text-gray-600 text-sm mb-6 max-w-lg mx-auto">組合員への一括案内、専用ページの作成、説明会の実施など、団体単位でのPARTS HUB導入をサポートいたします。まずはお気軽にご相談ください。</p>' +
    '<div class="flex flex-col sm:flex-row gap-3 justify-center">' +
    '<a href="/contact" class="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-3.5 rounded-xl font-bold transition-colors text-sm"><i class="fas fa-envelope mr-2"></i>お問い合わせ</a>' +
    '<a href="tel:06-6151-3697" class="inline-block bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl font-bold transition-colors text-sm"><i class="fas fa-phone mr-2"></i>06-6151-3697</a>' +
    '</div></div></main>' +
    Footer() +
    '<script src="' + v('/static/auth-header.js') + '"></script>' +
    '<script src="' + v('/static/notification-badge.js') + '"></script>' +
    '</body></html>')
})

// パートナー個別LP
app.get('/partner/:slug', (c) => {
  const slug = c.req.param('slug')
  const p = PARTNERS[slug]
  if (!p) return c.redirect('/partner', 302)

  let benefitsHtml = ''
  for (const b of p.benefits) {
    benefitsHtml += '<div class="benefit-card"><div class="benefit-icon"><i class="fas ' + b.icon + '"></i></div>' +
      '<h3 class="font-bold text-gray-900 mb-2">' + b.title + '</h3>' +
      '<p class="text-sm text-gray-600 leading-relaxed">' + b.text + '</p></div>'
  }

  let statsHtml = ''
  for (const s of p.stats) {
    statsHtml += '<div class="stat-card"><div class="stat-value">' + s.value + '</div>' +
      '<div class="stat-label">' + s.label + '</div></div>'
  }

  let useCasesHtml = ''
  for (let i = 0; i < p.useCases.length; i++) {
    const uc = p.useCases[i]
    useCasesHtml += '<div class="usecase-card"><div class="usecase-num">' + (i + 1) + '</div>' +
      '<div><h3 class="font-bold text-gray-900 mb-2">' + uc.title + '</h3>' +
      '<p class="text-sm text-gray-600 leading-relaxed">' + uc.text + '</p></div></div>'
  }

  let stepsHtml = '<div class="step-card"><div class="step-num">1</div><div><h4 class="font-bold text-gray-900 mb-1">無料会員登録</h4><p class="text-sm text-gray-600">メールアドレスだけで簡単登録。最短1分で完了します。</p></div></div>' +
    '<div class="step-card"><div class="step-num">2</div><div><h4 class="font-bold text-gray-900 mb-1">商品を検索 / 出品</h4><p class="text-sm text-gray-600">必要なパーツを検索して購入、または余剰在庫を出品して販売。</p></div></div>' +
    '<div class="step-card"><div class="step-num">3</div><div><h4 class="font-bold text-gray-900 mb-1">安心の取引</h4><p class="text-sm text-gray-600">チャットで出品者と直接やり取り。Stripe決済で安全にお支払い。</p></div></div>' +
    '<div class="step-card"><div class="step-num">4</div><div><h4 class="font-bold text-gray-900 mb-1">配送・受取完了</h4><p class="text-sm text-gray-600">追跡番号付きで全国配送。受取確認で取引完了。</p></div></div>'

  return c.html('<!DOCTYPE html><html lang="ja"><head>' +
    '<meta charset="UTF-8"><meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + p.name + '向け パーツ売買プラットフォーム - PARTS HUB（パーツハブ）</title>' +
    '<meta name="description" content="' + p.desc.slice(0, 140) + '">' +
    '<link rel="canonical" href="https://parts-hub-tci.com/partner/' + slug + '">' +
    hreflang('/partner/' + slug) +
    '<meta property="og:title" content="' + p.name + '向け - PARTS HUB">' +
    '<meta property="og:description" content="' + p.desc.slice(0, 120) + '">' +
    '<meta property="og:url" content="https://parts-hub-tci.com/partner/' + slug + '">' +
    '<meta property="og:site_name" content="PARTS HUB"><meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">' +
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + p.name + '向け - PARTS HUB">' +
    '<meta name="theme-color" content="#ff4757">' +
    '<link rel="stylesheet" href="/static/tailwind.css?v=' + BUILD_VERSION + '">' +
    '<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">' +
    '<style>' +
    'body{font-family:"Noto Sans JP",sans-serif}' +
    '.hero-gradient{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)}' +
    '.benefit-card{background:white;border-radius:16px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #f3f4f6;transition:all 0.2s}' +
    '.benefit-card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.08);transform:translateY(-2px)}' +
    '.benefit-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#fef2f2,#fee2e2);color:#ef4444;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px}' +
    '.stat-card{background:white;border-radius:16px;padding:24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #f3f4f6}' +
    '.stat-value{font-size:28px;font-weight:900;color:#1f2937;line-height:1.2}' +
    '.stat-label{font-size:12px;color:#9ca3af;margin-top:4px;font-weight:500}' +
    '.usecase-card{display:flex;gap:16px;padding:24px;background:white;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #f3f4f6}' +
    '.usecase-num{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}' +
    '.step-card{display:flex;gap:16px;align-items:flex-start;padding:20px 24px;background:white;border-radius:12px;border-left:3px solid #ef4444}' +
    '.step-num{width:32px;height:32px;border-radius:50%;background:#fef2f2;color:#ef4444;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}' +
    '.cta-section{background:linear-gradient(135deg,#1e293b 0%,#0f172a 50%,#1e293b 100%);position:relative;overflow:hidden}' +
    '.cta-section::before{content:"";position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(239,68,68,0.08) 0%,transparent 50%)}' +
    BREADCRUMB_CSS +
    '</style></head>' +
    '<body class="bg-gray-50 min-h-screen">' +
    '<header class="bg-white border-b border-gray-200 sticky top-0 z-50">' +
    '<div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">' +
    '<a href="/partner" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">パートナー一覧</span></a>' +
    '<a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>' +
    '<div class="w-16"></div></div></header>' +
    breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'パートナー',url:'/partner'},{name:p.name}]) +

    // Hero
    '<div class="hero-gradient text-white py-12 sm:py-16"><div class="max-w-5xl mx-auto px-4">' +
    '<div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">' +
    '<div class="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0"><span class="text-red-400 font-bold text-sm">' + p.abbr + '</span></div>' +
    '<div class="text-center sm:text-left">' +
    '<div class="flex flex-wrap justify-center sm:justify-start gap-2 mb-3"><span class="text-xs px-3 py-1 bg-white/10 rounded-full">' + p.type + '</span><span class="text-xs px-3 py-1 bg-white/10 rounded-full">' + p.memberCount + '</span></div>' +
    '<h1 class="text-2xl sm:text-3xl font-bold mb-3">' + p.name + '向け<br class="sm:hidden">パーツ売買プラットフォーム</h1>' +
    '<p class="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl">' + p.desc + '</p>' +
    '<div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">' +
    '<a href="/register" class="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-3.5 rounded-xl font-bold transition-colors text-sm"><i class="fas fa-user-plus mr-2"></i>無料で会員登録</a>' +
    '<a href="/search" class="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-xl font-bold transition-colors text-sm"><i class="fas fa-search mr-2"></i>商品を探す</a>' +
    '</div></div></div></div></div>' +

    // Stats
    '<div class="max-w-5xl mx-auto px-4 -mt-6"><div class="grid grid-cols-2 sm:grid-cols-4 gap-3">' + statsHtml + '</div></div>' +

    '<main class="max-w-5xl mx-auto px-4 py-10 sm:py-14">' +

    // Benefits
    '<section class="mb-14"><div class="text-center mb-8"><h2 class="text-xl sm:text-2xl font-bold text-gray-900">PARTS HUBが選ばれる理由</h2><p class="text-sm text-gray-500 mt-2">' + p.targetAudience + 'のための4つのメリット</p></div>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' + benefitsHtml + '</div></section>' +

    // Use Cases
    '<section class="mb-14"><div class="text-center mb-8"><h2 class="text-xl sm:text-2xl font-bold text-gray-900">活用事例</h2><p class="text-sm text-gray-500 mt-2">実際の利用シーンをご紹介</p></div>' +
    '<div class="grid grid-cols-1 gap-4">' + useCasesHtml + '</div></section>' +

    // Steps
    '<section class="mb-14"><div class="text-center mb-8"><h2 class="text-xl sm:text-2xl font-bold text-gray-900">ご利用の流れ</h2><p class="text-sm text-gray-500 mt-2">最短1分で利用開始</p></div>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + stepsHtml + '</div></section>' +

    // CTA
    '<section class="cta-section rounded-2xl p-8 sm:p-12 text-center text-white relative">' +
    '<div class="relative z-10">' +
    '<h2 class="text-xl sm:text-2xl font-bold mb-3">今すぐPARTS HUBを始めませんか？</h2>' +
    '<p class="text-gray-300 text-sm mb-8 max-w-md mx-auto">会員登録は無料。出品も無料。売れた時だけ出品者が10%の手数料を負担。購入者の手数料は無料。<br>リスクゼロでパーツの調達コスト削減と在庫の収益化を始められます。</p>' +
    '<div class="flex flex-col sm:flex-row gap-3 justify-center">' +
    '<a href="/register" class="inline-block bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-xl font-bold transition-colors"><i class="fas fa-user-plus mr-2"></i>無料で会員登録</a>' +
    '<a href="/contact" class="inline-block bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-xl font-bold transition-colors border border-white/20"><i class="fas fa-envelope mr-2"></i>お問い合わせ</a>' +
    '</div>' +
    '<p class="text-xs text-gray-400 mt-4">団体・組合単位での導入相談も承ります。お電話: 06-6151-3697</p>' +
    '</div></section>' +

    '</main>' +
    Footer() +
    '<script src="' + v('/static/auth-header.js') + '"></script>' +
    '<script src="' + v('/static/notification-badge.js') + '"></script>' +
    '</body></html>')
})

// ========================================
// 整備ガイド・コスト比較コンテンツ（/guide）
// ========================================
const GUIDES: Record<string, { title: string; desc: string; category: string; sections: { heading: string; body: string }[]; comparison?: { item: string; dealer: string; parts_hub: string; savings: string }[] }> = {
  'brake-pad-cost': {
    title: 'ブレーキパッド交換の費用比較',
    desc: 'ブレーキパッド交換にかかる費用をディーラー・カー用品店・PARTS HUB活用の3パターンで徹底比較。整備工場が仕入れコストを削減する方法を解説します。',
    category: '費用比較',
    sections: [
      { heading: 'ブレーキパッド交換の一般的な費用', body: 'ブレーキパッドの交換は、安全に直結する重要な整備項目です。一般的にフロント左右で部品代5,000円〜20,000円、工賃3,000円〜8,000円が相場です。ディーラーでは純正品を使用するため費用が高くなりがちですが、社外品や中古品を活用することで大幅なコスト削減が可能です。' },
      { heading: 'なぜ整備工場はパーツ仕入れコストに悩むのか', body: '純正部品は品質が保証されている反面、メーカー希望小売価格での仕入れが基本です。特に緊急の修理対応時は、部品商からの即日配送に頼らざるを得ず、割引交渉の余地が少ないのが実情です。PARTS HUBでは全国の整備工場が余剰在庫を出品しているため、純正品を市価より安く入手できる可能性があります。' },
      { heading: '中古・リビルトパーツ活用のメリット', body: '走行距離の少ない車両から取り外されたパーツは、新品と遜色ない性能を持つことが多くあります。特にブレーキキャリパーやローターは、リビルト品でも十分な制動力を発揮します。PARTS HUBでは出品者が状態を明記し、写真で確認できるため、品質に納得した上で購入できます。' }
    ],
    comparison: [
      { item: 'フロントブレーキパッド（純正）', dealer: '12,000〜18,000円', parts_hub: '3,000〜8,000円', savings: '最大60%削減' },
      { item: 'ブレーキローター（フロント左右）', dealer: '20,000〜35,000円', parts_hub: '8,000〜15,000円', savings: '最大55%削減' },
      { item: 'ブレーキキャリパー（リビルト）', dealer: '30,000〜50,000円', parts_hub: '10,000〜25,000円', savings: '最大50%削減' }
    ]
  },
  'genuine-vs-aftermarket': {
    title: '純正品 vs 社外品 徹底比較ガイド',
    desc: '自動車パーツの純正品と社外品、それぞれのメリット・デメリットを整備工場の視点から解説。お客様への提案にも使える実践的な情報をまとめました。',
    category: '比較ガイド',
    sections: [
      { heading: '純正品の特徴と適するケース', body: '純正品はメーカーが品質を保証しており、適合性に問題が生じることはほぼありません。保証期間内の車両や、安全に関わる重要保安部品（ブレーキ系・ステアリング系）には純正品の使用が推奨されます。ディーラー入庫の多い整備工場では、純正品使用がお客様の安心感につながります。' },
      { heading: '社外品の特徴とコストメリット', body: '社外品は純正品の30〜60%の価格で入手できることが多く、整備工場の利益率向上に直結します。近年は社外品の品質も向上しており、消耗品（フィルター類・ベルト類・ワイパー等）では純正品と遜色ない性能のものも増えています。ただし、電装系パーツは互換性の問題が生じやすいため注意が必要です。' },
      { heading: 'PARTS HUBで最適なパーツを見つける', body: 'PARTS HUBでは純正品・社外品の両方が出品されています。チャット機能で出品者に直接質問できるため、適合確認や状態の詳細を事前に把握できます。「必要な時に、必要な品質のパーツを、適正価格で」調達する新しい選択肢として、ぜひご活用ください。' }
    ],
    comparison: [
      { item: 'エアフィルター', dealer: '3,000〜5,000円', parts_hub: '800〜2,000円', savings: '最大70%削減' },
      { item: 'オイルフィルター', dealer: '1,500〜3,000円', parts_hub: '300〜1,000円', savings: '最大80%削減' },
      { item: 'ファンベルト', dealer: '5,000〜10,000円', parts_hub: '2,000〜5,000円', savings: '最大50%削減' }
    ]
  },
  'deadstock-management': {
    title: 'デッドストック（余剰在庫）の活用術',
    desc: '整備工場に眠る余剰パーツを収益化する方法を解説。在庫管理コストの削減と新たな収益源の確保を同時に実現する実践ガイドです。',
    category: '経営改善',
    sections: [
      { heading: 'デッドストックが生まれる原因', body: '整備工場の余剰在庫は、車検対応で取り寄せたが不要になったパーツ、廃車から取り外した良品パーツ、モデルチェンジで適合しなくなった在庫など、日常業務の中で自然に発生します。これらは帳簿上は資産ですが、保管スペースを圧迫し、時間の経過とともに価値が下がるリスクがあります。' },
      { heading: '余剰在庫のコスト計算', body: '在庫を保有するコストは、パーツ代だけではありません。保管スペースの家賃・光熱費、棚卸しの人件費、そして資金が固定されることによる機会損失を含めると、仕入れ値の年間15〜25%が在庫保有コストとして発生していると言われています。1点でも早く現金化することが経営改善の鍵です。' },
      { heading: 'PARTS HUBでの出品のすすめ', body: '出品は無料、写真を撮ってスマホから数分で完了します。全国の整備工場がお客様になるため、地域限定の対面販売よりも圧倒的に売れる可能性が高まります。「売れないかも」と思うパーツも、別の地域では需要があるケースは珍しくありません。まずは在庫棚を見直して、3ヶ月以上動いていないパーツから出品してみてください。' }
    ]
  },
  'sst-tool-guide': {
    title: 'SST（特殊工具）の選び方と調達ガイド',
    desc: 'SST（特殊工具）は高価で使用頻度が限られるケースが多い工具です。新品購入以外の賢い調達方法と、不要SSTの売却について解説します。',
    category: '工具ガイド',
    sections: [
      { heading: 'SSTが必要になるケース', body: 'メーカー指定の特殊工具は、タイミングチェーン交換、ミッション分解、ハブベアリング圧入など、特定の整備作業で必須となります。しかし、年に数回しか使わないSSTを新品で揃えると、工具代だけで数十万円の投資が必要になります。特に新車種対応のSSTは発売直後の価格が高い傾向にあります。' },
      { heading: '中古SSTという選択肢', body: 'SSTは消耗品ではないため、中古品でも機能に問題がないケースがほとんどです。廃業した工場や、取り扱い車種を変更した工場から、良品のSSTが出品されることがあります。PARTS HUBでは工具・SST専用カテゴリがあり、全国の整備工場が出品するSSTを手軽に検索できます。' },
      { heading: '使わなくなったSSTを売る', body: '逆に、自社で不要になったSSTは他の整備工場にとっては貴重な工具です。特にメーカー専用工具は汎用品では代替できないため、必要としている工場は確実に存在します。PARTS HUBで出品すれば、工具棚のスペース確保と収益化を同時に実現できます。' }
    ]
  },
  'google-business-profile': {
    title: 'Googleビジネスプロフィール最適化ガイド【整備工場向け】',
    desc: 'Googleマップで「近くの整備工場」と検索する顧客を集客するために、Googleビジネスプロフィール（旧Googleマイビジネス）を最適化する方法を整備工場向けに解説します。',
    category: 'Web集客',
    sections: [
      { heading: 'なぜGoogleビジネスプロフィールが重要なのか', body: '「近くの整備工場」「車検 〇〇市」などのローカル検索で、Googleマップの上位3件（ローカルパック）に表示されると、問い合わせや来店が大幅に増加します。国土交通省の統計によると、自動車整備工場は全国に約92,000事業場あり、競争は激しいですが、Googleビジネスプロフィール（GBP）を適切に設定している工場は意外と少ないのが現状です。無料で始められ、効果が出やすい集客施策として、今すぐ取り組むことをおすすめします。' },
      { heading: '基本情報を100%埋める', body: '店名・住所・電話番号（NAP情報）は一字一句正確に入力しましょう。住所はWebサイトや看板と完全に一致させることが重要です。次に、営業時間は曜日ごとに設定し、祝日や臨時休業も事前に登録します。カテゴリは「自動車修理店」をメインに、「自動車板金塗装」「自動車電装品店」「自動車部品店」などサブカテゴリも追加してください。電話番号はフリーダイヤルではなく市外局番付きのローカル番号を推奨します（地域性のシグナルになります）。' },
      { heading: '写真を充実させる', body: 'Googleの公式データによると、写真が充実しているビジネスは、写真がないビジネスと比較してウェブサイトへのクリックが35%多く、ルート検索が42%多くなります。外観写真（正面・看板）、内観写真（作業場・待合室）、スタッフ写真、整備作業中の写真、設備（リフト・診断機）の写真を最低10枚は登録しましょう。スマートフォンで十分ですが、明るい時間帯に撮影し、作業場が整理整頓された状態の写真を使いましょう。毎月2〜3枚の新しい写真を追加することで、アクティブなビジネスとしてGoogleに認識されます。' },
      { heading: '口コミを増やす仕組みを作る', body: 'GBPの検索順位に最も影響するのが口コミの数と評価です。車検や修理の完了時にお客様へ口コミを依頼しましょう。具体的には、①会計時にQRコード付きカードを渡す ②完了報告メールに口コミリンクを添付 ③待合室にPOPを設置 といった方法が効果的です。口コミリンクは「Googleマップでお店を検索 → 共有 → リンクをコピー」で取得できます。口コミには必ず返信しましょう。感謝の言葉と具体的な内容への言及が効果的です。低評価の口コミにも丁寧に返信することで、他の閲覧者への印象が良くなります。' },
      { heading: '投稿機能を活用する', body: 'GBPの「投稿」機能を使って、最新情報を定期的に発信しましょう。おすすめの投稿内容は、①季節の整備キャンペーン（夏前のエアコン点検、冬前のバッテリーチェック等） ②お客様の声・施工事例 ③新しい設備や資格取得のお知らせ ④スタッフ紹介 です。投稿は7日間で非表示になるため、週1回のペースで更新するのが理想的です。写真付きの投稿はクリック率が高いため、作業写真やビフォーアフターを積極的に使いましょう。' },
      { heading: 'PARTS HUBと組み合わせた集客戦略', body: 'Googleビジネスプロフィールで新規顧客を獲得し、PARTS HUBで仕入れコストを抑えることで、競争力のある価格で修理サービスを提供できます。「当店はリサイクルパーツも活用し、品質を保ちながらお客様のご負担を軽減しています」という訴求は、コスト意識の高いお客様に響きます。また、PARTS HUBで余剰パーツを販売して得た収益を、GBP広告やGoogle広告の予算に充てるといった相乗効果も期待できます。地域密着の整備工場だからこそ、デジタルとリアルの両面から集客を強化していきましょう。' }
    ]
  },
  'car-inspection-cost': {
    title: '車検整備のパーツ費用を削減する方法',
    desc: '車検時に必要になる消耗部品の仕入れコストを大幅に削減するノウハウ。ブレーキ、ベルト類、フィルター類の賢い調達方法を解説します。',
    category: '費用比較',
    sections: [
      { heading: '車検整備で交換頻度が高いパーツ一覧', body: '車検時に交換が必要になるパーツは、ブレーキパッド・ディスク、ファンベルト・タイミングベルト、エアフィルター・オイルフィルター、ワイパーゴム、ブーツ類（ドライブシャフト・ステアリングラック）、各種オイル・液類です。これらの消耗品は車検ごとに発注するため、仕入れ単価の差が年間を通して大きなコスト差を生みます。例えば月に30台の車検を扱う工場であれば、1台あたり2,000円の仕入れコスト削減で年間72万円の利益向上になります。' },
      { heading: '仕入れルートの多様化で価格競争力を確保', body: '部品商からの仕入れ一択では、価格交渉力に限界があります。PARTS HUBのような中古パーツプラットフォームを2つ目の仕入れルートとして活用することで、①緊急度の低いパーツは安価な中古品を事前に確保 ②定番交換パーツはロットで安く仕入れ ③レアパーツは全国から検索して調達、という使い分けが可能です。特にブーツ類やフィルター類は、中古品でも品質に大差がない場合が多く、コスト削減の効果が高いカテゴリです。' },
      { heading: 'お客様への説明で信頼を獲得', body: '中古パーツやリビルトパーツを使用する場合、お客様への丁寧な説明が不可欠です。「新品パーツの場合は○○円、リサイクルパーツ利用の場合は△△円でご提供できます」と選択肢を提示することで、お客様の満足度が向上します。PARTS HUBで購入したパーツは出品者の状態説明と写真記録が残るため、お客様への説明資料としても活用できます。この透明性が、リピーター獲得と口コミ向上につながります。' }
    ],
    comparison: [
      { item: 'ドライブシャフトブーツ（左右）', dealer: '8,000〜15,000円', parts_hub: '2,000〜5,000円', savings: '最大70%削減' },
      { item: 'ファンベルトセット', dealer: '6,000〜12,000円', parts_hub: '2,000〜5,000円', savings: '最大60%削減' },
      { item: 'ブレーキパッド＋ローターセット', dealer: '30,000〜50,000円', parts_hub: '10,000〜20,000円', savings: '最大60%削減' }
    ]
  },
  'insurance-repair-profit': {
    title: '保険修理の利益率を最大化する方法',
    desc: '保険会社からの修理見積もりと実際の仕入れ原価の差を最大化する戦略。中古パーツ・リビルトパーツ活用で修理利益を向上させるノウハウを解説。',
    category: '経営改善',
    sections: [
      { heading: '保険修理の利益構造を理解する', body: '保険修理では、アジャスターとの協定金額が修理代金となります。この協定金額は基本的に新品純正パーツの価格をベースに算出されるため、実際の修理に中古パーツやリビルトパーツを活用した場合、その差額が利益になります。例えば、フロントバンパーの新品価格が50,000円の場合、中古品を15,000円で調達できれば35,000円の差額が生まれます。もちろん、パーツの品質が修理基準を満たすことが大前提です。' },
      { heading: '中古パーツ活用のポイント', body: '保険修理で中古パーツを活用する際の重要ポイントは、①品質基準の明確化（年式・走行距離・外観状態の基準を社内で設定） ②保険会社との事前合意（中古パーツ使用について了承を得る） ③写真記録の保持（交換前後の状態を必ず記録） ④お客様への同意取得（中古パーツ使用について説明し書面で同意を得る）です。PARTS HUBでは出品者が状態を明記しているため、品質の事前確認が容易です。同色のボディパーツが見つかれば、再塗装コストも削減できます。' },
      { heading: '利益率改善のシミュレーション', body: '月10件の保険修理を扱う鈑金工場の場合、1件あたり平均3万円のパーツコスト削減ができれば、月間30万円・年間360万円の利益向上になります。全ての修理で中古パーツを使えるわけではありませんが、ドアパネル・バンパー・ヘッドライト・テールランプなどの外装パーツは中古品の活用率が高いカテゴリです。PARTS HUBでは車種名や品番で検索できるため、必要なパーツをすぐに見つけられます。仕入れコストを抑えた分をお客様の自己負担額の軽減に充てれば、紹介や口コミにもつながります。' }
    ]
  },
  'ev-hybrid-parts': {
    title: 'EV・ハイブリッド車パーツの取り扱いガイド',
    desc: '増加するEV・ハイブリッド車の整備需要に対応するために。駆動用バッテリー、インバーター、モーター等の調達方法と取り扱い注意点を解説します。',
    category: '技術ガイド',
    sections: [
      { heading: 'EV・HV市場の急拡大と整備需要', body: '2025年時点で、日本の新車販売の約40%がハイブリッド車（HV）、約3%が電気自動車（EV）です。これらの車両が初回車検を迎える時期に入り、整備需要が急増しています。しかし、EV・HVの高圧系パーツは新品価格が非常に高く、駆動用バッテリー交換で30〜80万円、インバーター交換で20〜50万円といった見積もりも珍しくありません。中古パーツやリビルトパーツの活用は、整備工場とお客様の双方にとって大きなメリットがあります。' },
      { heading: '取り扱い時の安全対策', body: 'EV・HVの高圧パーツを取り扱う際は、「低圧電気取扱業務特別教育」の受講が労働安全衛生法で義務付けられています。作業前の高圧遮断（サービスプラグの取り外し）、絶縁手袋・絶縁工具の使用、感電防止の二重確認体制は必須です。PARTS HUBで中古の高圧パーツを購入する際は、出品者に取り外し時の手順や状態を確認し、適合車種（型式・年式）を必ずダブルチェックしてください。安全に関わるパーツは「安い」よりも「確実」を優先しましょう。' },
      { heading: 'リビルトバッテリーという選択肢', body: '駆動用バッテリーの劣化は、セル単位で進行します。リビルトバッテリーは劣化したセルのみを交換し、残りの正常セルを再利用するため、新品の1/3〜1/2の価格で交換が可能です。プリウス（ZVW30/50）やアクア（NHP10）など台数の多い車種はリビルトバッテリーの流通量も多く、PARTS HUBでも常時出品されています。補機バッテリーも専用品が必要な車種が多いため、中古品の需要があります。' },
      { heading: 'PARTS HUBでEV・HVパーツを探す', body: 'PARTS HUBの検索機能では、車種名・型式で絞り込み検索が可能です。「プリウス バッテリー」「アクア インバーター」などで検索すれば、対応するパーツが一覧表示されます。出品者とのチャット機能で、パーツの状態・適合確認・保証の有無を購入前に確認できるため、安心して取引を進められます。EV・HV整備のノウハウと、コスト効率の良いパーツ調達を組み合わせて、新時代の整備需要に対応していきましょう。' }
    ]
  },
  'used-parts-quality': {
    title: '中古パーツの品質見極めガイド',
    desc: '中古パーツの品質を正しく見極めるポイントを解説。外観チェック、動作確認、出品者とのコミュニケーションなど、プロの整備士が知っておくべき知識をまとめました。',
    category: '実践ガイド',
    sections: [
      { heading: '中古パーツの品質グレードを理解する', body: '中古パーツの品質は大きく4段階に分けられます。①Aグレード：走行距離3万km未満、外観に目立つキズ・サビなし、動作確認済み ②Bグレード：走行距離3〜10万km、軽微な使用感あり、動作に問題なし ③Cグレード：走行距離10万km以上、外観の劣化あり、基本機能は動作 ④ジャンク：動作未確認・一部不具合あり、修理素材向け。PARTS HUBでは出品者が状態を明記する仕組みですが、これらのグレード感を自分なりの基準で持っておくと、購入判断がスムーズになります。' },
      { heading: '写真からわかる品質チェックポイント', body: '出品写真で確認すべきポイントは、①品番・ラベルの鮮明さ（新しいほど劣化が少ない傾向） ②接続部・端子部の状態（腐食や変色がないか） ③ゴム部品の硬化・ひび割れ ④オイル漏れや液漏れの痕跡 ⑤ボルト穴周辺の錆や変形です。写真が不十分な場合は、チャット機能で追加写真を依頼しましょう。「品番が見える角度の写真をお願いします」「裏側の写真も見せてください」と具体的にリクエストすることが大切です。' },
      { heading: '到着後の検品と万が一の対処', body: 'パーツが届いたら、まず出品情報と実物を照合します。品番確認、外観状態の確認、動作確認（電装品の場合）を行い、問題があれば7日以内に連絡しましょう。PARTS HUBでは「商品説明と著しく異なる場合」「初期不良の場合」は返品・返金の対象となります。検品時の写真を記録しておくことが、万が一のトラブル時の重要な証拠になります。信頼できる出品者（高評価・バッジ付き）からの購入を優先することで、品質トラブルのリスクを大幅に低減できます。' }
    ]
  },
  'workshop-digital': {
    title: '整備工場のデジタル化入門ガイド',
    desc: 'IT化が遅れがちな整備業界で、低コストで始められるデジタル化施策を紹介。予約管理、顧客管理、在庫管理、SNS活用まで実践的に解説します。',
    category: 'Web集客',
    sections: [
      { heading: 'なぜ今、整備工場のデジタル化が必要なのか', body: '自動車整備業界の就業者の平均年齢は約45歳と高齢化が進んでおり、人手不足が深刻です。限られた人員で効率よく業務を回すためには、デジタルツールの活用が不可欠です。また、お客様の行動もデジタル化しており、「スマホで整備工場を探す」「LINEで予約したい」というニーズが増えています。デジタル化は大規模なIT投資ではなく、無料〜低コストのツールから段階的に始めることが成功のポイントです。' },
      { heading: '今日から始められる3つのデジタル施策', body: '①Googleビジネスプロフィールの登録（無料）：Googleマップからの集客は、整備工場にとって最もROIの高いデジタル施策です。詳しくは当サイトの「Googleビジネスプロフィール最適化ガイド」をご覧ください。②LINE公式アカウントの開設（無料〜）：お客様との連絡手段をLINEに移行することで、電話対応の時間を削減。車検の案内や完了報告もLINEで送れます。③クラウド型予約管理の導入（無料〜月数千円）：電話での予約対応を減らし、24時間Web予約を受付。ダブルブッキング防止にもなります。' },
      { heading: 'パーツ調達のデジタル化', body: '電話やFAXでの部品発注から、オンラインプラットフォームの活用に移行しましょう。PARTS HUBのようなC2Cプラットフォームを使えば、①24時間いつでもパーツを検索 ②価格を比較して最適な出品者から購入 ③チャットで適合確認 ④取引履歴がデジタルで残る、というメリットがあります。従来の部品商との取引を完全に置き換えるものではなく、2つ目の仕入れルートとして活用するのが現実的です。デジタルとアナログを適材適所で使い分けることが、これからの整備工場経営の鍵になります。' }
    ]
  }
}

// ガイド一覧ページ（静的 + DB記事の両方を表示）
app.get('/guide', async (c) => {
  let cardsHtml = ''
  for (const [slug, guide] of Object.entries(GUIDES)) {
    cardsHtml += '<a href="/guide/' + slug + '" class="guide-card"><div class="guide-cat">' + guide.category + '</div><h3 class="guide-title">' + guide.title + '</h3><p class="guide-desc">' + guide.desc.slice(0, 80) + '...</p><span class="guide-link">詳しく読む<i class="fas fa-chevron-right ml-1 text-xs"></i></span></a>'
  }

  // DB記事も追加
  try {
    const { DB } = c.env
    const { results } = await DB.prepare('SELECT slug, title, description, category FROM guide_articles WHERE status = ? ORDER BY published_at DESC').bind('published').all() as any
    for (const article of results || []) {
      if (!GUIDES[article.slug]) { // 静的と重複しない場合のみ追加
        cardsHtml += '<a href="/guide/' + article.slug + '" class="guide-card"><div class="guide-cat">' + (article.category || '実践ガイド') + '</div><h3 class="guide-title">' + article.title + '</h3><p class="guide-desc">' + (article.description || '').slice(0, 80) + '...</p><span class="guide-link">詳しく読む<i class="fas fa-chevron-right ml-1 text-xs"></i></span></a>'
      }
    }
  } catch (e) { /* DB未接続時は無視 */ }

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>整備ガイド・コスト比較 - PARTS HUB（パーツハブ）</title>
    <meta name="description" content="整備工場向けの実践ガイド。パーツの費用比較、純正vs社外品の選び方、余剰在庫の活用術、SST調達など経営に役立つ情報をまとめています。">
    <link rel="canonical" href="https://parts-hub-tci.com/guide">
        ${hreflang("/guide")}
    <meta property="og:title" content="整備ガイド・コスト比較 - PARTS HUB">
    <meta property="og:description" content="整備工場向けの実践ガイド。パーツ費用比較、余剰在庫活用術、SST調達ガイドなど。">
    <meta property="og:url" content="https://parts-hub-tci.com/guide">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Noto Sans JP', sans-serif; }
      .guide-card { display: block; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; text-decoration: none; transition: all 0.2s; }
      .guide-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
      .guide-cat { display: inline-block; font-size: 11px; font-weight: 600; color: #dc2626; background: #fef2f2; padding: 3px 10px; border-radius: 4px; margin-bottom: 10px; }
      .guide-title { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 8px; line-height: 1.5; }
      .guide-desc { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 12px; }
      .guide-link { font-size: 13px; font-weight: 600; color: #dc2626; }
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">トップ</span></a>
            <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            <div class="w-16"></div>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'整備ガイド'}])}
    <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12 sm:py-16">
        <div class="max-w-6xl mx-auto px-4 text-center">
            <p class="text-red-400 text-sm font-semibold tracking-wider mb-3">MAINTENANCE GUIDE</p>
            <h1 class="text-2xl sm:text-3xl font-bold mb-3">整備ガイド・コスト比較</h1>
            <p class="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">整備工場の経営に役立つ実践的なガイドを掲載しています。</p>
        </div>
    </div>
    <main class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">${cardsHtml}</div>
    </main>
    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
})

// ガイド詳細ページ（静的GUIDES + DB記事の両方に対応）
app.get('/guide/:slug', async (c) => {
  const slug = c.req.param('slug')
  let guide = GUIDES[slug] as { title: string; desc: string; category: string; sections: { heading: string; body: string }[]; comparison?: { item: string; dealer: string; parts_hub: string; savings: string }[] } | undefined

  // 静的GUIDESにない場合はDBから取得
  if (!guide) {
    try {
      const { DB } = c.env
      const article = await DB.prepare('SELECT * FROM guide_articles WHERE slug = ? AND status = ?').bind(slug, 'published').first() as any
      if (article) {
        guide = {
          title: article.title,
          desc: article.description,
          category: article.category,
          sections: JSON.parse(article.sections_json || '[]'),
          comparison: article.comparison_json ? JSON.parse(article.comparison_json) : undefined
        }
        // 閲覧数カウント
        await DB.prepare('UPDATE guide_articles SET view_count = view_count + 1 WHERE slug = ?').bind(slug).run()
      }
    } catch (e) { /* DB未接続時は無視 */ }
  }

  if (!guide) return c.redirect('/guide', 302)

  let sectionsHtml = ''
  for (const sec of guide.sections) {
    sectionsHtml += '<section class="mb-10"><h2 class="section-heading mb-4">' + sec.heading + '</h2><div class="info-card"><p class="text-sm text-gray-700 leading-relaxed">' + sec.body + '</p></div></section>'
  }

  let comparisonHtml = ''
  if (guide.comparison) {
    let rows = ''
    for (const row of guide.comparison) {
      rows += '<tr><td class="py-3 px-4 text-sm font-medium text-gray-900">' + row.item + '</td><td class="py-3 px-4 text-sm text-gray-500 text-right">' + row.dealer + '</td><td class="py-3 px-4 text-sm text-red-600 font-semibold text-right">' + row.parts_hub + '</td><td class="py-3 px-4 text-right"><span class="inline-block text-xs font-bold text-white bg-red-500 rounded px-2 py-0.5">' + row.savings + '</span></td></tr>'
    }
    comparisonHtml = '<section class="mb-10"><h2 class="section-heading mb-4">費用比較表</h2><div class="info-card overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b border-gray-200"><th class="py-3 px-4 text-xs font-semibold text-gray-400 uppercase">パーツ</th><th class="py-3 px-4 text-xs font-semibold text-gray-400 uppercase text-right">ディーラー相場</th><th class="py-3 px-4 text-xs font-semibold text-red-400 uppercase text-right">PARTS HUB</th><th class="py-3 px-4 text-xs font-semibold text-gray-400 uppercase text-right">削減率</th></tr></thead><tbody class="divide-y divide-gray-100">' + rows + '</tbody></table></div></section>'
  }

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${guide.title} - PARTS HUB（パーツハブ）</title>
    <meta name="description" content="${guide.desc}">
    <link rel="canonical" href="https://parts-hub-tci.com/guide/${slug}">
    ${hreflang("/guide/" + slug)}
    <meta property="og:type" content="article">
    <meta property="og:title" content="${guide.title} - PARTS HUB">
    <meta property="og:description" content="${guide.desc.slice(0, 120)}">
    <meta property="og:url" content="https://parts-hub-tci.com/guide/${slug}">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${guide.title}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org", "@type": "Article",
      "headline": guide.title,
      "description": guide.desc,
      "url": "https://parts-hub-tci.com/guide/" + slug,
      "publisher": { "@type": "Organization", "name": "PARTS HUB", "url": "https://parts-hub-tci.com/" },
      "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
        { "@type": "ListItem", "position": 2, "name": "整備ガイド", "item": "https://parts-hub-tci.com/guide" },
        { "@type": "ListItem", "position": 3, "name": guide.title }
      ]}
    })}</script>
    <meta name="theme-color" content="#ff4757">
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Noto Sans JP', sans-serif; }
      .section-heading { font-size: 18px; font-weight: 700; color: #1f2937; position: relative; padding-left: 16px; }
      .section-heading::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 4px; background: linear-gradient(180deg, #ef4444, #f97316); border-radius: 2px; }
      .info-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; }
      .cta-section { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
      ${BREADCRUMB_CSS}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/guide" class="text-gray-600 hover:text-gray-900 flex items-center gap-2"><i class="fas fa-arrow-left"></i><span class="text-sm font-medium">ガイド一覧</span></a>
            <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
            <a href="/register" class="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg transition-colors">無料登録</a>
        </div>
    </header>
    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'整備ガイド',url:'/guide'},{name:guide.title}])}
    <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12 sm:py-16">
        <div class="max-w-4xl mx-auto px-4 text-center">
            <div class="inline-block px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full tracking-wider mb-4">${guide.category}</div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">${guide.title}</h1>
        </div>
    </div>
    <main class="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        ${sectionsHtml}
        ${comparisonHtml}
    </main>
    <section class="cta-section text-white py-14 sm:py-20">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-xl sm:text-2xl font-bold mb-4">パーツ調達コストを見直しませんか？</h2>
            <p class="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">PARTS HUBなら全国の整備工場が出品する純正・社外・リビルトパーツから、<br class="hidden sm:block">最適な価格のパーツを見つけることができます。</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/search" class="inline-block px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-base shadow-lg shadow-red-500/20">パーツを検索する</a>
                <a href="/register" class="inline-block px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-base border border-white/20">無料で会員登録</a>
            </div>
        </div>
    </section>
    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
</body>
</html>`)
})

// ========================================
// HTMLサイトマップページ
// ========================================
app.get('/sitemap', async (c) => {
  const { DB } = c.env as any
  let categoriesHtml = ''
  let articlesHtml = ''
  let productsHtml = ''
  
  try {
    // カテゴリ取得
    const cats = await DB.prepare('SELECT id, name, slug FROM categories ORDER BY id').all()
    categoriesHtml = cats.results.map((cat: any) => 
      '<li><a href="/search?category=' + encodeURIComponent(cat.name) + '" class="sitemap-link group">' +
      '<i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>' + cat.name +
      '</a></li>'
    ).join('')

    // 最新記事取得（30件）
    const arts = await DB.prepare(
      "SELECT title, slug, category, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 30"
    ).all()
    const catLabels: Record<string,string> = { 'parts-guide':'パーツガイド','maintenance':'メンテナンス','tips':'お役立ち情報','deadstock':'デッドストック活用','news':'ニュース' }
    articlesHtml = arts.results.map((a: any) => {
      const d = a.published_at ? new Date(a.published_at) : new Date()
      const dateStr = d.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})
      const catLabel = catLabels[a.category] || a.category || '総合'
      const safeTitle = String(a.title || '').replace(/</g,'&lt;')
      return '<li><a href="/news/' + a.slug + '" class="sitemap-link group">' +
        '<div class="flex items-start gap-2">' +
        '<i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-1 mt-1.5 flex-shrink-0"></i>' +
        '<div class="min-w-0">' +
        '<span class="block text-sm leading-snug">' + safeTitle + '</span>' +
        '<span class="text-xs text-gray-400 mt-0.5 block"><span class="inline-block bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 text-[10px] mr-1.5">' + catLabel + '</span>' + dateStr + '</span>' +
        '</div></div></a></li>'
    }).join('')

    // 最新商品取得（20件）
    const prods = await DB.prepare(
      "SELECT id, title, price, condition, created_at FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT 20"
    ).all()
    const condMap: Record<string,string> = { new:'新品', like_new:'未使用に近い', good:'良好', fair:'やや傷あり', poor:'状態不良' }
    productsHtml = prods.results.map((p: any) => {
      const priceTaxIncluded = Math.floor(Number(p.price || 0) * 1.1).toLocaleString()
      const cond = condMap[p.condition] || p.condition || '中古'
      const safeTitle = String(p.title || '').replace(/</g,'&lt;')
      return '<li><a href="/products/' + p.id + '" class="sitemap-link group">' +
        '<div class="flex items-start gap-2">' +
        '<i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-1 mt-1.5 flex-shrink-0"></i>' +
        '<div class="min-w-0">' +
        '<span class="block text-sm leading-snug">' + safeTitle + '</span>' +
        '<span class="text-xs text-gray-400 mt-0.5 block">&yen;' + priceTaxIncluded + '（税込）・' + cond + '</span>' +
        '</div></div></a></li>'
    }).join('')
  } catch(e) { console.error('Sitemap page error:', e) }

  // 商品セクション
  const productsSection = productsHtml ? (
    '<div class="section-card mb-8">' +
    '<div class="section-header">' +
    '<div class="section-icon bg-purple-50 text-purple-500"><i class="fas fa-box-open"></i></div>' +
    '<div><h2 class="font-bold text-gray-900">出品中の商品</h2><p class="text-xs text-gray-400">最新の出品商品一覧</p></div>' +
    '<a href="/search" class="ml-auto text-xs text-red-500 font-medium hover:underline">すべて見る &rarr;</a>' +
    '</div>' +
    '<div class="section-body"><ul class="grid grid-cols-1 sm:grid-cols-2">' + productsHtml + '</ul></div>' +
    '</div>'
  ) : ''

  // 記事セクション
  const articlesSection = articlesHtml ? (
    '<div class="section-card mb-8">' +
    '<div class="section-header">' +
    '<div class="section-icon bg-teal-50 text-teal-500"><i class="fas fa-newspaper"></i></div>' +
    '<div><h2 class="font-bold text-gray-900">ニュース・コラム記事</h2><p class="text-xs text-gray-400">最新の記事一覧</p></div>' +
    '<a href="/news" class="ml-auto text-xs text-red-500 font-medium hover:underline">すべて見る &rarr;</a>' +
    '</div>' +
    '<div class="section-body"><ul>' + articlesHtml + '</ul></div>' +
    '</div>'
  ) : ''

  return c.html(`<!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>サイトマップ - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBの全ページ一覧。商品検索、カテゴリ別パーツ、ニュース記事、会社情報など、サイト内の全コンテンツへのリンクを掲載しています。">
        <link rel="canonical" href="https://parts-hub-tci.com/sitemap">
        ${hreflang("/sitemap")}
        <meta property="og:title" content="サイトマップ - PARTS HUB">
        <meta property="og:description" content="PARTS HUBの全ページ一覧。商品検索、カテゴリ、ニュース記事へのリンクを掲載。">
        <meta property="og:url" content="https://parts-hub-tci.com/sitemap">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .sitemap-link { display:block; padding:8px 12px; border-radius:8px; color:#374151; text-decoration:none; transition:all 0.15s ease; }
          .sitemap-link:hover { background:#fef2f2; color:#dc2626; }
          .section-card { background:white; border-radius:16px; box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04); border:1px solid #f3f4f6; overflow:hidden; transition:box-shadow 0.2s; }
          .section-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }
          .section-header { display:flex; align-items:center; gap:12px; padding:20px 24px 16px; border-bottom:1px solid #f9fafb; }
          .section-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
          .section-body { padding:8px 12px 16px; }
          .section-body ul { list-style:none; padding:0; margin:0; }
          .section-body li { border-bottom:1px solid #f9fafb; }
          .section-body li:last-child { border-bottom:none; }
          .hero-gradient { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%); }
          ${BREADCRUMB_CSS}
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/" class="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i>
                    <span class="text-sm font-medium">戻る</span>
                </a>
                <a href="/" class="text-red-500 font-bold text-lg">PARTS HUB</a>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'サイトマップ'}])}

        <div class="hero-gradient text-white py-10 sm:py-14">
            <div class="max-w-6xl mx-auto px-4 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
                    <i class="fas fa-sitemap text-2xl text-red-400"></i>
                </div>
                <h1 class="text-2xl sm:text-3xl font-bold mb-2">サイトマップ</h1>
                <p class="text-gray-300 text-sm sm:text-base">PARTS HUBの全ページ一覧</p>
            </div>
        </div>

        <main class="max-w-6xl mx-auto px-4 py-8 sm:py-12">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-red-50 text-red-500"><i class="fas fa-home"></i></div>
                        <div><h2 class="font-bold text-gray-900">メインページ</h2><p class="text-xs text-gray-400">サービスの主要ページ</p></div>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>トップページ</a></li>
                        <li><a href="/search" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>商品検索</a></li>
                        <li><a href="/listing" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>出品する</a></li>
                        <li><a href="/news" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>ニュース・コラム</a></li>
                    </ul></div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-blue-50 text-blue-500"><i class="fas fa-life-ring"></i></div>
                        <div><h2 class="font-bold text-gray-900">サポート</h2><p class="text-xs text-gray-400">ヘルプ・お問い合わせ</p></div>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/faq" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>よくある質問（FAQ）</a></li>
                        <li><a href="/contact" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>お問い合わせ</a></li>
                        <li><a href="/contact?type=proxy" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>代理出品のご依頼</a></li>
                    </ul></div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-gray-100 text-gray-500"><i class="fas fa-gavel"></i></div>
                        <div><h2 class="font-bold text-gray-900">法的情報</h2><p class="text-xs text-gray-400">規約・ポリシー</p></div>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/terms" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>利用規約</a></li>
                        <li><a href="/privacy" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>プライバシーポリシー</a></li>
                        <li><a href="/security" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>セキュリティポリシー</a></li>
                        <li><a href="/legal" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>特定商取引法に基づく表記</a></li>
                    </ul></div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-green-50 text-green-500"><i class="fas fa-user"></i></div>
                        <div><h2 class="font-bold text-gray-900">アカウント</h2><p class="text-xs text-gray-400">登録・ログイン・管理</p></div>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/register" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>新規会員登録（無料）</a></li>
                        <li><a href="/login" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>ログイン</a></li>
                        <li><a href="/mypage" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>マイページ</a></li>
                        <li><a href="/favorites" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>お気に入り</a></li>
                        <li><a href="/notifications" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>通知</a></li>
                    </ul></div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-indigo-50 text-indigo-500"><i class="fas fa-map-marked-alt"></i></div>
                        <div><h2 class="font-bold text-gray-900">エリア別</h2><p class="text-xs text-gray-400">都道府県別ランディングページ</p></div>
                        <a href="/area" class="ml-auto text-xs text-red-500 font-medium hover:underline">一覧へ &rarr;</a>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/area" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>エリア一覧（全47都道府県）</a></li>
                        <li><a href="/area/tokyo" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>東京都</a></li>
                        <li><a href="/area/osaka" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>大阪府</a></li>
                        <li><a href="/area/aichi" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>愛知県</a></li>
                        <li><a href="/area/fukuoka" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>福岡県</a></li>
                        <li><a href="/area/hokkaido" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>北海道</a></li>
                    </ul></div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-cyan-50 text-cyan-500"><i class="fas fa-car"></i></div>
                        <div><h2 class="font-bold text-gray-900">車種別パーツ</h2><p class="text-xs text-gray-400">人気車種のパーツガイド</p></div>
                        <a href="/vehicle" class="ml-auto text-xs text-red-500 font-medium hover:underline">一覧へ &rarr;</a>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/vehicle" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>車種別パーツ一覧</a></li>
                        <li><a href="/vehicle/toyota-prius" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>トヨタ プリウス</a></li>
                        <li><a href="/vehicle/toyota-hiace" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>トヨタ ハイエース</a></li>
                        <li><a href="/vehicle/nissan-note" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>日産 ノート</a></li>
                        <li><a href="/vehicle/honda-nbox" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>ホンダ N-BOX</a></li>
                        <li><a href="/vehicle/suzuki-jimny" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>スズキ ジムニー</a></li>
                    </ul></div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-amber-50 text-amber-500"><i class="fas fa-book-open"></i></div>
                        <div><h2 class="font-bold text-gray-900">整備ガイド</h2><p class="text-xs text-gray-400">コスト比較・実践ガイド</p></div>
                        <a href="/guide" class="ml-auto text-xs text-red-500 font-medium hover:underline">一覧へ &rarr;</a>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/guide" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>整備ガイド一覧</a></li>
                        <li><a href="/guide/brake-pad-cost" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>ブレーキパッド費用比較</a></li>
                        <li><a href="/guide/genuine-vs-aftermarket" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>純正品 vs 社外品</a></li>
                        <li><a href="/guide/deadstock-management" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>デッドストック活用術</a></li>
                        <li><a href="/guide/sst-tool-guide" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>SST（特殊工具）調達</a></li>
                        <li><a href="/guide/google-business-profile" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>Googleビジネスプロフィール最適化</a></li>
                        <li><a href="/guide/car-inspection-cost" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>車検パーツ費用削減</a></li>
                        <li><a href="/guide/insurance-repair-profit" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>保険修理の利益率最大化</a></li>
                        <li><a href="/guide/ev-hybrid-parts" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>EV・ハイブリッド車パーツ</a></li>
                        <li><a href="/guide/used-parts-quality" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>中古パーツ品質見極め</a></li>
                        <li><a href="/guide/workshop-digital" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>整備工場デジタル化入門</a></li>
                    </ul></div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-icon bg-rose-50 text-rose-500"><i class="fas fa-handshake"></i></div>
                        <div><h2 class="font-bold text-gray-900">パートナー</h2><p class="text-xs text-gray-400">整備団体向け専用ページ</p></div>
                        <a href="/partner" class="ml-auto text-xs text-red-500 font-medium hover:underline">一覧へ &rarr;</a>
                    </div>
                    <div class="section-body"><ul>
                        <li><a href="/partner" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>パートナー一覧</a></li>
                        <li><a href="/franchise" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i><strong class="text-red-500">パートナー募集（副業・独立開業）</strong></a></li>
                        <li><a href="/partner/jaspa" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>自動車整備振興会（JASPA）</a></li>
                        <li><a href="/partner/jasca" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>自動車整備商工組合（JASCA）</a></li>
                        <li><a href="/partner/body-shop" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>車体整備事業者（鈑金塗装）</a></li>
                        <li><a href="/partner/denso-seibi" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>自動車電装整備事業者</a></li>
                        <li><a href="/partner/parts-dealer" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>自動車部品卸商</a></li>
                        <li><a href="/widget" class="sitemap-link group"><i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-red-400 transition-colors mr-2"></i>埋め込みウィジェット</a></li>
                    </ul></div>
                </div>

                <div class="section-card md:col-span-2">
                    <div class="section-header">
                        <div class="section-icon bg-orange-50 text-orange-500"><i class="fas fa-th-large"></i></div>
                        <div><h2 class="font-bold text-gray-900">カテゴリから探す</h2><p class="text-xs text-gray-400">パーツカテゴリ一覧</p></div>
                    </div>
                    <div class="section-body"><ul class="grid grid-cols-1 sm:grid-cols-2">
                        ${categoriesHtml}
                    </ul></div>
                </div>
            </div>

            ${productsSection}

            ${articlesSection}

            <div class="text-center py-6">
                <p class="text-xs text-gray-400 mb-2">検索エンジン向けXMLサイトマップ</p>
                <a href="/sitemap.xml" class="text-sm text-red-500 hover:underline font-medium">
                    <i class="fas fa-code mr-1"></i>sitemap.xml
                </a>
            </div>
        </main>

        ${Footer()}
        <script src="${v('/static/auth-header.js')}"></script>
        <script src="${v('/static/notification-badge.js')}"></script>
    </body>
    </html>`)
})

// 特定商取引法に基づく表記
app.get('/legal', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>特定商取引法に基づく表記 - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBの特定商取引法に基づく表記。販売事業者情報、返品・返金ポリシー、支払方法について記載しています。">
        <link rel="canonical" href="https://parts-hub-tci.com/legal">
        ${hreflang("/legal")}
        <meta property="og:title" content="特定商取引法に基づく表記 - PARTS HUB">
        <meta property="og:url" content="https://parts-hub-tci.com/legal">
        <meta property="og:site_name" content="PARTS HUB">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${BREADCRUMB_CSS}</style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
                <h1 class="text-red-500 font-bold text-lg">特定商取引法に基づく表記</h1>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'特定商取引法に基づく表記'}])}

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
                    <p class="text-gray-700 mb-2">各商品ページに表示される価格（税抜き価格 + 消費税10% = 税込価格）</p>
                    <p class="text-sm text-gray-600">※商品価格は出品者が税抜き価格で設定し、消費税10%が自動計算されます</p>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">手数料</h2>
                    <div class="space-y-2 text-gray-700">
                        <p><strong>販売手数料（出品者負担）：</strong>商品価格（税抜）の10%</p>
                        <p><strong>カード決済手数料（購入者負担）：</strong>330円（税込）</p>
                        <p><strong>銀行振込手数料（購入者負担）：</strong>各金融機関の定める手数料</p>
                        <p><strong>出金振込手数料（出品者負担）：</strong>振込申請のたびに330円</p>
                        <p><strong>代理出品手数料：</strong>サービス内容により異なります（別途お見積り）</p>
                    </div>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">商品代金以外の必要料金</h2>
                    <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>配送料（商品・配送方法により異なります）</li>
                        <li>カード決済手数料：330円（税込）</li>
                        <li>振込手数料（銀行振込の場合、各金融機関により異なる）</li>
                        <li>インターネット接続料金</li>
                    </ul>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">支払方法</h2>
                    <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>クレジットカード決済（Visa、Mastercard、JCB、American Express）</li>
                        <li>請求書払い（銀行振込）— 法人・個人事業主向け</li>
                    </ul>
                </section>

                <section class="border-b border-gray-200 pb-4">
                    <h2 class="text-lg font-bold text-gray-900 mb-3">支払時期</h2>
                    <p class="text-gray-700">クレジットカード：商品購入時に即時決済</p>
                    <p class="text-gray-700">請求書払い：注文後7日以内に指定口座へ振込</p>
                    <p class="text-sm text-gray-600">※振込確認後、出品者に発送依頼が送信されます</p>
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

// === ARGOS JPC API連携デモページ（本番未使用・サンプルUI） ===
app.get('/argos-demo', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARGOS JPC 連携デモ - PARTS HUB</title>
  ${TAILWIND_CSS}
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    .vin-input { font-family: 'Courier New', monospace; font-size: 1.15rem; letter-spacing: 3px; text-transform: uppercase; }
    .card-hover { transition: all 0.2s; cursor: pointer; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .card-hover.active-group { border-color: #ef4444 !important; background: #fef2f2; box-shadow: 0 0 0 2px rgba(239,68,68,0.3); }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .shimmer { background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .part-row { transition: background 0.15s; border-left: 3px solid transparent; }
    .part-row:hover { background: #fef2f2; }
    .part-row.selected { background: #fef2f2; border-left-color: #ef4444; }
    .illustration-area { background: repeating-conic-gradient(#f3f4f6 0% 25%, #fff 0% 50%) 50% / 16px 16px; border: 2px dashed #d1d5db; }
    .tab-active { border-bottom: 3px solid #ef4444; color: #ef4444; font-weight: 700; }
    .tab-inactive { border-bottom: 3px solid transparent; color: #6b7280; }
    .tab-inactive:hover { color: #374151; border-bottom-color: #e5e7eb; }
    .listing-card { transition: all 0.2s; border: 2px solid transparent; }
    .listing-card:hover { border-color: #60a5fa; transform: translateY(-1px); }
    @media (max-width: 640px) { .vin-input { font-size: 0.9rem; letter-spacing: 1.5px; } }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- ヘッダー -->
  <header class="bg-white shadow-sm border-b sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/" class="text-red-500 font-bold text-xl"><i class="fas fa-puzzle-piece mr-1"></i>PARTS HUB</a>
        <span class="text-gray-300">&times;</span>
        <span class="text-sm font-semibold text-gray-700">ARGOS JPC</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="tag bg-yellow-100 text-yellow-700"><i class="fas fa-flask"></i> デモ環境</span>
        <span class="tag bg-blue-100 text-blue-700"><i class="fas fa-plug"></i> モックAPI</span>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-6">
    <!-- シーン切替タブ -->
    <div class="flex border-b mb-6">
      <button onclick="switchTab('listing')" id="tab-listing" class="px-5 py-3 text-sm tab-active transition-all"><i class="fas fa-upload mr-1.5"></i>出品時に使う</button>
      <button onclick="switchTab('search')" id="tab-search" class="px-5 py-3 text-sm tab-inactive transition-all"><i class="fas fa-search mr-1.5"></i>購入時に使う</button>
      <button onclick="switchTab('api')" id="tab-api" class="px-5 py-3 text-sm tab-inactive transition-all"><i class="fas fa-code mr-1.5"></i>API設計</button>
    </div>

    <!-- ============ STEP 0: VIN入力（共通） ============ -->
    <div id="section-vin" class="bg-white rounded-2xl shadow-sm border p-6 mb-6 fade-in">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
        <div>
          <h2 class="font-bold text-lg">車台番号（VIN）を入力</h2>
          <p class="text-xs text-gray-400">車検証記載の車台番号を入力すると、車両情報・適合部品を自動取得します</p>
        </div>
      </div>

      <!-- 説明バナー -->
      <div id="vin-banner-listing" class="mt-3 mb-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
        <i class="fas fa-lightbulb text-orange-400 mt-0.5"></i>
        <div class="text-xs text-gray-600 leading-relaxed">
          <span class="font-bold text-red-600">出品モード：</span>VINを入力するだけで、車両情報・OEM部品番号・参考価格が自動取得されます。手入力の手間を大幅に削減し、正確な適合情報付きで出品できます。
        </div>
      </div>
      <div id="vin-banner-search" class="hidden mt-3 mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
        <i class="fas fa-lightbulb text-blue-400 mt-0.5"></i>
        <div class="text-xs text-gray-600 leading-relaxed">
          <span class="font-bold text-blue-600">購入モード：</span>お持ちの車のVINを入力すると、その車に適合するOEM部品番号を特定できます。品番でPARTS HUB内の出品商品を横断検索できます。
        </div>
      </div>

      <div class="flex gap-3">
        <div class="flex-1 relative">
          <input type="text" id="vin-input" class="vin-input w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none transition-colors" placeholder="例: JTDKN3DU5P0000001" maxlength="30">
          <button onclick="clearVin()" id="vin-clear" class="hidden absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><i class="fas fa-times-circle text-xl"></i></button>
        </div>
        <button onclick="searchVin()" id="vin-btn" class="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors whitespace-nowrap shadow-sm">
          <i class="fas fa-search mr-2"></i>検索
        </button>
      </div>

      <!-- デモ用クイック選択 -->
      <div class="mt-3">
        <p class="text-xs text-gray-400 mb-1.5"><i class="fas fa-vial mr-1"></i>デモ用VIN（クリックで自動入力）:</p>
        <div class="flex flex-wrap gap-2">
          <button onclick="setVin('JTDKN3DU5P0000001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-car text-gray-300 mr-1"></i>プリウス</button>
          <button onclick="setVin('TRH200-0300001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-truck text-gray-300 mr-1"></i>ハイエース</button>
          <button onclick="setVin('JF5-1000001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-car text-gray-300 mr-1"></i>N-BOX</button>
          <button onclick="setVin('C28-100001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-van-shuttle text-gray-300 mr-1"></i>セレナ</button>
          <button onclick="setVin('CV1W-0400001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-van-shuttle text-gray-300 mr-1"></i>デリカD:5</button>
          <button onclick="setVin('LA650S-0100001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-car text-gray-300 mr-1"></i>タント</button>
          <button onclick="setVin('JB64W-200001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-truck-monster text-gray-300 mr-1"></i>ジムニー</button>
          <button onclick="setVin('ND5RC-300001')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-transparent hover:border-red-200"><i class="fas fa-car text-gray-300 mr-1"></i>ロードスター</button>
        </div>
      </div>

      <!-- ローディング -->
      <div id="vin-loading" class="hidden mt-4">
        <div class="flex items-center gap-3 py-4"><div class="w-5 h-5 border-3 border-red-200 border-t-red-500 rounded-full animate-spin"></div><span class="text-sm text-gray-500">ARGOS JPC APIで車両情報を取得中...</span></div>
        <div class="grid grid-cols-2 gap-3 mt-2">
          <div class="shimmer h-5 rounded"></div><div class="shimmer h-5 rounded"></div>
          <div class="shimmer h-5 rounded"></div><div class="shimmer h-5 rounded"></div>
        </div>
      </div>
      <!-- エラー -->
      <div id="vin-error" class="hidden mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
        <p class="text-sm text-red-600 font-semibold"><i class="fas fa-exclamation-triangle mr-1"></i><span id="vin-error-msg"></span></p>
        <p id="vin-error-hint" class="text-xs text-red-400 mt-1"></p>
      </div>
    </div>

    <!-- ============ STEP 1: 車両情報表示 ============ -->
    <div id="section-vehicle" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm"><i class="fas fa-check"></i></div>
            <div>
              <h2 class="font-bold text-lg">車両特定完了</h2>
              <p class="text-xs text-gray-400" id="vehicle-summary-text"></p>
            </div>
          </div>
          <button onclick="resetAll()" class="text-xs text-red-500 hover:underline flex items-center gap-1"><i class="fas fa-redo"></i>やり直す</button>
        </div>
        <!-- 車両情報カード -->
        <div class="bg-gray-50 rounded-xl overflow-hidden">
          <div id="vehicle-header" class="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span id="vh-maker" class="text-white font-bold text-sm"></span>
              <span id="vh-model" class="text-gray-300 text-sm"></span>
            </div>
            <span id="vh-vin" class="text-gray-400 text-xs font-mono"></span>
          </div>
          <div id="vehicle-info" class="grid grid-cols-1 sm:grid-cols-2"></div>
        </div>
        <!-- AI VIN認識ヒント -->
        <div class="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <i class="fas fa-robot text-purple-300"></i>
          <span>本番環境ではAI画像認識による車検証からのVIN自動読取にも対応（精度約95%、約1秒）</span>
        </div>
      </div>

      <!-- ============ STEP 2: 部品グループ選択 ============ -->
      <div class="bg-white rounded-2xl shadow-sm border p-6 mb-6 fade-in">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <h2 class="font-bold text-lg" id="step2-title">部品グループを選択</h2>
            <p class="text-xs text-gray-400" id="step2-desc">カテゴリを選んで、さらにサブグループから部品を絞り込めます</p>
          </div>
        </div>
        <div id="groups-list" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"></div>

        <!-- サブグループ -->
        <div id="subgroups-section" class="hidden mt-6 pt-5 border-t fade-in">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-sm text-gray-700"><i class="fas fa-folder-open text-red-400 mr-1.5"></i><span id="subgroup-title">サブグループ</span></h3>
            <button onclick="backToGroups()" class="text-xs text-red-500 hover:underline flex items-center gap-1"><i class="fas fa-arrow-left"></i>グループに戻る</button>
          </div>
          <div id="subgroups-list" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"></div>
        </div>
      </div>

      <!-- ============ STEP 3: 部品一覧 + イラスト ============ -->
      <div id="section-parts" class="hidden fade-in">
        <div class="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6">
          <div class="px-6 py-4 border-b bg-gradient-to-r from-white to-gray-50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <div class="flex-1 min-w-0">
                <h2 class="font-bold text-lg" id="step3-title">部品を選択</h2>
                <p class="text-xs text-gray-400" id="step3-subtitle"></p>
              </div>
              <span id="parts-count" class="tag bg-gray-100 text-gray-600"></span>
            </div>
          </div>
          <div class="flex flex-col lg:flex-row">
            <!-- イラストエリア -->
            <div class="lg:w-5/12 p-5 border-r border-b lg:border-b-0">
              <div class="illustration-area rounded-xl h-56 lg:h-72 flex items-center justify-center relative">
                <div class="text-center text-gray-400">
                  <i class="fas fa-drafting-compass text-4xl mb-2 text-gray-300"></i>
                  <p class="text-sm font-semibold">部品展開図イラスト</p>
                  <p class="text-xs mt-1">(ARGOS API #21 Get Image)</p>
                  <p class="text-xs mt-2 text-gray-300">トヨタ・三菱・日産・ホンダ・ダイハツ対応</p>
                </div>
                <div class="absolute bottom-2 right-2 flex gap-1">
                  <button class="p-1.5 bg-white/80 rounded-lg border text-gray-400 hover:text-gray-600 text-xs" title="ズームイン"><i class="fas fa-search-plus"></i></button>
                  <button class="p-1.5 bg-white/80 rounded-lg border text-gray-400 hover:text-gray-600 text-xs" title="ズームアウト"><i class="fas fa-search-minus"></i></button>
                </div>
              </div>
            </div>
            <!-- 部品リスト -->
            <div class="lg:w-7/12 flex flex-col">
              <div class="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-700"><i class="fas fa-list mr-1.5 text-gray-400"></i>部品一覧</span>
                <div class="flex items-center gap-2">
                  <input type="text" id="parts-filter" class="text-xs px-3 py-1.5 border rounded-lg w-36 focus:outline-none focus:border-red-400" placeholder="品番・名前で絞込..." oninput="filterParts(this.value)">
                </div>
              </div>
              <div id="parts-list" class="max-h-80 overflow-y-auto"></div>
            </div>
          </div>
        </div>

        <!-- ============ 出品連携パネル（出品モード） ============ -->
        <div id="listing-panel" class="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-6 fade-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-lg text-red-700"><i class="fas fa-upload mr-2"></i>出品情報に反映</h3>
            <span id="selected-count" class="tag bg-red-100 text-red-600 hidden">0件選択中</span>
          </div>
          <div id="selected-parts-summary" class="space-y-2 mb-4"></div>
          <div id="no-parts-selected" class="text-center py-8">
            <i class="fas fa-hand-pointer text-red-200 text-3xl mb-2"></i>
            <p class="text-sm text-gray-400">部品一覧から出品する部品を選択してください</p>
            <p class="text-xs text-gray-300 mt-1">クリックで選択・解除できます</p>
          </div>

          <!-- 出品プレビュー -->
          <div id="listing-preview" class="hidden mt-4 bg-white rounded-xl border p-4">
            <h4 class="text-sm font-bold text-gray-700 mb-3"><i class="fas fa-eye mr-1.5 text-gray-400"></i>出品フォーム自動入力プレビュー</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" id="listing-preview-content"></div>
          </div>

          <button onclick="applyToListing()" id="apply-btn" class="hidden w-full mt-4 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-red-200">
            <i class="fas fa-arrow-right mr-2"></i>この情報で出品ページへ進む
          </button>
        </div>

        <!-- ============ 購入検索パネル（購入モード） ============ -->
        <div id="search-panel" class="hidden bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 fade-in">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-lg text-blue-700"><i class="fas fa-shopping-cart mr-2"></i>適合部品から探す</h3>
            <span id="search-selected-count" class="tag bg-blue-100 text-blue-600 hidden">0件選択中</span>
          </div>
          <p class="text-sm text-blue-600 mb-4">選択した部品番号（＋互換品番）でPARTS HUBの出品を検索します</p>
          <div id="search-results-area" class="space-y-3"></div>
          <div id="no-parts-search" class="text-center py-8">
            <i class="fas fa-hand-pointer text-blue-200 text-3xl mb-2"></i>
            <p class="text-sm text-gray-400">部品一覧から検索したい部品を選択してください</p>
          </div>

          <!-- 検索結果プレビュー (PARTS HUB内の出品商品) -->
          <div id="hub-listings-section" class="hidden mt-4 pt-4 border-t border-blue-200">
            <h4 class="text-sm font-bold text-blue-700 mb-3"><i class="fas fa-store mr-1.5"></i>PARTS HUB 出品商品（デモ）</h4>
            <div id="hub-listings" class="space-y-2"></div>
          </div>

          <button onclick="searchOnHub()" id="search-hub-btn" class="hidden w-full mt-4 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-200">
            <i class="fas fa-search mr-2"></i>PARTS HUBで検索する
          </button>
        </div>
      </div>
    </div>

    <!-- ============ API設計タブ ============ -->
    <div id="section-api-design" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <h2 class="font-bold text-xl mb-6"><i class="fas fa-sitemap text-red-500 mr-2"></i>PARTS HUB &times; ARGOS JPC API連携アーキテクチャ</h2>

        <!-- フロー図 -->
        <div class="bg-gray-900 rounded-xl p-6 mb-6 text-sm font-mono overflow-x-auto">
          <p class="text-green-400 mb-2">// データフロー（出品時）</p>
          <p class="text-gray-300">ユーザー（出品者）</p>
          <p class="text-gray-500 pl-4">│ 車台番号入力 or 車検証画像アップロード</p>
          <p class="text-gray-500 pl-4">▼</p>
          <p class="text-blue-400">PARTS HUB フロントエンド</p>
          <p class="text-gray-500 pl-4">│ POST /api/argos/vin-search</p>
          <p class="text-gray-500 pl-4">▼</p>
          <p class="text-yellow-400">PARTS HUB バックエンド（Hono / Cloudflare Workers）</p>
          <p class="text-gray-500 pl-4">│ Bearer Token認証 + D1キャッシュチェック</p>
          <p class="text-gray-500 pl-4">│ API #13 Get Car List by VIN</p>
          <p class="text-gray-500 pl-4">▼</p>
          <p class="text-red-400">ARGOS JPC API（外部サービス）</p>
          <p class="text-gray-500 pl-4">│ 車両情報 + 部品グループ + 部品番号 + イラスト</p>
          <p class="text-gray-500 pl-4">▼</p>
          <p class="text-yellow-400">PARTS HUB バックエンド</p>
          <p class="text-gray-500 pl-4">│ レスポンス整形 + D1にキャッシュ保存（コスト最適化）</p>
          <p class="text-gray-500 pl-4">▼</p>
          <p class="text-blue-400">PARTS HUB フロントエンド</p>
          <p class="text-gray-500 pl-4">│ 車両情報表示 → 部品選択 → 出品フォーム自動入力</p>
          <p class="text-gray-500 pl-4">▼</p>
          <p class="text-green-400">出品完了（適合車両情報・OEM部品番号・参考価格が自動設定済み）</p>
        </div>

        <!-- API連携方針 -->
        <h3 class="font-bold text-lg mb-3">API連携方針</h3>
        <div class="space-y-3 mb-6">
          <div class="flex gap-3 p-4 bg-red-50 rounded-xl">
            <div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><i class="fas fa-shield-halved text-sm"></i></div>
            <div><p class="font-semibold text-sm">APIキーはサーバー側で管理</p><p class="text-xs text-gray-500">ARGOS JPCのBearer TokenはCloudflare Secretsに保存。フロントエンドには一切露出させない。</p></div>
          </div>
          <div class="flex gap-3 p-4 bg-blue-50 rounded-xl">
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><i class="fas fa-database text-sm"></i></div>
            <div><p class="font-semibold text-sm">APIレスポンスをD1にキャッシュ</p><p class="text-xs text-gray-500">同一VINの2回目以降はD1から高速応答。API呼出回数を最小化しコスト削減。キャッシュTTL: 30日。</p></div>
          </div>
          <div class="flex gap-3 p-4 bg-green-50 rounded-xl">
            <div class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><i class="fas fa-layer-group text-sm"></i></div>
            <div><p class="font-semibold text-sm">抽象化レイヤーで疎結合</p><p class="text-xs text-gray-500">内部APIとARGOS APIを分離。モック⇔本番の切替が1ファイル（argos-demo.ts）の変更だけで完了。</p></div>
          </div>
          <div class="flex gap-3 p-4 bg-purple-50 rounded-xl">
            <div class="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><i class="fas fa-link text-sm"></i></div>
            <div><p class="font-semibold text-sm">既存出品フローとシームレス統合</p><p class="text-xs text-gray-500">VIN検索で得た車両・部品情報を出品フォームに自動入力。購入者は品番でPARTS HUB内を横断検索。</p></div>
          </div>
        </div>

        <!-- 使用API一覧 -->
        <h3 class="font-bold text-lg mb-3">使用するARGOS JPC API</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-gray-100"><th class="px-3 py-2 text-left">API#</th><th class="px-3 py-2 text-left">名称</th><th class="px-3 py-2 text-left">用途</th><th class="px-3 py-2 text-left">重要度</th></tr></thead>
            <tbody>
              <tr class="border-t"><td class="px-3 py-2 font-mono text-red-500">#13</td><td class="px-3 py-2">Get Car List by VIN</td><td class="px-3 py-2">車台番号→車両特定</td><td class="px-3 py-2"><span class="tag bg-red-100 text-red-600">必須</span></td></tr>
              <tr class="border-t"><td class="px-3 py-2 font-mono text-red-500">#6</td><td class="px-3 py-2">Get Main Group List</td><td class="px-3 py-2">部品グループ一覧</td><td class="px-3 py-2"><span class="tag bg-red-100 text-red-600">必須</span></td></tr>
              <tr class="border-t"><td class="px-3 py-2 font-mono text-red-500">#14</td><td class="px-3 py-2">Get Subgroup List by VIN</td><td class="px-3 py-2">サブグループ表示</td><td class="px-3 py-2"><span class="tag bg-red-100 text-red-600">必須</span></td></tr>
              <tr class="border-t"><td class="px-3 py-2 font-mono text-red-500">#15</td><td class="px-3 py-2">Get Part List by VIN</td><td class="px-3 py-2">部品一覧取得</td><td class="px-3 py-2"><span class="tag bg-red-100 text-red-600">必須</span></td></tr>
              <tr class="border-t"><td class="px-3 py-2 font-mono text-blue-500">#21</td><td class="px-3 py-2">Get Image</td><td class="px-3 py-2">部品展開図イラスト表示</td><td class="px-3 py-2"><span class="tag bg-blue-100 text-blue-600">推奨</span></td></tr>
              <tr class="border-t"><td class="px-3 py-2 font-mono text-blue-500">#35</td><td class="px-3 py-2">Get Car Additional Data</td><td class="px-3 py-2">追加車両情報</td><td class="px-3 py-2"><span class="tag bg-blue-100 text-blue-600">推奨</span></td></tr>
              <tr class="border-t"><td class="px-3 py-2 font-mono text-gray-500">#1~#5</td><td class="px-3 py-2">Brand/Model/Type/Year/Car</td><td class="px-3 py-2">VINなし時のフォールバック検索</td><td class="px-3 py-2"><span class="tag bg-gray-100 text-gray-600">任意</span></td></tr>
            </tbody>
          </table>
        </div>

        <!-- 対応メーカー -->
        <h3 class="font-bold text-lg mt-6 mb-3">対応メーカー・データカバレッジ</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="border rounded-xl p-4">
            <p class="text-sm font-bold text-green-700 mb-2"><i class="fas fa-check-circle mr-1"></i>イラスト対応（5社）</p>
            <div class="flex flex-wrap gap-2">
              <span class="tag bg-green-50 text-green-700">トヨタ</span><span class="tag bg-green-50 text-green-700">三菱</span><span class="tag bg-green-50 text-green-700">日産</span><span class="tag bg-green-50 text-green-700">ホンダ</span><span class="tag bg-green-50 text-green-700">ダイハツ</span>
            </div>
          </div>
          <div class="border rounded-xl p-4">
            <p class="text-sm font-bold text-blue-700 mb-2"><i class="fas fa-database mr-1"></i>データのみ（3社）</p>
            <div class="flex flex-wrap gap-2">
              <span class="tag bg-blue-50 text-blue-700">マツダ</span><span class="tag bg-blue-50 text-blue-700">スバル</span><span class="tag bg-blue-50 text-blue-700">スズキ</span>
            </div>
            <p class="text-xs text-gray-400 mt-2">※イラストは今後対応予定</p>
          </div>
        </div>

        <!-- コスト最適化 -->
        <h3 class="font-bold text-lg mt-6 mb-3">コスト最適化戦略</h3>
        <div class="bg-gray-50 rounded-xl p-4 text-sm">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-red-500 mb-1">~80%</div>
              <div class="text-xs text-gray-500">D1キャッシュによるAPI呼出削減率</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-500 mb-1">&lt;100ms</div>
              <div class="text-xs text-gray-500">キャッシュヒット時のレスポンス</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-500 mb-1">30日</div>
              <div class="text-xs text-gray-500">キャッシュTTL（部品データは安定）</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- フッター -->
  <footer class="border-t bg-white mt-8">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-gray-400">
      <span>PARTS HUB &times; ARGOS JPC デモ（本番環境には未反映）</span>
      <a href="/" class="hover:text-red-500">トップに戻る</a>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script>
    // ============ 状態管理 ============
    var currentTab = 'listing';
    var vehicle = null;
    var selectedParts = [];
    var allPartsData = [];
    var activeGroupId = null;

    // ============ タブ切替 ============
    function switchTab(tab) {
      currentTab = tab;
      ['listing','search','api'].forEach(function(t) {
        document.getElementById('tab-' + t).className = t === tab ? 'px-5 py-3 text-sm tab-active transition-all' : 'px-5 py-3 text-sm tab-inactive transition-all';
      });
      document.getElementById('section-api-design').classList.toggle('hidden', tab !== 'api');
      document.getElementById('section-vin').classList.toggle('hidden', tab === 'api');
      document.getElementById('section-vehicle').classList.toggle('hidden', tab === 'api' || !vehicle);

      // バナー切替
      var bl = document.getElementById('vin-banner-listing');
      var bs = document.getElementById('vin-banner-search');
      if (bl) bl.classList.toggle('hidden', tab !== 'listing');
      if (bs) bs.classList.toggle('hidden', tab !== 'search');

      if (tab === 'listing') {
        document.getElementById('step2-title').textContent = '出品する部品のグループを選択';
        document.getElementById('step2-desc').textContent = 'カテゴリを選んで、さらにサブグループから部品を絞り込めます';
      } else if (tab === 'search') {
        document.getElementById('step2-title').textContent = '探している部品のグループを選択';
        document.getElementById('step2-desc').textContent = '購入したい部品のカテゴリを選んでください';
      }
      updatePanelVisibility();
      selectedParts = [];
      updateSelectedParts();
    }

    function updatePanelVisibility() {
      var lp = document.getElementById('listing-panel');
      var sp = document.getElementById('search-panel');
      if (lp) lp.classList.toggle('hidden', currentTab !== 'listing');
      if (sp) sp.classList.toggle('hidden', currentTab !== 'search');
    }

    // ============ VIN入力 ============
    function setVin(v) {
      document.getElementById('vin-input').value = v;
      document.getElementById('vin-clear').classList.remove('hidden');
      searchVin();
    }
    function clearVin() {
      document.getElementById('vin-input').value = '';
      document.getElementById('vin-clear').classList.add('hidden');
      resetAll();
    }

    document.getElementById('vin-input').addEventListener('input', function() {
      this.value = this.value.toUpperCase();
      document.getElementById('vin-clear').classList.toggle('hidden', !this.value);
    });
    document.getElementById('vin-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') searchVin();
    });

    async function searchVin() {
      var vin = document.getElementById('vin-input').value.trim();
      if (!vin) { alert('車台番号を入力してください'); return; }

      document.getElementById('vin-error').classList.add('hidden');
      document.getElementById('vin-loading').classList.remove('hidden');
      document.getElementById('section-vehicle').classList.add('hidden');

      try {
        var t0 = performance.now();
        var res = await axios.get('/api/argos-demo/vin/' + encodeURIComponent(vin));
        var elapsed = Math.round(performance.now() - t0);
        vehicle = res.data.data;
        showVehicle(elapsed);
        loadGroups();
      } catch(e) {
        var errData = e.response && e.response.data;
        document.getElementById('vin-error').classList.remove('hidden');
        document.getElementById('vin-error-msg').textContent = errData ? errData.error : '検索に失敗しました';
        document.getElementById('vin-error-hint').textContent = errData && errData.hint ? errData.hint : '';
      }
      document.getElementById('vin-loading').classList.add('hidden');
    }

    // ============ 車両情報表示 ============
    function showVehicle(elapsed) {
      document.getElementById('section-vehicle').classList.remove('hidden');
      var v = vehicle;

      // ヘッダー
      document.getElementById('vh-maker').textContent = v.brand_ja;
      document.getElementById('vh-model').textContent = v.model_ja + (v.generation ? ' ' + v.generation : '');
      document.getElementById('vh-vin').textContent = 'VIN: ' + v.vin;
      document.getElementById('vehicle-summary-text').textContent = v.brand_ja + ' ' + v.model_ja + ' ' + v.grade + ' (' + v.year + '年)' + (elapsed ? ' - ' + elapsed + 'msで取得' : '');

      var fields = [
        { icon: 'fa-industry', label: 'メーカー', value: v.brand_ja + ' (' + v.brand + ')' },
        { icon: 'fa-car', label: '車名', value: v.model_ja + (v.generation ? ' ' + v.generation : '') },
        { icon: 'fa-hashtag', label: '型式', value: v.katashiki, mono: true },
        { icon: 'fa-barcode', label: '車台番号', value: v.vin, mono: true },
        { icon: 'fa-calendar', label: '年式', value: v.year + '年' + v.month + '月' },
        { icon: 'fa-star', label: 'グレード', value: v.grade },
        { icon: 'fa-cog', label: 'エンジン', value: v.engine + ' (' + v.displacement + ')' },
        { icon: 'fa-arrows-spin', label: 'ミッション', value: v.transmission },
        { icon: 'fa-road', label: '駆動', value: v.drive },
        { icon: 'fa-gas-pump', label: '燃料', value: v.fuel },
        { icon: 'fa-palette', label: 'ボディタイプ', value: v.body_type },
        { icon: 'fa-file-alt', label: '類別区分', value: v.type_class + '-' + v.ruibetsu, mono: true }
      ];

      document.getElementById('vehicle-info').innerHTML = fields.map(function(f) {
        return '<div class="vehicle-field"><span class="text-xs text-gray-500 flex items-center gap-1.5"><i class="fas ' + f.icon + ' text-gray-300 w-4 text-center"></i>' + f.label + '</span><span class="text-sm font-semibold text-gray-800' + (f.mono ? ' font-mono tracking-wide' : '') + '">' + f.value + '</span></div>';
      }).join('');
    }

    // ============ 部品グループ ============
    async function loadGroups() {
      try {
        var res = await axios.get('/api/argos-demo/groups');
        var groups = res.data.data;
        document.getElementById('groups-list').innerHTML = groups.map(function(g) {
          return '<div class="card-hover border-2 border-gray-200 rounded-xl p-3 text-center" id="group-' + g.id + '" onclick="selectGroup(\\'' + g.id + '\\',\\'' + g.name + '\\')">' +
            '<i class="fas ' + g.icon + ' text-2xl text-red-400 mb-1.5"></i>' +
            '<div class="text-xs font-semibold text-gray-800">' + g.name + '</div>' +
            '<div class="text-xs text-gray-400 mt-0.5">' + g.parts_count + '部品</div></div>';
        }).join('');
      } catch(e) { console.error(e); }
    }

    async function selectGroup(groupId, groupName) {
      // ハイライト
      document.querySelectorAll('#groups-list .card-hover').forEach(function(el) { el.classList.remove('active-group'); });
      var el = document.getElementById('group-' + groupId);
      if (el) el.classList.add('active-group');
      activeGroupId = groupId;

      document.getElementById('subgroups-section').classList.remove('hidden');
      document.getElementById('section-parts').classList.add('hidden');
      document.getElementById('subgroup-title').textContent = groupName + ' > サブグループ';
      try {
        var res = await axios.get('/api/argos-demo/groups/' + groupId + '/subgroups');
        var subs = res.data.data;
        document.getElementById('subgroups-list').innerHTML = subs.map(function(s) {
          return '<div class="card-hover border-2 border-gray-200 rounded-lg p-3 hover:border-red-400 flex items-center justify-between" onclick="selectSubgroup(\\'' + s.id + '\\',\\'' + s.name + '\\',\\'' + groupName + '\\')">' +
            '<div class="flex items-center gap-2"><span class="text-sm font-medium text-gray-800">' + s.name + '</span>' +
            (s.has_illustration ? '<span class="tag bg-green-100 text-green-600"><i class="fas fa-image mr-0.5"></i>イラスト</span>' : '') +
            '</div><i class="fas fa-chevron-right text-gray-300 text-xs"></i></div>';
        }).join('');
      } catch(e) { console.error(e); }
    }

    function backToGroups() {
      document.getElementById('subgroups-section').classList.add('hidden');
      document.getElementById('section-parts').classList.add('hidden');
      document.querySelectorAll('#groups-list .card-hover').forEach(function(el) { el.classList.remove('active-group'); });
      activeGroupId = null;
    }

    // ============ 部品一覧 ============
    async function selectSubgroup(subgroupId, subgroupName, groupName) {
      document.getElementById('section-parts').classList.remove('hidden');
      document.getElementById('step3-title').textContent = subgroupName;
      document.getElementById('step3-subtitle').textContent = groupName + ' > ' + subgroupName;
      updatePanelVisibility();

      try {
        var t0 = performance.now();
        var res = await axios.get('/api/argos-demo/subgroups/' + subgroupId + '/parts');
        var elapsed = Math.round(performance.now() - t0);
        var parts = res.data.data;
        allPartsData = parts;
        document.getElementById('parts-count').textContent = parts.length + '件 (' + elapsed + 'ms)';
        renderParts(parts);
      } catch(e) { console.error(e); }
    }

    function renderParts(parts) {
      document.getElementById('parts-list').innerHTML = parts.map(function(p, i) {
        var isSelected = selectedParts.some(function(sp) { return sp.part_number === p.part_number; });
        return '<div class="part-row border-b px-4 py-3 cursor-pointer' + (isSelected ? ' selected' : '') + '" onclick="togglePart(\\'' + p.part_number + '\\', this)" data-pn="' + p.part_number + '">' +
          '<div class="flex items-center justify-between">' +
            '<div class="min-w-0 flex-1">' +
              '<div class="flex items-center gap-2 flex-wrap">' +
                '<span class="font-mono text-sm font-bold text-red-600">' + p.part_number + '</span>' +
                (p.qty > 1 ? '<span class="tag bg-gray-100 text-gray-500">x' + p.qty + '</span>' : '') +
                (p.compatible && p.compatible.length > 0 ? '<span class="tag bg-blue-50 text-blue-600"><i class="fas fa-exchange-alt mr-0.5"></i>互換' + p.compatible.length + '件</span>' : '') +
              '</div>' +
              '<div class="text-sm text-gray-800 mt-0.5">' + p.name + '</div>' +
              (p.remark ? '<div class="text-xs text-gray-400">' + p.remark + '</div>' : '') +
              (p.compatible && p.compatible.length > 0 ? '<div class="text-xs text-blue-400 mt-0.5"><i class="fas fa-link mr-0.5"></i>互換: ' + p.compatible.join(', ') + '</div>' : '') +
            '</div>' +
            '<div class="text-right ml-3 flex-shrink-0">' +
              '<div class="text-sm font-bold text-gray-800">&yen;' + Math.floor(Number(p.price) * 1.1).toLocaleString() + '</div>' +
              '<div class="text-xs text-gray-400">参考価格</div>' +
            '</div>' +
          '</div></div>';
      }).join('');
    }

    function filterParts(query) {
      if (!query) { renderParts(allPartsData); return; }
      var q = query.toLowerCase();
      var filtered = allPartsData.filter(function(p) {
        return p.part_number.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      });
      renderParts(filtered);
    }

    function togglePart(partNumber, el) {
      var p = allPartsData.find(function(pp) { return pp.part_number === partNumber; });
      if (!p) return;

      var existIdx = selectedParts.findIndex(function(sp) { return sp.part_number === partNumber; });
      if (existIdx >= 0) {
        selectedParts.splice(existIdx, 1);
        el.classList.remove('selected');
      } else {
        selectedParts.push(p);
        el.classList.add('selected');
      }
      updateSelectedParts();
    }

    function updateSelectedParts() {
      var count = selectedParts.length;

      if (currentTab === 'listing') {
        var area = document.getElementById('selected-parts-summary');
        var noSel = document.getElementById('no-parts-selected');
        var btn = document.getElementById('apply-btn');
        var countEl = document.getElementById('selected-count');
        var preview = document.getElementById('listing-preview');

        if (count === 0) {
          area.innerHTML = '';
          noSel.classList.remove('hidden');
          btn.classList.add('hidden');
          countEl.classList.add('hidden');
          preview.classList.add('hidden');
          return;
        }
        noSel.classList.add('hidden');
        btn.classList.remove('hidden');
        countEl.classList.remove('hidden');
        countEl.textContent = count + '件選択中';

        area.innerHTML = selectedParts.map(function(p) {
          return '<div class="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 shadow-sm border"><div class="flex items-center gap-2"><span class="font-mono text-sm font-bold text-red-600">' + p.part_number + '</span><span class="text-sm text-gray-600">' + p.name + '</span></div><span class="font-bold text-sm">&yen;' + Math.floor(Number(p.price) * 1.1).toLocaleString() + ' <span style="font-size:10px;color:#6b7280;">税込</span></span></div>';
        }).join('');

        // プレビュー
        if (vehicle) {
          preview.classList.remove('hidden');
          var v = vehicle;
          var partNames = selectedParts.map(function(p) { return p.part_number + ' ' + p.name; }).join(', ');
          var previewFields = [
            { label: 'カテゴリ', value: '（部品に応じて自動設定）', icon: 'fa-tag' },
            { label: '適合車種', value: v.brand_ja + ' ' + v.model_ja + ' ' + v.grade, icon: 'fa-car' },
            { label: '型式', value: v.katashiki, icon: 'fa-hashtag' },
            { label: '年式', value: v.year + '年' + v.month + '月', icon: 'fa-calendar' },
            { label: 'OEM品番', value: selectedParts.map(function(p) { return p.part_number; }).join(', '), icon: 'fa-barcode' },
            { label: '参考新品価格', value: '&yen;' + Math.floor(selectedParts.reduce(function(s,p) { return s + p.price; }, 0) * 1.1).toLocaleString() + '（税込）', icon: 'fa-yen-sign' }
          ];
          document.getElementById('listing-preview-content').innerHTML = previewFields.map(function(f) {
            return '<div class="bg-gray-50 rounded-lg p-2.5"><p class="text-gray-400 mb-0.5 flex items-center gap-1"><i class="fas ' + f.icon + ' w-3 text-center"></i>' + f.label + '</p><p class="font-semibold text-gray-800">' + f.value + '</p></div>';
          }).join('');
        }

      } else if (currentTab === 'search') {
        var area2 = document.getElementById('search-results-area');
        var noSel2 = document.getElementById('no-parts-search');
        var btn2 = document.getElementById('search-hub-btn');
        var countEl2 = document.getElementById('search-selected-count');
        var hubSection = document.getElementById('hub-listings-section');

        if (count === 0) {
          area2.innerHTML = '';
          noSel2.classList.remove('hidden');
          btn2.classList.add('hidden');
          countEl2.classList.add('hidden');
          hubSection.classList.add('hidden');
          return;
        }
        noSel2.classList.add('hidden');
        btn2.classList.remove('hidden');
        countEl2.classList.remove('hidden');
        countEl2.textContent = count + '件選択中';

        area2.innerHTML = selectedParts.map(function(p) {
          var allPns = [p.part_number].concat(p.compatible || []);
          return '<div class="bg-white rounded-lg px-4 py-3 shadow-sm border"><div class="flex items-center justify-between"><div><span class="font-mono font-bold text-red-600">' + p.part_number + '</span><span class="text-sm text-gray-600 ml-2">' + p.name + '</span></div><span class="text-xs text-gray-400">検索対象: ' + allPns.length + '品番</span></div>' +
            (p.compatible && p.compatible.length > 0 ? '<div class="text-xs text-blue-400 mt-1"><i class="fas fa-link mr-0.5"></i>互換品番も含めて検索: ' + p.compatible.join(', ') + '</div>' : '') +
            '</div>';
        }).join('');
      }
    }

    // ============ 出品連携 ============
    function applyToListing() {
      if (!vehicle || selectedParts.length === 0) return;
      var v = vehicle;
      var lines = [];
      lines.push('=== 出品フォームへ自動入力される情報 ===');
      lines.push('');
      lines.push('[車両情報]');
      lines.push('メーカー: ' + v.brand_ja);
      lines.push('車名: ' + v.model_ja + ' ' + v.grade);
      lines.push('型式: ' + v.katashiki);
      lines.push('年式: ' + v.year + '年' + v.month + '月');
      lines.push('VIN: ' + v.vin);
      lines.push('');
      lines.push('[選択部品]');
      selectedParts.forEach(function(p) {
        lines.push('  ' + p.part_number + ' ' + p.name + ' \\xA5' + Math.floor(Number(p.price) * 1.1).toLocaleString() + '(税込)');
      });
      lines.push('');
      lines.push('合計参考価格: \\xA5' + Math.floor(selectedParts.reduce(function(s,p) { return s + p.price; }, 0) * 1.1).toLocaleString() + '(税込)');
      alert(lines.join('\\n'));
    }

    // ============ PARTS HUB検索 ============
    async function searchOnHub() {
      if (selectedParts.length === 0) return;
      var pns = [];
      selectedParts.forEach(function(p) {
        pns.push(p.part_number);
        if (p.compatible) pns = pns.concat(p.compatible);
      });

      var hubSection = document.getElementById('hub-listings-section');
      var hubList = document.getElementById('hub-listings');
      hubSection.classList.remove('hidden');
      hubList.innerHTML = '<div class="text-center py-4"><div class="w-6 h-6 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin inline-block"></div><p class="text-xs text-gray-400 mt-2">PARTS HUB内を検索中...</p></div>';

      try {
        var res = await axios.get('/api/argos-demo/search-listings?pn=' + pns.join(','));
        var listings = res.data.data;

        if (listings.length === 0) {
          hubList.innerHTML = '<div class="text-center py-4 text-sm text-gray-400"><i class="fas fa-search mr-1"></i>該当する出品商品はありませんでした</div>';
          return;
        }

        hubList.innerHTML = listings.map(function(l) {
          return '<div class="listing-card bg-white rounded-lg p-4 shadow-sm border cursor-pointer">' +
            '<div class="flex items-center justify-between mb-2">' +
              '<div class="flex items-center gap-2"><span class="font-mono text-sm font-bold text-blue-600">' + l.part_number + '</span><span class="tag bg-' + (l.condition === '美品' ? 'green' : l.condition === '良品' ? 'yellow' : 'gray') + '-100 text-' + (l.condition === '美品' ? 'green' : l.condition === '良品' ? 'yellow' : 'gray') + '-600">' + l.condition + '</span></div>' +
              '<span class="font-bold text-lg text-red-600">&yen;' + Math.floor(Number(l.price) * 1.1).toLocaleString() + ' <span style="font-size:10px;font-weight:400;color:#6b7280;">税込</span></span>' +
            '</div>' +
            '<p class="text-sm text-gray-700 mb-1">' + l.title + '</p>' +
            '<div class="flex items-center justify-between text-xs text-gray-400">' +
              '<span><i class="fas fa-user mr-1"></i>' + l.seller + '</span>' +
              '<span><i class="fas fa-image mr-1"></i>' + l.image_count + '枚 | ' + l.listed_at + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        hubList.innerHTML = '<div class="text-center py-4 text-sm text-red-400">検索に失敗しました</div>';
      }
    }

    // ============ リセット ============
    function resetAll() {
      vehicle = null;
      selectedParts = [];
      allPartsData = [];
      activeGroupId = null;
      document.getElementById('section-vehicle').classList.add('hidden');
      document.getElementById('subgroups-section').classList.add('hidden');
      document.getElementById('section-parts').classList.add('hidden');
      var hubSection = document.getElementById('hub-listings-section');
      if (hubSection) hubSection.classList.add('hidden');
    }
  </script>
</body>
</html>`)
})

// === 適合車両情報デモページ（本番未使用・サンプルUI） ===
app.get('/vehicle-demo', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>適合車両情報入力デモ - PARTS HUB</title>
      ${TAILWIND_CSS}
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
          log.innerHTML += '<div class="flex justify-between"><span class="text-gray-400">' + new Date().toLocaleTimeString('ja-JP', {timeZone: 'Asia/Tokyo'}) + '</span><span>' + label + '</span><span class="' + color + '">' + ms + 'ms</span><span class="text-gray-500">' + count + '件</span></div>';
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>銀行口座情報入力デモ - PARTS HUB</title>
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
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

        <script src="${v('/static/bank-db.js')}"></script>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>よくある質問（FAQ） - PARTS HUB（パーツハブ）</title>
        <meta name="description" content="PARTS HUBの利用方法、手数料、配送、返品などについてのよくある質問をまとめています。">
        <link rel="canonical" href="https://parts-hub-tci.com/faq">
        ${hreflang("/faq")}
        <meta property="og:type" content="website">
        <meta property="og:title" content="よくある質問（FAQ） - PARTS HUB">
        <meta property="og:description" content="PARTS HUBの利用方法、手数料、配送、返品などについてのよくある質問をまとめています。">
        <meta property="og:url" content="https://parts-hub-tci.com/faq">
        <meta property="og:site_name" content="PARTS HUB">
        <meta property="og:locale" content="ja_JP">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
        <meta name="theme-color" content="#ff4757">
        ${TAILWIND_CSS}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${BREADCRUMB_CSS}</style>

        <!-- BreadcrumbList JSON-LD -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "PARTS HUB",
            "item": "https://parts-hub-tci.com/"
          },{
            "@type": "ListItem",
            "position": 2,
            "name": "よくある質問（FAQ）"
          }]
        }
        </script>

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
              "text": "販売手数料は商品価格の10%（出品者負担）です。出品者の出金時に振込手数料330円/回がかかります。購入者はサービス手数料無料ですが、カード決済時は決済手数料330円（税込）、銀行振込時は振込手数料（各金融機関により異なる）が購入者負担となります。"
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
              "text": "クレジットカード決済（Visa、Mastercard、JCB、American Express）と請求書払い（銀行振込）に対応しています。クレジットカード決済は即時決済、請求書払いは振込確認後に発送となります。法人・個人事業主のお客様には請求書払いが便利です。"
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
              "text": "商品が購入者に届き、取引が完了すると売上金が確定します。売上金から販売手数料10%を差し引いた金額が振込可能額となります。マイページから銀行口座を登録し、振込申請を行うと指定口座に振り込まれます。振込申請のたびに振込手数料330円が差し引かれます。最低出金額は1,000円からです。"
            }
          },{
            "@type": "Question",
            "name": "代理出品サービスとは何ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "大量の在庫や出品作業が困難な場合、当社スタッフがお客様に代わって撮影・出品・発送までを代行するサービスです。出張代理出品と郵送代理出品の2種類があります。詳細はお問い合わせください。"
            }
          },{
            "@type": "Question",
            "name": "純正部品と社外品の違いは何ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "純正部品はメーカー品質保証で適合性が確実ですが価格は高めです。社外品は純正の30〜60%の価格で、消耗品は十分な品質があります。PARTS HUBでは両方を取り扱い、出品者にチャットで確認も可能です。"
            }
          },{
            "@type": "Question",
            "name": "余剰在庫（デッドストック）を処分するにはどうすれば？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "PARTS HUBに無料で出品できます。在庫保有コストは仕入れ値の年間15〜25%。写真を撮ってスマホから数分で出品完了、全国の整備工場に販売可能です。"
            }
          },{
            "@type": "Question",
            "name": "SST（特殊工具）の売買はできますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "はい、SST専用カテゴリがあります。タイミングチェーン工具、ハブベアリングプーラー、診断機など、廃業や車種変更した工場から良品SSTが出品されています。"
            }
          },{
            "@type": "Question",
            "name": "エンジンやミッションなど大型部品の取引は可能ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "はい、路線便（西濃運輸・福山通運）で全国配送可能です。パレット積みにも対応。出品者との直接引き取りも可能です。写真・チャットで事前に状態確認ができます。"
            }
          },{
            "@type": "Question",
            "name": "品番（部品番号）で検索できますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "はい、フリーワード検索でOEM品番や純正部品番号で検索できます。例：04465-28490（ブレーキパッド）や、車種名+パーツ名での検索も可能です。"
            }
          },{
            "@type": "Question",
            "name": "取引の安全性はどのように確保されていますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Stripe社のSSL/TLS暗号化決済、取引完了までのエスクロー方式、出品者の本人確認、購入前のチャット機能で安全な取引を実現しています。"
            }
          },{
            "@type": "Question",
            "name": "商品が届かない場合はどうなりますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "エスクロー方式により受取確認まで売上金は確定しません。追跡番号での確認、出品者へのチャット問い合わせ、PARTS HUB事務局への連絡で対応します。"
            }
          },{
            "@type": "Question",
            "name": "価格交渉はできますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "はい、商品ページの価格交渉ボタンから希望金額を提示できます。出品者が承認すると提示金額で購入可能です。まとめ買いの意思を伝えると承認率が上がります。"
            }
          },{
            "@type": "Question",
            "name": "中古パーツの品質はどう判断すればよいですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "PARTS HUBでは商品状態を6段階（新品〜ジャンク）で表示。複数枚の写真で外観確認、走行距離・使用期間の記載確認、チャットで出品者に直接質問、過去の取引評価を参考にできます。"
            }
          },{
            "@type": "Question",
            "name": "法人としての利用・請求書発行は可能ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "はい、法人・個人事業主として利用可能です。領収書はマイページから発行、年間取引明細のダウンロード、インボイス対応（適格請求書発行事業者の登録番号記載）も可能です。"
            }
          }]
        }
        </script>

        <!-- Open Graph -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="よくある質問（FAQ） - PARTS HUB">
        <meta property="og:description" content="PARTS HUBの利用方法、手数料、配送、返品などについてのよくある質問">
        <meta property="og:url" content="https://parts-hub-tci.com/faq">
        
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <a href="/" class="text-red-500 hover:text-red-600 transition-colors flex-shrink-0" title="TOPへ"><i class="fas fa-home text-lg"></i></a>
                <button onclick="window.history.back()" class="text-gray-600 hover:text-gray-900 flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>戻る
                </button>
                </div>
                <h1 class="text-red-500 font-bold text-lg">よくある質問</h1>
                <div class="w-16"></div>
            </div>
        </header>
        ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'よくある質問'}])}

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
                                    <h4 class="font-bold text-red-700 mb-2">販売手数料（出品者負担）</h4>
                                    <p class="text-2xl font-bold text-red-600 mb-1">10%</p>
                                    <p class="text-sm text-gray-600">商品が売れた時のみ、出品者から弴収</p>
                                </div>
                                <div class="bg-white p-4 rounded border-2 border-yellow-200">
                                    <h4 class="font-bold text-yellow-700 mb-2">出金振込手数料（出品者）</h4>
                                    <p class="text-2xl font-bold text-yellow-600 mb-1">330円/回</p>
                                    <p class="text-sm text-gray-600">振込申請のたびに差引</p>
                                </div>
                                <div class="bg-white p-4 rounded border-2 border-blue-200">
                                    <h4 class="font-bold text-blue-700 mb-2">購入者の負担</h4>
                                    <p class="text-lg font-bold text-blue-600 mb-1">カード¥330 / 振込実費</p>
                                    <p class="text-sm text-gray-600">サービス手数料(10%)は出品者負担</p>
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
                            <div class="grid md:grid-cols-2 gap-4">
                                <div class="bg-white p-4 rounded text-center border-2 border-blue-200">
                                    <i class="fas fa-credit-card text-blue-500 text-3xl mb-2"></i>
                                    <h4 class="font-bold text-gray-900 mb-1">クレジットカード</h4>
                                    <p class="text-xs text-gray-600">Visa / Mastercard / JCB / Amex</p>
                                    <span class="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">即時決済</span>
                                </div>
                                <div class="bg-white p-4 rounded text-center border-2 border-green-200">
                                    <i class="fas fa-file-invoice-dollar text-green-500 text-3xl mb-2"></i>
                                    <h4 class="font-bold text-gray-900 mb-1">請求書払い（銀行振込）</h4>
                                    <p class="text-xs text-gray-600">法人・個人事業主向け</p>
                                    <span class="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">BtoB対応</span>
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
                                    <strong>出品は無料！</strong>売れた時のみ出品者が販売手数料10%を負担。購入者の手数料は無料
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
                                    <span>指定口座に振込（振込手数料330円/回）</span>
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

            <!-- カテゴリ区切り: 整備工場の日常業務 -->
            <div class="mt-10 mb-4">
              <h2 class="text-lg font-bold text-gray-800 flex items-center">
                <span class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3"><i class="fas fa-tools text-red-500 text-sm"></i></span>
                整備工場の日常業務について
              </h2>
              <p class="text-sm text-gray-500 mt-1 ml-11">パーツの仕入れ・在庫管理に関するよくある質問</p>
            </div>

            <div class="space-y-4">
                <!-- FAQ 11 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq11')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                純正部品と社外品の違いは何ですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq11"></i>
                    </button>
                    <div id="faq11" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="grid md:grid-cols-2 gap-4 mb-4">
                                <div class="bg-white p-4 rounded border-l-4 border-blue-500">
                                    <h4 class="font-bold text-blue-700 mb-2">純正部品（OEM）</h4>
                                    <ul class="text-sm text-gray-700 space-y-1">
                                        <li>- 自動車メーカー純正の品質保証</li>
                                        <li>- 適合性が確実</li>
                                        <li>- 価格は高め</li>
                                        <li>- 安全部品は純正推奨</li>
                                    </ul>
                                </div>
                                <div class="bg-white p-4 rounded border-l-4 border-green-500">
                                    <h4 class="font-bold text-green-700 mb-2">社外品（アフターマーケット）</h4>
                                    <ul class="text-sm text-gray-700 space-y-1">
                                        <li>- 純正の30〜60%の価格</li>
                                        <li>- 消耗品は十分な品質</li>
                                        <li>- 選択肢が豊富</li>
                                        <li>- 電装系は互換性に注意</li>
                                    </ul>
                                </div>
                            </div>
                            <p class="text-sm text-gray-600">PARTS HUBでは純正品・社外品の両方を出品者が明記しており、チャットで出品者に直接確認も可能です。<a href="/guide/genuine-vs-aftermarket" class="text-red-500 hover:underline font-semibold ml-1">詳しい比較ガイドはこちら</a></p>
                        </div>
                    </div>
                </div>

                <!-- FAQ 12 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq12')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                余剰在庫（デッドストック）を処分するにはどうすれば？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq12"></i>
                    </button>
                    <div id="faq12" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">車検用に仕入れたが不要になったパーツ、廃車から取り外した良品パーツなど、工場に眠る在庫をPARTS HUBで全国の整備工場に販売できます。</p>
                            <div class="bg-white p-4 rounded border-2 border-amber-200 mb-3">
                                <h4 class="font-bold text-amber-700 mb-2"><i class="fas fa-lightbulb mr-1"></i>在庫保有コストの目安</h4>
                                <p class="text-sm text-gray-700">仕入れ値の年間15〜25%が在庫保有コスト（保管スペース・棚卸し人件費・機会損失）として発生しています。1点でも早い現金化が経営改善の鍵です。</p>
                            </div>
                            <p class="text-sm text-gray-600">出品は無料、写真を撮ってスマホから数分で完了。<a href="/guide/deadstock-management" class="text-red-500 hover:underline font-semibold">デッドストック活用ガイド</a></p>
                        </div>
                    </div>
                </div>

                <!-- FAQ 13 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq13')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                SST（特殊工具）の売買はできますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq13"></i>
                    </button>
                    <div id="faq13" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">はい、SST（特殊工具）専用カテゴリがあります。メーカー指定の特殊工具は新品で数十万円する場合もありますが、中古品であれば大幅にコストを抑えられます。</p>
                            <div class="flex flex-wrap gap-2 mb-3">
                                <span class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">タイミングチェーン工具</span>
                                <span class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">ハブベアリングプーラー</span>
                                <span class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">エンジンクレーン</span>
                                <span class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">ミッションジャッキ</span>
                                <span class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">診断機</span>
                            </div>
                            <p class="text-sm text-gray-600">廃業した工場や車種変更した工場から良品SSTが出品されることがあります。<a href="/guide/sst-tool-guide" class="text-red-500 hover:underline font-semibold">SST調達ガイド</a></p>
                        </div>
                    </div>
                </div>

                <!-- FAQ 14 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq14')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                エンジンやミッションなど大型部品の取引は可能ですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq14"></i>
                    </button>
                    <div id="faq14" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">はい、エンジン・ミッション・デフ・足回りASSYなどの大型部品も多数取引されています。</p>
                            <div class="space-y-2">
                                <div class="flex items-start"><i class="fas fa-truck text-blue-500 mr-2 mt-1"></i><span class="text-gray-700"><strong>配送：</strong>路線便（西濃運輸・福山通運など）で全国配送可能。パレット積みにも対応。</span></div>
                                <div class="flex items-start"><i class="fas fa-handshake text-green-500 mr-2 mt-1"></i><span class="text-gray-700"><strong>直接引き取り：</strong>出品者と相談のうえ、現地引き取りも可能です。</span></div>
                                <div class="flex items-start"><i class="fas fa-camera text-red-500 mr-2 mt-1"></i><span class="text-gray-700"><strong>状態確認：</strong>写真・動画での状態確認、チャットでの詳細質問ができます。</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 15 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq15')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                品番（部品番号）で検索できますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq15"></i>
                    </button>
                    <div id="faq15" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">はい、PARTS HUBの検索機能ではフリーワード検索に対応しており、OEM品番や純正部品番号で検索できます。出品者がタイトルや説明に品番を記載している場合、ヒットします。</p>
                            <div class="bg-white p-4 rounded border-2 border-blue-200">
                                <h4 class="font-bold text-blue-700 mb-2"><i class="fas fa-search mr-1"></i>検索のコツ</h4>
                                <ul class="text-sm text-gray-700 space-y-1">
                                    <li>- 純正品番：例「04465-28490」（ブレーキパッド）</li>
                                    <li>- 車種 + パーツ名：例「プリウス ZVW30 ヘッドライト」</li>
                                    <li>- メーカー + パーツ名：例「トヨタ エアフィルター」</li>
                                </ul>
                            </div>
                            <div class="mt-3 text-center">
                                <a href="/search" class="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"><i class="fas fa-search mr-2"></i>商品を検索する</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- カテゴリ区切り: 取引の安全性 -->
            <div class="mt-10 mb-4">
              <h2 class="text-lg font-bold text-gray-800 flex items-center">
                <span class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3"><i class="fas fa-shield-alt text-blue-500 text-sm"></i></span>
                取引の安全性・トラブル対応
              </h2>
              <p class="text-sm text-gray-500 mt-1 ml-11">安心して取引するための仕組みについて</p>
            </div>

            <div class="space-y-4">
                <!-- FAQ 16 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq16')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                取引の安全性はどのように確保されていますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq16"></i>
                    </button>
                    <div id="faq16" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="grid sm:grid-cols-2 gap-3 mb-3">
                                <div class="bg-white p-3 rounded border-l-4 border-blue-500">
                                    <h4 class="font-bold text-sm text-gray-900 mb-1"><i class="fas fa-lock text-blue-500 mr-1"></i>決済保護</h4>
                                    <p class="text-xs text-gray-600">Stripe社のSSL/TLS暗号化決済で安全にお支払い</p>
                                </div>
                                <div class="bg-white p-3 rounded border-l-4 border-green-500">
                                    <h4 class="font-bold text-sm text-gray-900 mb-1"><i class="fas fa-hand-holding-usd text-green-500 mr-1"></i>エスクロー</h4>
                                    <p class="text-xs text-gray-600">取引完了まで売上金をPARTS HUBが預かる安心設計</p>
                                </div>
                                <div class="bg-white p-3 rounded border-l-4 border-purple-500">
                                    <h4 class="font-bold text-sm text-gray-900 mb-1"><i class="fas fa-user-check text-purple-500 mr-1"></i>本人確認</h4>
                                    <p class="text-xs text-gray-600">出品者は会員登録時に身元確認を実施</p>
                                </div>
                                <div class="bg-white p-3 rounded border-l-4 border-red-500">
                                    <h4 class="font-bold text-sm text-gray-900 mb-1"><i class="fas fa-comments text-red-500 mr-1"></i>チャット機能</h4>
                                    <p class="text-xs text-gray-600">購入前に出品者と直接やり取りが可能</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 17 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq17')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                商品が届かない場合はどうなりますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq17"></i>
                    </button>
                    <div id="faq17" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">PARTS HUBではエスクロー方式を採用しています。購入者が受取確認をするまで売上金は確定しません。万が一商品が届かない場合は以下の手順で対応します。</p>
                            <div class="space-y-2">
                                <div class="flex items-start gap-3">
                                    <div class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                                    <span class="text-sm text-gray-700">発送通知の追跡番号で配送状況を確認</span>
                                </div>
                                <div class="flex items-start gap-3">
                                    <div class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                                    <span class="text-sm text-gray-700">チャットで出品者に配送状況を問い合わせ</span>
                                </div>
                                <div class="flex items-start gap-3">
                                    <div class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                                    <span class="text-sm text-gray-700">解決しない場合はお問い合わせフォームからPARTS HUB事務局に連絡</span>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-3">※配送事故の場合は配送会社の補償制度も適用されます。</p>
                        </div>
                    </div>
                </div>

                <!-- FAQ 18 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq18')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                価格交渉はできますか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq18"></i>
                    </button>
                    <div id="faq18" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">はい、商品ページの「価格交渉」ボタンから希望金額を提示できます。出品者が承認すると、提示した金額で購入が可能になります。</p>
                            <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                                <p class="text-sm text-blue-900"><i class="fas fa-info-circle mr-1"></i><strong>交渉のコツ：</strong>まとめ買いの意思を伝えると承認率が上がる傾向にあります。</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 19 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq19')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                中古パーツの品質はどう判断すればよいですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq19"></i>
                    </button>
                    <div id="faq19" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">PARTS HUBでは出品時に商品の状態を「新品」「未使用に近い」「目立った傷や汚れなし」「やや傷や汚れあり」「傷や汚れあり」「ジャンク」の6段階で表示しています。</p>
                            <div class="bg-white p-4 rounded border-2 border-green-200">
                                <h4 class="font-bold text-green-700 mb-2"><i class="fas fa-check-double mr-1"></i>品質確認のポイント</h4>
                                <ul class="text-sm text-gray-700 space-y-1">
                                    <li>- 複数枚の写真で外観・傷を確認</li>
                                    <li>- 走行距離・使用期間の記載を確認</li>
                                    <li>- 不明点はチャットで出品者に直接質問</li>
                                    <li>- 出品者の過去の取引評価を参考にする</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ 20 -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onclick="toggleFAQ('faq20')" class="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900 mb-1">
                                <i class="fas fa-circle text-red-500 text-xs mr-2"></i>
                                法人としての利用・請求書発行は可能ですか？
                            </h3>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform" id="icon-faq20"></i>
                    </button>
                    <div id="faq20" class="hidden px-6 pb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700 mb-3">はい、法人・個人事業主としてご利用いただけます。会員登録時に法人情報を登録することで、取引履歴の管理がしやすくなります。</p>
                            <div class="space-y-2 text-sm text-gray-700">
                                <div class="flex items-start"><i class="fas fa-file-invoice text-blue-500 mr-2 mt-1"></i><span><strong>領収書：</strong>取引完了後にマイページから発行可能です。</span></div>
                                <div class="flex items-start"><i class="fas fa-building text-green-500 mr-2 mt-1"></i><span><strong>法人利用：</strong>仕入れ経費として計上可能。年間取引明細もダウンロードできます。</span></div>
                                <div class="flex items-start"><i class="fas fa-receipt text-amber-500 mr-2 mt-1"></i><span><strong>インボイス：</strong>適格請求書発行事業者の場合はプロフィールに登録番号を記載できます。</span></div>
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
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理者ログイン - PARTS HUB</title>
        <meta name="robots" content="noindex, nofollow">
        ${TAILWIND_CSS}
        
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

// ===== 404 ページ =====
app.notFound((c) => {
  const accept = c.req.header('Accept') || ''
  // API リクエストにはJSONで返す
  if (c.req.path.startsWith('/api/') || accept.includes('application/json')) {
    return c.json({ success: false, error: 'エンドポイントが見つかりません' }, 404)
  }
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ページが見つかりません - PARTS HUB</title>
  ${TAILWIND_CSS}
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen flex flex-col">
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="text-red-500 font-bold text-xl">PARTS HUB</a>
    </div>
  </header>
  <main class="flex-1 flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="text-8xl font-black text-gray-200 mb-4">404</div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">ページが見つかりません</h1>
      <p class="text-gray-500 mb-8">お探しのページは移動または削除された可能性があります。</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/" class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors">
          <i class="fas fa-home mr-2"></i>トップページへ
        </a>
        <a href="/search" class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
          <i class="fas fa-search mr-2"></i>商品を検索
        </a>
      </div>
    </div>
  </main>
</body>
</html>`, 404)
})

// ===== グローバルエラーハンドラー =====
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  const accept = c.req.header('Accept') || ''
  if (c.req.path.startsWith('/api/') || accept.includes('application/json')) {
    return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500)
  }
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>エラー - PARTS HUB</title>
  ${TAILWIND_CSS}
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen flex flex-col">
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-4xl mx-auto px-4 py-4">
      <a href="/" class="text-red-500 font-bold text-xl">PARTS HUB</a>
    </div>
  </header>
  <main class="flex-1 flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <i class="fas fa-exclamation-triangle text-6xl text-yellow-400 mb-4"></i>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
      <p class="text-gray-500 mb-8">ご不便をおかけして申し訳ありません。しばらく経ってから再度お試しください。</p>
      <a href="/" class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors">
        <i class="fas fa-home mr-2"></i>トップページへ
      </a>
    </div>
  </main>
</body>
</html>`, 500)
})

export default app

// ===== 以下は admin-pages.ts に移行済みのため未使用 =====
/*
app.get('/admin-old-unused', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
        ${PERF_HINTS}
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理画面 - PARTS HUB</title>
        <meta name="robots" content="noindex, nofollow">
        ${TAILWIND_CSS}
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
                            <p class="text-xs text-gray-500">\${new Date(user.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</p>
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
                    <td class="px-6 py-4 text-sm text-gray-600">\${new Date(user.created_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})}</td>
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
