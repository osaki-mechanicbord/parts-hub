/**
 * eBay Sell API 連携ルート
 * OAuth User Token + Inventory API + Offer API + Fulfillment API
 * /api/admin/ebay-sell/*
 */

import { Hono } from 'hono'
import { verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
  EBAY_CLIENT_ID?: string
  EBAY_CLIENT_SECRET?: string
  EBAY_DEV_ID?: string
  EBAY_ENVIRONMENT?: string
  EBAY_RU_NAME?: string  // eBay Redirect URL name (RuName)
  JWT_SECRET?: string
  R2_PUBLIC_URL?: string
}

const ebaySell = new Hono<{ Bindings: Bindings }>()

// =============================================
// ヘルパー関数
// =============================================

function getApiBase(env: Bindings): string {
  return env.EBAY_ENVIRONMENT === 'production'
    ? 'https://api.ebay.com'
    : 'https://api.sandbox.ebay.com'
}

function getAuthBase(env: Bindings): string {
  return env.EBAY_ENVIRONMENT === 'production'
    ? 'https://auth.ebay.com'
    : 'https://auth.sandbox.ebay.com'
}

// 管理者認証ミドルウェア
ebaySell.use('*', async (c, next) => {
  // OAuth コールバックは認証不要
  if (c.req.path.endsWith('/oauth/callback')) {
    return next()
  }
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '管理者認証が必要です' }, 401)
  }
  const token = authHeader.substring(7)
  const secret = c.env.JWT_SECRET || 'parts-hub-admin-secret-2026'
  try {
    const payload = await verify(token, secret, 'HS256')
    if (payload.role !== 'admin') {
      return c.json({ success: false, error: '管理者権限がありません' }, 403)
    }
    await next()
  } catch {
    return c.json({ success: false, error: '管理者トークンが無効です' }, 401)
  }
})

// =============================================
// OAuth User Token 管理
// =============================================

/**
 * DB から有効なUser Access Token を取得
 * 期限切れの場合は自動リフレッシュ
 */
const DEFAULT_EBAY_SCOPES = 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.marketing'

async function getUserToken(env: Bindings): Promise<string> {
  const { DB } = env as any
  const environment = env.EBAY_ENVIRONMENT || 'production'

  const tokenRow = await DB.prepare(`
    SELECT * FROM ebay_user_tokens
    WHERE seller_account = 'default' AND environment = ?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(environment).first() as any

  if (!tokenRow) {
    throw new Error('eBay User Token が未設定です。管理画面からeBayアカウントを連携してください。')
  }

  // トークンの有効期限チェック（5分のバッファ）
  const expiresAt = new Date(tokenRow.expires_at).getTime()
  const now = Date.now()

  if (now < expiresAt - 5 * 60 * 1000) {
    // まだ有効
    return tokenRow.access_token
  }

  // リフレッシュトークンの有効期限チェック
  const refreshExpiresAt = new Date(tokenRow.refresh_token_expires_at).getTime()
  if (now > refreshExpiresAt) {
    throw new Error('eBay Refresh Token が期限切れです。管理画面から再度eBayアカウントを連携してください。')
  }

  // トークンリフレッシュ
  const clientId = env.EBAY_CLIENT_ID
  const clientSecret = env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('eBay API credentials not configured (EBAY_CLIENT_ID / EBAY_CLIENT_SECRET)')

  const apiBase = getApiBase(env)
  const credentials = btoa(`${clientId}:${clientSecret}`)

  // scopesが空文字・null・undefinedの場合はデフォルトスコープを使用
  const scopes = (tokenRow.scopes && tokenRow.scopes.trim()) ? tokenRow.scopes.trim() : DEFAULT_EBAY_SCOPES

  console.log(`[eBay Token Refresh] environment=${environment}, token_id=${tokenRow.id}, expires_at=${tokenRow.expires_at}, scopes_length=${scopes.length}`)

  const res = await fetch(`${apiBase}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenRow.refresh_token,
      scope: scopes
    }).toString()
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('eBay token refresh error:', res.status, errText)
    // エラー詳細をDBに記録
    try {
      await DB.prepare(`
        UPDATE ebay_user_tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(tokenRow.id).run()
    } catch (_) {}
    throw new Error(`eBay Token Refresh 失敗 (HTTP ${res.status}): ${errText.substring(0, 300)}`)
  }

  const data = await res.json() as any

  if (!data.access_token) {
    throw new Error('eBay Token Refresh: access_token がレスポンスに含まれていません')
  }

  // DB更新
  const newExpiresAt = new Date(now + (data.expires_in || 7200) * 1000).toISOString()
  await DB.prepare(`
    UPDATE ebay_user_tokens SET
      access_token = ?,
      expires_at = ?,
      scopes = CASE WHEN scopes IS NULL OR scopes = '' THEN ? ELSE scopes END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(data.access_token, newExpiresAt, DEFAULT_EBAY_SCOPES, tokenRow.id).run()

  console.log(`[eBay Token Refresh] Success! New expires_at=${newExpiresAt}`)
  return data.access_token
}

// =============================================
// 1. OAuth フロー
// =============================================

/**
 * GET /oauth/auth-url
 * eBay OAuth認証URLを生成
 */
ebaySell.get('/oauth/auth-url', async (c) => {
  const env = c.env
  const clientId = env.EBAY_CLIENT_ID
  const ruName = env.EBAY_RU_NAME

  if (!clientId || !ruName) {
    return c.json({
      success: false,
      error: 'EBAY_CLIENT_ID または EBAY_RU_NAME が設定されていません。',
      setup_instructions: {
        step1: 'eBay Developer Portal → Application Keys → Production → User Tokens で RuName を確認/作成',
        step2: 'wrangler secret put EBAY_RU_NAME --project-name parts-hub で RuName を設定',
        note: 'RuName は eBay が OAuth コールバックに使用するリダイレクトURL名です'
      }
    }, 400)
  }

  const authBase = getAuthBase(env)
  const scopes = [
    'https://api.ebay.com/oauth/api_scope',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.marketing',
    'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly'
  ].join(' ')

  // stateパラメータ（CSRF防止）
  const state = btoa(JSON.stringify({ ts: Date.now(), env: env.EBAY_ENVIRONMENT || 'production' }))

  const authUrl = `${authBase}/oauth2/authorize?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: ruName,
    response_type: 'code',
    scope: scopes,
    state: state
  }).toString()

  return c.json({
    success: true,
    auth_url: authUrl,
    state,
    instructions: 'このURLをブラウザで開いてeBayアカウントでログインしてください。認証後、コールバックURLにリダイレクトされます。'
  })
})

/**
 * GET /oauth/callback
 * eBay OAuthコールバック処理（eBayからのリダイレクト先）
 */
ebaySell.get('/oauth/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')
  const errorDescription = c.req.query('error_description')

  if (error) {
    return c.html(`
      <!DOCTYPE html><html><head><title>eBay連携エラー</title>
      <script src="https://cdn.tailwindcss.com"></script></head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div class="text-red-500 text-5xl mb-4"><i class="fas fa-times-circle"></i>❌</div>
          <h1 class="text-xl font-bold text-gray-800 mb-2">eBay連携に失敗しました</h1>
          <p class="text-gray-600 mb-4">${errorDescription || error}</p>
          <a href="/admin/cross-border" class="inline-block px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">管理画面に戻る</a>
        </div>
      </body></html>
    `)
  }

  if (!code) {
    return c.html(`
      <!DOCTYPE html><html><head><title>eBay連携エラー</title></head>
      <body><h1>認証コードが見つかりません</h1></body></html>
    `)
  }

  const env = c.env
  const { DB } = env as any
  const clientId = env.EBAY_CLIENT_ID
  const clientSecret = env.EBAY_CLIENT_SECRET
  const ruName = env.EBAY_RU_NAME

  if (!clientId || !clientSecret || !ruName) {
    return c.html('<html><body><h1>eBay API設定が不完全です</h1></body></html>')
  }

  try {
    const apiBase = getApiBase(env)
    const credentials = btoa(`${clientId}:${clientSecret}`)

    // 認証コードをアクセストークンに交換
    const tokenRes = await fetch(`${apiBase}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: ruName
      }).toString()
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('eBay token exchange error:', tokenRes.status, errText)
      return c.html(`
        <!DOCTYPE html><html><head><title>eBay連携エラー</title>
        <script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-gray-100 flex items-center justify-center min-h-screen">
          <div class="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
            <div class="text-red-500 text-5xl mb-4">❌</div>
            <h1 class="text-xl font-bold text-gray-800 mb-2">トークン取得に失敗</h1>
            <p class="text-sm text-gray-600 mb-4">Status: ${tokenRes.status}</p>
            <a href="/admin/cross-border" class="inline-block px-6 py-2 bg-red-500 text-white rounded-lg">管理画面に戻る</a>
          </div>
        </body></html>
      `)
    }

    const tokenData = await tokenRes.json() as any
    const environment = env.EBAY_ENVIRONMENT || 'production'
    const now = Date.now()
    const expiresAt = new Date(now + (tokenData.expires_in || 7200) * 1000).toISOString()
    const refreshExpiresAt = new Date(now + (tokenData.refresh_token_expires_in || 47304000) * 1000).toISOString() // ~18ヶ月

    // DBに保存（UPSERT）
    await DB.prepare(`
      INSERT INTO ebay_user_tokens (seller_account, access_token, refresh_token, token_type, expires_at, refresh_token_expires_at, scopes, environment)
      VALUES ('default', ?, ?, 'User Access Token', ?, ?, ?, ?)
      ON CONFLICT(seller_account, environment) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        expires_at = excluded.expires_at,
        refresh_token_expires_at = excluded.refresh_token_expires_at,
        scopes = excluded.scopes,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      tokenData.access_token,
      tokenData.refresh_token,
      expiresAt,
      refreshExpiresAt,
      tokenData.scope || '',
      environment
    ).run()

    return c.html(`
      <!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>eBay連携完了</title>
      <script src="https://cdn.tailwindcss.com"></script></head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div class="text-green-500 text-5xl mb-4">✅</div>
          <h1 class="text-xl font-bold text-gray-800 mb-2">eBay連携が完了しました！</h1>
          <p class="text-gray-600 mb-2">アクセストークンとリフレッシュトークンを保存しました。</p>
          <p class="text-sm text-gray-400 mb-4">環境: ${environment} / 有効期限: ${expiresAt}</p>
          <a href="/admin/cross-border" class="inline-block px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">
            越境EC管理画面へ
          </a>
        </div>
      </body></html>
    `)
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    return c.html(`
      <!DOCTYPE html><html><head><title>エラー</title></head>
      <body><h1>予期せぬエラーが発生しました</h1><p>${err.message}</p></body></html>
    `)
  }
})

/**
 * POST /oauth/exchange-code
 * 手動で認証コードをトークンに交換（コールバックが使えない場合）
 */
ebaySell.post('/oauth/exchange-code', async (c) => {
  const { code } = await c.req.json()
  if (!code) return c.json({ success: false, error: '認証コード(code)が必要です' }, 400)

  const env = c.env
  const { DB } = env as any
  const clientId = env.EBAY_CLIENT_ID
  const clientSecret = env.EBAY_CLIENT_SECRET
  const ruName = env.EBAY_RU_NAME

  if (!clientId || !clientSecret || !ruName) {
    return c.json({ success: false, error: 'eBay API設定が不完全です' }, 400)
  }

  try {
    const apiBase = getApiBase(env)
    const credentials = btoa(`${clientId}:${clientSecret}`)

    const tokenRes = await fetch(`${apiBase}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: ruName
      }).toString()
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      return c.json({ success: false, error: `Token exchange failed: ${tokenRes.status}`, details: errText }, 400)
    }

    const tokenData = await tokenRes.json() as any
    const environment = env.EBAY_ENVIRONMENT || 'production'
    const now = Date.now()
    const expiresAt = new Date(now + (tokenData.expires_in || 7200) * 1000).toISOString()
    const refreshExpiresAt = new Date(now + (tokenData.refresh_token_expires_in || 47304000) * 1000).toISOString()

    await DB.prepare(`
      INSERT INTO ebay_user_tokens (seller_account, access_token, refresh_token, token_type, expires_at, refresh_token_expires_at, scopes, environment)
      VALUES ('default', ?, ?, 'User Access Token', ?, ?, ?, ?)
      ON CONFLICT(seller_account, environment) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        expires_at = excluded.expires_at,
        refresh_token_expires_at = excluded.refresh_token_expires_at,
        scopes = excluded.scopes,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      tokenData.access_token,
      tokenData.refresh_token,
      expiresAt,
      refreshExpiresAt,
      tokenData.scope || '',
      environment
    ).run()

    return c.json({
      success: true,
      message: 'eBay User Token を保存しました',
      expires_at: expiresAt,
      refresh_token_expires_at: refreshExpiresAt
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

/**
 * GET /oauth/status
 * OAuth User Token の状態確認
 */
ebaySell.get('/oauth/status', async (c) => {
  const { DB } = c.env as any
  const environment = c.env.EBAY_ENVIRONMENT || 'production'

  const tokenRow = await DB.prepare(`
    SELECT id, seller_account, token_type, expires_at, refresh_token_expires_at, scopes, environment, created_at, updated_at
    FROM ebay_user_tokens
    WHERE seller_account = 'default' AND environment = ?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(environment).first() as any

  if (!tokenRow) {
    return c.json({
      success: true,
      connected: false,
      message: 'eBayアカウントが未連携です',
      has_ru_name: !!c.env.EBAY_RU_NAME
    })
  }

  const now = Date.now()
  const expiresAt = new Date(tokenRow.expires_at).getTime()
  const refreshExpiresAt = new Date(tokenRow.refresh_token_expires_at).getTime()

  return c.json({
    success: true,
    connected: true,
    token: {
      environment: tokenRow.environment,
      expires_at: tokenRow.expires_at,
      refresh_token_expires_at: tokenRow.refresh_token_expires_at,
      access_token_valid: now < expiresAt,
      refresh_token_valid: now < refreshExpiresAt,
      scopes: tokenRow.scopes,
      last_updated: tokenRow.updated_at
    },
    has_ru_name: !!c.env.EBAY_RU_NAME
  })
})

// =============================================
// 2. Inventory Location（倉庫/発送元）
// =============================================

/**
 * eBay Location API ペイロード構築ヘルパー
 * WAREHOUSEタイプの最小限ペイロード（eBay errorId 2004対策）
 * WAREHOUSEは postalCode+country または city+stateOrProvince+country のみ必要
 */
function buildLocationPayload(loc: {
  name: string
  address_line1?: string
  city: string
  state_or_province?: string
  postal_code: string
  country?: string
  phone?: string
}): Record<string, any> {
  // WAREHOUSEタイプ: postalCode + country が最小要件
  const address: Record<string, string> = {
    postalCode: loc.postal_code,
    country: loc.country || 'JP'
  }
  // city, stateOrProvince は値がある場合のみ追加
  if (loc.city && loc.city.trim()) address.city = loc.city.trim()
  if (loc.state_or_province && loc.state_or_province.trim()) address.stateOrProvince = loc.state_or_province.trim()
  // addressLine1 はWAREHOUSEでは省略（送ると2004エラーの原因になる場合がある）
  if (loc.address_line1 && loc.address_line1.trim()) address.addressLine1 = loc.address_line1.trim()

  // 最小限のペイロード: location + name のみ
  // merchantLocationStatus, locationTypes はデフォルト値で十分（ENABLED, WAREHOUSE）
  const payload: Record<string, any> = {
    location: { address },
    name: loc.name
  }
  // phone は値がある場合のみ（空文字列はNG）
  if (loc.phone && loc.phone.trim()) payload.phone = loc.phone.trim()

  return payload
}

/** merchantLocationKey を安全な形式に変換（英数字・ハイフン・アンダースコアのみ、最大36文字） */
function sanitizeLocationKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 36)
}

/** eBay Inventory Location API 共通ヘッダー */
function getLocationHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Language': 'ja-JP',
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'  // 海外出品先マーケットプレイス
  }
}

/**
 * POST /locations
 * 発送元ロケーションを作成・eBayに同期
 * 重要: eBay createInventoryLocation はドキュメントでは PUT だが、
 * 実際には POST メソッドでないと errorId 2004 が発生するケースがある
 */
ebaySell.post('/locations', async (c) => {
  const { DB } = c.env as any

  try {
    const body = await c.req.json()
    const { name, address_line1, city, state_or_province, postal_code, country, phone } = body
    const merchantLocationKey = body.merchant_location_key || `ph-${Date.now()}`

    if (!name || !city || !postal_code) {
      return c.json({ success: false, error: '名前・市区町村・郵便番号は必須です' }, 400)
    }

    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)

    const locationPayload = buildLocationPayload({
      name, address_line1, city, state_or_province, postal_code, country, phone
    })
    const safeKey = sanitizeLocationKey(merchantLocationKey)

    console.log('eBay createLocation request:', JSON.stringify({ key: safeKey, payload: locationPayload, method: 'POST' }))

    // POST メソッドで送信（PUT だと errorId 2004 になる）
    const res = await fetch(`${apiBase}/sell/inventory/v1/location/${safeKey}`, {
      method: 'POST',
      headers: getLocationHeaders(token),
      body: JSON.stringify(locationPayload)
    })

    const isSuccess = res.ok || res.status === 204
    const isConflict = res.status === 409

    if (!isSuccess && !isConflict) {
      const errText = await res.text()
      console.error('eBay create location error:', res.status, errText)
      // DB には保存するがeBay同期失敗マーク
      await DB.prepare(`
        INSERT INTO ebay_inventory_locations (merchant_location_key, name, address_line1, city, state_or_province, postal_code, country, phone, ebay_synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).bind(safeKey, name, address_line1 || '', city, state_or_province || '', postal_code, country || 'JP', phone || '').run()

      return c.json({
        success: true,
        merchant_location_key: safeKey,
        ebay_synced: false,
        ebay_error: errText,
        debug: { status: res.status, payload: locationPayload }
      })
    }

    // 成功: DB保存
    await DB.prepare(`
      INSERT INTO ebay_inventory_locations (merchant_location_key, name, address_line1, city, state_or_province, postal_code, country, phone, is_default, ebay_synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
      ON CONFLICT(merchant_location_key) DO UPDATE SET
        name = excluded.name, address_line1 = excluded.address_line1, city = excluded.city,
        state_or_province = excluded.state_or_province, postal_code = excluded.postal_code,
        country = excluded.country, phone = excluded.phone, ebay_synced = 1, updated_at = CURRENT_TIMESTAMP
    `).bind(safeKey, name, address_line1 || '', city, state_or_province || '', postal_code, country || 'JP', phone || '').run()

    return c.json({ success: true, merchant_location_key: safeKey, ebay_synced: true, was_conflict: isConflict })
  } catch (err: any) {
    console.error('Location create exception:', err)
    return c.json({ success: false, error: err.message }, 500)
  }
})

/**
 * GET /locations
 * 登録済みロケーション一覧
 */
ebaySell.get('/locations', async (c) => {
  const { DB } = c.env as any
  const { results } = await DB.prepare('SELECT * FROM ebay_inventory_locations ORDER BY is_default DESC, created_at ASC').all()
  return c.json({ success: true, locations: results || [] })
})

/**
 * POST /locations/sync
 * 未同期のロケーションをeBayに再同期
 * POST メソッドで送信（PUT だと errorId 2004 になる）
 */
ebaySell.post('/locations/sync', async (c) => {
  const { DB } = c.env as any

  try {
    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)

    // 未同期のロケーションを取得
    const { results } = await DB.prepare('SELECT * FROM ebay_inventory_locations WHERE ebay_synced = 0').all() as any
    if (!results || results.length === 0) {
      return c.json({ success: true, message: '未同期のロケーションはありません' })
    }

    const syncResults = []
    for (const loc of results) {
      const locationPayload = buildLocationPayload(loc)
      const safeKey = sanitizeLocationKey(loc.merchant_location_key)

      console.log('eBay syncLocation request:', JSON.stringify({ key: safeKey, payload: locationPayload, method: 'POST' }))

      // POST メソッドで送信
      const res = await fetch(`${apiBase}/sell/inventory/v1/location/${safeKey}`, {
        method: 'POST',
        headers: getLocationHeaders(token),
        body: JSON.stringify(locationPayload)
      })

      const syncSuccess = res.ok || res.status === 204 || res.status === 409

      if (syncSuccess) {
        await DB.prepare('UPDATE ebay_inventory_locations SET ebay_synced = 1, is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(loc.id).run()
        syncResults.push({ id: loc.id, name: loc.name, success: true })
      } else {
        const errText = await res.text()
        console.error('eBay location sync error:', res.status, errText)
        syncResults.push({
          id: loc.id,
          name: loc.name,
          success: false,
          status: res.status,
          error: errText
        })
      }
    }

    return c.json({ success: true, results: syncResults })
  } catch (err: any) {
    console.error('Location sync exception:', err)
    return c.json({ success: false, error: err.message }, 500)
  }
})

// =============================================
// 3. eBay Account Policies（返品・支払い・配送ポリシー）
// =============================================

/**
 * GET /policies
 * eBay のビジネスポリシー一覧を取得
 */
ebaySell.get('/policies', async (c) => {
  try {
    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)
    const marketplace = c.req.query('marketplace') || 'EBAY_US'

    const [fulfillment, payment, returnPolicy] = await Promise.all([
      fetch(`${apiBase}/sell/account/v1/fulfillment_policy?marketplace_id=${marketplace}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : { fulfillmentPolicies: [] }),
      fetch(`${apiBase}/sell/account/v1/payment_policy?marketplace_id=${marketplace}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : { paymentPolicies: [] }),
      fetch(`${apiBase}/sell/account/v1/return_policy?marketplace_id=${marketplace}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : { returnPolicies: [] })
    ])

    return c.json({
      success: true,
      fulfillmentPolicies: (fulfillment as any).fulfillmentPolicies || [],
      paymentPolicies: (payment as any).paymentPolicies || [],
      returnPolicies: (returnPolicy as any).returnPolicies || []
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// =============================================
// 4. Inventory API（商品登録）
// =============================================

/**
 * POST /inventory
 * 商品をeBay Inventoryに登録
 */
ebaySell.post('/inventory', async (c) => {
  const { DB } = c.env as any

  try {
    const body = await c.req.json()
    const { listing_id } = body // cross_border_listings.id

    if (!listing_id) return c.json({ success: false, error: 'listing_id は必須です' }, 400)

    // 出品データ取得
    const listing = await DB.prepare(`
      SELECT cb.*, p.title, p.description, p.condition, p.price, p.part_number, p.vm_maker, p.vm_model,
        (SELECT GROUP_CONCAT(image_url) FROM product_images WHERE product_id = p.id ORDER BY display_order ASC) as images
      FROM cross_border_listings cb
      LEFT JOIN products p ON cb.product_id = p.id
      WHERE cb.id = ?
    `).bind(listing_id).first() as any

    if (!listing) return c.json({ success: false, error: '出品データが見つかりません' }, 404)

    // SKU生成
    const sku = listing.ebay_sku || `PH-${listing.product_id}-${Date.now()}`

    // デフォルトロケーション取得
    const location = await DB.prepare(`
      SELECT merchant_location_key FROM ebay_inventory_locations WHERE is_default = 1 LIMIT 1
    `).first() as any

    // 商品画像URL一覧
    const imageUrls = (listing.images || '')
      .split(',')
      .filter((u: string) => u.trim())
      .map((u: string) => {
        if (u.startsWith('http')) return u
        const publicUrl = c.env.R2_PUBLIC_URL || 'https://images.parts-hub-tci.com'
        return `${publicUrl}/${u}`
      })
      .slice(0, 12) // eBay最大12枚

    // conditionマッピング
    const conditionMap: Record<string, string> = {
      'new': 'NEW',
      'like_new': 'LIKE_NEW',
      'good': 'USED_GOOD',
      'acceptable': 'USED_ACCEPTABLE'
    }

    const ebayCondition = listing.ebay_condition || conditionMap[listing.condition] || 'USED_GOOD'

    // Inventory Item Payload
    const inventoryPayload: any = {
      availability: {
        shipToLocationAvailability: {
          quantity: 1
        }
      },
      condition: ebayCondition,
      product: {
        title: (listing.title_en || listing.title || 'Auto Part').substring(0, 80),
        description: listing.description_en || listing.description || '',
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        aspects: {
          'Brand': [listing.vm_maker || 'Unbranded'],
          'Country/Region of Manufacture': ['Japan'],
          'Type': ['OEM']
        }
      }
    }

    // MPN（品番）があれば追加
    if (listing.part_number) {
      inventoryPayload.product.mpn = listing.part_number
      inventoryPayload.product.brand = listing.vm_maker || 'Unbranded'
    }

    // 重量・サイズがあれば追加
    if (listing.weight_kg) {
      inventoryPayload.packageWeightAndSize = {
        weight: {
          value: listing.weight_kg,
          unit: 'KILOGRAM'
        }
      }
      if (listing.length_cm && listing.width_cm && listing.height_cm) {
        inventoryPayload.packageWeightAndSize.dimensions = {
          length: listing.length_cm,
          width: listing.width_cm,
          height: listing.height_cm,
          unit: 'CENTIMETER'
        }
        inventoryPayload.packageWeightAndSize.packageType = 'PACKAGE_THICK_ENVELOPE'
      }
    }

    // ロケーション設定
    if (location?.merchant_location_key) {
      inventoryPayload.availability.shipToLocationAvailability.availabilityDistributions = [{
        merchantLocationKey: location.merchant_location_key,
        quantity: 1
      }]
    }

    // eBay API 呼び出し
    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)

    const res = await fetch(`${apiBase}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Language': 'en-US'
      },
      body: JSON.stringify(inventoryPayload)
    })

    if (!res.ok && res.status !== 204) {
      const errText = await res.text()
      console.error('eBay create inventory error:', res.status, errText)
      await DB.prepare(`
        UPDATE cross_border_listings SET ebay_last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(`Inventory API error ${res.status}: ${errText.substring(0, 500)}`, listing_id).run()
      return c.json({ success: false, error: `eBay Inventory API error: ${res.status}`, details: errText }, 400)
    }

    // DB更新
    await DB.prepare(`
      UPDATE cross_border_listings SET
        ebay_sku = ?, ebay_condition = ?, ebay_last_error = NULL,
        status = CASE WHEN status = 'draft' THEN 'ready' ELSE status END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(sku, ebayCondition, listing_id).run()

    return c.json({ success: true, sku, message: 'eBay Inventory に商品を登録しました' })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// =============================================
// 5. Offer API（出品）
// =============================================

/**
 * POST /offer
 * eBayに出品（Offer作成 + 公開）
 */
ebaySell.post('/offer', async (c) => {
  const { DB } = c.env as any

  try {
    const body = await c.req.json()
    const { listing_id, category_id, fulfillment_policy_id, payment_policy_id, return_policy_id, auto_publish } = body

    if (!listing_id) return c.json({ success: false, error: 'listing_id は必須です' }, 400)

    const listing = await DB.prepare(`
      SELECT * FROM cross_border_listings WHERE id = ?
    `).bind(listing_id).first() as any

    if (!listing) return c.json({ success: false, error: '出品データが見つかりません' }, 404)
    if (!listing.ebay_sku) return c.json({ success: false, error: '先にInventory登録が必要です' }, 400)

    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)
    const marketplace = listing.ebay_marketplace_id || 'EBAY_US'

    // Offer Payload
    const offerPayload: any = {
      sku: listing.ebay_sku,
      marketplaceId: marketplace,
      format: 'FIXED_PRICE',
      listingDescription: listing.description_en || '',
      pricingSummary: {
        price: {
          value: String(listing.price_usd || '0'),
          currency: 'USD'
        }
      },
      quantityLimitPerBuyer: 1,
      includeCatalogProductDetails: true
    }

    // カテゴリID（eBayカテゴリ）
    if (category_id || listing.ebay_category_id) {
      offerPayload.categoryId = category_id || listing.ebay_category_id
    }

    // ビジネスポリシー
    if (fulfillment_policy_id || listing.ebay_fulfillment_policy_id) {
      offerPayload.listingPolicies = {
        fulfillmentPolicyId: fulfillment_policy_id || listing.ebay_fulfillment_policy_id,
        paymentPolicyId: payment_policy_id || listing.ebay_payment_policy_id,
        returnPolicyId: return_policy_id || listing.ebay_return_policy_id
      }
    }

    // Offer作成
    const createRes = await fetch(`${apiBase}/sell/inventory/v1/offer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Language': 'en-US'
      },
      body: JSON.stringify(offerPayload)
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('eBay create offer error:', createRes.status, errText)
      await DB.prepare(`
        UPDATE cross_border_listings SET ebay_last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(`Offer API error ${createRes.status}: ${errText.substring(0, 500)}`, listing_id).run()
      return c.json({ success: false, error: `eBay Offer API error: ${createRes.status}`, details: errText }, 400)
    }

    const offerData = await createRes.json() as any
    const offerId = offerData.offerId

    // DB更新
    await DB.prepare(`
      UPDATE cross_border_listings SET
        ebay_offer_id = ?,
        ebay_category_id = COALESCE(?, ebay_category_id),
        ebay_fulfillment_policy_id = COALESCE(?, ebay_fulfillment_policy_id),
        ebay_payment_policy_id = COALESCE(?, ebay_payment_policy_id),
        ebay_return_policy_id = COALESCE(?, ebay_return_policy_id),
        ebay_last_error = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      offerId,
      category_id || null,
      fulfillment_policy_id || null,
      payment_policy_id || null,
      return_policy_id || null,
      listing_id
    ).run()

    // 自動公開
    if (auto_publish !== false) {
      const publishRes = await fetch(`${apiBase}/sell/inventory/v1/offer/${offerId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!publishRes.ok) {
        const errText = await publishRes.text()
        console.error('eBay publish offer error:', publishRes.status, errText)
        await DB.prepare(`
          UPDATE cross_border_listings SET ebay_last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(`Publish error ${publishRes.status}: ${errText.substring(0, 500)}`, listing_id).run()
        return c.json({
          success: true,
          offer_id: offerId,
          published: false,
          publish_error: errText,
          message: 'Offer作成は成功しましたが、公開に失敗しました。eBayのビジネスポリシー設定を確認してください。'
        })
      }

      const publishData = await publishRes.json() as any
      const ebayListingId = publishData.listingId

      await DB.prepare(`
        UPDATE cross_border_listings SET
          ebay_listing_id = ?, status = 'listed', listed_at = CURRENT_TIMESTAMP,
          external_listing_id = ?, external_url = ?,
          ebay_last_error = NULL, ebay_synced_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        ebayListingId, ebayListingId,
        `https://www.ebay.com/itm/${ebayListingId}`,
        listing_id
      ).run()

      return c.json({
        success: true,
        offer_id: offerId,
        listing_id: ebayListingId,
        published: true,
        ebay_url: `https://www.ebay.com/itm/${ebayListingId}`,
        message: 'eBayに出品が公開されました！'
      })
    }

    return c.json({ success: true, offer_id: offerId, published: false, message: 'Offer を作成しました（未公開）' })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

/**
 * POST /publish/:listingId
 * 既存Offerを公開
 */
ebaySell.post('/publish/:listingId', async (c) => {
  const { DB } = c.env as any
  const listingId = c.req.param('listingId')

  try {
    const listing = await DB.prepare('SELECT * FROM cross_border_listings WHERE id = ?').bind(listingId).first() as any
    if (!listing?.ebay_offer_id) return c.json({ success: false, error: 'Offer IDが見つかりません' }, 404)

    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)

    const res = await fetch(`${apiBase}/sell/inventory/v1/offer/${listing.ebay_offer_id}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errText = await res.text()
      return c.json({ success: false, error: `Publish error: ${res.status}`, details: errText }, 400)
    }

    const data = await res.json() as any

    await DB.prepare(`
      UPDATE cross_border_listings SET
        ebay_listing_id = ?, status = 'listed', listed_at = CURRENT_TIMESTAMP,
        external_listing_id = ?, external_url = ?,
        ebay_last_error = NULL, ebay_synced_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(data.listingId, data.listingId, `https://www.ebay.com/itm/${data.listingId}`, listingId).run()

    return c.json({ success: true, listing_id: data.listingId, ebay_url: `https://www.ebay.com/itm/${data.listingId}` })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

/**
 * DELETE /inventory/:listingId
 * eBayから出品を取り下げ
 */
ebaySell.delete('/inventory/:listingId', async (c) => {
  const { DB } = c.env as any
  const listingId = c.req.param('listingId')

  try {
    const listing = await DB.prepare('SELECT * FROM cross_border_listings WHERE id = ?').bind(listingId).first() as any
    if (!listing) return c.json({ success: false, error: '出品データが見つかりません' }, 404)

    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)

    // Offerを削除（出品取り下げ）
    if (listing.ebay_offer_id) {
      const withdrawRes = await fetch(`${apiBase}/sell/inventory/v1/offer/${listing.ebay_offer_id}/withdraw`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (!withdrawRes.ok && withdrawRes.status !== 404) {
        console.error('Withdraw error:', withdrawRes.status, await withdrawRes.text())
      }

      await fetch(`${apiBase}/sell/inventory/v1/offer/${listing.ebay_offer_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }

    // Inventory Itemを削除
    if (listing.ebay_sku) {
      await fetch(`${apiBase}/sell/inventory/v1/inventory_item/${encodeURIComponent(listing.ebay_sku)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }

    // DB更新
    await DB.prepare(`
      UPDATE cross_border_listings SET
        status = 'cancelled', ebay_listing_id = NULL, ebay_offer_id = NULL,
        ebay_last_error = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(listingId).run()

    return c.json({ success: true, message: 'eBayから出品を取り下げました' })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// =============================================
// 6. Fulfillment API（注文管理）
// =============================================

/**
 * GET /orders
 * eBayの注文を取得してDBに同期
 */
ebaySell.get('/orders', async (c) => {
  const { DB } = c.env as any

  try {
    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)
    const limit = c.req.query('limit') || '20'
    const days = parseInt(c.req.query('days') || '30')

    // 日付範囲
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const params = new URLSearchParams({
      limit,
      filter: `creationdate:[${fromDate}..],orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}`,
      orderBy: 'creationdate desc'
    })

    const res = await fetch(`${apiBase}/sell/fulfillment/v1/order?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!res.ok) {
      const errText = await res.text()
      return c.json({ success: false, error: `eBay Orders API error: ${res.status}`, details: errText }, 400)
    }

    const data = await res.json() as any
    const orders = data.orders || []

    // eBay注文をDBに同期
    let synced = 0
    for (const order of orders) {
      for (const lineItem of (order.lineItems || [])) {
        const sku = lineItem.sku || ''
        // SKUからcross_border_listingsを検索
        const listing = await DB.prepare(`
          SELECT id, product_id FROM cross_border_listings WHERE ebay_sku = ?
        `).bind(sku).first() as any

        if (!listing) continue

        // 既存注文チェック
        const existing = await DB.prepare(`
          SELECT id FROM cross_border_orders WHERE ebay_order_id = ? AND ebay_line_item_id = ?
        `).bind(order.orderId, lineItem.lineItemId).first()

        if (existing) continue

        // 注文を作成
        const buyerInfo = order.buyer || {}
        const shippingAddress = order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo || {}
        const fullAddress = [
          shippingAddress.contactAddress?.addressLine1,
          shippingAddress.contactAddress?.addressLine2,
          shippingAddress.contactAddress?.city,
          shippingAddress.contactAddress?.stateOrProvince,
          shippingAddress.contactAddress?.postalCode,
          shippingAddress.contactAddress?.countryCode
        ].filter(Boolean).join(', ')

        const priceUsd = parseFloat(lineItem.total?.value || '0')
        const priceCurrency = lineItem.total?.currency || 'USD'

        await DB.prepare(`
          INSERT INTO cross_border_orders (
            listing_id, product_id, platform, status,
            buyer_name, buyer_country, buyer_address, buyer_email, buyer_phone,
            sale_price_usd, external_order_id,
            ebay_order_id, ebay_line_item_id,
            ordered_at
          ) VALUES (?, ?, 'ebay', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          listing.id, listing.product_id,
          shippingAddress.fullName || buyerInfo.username || '',
          shippingAddress.contactAddress?.countryCode || '',
          fullAddress,
          buyerInfo.email || '',
          shippingAddress.primaryPhone?.phoneNumber || '',
          priceUsd,
          order.orderId,
          order.orderId, lineItem.lineItemId,
          order.creationDate || new Date().toISOString()
        ).run()

        // listing ステータス更新
        await DB.prepare(`
          UPDATE cross_border_listings SET status = 'sold', sold_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'listed'
        `).bind(listing.id).run()

        synced++
      }
    }

    return c.json({
      success: true,
      ebay_orders: orders.length,
      synced_to_db: synced,
      total: data.total || 0
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

/**
 * POST /fulfillment/:orderId
 * 追跡番号をeBayに送信（発送完了通知）
 */
ebaySell.post('/fulfillment/:orderId', async (c) => {
  const { DB } = c.env as any
  const orderId = c.req.param('orderId')

  try {
    const { tracking_number, shipping_carrier } = await c.req.json()
    if (!tracking_number) return c.json({ success: false, error: '追跡番号は必須です' }, 400)

    // DB注文情報取得
    const order = await DB.prepare(`
      SELECT * FROM cross_border_orders WHERE id = ?
    `).bind(orderId).first() as any

    if (!order?.ebay_order_id) return c.json({ success: false, error: '注文データが見つかりません' }, 404)

    const token = await getUserToken(c.env)
    const apiBase = getApiBase(c.env)

    // eBay に発送情報を送信
    const fulfillmentPayload = {
      lineItems: [{
        lineItemId: order.ebay_line_item_id,
        quantity: 1
      }],
      shippedDate: new Date().toISOString(),
      shippingCarrierCode: shipping_carrier || 'JP_POST',  // Japan Post
      trackingNumber: tracking_number
    }

    const res = await fetch(`${apiBase}/sell/fulfillment/v1/order/${order.ebay_order_id}/shipping_fulfillment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fulfillmentPayload)
    })

    if (!res.ok) {
      const errText = await res.text()
      return c.json({ success: false, error: `Fulfillment API error: ${res.status}`, details: errText }, 400)
    }

    // 成功時のレスポンスからfulfillment IDを取得
    let fulfillmentId = ''
    const location = res.headers.get('Location')
    if (location) {
      fulfillmentId = location.split('/').pop() || ''
    }

    // DB更新
    await DB.prepare(`
      UPDATE cross_border_orders SET
        status = 'shipped', tracking_number = ?, shipping_method = ?,
        ebay_fulfillment_id = ?, shipped_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(tracking_number, shipping_carrier || 'JP_POST', fulfillmentId, orderId).run()

    return c.json({ success: true, fulfillment_id: fulfillmentId, message: '発送情報をeBayに送信しました' })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// =============================================
// 7. ワンクリック出品フロー（候補→翻訳→登録→出品を一括）
// =============================================

/**
 * POST /quick-list
 * 商品を一括でeBayに出品（Inventory登録 → Offer作成 → 公開）
 * ※ Cloudflare Workers では内部サブリクエスト (ebaySell.request()) が動作しないため、
 *    全ロジックをインラインで実行する
 */
ebaySell.post('/quick-list', async (c) => {
  const { DB } = c.env as any
  const steps: any[] = []

  try {
    const body = await c.req.json()
    const { listing_id, price_usd, category_id, fulfillment_policy_id, payment_policy_id, return_policy_id } = body

    if (!listing_id) return c.json({ success: false, error: 'listing_id は必須です' }, 400)

    // 出品データ取得（product情報含む）
    const listing = await DB.prepare(`
      SELECT cb.*, p.title, p.description, p.condition, p.price, p.part_number, p.vm_maker, p.vm_model,
        (SELECT GROUP_CONCAT(image_url) FROM product_images WHERE product_id = p.id ORDER BY display_order ASC) as images
      FROM cross_border_listings cb
      LEFT JOIN products p ON cb.product_id = p.id
      WHERE cb.id = ?
    `).bind(listing_id).first() as any

    if (!listing) return c.json({ success: false, error: '出品データが見つかりません' }, 404)
    if (!listing.title_en) return c.json({ success: false, error: '英語タイトルが未設定です。先にAI翻訳を実行してください。' }, 400)

    // 価格更新
    if (price_usd) {
      await DB.prepare(`
        UPDATE cross_border_listings SET price_usd = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(price_usd, listing_id).run()
      listing.price_usd = price_usd
    }

    if (!listing.price_usd || listing.price_usd <= 0) {
      return c.json({ success: false, error: 'USD価格が未設定です' }, 400)
    }

    // ── Step 0: eBay Token 取得 ──
    let ebayToken: string
    try {
      ebayToken = await getUserToken(c.env)
      steps.push({ step: 'token', success: true, message: 'eBayトークン取得成功' })
    } catch (tokenErr: any) {
      steps.push({ step: 'token', success: false, error: tokenErr.message })
      return c.json({
        success: false,
        error: 'eBayトークンの取得に失敗しました: ' + tokenErr.message,
        steps,
        hint: 'eBay連携の再認証が必要な場合があります。管理画面のeBay連携セクションから再度認証してください。'
      }, 400)
    }

    const apiBase = getApiBase(c.env)

    // ── Step 1: Inventory 登録（インライン実行） ──
    let sku: string
    try {
      sku = listing.ebay_sku || `PH-${listing.product_id}-${Date.now()}`

      // デフォルトロケーション取得
      const location = await DB.prepare(`
        SELECT merchant_location_key FROM ebay_inventory_locations WHERE is_default = 1 LIMIT 1
      `).first() as any

      // 商品画像URL一覧
      const imageUrls = (listing.images || '')
        .split(',')
        .filter((u: string) => u.trim())
        .map((u: string) => {
          if (u.startsWith('http')) return u
          const publicUrl = c.env.R2_PUBLIC_URL || 'https://images.parts-hub-tci.com'
          return `${publicUrl}/${u}`
        })
        .slice(0, 12)

      // conditionマッピング
      const conditionMap: Record<string, string> = {
        'new': 'NEW',
        'like_new': 'LIKE_NEW',
        'good': 'USED_GOOD',
        'acceptable': 'USED_ACCEPTABLE'
      }
      const ebayCondition = listing.ebay_condition || conditionMap[listing.condition] || 'USED_GOOD'

      // Inventory Item Payload
      const inventoryPayload: any = {
        availability: {
          shipToLocationAvailability: { quantity: 1 }
        },
        condition: ebayCondition,
        product: {
          title: (listing.title_en || listing.title || 'Auto Part').substring(0, 80),
          description: listing.description_en || listing.description || '',
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          aspects: {
            'Brand': [listing.vm_maker || 'Unbranded'],
            'Country/Region of Manufacture': ['Japan'],
            'Type': ['OEM']
          }
        }
      }

      if (listing.part_number) {
        inventoryPayload.product.mpn = listing.part_number
        inventoryPayload.product.brand = listing.vm_maker || 'Unbranded'
      }

      if (listing.weight_kg) {
        inventoryPayload.packageWeightAndSize = {
          weight: { value: listing.weight_kg, unit: 'KILOGRAM' }
        }
        if (listing.length_cm && listing.width_cm && listing.height_cm) {
          inventoryPayload.packageWeightAndSize.dimensions = {
            length: listing.length_cm, width: listing.width_cm,
            height: listing.height_cm, unit: 'CENTIMETER'
          }
          inventoryPayload.packageWeightAndSize.packageType = 'PACKAGE_THICK_ENVELOPE'
        }
      }

      if (location?.merchant_location_key) {
        inventoryPayload.availability.shipToLocationAvailability.availabilityDistributions = [{
          merchantLocationKey: location.merchant_location_key, quantity: 1
        }]
      }

      // eBay Inventory API 呼び出し
      const invRes = await fetch(`${apiBase}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ebayToken}`,
          'Content-Type': 'application/json',
          'Content-Language': 'en-US'
        },
        body: JSON.stringify(inventoryPayload)
      })

      if (!invRes.ok && invRes.status !== 204) {
        const errText = await invRes.text()
        console.error('[quick-list] Inventory API error:', invRes.status, errText)
        await DB.prepare(`
          UPDATE cross_border_listings SET ebay_last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(`Inventory API error ${invRes.status}: ${errText.substring(0, 500)}`, listing_id).run()
        steps.push({ step: 'inventory', success: false, error: `eBay Inventory API error: ${invRes.status}`, details: errText.substring(0, 300) })
        return c.json({ success: false, error: `Inventory登録に失敗 (HTTP ${invRes.status})`, steps }, 400)
      }

      // Inventory 成功 → DB更新
      await DB.prepare(`
        UPDATE cross_border_listings SET
          ebay_sku = ?, ebay_condition = ?, ebay_last_error = NULL,
          status = CASE WHEN status = 'draft' THEN 'ready' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(sku, ebayCondition, listing_id).run()

      steps.push({ step: 'inventory', success: true, sku, message: 'eBay Inventory に商品を登録しました' })
    } catch (invErr: any) {
      console.error('[quick-list] Inventory exception:', invErr)
      steps.push({ step: 'inventory', success: false, error: invErr.message })
      return c.json({ success: false, error: 'Inventory登録でエラー: ' + invErr.message, steps }, 500)
    }

    // ── Step 2: Offer 作成 + 公開（インライン実行） ──
    try {
      // listing 最新情報を再取得（SKU等が更新されているため）
      const freshListing = await DB.prepare(`
        SELECT * FROM cross_border_listings WHERE id = ?
      `).bind(listing_id).first() as any

      const marketplace = freshListing.ebay_marketplace_id || 'EBAY_US'

      // Offer Payload
      const offerPayload: any = {
        sku: sku,
        marketplaceId: marketplace,
        format: 'FIXED_PRICE',
        listingDescription: freshListing.description_en || listing.description_en || '',
        pricingSummary: {
          price: {
            value: String(freshListing.price_usd || listing.price_usd || '0'),
            currency: 'USD'
          }
        },
        quantityLimitPerBuyer: 1,
        includeCatalogProductDetails: true
      }

      // カテゴリID
      const catId = category_id || freshListing.ebay_category_id
      if (catId) offerPayload.categoryId = catId

      // ビジネスポリシー
      const fpId = fulfillment_policy_id || freshListing.ebay_fulfillment_policy_id
      const ppId = payment_policy_id || freshListing.ebay_payment_policy_id
      const rpId = return_policy_id || freshListing.ebay_return_policy_id
      if (fpId) {
        offerPayload.listingPolicies = {
          fulfillmentPolicyId: fpId,
          paymentPolicyId: ppId,
          returnPolicyId: rpId
        }
      }

      // Offer 作成
      const createRes = await fetch(`${apiBase}/sell/inventory/v1/offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ebayToken}`,
          'Content-Type': 'application/json',
          'Content-Language': 'en-US'
        },
        body: JSON.stringify(offerPayload)
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        console.error('[quick-list] Offer API error:', createRes.status, errText)
        await DB.prepare(`
          UPDATE cross_border_listings SET ebay_last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(`Offer API error ${createRes.status}: ${errText.substring(0, 500)}`, listing_id).run()
        steps.push({ step: 'offer', success: false, error: `eBay Offer API error: ${createRes.status}`, details: errText.substring(0, 300) })
        return c.json({ success: false, error: `Offer作成に失敗 (HTTP ${createRes.status})`, steps }, 400)
      }

      const offerData = await createRes.json() as any
      const offerId = offerData.offerId

      // Offer DB更新
      await DB.prepare(`
        UPDATE cross_border_listings SET
          ebay_offer_id = ?,
          ebay_category_id = COALESCE(?, ebay_category_id),
          ebay_fulfillment_policy_id = COALESCE(?, ebay_fulfillment_policy_id),
          ebay_payment_policy_id = COALESCE(?, ebay_payment_policy_id),
          ebay_return_policy_id = COALESCE(?, ebay_return_policy_id),
          ebay_last_error = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(offerId, catId || null, fpId || null, ppId || null, rpId || null, listing_id).run()

      steps.push({ step: 'offer', success: true, offer_id: offerId, message: 'eBay Offer を作成しました' })

      // ── Step 3: Publish（公開） ──
      const publishRes = await fetch(`${apiBase}/sell/inventory/v1/offer/${offerId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ebayToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!publishRes.ok) {
        const errText = await publishRes.text()
        console.error('[quick-list] Publish error:', publishRes.status, errText)
        await DB.prepare(`
          UPDATE cross_border_listings SET ebay_last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(`Publish error ${publishRes.status}: ${errText.substring(0, 500)}`, listing_id).run()
        steps.push({ step: 'publish', success: false, error: `Publish error: ${publishRes.status}`, details: errText.substring(0, 300) })
        return c.json({
          success: true,
          steps,
          ebay_url: null,
          message: 'Offer作成まで完了しましたが、公開に失敗しました。eBayのビジネスポリシー設定を確認してください。エラー: ' + errText.substring(0, 200)
        })
      }

      const publishData = await publishRes.json() as any
      const ebayListingId = publishData.listingId

      // Publish 成功 → DB更新
      await DB.prepare(`
        UPDATE cross_border_listings SET
          ebay_listing_id = ?, status = 'listed', listed_at = CURRENT_TIMESTAMP,
          external_listing_id = ?, external_url = ?,
          ebay_last_error = NULL, ebay_synced_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        ebayListingId, ebayListingId,
        `https://www.ebay.com/itm/${ebayListingId}`,
        listing_id
      ).run()

      steps.push({ step: 'publish', success: true, listing_id: ebayListingId, ebay_url: `https://www.ebay.com/itm/${ebayListingId}` })

      return c.json({
        success: true,
        steps,
        ebay_url: `https://www.ebay.com/itm/${ebayListingId}`,
        message: 'eBayへの出品が完了しました！'
      })
    } catch (offerErr: any) {
      console.error('[quick-list] Offer/Publish exception:', offerErr)
      steps.push({ step: 'offer', success: false, error: offerErr.message })
      return c.json({ success: false, error: 'Offer作成/公開でエラー: ' + offerErr.message, steps }, 500)
    }
  } catch (err: any) {
    console.error('[quick-list] Unhandled error:', err)
    return c.json({
      success: false,
      error: 'eBay出品処理で予期しないエラーが発生しました: ' + (err.message || String(err)),
      steps,
      hint: '管理画面のeBay連携ステータスを確認してください'
    }, 500)
  }
})

// =============================================
// 8. 発送キャリアコード一覧
// =============================================
ebaySell.get('/shipping-carriers', (c) => {
  return c.json({
    success: true,
    carriers: [
      { code: 'JP_POST', name: '日本郵便 (Japan Post / EMS)', recommended: true },
      { code: 'DHL', name: 'DHL Express' },
      { code: 'FEDEX', name: 'FedEx' },
      { code: 'UPS', name: 'UPS' },
      { code: 'YAMATO', name: 'ヤマト運輸' },
      { code: 'SAGAWA', name: '佐川急便' },
      { code: 'OTHER', name: 'その他' }
    ]
  })
})

export default ebaySell
