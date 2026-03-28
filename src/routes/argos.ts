/**
 * ARGOS JPC API 本番連携ルート
 * 
 * 公開予定: 2026年6月以降
 * 
 * フィーチャーフラグ: env.ARGOS_API_ENABLED === 'true' の場合のみ有効
 * 
 * 本番連携手順:
 *   1. wrangler secret put ARGOS_API_KEY   → レベルブリッジから発行されたBearer Token
 *   2. wrangler secret put ARGOS_API_URL   → ARGOS JPC APIベースURL
 *   3. .dev.vars に ARGOS_API_ENABLED=true  → ローカル開発時
 *   4. Cloudflare Dashboard → 環境変数 → ARGOS_API_ENABLED=true → 本番公開
 * 
 * アーキテクチャ:
 *   フロントエンド → /api/argos/* → (D1キャッシュチェック) → ARGOS JPC外部API
 *                                  ↳ キャッシュヒット → 即座に応答（~5ms）
 *                                  ↳ キャッシュミス → 外部APIコール → D1に保存 → 応答
 */

import { Hono } from 'hono'
import type { Bindings } from '../types'

const argos = new Hono<{ Bindings: Bindings }>()

// ============================================================
// ミドルウェア: フィーチャーフラグチェック
// ============================================================
argos.use('*', async (c, next) => {
  if (c.env.ARGOS_API_ENABLED !== 'true') {
    return c.json({
      success: false,
      error: 'ARGOS JPC連携は現在準備中です',
      status: 'coming_soon',
      planned_release: '2026年6月以降'
    }, 503)
  }
  await next()
})

// ============================================================
// ヘルパー関数
// ============================================================

/** ARGOS JPC APIを呼び出す共通関数 */
async function callArgosApi(
  env: Bindings,
  endpoint: string,
  params?: Record<string, string>
): Promise<{ ok: boolean; data?: any; error?: string; status?: number; elapsed?: number }> {
  const baseUrl = env.ARGOS_API_URL
  const apiKey = env.ARGOS_API_KEY

  if (!baseUrl || !apiKey) {
    return { ok: false, error: 'ARGOS API設定が不完全です（URL/KEYが未設定）', status: 500 }
  }

  const url = new URL(endpoint, baseUrl)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const t0 = Date.now()
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })
    const elapsed = Date.now() - t0

    if (!res.ok) {
      return { ok: false, error: `ARGOS API error: ${res.status}`, status: res.status, elapsed }
    }

    const data = await res.json()
    return { ok: true, data, elapsed }
  } catch (e: any) {
    const elapsed = Date.now() - t0
    return { ok: false, error: `ARGOS API通信エラー: ${e.message}`, status: 502, elapsed }
  }
}

/** APIログをD1に記録（非同期・エラーは握りつぶす） */
async function logApiCall(
  db: D1Database,
  endpoint: string,
  vin: string | null,
  params: string | null,
  status: number,
  elapsed: number,
  cacheHit: boolean,
  userId: number | null
) {
  try {
    await db.prepare(`
      INSERT INTO argos_api_log (api_endpoint, request_vin, request_params, response_status, response_time_ms, cache_hit, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(endpoint, vin, params, status, elapsed, cacheHit ? 1 : 0, userId).run()
  } catch (_) {
    // ログ失敗は無視（メインフローを止めない）
  }
}

/** D1キャッシュからVIN検索結果を取得 */
async function getVinCache(db: D1Database, vin: string): Promise<any | null> {
  try {
    const row = await db.prepare(`
      SELECT * FROM argos_vin_cache
      WHERE vin = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(vin).first()

    if (row) {
      // ヒットカウント更新
      await db.prepare('UPDATE argos_vin_cache SET hit_count = hit_count + 1 WHERE vin = ?').bind(vin).run()
      return row
    }
    return null
  } catch (_) {
    return null
  }
}

/** D1キャッシュにVIN検索結果を保存 */
async function setVinCache(db: D1Database, vin: string, data: any) {
  try {
    await db.prepare(`
      INSERT OR REPLACE INTO argos_vin_cache
        (vin, brand, brand_ja, model, model_ja, type_code, generation, year, month,
         engine, displacement, transmission, drive, grade, color, body_type, fuel,
         full_model_code, katashiki, type_class, ruibetsu, raw_response, fetched_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+30 days'))
    `).bind(
      vin, data.brand, data.brand_ja, data.model, data.model_ja, data.type, data.generation,
      data.year, data.month, data.engine, data.displacement, data.transmission, data.drive,
      data.grade, data.color, data.body_type, data.fuel, data.full_model_code, data.katashiki,
      data.type_class, data.ruibetsu, JSON.stringify(data)
    ).run()
  } catch (_) {
    // キャッシュ保存失敗は無視
  }
}

/** D1キャッシュから部品データを取得 */
async function getPartsCache(db: D1Database, vin: string, groupId: string, subgroupId: string | null): Promise<any | null> {
  try {
    const row = await db.prepare(`
      SELECT parts_json, illustration_url FROM argos_parts_cache
      WHERE vin = ? AND group_id = ? AND (subgroup_id = ? OR (subgroup_id IS NULL AND ? IS NULL))
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(vin, groupId, subgroupId, subgroupId).first()
    return row ? { parts: JSON.parse(row.parts_json as string), illustration_url: row.illustration_url } : null
  } catch (_) {
    return null
  }
}

/** D1キャッシュに部品データを保存 */
async function setPartsCache(db: D1Database, vin: string, groupId: string, subgroupId: string | null, parts: any[], illustrationUrl: string | null) {
  try {
    await db.prepare(`
      INSERT OR REPLACE INTO argos_parts_cache
        (vin, group_id, subgroup_id, parts_json, illustration_url, fetched_at, expires_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now', '+30 days'))
    `).bind(vin, groupId, subgroupId, JSON.stringify(parts), illustrationUrl).run()
  } catch (_) {}
}

// ============================================================
// APIエンドポイント
// ============================================================

// 機能ステータス確認
argos.get('/status', async (c) => {
  return c.json({
    success: true,
    enabled: true,
    version: '1.0.0',
    planned_release: '2026年6月以降',
    api_provider: 'ARGOS JPC (Level Bridge Inc.)',
    supported_makers: {
      with_illustration: ['トヨタ', '三菱', '日産', 'ホンダ', 'ダイハツ'],
      data_only: ['マツダ', 'スバル', 'スズキ']
    },
    cache_ttl_days: 30
  })
})

// #13相当: VINから車両情報を取得（D1キャッシュ付き）
argos.get('/vin/:vin', async (c) => {
  const vin = c.req.param('vin').toUpperCase().replace(/[\s]/g, '')
  if (!vin || vin.length < 5) {
    return c.json({ success: false, error: '有効な車台番号を入力してください' }, 400)
  }

  const db = c.env.DB
  const t0 = Date.now()

  // 1. D1キャッシュチェック
  const cached = await getVinCache(db, vin)
  if (cached) {
    const elapsed = Date.now() - t0
    await logApiCall(db, '#13 VIN Search', vin, null, 200, elapsed, true, null)
    
    // キャッシュから復元
    const data = cached.raw_response ? JSON.parse(cached.raw_response as string) : {
      brand: cached.brand, brand_ja: cached.brand_ja,
      model: cached.model, model_ja: cached.model_ja,
      type: cached.type_code, generation: cached.generation,
      year: cached.year, month: cached.month,
      engine: cached.engine, displacement: cached.displacement,
      transmission: cached.transmission, drive: cached.drive,
      grade: cached.grade, color: cached.color,
      body_type: cached.body_type, fuel: cached.fuel,
      full_model_code: cached.full_model_code, katashiki: cached.katashiki,
      type_class: cached.type_class, ruibetsu: cached.ruibetsu,
      vin: vin
    }

    return c.json({
      success: true,
      data,
      cache: true,
      cache_hit_count: (cached.hit_count as number) + 1,
      response_ms: elapsed
    })
  }

  // 2. ARGOS JPC API呼出
  // 本番連携時: エンドポイントはARGOS JPC仕様に合わせて調整
  const result = await callArgosApi(c.env, '/api/v1/car/vin', { vin })

  const elapsed = Date.now() - t0
  await logApiCall(db, '#13 VIN Search', vin, null, result.ok ? 200 : (result.status || 500), elapsed, false, null)

  if (!result.ok) {
    return c.json({ success: false, error: result.error }, result.status || 500)
  }

  // 3. レスポンスを正規化してキャッシュ保存
  // TODO: ARGOS JPC APIのレスポンス構造に合わせてマッピング調整
  const vehicleData = result.data
  await setVinCache(db, vin, vehicleData)

  return c.json({
    success: true,
    data: vehicleData,
    cache: false,
    response_ms: elapsed
  })
})

// #6相当: メイングループ一覧
argos.get('/groups', async (c) => {
  const result = await callArgosApi(c.env, '/api/v1/group/main')

  if (!result.ok) {
    return c.json({ success: false, error: result.error }, result.status || 500)
  }

  return c.json({
    success: true,
    data: result.data,
    response_ms: result.elapsed
  })
})

// #7/#14相当: サブグループ一覧（VIN対応）
argos.get('/groups/:groupId/subgroups', async (c) => {
  const groupId = c.req.param('groupId')
  const vin = c.req.query('vin')

  // VINがある場合は#14（VIN別サブグループ）、なければ#7（汎用サブグループ）
  const endpoint = vin
    ? '/api/v1/subgroup/vin'
    : '/api/v1/subgroup/list'

  const params: Record<string, string> = { group_id: groupId }
  if (vin) params.vin = vin

  const result = await callArgosApi(c.env, endpoint, params)

  if (!result.ok) {
    return c.json({ success: false, error: result.error }, result.status || 500)
  }

  return c.json({
    success: true,
    data: result.data,
    response_ms: result.elapsed
  })
})

// #8/#15相当: 部品一覧（D1キャッシュ付き）
argos.get('/subgroups/:subgroupId/parts', async (c) => {
  const subgroupId = c.req.param('subgroupId')
  const vin = c.req.query('vin') || ''
  const groupId = c.req.query('group_id') || ''
  const db = c.env.DB
  const t0 = Date.now()

  // 1. D1キャッシュチェック
  if (vin) {
    const cached = await getPartsCache(db, vin, groupId, subgroupId)
    if (cached) {
      const elapsed = Date.now() - t0
      await logApiCall(db, '#15 Parts by VIN', vin, subgroupId, 200, elapsed, true, null)
      return c.json({
        success: true,
        data: cached.parts,
        illustration_url: cached.illustration_url,
        cache: true,
        response_ms: elapsed
      })
    }
  }

  // 2. ARGOS JPC API呼出
  const endpoint = vin ? '/api/v1/part/vin' : '/api/v1/part/list'
  const params: Record<string, string> = { subgroup_id: subgroupId }
  if (vin) params.vin = vin

  const result = await callArgosApi(c.env, endpoint, params)
  const elapsed = Date.now() - t0
  await logApiCall(db, vin ? '#15 Parts by VIN' : '#8 Parts List', vin, subgroupId, result.ok ? 200 : (result.status || 500), elapsed, false, null)

  if (!result.ok) {
    return c.json({ success: false, error: result.error }, result.status || 500)
  }

  // 3. キャッシュ保存
  if (vin) {
    await setPartsCache(db, vin, groupId, subgroupId, result.data?.parts || result.data, result.data?.illustration_url || null)
  }

  return c.json({
    success: true,
    data: result.data?.parts || result.data,
    illustration_url: result.data?.illustration_url || null,
    cache: false,
    response_ms: elapsed
  })
})

// OEM品番でPARTS HUB内の出品商品を検索
argos.get('/search-listings', async (c) => {
  const partNumbers = c.req.query('pn')?.split(',').filter(Boolean) || []
  if (partNumbers.length === 0) {
    return c.json({ success: false, error: '品番を指定してください' }, 400)
  }

  const db = c.env.DB

  // D1内の products + product_oem_parts テーブルを検索
  // part_number フィールドまたは product_oem_parts の oem_part_number / compatible_part_numbers と照合
  const placeholders = partNumbers.map(() => '?').join(',')

  try {
    const { results } = await db.prepare(`
      SELECT DISTINCT p.id, p.title, p.price, p.condition, p.status, p.part_number, p.created_at,
             u.shop_name as seller_name,
             (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN product_oem_parts pop ON pop.product_id = p.id
      WHERE p.status = 'active'
        AND (
          p.part_number IN (${placeholders})
          OR pop.oem_part_number IN (${placeholders})
          OR EXISTS (
            SELECT 1 FROM product_oem_parts pop2
            WHERE pop2.product_id = p.id
              AND pop2.compatible_part_numbers LIKE '%' || ? || '%'
          )
        )
      ORDER BY p.created_at DESC
      LIMIT 20
    `).bind(
      ...partNumbers,
      ...partNumbers,
      partNumbers[0] || ''
    ).all()

    return c.json({
      success: true,
      data: results || [],
      total: (results || []).length,
      searched_part_numbers: partNumbers
    })
  } catch (e: any) {
    return c.json({ success: false, error: '検索に失敗しました: ' + e.message }, 500)
  }
})

// 出品商品にOEM品番を紐付け
argos.post('/link-parts', async (c) => {
  const body = await c.req.json()
  const { product_id, parts, vin } = body

  if (!product_id || !parts || !Array.isArray(parts)) {
    return c.json({ success: false, error: 'product_id と parts[] が必要です' }, 400)
  }

  const db = c.env.DB

  try {
    for (const part of parts) {
      await db.prepare(`
        INSERT OR REPLACE INTO product_oem_parts
          (product_id, oem_part_number, part_name, reference_price, compatible_part_numbers, vin_used, group_name, subgroup_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        product_id,
        part.part_number,
        part.name || null,
        part.price || null,
        (part.compatible || []).join(','),
        vin || null,
        part.group_name || null,
        part.subgroup_name || null
      ).run()
    }

    return c.json({ success: true, linked: parts.length })
  } catch (e: any) {
    return c.json({ success: false, error: '紐付けに失敗しました: ' + e.message }, 500)
  }
})

// キャッシュ統計（管理者向け）
argos.get('/cache-stats', async (c) => {
  const db = c.env.DB

  try {
    const vinCacheCount = await db.prepare('SELECT COUNT(*) as count FROM argos_vin_cache').first()
    const partsCacheCount = await db.prepare('SELECT COUNT(*) as count FROM argos_parts_cache').first()
    const totalApiCalls = await db.prepare('SELECT COUNT(*) as count FROM argos_api_log').first()
    const cacheHits = await db.prepare('SELECT COUNT(*) as count FROM argos_api_log WHERE cache_hit = 1').first()
    const recentCalls = await db.prepare(`
      SELECT api_endpoint, COUNT(*) as count, AVG(response_time_ms) as avg_ms, SUM(cache_hit) as cache_hits
      FROM argos_api_log
      WHERE created_at > datetime('now', '-7 days')
      GROUP BY api_endpoint
    `).all()

    const total = (totalApiCalls?.count as number) || 0
    const hits = (cacheHits?.count as number) || 0

    return c.json({
      success: true,
      stats: {
        vin_cache_entries: (vinCacheCount?.count as number) || 0,
        parts_cache_entries: (partsCacheCount?.count as number) || 0,
        total_api_calls: total,
        cache_hit_count: hits,
        cache_hit_rate: total > 0 ? Math.round((hits / total) * 100) + '%' : 'N/A',
        recent_7days: recentCalls?.results || []
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default argos
