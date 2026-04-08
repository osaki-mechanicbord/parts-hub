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
// 利益シミュレーション（複数為替レートで計算）
// ============================================================
crossBorder.post('/simulate-profit', async (c) => {
  try {
    const { price_jpy, price_usd, shipping_cost_usd } = await c.req.json()
    const costJpy = Math.floor(Number(price_jpy) * 1.1) // 税込仕入れ価格
    const rates = [130, 135, 140, 145, 150, 155, 160]

    const simulations = rates.map(rate => {
      const saleJpy = Math.floor((price_usd + shipping_cost_usd) * rate)
      const fees = Math.floor(saleJpy * 0.16) // eBay 13% + PayPal 3%
      const shippingJpy = Math.floor(shipping_cost_usd * rate)
      const profit = saleJpy - costJpy - fees - shippingJpy
      const margin = saleJpy > 0 ? Math.round((profit / saleJpy) * 100) : 0
      return { rate, saleJpy, fees, shippingJpy, profit, margin }
    })

    return c.json({ success: true, costJpy, simulations })
  } catch (error) {
    return c.json({ success: false, error: 'シミュレーション失敗' }, 500)
  }
})

export default crossBorder
