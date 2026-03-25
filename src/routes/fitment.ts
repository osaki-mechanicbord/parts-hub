import { Hono } from 'hono'
import type { Bindings } from '../types'

const fitment = new Hono<{ Bindings: Bindings }>()

// ユーザー車両一覧取得
fitment.get('/vehicles', async (c) => {
  try {
    // TODO: 認証実装後、ログインユーザーIDを取得
    const userId = c.req.query('user_id') || '1' // テスト用

    const { results } = await c.env.DB.prepare(`
      SELECT 
        v.id, v.nickname, v.year, v.model_code, v.grade,
        v.engine_type, v.drive_type, v.transmission_type,
        v.is_primary, v.created_at,
        m.name as maker_name,
        mo.name as model_name
      FROM user_vehicles v
      LEFT JOIN car_makers m ON v.maker_id = m.id
      LEFT JOIN car_models mo ON v.model_id = mo.id
      WHERE v.user_id = ? AND v.is_active = 1
      ORDER BY v.is_primary DESC, v.created_at DESC
    `).bind(userId).all()

    return c.json({ success: true, vehicles: results })
  } catch (error) {
    console.error('Vehicles fetch error:', error)
    return c.json({ success: false, error: '車両情報の取得に失敗しました' }, 500)
  }
})

// ユーザー車両詳細取得
fitment.get('/vehicles/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const vehicle = await c.env.DB.prepare(`
      SELECT 
        v.*,
        m.name as maker_name,
        mo.name as model_name
      FROM user_vehicles v
      LEFT JOIN car_makers m ON v.maker_id = m.id
      LEFT JOIN car_models mo ON v.model_id = mo.id
      WHERE v.id = ?
    `).bind(id).first()

    if (!vehicle) {
      return c.json({ success: false, error: '車両が見つかりません' }, 404)
    }

    return c.json({ success: true, vehicle })
  } catch (error) {
    console.error('Vehicle detail fetch error:', error)
    return c.json({ success: false, error: '車両詳細の取得に失敗しました' }, 500)
  }
})

// ユーザー車両登録
fitment.post('/vehicles', async (c) => {
  try {
    // TODO: 認証実装後、ログインユーザーIDを取得
    const userId = c.req.query('user_id') || '1' // テスト用
    
    const body = await c.req.json()
    const {
      nickname, maker_id, model_id, year,
      model_code, grade, engine_type, drive_type,
      transmission_type, body_type, is_primary
    } = body

    // 必須項目チェック
    if (!nickname || !maker_id || !model_id || !year) {
      return c.json({ 
        success: false, 
        error: 'ニックネーム、メーカー、車種、年式は必須です' 
      }, 400)
    }

    // プライマリ設定の場合、既存のプライマリを解除
    if (is_primary) {
      await c.env.DB.prepare(`
        UPDATE user_vehicles SET is_primary = 0 WHERE user_id = ?
      `).bind(userId).run()
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO user_vehicles (
        user_id, nickname, maker_id, model_id, year,
        model_code, grade, engine_type, drive_type,
        transmission_type, body_type, is_primary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, nickname, maker_id, model_id, year,
      model_code, grade, engine_type, drive_type,
      transmission_type, body_type, is_primary ? 1 : 0
    ).run()

    return c.json({ 
      success: true, 
      vehicle_id: result.meta.last_row_id,
      message: '車両を登録しました' 
    })
  } catch (error) {
    console.error('Vehicle registration error:', error)
    return c.json({ success: false, error: '車両登録に失敗しました' }, 500)
  }
})

// 商品の適合情報取得
fitment.get('/products/:id/compatibility', async (c) => {
  try {
    const productId = c.req.param('id')

    // 適合情報取得
    const { results: compatibility } = await c.env.DB.prepare(`
      SELECT 
        pc.*,
        m.name as maker_name,
        mo.name as model_name
      FROM product_compatibility pc
      LEFT JOIN car_makers m ON pc.maker_id = m.id
      LEFT JOIN car_models mo ON pc.model_id = mo.id
      WHERE pc.product_id = ?
      ORDER BY pc.confidence_level DESC
    `).bind(productId).all()

    // 汎用部品情報取得
    const universal = await c.env.DB.prepare(`
      SELECT * FROM universal_parts WHERE product_id = ?
    `).bind(productId).first()

    // 適合確認フィードバック取得
    const { results: confirmations } = await c.env.DB.prepare(`
      SELECT 
        fc.fits, fc.fit_quality, fc.notes, fc.helpful_count,
        fc.created_at,
        COALESCE(u.company_name, u.nickname, u.name) as user_name,
        v.nickname as vehicle_nickname,
        m.name as maker_name,
        mo.name as model_name,
        v.year, v.model_code
      FROM fitment_confirmations fc
      LEFT JOIN users u ON fc.user_id = u.id
      LEFT JOIN user_vehicles v ON fc.user_vehicle_id = v.id
      LEFT JOIN car_makers m ON v.maker_id = m.id
      LEFT JOIN car_models mo ON v.model_id = mo.id
      WHERE fc.product_id = ? AND fc.fits = 1
      ORDER BY fc.helpful_count DESC, fc.created_at DESC
      LIMIT 10
    `).bind(productId).all()

    return c.json({
      success: true,
      compatibility,
      universal,
      confirmations,
      total_confirmations: confirmations.length
    })
  } catch (error) {
    console.error('Compatibility fetch error:', error)
    return c.json({ success: false, error: '適合情報の取得に失敗しました' }, 500)
  }
})

// 適合マッチング検索
fitment.post('/match', async (c) => {
  try {
    const body = await c.req.json()
    let { vehicle_id, maker_id, model_id, year, model_code } = body

    let conditions = ['p.status = ?']
    let params: any[] = ['active']
    let matchType = 'all'

    // 車両IDが指定されている場合
    if (vehicle_id) {
      const vehicle = await c.env.DB.prepare(`
        SELECT * FROM user_vehicles WHERE id = ?
      `).bind(vehicle_id).first() as any

      if (vehicle) {
        maker_id = vehicle.maker_id
        model_id = vehicle.model_id
        year = vehicle.year
        model_code = vehicle.model_code
      }
    }

    // 適合情報とのマッチングクエリ
    if (maker_id && model_id) {
      matchType = 'compatible'
      
      const compatibleQuery = `
        SELECT DISTINCT
          p.id, p.title, p.price, p.condition, p.view_count,
          p.created_at,
          pc.confidence_level,
          pc.fitment_notes,
          pc.model_code as compatible_model_code,
          pc.year_from, pc.year_to,
          m.name as maker_name,
          mo.name as model_name,
          COALESCE(u.company_name, u.nickname, u.name) as seller_name,
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as main_image,
          (SELECT COUNT(*) FROM fitment_confirmations WHERE product_id = p.id AND fits = 1) as fit_count
        FROM products p
        LEFT JOIN product_compatibility pc ON p.id = pc.product_id
        LEFT JOIN car_makers m ON p.maker_id = m.id
        LEFT JOIN car_models mo ON p.model_id = mo.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = 'active'
          AND pc.maker_id = ?
          AND pc.model_id = ?
          ${year ? 'AND pc.year_from <= ? AND pc.year_to >= ?' : ''}
          ${model_code ? "AND (pc.model_code LIKE ? OR pc.model_code IS NULL)" : ''}
        ORDER BY pc.confidence_level DESC, p.created_at DESC
        LIMIT 50
      `

      const queryParams = [maker_id, model_id]
      if (year) {
        queryParams.push(year, year)
      }
      if (model_code) {
        queryParams.push(`%${model_code}%`)
      }

      const { results } = await c.env.DB.prepare(compatibleQuery)
        .bind(...queryParams)
        .all()

      // 適合度の計算
      const productsWithMatch = results.map((product: any) => {
        let confidence = product.confidence_level * 20 // 1-5 → 20-100
        let matchReasons = []

        if (product.compatible_model_code && model_code && 
            product.compatible_model_code.includes(model_code)) {
          confidence = Math.min(confidence + 10, 100)
          matchReasons.push('型式完全一致')
        }

        if (year && product.year_from && product.year_to &&
            year >= product.year_from && year <= product.year_to) {
          matchReasons.push('年式範囲内')
        }

        if (product.fit_count > 0) {
          matchReasons.push(`${product.fit_count}件の適合実績`)
        }

        let match_type = 'low'
        if (confidence >= 90) match_type = 'exact'
        else if (confidence >= 70) match_type = 'high'
        else if (confidence >= 50) match_type = 'medium'

        return {
          ...product,
          confidence,
          match_type,
          match_reasons: matchReasons
        }
      })

      return c.json({
        success: true,
        items: productsWithMatch,
        match_type: matchType,
        total: productsWithMatch.length
      })
    }

    // 適合情報がない場合は通常検索
    return c.json({
      success: true,
      items: [],
      match_type: 'none',
      message: '検索条件を指定してください'
    })

  } catch (error) {
    console.error('Fitment match error:', error)
    return c.json({ success: false, error: '適合検索に失敗しました' }, 500)
  }
})

// 適合確認フィードバック投稿
fitment.post('/confirmations', async (c) => {
  try {
    // TODO: 認証実装後、ログインユーザーIDを取得
    const userId = c.req.query('user_id') || '1' // テスト用
    
    const body = await c.req.json()
    const {
      product_id, user_vehicle_id, fits, fit_quality,
      installation_difficulty, notes
    } = body

    if (!product_id || fits === undefined) {
      return c.json({ 
        success: false, 
        error: '商品IDと適合結果は必須です' 
      }, 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO fitment_confirmations (
        product_id, user_id, user_vehicle_id, fits, fit_quality,
        installation_difficulty, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product_id, userId, user_vehicle_id, fits ? 1 : 0,
      fit_quality, installation_difficulty, notes
    ).run()

    return c.json({ 
      success: true, 
      confirmation_id: result.meta.last_row_id,
      message: '適合確認を投稿しました' 
    })
  } catch (error) {
    console.error('Confirmation post error:', error)
    return c.json({ success: false, error: '適合確認の投稿に失敗しました' }, 500)
  }
})

// 適合確認に「役に立った」をつける
fitment.post('/confirmations/:id/helpful', async (c) => {
  try {
    const id = c.req.param('id')

    await c.env.DB.prepare(`
      UPDATE fitment_confirmations 
      SET helpful_count = helpful_count + 1 
      WHERE id = ?
    `).bind(id).run()

    return c.json({ 
      success: true, 
      message: 'ありがとうございます' 
    })
  } catch (error) {
    console.error('Helpful update error:', error)
    return c.json({ success: false, error: '更新に失敗しました' }, 500)
  }
})

export default fitment
