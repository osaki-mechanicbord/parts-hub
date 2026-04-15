import { Hono } from 'hono'
import type { Bindings } from '../types'
import { breadcrumbHtml, BREADCRUMB_CSS } from '../breadcrumb'
import { sendEmail, SUPPORT_EMAIL } from '../email-config'
import * as tpl from '../email-templates'

const franchise = new Hono<{ Bindings: Bindings }>()

// ── ヘルパー ──
const BUILD_VERSION = '20260407a'
const v = (path: string) => `${path}?v=${BUILD_VERSION}`
const PERF_HINTS = `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
const TAILWIND_CSS = `<link rel="stylesheet" href="/static/tailwind.css?v=${BUILD_VERSION}">`

const hreflang = (path: string) => `<link rel="alternate" hreflang="ja" href="https://parts-hub-tci.com${path}">
<link rel="alternate" hreflang="x-default" href="https://parts-hub-tci.com${path}">`

// 都道府県slugマップ
const PREF_NAMES: Record<string, string> = {
  hokkaido:'北海道',aomori:'青森県',iwate:'岩手県',miyagi:'宮城県',akita:'秋田県',yamagata:'山形県',
  fukushima:'福島県',ibaraki:'茨城県',tochigi:'栃木県',gunma:'群馬県',saitama:'埼玉県',chiba:'千葉県',
  tokyo:'東京都',kanagawa:'神奈川県',niigata:'新潟県',toyama:'富山県',ishikawa:'石川県',fukui:'福井県',
  yamanashi:'山梨県',nagano:'長野県',gifu:'岐阜県',shizuoka:'静岡県',aichi:'愛知県',mie:'三重県',
  shiga:'滋賀県',kyoto:'京都府',osaka:'大阪府',hyogo:'兵庫県',nara:'奈良県',wakayama:'和歌山県',
  tottori:'鳥取県',shimane:'島根県',okayama:'岡山県',hiroshima:'広島県',yamaguchi:'山口県',
  tokushima:'徳島県',kagawa:'香川県',ehime:'愛媛県',kochi:'高知県',
  fukuoka:'福岡県',saga:'佐賀県',nagasaki:'長崎県',kumamoto:'熊本県',oita:'大分県',miyazaki:'宮崎県',
  kagoshima:'鹿児島県',okinawa:'沖縄県'
}

// CMS値取得ヘルパー
async function getCmsValues(DB: any): Promise<Record<string, any>> {
  try {
    const rows = await DB.prepare('SELECT key, value_json FROM franchise_cms').all()
    const vals: Record<string, any> = {}
    for (const r of (rows.results || [])) {
      try { vals[r.key] = JSON.parse(r.value_json) } catch { vals[r.key] = r.value_json }
    }
    return vals
  } catch { return {} }
}

// エリアデータ取得
async function getAreaData(DB: any): Promise<Record<string, { status: string; partner_count: number }>> {
  try {
    const rows = await DB.prepare('SELECT pref_slug, status, partner_count FROM franchise_areas').all()
    const data: Record<string, { status: string; partner_count: number }> = {}
    for (const r of (rows.results || [])) {
      data[r.pref_slug] = { status: r.status, partner_count: r.partner_count }
    }
    return data
  } catch { return {} }
}

// ── 共通フッター（index.tsxのFooterと同じ構造） ──
const Footer = () => `
<footer class="bg-gray-900 text-white mt-16">
    <div class="max-w-6xl mx-auto px-4 py-8">
        <div class="text-center mb-6">
            <a href="/" class="inline-block"><h3 class="font-bold text-xl">PARTS HUB</h3></a>
            <p class="text-xs text-gray-400 mt-1">自動車部品のフリーマーケット</p>
        </div>
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
        <div class="border-t border-gray-800 pt-5 text-center">
            <p class="text-xs text-gray-400 mb-1">&copy; 2026 PARTS HUB. All rights reserved.</p>
            <p class="text-xs text-gray-500 leading-relaxed">運営：株式会社TCI<span class="hidden sm:inline"> / </span><br class="sm:hidden">大阪府大阪市淀川区新高1-5-4<span class="hidden sm:inline"> / </span><br class="sm:hidden">TEL: 06-6151-3697</p>
        </div>
    </div>
</footer>`

// ══════════════════════════════════════
// メインLP: /franchise
// ══════════════════════════════════════
franchise.get('/', async (c) => {
  const { DB } = c.env as any
  const cms = await getCmsValues(DB)
  const areas = await getAreaData(DB)

  // CMS値（デフォルト付き）
  const heroTitle = cms.hero_title || '全国の整備工場と繋がる出品代行パートナー募集'
  const heroSubtitle = cms.hero_subtitle || 'PARTS HUBの出品代行パートナーとして、地域の整備工場の余剰パーツを全国に届けませんか？'
  const initialFee = Number(cms.initial_fee || 150000)
  const monthlyFee = Number(cms.monthly_fee || 0)
  const commissionRate = Number(cms.commission_rate || 5)
  const platformFeeRate = Number(cms.platform_fee_rate || 10)

  // 収益シミュレーション
  const lightListings = Number(cms.light_listings || 50)
  const stdListings = Number(cms.standard_listings || 100)
  const heavyListings = Number(cms.heavy_listings || 200)
  const lightAvg = Number(cms.light_avg_price || 5000)
  const stdAvg = Number(cms.standard_avg_price || 5000)
  const heavyAvg = Number(cms.heavy_avg_price || 7000)
  const lightIncome = Number(cms.target_income_light || Math.floor(lightListings * lightAvg * commissionRate / 100))
  const stdIncome = Number(cms.target_income_standard || Math.floor(stdListings * stdAvg * commissionRate / 100))
  const heavyIncome = Number(cms.target_income_heavy || Math.floor(heavyListings * heavyAvg * commissionRate / 100))

  const jobDesc: string[] = cms.job_description || ['工場訪問・情報ヒアリング','パーツの撮影・出品登録','問い合わせ・価格交渉対応','売上管理・報酬受取']
  const benefits: string[] = cms.benefits || ['在庫リスクなし','初期費用のみ','自分のペースで','全国ネットワーク']
  const faq: {q:string;a:string}[] = cms.faq || []

  // エリア統計
  let recruitingCount = 0, closedCount = 0, totalPartners = 0
  for (const [_, d] of Object.entries(areas)) {
    if (d.status === 'recruiting') recruitingCount++
    if (d.status === 'closed') closedCount++
    totalPartners += d.partner_count
  }
  if (recruitingCount === 0) recruitingCount = 47

  // 地域別HTMLを生成
  const regionTableHtml = buildRegionTable(areas)

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="kHpRFWBlOATd13JxYZMj39kWaBbphQY-ygUj15kFJvs">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>出品代行パートナー募集｜自動車パーツの副業・独立開業 - PARTS HUB</title>
    <meta name="description" content="PARTS HUBの出品代行パートナー募集。自動車整備工場の余剰パーツを代行出品して収益化。副業OK・初期費用${initialFee.toLocaleString()}円・月額固定費0円。全国${recruitingCount}都道府県で募集中。独立開業・フランチャイズとしても最適。">
    <meta name="keywords" content="自動車パーツ 副業,出品代行 独立,整備工場 フランチャイズ,パーツ販売 開業,自動車部品 副業収入,出品代行パートナー,PARTS HUB パートナー">
    <link rel="canonical" href="https://parts-hub-tci.com/franchise">
    ${hreflang('/franchise')}
    <meta property="og:type" content="website">
    <meta property="og:title" content="出品代行パートナー募集｜副業・独立開業 - PARTS HUB">
    <meta property="og:description" content="自動車パーツの出品代行で副業収入。月収目安12.5万〜70万円。在庫リスクなし・初期費用${initialFee.toLocaleString()}円のみ。">
    <meta property="og:url" content="https://parts-hub-tci.com/franchise">
    <meta property="og:site_name" content="PARTS HUB">
    <meta property="og:image" content="https://parts-hub-tci.com/icons/og-default.png">
    <meta property="og:locale" content="ja_JP">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="出品代行パートナー募集 - PARTS HUB">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "出品代行パートナー募集 - PARTS HUB",
      "description": "自動車パーツの出品代行パートナーを全国で募集。副業・独立開業に最適。",
      "url": "https://parts-hub-tci.com/franchise",
      "isPartOf": { "@type": "WebSite", "name": "PARTS HUB", "url": "https://parts-hub-tci.com/" },
      "mainEntity": {
        "@type": "JobPosting",
        "title": "出品代行パートナー（フランチャイズ）",
        "description": "PARTS HUBの出品代行パートナーとして、地域の整備工場の余剰パーツを全国に届ける仕事です。副業・独立開業どちらも可能。",
        "datePosted": "2026-04-01",
        "employmentType": "CONTRACTOR",
        "hiringOrganization": {
          "@type": "Organization",
          "name": "PARTS HUB（株式会社TCI）",
          "sameAs": "https://parts-hub-tci.com/"
        },
        "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "JP" } },
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "JPY",
          "value": { "@type": "QuantitativeValue", "minValue": 125000, "maxValue": 700000, "unitText": "MONTH" }
        }
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "PARTS HUB", "item": "https://parts-hub-tci.com/" },
          { "@type": "ListItem", "position": 2, "name": "パートナー募集" }
        ]
      }
    })}</script>
    <meta name="theme-color" content="#ff4757">
    ${PERF_HINTS}
    ${TAILWIND_CSS}
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        ${BREADCRUMB_CSS}
        body { font-family: 'Noto Sans JP', sans-serif; }
        .hero-gradient { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }
        .stat-card { background: rgba(255,255,255,0.08); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; text-align: center; }
        .stat-number { font-size: 1.8rem; font-weight: 900; background: linear-gradient(135deg, #ff4757, #ff6b81); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }
        .section-heading { font-size: 1.25rem; font-weight: 700; color: #1e293b; position: relative; padding-left: 16px; }
        .section-heading::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 4px; height: 24px; background: linear-gradient(to bottom, #ff4757, #ff6b81); border-radius: 2px; }

        /* 地域テーブル */
        .region-section { margin-bottom: 20px; }
        .region-label { font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 8px; padding-left: 4px; display: flex; align-items: center; gap: 6px; }
        .region-label i { color: #94a3b8; }
        .pref-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
        .pref-chip { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; text-decoration: none; color: inherit; transition: all 0.2s; }
        .pref-chip:hover { border-color: #ff4757; box-shadow: 0 2px 8px rgba(255,71,87,0.1); transform: translateY(-1px); }
        .pref-chip .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .pref-chip .dot.recruiting { background: #ef4444; }
        .pref-chip .dot.planned { background: #eab308; }
        .pref-chip .dot.closed { background: #22c55e; }
        .pref-chip .chip-name { font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
        .pref-chip .chip-count { font-size: 0.65rem; color: #059669; font-weight: 700; flex-shrink: 0; white-space: nowrap; }
        .pref-chip .chip-badge { font-size: 0.6rem; padding: 1px 6px; border-radius: 4px; font-weight: 600; flex-shrink: 0; white-space: nowrap; margin-left: auto; }
        .pref-chip .chip-badge.recruiting { background: #fef2f2; color: #ef4444; }
        .pref-chip .chip-badge.planned { background: #fefce8; color: #ca8a04; }
        .pref-chip .chip-badge.closed { background: #f0fdf4; color: #16a34a; }

        /* 収益カード */
        .income-card { background: white; border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; transition: all 0.3s; }
        .income-card:hover { border-color: #ff4757; box-shadow: 0 8px 24px rgba(255,71,87,0.12); }
        .income-amount { font-size: 1.8rem; font-weight: 900; color: #ff4757; }

        /* ステップ */
        .step-card { position: relative; background: white; border-radius: 16px; padding: 24px; padding-left: 72px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .step-num { position: absolute; left: 20px; top: 24px; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem; color: white; }

        /* FAQ */
        .faq-item { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .faq-q { padding: 16px 20px; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; transition: background 0.2s; }
        .faq-q:hover { background: #f1f5f9; }
        .faq-a { padding: 0 20px; max-height: 0; overflow: hidden; transition: all 0.3s; }
        .faq-a.open { padding: 16px 20px; max-height: 500px; }

        /* CTA */
        .cta-gradient { background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%); }


    </style>
</head>
<body class="bg-gray-50 text-gray-900">
    <!-- ヘッダー -->
    <header class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" class="flex items-center gap-2">
                <span class="font-bold text-lg text-gray-900">PARTS HUB</span>
            </a>
            <div class="flex items-center gap-3">
                <a href="#inquiry-form" class="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"><i class="fas fa-envelope mr-1"></i>資料請求</a>
                <a href="/" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">トップへ</a>
            </div>
        </div>
    </header>

    ${breadcrumbHtml([{name:'PARTS HUB',url:'/'},{name:'パートナー募集'}])}

    <!-- ヒーロー -->
    <section class="hero-gradient text-white py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
            <div style="background:radial-gradient(circle at 20% 50%, rgba(255,71,87,0.4) 0%, transparent 60%);width:100%;height:100%;"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div class="inline-flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
                <i class="fas fa-fire"></i>全国${recruitingCount}都道府県で募集中
            </div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-6">${heroTitle}</h1>
            <p class="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">${heroSubtitle}</p>

            <!-- 統計カード -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <div class="stat-card">
                    <div class="stat-number">${recruitingCount}</div>
                    <div class="stat-label">募集中エリア</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">&yen;${initialFee.toLocaleString()}</div>
                    <div class="stat-label">初期費用</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">&yen;${monthlyFee.toLocaleString()}</div>
                    <div class="stat-label">月額固定費</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${commissionRate}%</div>
                    <div class="stat-label">パートナー報酬率</div>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="#inquiry-form" class="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30 text-sm sm:text-base">
                    <i class="fas fa-envelope"></i>資料請求する
                </a>
                <a href="#revenue-simulation" class="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/20 text-sm sm:text-base">
                    <i class="fas fa-calculator"></i>収益シミュレーション
                </a>
            </div>
        </div>
    </section>

    <main class="max-w-5xl mx-auto px-4 py-10 sm:py-16">

        <!-- こんな方に最適 -->
        <section class="mb-14 sm:mb-20">
            <h2 class="section-heading mb-8">こんな方に最適です</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-3 text-xl"><i class="fas fa-wrench"></i></div>
                    <h3 class="font-bold text-sm mb-1">整備業界経験者</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">整備工場や部品商での経験を活かせます。業界の知識が即戦力に。</p>
                </div>
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3 text-xl"><i class="fas fa-briefcase"></i></div>
                    <h3 class="font-bold text-sm mb-1">副業を探している方</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">週末だけの活動で月10〜15万円。本業との両立が可能です。</p>
                </div>
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-3 text-xl"><i class="fas fa-rocket"></i></div>
                    <h3 class="font-bold text-sm mb-1">独立開業したい方</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">低リスクで開業可能。在庫なし・店舗不要のビジネスモデル。</p>
                </div>
                <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 mb-3 text-xl"><i class="fas fa-car"></i></div>
                    <h3 class="font-bold text-sm mb-1">中古車・部品業者</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">既存の取引先ネットワークを活かして、新たな収益源を確保。</p>
                </div>
            </div>
        </section>

        <!-- 仕事内容 -->
        <section class="mb-14 sm:mb-20">
            <h2 class="section-heading mb-8">パートナーの仕事内容</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${jobDesc.map((j: string, i: number) => {
                  const icons = ['fa-building','fa-camera','fa-comments','fa-chart-line']
                  const colors = ['bg-blue-500','bg-emerald-500','bg-amber-500','bg-purple-500']
                  return `<div class="step-card">
                    <div class="step-num ${colors[i % 4]}">${i + 1}</div>
                    <h3 class="font-bold text-gray-900 text-sm mb-1">${j.split(' - ')[0] || j}</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">${j.includes(' - ') ? j.split(' - ')[1] : ''}</p>
                  </div>`
                }).join('')}
            </div>
            <div class="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <i class="fas fa-lightbulb text-amber-500 mt-0.5"></i>
                <p class="text-sm text-amber-800 leading-relaxed"><strong>ポイント：</strong>パーツの在庫は整備工場に保管されたまま。売れた場合に工場から直接発送するため、<strong>在庫リスク・保管コストは一切ありません</strong>。</p>
            </div>
        </section>

        <!-- メリット -->
        <section class="mb-14 sm:mb-20">
            <h2 class="section-heading mb-8">パートナーのメリット</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${benefits.map((b: string, i: number) => {
                  const icons = ['fa-shield-alt','fa-yen-sign','fa-clock','fa-globe']
                  const colors = ['text-red-500','text-emerald-500','text-blue-500','text-purple-500']
                  const bgs = ['bg-red-50','bg-emerald-50','bg-blue-50','bg-purple-50']
                  const title = b.split(' - ')[0] || b
                  const desc = b.includes(' - ') ? b.split(' - ')[1] : ''
                  return `<div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
                    <div class="w-10 h-10 rounded-lg ${bgs[i % 4]} flex items-center justify-center ${colors[i % 4]} flex-shrink-0"><i class="fas ${icons[i % 4]}"></i></div>
                    <div><h3 class="font-bold text-sm mb-1">${title}</h3><p class="text-xs text-gray-500 leading-relaxed">${desc}</p></div>
                  </div>`
                }).join('')}
            </div>
        </section>

        <!-- 収益シミュレーション -->
        <section id="revenue-simulation" class="mb-14 sm:mb-20 scroll-mt-20">
            <h2 class="section-heading mb-8">収益シミュレーション</h2>
            <p class="text-sm text-gray-500 mb-6">販売手数料${platformFeeRate}%のうち、${commissionRate}%がパートナーの報酬となります。</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="income-card">
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">副業プラン</div>
                    <div class="income-amount">&yen;${lightIncome.toLocaleString()}</div>
                    <div class="text-xs text-gray-500 mt-2">月間${lightListings}件出品</div>
                    <div class="text-xs text-gray-400 mt-1">平均単価 &yen;${lightAvg.toLocaleString()}</div>
                    <div class="mt-3 text-xs text-blue-600 bg-blue-50 rounded-full px-3 py-1 inline-block">週末だけでOK</div>
                </div>
                <div class="income-card border-red-200 shadow-md shadow-red-100">
                    <div class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">おすすめ 標準プラン</div>
                    <div class="income-amount">&yen;${stdIncome.toLocaleString()}</div>
                    <div class="text-xs text-gray-500 mt-2">月間${stdListings}件出品</div>
                    <div class="text-xs text-gray-400 mt-1">平均単価 &yen;${stdAvg.toLocaleString()}</div>
                    <div class="mt-3 text-xs text-red-600 bg-red-50 rounded-full px-3 py-1 inline-block">最も人気</div>
                </div>
                <div class="income-card">
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">本格プラン</div>
                    <div class="income-amount">&yen;${heavyIncome.toLocaleString()}</div>
                    <div class="text-xs text-gray-500 mt-2">月間${heavyListings}件出品</div>
                    <div class="text-xs text-gray-400 mt-1">平均単価 &yen;${heavyAvg.toLocaleString()}</div>
                    <div class="mt-3 text-xs text-emerald-600 bg-emerald-50 rounded-full px-3 py-1 inline-block">独立開業向け</div>
                </div>
            </div>
            <div class="mt-6 bg-gray-50 rounded-xl p-4 text-center">
                <p class="text-xs text-gray-500">※ 収益は目安です。実際の報酬は出品件数・販売価格・地域によって異なります。</p>
            </div>
        </section>

        <!-- 開始ステップ -->
        <section class="mb-14 sm:mb-20">
            <h2 class="section-heading mb-8">開始までの流れ</h2>
            <div class="space-y-4">
                <div class="step-card"><div class="step-num bg-red-500">1</div><h3 class="font-bold text-sm">資料請求・お問い合わせ</h3><p class="text-xs text-gray-500 mt-1">下記フォームから資料請求。詳細なビジネスモデルの資料をお送りします。</p></div>
                <div class="step-card"><div class="step-num bg-orange-500">2</div><h3 class="font-bold text-sm">オンライン説明会（Zoom）</h3><p class="text-xs text-gray-500 mt-1">担当者が収益モデル・実際の業務フローを詳しくご説明します。</p></div>
                <div class="step-card"><div class="step-num bg-amber-500">3</div><h3 class="font-bold text-sm">面談・エリア選定</h3><p class="text-xs text-gray-500 mt-1">ご希望エリアの状況確認と、最適な営業戦略を一緒に策定します。</p></div>
                <div class="step-card"><div class="step-num bg-emerald-500">4</div><h3 class="font-bold text-sm">契約・2日間研修</h3><p class="text-xs text-gray-500 mt-1">契約後、オンライン研修で出品ノウハウ・営業マニュアル・管理画面の使い方を習得。</p></div>
                <div class="step-card"><div class="step-num bg-blue-500">5</div><h3 class="font-bold text-sm">営業開始</h3><p class="text-xs text-gray-500 mt-1">研修完了後すぐに活動開始。本部がSEO・広告で集客をサポートします。</p></div>
            </div>
        </section>

        <!-- 全国募集エリア -->
        <section class="mb-14 sm:mb-20" id="area-map">
            <h2 class="section-heading mb-6">全国パートナー募集状況</h2>

            <!-- サマリーカード -->
            <div class="grid grid-cols-3 gap-3 mb-6">
                <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <div class="text-2xl font-black text-red-500">${recruitingCount}</div>
                    <div class="text-[11px] text-red-600 font-semibold mt-1">募集中</div>
                </div>
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div class="text-2xl font-black text-emerald-500">${closedCount}</div>
                    <div class="text-[11px] text-emerald-600 font-semibold mt-1">決定済</div>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div class="text-2xl font-black text-blue-500">${totalPartners}</div>
                    <div class="text-[11px] text-blue-600 font-semibold mt-1">パートナー数</div>
                </div>
            </div>

            <!-- 凡例 -->
            <div class="flex flex-wrap gap-4 mb-5 text-xs text-gray-500">
                <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>募集中</div>
                <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>募集予定</div>
                <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>決定済</div>
            </div>

            <!-- 地域別一覧 -->
            <div class="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
                ${regionTableHtml}
            </div>

            <p class="text-[11px] text-gray-400 text-center mt-4">各都道府県名をクリックするとエリアの詳細ページへ移動します</p>
        </section>

        <!-- 金銭フロー -->
        <section class="mb-14 sm:mb-20">
            <h2 class="section-heading mb-8">収益の流れ</h2>
            <div class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                    <div class="flex flex-col items-center">
                        <div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-xl mb-2"><i class="fas fa-user"></i></div>
                        <p class="text-xs font-bold">購入者</p>
                        <p class="text-[10px] text-gray-400">商品代金を支払い</p>
                    </div>
                    <i class="fas fa-arrow-right text-gray-300 text-lg hidden sm:block"></i>
                    <i class="fas fa-arrow-down text-gray-300 text-lg sm:hidden"></i>
                    <div class="flex flex-col items-center">
                        <div class="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-xl mb-2"><i class="fab fa-stripe-s"></i></div>
                        <p class="text-xs font-bold">Stripe決済</p>
                        <p class="text-[10px] text-gray-400">エスクロー保護</p>
                    </div>
                    <i class="fas fa-arrow-right text-gray-300 text-lg hidden sm:block"></i>
                    <i class="fas fa-arrow-down text-gray-300 text-lg sm:hidden"></i>
                    <div class="flex flex-col items-center">
                        <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl mb-2"><i class="fas fa-building"></i></div>
                        <p class="text-xs font-bold">PARTS HUB</p>
                        <p class="text-[10px] text-gray-400">手数料${platformFeeRate}%</p>
                    </div>
                    <i class="fas fa-arrow-right text-gray-300 text-lg hidden sm:block"></i>
                    <i class="fas fa-arrow-down text-gray-300 text-lg sm:hidden"></i>
                    <div class="flex flex-col items-center">
                        <div class="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 text-xl mb-2"><i class="fas fa-handshake"></i></div>
                        <p class="text-xs font-bold">パートナー</p>
                        <p class="text-[10px] text-gray-400">報酬${commissionRate}%</p>
                    </div>
                    <i class="fas fa-arrow-right text-gray-300 text-lg hidden sm:block"></i>
                    <i class="fas fa-arrow-down text-gray-300 text-lg sm:hidden"></i>
                    <div class="flex flex-col items-center">
                        <div class="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 text-xl mb-2"><i class="fas fa-warehouse"></i></div>
                        <p class="text-xs font-bold">整備工場</p>
                        <p class="text-[10px] text-gray-400">売上の${100 - platformFeeRate}%</p>
                    </div>
                </div>
                <div class="mt-6 p-4 bg-gray-50 rounded-xl text-center">
                    <p class="text-xs text-gray-500">例：&yen;50,000の商品が売れた場合 → 手数料&yen;${(50000 * platformFeeRate / 100).toLocaleString()} → パートナー報酬&yen;${(50000 * commissionRate / 100).toLocaleString()} → 工場入金&yen;${(50000 * (100 - platformFeeRate) / 100).toLocaleString()}</p>
                </div>
            </div>
        </section>

        <!-- FAQ -->
        <section class="mb-14 sm:mb-20">
            <h2 class="section-heading mb-8">よくある質問</h2>
            <div class="space-y-3" id="faq-list">
                ${faq.map((f: {q:string;a:string}, i: number) => `
                <div class="faq-item">
                    <div class="faq-q" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('i').classList.toggle('fa-chevron-down');this.querySelector('i').classList.toggle('fa-chevron-up')">
                        <span class="text-sm"><i class="fas fa-question-circle text-red-400 mr-2"></i>${f.q}</span>
                        <i class="fas fa-chevron-down text-xs text-gray-400"></i>
                    </div>
                    <div class="faq-a"><p class="text-sm text-gray-600 leading-relaxed">${f.a}</p></div>
                </div>`).join('')}
            </div>
        </section>

        <!-- 資料請求フォーム -->
        <section id="inquiry-form" class="mb-14 sm:mb-20 scroll-mt-20">
            <h2 class="section-heading mb-8">資料請求・お問い合わせ</h2>
            <div class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <form id="franchise-form" onsubmit="submitFranchiseForm(event)">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">お名前 <span class="text-red-500">*</span></label>
                            <input type="text" name="name" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none" placeholder="山田 太郎">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">電話番号</label>
                            <input type="tel" name="phone" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none" placeholder="090-1234-5678">
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-gray-600 mb-1">メールアドレス <span class="text-red-500">*</span></label>
                        <input type="email" name="email" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none" placeholder="example@email.com">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">希望エリア</label>
                            <select name="area_pref" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none bg-white">
                                <option value="">選択してください</option>
                                ${Object.entries(PREF_NAMES).map(([slug, name]) => `<option value="${slug}">${name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1">現在のご職業</label>
                            <select name="occupation" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none bg-white">
                                <option value="">選択してください</option>
                                <option value="auto_mechanic">自動車整備士</option>
                                <option value="auto_dealer">自動車ディーラー</option>
                                <option value="parts_dealer">部品卸商</option>
                                <option value="used_car">中古車販売業</option>
                                <option value="office_worker">会社員（副業希望）</option>
                                <option value="self_employed">自営業・フリーランス</option>
                                <option value="other">その他</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-gray-600 mb-1">自動車業界経験</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 text-sm"><input type="radio" name="experience" value="yes" class="text-red-500"> あり</label>
                            <label class="flex items-center gap-2 text-sm"><input type="radio" name="experience" value="no" class="text-red-500"> なし</label>
                        </div>
                    </div>
                    <div class="mb-6">
                        <label class="block text-xs font-bold text-gray-600 mb-1">ご質問・ご要望</label>
                        <textarea name="message" rows="3" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none" placeholder="自由にご記入ください"></textarea>
                    </div>
                    <button type="submit" class="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 text-sm sm:text-base" id="submit-btn">
                        <i class="fas fa-paper-plane mr-2"></i>資料請求を送信する
                    </button>
                    <p class="text-[10px] text-gray-400 text-center mt-3">送信いただいた情報は <a href="/privacy" class="text-red-400 hover:underline">プライバシーポリシー</a> に基づき適切に管理します。</p>
                </form>
                <div id="form-success" class="hidden text-center py-8">
                    <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 text-3xl mx-auto mb-4"><i class="fas fa-check"></i></div>
                    <h3 class="font-bold text-lg mb-2">送信完了しました</h3>
                    <p class="text-sm text-gray-500">3営業日以内に担当者よりご連絡いたします。</p>
                </div>
            </div>
        </section>
    </main>

    <!-- CTA -->
    <section class="cta-gradient text-white py-12 sm:py-16">
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-lg sm:text-xl lg:text-2xl font-bold mb-4">あなたの地域でパートナーを始めませんか？</h2>
            <p class="text-white/80 text-sm mb-8 leading-relaxed">初期費用&yen;${initialFee.toLocaleString()}のみ。月額固定費0円。在庫リスクなし。<br>まずは資料請求から、お気軽にお問い合わせください。</p>
            <a href="#inquiry-form" class="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-red-500 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-sm sm:text-base">
                <i class="fas fa-envelope"></i>無料で資料請求
            </a>
        </div>
    </section>

    ${Footer()}
    <script src="${v('/static/auth-header.js')}"></script>
    <script src="${v('/static/notification-badge.js')}"></script>
    <script>
    // 資料請求フォーム送信
    async function submitFranchiseForm(e) {
        e.preventDefault();
        var btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>送信中...';
        try {
            var form = document.getElementById('franchise-form');
            var data = {
                name: form.name.value,
                phone: form.phone.value,
                email: form.email.value,
                area_pref: form.area_pref.value,
                occupation: form.occupation.value,
                experience: form.experience ? (form.experience.value || '') : '',
                message: form.message.value
            };
            var res = await fetch('/api/franchise/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                document.getElementById('franchise-form').classList.add('hidden');
                document.getElementById('form-success').classList.remove('hidden');
            } else {
                throw new Error('送信エラー');
            }
        } catch(err) {
            alert('送信に失敗しました。しばらくしてからお試しください。');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>資料請求を送信する';
        }
    }


    </script>
</body>
</html>`)
})

// 地域別テーブルHTML生成
function buildRegionTable(areas: Record<string, { status: string; partner_count: number }>): string {
  const regions: [string, string, string[]][] = [
    ['北海道', 'fa-snowflake', ['hokkaido']],
    ['東北', 'fa-mountain', ['aomori','iwate','miyagi','akita','yamagata','fukushima']],
    ['関東', 'fa-city', ['ibaraki','tochigi','gunma','saitama','chiba','tokyo','kanagawa']],
    ['中部', 'fa-mountain-sun', ['niigata','toyama','ishikawa','fukui','yamanashi','nagano','gifu','shizuoka','aichi']],
    ['近畿', 'fa-torii-gate', ['mie','shiga','kyoto','osaka','hyogo','nara','wakayama']],
    ['中国', 'fa-bridge', ['tottori','shimane','okayama','hiroshima','yamaguchi']],
    ['四国', 'fa-water', ['tokushima','kagawa','ehime','kochi']],
    ['九州・沖縄', 'fa-sun', ['fukuoka','saga','nagasaki','kumamoto','oita','miyazaki','kagoshima','okinawa']]
  ]
  let html = ''
  for (const [region, icon, slugs] of regions) {
    html += `<div class="region-section"><div class="region-label"><i class="fas ${icon}"></i>${region}</div><div class="pref-grid">`
    for (const slug of slugs) {
      const name = PREF_NAMES[slug] || slug
      const a = areas[slug] || { status: 'recruiting', partner_count: 0 }
      const dotClass = a.status === 'recruiting' ? 'recruiting' : a.status === 'closed' ? 'closed' : 'planned'
      const badgeLabel = a.status === 'recruiting' ? '募集中' : a.status === 'closed' ? '決定済' : '予定'
      html += `<a href="/area/${slug}" class="pref-chip">`
      html += `<span class="dot ${dotClass}"></span>`
      html += `<span class="chip-name">${name}</span>`
      if (a.partner_count > 0) {
        html += `<span class="chip-count">${a.partner_count}名</span>`
      }
      html += `<span class="chip-badge ${dotClass}">${badgeLabel}</span>`
      html += `</a>`
    }
    html += '</div></div>'
  }
  return html
}

// ══════════════════════════════════════
// API: 資料請求送信
// ══════════════════════════════════════
franchise.post('/inquiry', async (c) => {
  try {
    const { DB } = c.env as any
    const body = await c.req.json()
    const { name, phone, email, area_pref, occupation, experience, message } = body
    if (!name || !email) {
      return c.json({ success: false, error: '必須項目を入力してください' }, 400)
    }
    await DB.prepare(
      'INSERT INTO franchise_inquiries (name, phone, email, area_pref, occupation, experience, message) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, phone || '', email, area_pref || '', occupation || '', experience || '', message || '').run()

    // 管理者へメール通知
    try {
      const apiKey = (c.env as any)?.RESEND_API_KEY
      if (apiKey) {
        const mail = tpl.franchiseInquiryAdmin({
          name, email, phone,
          areaPref: area_pref, occupation, experience, message,
        })
        await sendEmail(apiKey, { to: SUPPORT_EMAIL, ...mail })
      }
    } catch (emailError) {
      console.error('Franchise admin email error:', emailError)
    }

    return c.json({ success: true, message: '資料請求を受け付けました' })
  } catch (e: any) {
    console.error('Franchise inquiry error:', e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ══════════════════════════════════════
// API: CMS管理（管理者用）
// ══════════════════════════════════════
franchise.get('/cms', async (c) => {
  try {
    const { DB } = c.env as any
    const vals = await getCmsValues(DB)
    return c.json({ success: true, data: vals })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

franchise.put('/cms', async (c) => {
  try {
    const { DB } = c.env as any
    const body = await c.req.json()
    const { key, value } = body
    if (!key) return c.json({ success: false, error: 'key is required' }, 400)
    const valueJson = JSON.stringify(value)
    await DB.prepare(
      'INSERT OR REPLACE INTO franchise_cms (key, value_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
    ).bind(key, valueJson).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

franchise.put('/cms/bulk', async (c) => {
  try {
    const { DB } = c.env as any
    const body = await c.req.json()
    const { items } = body
    if (!items || !Array.isArray(items)) return c.json({ success: false, error: 'items array required' }, 400)
    for (const item of items) {
      const valueJson = JSON.stringify(item.value)
      await DB.prepare(
        'INSERT OR REPLACE INTO franchise_cms (key, value_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
      ).bind(item.key, valueJson).run()
    }
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ══════════════════════════════════════
// API: エリア管理（管理者用）
// ══════════════════════════════════════
franchise.get('/areas', async (c) => {
  try {
    const { DB } = c.env as any
    const data = await getAreaData(DB)
    return c.json({ success: true, data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

franchise.put('/areas/:slug', async (c) => {
  try {
    const { DB } = c.env as any
    const slug = c.req.param('slug')
    const body = await c.req.json()
    const { status, partner_count } = body
    await DB.prepare(
      'UPDATE franchise_areas SET status = ?, partner_count = ?, updated_at = CURRENT_TIMESTAMP WHERE pref_slug = ?'
    ).bind(status || 'recruiting', partner_count || 0, slug).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ══════════════════════════════════════
// API: 問い合わせ一覧（管理者用）
// ══════════════════════════════════════
franchise.get('/inquiries', async (c) => {
  try {
    const { DB } = c.env as any
    const rows = await DB.prepare('SELECT * FROM franchise_inquiries ORDER BY created_at DESC LIMIT 100').all()
    return c.json({ success: true, data: rows.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default franchise
