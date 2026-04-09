import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
  EBAY_CLIENT_ID?: string
  EBAY_CLIENT_SECRET?: string
  EBAY_DEV_ID?: string
  EBAY_ENVIRONMENT?: string // 'sandbox' or 'production'
  JWT_SECRET?: string
}

const ebay = new Hono<{ Bindings: Bindings }>()

// eBay API base URLs
function getEbayApiBase(env: Bindings): string {
  return env.EBAY_ENVIRONMENT === 'production'
    ? 'https://api.ebay.com'
    : 'https://api.sandbox.ebay.com'
}

function getEbayAuthBase(env: Bindings): string {
  return env.EBAY_ENVIRONMENT === 'production'
    ? 'https://api.ebay.com'
    : 'https://api.sandbox.ebay.com'
}

// ========================================
// OAuth Token取得（Client Credentials Grant）
// ========================================
// トークンをキャッシュするためのシンプルなインメモリキャッシュ
// Cloudflare Workersはリクエスト間で状態が保持されない場合があるため
// 毎回取得するが、将来的にKVキャッシュに置き換え可能
async function getOAuthToken(env: Bindings): Promise<string> {
  const clientId = env.EBAY_CLIENT_ID
  const clientSecret = env.EBAY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('eBay API credentials not configured')
  }

  const authBase = getEbayAuthBase(env)
  const credentials = btoa(`${clientId}:${clientSecret}`)

  const response = await fetch(`${authBase}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope'
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('eBay OAuth error:', response.status, errorText)
    throw new Error(`eBay OAuth failed: ${response.status}`)
  }

  const data = await response.json() as any
  return data.access_token
}

// ========================================
// 商品検索 API（Browse API - item_summary/search）
// ========================================
ebay.get('/search', async (c) => {
  try {
    const env = c.env
    const q = c.req.query('q') || ''
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')
    const sort = c.req.query('sort') || ''
    const filter = c.req.query('filter') || ''
    const categoryIds = c.req.query('category_ids') || ''

    if (!q && !categoryIds) {
      return c.json({ success: false, error: 'キーワード(q)またはカテゴリID(category_ids)が必要です' }, 400)
    }

    const token = await getOAuthToken(env)
    const apiBase = getEbayApiBase(env)

    // クエリパラメータ構築
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (categoryIds) params.set('category_ids', categoryIds)
    params.set('limit', String(Math.min(limit, 50)))
    params.set('offset', String(offset))
    if (sort) params.set('sort', sort)
    if (filter) params.set('filter', filter)
    // 車パーツ向けにUS/JPマーケットプレイスのフィルタを追加
    params.set('fieldgroups', 'MATCHING_ITEMS')

    const response = await fetch(`${apiBase}/buy/browse/v1/item_summary/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DJP',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('eBay search error:', response.status, errorText)
      // Sandbox環境でのAPI制限の場合は空の結果を返す
      if (env.EBAY_ENVIRONMENT !== 'production') {
        return c.json({
          success: true,
          data: {
            total: 0,
            items: [],
            offset: 0,
            limit: limit,
            next: null,
            sandbox: true,
            note: 'Sandbox環境ではBrowse APIの検索データが制限されています。Production環境に切り替えると実データが取得できます。'
          }
        })
      }
      return c.json({ 
        success: false, 
        error: `eBay API error: ${response.status}`,
        details: errorText
      }, response.status as any)
    }

    const data = await response.json() as any

    // レスポンスを整形
    const items = (data.itemSummaries || []).map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      price: item.price ? {
        value: item.price.value,
        currency: item.price.currency
      } : null,
      condition: item.condition,
      conditionId: item.conditionId,
      image: item.image?.imageUrl,
      itemWebUrl: item.itemWebUrl,
      location: item.itemLocation ? {
        country: item.itemLocation.country,
        postalCode: item.itemLocation.postalCode
      } : null,
      seller: item.seller ? {
        username: item.seller.username,
        feedbackPercentage: item.seller.feedbackPercentage,
        feedbackScore: item.seller.feedbackScore
      } : null,
      buyingOptions: item.buyingOptions,
      shippingOptions: item.shippingOptions?.map((s: any) => ({
        type: s.shippingCostType,
        cost: s.shippingCost
      })),
      categories: item.categories
    }))

    return c.json({
      success: true,
      data: {
        total: data.total || 0,
        items,
        offset: data.offset || 0,
        limit: data.limit || limit,
        next: data.next || null
      }
    })

  } catch (error: any) {
    console.error('eBay search error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'eBay検索に失敗しました' 
    }, 500)
  }
})

// ========================================
// 価格調査 API（キーワードから相場価格を取得）
// ========================================
ebay.get('/price-research', async (c) => {
  try {
    const env = c.env
    const q = c.req.query('q') || ''
    const condition = c.req.query('condition') || '' // NEW, USED
    const partNumber = c.req.query('part_number') || ''

    if (!q && !partNumber) {
      return c.json({ success: false, error: 'キーワード(q)または品番(part_number)が必要です' }, 400)
    }

    const searchQuery = partNumber || q
    const token = await getOAuthToken(env)
    const apiBase = getEbayApiBase(env)

    // 価格調査用: 複数の条件で検索して相場を把握
    const params = new URLSearchParams()
    params.set('q', searchQuery)
    params.set('limit', '50')
    params.set('sort', 'price')
    params.set('fieldgroups', 'MATCHING_ITEMS')

    // コンディションフィルタ
    const filters: string[] = []
    if (condition === 'new') {
      filters.push('conditionIds:{1000}')
    } else if (condition === 'used') {
      filters.push('conditionIds:{3000|4000|5000|6000}')
    }
    // 車パーツカテゴリに絞る (eBay Motors Parts & Accessories = 6028)
    filters.push('buyingOptions:{FIXED_PRICE}')
    
    if (filters.length > 0) {
      params.set('filter', filters.join(','))
    }

    const response = await fetch(`${apiBase}/buy/browse/v1/item_summary/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DJP',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('eBay price research error:', response.status, errorText)
      // Sandbox環境では空結果を返す
      if (env.EBAY_ENVIRONMENT !== 'production') {
        return c.json({
          success: true,
          data: {
            query: searchQuery,
            totalResults: 0,
            priceAnalysis: null,
            sandbox: true,
            message: 'Sandbox環境では検索データが制限されています。Production環境で実データが利用可能です。'
          }
        })
      }
      return c.json({ 
        success: false, 
        error: `eBay API error: ${response.status}` 
      }, response.status as any)
    }

    const data = await response.json() as any
    const items = data.itemSummaries || []

    if (items.length === 0) {
      return c.json({
        success: true,
        data: {
          query: searchQuery,
          totalResults: 0,
          priceAnalysis: null,
          message: '該当する商品が見つかりませんでした'
        }
      })
    }

    // 価格分析
    const prices = items
      .filter((item: any) => item.price && item.price.value)
      .map((item: any) => parseFloat(item.price.value))
      .filter((p: number) => !isNaN(p) && p > 0)
      .sort((a: number, b: number) => a - b)

    if (prices.length === 0) {
      return c.json({
        success: true,
        data: {
          query: searchQuery,
          totalResults: data.total || 0,
          priceAnalysis: null,
          message: '価格データが取得できませんでした'
        }
      })
    }

    // 外れ値除外（IQR法）
    const q1Index = Math.floor(prices.length * 0.25)
    const q3Index = Math.floor(prices.length * 0.75)
    const q1 = prices[q1Index]
    const q3 = prices[q3Index]
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    const filteredPrices = prices.filter(p => p >= lowerBound && p <= upperBound)
    const usePrices = filteredPrices.length >= 3 ? filteredPrices : prices

    const sum = usePrices.reduce((a: number, b: number) => a + b, 0)
    const avg = sum / usePrices.length
    const median = usePrices[Math.floor(usePrices.length / 2)]
    const min = usePrices[0]
    const max = usePrices[usePrices.length - 1]

    // 通貨情報（最初のアイテムから取得）
    const currency = items[0]?.price?.currency || 'USD'

    // サンプル商品（最安値付近3件 + 中央値付近2件 + 最高値付近1件）
    const sampleItems = []
    // 最安値付近
    for (let i = 0; i < Math.min(3, items.length); i++) {
      if (items[i]?.price) {
        sampleItems.push({
          title: items[i].title,
          price: items[i].price,
          condition: items[i].condition,
          image: items[i].image?.imageUrl,
          itemWebUrl: items[i].itemWebUrl,
          location: items[i].itemLocation?.country
        })
      }
    }

    return c.json({
      success: true,
      data: {
        query: searchQuery,
        totalResults: data.total || 0,
        currency,
        priceAnalysis: {
          average: Math.round(avg * 100) / 100,
          median: Math.round(median * 100) / 100,
          min: Math.round(min * 100) / 100,
          max: Math.round(max * 100) / 100,
          sampleSize: usePrices.length,
          totalListings: data.total || 0
        },
        sampleItems
      }
    })

  } catch (error: any) {
    console.error('eBay price research error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'eBay価格調査に失敗しました' 
    }, 500)
  }
})

// ========================================
// API設定確認エンドポイント（管理者用）
// ========================================
ebay.get('/status', async (c) => {
  const env = c.env
  const hasClientId = !!env.EBAY_CLIENT_ID
  const hasClientSecret = !!env.EBAY_CLIENT_SECRET
  const hasDevId = !!env.EBAY_DEV_ID
  const environment = env.EBAY_ENVIRONMENT || 'sandbox'

  let tokenValid = false
  if (hasClientId && hasClientSecret) {
    try {
      await getOAuthToken(env)
      tokenValid = true
    } catch (e) {
      tokenValid = false
    }
  }

  return c.json({
    success: true,
    data: {
      configured: hasClientId && hasClientSecret,
      environment,
      credentials: {
        clientId: hasClientId,
        clientSecret: hasClientSecret,
        devId: hasDevId
      },
      tokenValid
    }
  })
})

export default ebay
