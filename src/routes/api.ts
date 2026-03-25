import { Hono } from 'hono'
import type { Bindings } from '../types'

const api = new Hono<{ Bindings: Bindings }>()

// ヘルスチェック
api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// カテゴリ一覧
api.get('/categories', async (c) => {
  try {
    // ハードコードされたカテゴリデータ（DBテーブル未作成のため）
    const categories = [
      { id: 1, name: 'エンジンパーツ', slug: 'engine', icon: 'fa-cog', display_order: 1 },
      { id: 2, name: 'ブレーキパーツ', slug: 'brake', icon: 'fa-circle-stop', display_order: 2 },
      { id: 3, name: 'サスペンション', slug: 'suspension', icon: 'fa-spring', display_order: 3 },
      { id: 4, name: '電装パーツ', slug: 'electric', icon: 'fa-bolt', display_order: 4 },
      { id: 5, name: '外装パーツ', slug: 'exterior', icon: 'fa-car', display_order: 5 },
      { id: 6, name: '内装パーツ', slug: 'interior', icon: 'fa-seat', display_order: 6 },
      { id: 7, name: 'ホイール・タイヤ', slug: 'wheel', icon: 'fa-tire', display_order: 7 },
      { id: 8, name: '排気系パーツ', slug: 'exhaust', icon: 'fa-wind', display_order: 8 }
    ]

    return c.json({ success: true, categories })
  } catch (error) {
    console.error('Category fetch error:', error)
    return c.json({ success: false, error: 'カテゴリの取得に失敗しました' }, 500)
  }
})

// カテゴリ詳細とサブカテゴリ
api.get('/categories/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const category = await c.env.DB.prepare(`
      SELECT id, name, slug, icon, display_order
      FROM categories
      WHERE id = ? AND is_active = 1
    `).bind(id).first()

    if (!category) {
      return c.json({ success: false, error: 'カテゴリが見つかりません' }, 404)
    }

    const { results: subcategories } = await c.env.DB.prepare(`
      SELECT id, name, slug, display_order
      FROM subcategories
      WHERE category_id = ? AND is_active = 1
      ORDER BY display_order ASC
    `).bind(id).all()

    return c.json({
      success: true,
      category,
      subcategories
    })
  } catch (error) {
    console.error('Category detail fetch error:', error)
    return c.json({ success: false, error: 'カテゴリ詳細の取得に失敗しました' }, 500)
  }
})

// メーカー一覧
api.get('/makers', async (c) => {
  try {
    // ハードコードされたメーカーデータ（DBテーブル未作成のため）
    const makers = [
      { id: 1, name: 'トヨタ', name_en: 'TOYOTA', display_order: 1 },
      { id: 2, name: 'ホンダ', name_en: 'HONDA', display_order: 2 },
      { id: 3, name: '日産', name_en: 'NISSAN', display_order: 3 },
      { id: 4, name: 'マツダ', name_en: 'MAZDA', display_order: 4 },
      { id: 5, name: 'スバル', name_en: 'SUBARU', display_order: 5 },
      { id: 6, name: 'スズキ', name_en: 'SUZUKI', display_order: 6 },
      { id: 7, name: 'ダイハツ', name_en: 'DAIHATSU', display_order: 7 },
      { id: 8, name: '三菱', name_en: 'MITSUBISHI', display_order: 8 }
    ]

    return c.json({ success: true, makers })
  } catch (error) {
    console.error('Maker fetch error:', error)
    return c.json({ success: false, error: 'メーカーの取得に失敗しました' }, 500)
  }
})

// 車種一覧（メーカーID指定）
api.get('/makers/:id/models', async (c) => {
  try {
    const makerId = c.req.param('id')

    const { results } = await c.env.DB.prepare(`
      SELECT id, name, model_code, year_from, year_to
      FROM car_models
      WHERE maker_id = ? AND is_active = 1
      ORDER BY name ASC
    `).bind(makerId).all()

    return c.json({ success: true, models: results })
  } catch (error) {
    console.error('Model fetch error:', error)
    return c.json({ success: false, error: '車種の取得に失敗しました' }, 500)
  }
})

// 商品一覧（検索・フィルタ対応）
api.get('/products', async (c) => {
  try {
    const query = c.req.query('query') || ''
    const categoryId = c.req.query('category_id')
    const makerId = c.req.query('maker_id')
    const minPrice = c.req.query('min_price')
    const maxPrice = c.req.query('max_price')
    const condition = c.req.query('condition')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const sort = c.req.query('sort') || 'created_desc'
    const offset = (page - 1) * limit

    // 検索条件構築
    let conditions = ['p.status = ?']
    let params: any[] = ['active']

    if (query) {
      conditions.push('(p.title LIKE ? OR p.part_number LIKE ? OR p.compatible_models LIKE ?)')
      params.push(`%${query}%`, `%${query}%`, `%${query}%`)
    }

    if (categoryId) {
      conditions.push('p.category_id = ?')
      params.push(categoryId)
    }

    if (makerId) {
      conditions.push('p.maker_id = ?')
      params.push(makerId)
    }

    if (minPrice) {
      conditions.push('p.price >= ?')
      params.push(minPrice)
    }

    if (maxPrice) {
      conditions.push('p.price <= ?')
      params.push(maxPrice)
    }

    if (condition) {
      conditions.push('p.condition = ?')
      params.push(condition)
    }

    // ソート順
    let orderBy = 'p.created_at DESC'
    if (sort === 'price_asc') orderBy = 'p.price ASC'
    else if (sort === 'price_desc') orderBy = 'p.price DESC'
    else if (sort === 'popular') orderBy = 'p.view_count DESC'

    const whereClause = conditions.join(' AND ')

    // 総件数取得
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereClause}
    `
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first()
    const total = (countResult as any)?.total || 0

    // 商品取得
    const productsQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.condition,
        p.view_count, p.favorite_count, p.part_number,
        p.created_at,
        c.name as category_name,
        m.name as maker_name,
        mo.name as model_name,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        u.rating as seller_rating,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as main_image,
        (SELECT COUNT(*) FROM product_compatibility WHERE product_id = p.id) as compatibility_count,
        (SELECT COUNT(*) FROM fitment_confirmations WHERE product_id = p.id AND fits = 1) as fit_confirmations
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN car_makers m ON p.maker_id = m.id
      LEFT JOIN car_models mo ON p.model_id = mo.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `
    
    const { results } = await c.env.DB.prepare(productsQuery)
      .bind(...params, limit, offset)
      .all()

    return c.json({
      success: true,
      items: results,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return c.json({ success: false, error: '商品の取得に失敗しました' }, 500)
  }
})

// 商品詳細
api.get('/products/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const product = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        sc.name as subcategory_name,
        m.name as maker_name,
        mo.name as model_name,
        u.id as seller_id,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        u.rating as seller_rating,
        u.total_sales as seller_total_sales
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN car_makers m ON p.maker_id = m.id
      LEFT JOIN car_models mo ON p.model_id = mo.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(id).first()

    if (!product) {
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }

    // 商品画像取得
    const { results: images } = await c.env.DB.prepare(`
      SELECT id, image_url, display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY display_order ASC
    `).bind(id).all()

    // 閲覧数更新
    await c.env.DB.prepare(`
      UPDATE products SET view_count = view_count + 1 WHERE id = ?
    `).bind(id).run()

    return c.json({
      success: true,
      product,
      images
    })
  } catch (error) {
    console.error('Product detail fetch error:', error)
    return c.json({ success: false, error: '商品詳細の取得に失敗しました' }, 500)
  }
})

export default api
