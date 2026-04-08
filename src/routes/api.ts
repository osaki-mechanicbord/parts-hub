import { Hono } from 'hono'
import type { Bindings } from '../types'

const api = new Hono<{ Bindings: Bindings }>()

// R2キーを表示用URLに変換するヘルパー
function toImageUrl(key: string | null | undefined): string | null {
  if (!key) return null
  // 既に完全なURLの場合はそのまま返す
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/r2/')) return key
  // R2キーを /r2/ パス経由のURLに変換
  return `/r2/${key}`
}

// ヘルスチェック
api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// カテゴリ一覧
api.get('/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, slug, icon, display_order
      FROM categories
      WHERE is_active = 1
      ORDER BY display_order ASC
    `).all()

    return c.json({ success: true, categories: results })
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

// サブカテゴリ一覧（カテゴリID指定）
api.get('/categories/:id/subcategories', async (c) => {
  try {
    const id = c.req.param('id')

    const { results: subcategories } = await c.env.DB.prepare(`
      SELECT id, name, slug, display_order
      FROM subcategories
      WHERE category_id = ? AND is_active = 1
      ORDER BY display_order ASC
    `).bind(id).all()

    return c.json({
      success: true,
      data: subcategories
    })
  } catch (error) {
    console.error('Subcategory fetch error:', error)
    return c.json({ success: false, error: 'サブカテゴリの取得に失敗しました' }, 500)
  }
})

// メーカー一覧
api.get('/makers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, name_en, country, display_order
      FROM car_makers
      WHERE is_active = 1
      ORDER BY display_order ASC
    `).all()

    return c.json({ success: true, makers: results })
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
    const vmMaker = c.req.query('vm_maker')
    const vmModel = c.req.query('vm_model')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const sort = c.req.query('sort') || 'created_desc'
    const offset = (page - 1) * limit

    // 検索条件構築
    // active + sold 両方表示（sold商品はSOLDバッジ付きで表示）
    let conditions = ["p.status IN ('active', 'sold')"]
    let params: any[] = []

    if (query) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.part_number LIKE ? OR p.compatible_models LIKE ?)')
      params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`)
    }

    if (categoryId) {
      conditions.push('p.category_id = ?')
      params.push(categoryId)
    }

    if (makerId) {
      conditions.push('p.maker_id = ?')
      params.push(makerId)
    }

    // vehicle_master連動フィルタ（車種別パーツガイドからのリンク）
    if (vmMaker) {
      conditions.push('(p.vm_maker = ? OR EXISTS (SELECT 1 FROM product_compatibility pc WHERE pc.product_id = p.id AND pc.vm_maker = ?))')
      params.push(vmMaker, vmMaker)
    }
    if (vmModel) {
      conditions.push('(p.vm_model = ? OR EXISTS (SELECT 1 FROM product_compatibility pc WHERE pc.product_id = p.id AND pc.vm_model = ?))')
      params.push(vmModel, vmModel)
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
    else if (sort === 'popular') orderBy = 'p.favorite_count DESC, p.view_count DESC'

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
        p.status,
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

    // 画像URLを変換
    const items = results.map((p: any) => ({
      ...p,
      main_image: toImageUrl(p.main_image)
    }))

    return c.json({
      success: true,
      items,
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

// 商品検索（車種別パーツガイドからのvm_maker/vm_modelフィルタ対応）
api.get('/products/search', async (c) => {
  try {
    const keyword = c.req.query('keyword') || ''
    const sort = c.req.query('sort') || 'newest'
    const priceMin = c.req.query('price_min')
    const priceMax = c.req.query('price_max')
    const condition = c.req.query('condition')
    const vmMaker = c.req.query('vm_maker')
    const vmModel = c.req.query('vm_model')

    let conditions = ["p.status IN ('active', 'sold')"]
    let params: any[] = []

    if (keyword) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.part_number LIKE ? OR p.compatible_models LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (vmMaker) {
      conditions.push('(p.vm_maker = ? OR EXISTS (SELECT 1 FROM product_compatibility pc2 WHERE pc2.product_id = p.id AND pc2.vm_maker = ?))')
      params.push(vmMaker, vmMaker)
    }
    if (vmModel) {
      conditions.push('(p.vm_model = ? OR EXISTS (SELECT 1 FROM product_compatibility pc3 WHERE pc3.product_id = p.id AND pc3.vm_model = ?))')
      params.push(vmModel, vmModel)
    }
    if (priceMin) { conditions.push('p.price >= ?'); params.push(priceMin) }
    if (priceMax) { conditions.push('p.price <= ?'); params.push(priceMax) }
    if (condition) { conditions.push('p.condition = ?'); params.push(condition) }

    let orderBy = 'p.created_at DESC'
    if (sort === 'price_asc') orderBy = 'p.price ASC'
    else if (sort === 'price_desc') orderBy = 'p.price DESC'
    else if (sort === 'popular') orderBy = 'p.favorite_count DESC, p.view_count DESC'

    const whereClause = conditions.join(' AND ')
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT p.id, p.title, p.price, p.condition, p.status,
        p.favorite_count, p.view_count,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url,
        (SELECT COUNT(*) FROM product_comments WHERE product_id = p.id) as comment_count
      FROM products p
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT 60
    `).bind(...params).all()

    const products = results.map((p: any) => ({
      ...p,
      image_url: p.image_url ? (p.image_url.startsWith('http') ? p.image_url : '/r2/' + p.image_url) : '/icons/icon.svg'
    }))

    return c.json({ success: true, products })
  } catch (error) {
    console.error('Product search error:', error)
    return c.json({ success: false, error: '検索に失敗しました', products: [] }, 500)
  }
})

// 商品詳細（IDまたはスラッグ対応）
api.get('/products/:slugOrId', async (c) => {
  try {
    const slugOrId = c.req.param('slugOrId')
    const isNumeric = !isNaN(Number(slugOrId))

    const baseQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        sc.name as subcategory_name,
        m.name as maker_name,
        mo.name as model_name,
        u.id as seller_id,
        COALESCE(u.company_name, u.nickname, u.name) as seller_name,
        u.rating as seller_rating,
        u.total_sales as seller_total_sales,
        u.is_verified as seller_verified,
        u.shop_type as seller_shop_type
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN car_makers m ON p.maker_id = m.id
      LEFT JOIN car_models mo ON p.model_id = mo.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'}
    `

    const product = await c.env.DB.prepare(baseQuery).bind(slugOrId).first()

    if (!product) {
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }

    // 商品画像取得
    const { results: rawImages } = await c.env.DB.prepare(`
      SELECT id, image_url, display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY display_order ASC
    `).bind(product.id).all()

    // 画像URLを変換
    const images = rawImages.map((img: any) => ({
      ...img,
      image_url: toImageUrl(img.image_url)
    }))

    // 適合情報取得
    const compatibility = await c.env.DB.prepare(`
      SELECT * FROM product_compatibility WHERE product_id = ?
    `).bind(product.id).first()

    // 閲覧数更新
    await c.env.DB.prepare(`
      UPDATE products SET view_count = view_count + 1 WHERE id = ?
    `).bind(product.id).run()

    return c.json({
      success: true,
      product: {
        ...product,
        images,
        compatibility
      },
      images
    })
  } catch (error) {
    console.error('Product detail fetch error:', error)
    return c.json({ success: false, error: '商品詳細の取得に失敗しました' }, 500)
  }
})

// =============================================
// vehicle_master カスケード検索API
// メーカー → 車種 → グレード → タイヤサイズ
// =============================================

// メーカー一覧（vehicle_masterから）
api.get('/vehicle-master/makers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT maker FROM vehicle_master ORDER BY maker ASC
    `).all()
    return c.json({ success: true, data: results.map((r: any) => r.maker) })
  } catch (error) {
    console.error('Vehicle master makers error:', error)
    return c.json({ success: false, error: 'メーカー取得に失敗' }, 500)
  }
})

// 車種一覧（メーカー指定）
api.get('/vehicle-master/models', async (c) => {
  try {
    const maker = c.req.query('maker')
    if (!maker) return c.json({ success: false, error: 'maker is required' }, 400)
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT model FROM vehicle_master WHERE maker = ? ORDER BY model ASC
    `).bind(maker).all()
    return c.json({ success: true, data: results.map((r: any) => r.model) })
  } catch (error) {
    console.error('Vehicle master models error:', error)
    return c.json({ success: false, error: '車種取得に失敗' }, 500)
  }
})

// グレード一覧（メーカー＋車種指定）
api.get('/vehicle-master/grades', async (c) => {
  try {
    const maker = c.req.query('maker')
    const model = c.req.query('model')
    if (!maker || !model) return c.json({ success: false, error: 'maker and model are required' }, 400)
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT grade_name, drive_type, tire_size
      FROM vehicle_master
      WHERE maker = ? AND model = ? AND grade_name != ''
      ORDER BY grade_name ASC
    `).bind(maker, model).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Vehicle master grades error:', error)
    return c.json({ success: false, error: 'グレード取得に失敗' }, 500)
  }
})

// 車種別パーツガイド用: メーカー別の車種一覧（車種数付き）
api.get('/vehicle-master/guide/makers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT maker, COUNT(DISTINCT model) as model_count
      FROM vehicle_master
      GROUP BY maker
      ORDER BY model_count DESC
    `).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Vehicle guide makers error:', error)
    return c.json({ success: false, error: 'メーカー取得に失敗' }, 500)
  }
})

// 車種別パーツガイド用: 指定メーカーの車種一覧（グレード数付き）
api.get('/vehicle-master/guide/models', async (c) => {
  try {
    const maker = c.req.query('maker')
    if (!maker) return c.json({ success: false, error: 'maker is required' }, 400)
    const { results } = await c.env.DB.prepare(`
      SELECT model,
             COUNT(DISTINCT grade_name) as grade_count,
             COUNT(DISTINCT CASE WHEN drive_type != '' THEN drive_type END) as drive_type_count,
             COUNT(DISTINCT CASE WHEN tire_size != '' THEN tire_size END) as tire_size_count
      FROM vehicle_master
      WHERE maker = ?
      GROUP BY model
      ORDER BY model ASC
    `).bind(maker).all()
    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Vehicle guide models error:', error)
    return c.json({ success: false, error: '車種取得に失敗' }, 500)
  }
})

// 車種別パーツガイド用: 車種詳細（グレード・タイヤサイズ一覧）
api.get('/vehicle-master/guide/detail', async (c) => {
  try {
    const maker = c.req.query('maker')
    const model = c.req.query('model')
    if (!maker || !model) return c.json({ success: false, error: 'maker and model are required' }, 400)
    const { results } = await c.env.DB.prepare(`
      SELECT grade_name, drive_type, tire_size
      FROM vehicle_master
      WHERE maker = ? AND model = ?
      ORDER BY grade_name ASC
    `).bind(maker, model).all()

    // 商品数カウント（vm_maker/vm_modelが一致する出品商品）
    const productCount = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT p.id) as cnt
      FROM products p
      WHERE p.status IN ('active', 'sold')
        AND (p.vm_maker = ? OR EXISTS (SELECT 1 FROM product_compatibility pc WHERE pc.product_id = p.id AND pc.vm_maker = ?))
        AND (p.vm_model = ? OR EXISTS (SELECT 1 FROM product_compatibility pc WHERE pc.product_id = p.id AND pc.vm_model = ?))
    `).bind(maker, maker, model, model).first() as any

    return c.json({ success: true, data: results, product_count: productCount?.cnt || 0, maker, model })
  } catch (error) {
    console.error('Vehicle guide detail error:', error)
    return c.json({ success: false, error: '車種詳細取得に失敗' }, 500)
  }
})

// タイヤサイズ取得（メーカー＋車種＋グレード指定）
api.get('/vehicle-master/tire-size', async (c) => {
  try {
    const maker = c.req.query('maker')
    const model = c.req.query('model')
    const grade = c.req.query('grade')
    if (!maker || !model || !grade) return c.json({ success: false, error: 'maker, model and grade are required' }, 400)
    const { results } = await c.env.DB.prepare(`
      SELECT drive_type, tire_size
      FROM vehicle_master
      WHERE maker = ? AND model = ? AND grade_name = ?
      LIMIT 1
    `).bind(maker, model, grade).all()
    if (results.length === 0) return c.json({ success: true, data: null })
    return c.json({ success: true, data: results[0] })
  } catch (error) {
    console.error('Vehicle master tire-size error:', error)
    return c.json({ success: false, error: 'タイヤサイズ取得に失敗' }, 500)
  }
})

// 出品者プロフィール取得
api.get('/seller/:id/profile', async (c) => {
  try {
    const sellerId = c.req.param('id')
    const seller = await c.env.DB.prepare(`
      SELECT id, name, nickname, company_name, shop_type, bio, 
        profile_image_url, rating, is_verified, total_sales, total_transactions,
        prefecture, created_at
      FROM users WHERE id = ?
    `).bind(sellerId).first() as any

    if (!seller) {
      return c.json({ success: false, error: '出品者が見つかりません' }, 404)
    }

    // プロフィール画像をURL変換
    if (seller.profile_image_url) {
      seller.profile_image_url = toImageUrl(seller.profile_image_url)
    }

    return c.json({ success: true, seller })
  } catch (error) {
    console.error('Seller profile error:', error)
    return c.json({ success: false, error: '取得に失敗しました' }, 500)
  }
})

export default api
