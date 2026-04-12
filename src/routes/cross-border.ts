/**
 * 越境EC (Cross-Border E-Commerce) API ルート
 * /api/admin/cross-border/*
 */

import { Hono } from 'hono'
import { verify } from 'hono/jwt'

const crossBorder = new Hono()

// 管理者認証ミドルウェア
crossBorder.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '管理者認証が必要です' }, 401)
  }
  const token = authHeader.substring(7)
  const secret = (c.env as any)?.JWT_SECRET || 'parts-hub-admin-secret-2026'
  try {
    const payload = await verify(token, secret, 'HS256')
    if (payload.role !== 'admin') {
      return c.json({ success: false, error: '管理者権限がありません' }, 403)
    }
    await next()
  } catch (error) {
    return c.json({ success: false, error: '管理者トークンが無効または期限切れです' }, 401)
  }
})

// ============================================================
// 為替レート取得（リアルタイム USD/JPY）
// ============================================================
crossBorder.get('/exchange-rate', async (c) => {
  const { DB } = c.env as any

  try {
    // 直近30分以内のキャッシュを確認
    const cached = await DB.prepare(`
      SELECT rate, fetched_at FROM exchange_rates
      WHERE currency_pair = 'USD/JPY'
      ORDER BY fetched_at DESC LIMIT 1
    `).first() as any

    if (cached) {
      const fetchedAt = new Date(cached.fetched_at).getTime()
      const now = Date.now()
      if (now - fetchedAt < 30 * 60 * 1000) {
        return c.json({ success: true, rate: cached.rate, cached: true, fetched_at: cached.fetched_at })
      }
    }

    // 外部APIからリアルタイムレート取得（複数フォールバック）
    let rate: number | null = null
    let source = ''

    // 方法1: exchangerate-api.com (無料)
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      if (res.ok) {
        const data = await res.json() as any
        if (data.rates && data.rates.JPY) {
          rate = data.rates.JPY
          source = 'er-api'
        }
      }
    } catch (e) {}

    // 方法2: フォールバック
    if (!rate) {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        if (res.ok) {
          const data = await res.json() as any
          if (data.rates && data.rates.JPY) {
            rate = data.rates.JPY
            source = 'exchangerate-api'
          }
        }
      } catch (e) {}
    }

    // 方法3: 最終フォールバック（キャッシュがあればそれを使用）
    if (!rate && cached) {
      return c.json({ success: true, rate: cached.rate, cached: true, stale: true, fetched_at: cached.fetched_at })
    }

    if (!rate) {
      return c.json({ success: false, error: '為替レートの取得に失敗しました' }, 500)
    }

    // キャッシュに保存
    await DB.prepare(`
      INSERT INTO exchange_rates (currency_pair, rate, source)
      VALUES ('USD/JPY', ?, ?)
    `).bind(rate, source).run()

    return c.json({ success: true, rate, cached: false, source })
  } catch (error) {
    console.error('Exchange rate error:', error)
    return c.json({ success: false, error: '為替レートの取得に失敗しました' }, 500)
  }
})

// ============================================================
// ダッシュボード統計
// ============================================================
crossBorder.get('/stats', async (c) => {
  const { DB } = c.env as any

  try {
    const [listings, orders, revenue] = await Promise.all([
      DB.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'listed' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
        FROM cross_border_listings
      `).first(),
      DB.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM cross_border_orders
      `).first(),
      DB.prepare(`
        SELECT
          COALESCE(SUM(sale_price_jpy), 0) as total_revenue_jpy,
          COALESCE(SUM(profit_jpy), 0) as total_profit_jpy,
          COALESCE(SUM(sale_price_usd), 0) as total_revenue_usd
        FROM cross_border_orders
        WHERE status IN ('completed', 'delivered', 'shipped')
      `).first()
    ])

    return c.json({
      success: true,
      listings: listings || { total: 0, active: 0, sold: 0, draft: 0 },
      orders: orders || { total: 0, pending: 0, shipped: 0, completed: 0 },
      revenue: revenue || { total_revenue_jpy: 0, total_profit_jpy: 0, total_revenue_usd: 0 }
    })
  } catch (error) {
    console.error('Cross-border stats error:', error)
    return c.json({ success: false, error: '統計情報の取得に失敗しました' }, 500)
  }
})

// ============================================================
// 買取候補商品一覧（国内出品中の商品からフィルタ）
// ============================================================
crossBorder.get('/candidates', async (c) => {
  const { DB } = c.env as any

  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
    const offset = parseInt(c.req.query('offset') || '0')
    const maker = c.req.query('maker')
    const category = c.req.query('top_category')
    const minPrice = c.req.query('min_price')
    const maxPrice = c.req.query('max_price')
    const sort = c.req.query('sort') || 'newest'
    const keyword = c.req.query('q')

    let conditions = ["p.status = 'active'"]
    let params: any[] = []

    // 既に海外出品済みの商品を除外
    conditions.push("p.id NOT IN (SELECT product_id FROM cross_border_listings WHERE status NOT IN ('cancelled','error'))")

    if (keyword) {
      conditions.push("(p.title LIKE ? OR p.description LIKE ? OR p.part_number LIKE ?)")
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    if (maker) {
      conditions.push('p.vm_maker = ?')
      params.push(maker)
    }
    if (category) {
      conditions.push("(',' || p.top_category || ',') LIKE ?")
      params.push(`%,${category},%`)
    }
    if (minPrice) {
      conditions.push('p.price >= ?')
      params.push(parseInt(minPrice))
    }
    if (maxPrice) {
      conditions.push('p.price <= ?')
      params.push(parseInt(maxPrice))
    }

    const whereClause = conditions.join(' AND ')

    let orderBy = 'p.created_at DESC'
    if (sort === 'price_asc') orderBy = 'p.price ASC'
    else if (sort === 'price_desc') orderBy = 'p.price DESC'
    else if (sort === 'popular') orderBy = 'p.view_count DESC'

    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM products p WHERE ${whereClause}
    `).bind(...params).first() as any

    const { results } = await DB.prepare(`
      SELECT p.id, p.title, p.description, p.price, p.condition, p.vm_maker, p.vm_model,
        p.top_category, p.shipping_type, p.view_count, p.favorite_count, p.created_at,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as image_url
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    const items = results.map((p: any) => ({
      ...p,
      image_url: p.image_url ? (p.image_url.startsWith('http') ? p.image_url : '/r2/' + p.image_url) : null,
      price_usd_estimate: null // フロントで為替レートを使って計算
    }))

    return c.json({
      success: true,
      items,
      total: countResult?.total || 0
    })
  } catch (error) {
    console.error('Candidates error:', error)
    return c.json({ success: false, error: '候補商品の取得に失敗しました' }, 500)
  }
})

// ============================================================
// AI翻訳（OpenAI API）
// ============================================================
crossBorder.post('/translate', async (c) => {
  const { DB } = c.env as any
  const apiKey = (c.env as any).OPENAI_API_KEY

  if (!apiKey) {
    return c.json({
      success: false,
      error: 'OpenAI APIキーが設定されていません。wrangler secret put OPENAI_API_KEY で設定してください。'
    }, 400)
  }

  try {
    const { title, description, maker, model, condition } = await c.req.json()

    const prompt = `You are a professional translator for Japanese automotive parts e-commerce listings on eBay.
Translate the following Japanese auto parts listing into English optimized for eBay international sales.

Rules:
- Use standard eBay automotive parts terminology
- Include "JDM" where appropriate (Japanese Domestic Market)
- Include OEM part numbers if present
- Make the title concise but keyword-rich (max 80 chars for eBay)
- Description should be professional and detailed
- Include condition information
- Add relevant keywords that international buyers search for

Japanese Title: ${title}
Japanese Description: ${description || 'なし'}
Maker: ${maker || 'Unknown'}
Model: ${model || 'Unknown'}
Condition: ${condition || 'Used'}

Respond in JSON format:
{
  "title_en": "eBay optimized English title",
  "description_en": "Detailed English description for eBay listing",
  "keywords": ["keyword1", "keyword2", ...]
}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('OpenAI API error:', errText)
      return c.json({ success: false, error: 'AI翻訳に失敗しました: ' + res.status }, 500)
    }

    const data = await res.json() as any
    const content = JSON.parse(data.choices[0].message.content)

    return c.json({ success: true, ...content })
  } catch (error) {
    console.error('Translation error:', error)
    return c.json({ success: false, error: 'AI翻訳に失敗しました' }, 500)
  }
})

// ============================================================
// 海外出品の作成（ドラフト）
// ============================================================
crossBorder.post('/listings', async (c) => {
  const { DB } = c.env as any

  try {
    const body = await c.req.json()
    const { product_id, title_en, description_en, price_usd, exchange_rate, shipping_cost_usd, demand_score, demand_reason } = body

    if (!product_id || !title_en) {
      return c.json({ success: false, error: '商品IDと英語タイトルは必須です' }, 400)
    }

    // 商品の存在確認
    const product = await DB.prepare('SELECT id, price FROM products WHERE id = ?').bind(product_id).first() as any
    if (!product) {
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }

    const result = await DB.prepare(`
      INSERT INTO cross_border_listings
        (product_id, platform, status, title_en, description_en, price_jpy, price_usd, exchange_rate, shipping_cost_usd, demand_score, demand_reason)
      VALUES (?, 'ebay', 'draft', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product_id, title_en, description_en || '',
      product.price, price_usd || null, exchange_rate || null,
      shipping_cost_usd || 0, demand_score || 0, demand_reason || ''
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    console.error('Create listing error:', error)
    return c.json({ success: false, error: '出品データの作成に失敗しました' }, 500)
  }
})

// ============================================================
// 海外出品一覧
// ============================================================
crossBorder.get('/listings', async (c) => {
  const { DB } = c.env as any

  try {
    const status = c.req.query('status')
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
    const offset = parseInt(c.req.query('offset') || '0')

    let conditions = ['1=1']
    let params: any[] = []

    if (status) {
      conditions.push('cb.status = ?')
      params.push(status)
    }

    const whereClause = conditions.join(' AND ')

    const { results } = await DB.prepare(`
      SELECT cb.*, p.title as product_title, p.price as product_price, p.vm_maker, p.vm_model,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as image_url
      FROM cross_border_listings cb
      LEFT JOIN products p ON cb.product_id = p.id
      WHERE ${whereClause}
      ORDER BY cb.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    const items = results.map((r: any) => ({
      ...r,
      image_url: r.image_url ? (r.image_url.startsWith('http') ? r.image_url : '/r2/' + r.image_url) : null
    }))

    return c.json({ success: true, items })
  } catch (error) {
    console.error('Listings error:', error)
    return c.json({ success: false, error: '出品一覧の取得に失敗しました' }, 500)
  }
})

// ============================================================
// 出品ステータス更新
// ============================================================
crossBorder.put('/listings/:id/status', async (c) => {
  const { DB } = c.env as any
  const id = c.req.param('id')

  try {
    const { status } = await c.req.json()
    await DB.prepare(`
      UPDATE cross_border_listings SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: 'ステータス更新に失敗しました' }, 500)
  }
})

// ============================================================
// 出品データ更新（翻訳・価格など）
// ============================================================
crossBorder.put('/listings/:id', async (c) => {
  const { DB } = c.env as any
  const id = c.req.param('id')

  try {
    const body = await c.req.json()
    await DB.prepare(`
      UPDATE cross_border_listings SET
        title_en = COALESCE(?, title_en),
        description_en = COALESCE(?, description_en),
        price_usd = COALESCE(?, price_usd),
        exchange_rate = COALESCE(?, exchange_rate),
        shipping_cost_usd = COALESCE(?, shipping_cost_usd),
        demand_score = COALESCE(?, demand_score),
        demand_reason = COALESCE(?, demand_reason),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.title_en || null, body.description_en || null,
      body.price_usd || null, body.exchange_rate || null,
      body.shipping_cost_usd ?? null, body.demand_score ?? null,
      body.demand_reason || null, body.status || null, id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: '更新に失敗しました' }, 500)
  }
})

// ============================================================
// 出品データ削除
// ============================================================
crossBorder.delete('/listings/:id', async (c) => {
  const { DB } = c.env as any
  const id = c.req.param('id')

  try {
    // sold 状態のものは削除不可
    const listing = await DB.prepare('SELECT status FROM cross_border_listings WHERE id = ?').bind(id).first() as any
    if (!listing) return c.json({ success: false, error: '出品データが見つかりません' }, 404)
    if (listing.status === 'sold') return c.json({ success: false, error: '売却済みの出品は削除できません' }, 400)

    await DB.prepare('DELETE FROM cross_border_listings WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: '削除に失敗しました' }, 500)
  }
})

// ============================================================
// 海外注文一覧
// ============================================================
crossBorder.get('/orders', async (c) => {
  const { DB } = c.env as any

  try {
    const { results } = await DB.prepare(`
      SELECT o.*, cb.title_en, cb.price_usd as listing_price_usd, p.title as product_title,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as image_url
      FROM cross_border_orders o
      LEFT JOIN cross_border_listings cb ON o.listing_id = cb.id
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `).all()

    const items = results.map((r: any) => ({
      ...r,
      image_url: r.image_url ? (r.image_url.startsWith('http') ? r.image_url : '/r2/' + r.image_url) : null
    }))

    return c.json({ success: true, items })
  } catch (error) {
    return c.json({ success: false, error: '注文一覧の取得に失敗しました' }, 500)
  }
})

// ============================================================
// 海外注文ステータス更新
// ============================================================
crossBorder.put('/orders/:id/status', async (c) => {
  const { DB } = c.env as any
  const id = c.req.param('id')

  try {
    const { status, tracking_number, shipping_method } = await c.req.json()

    const validStatuses = ['pending','buyback_requested','buyback_completed','preparing','shipped','delivered','completed','cancelled','refunded']
    if (!validStatuses.includes(status)) {
      return c.json({ success: false, error: '無効なステータスです' }, 400)
    }

    // タイムスタンプ更新
    let extraSql = ''
    if (status === 'buyback_completed') extraSql = ', buyback_completed_at = CURRENT_TIMESTAMP'
    else if (status === 'shipped') extraSql = ', shipped_at = CURRENT_TIMESTAMP'
    else if (status === 'delivered') extraSql = ', delivered_at = CURRENT_TIMESTAMP'
    else if (status === 'completed') extraSql = ', completed_at = CURRENT_TIMESTAMP'

    let sql = `UPDATE cross_border_orders SET status = ?, updated_at = CURRENT_TIMESTAMP${extraSql}`
    const params: any[] = [status]

    if (tracking_number) {
      sql += ', tracking_number = ?'
      params.push(tracking_number)
    }
    if (shipping_method) {
      sql += ', shipping_method = ?'
      params.push(shipping_method)
    }

    sql += ' WHERE id = ?'
    params.push(id)

    await DB.prepare(sql).bind(...params).run()

    // 配送完了時に cross_border_listings も更新
    if (status === 'completed') {
      await DB.prepare(`
        UPDATE cross_border_listings SET status = 'sold', sold_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT listing_id FROM cross_border_orders WHERE id = ?)
      `).bind(id).run()
    }

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: 'ステータス更新に失敗しました' }, 500)
  }
})

// ============================================================
// eBayカテゴリマッピング取得
// ============================================================
crossBorder.get('/category-map', async (c) => {
  // PARTS HUBカテゴリ → eBayカテゴリIDのマッピング
  const categoryMap: Record<string, { ebay_id: string; ebay_name: string }> = {
    'car': { ebay_id: '6028', ebay_name: 'Car & Truck Parts & Accessories' },
    'truck': { ebay_id: '33612', ebay_name: 'Commercial Truck Parts' },
    'motorcycle': { ebay_id: '10063', ebay_name: 'Motorcycle Parts' },
    'bus': { ebay_id: '180011', ebay_name: 'Bus & Coach Parts' },
    'forklift': { ebay_id: '111381', ebay_name: 'Forklift Parts & Accessories' },
    'heavy_equipment': { ebay_id: '177644', ebay_name: 'Heavy Equipment Parts & Accessories' },
    'marine': { ebay_id: '26429', ebay_name: 'Boat Parts' },
    'agricultural': { ebay_id: '91376', ebay_name: 'Tractor Parts' },
    'tools': { ebay_id: '34998', ebay_name: 'Automotive Tools & Supplies' },
    'rebuilt': { ebay_id: '33612', ebay_name: 'Car & Truck Parts (Remanufactured)' },
    'electrical': { ebay_id: '33542', ebay_name: 'Car & Truck Charging & Starting Systems' },
    'other': { ebay_id: '6028', ebay_name: 'Other Vehicle Parts' }
  }

  return c.json({ success: true, categories: categoryMap })
})

// ============================================================
// 国際送料テーブル（日本発 2026年公式料金ベース）
// EMS: 日本郵便公式2026年料金表（5地帯制）
// 民間: 公開定価ベース概算（法人割引率適用可）
// ============================================================
type ShippingTier = { maxKg: number; jpy: number }
type ShippingCarrier = {
  name: string; code: string; carrier_group: string; days: string;
  tracking: boolean; insurance: boolean; max_kg: number;
  note: string; ebay_carrier_code: string;
  tracking_url_template: string;
  is_estimate: boolean; // true=概算（法人契約で変動）
  discount_applicable: boolean; // true=法人割引率が適用可能
  zones: Record<string, ShippingTier[]>;
}

const SHIPPING_TABLE: Record<string, ShippingCarrier> = {
  // ────────────────────────────────────────
  // 日本郵便 EMS（2026年1月〜公式料金 5地帯制）
  // 第1:中国韓国台湾 第2:アジア 第3:オセアニア・カナダ・メキシコ・中近東・欧州 第4:米国 第5:中南米アフリカ
  // ────────────────────────────────────────
  ems: {
    name: 'EMS（国際スピード郵便）', code: 'ems', carrier_group: 'japan_post',
    days: '3〜5営業日', tracking: true, insurance: true, max_kg: 30,
    note: '最速・最も信頼性が高い。eBay自動車パーツで一番人気', ebay_carrier_code: 'JP_POST',
    tracking_url_template: 'https://trackings.post.japanpost.jp/services/srv/search/?locale=ja&requestNo1={tracking}',
    is_estimate: false, discount_applicable: false,
    zones: {
      us: [ // 第4地帯（米国）
        {maxKg:0.5,jpy:3900},{maxKg:0.6,jpy:4180},{maxKg:0.7,jpy:4460},{maxKg:0.8,jpy:4740},
        {maxKg:0.9,jpy:5020},{maxKg:1,jpy:5300},{maxKg:1.25,jpy:5990},{maxKg:1.5,jpy:6600},
        {maxKg:1.75,jpy:7290},{maxKg:2,jpy:7900},{maxKg:2.5,jpy:9100},{maxKg:3,jpy:10300},
        {maxKg:3.5,jpy:11500},{maxKg:4,jpy:12700},{maxKg:4.5,jpy:13900},{maxKg:5,jpy:15100},
        {maxKg:5.5,jpy:16300},{maxKg:6,jpy:17500},{maxKg:7,jpy:19900},{maxKg:8,jpy:22300},
        {maxKg:9,jpy:24700},{maxKg:10,jpy:27100},{maxKg:11,jpy:29500},{maxKg:12,jpy:31900},
        {maxKg:13,jpy:34300},{maxKg:14,jpy:36700},{maxKg:15,jpy:39100},{maxKg:16,jpy:41500},
        {maxKg:17,jpy:43900},{maxKg:18,jpy:46300},{maxKg:19,jpy:48700},{maxKg:20,jpy:51100},
        {maxKg:21,jpy:53500},{maxKg:22,jpy:55900},{maxKg:23,jpy:58300},{maxKg:24,jpy:60700},
        {maxKg:25,jpy:63100},{maxKg:26,jpy:65500},{maxKg:27,jpy:67900},{maxKg:28,jpy:70300},
        {maxKg:29,jpy:72700},{maxKg:30,jpy:75100}
      ],
      eu: [ // 第3地帯（欧州・オセアニア・カナダ・中近東）
        {maxKg:0.5,jpy:3150},{maxKg:0.6,jpy:3400},{maxKg:0.7,jpy:3650},{maxKg:0.8,jpy:3900},
        {maxKg:0.9,jpy:4150},{maxKg:1,jpy:4400},{maxKg:1.25,jpy:5000},{maxKg:1.5,jpy:5550},
        {maxKg:1.75,jpy:6150},{maxKg:2,jpy:6700},{maxKg:2.5,jpy:7750},{maxKg:3,jpy:8800},
        {maxKg:3.5,jpy:9850},{maxKg:4,jpy:10900},{maxKg:4.5,jpy:11950},{maxKg:5,jpy:13000},
        {maxKg:5.5,jpy:14050},{maxKg:6,jpy:15100},{maxKg:7,jpy:17200},{maxKg:8,jpy:19300},
        {maxKg:9,jpy:21400},{maxKg:10,jpy:23500},{maxKg:11,jpy:25600},{maxKg:12,jpy:27700},
        {maxKg:13,jpy:29800},{maxKg:14,jpy:31900},{maxKg:15,jpy:34000},{maxKg:16,jpy:36100},
        {maxKg:17,jpy:38200},{maxKg:18,jpy:40300},{maxKg:19,jpy:42400},{maxKg:20,jpy:44500},
        {maxKg:21,jpy:46600},{maxKg:22,jpy:48700},{maxKg:23,jpy:50800},{maxKg:24,jpy:52900},
        {maxKg:25,jpy:55000},{maxKg:26,jpy:57100},{maxKg:27,jpy:59200},{maxKg:28,jpy:61300},
        {maxKg:29,jpy:63400},{maxKg:30,jpy:65500}
      ],
      asia: [ // 第1地帯（中国・韓国・台湾）+ 第2地帯平均
        {maxKg:0.5,jpy:1900},{maxKg:0.6,jpy:2150},{maxKg:0.7,jpy:2400},{maxKg:0.8,jpy:2650},
        {maxKg:0.9,jpy:2900},{maxKg:1,jpy:3150},{maxKg:1.25,jpy:3500},{maxKg:1.5,jpy:3850},
        {maxKg:1.75,jpy:4200},{maxKg:2,jpy:4550},{maxKg:2.5,jpy:5150},{maxKg:3,jpy:5750},
        {maxKg:3.5,jpy:6350},{maxKg:4,jpy:6950},{maxKg:4.5,jpy:7550},{maxKg:5,jpy:8150},
        {maxKg:5.5,jpy:8750},{maxKg:6,jpy:9350},{maxKg:7,jpy:10350},{maxKg:8,jpy:11350},
        {maxKg:9,jpy:12350},{maxKg:10,jpy:13350},{maxKg:11,jpy:14350},{maxKg:12,jpy:15350},
        {maxKg:13,jpy:16350},{maxKg:14,jpy:17350},{maxKg:15,jpy:18350},{maxKg:16,jpy:19350},
        {maxKg:17,jpy:20350},{maxKg:18,jpy:21350},{maxKg:19,jpy:22350},{maxKg:20,jpy:23350},
        {maxKg:21,jpy:24350},{maxKg:22,jpy:25350},{maxKg:23,jpy:26350},{maxKg:24,jpy:27350},
        {maxKg:25,jpy:28350},{maxKg:26,jpy:29350},{maxKg:27,jpy:30350},{maxKg:28,jpy:31350},
        {maxKg:29,jpy:32350},{maxKg:30,jpy:33350}
      ]
    }
  },

  // ────────────────────────────────────────
  // 日本郵便 国際eパケットライト（SAL便扱い・追跡あり・2kgまで）
  // ※小形包装物の書留は2025年12月終了。eパケットライトが実質代替
  // ────────────────────────────────────────
  epacket_light: {
    name: 'eパケットライト（国際特定記録）', code: 'epacket_light', carrier_group: 'japan_post',
    days: '7〜14営業日', tracking: true, insurance: false, max_kg: 2,
    note: '2kgまでの小型パーツ向け。追跡あり・補償なし。eパケット/書留の後継', ebay_carrier_code: 'JP_POST',
    tracking_url_template: 'https://trackings.post.japanpost.jp/services/srv/search/?locale=ja&requestNo1={tracking}',
    is_estimate: false, discount_applicable: false,
    zones: {
      us: [
        {maxKg:0.1,jpy:720},{maxKg:0.2,jpy:780},{maxKg:0.3,jpy:870},{maxKg:0.4,jpy:960},
        {maxKg:0.5,jpy:1050},{maxKg:0.6,jpy:1140},{maxKg:0.75,jpy:1285},{maxKg:1,jpy:1525},
        {maxKg:1.25,jpy:1775},{maxKg:1.5,jpy:2025},{maxKg:1.75,jpy:2275},{maxKg:2,jpy:2525}
      ],
      eu: [
        {maxKg:0.1,jpy:720},{maxKg:0.2,jpy:780},{maxKg:0.3,jpy:870},{maxKg:0.4,jpy:960},
        {maxKg:0.5,jpy:1050},{maxKg:0.6,jpy:1140},{maxKg:0.75,jpy:1285},{maxKg:1,jpy:1525},
        {maxKg:1.25,jpy:1775},{maxKg:1.5,jpy:2025},{maxKg:1.75,jpy:2275},{maxKg:2,jpy:2525}
      ],
      asia: [
        {maxKg:0.1,jpy:540},{maxKg:0.2,jpy:600},{maxKg:0.3,jpy:690},{maxKg:0.4,jpy:780},
        {maxKg:0.5,jpy:870},{maxKg:0.6,jpy:960},{maxKg:0.75,jpy:1070},{maxKg:1,jpy:1280},
        {maxKg:1.25,jpy:1490},{maxKg:1.5,jpy:1700},{maxKg:1.75,jpy:1910},{maxKg:2,jpy:2120}
      ]
    }
  },

  // ────────────────────────────────────────
  // 日本郵便 国際小包（航空便）
  // ────────────────────────────────────────
  jp_air_parcel: {
    name: '国際小包（航空便）', code: 'jp_air_parcel', carrier_group: 'japan_post',
    days: '7〜14営業日', tracking: true, insurance: true, max_kg: 30,
    note: 'EMSより安いが遅い。補償あり。重量パーツに有効', ebay_carrier_code: 'JP_POST',
    tracking_url_template: 'https://trackings.post.japanpost.jp/services/srv/search/?locale=ja&requestNo1={tracking}',
    is_estimate: false, discount_applicable: false,
    zones: {
      us: [ // 第4地帯
        {maxKg:1,jpy:3750},{maxKg:2,jpy:5700},{maxKg:3,jpy:7650},{maxKg:4,jpy:9600},
        {maxKg:5,jpy:11550},{maxKg:6,jpy:13500},{maxKg:7,jpy:15450},{maxKg:8,jpy:17400},
        {maxKg:9,jpy:19350},{maxKg:10,jpy:21300},{maxKg:15,jpy:31050},{maxKg:20,jpy:40800},
        {maxKg:25,jpy:50550},{maxKg:30,jpy:60300}
      ],
      eu: [ // 第3地帯
        {maxKg:1,jpy:3200},{maxKg:2,jpy:4750},{maxKg:3,jpy:6300},{maxKg:4,jpy:7850},
        {maxKg:5,jpy:9400},{maxKg:6,jpy:10950},{maxKg:7,jpy:12500},{maxKg:8,jpy:14050},
        {maxKg:9,jpy:15600},{maxKg:10,jpy:17150},{maxKg:15,jpy:24900},{maxKg:20,jpy:32650},
        {maxKg:25,jpy:40400},{maxKg:30,jpy:48150}
      ],
      asia: [ // 第1地帯
        {maxKg:1,jpy:2150},{maxKg:2,jpy:3050},{maxKg:3,jpy:3950},{maxKg:4,jpy:4850},
        {maxKg:5,jpy:5750},{maxKg:6,jpy:6650},{maxKg:7,jpy:7550},{maxKg:8,jpy:8450},
        {maxKg:9,jpy:9350},{maxKg:10,jpy:10250},{maxKg:15,jpy:14750},{maxKg:20,jpy:19250},
        {maxKg:25,jpy:23750},{maxKg:30,jpy:28250}
      ]
    }
  },

  // ────────────────────────────────────────
  // FedEx International Priority（定価ベース概算・法人割引適用可）
  // 日本発の2026年公開料金表ベース。燃料サーチャージ別途
  // ────────────────────────────────────────
  fedex_priority: {
    name: 'FedEx International Priority', code: 'fedex_priority', carrier_group: 'fedex',
    days: '1〜3営業日', tracking: true, insurance: true, max_kg: 68,
    note: '超高速。大型・高額パーツ向き。法人契約で40〜60%OFF可能', ebay_carrier_code: 'FEDEX',
    tracking_url_template: 'https://www.fedex.com/fedextrack/?trknbr={tracking}',
    is_estimate: true, discount_applicable: true,
    zones: {
      us: [
        {maxKg:0.5,jpy:7800},{maxKg:1,jpy:9500},{maxKg:2,jpy:12800},{maxKg:3,jpy:16100},
        {maxKg:4,jpy:19400},{maxKg:5,jpy:22700},{maxKg:6,jpy:25200},{maxKg:7,jpy:27700},
        {maxKg:8,jpy:30200},{maxKg:9,jpy:32700},{maxKg:10,jpy:35200},{maxKg:15,jpy:47700},
        {maxKg:20,jpy:60200},{maxKg:25,jpy:72700},{maxKg:30,jpy:85200},{maxKg:40,jpy:110200},
        {maxKg:50,jpy:135200},{maxKg:60,jpy:160200},{maxKg:68,jpy:180200}
      ],
      eu: [
        {maxKg:0.5,jpy:8200},{maxKg:1,jpy:10200},{maxKg:2,jpy:14000},{maxKg:3,jpy:17800},
        {maxKg:4,jpy:21600},{maxKg:5,jpy:25400},{maxKg:6,jpy:28200},{maxKg:7,jpy:31000},
        {maxKg:8,jpy:33800},{maxKg:9,jpy:36600},{maxKg:10,jpy:39400},{maxKg:15,jpy:53400},
        {maxKg:20,jpy:67400},{maxKg:25,jpy:81400},{maxKg:30,jpy:95400},{maxKg:40,jpy:123400},
        {maxKg:50,jpy:151400},{maxKg:60,jpy:179400},{maxKg:68,jpy:201800}
      ],
      asia: [
        {maxKg:0.5,jpy:4500},{maxKg:1,jpy:5800},{maxKg:2,jpy:8200},{maxKg:3,jpy:10600},
        {maxKg:4,jpy:13000},{maxKg:5,jpy:15400},{maxKg:6,jpy:17200},{maxKg:7,jpy:19000},
        {maxKg:8,jpy:20800},{maxKg:9,jpy:22600},{maxKg:10,jpy:24400},{maxKg:15,jpy:33400},
        {maxKg:20,jpy:42400},{maxKg:25,jpy:51400},{maxKg:30,jpy:60400},{maxKg:40,jpy:78400},
        {maxKg:50,jpy:96400},{maxKg:60,jpy:114400},{maxKg:68,jpy:128800}
      ]
    }
  },

  // ────────────────────────────────────────
  // FedEx International Economy
  // ────────────────────────────────────────
  fedex_economy: {
    name: 'FedEx International Economy', code: 'fedex_economy', carrier_group: 'fedex',
    days: '4〜6営業日', tracking: true, insurance: true, max_kg: 68,
    note: 'Priorityより安い。大型パーツのコスト重視に', ebay_carrier_code: 'FEDEX',
    tracking_url_template: 'https://www.fedex.com/fedextrack/?trknbr={tracking}',
    is_estimate: true, discount_applicable: true,
    zones: {
      us: [
        {maxKg:0.5,jpy:5900},{maxKg:1,jpy:7200},{maxKg:2,jpy:9800},{maxKg:3,jpy:12400},
        {maxKg:4,jpy:15000},{maxKg:5,jpy:17600},{maxKg:6,jpy:19600},{maxKg:7,jpy:21600},
        {maxKg:8,jpy:23600},{maxKg:9,jpy:25600},{maxKg:10,jpy:27600},{maxKg:15,jpy:37600},
        {maxKg:20,jpy:47600},{maxKg:25,jpy:57600},{maxKg:30,jpy:67600},{maxKg:40,jpy:87600},
        {maxKg:50,jpy:107600},{maxKg:60,jpy:127600},{maxKg:68,jpy:143600}
      ],
      eu: [
        {maxKg:0.5,jpy:6200},{maxKg:1,jpy:7800},{maxKg:2,jpy:10800},{maxKg:3,jpy:13800},
        {maxKg:4,jpy:16800},{maxKg:5,jpy:19800},{maxKg:6,jpy:22000},{maxKg:7,jpy:24200},
        {maxKg:8,jpy:26400},{maxKg:9,jpy:28600},{maxKg:10,jpy:30800},{maxKg:15,jpy:41800},
        {maxKg:20,jpy:52800},{maxKg:25,jpy:63800},{maxKg:30,jpy:74800},{maxKg:40,jpy:96800},
        {maxKg:50,jpy:118800},{maxKg:60,jpy:140800},{maxKg:68,jpy:158400}
      ],
      asia: [
        {maxKg:0.5,jpy:3400},{maxKg:1,jpy:4400},{maxKg:2,jpy:6300},{maxKg:3,jpy:8200},
        {maxKg:4,jpy:10100},{maxKg:5,jpy:12000},{maxKg:6,jpy:13400},{maxKg:7,jpy:14800},
        {maxKg:8,jpy:16200},{maxKg:9,jpy:17600},{maxKg:10,jpy:19000},{maxKg:15,jpy:26000},
        {maxKg:20,jpy:33000},{maxKg:25,jpy:40000},{maxKg:30,jpy:47000},{maxKg:40,jpy:61000},
        {maxKg:50,jpy:75000},{maxKg:60,jpy:89000},{maxKg:68,jpy:100200}
      ]
    }
  },

  // ────────────────────────────────────────
  // DHL Express Worldwide
  // ────────────────────────────────────────
  dhl_express: {
    name: 'DHL Express Worldwide', code: 'dhl_express', carrier_group: 'dhl',
    days: '1〜3営業日', tracking: true, insurance: true, max_kg: 70,
    note: 'FedExと並ぶ最速。法人契約で大幅割引あり', ebay_carrier_code: 'DHL',
    tracking_url_template: 'https://www.dhl.com/jp-ja/home/tracking.html?tracking-id={tracking}',
    is_estimate: true, discount_applicable: true,
    zones: {
      us: [
        {maxKg:0.5,jpy:8100},{maxKg:1,jpy:9800},{maxKg:2,jpy:13200},{maxKg:3,jpy:16600},
        {maxKg:4,jpy:20000},{maxKg:5,jpy:23400},{maxKg:6,jpy:26000},{maxKg:7,jpy:28600},
        {maxKg:8,jpy:31200},{maxKg:9,jpy:33800},{maxKg:10,jpy:36400},{maxKg:15,jpy:49400},
        {maxKg:20,jpy:62400},{maxKg:25,jpy:75400},{maxKg:30,jpy:88400},{maxKg:40,jpy:114400},
        {maxKg:50,jpy:140400},{maxKg:60,jpy:166400},{maxKg:70,jpy:192400}
      ],
      eu: [
        {maxKg:0.5,jpy:7600},{maxKg:1,jpy:9200},{maxKg:2,jpy:12400},{maxKg:3,jpy:15600},
        {maxKg:4,jpy:18800},{maxKg:5,jpy:22000},{maxKg:6,jpy:24400},{maxKg:7,jpy:26800},
        {maxKg:8,jpy:29200},{maxKg:9,jpy:31600},{maxKg:10,jpy:34000},{maxKg:15,jpy:46000},
        {maxKg:20,jpy:58000},{maxKg:25,jpy:70000},{maxKg:30,jpy:82000},{maxKg:40,jpy:106000},
        {maxKg:50,jpy:130000},{maxKg:60,jpy:154000},{maxKg:70,jpy:178000}
      ],
      asia: [
        {maxKg:0.5,jpy:4200},{maxKg:1,jpy:5400},{maxKg:2,jpy:7600},{maxKg:3,jpy:9800},
        {maxKg:4,jpy:12000},{maxKg:5,jpy:14200},{maxKg:6,jpy:15800},{maxKg:7,jpy:17400},
        {maxKg:8,jpy:19000},{maxKg:9,jpy:20600},{maxKg:10,jpy:22200},{maxKg:15,jpy:30200},
        {maxKg:20,jpy:38200},{maxKg:25,jpy:46200},{maxKg:30,jpy:54200},{maxKg:40,jpy:70200},
        {maxKg:50,jpy:86200},{maxKg:60,jpy:102200},{maxKg:70,jpy:118200}
      ]
    }
  },

  // ────────────────────────────────────────
  // UPS Worldwide Express
  // ────────────────────────────────────────
  ups_express: {
    name: 'UPS Worldwide Express', code: 'ups_express', carrier_group: 'ups',
    days: '1〜3営業日', tracking: true, insurance: true, max_kg: 70,
    note: 'アメリカ国内配送に強い。法人契約で割引あり', ebay_carrier_code: 'UPS',
    tracking_url_template: 'https://www.ups.com/track?tracknum={tracking}',
    is_estimate: true, discount_applicable: true,
    zones: {
      us: [
        {maxKg:0.5,jpy:7500},{maxKg:1,jpy:9200},{maxKg:2,jpy:12500},{maxKg:3,jpy:15800},
        {maxKg:4,jpy:19100},{maxKg:5,jpy:22400},{maxKg:6,jpy:24800},{maxKg:7,jpy:27200},
        {maxKg:8,jpy:29600},{maxKg:9,jpy:32000},{maxKg:10,jpy:34400},{maxKg:15,jpy:46400},
        {maxKg:20,jpy:58400},{maxKg:25,jpy:70400},{maxKg:30,jpy:82400},{maxKg:40,jpy:106400},
        {maxKg:50,jpy:130400},{maxKg:60,jpy:154400},{maxKg:70,jpy:178400}
      ],
      eu: [
        {maxKg:0.5,jpy:8000},{maxKg:1,jpy:9800},{maxKg:2,jpy:13400},{maxKg:3,jpy:17000},
        {maxKg:4,jpy:20600},{maxKg:5,jpy:24200},{maxKg:6,jpy:26800},{maxKg:7,jpy:29400},
        {maxKg:8,jpy:32000},{maxKg:9,jpy:34600},{maxKg:10,jpy:37200},{maxKg:15,jpy:50200},
        {maxKg:20,jpy:63200},{maxKg:25,jpy:76200},{maxKg:30,jpy:89200},{maxKg:40,jpy:115200},
        {maxKg:50,jpy:141200},{maxKg:60,jpy:167200},{maxKg:70,jpy:193200}
      ],
      asia: [
        {maxKg:0.5,jpy:4300},{maxKg:1,jpy:5600},{maxKg:2,jpy:7900},{maxKg:3,jpy:10200},
        {maxKg:4,jpy:12500},{maxKg:5,jpy:14800},{maxKg:6,jpy:16500},{maxKg:7,jpy:18200},
        {maxKg:8,jpy:19900},{maxKg:9,jpy:21600},{maxKg:10,jpy:23300},{maxKg:15,jpy:31800},
        {maxKg:20,jpy:40300},{maxKg:25,jpy:48800},{maxKg:30,jpy:57300},{maxKg:40,jpy:74300},
        {maxKg:50,jpy:91300},{maxKg:60,jpy:108300},{maxKg:70,jpy:125300}
      ]
    }
  },

  // ────────────────────────────────────────
  // ヤマト運輸 国際宅急便
  // ────────────────────────────────────────
  yamato_intl: {
    name: 'ヤマト運輸 国際宅急便', code: 'yamato_intl', carrier_group: 'yamato',
    days: '3〜6営業日', tracking: true, insurance: true, max_kg: 25,
    note: 'アジア圏に強い。対応国限定（米・EU・アジア主要国）', ebay_carrier_code: 'YAMATO',
    tracking_url_template: 'https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id={tracking}',
    is_estimate: true, discount_applicable: true,
    zones: {
      us: [
        {maxKg:2,jpy:3850},{maxKg:5,jpy:6750},{maxKg:10,jpy:12450},{maxKg:15,jpy:18150},
        {maxKg:20,jpy:23850},{maxKg:25,jpy:29550}
      ],
      eu: [
        {maxKg:2,jpy:4050},{maxKg:5,jpy:7350},{maxKg:10,jpy:14250},{maxKg:15,jpy:21150},
        {maxKg:20,jpy:28050},{maxKg:25,jpy:34950}
      ],
      asia: [
        {maxKg:2,jpy:2550},{maxKg:5,jpy:4050},{maxKg:10,jpy:7350},{maxKg:15,jpy:10650},
        {maxKg:20,jpy:13950},{maxKg:25,jpy:17250}
      ]
    }
  },

  // ────────────────────────────────────────
  // 佐川急便 飛脚国際宅配便
  // ────────────────────────────────────────
  sagawa_intl: {
    name: '佐川急便 飛脚国際宅配便', code: 'sagawa_intl', carrier_group: 'sagawa',
    days: '2〜5営業日', tracking: true, insurance: true, max_kg: 50,
    note: '法人向け。個別見積もりが基本。概算料金を表示', ebay_carrier_code: 'SAGAWA',
    tracking_url_template: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={tracking}',
    is_estimate: true, discount_applicable: true,
    zones: {
      us: [
        {maxKg:2,jpy:5500},{maxKg:5,jpy:9500},{maxKg:10,jpy:17500},{maxKg:15,jpy:25500},
        {maxKg:20,jpy:33500},{maxKg:25,jpy:41500},{maxKg:30,jpy:49500},{maxKg:40,jpy:65500},
        {maxKg:50,jpy:81500}
      ],
      eu: [
        {maxKg:2,jpy:5800},{maxKg:5,jpy:10200},{maxKg:10,jpy:19200},{maxKg:15,jpy:28200},
        {maxKg:20,jpy:37200},{maxKg:25,jpy:46200},{maxKg:30,jpy:55200},{maxKg:40,jpy:73200},
        {maxKg:50,jpy:91200}
      ],
      asia: [
        {maxKg:2,jpy:3500},{maxKg:5,jpy:5800},{maxKg:10,jpy:10500},{maxKg:15,jpy:15200},
        {maxKg:20,jpy:19900},{maxKg:25,jpy:24600},{maxKg:30,jpy:29300},{maxKg:40,jpy:38700},
        {maxKg:50,jpy:48100}
      ]
    }
  }
}

// サイズ別おすすめ配送方法
const SHIPPING_RECOMMENDATIONS: Record<string, { label: string; methods: string[]; reason: string }> = {
  small: { label: '小型（〜2kg）', methods: ['ems', 'epacket_light'], reason: 'コスパ最良。eパケットライトが最安、EMSが最速' },
  medium: { label: '中型（2〜10kg）', methods: ['ems', 'jp_air_parcel', 'yamato_intl'], reason: '追跡・補償あり。EMSがコスト合理的' },
  large: { label: '大型（10〜30kg）', methods: ['ems', 'fedex_economy', 'dhl_express'], reason: 'EMSは30kgまで。超えたらFedEx/DHL' },
  xlarge: { label: '超大型/高額品（30kg超）', methods: ['fedex_priority', 'fedex_economy', 'dhl_express', 'ups_express'], reason: '補償が充実、最速配送。法人割引で大幅コスト削減可' }
}

function getRecommendation(weightKg: number): typeof SHIPPING_RECOMMENDATIONS[string] {
  if (weightKg <= 2) return SHIPPING_RECOMMENDATIONS.small
  if (weightKg <= 10) return SHIPPING_RECOMMENDATIONS.medium
  if (weightKg <= 30) return SHIPPING_RECOMMENDATIONS.large
  return SHIPPING_RECOMMENDATIONS.xlarge
}

// eBay手数料定数
const EBAY_FEES = {
  finalValueFeeRate: 0.129,    // 落札手数料 12.9%
  internationalFeeRate: 0.0165, // 海外取引手数料 1.65%
  fixedFeeUsd: 0.30,            // 固定手数料 $0.30/件
  payoneerFeeRate: 0.02,        // Payoneer出金手数料 ~2%
  packagingCostJpy: 800,        // 梱包材概算 ¥800
}

// 送料計算ヘルパー（法人割引率対応）
function calcShippingCost(weightKg: number, method: string, zone: string, discountRate?: number): { jpy: number; usd: number; rate: number; is_estimate: boolean } | null {
  const carrier = SHIPPING_TABLE[method]
  if (!carrier) return null
  const rates = carrier.zones[zone]
  if (!rates) return null
  const tier = rates.find(t => weightKg <= t.maxKg)
  if (!tier) {
    const last = rates[rates.length - 1]
    if (weightKg > carrier.max_kg) return null // 最大重量超過
    return { jpy: last.jpy, usd: 0, rate: 0, is_estimate: carrier.is_estimate }
  }
  let cost = tier.jpy
  // 法人割引率適用（民間業者のみ）
  if (carrier.discount_applicable && discountRate && discountRate > 0) {
    cost = Math.round(cost * (1 - discountRate))
  }
  return { jpy: cost, usd: 0, rate: 0, is_estimate: carrier.is_estimate }
}

// ============================================================
// 国際送料計算API（全業者一括＋法人割引対応）
// ============================================================
crossBorder.post('/calc-shipping', async (c) => {
  try {
    const { weight_kg, zone, exchange_rate } = await c.req.json()
    const w = Number(weight_kg) || 1
    const z = zone || 'us'
    const rate = Number(exchange_rate) || 150

    // 法人割引率を取得
    const db = (c.env as any).DB
    let discountMap: Record<string, number> = {}
    try {
      const discounts = await db.prepare('SELECT carrier_code, discount_rate FROM carrier_discount_settings').all()
      if (discounts.results) {
        for (const d of discounts.results) {
          discountMap[(d as any).carrier_code] = Number((d as any).discount_rate) || 0
        }
      }
    } catch { /* テーブルが無ければスキップ */ }

    const recommendation = getRecommendation(w)
    const results: any[] = []
    for (const [key, carrier] of Object.entries(SHIPPING_TABLE)) {
      const zones = carrier.zones[z]
      if (!zones) continue
      const maxWeight = zones[zones.length - 1]?.maxKg || 0
      const available = w <= maxWeight && w <= carrier.max_kg

      let costJpy = 0
      let costUsd = 0
      if (available) {
        const discount = discountMap[key] || 0
        const result = calcShippingCost(w, key, z, discount)
        if (result) {
          costJpy = result.jpy
          costUsd = Math.round((costJpy / rate) * 100) / 100
        }
      }

      results.push({
        method: key,
        name: carrier.name,
        carrier_group: carrier.carrier_group,
        days: carrier.days,
        tracking: carrier.tracking,
        insurance: carrier.insurance,
        cost_jpy: costJpy,
        cost_usd: costUsd,
        max_weight_kg: maxWeight,
        available,
        is_estimate: carrier.is_estimate,
        discount_applied: discountMap[key] || 0,
        is_recommended: recommendation.methods.includes(key)
      })
    }

    return c.json({
      success: true,
      weight_kg: w,
      zone: z,
      exchange_rate: rate,
      recommendation: { label: recommendation.label, reason: recommendation.reason },
      options: results
    })
  } catch (error) {
    return c.json({ success: false, error: '送料計算に失敗しました' }, 500)
  }
})

// ============================================================
// 自動価格計算API（推奨価格 + コスト内訳）
// ============================================================
crossBorder.post('/calc-price', async (c) => {
  try {
    const body = await c.req.json()
    const priceJpy = Number(body.price_jpy) || 0
    const weightKg = Number(body.weight_kg) || 1
    const shippingMethod = body.shipping_method || 'ems'
    const zone = body.zone || 'us'
    const exchangeRate = Number(body.exchange_rate) || 150
    const targetMargin = Number(body.target_margin) || 0.25 // デフォルト25%利益率

    // 1. 仕入原価（税込）
    const costJpy = Math.round(priceJpy * 1.1)

    // 2. 国際送料（JPY）
    const shippingResult = calcShippingCost(weightKg, shippingMethod, zone)
    const shippingCostJpy = shippingResult?.jpy || 5000

    // 3. 梱包材
    const packagingJpy = EBAY_FEES.packagingCostJpy

    // 4. 総コスト（JPY）
    const totalCostJpy = costJpy + shippingCostJpy + packagingJpy

    // 5. 総コスト（USD）
    const totalCostUsd = totalCostJpy / exchangeRate

    // 6. eBay手数料を逆算して推奨販売価格を計算
    // 販売価格 = 総コスト / (1 - eBay手数料率 - Payoneer手数料率 - 目標利益率) + 固定手数料
    const totalFeeRate = EBAY_FEES.finalValueFeeRate + EBAY_FEES.internationalFeeRate + EBAY_FEES.payoneerFeeRate
    const recommendedPriceUsd = Math.ceil((totalCostUsd / (1 - totalFeeRate - targetMargin)) + EBAY_FEES.fixedFeeUsd)

    // 7. 推奨価格での利益シミュレーション
    const ebayFinalValueFee = recommendedPriceUsd * EBAY_FEES.finalValueFeeRate
    const ebayInternationalFee = recommendedPriceUsd * EBAY_FEES.internationalFeeRate
    const ebayFixedFee = EBAY_FEES.fixedFeeUsd
    const totalEbayFees = ebayFinalValueFee + ebayInternationalFee + ebayFixedFee
    const payoneerPayout = recommendedPriceUsd - totalEbayFees
    const payoneerFee = payoneerPayout * EBAY_FEES.payoneerFeeRate
    const netPayoutUsd = payoneerPayout - payoneerFee
    const netPayoutJpy = Math.floor(netPayoutUsd * exchangeRate)
    const shippingCostUsd = shippingCostJpy / exchangeRate
    const profitJpy = netPayoutJpy - costJpy - shippingCostJpy - packagingJpy
    const profitMargin = netPayoutJpy > 0 ? Math.round((profitJpy / netPayoutJpy) * 100) : 0

    // 8. 複数利益率での推奨価格テーブル
    const marginOptions = [0.15, 0.20, 0.25, 0.30, 0.40, 0.50]
    const priceTable = marginOptions.map(m => {
      const price = Math.ceil((totalCostUsd / (1 - totalFeeRate - m)) + EBAY_FEES.fixedFeeUsd)
      const eFees = price * (EBAY_FEES.finalValueFeeRate + EBAY_FEES.internationalFeeRate) + EBAY_FEES.fixedFeeUsd
      const pPayout = price - eFees
      const pFee = pPayout * EBAY_FEES.payoneerFeeRate
      const net = pPayout - pFee
      const netJpy = Math.floor(net * exchangeRate)
      const profit = netJpy - costJpy - shippingCostJpy - packagingJpy
      return {
        target_margin: Math.round(m * 100),
        price_usd: price,
        profit_jpy: profit,
        actual_margin: netJpy > 0 ? Math.round((profit / netJpy) * 100) : 0
      }
    })

    return c.json({
      success: true,
      input: { price_jpy: priceJpy, weight_kg: weightKg, shipping_method: shippingMethod, zone, exchange_rate: exchangeRate, target_margin: Math.round(targetMargin * 100) },
      cost_breakdown: {
        product_cost_jpy: costJpy,
        shipping_cost_jpy: shippingCostJpy,
        shipping_cost_usd: Math.round(shippingCostUsd * 100) / 100,
        packaging_jpy: packagingJpy,
        total_cost_jpy: totalCostJpy,
        total_cost_usd: Math.round(totalCostUsd * 100) / 100
      },
      recommended: {
        price_usd: recommendedPriceUsd,
        shipping_charge_usd: Math.ceil(shippingCostUsd),
      },
      fee_breakdown: {
        ebay_final_value_fee: Math.round(ebayFinalValueFee * 100) / 100,
        ebay_international_fee: Math.round(ebayInternationalFee * 100) / 100,
        ebay_fixed_fee: ebayFixedFee,
        total_ebay_fees: Math.round(totalEbayFees * 100) / 100,
        payoneer_fee: Math.round(payoneerFee * 100) / 100,
        total_fees_usd: Math.round((totalEbayFees + payoneerFee) * 100) / 100
      },
      profit: {
        net_payout_usd: Math.round(netPayoutUsd * 100) / 100,
        net_payout_jpy: netPayoutJpy,
        profit_jpy: profitJpy,
        profit_margin: profitMargin
      },
      price_table: priceTable,
      fee_rates: {
        ebay_final_value: '12.9%',
        ebay_international: '1.65%',
        ebay_fixed: '$0.30/件',
        payoneer: '〜2%',
        total_effective: Math.round(totalFeeRate * 1000) / 10 + '%'
      }
    })
  } catch (error) {
    console.error('Price calc error:', error)
    return c.json({ success: false, error: '価格計算に失敗しました' }, 500)
  }
})

// ============================================================
// 利益シミュレーション（複数為替レートで計算）
// ============================================================
crossBorder.post('/simulate-profit', async (c) => {
  try {
    const { price_jpy, price_usd, shipping_cost_usd, weight_kg, shipping_method, zone } = await c.req.json()
    const costJpy = Math.round(Number(price_jpy) * 1.1)
    const packagingJpy = EBAY_FEES.packagingCostJpy

    // 送料（JPY）
    const w = Number(weight_kg) || 1
    const shippingResult = calcShippingCost(w, shipping_method || 'ems', zone || 'us')
    const shippingCostJpy = shippingResult?.jpy || Math.round((shipping_cost_usd || 30) * 150)

    const rates = [120, 130, 140, 145, 150, 155, 160, 170]
    const totalFeeRate = EBAY_FEES.finalValueFeeRate + EBAY_FEES.internationalFeeRate

    const simulations = rates.map(rate => {
      // eBay手数料
      const ebayFees = price_usd * totalFeeRate + EBAY_FEES.fixedFeeUsd
      const payoneerPayout = price_usd - ebayFees
      const payoneerFee = payoneerPayout * EBAY_FEES.payoneerFeeRate
      const netUsd = payoneerPayout - payoneerFee
      const netJpy = Math.floor(netUsd * rate)
      const profit = netJpy - costJpy - shippingCostJpy - packagingJpy
      const margin = netJpy > 0 ? Math.round((profit / netJpy) * 100) : 0
      return {
        rate,
        sale_usd: price_usd,
        net_payout_jpy: netJpy,
        fees_usd: Math.round((ebayFees + payoneerFee) * 100) / 100,
        fees_jpy: Math.floor((ebayFees + payoneerFee) * rate),
        shipping_jpy: shippingCostJpy,
        profit,
        margin
      }
    })

    return c.json({
      success: true,
      costJpy,
      shipping_cost_jpy: shippingCostJpy,
      packaging_jpy: packagingJpy,
      simulations
    })
  } catch (error) {
    return c.json({ success: false, error: 'シミュレーション失敗' }, 500)
  }
})

// ============================================================
// 送料テーブル情報取得（拡張版：業者詳細含む）
// ============================================================
crossBorder.get('/shipping-table', (c) => {
  const table: any = {}
  for (const [key, carrier] of Object.entries(SHIPPING_TABLE)) {
    table[key] = {
      name: carrier.name,
      code: carrier.code,
      carrier_group: carrier.carrier_group,
      days: carrier.days,
      tracking: carrier.tracking,
      insurance: carrier.insurance,
      max_kg: carrier.max_kg,
      note: carrier.note,
      ebay_carrier_code: carrier.ebay_carrier_code,
      tracking_url_template: carrier.tracking_url_template,
      is_estimate: carrier.is_estimate,
      discount_applicable: carrier.discount_applicable,
      zones: Object.keys(carrier.zones),
      max_weights: {} as any
    }
    for (const [zone, rates] of Object.entries(carrier.zones)) {
      table[key].max_weights[zone] = (rates as any)[(rates as any).length - 1]?.maxKg || 0
    }
  }
  return c.json({
    success: true,
    methods: table,
    fee_rates: EBAY_FEES,
    zones: {
      us: 'アメリカ・カナダ・メキシコ',
      eu: 'ヨーロッパ',
      asia: 'アジア・オセアニア'
    },
    recommendations: SHIPPING_RECOMMENDATIONS
  })
})

// ============================================================
// 全業者一括送料比較API（重量＆ゾーン指定で全業者の送料を取得）
// ============================================================
crossBorder.post('/compare-shipping', async (c) => {
  try {
    const { weight_kg, zone, exchange_rate } = await c.req.json()
    const w = Number(weight_kg) || 1
    const z = zone || 'us'
    const rate = Number(exchange_rate) || 150

    // 法人割引率を取得
    const db = (c.env as any).DB
    let discountMap: Record<string, number> = {}
    try {
      const discounts = await db.prepare('SELECT carrier_code, discount_rate FROM carrier_discount_settings').all()
      if (discounts.results) {
        for (const d of discounts.results) {
          discountMap[(d as any).carrier_code] = Number((d as any).discount_rate) || 0
        }
      }
    } catch { /* テーブルが無ければスキップ */ }

    const recommendation = getRecommendation(w)
    const results: any[] = []

    for (const [key, carrier] of Object.entries(SHIPPING_TABLE)) {
      const zones = carrier.zones[z]
      if (!zones) continue
      const maxWeight = zones[zones.length - 1]?.maxKg || 0
      const available = w <= maxWeight && w <= carrier.max_kg

      let costJpy = 0
      let costUsd = 0
      if (available) {
        const discount = discountMap[key] || 0
        const result = calcShippingCost(w, key, z, discount)
        if (result) {
          costJpy = result.jpy
          costUsd = Math.round((costJpy / rate) * 100) / 100
        }
      }

      const isRecommended = recommendation.methods.includes(key)

      results.push({
        carrier_code: key,
        name: carrier.name,
        carrier_group: carrier.carrier_group,
        days: carrier.days,
        tracking: carrier.tracking,
        insurance: carrier.insurance,
        max_kg: carrier.max_kg,
        note: carrier.note,
        ebay_carrier_code: carrier.ebay_carrier_code,
        is_estimate: carrier.is_estimate,
        discount_applied: discountMap[key] || 0,
        available,
        cost_jpy: costJpy,
        cost_usd: costUsd,
        is_recommended: isRecommended
      })
    }

    // コスト順にソート（利用可能なもの優先、次にコスト昇順）
    results.sort((a, b) => {
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      if (a.is_recommended && !b.is_recommended) return -1
      if (!a.is_recommended && b.is_recommended) return 1
      return a.cost_jpy - b.cost_jpy
    })

    return c.json({
      success: true,
      weight_kg: w,
      zone: z,
      exchange_rate: rate,
      recommendation: {
        label: recommendation.label,
        reason: recommendation.reason,
        recommended_carriers: recommendation.methods
      },
      carriers: results
    })
  } catch (error) {
    console.error('Compare shipping error:', error)
    return c.json({ success: false, error: '送料比較に失敗しました' }, 500)
  }
})

// ============================================================
// 法人割引率設定取得
// ============================================================
crossBorder.get('/carrier-discounts', async (c) => {
  try {
    const db = (c.env as any).DB
    const result = await db.prepare('SELECT * FROM carrier_discount_settings ORDER BY carrier_code').all()
    return c.json({ success: true, discounts: result.results || [] })
  } catch (error) {
    return c.json({ success: true, discounts: [] })
  }
})

// ============================================================
// 法人割引率設定更新
// ============================================================
crossBorder.put('/carrier-discounts/:code', async (c) => {
  try {
    const code = c.req.param('code')
    const { discount_rate, notes } = await c.req.json()
    const rate = Math.max(0, Math.min(1, Number(discount_rate) || 0))
    const db = (c.env as any).DB
    await db.prepare(
      'INSERT INTO carrier_discount_settings (carrier_code, discount_rate, notes, updated_at) VALUES (?, ?, ?, datetime(\'now\')) ON CONFLICT(carrier_code) DO UPDATE SET discount_rate = excluded.discount_rate, notes = excluded.notes, updated_at = datetime(\'now\')'
    ).bind(code, rate, notes || null).run()
    return c.json({ success: true, carrier_code: code, discount_rate: rate })
  } catch (error) {
    return c.json({ success: false, error: '割引率の更新に失敗しました' }, 500)
  }
})

// ============================================================
// 追跡番号登録＋追跡URL自動生成
// ============================================================
crossBorder.put('/orders/:id/tracking', async (c) => {
  try {
    const orderId = c.req.param('id')
    const { tracking_number, carrier_code, shipping_method } = await c.req.json()

    if (!tracking_number) {
      return c.json({ success: false, error: '追跡番号を入力してください' }, 400)
    }

    // 追跡URLを自動生成
    let trackingUrl = ''
    const carrier = SHIPPING_TABLE[carrier_code]
    if (carrier && carrier.tracking_url_template) {
      trackingUrl = carrier.tracking_url_template.replace('{tracking}', tracking_number)
    }

    const db = (c.env as any).DB
    await db.prepare(
      `UPDATE cross_border_orders SET
        tracking_number = ?,
        carrier_code = ?,
        shipping_method = ?,
        tracking_url = ?,
        status = CASE WHEN status IN ('preparing','buyback_completed') THEN 'shipped' ELSE status END,
        shipped_at = CASE WHEN status IN ('preparing','buyback_completed') THEN datetime('now') ELSE shipped_at END,
        updated_at = datetime('now')
      WHERE id = ?`
    ).bind(tracking_number, carrier_code || null, shipping_method || null, trackingUrl, orderId).run()

    return c.json({
      success: true,
      order_id: orderId,
      tracking_number,
      carrier_code,
      carrier_name: carrier?.name || shipping_method || '',
      tracking_url: trackingUrl,
      ebay_carrier_code: carrier?.ebay_carrier_code || 'OTHER'
    })
  } catch (error) {
    console.error('Tracking update error:', error)
    return c.json({ success: false, error: '追跡番号の登録に失敗しました' }, 500)
  }
})

// ============================================================
// 追跡URL取得（注文IDから）
// ============================================================
crossBorder.get('/orders/:id/tracking', async (c) => {
  try {
    const orderId = c.req.param('id')
    const db = (c.env as any).DB
    const order = await db.prepare(
      'SELECT tracking_number, carrier_code, shipping_method, tracking_url FROM cross_border_orders WHERE id = ?'
    ).bind(orderId).first()

    if (!order) {
      return c.json({ success: false, error: '注文が見つかりません' }, 404)
    }

    const carrier = order.carrier_code ? SHIPPING_TABLE[order.carrier_code as string] : null

    return c.json({
      success: true,
      tracking_number: order.tracking_number,
      carrier_code: order.carrier_code,
      carrier_name: carrier?.name || order.shipping_method || '',
      tracking_url: order.tracking_url || '',
      ebay_carrier_code: carrier?.ebay_carrier_code || 'OTHER'
    })
  } catch (error) {
    return c.json({ success: false, error: '追跡情報の取得に失敗しました' }, 500)
  }
})

// ============================================================
// 発送手配書データ生成API
// ============================================================
crossBorder.get('/orders/:id/shipping-document', async (c) => {
  try {
    const orderId = c.req.param('id')
    const db = (c.env as any).DB

    // 注文情報＋出品情報＋商品情報を結合取得
    const order = await db.prepare(`
      SELECT o.*,
             l.title_en, l.description_en, l.price_usd as listing_price_usd,
             l.shipping_cost_usd, l.weight_kg as listing_weight_kg,
             l.ebay_listing_id, l.ebay_sku,
             p.title as product_title, p.vm_maker, p.vm_model,
             p.condition, p.description as product_description,
             p.main_image, p.weight_kg as product_weight_kg
      FROM cross_border_orders o
      LEFT JOIN cross_border_listings l ON o.listing_id = l.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `).bind(orderId).first()

    if (!order) {
      return c.json({ success: false, error: '注文が見つかりません' }, 404)
    }

    // 配送業者情報
    const carrier = order.carrier_code ? SHIPPING_TABLE[order.carrier_code as string] : null
    const carrierName = carrier?.name || (order as any).shipping_method || '未設定'

    // 追跡URL
    let trackingUrl = (order as any).tracking_url || ''
    if (!trackingUrl && (order as any).tracking_number && carrier) {
      trackingUrl = carrier.tracking_url_template.replace('{tracking}', (order as any).tracking_number)
    }

    // 発送手配書用データ
    const document = {
      // 注文情報
      order_id: order.id,
      ebay_order_id: (order as any).ebay_order_id || '',
      ebay_listing_id: (order as any).ebay_listing_id || '',
      ebay_sku: (order as any).ebay_sku || '',
      order_status: (order as any).status,
      ordered_at: (order as any).ordered_at,
      // 商品情報
      product_title_ja: (order as any).product_title || '',
      product_title_en: (order as any).title_en || '',
      product_description_en: (order as any).description_en || '',
      vm_maker: (order as any).vm_maker || '',
      vm_model: (order as any).vm_model || '',
      condition: (order as any).condition || '',
      main_image: (order as any).main_image || '',
      // 配送情報
      carrier_code: (order as any).carrier_code || '',
      carrier_name: carrierName,
      tracking_number: (order as any).tracking_number || '',
      tracking_url: trackingUrl,
      weight_kg: (order as any).listing_weight_kg || (order as any).product_weight_kg || 0,
      package_weight_kg: (order as any).package_weight_kg || 0,
      shipping_zone: (order as any).shipping_zone || '',
      // 送り先（バイヤー）
      buyer_name: (order as any).buyer_name || '',
      buyer_country: (order as any).buyer_country || '',
      buyer_address: (order as any).buyer_address || '',
      buyer_email: (order as any).buyer_email || '',
      buyer_phone: (order as any).buyer_phone || '',
      // 送り元
      sender_name: 'TCI inc / PARTS HUB',
      sender_address: '1-5-4 Nittaka, Yodogawa-ku, Osaka-shi, Osaka 532-0033, Japan',
      sender_phone: '', // 管理画面から設定
      // 金額情報（インボイス用）
      sale_price_usd: (order as any).sale_price_usd || 0,
      sale_price_jpy: (order as any).sale_price_jpy || 0,
      shipping_cost_usd: (order as any).shipping_cost_usd || 0,
      // チェックリスト
      checklist: [
        { item: '商品の検品・動作確認', checked: false },
        { item: '商品写真の撮影（梱包前）', checked: false },
        { item: '梱包材で適切に保護', checked: false },
        { item: 'インボイス（3枚）の印刷', checked: false },
        { item: '送り状の作成・貼付', checked: false },
        { item: '追跡番号の登録', checked: false },
        { item: 'eBayに発送通知を送信', checked: false },
        { item: '梱包後の重量計測', checked: false }
      ]
    }

    // 印刷済みフラグ更新
    await db.prepare(
      'UPDATE cross_border_orders SET shipping_doc_printed = 1, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(orderId).run()

    return c.json({ success: true, document })
  } catch (error) {
    console.error('Shipping document error:', error)
    return c.json({ success: false, error: '発送手配書の生成に失敗しました' }, 500)
  }
})

// ============================================================
// 出品保存時に配送業者コードも保存するようにlistings更新
// ============================================================
crossBorder.put('/listings/:id/shipping', async (c) => {
  try {
    const id = c.req.param('id')
    const { carrier_code, shipping_zone, weight_kg, shipping_cost_usd } = await c.req.json()
    const db = (c.env as any).DB
    await db.prepare(
      `UPDATE cross_border_listings SET
        carrier_code = ?, shipping_zone = ?, weight_kg = ?, shipping_cost_usd = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).bind(carrier_code || null, shipping_zone || null, weight_kg || null, shipping_cost_usd || null, id).run()
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: '配送設定の更新に失敗しました' }, 500)
  }
})

// ============================================================
// 配送業者一覧API（フロントエンド用 軽量版）
// ============================================================
crossBorder.get('/carriers', (c) => {
  const carriers = Object.entries(SHIPPING_TABLE).map(([key, carrier]) => ({
    code: key,
    name: carrier.name,
    carrier_group: carrier.carrier_group,
    days: carrier.days,
    tracking: carrier.tracking,
    insurance: carrier.insurance,
    max_kg: carrier.max_kg,
    note: carrier.note,
    ebay_carrier_code: carrier.ebay_carrier_code,
    is_estimate: carrier.is_estimate,
    discount_applicable: carrier.discount_applicable
  }))

  return c.json({
    success: true,
    carriers,
    carrier_groups: {
      japan_post: { name: '日本郵便', carriers: carriers.filter(c => c.carrier_group === 'japan_post').map(c => c.code) },
      fedex: { name: 'FedEx', carriers: carriers.filter(c => c.carrier_group === 'fedex').map(c => c.code) },
      dhl: { name: 'DHL', carriers: carriers.filter(c => c.carrier_group === 'dhl').map(c => c.code) },
      ups: { name: 'UPS', carriers: carriers.filter(c => c.carrier_group === 'ups').map(c => c.code) },
      yamato: { name: 'ヤマト運輸', carriers: carriers.filter(c => c.carrier_group === 'yamato').map(c => c.code) },
      sagawa: { name: '佐川急便', carriers: carriers.filter(c => c.carrier_group === 'sagawa').map(c => c.code) }
    }
  })
})

export default crossBorder
