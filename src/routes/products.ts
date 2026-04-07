import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// R2キーを表示用URLに変換するヘルパー
function toImageUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/r2/')) return key
  return `/r2/${key}`
}

// スラッグ生成関数（日本語対応）
function generateSlug(title: string, id: number): string {
  // 日本語の場合はそのままローマ字表記にせず、英数字部分のみ使用
  let slug = title
    .toLowerCase()
    .trim()
    // 全角スペースを半角に
    .replace(/　/g, ' ')
    // 全角英数を半角に
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    })
    // 日本語文字を削除（英数字・ハイフン以外）
    .replace(/[^\w\-]/g, '')
    // スペースをハイフンに
    .replace(/\s+/g, '-')
    // 連続するハイフンを1つに
    .replace(/\-+/g, '-')
    // 前後のハイフンを削除
    .replace(/^-+|-+$/g, '')
  
  // スラッグが空または短すぎる場合はproductを使用
  if (!slug || slug.length < 3) {
    slug = 'product'
  }
  
  // IDを末尾に追加してユニーク性を保証
  return `${slug}-${id}`
}

// 商品検索（車種別パーツガイドからのvm_maker/vm_modelフィルタ対応）
app.get('/search', async (c) => {
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

// 画像アップロード
app.post('/images/upload', async (c) => {
  try {
    const { R2, DB } = c.env
    const formData = await c.req.formData()
    const file = formData.get('image') as File
    const productId = formData.get('product_id') as string
    const displayOrder = formData.get('display_order') as string

    if (!file) {
      return c.json({ success: false, error: '画像ファイルが必要です' }, 400)
    }

    // ファイル検証
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return c.json({ success: false, error: 'ファイルサイズは10MB以下にしてください' }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, error: '画像形式はJPEG, PNG, WEBPのみ対応しています' }, 400)
    }

    // ファイル名生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const ext = file.name.split('.').pop()
    const key = `products/${productId || 'temp'}/${timestamp}-${randomStr}.${ext}`

    // R2にアップロード
    const arrayBuffer = await file.arrayBuffer()
    await R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    })

    // DBに画像情報を保存（product_idがある場合のみ）
    let imageId = null
    if (productId) {
      const result = await DB.prepare(`
        INSERT INTO product_images (product_id, image_url, image_key, display_order)
        VALUES (?, ?, ?, ?)
      `).bind(
        productId,
        key, // URLは後でR2_PUBLIC_URLと結合
        key,
        displayOrder || 1
      ).run()

      imageId = result.meta.last_row_id
    }

    return c.json({
      success: true,
      data: {
        id: imageId,
        key,
        url: key, // フロントエンドでR2_PUBLIC_URLと結合
        display_order: displayOrder || 1
      }
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return c.json({ success: false, error: '画像のアップロードに失敗しました' }, 500)
  }
})

// 画像削除
app.delete('/images/:imageId', async (c) => {
  try {
    const { R2, DB } = c.env
    const imageId = c.req.param('imageId')

    // DBから画像情報を取得
    const image = await DB.prepare(`
      SELECT * FROM product_images WHERE id = ?
    `).bind(imageId).first()

    if (!image) {
      return c.json({ success: false, error: '画像が見つかりません' }, 404)
    }

    // R2から削除
    await R2.delete(image.image_key as string)

    // DBから削除
    await DB.prepare(`
      DELETE FROM product_images WHERE id = ?
    `).bind(imageId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Image delete error:', error)
    return c.json({ success: false, error: '画像の削除に失敗しました' }, 500)
  }
})

// 商品の画像一覧取得
app.get('/images/:productId', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')

    const { results } = await DB.prepare(`
      SELECT * FROM product_images
      WHERE product_id = ?
      ORDER BY display_order ASC
    `).bind(productId).all()

    // 画像URLを変換
    const data = results.map((img: any) => ({
      ...img,
      image_url: toImageUrl(img.image_url)
    }))

    return c.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Get images error:', error)
    return c.json({ success: false, error: '画像の取得に失敗しました' }, 500)
  }
})

// 商品出品
app.post('/', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()

    // 必須フィールドのバリデーション
    const userId = body.seller_id || body.user_id
    if (!userId || !body.title || !body.price || !body.condition) {
      return c.json({ success: false, error: '出品者ID、タイトル、価格、状態は必須です' }, 400)
    }

    // 商品登録
    const result = await DB.prepare(`
      INSERT INTO products (
        user_id, seller_id, title, description, price, category_id, subcategory_id,
        maker_id, model_id, part_number, compatible_models, condition,
        stock_quantity, status, is_proxy,
        vm_maker, vm_model, vm_grade, vm_tire_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      userId,
      body.title,
      body.description || '',
      body.price,
      body.category_id || null,
      body.subcategory_id || null,
      body.maker_id || null,
      body.model_id || null,
      body.part_number || null,
      body.compatible_models || null,
      body.condition,
      body.stock_quantity || 1,
      body.status || 'active',
      body.is_proxy ? 1 : 0,
      body.vm_maker || null,
      body.vm_model || null,
      body.vm_grade || null,
      body.vm_tire_size || null
    ).run()

    const productId = result.meta.last_row_id

    // スラッグを生成して更新
    const slug = generateSlug(body.title, Number(productId))
    await DB.prepare(`
      UPDATE products SET slug = ? WHERE id = ?
    `).bind(slug, productId).run()

    // 適合情報を保存（ある場合）
    if (body.compatibility) {
      await DB.prepare(`
        INSERT INTO product_compatibility (
          product_id, maker_id, model_id, year_from, year_to, model_code,
          grade, engine_type, drive_type, transmission_type, body_type,
          oem_part_number, aftermarket_part_number, alternative_numbers,
          verification_method, fitment_notes, special_requirements,
          confidence_level, verified_by_admin, tire_size,
          vm_maker, vm_model, vm_grade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        productId,
        body.compatibility.maker_id || null,
        body.compatibility.model_id || null,
        body.compatibility.year_from || null,
        body.compatibility.year_to || null,
        body.compatibility.model_code || null,
        body.compatibility.grade || null,
        body.compatibility.engine_type || null,
        body.compatibility.drive_type || null,
        body.compatibility.transmission_type || null,
        body.compatibility.body_type || null,
        body.compatibility.oem_part_number || null,
        body.compatibility.aftermarket_part_number || null,
        body.compatibility.alternative_numbers || null,
        body.compatibility.verification_method || 'part_number',
        body.compatibility.fitment_notes || null,
        body.compatibility.special_requirements || null,
        body.compatibility.confidence_level || 3,
        false,
        body.compatibility.tire_size || body.vm_tire_size || null,
        body.vm_maker || null,
        body.vm_model || null,
        body.vm_grade || null
      ).run()
    }

    return c.json({
      success: true,
      data: {
        id: productId,
        slug: slug,
        ...body,
        created_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Product create error:', error)
    return c.json({ success: false, error: '商品の登録に失敗しました' }, 500)
  }
})

// 商品更新
app.put('/:id', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('id')
    const body = await c.req.json()

    // 商品更新
    await DB.prepare(`
      UPDATE products SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        category_id = ?,
        subcategory_id = ?,
        maker_id = ?,
        model_id = ?,
        part_number = ?,
        compatible_models = ?,
        condition = COALESCE(?, condition),
        stock_quantity = COALESCE(?, stock_quantity),
        status = COALESCE(?, status),
        vm_maker = ?,
        vm_model = ?,
        vm_grade = ?,
        vm_tire_size = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.title || null,
      body.description || null,
      body.price || null,
      body.category_id || null,
      body.subcategory_id || null,
      body.maker_id || null,
      body.model_id || null,
      body.part_number || null,
      body.compatible_models || null,
      body.condition || null,
      body.stock_quantity || null,
      body.status || null,
      body.vm_maker || null,
      body.vm_model || null,
      body.vm_grade || null,
      body.vm_tire_size || null,
      productId
    ).run()

    // 適合情報を更新（ある場合）
    if (body.compatibility) {
      // 既存の適合情報を確認
      const existingCompat = await DB.prepare(`
        SELECT id FROM product_compatibility WHERE product_id = ?
      `).bind(productId).first()

      if (existingCompat) {
        // 更新
        await DB.prepare(`
          UPDATE product_compatibility SET
            maker_id = ?,
            model_id = ?,
            year_from = ?,
            year_to = ?,
            model_code = ?,
            grade = ?,
            engine_type = ?,
            drive_type = ?,
            transmission_type = ?,
            body_type = ?,
            oem_part_number = ?,
            aftermarket_part_number = ?,
            alternative_numbers = ?,
            verification_method = ?,
            fitment_notes = ?,
            special_requirements = ?,
            confidence_level = ?,
            tire_size = ?,
            vm_maker = ?,
            vm_model = ?,
            vm_grade = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ?
        `).bind(
          body.compatibility.maker_id || null,
          body.compatibility.model_id || null,
          body.compatibility.year_from || null,
          body.compatibility.year_to || null,
          body.compatibility.model_code || null,
          body.compatibility.grade || null,
          body.compatibility.engine_type || null,
          body.compatibility.drive_type || null,
          body.compatibility.transmission_type || null,
          body.compatibility.body_type || null,
          body.compatibility.oem_part_number || null,
          body.compatibility.aftermarket_part_number || null,
          body.compatibility.alternative_numbers || null,
          body.compatibility.verification_method || 'part_number',
          body.compatibility.fitment_notes || null,
          body.compatibility.special_requirements || null,
          body.compatibility.confidence_level || 3,
          body.compatibility.tire_size || body.vm_tire_size || null,
          body.vm_maker || null,
          body.vm_model || null,
          body.vm_grade || null,
          productId
        ).run()
      } else {
        // 新規作成
        await DB.prepare(`
          INSERT INTO product_compatibility (
            product_id, maker_id, model_id, year_from, year_to, model_code,
            grade, engine_type, drive_type, transmission_type, body_type,
            oem_part_number, aftermarket_part_number, alternative_numbers,
            verification_method, fitment_notes, special_requirements,
            confidence_level, verified_by_admin, tire_size,
            vm_maker, vm_model, vm_grade
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          productId,
          body.compatibility.maker_id || null,
          body.compatibility.model_id || null,
          body.compatibility.year_from || null,
          body.compatibility.year_to || null,
          body.compatibility.model_code || null,
          body.compatibility.grade || null,
          body.compatibility.engine_type || null,
          body.compatibility.drive_type || null,
          body.compatibility.transmission_type || null,
          body.compatibility.body_type || null,
          body.compatibility.oem_part_number || null,
          body.compatibility.aftermarket_part_number || null,
          body.compatibility.alternative_numbers || null,
          body.compatibility.verification_method || 'part_number',
          body.compatibility.fitment_notes || null,
          body.compatibility.special_requirements || null,
          body.compatibility.confidence_level || 3,
          false,
          body.compatibility.tire_size || body.vm_tire_size || null,
          body.vm_maker || null,
          body.vm_model || null,
          body.vm_grade || null
        ).run()
      }
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Product update error:', error)
    return c.json({ success: false, error: '商品の更新に失敗しました' }, 500)
  }
})

// 商品削除
app.delete('/:id', async (c) => {
  try {
    const { DB, R2 } = c.env
    const productId = c.req.param('id')

    // 商品に紐づく画像を取得
    const { results: images } = await DB.prepare(`
      SELECT * FROM product_images WHERE product_id = ?
    `).bind(productId).all()

    // R2から画像を削除
    for (const image of images) {
      await R2.delete(image.image_key as string)
    }

    // DBから画像レコードを削除
    await DB.prepare(`
      DELETE FROM product_images WHERE product_id = ?
    `).bind(productId).run()

    // 適合情報を削除
    await DB.prepare(`
      DELETE FROM product_compatibility WHERE product_id = ?
    `).bind(productId).run()

    // 商品を削除
    await DB.prepare(`
      DELETE FROM products WHERE id = ?
    `).bind(productId).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    return c.json({ success: false, error: '商品の削除に失敗しました' }, 500)
  }
})

// 商品詳細取得（スラッグまたはID）
app.get('/:slugOrId', async (c) => {
  try {
    const { DB } = c.env
    const slugOrId = c.req.param('slugOrId')
    
    console.log('[商品詳細] パラメータ:', slugOrId, 'isNaN:', isNaN(Number(slugOrId)))
    
    // スラッグまたはIDで検索
    let product
    if (isNaN(Number(slugOrId))) {
      // スラッグの場合
      console.log('[商品詳細] スラッグで検索:', slugOrId)
      product = await DB.prepare(`
        SELECT 
          p.*,
          COALESCE(u.company_name, u.nickname, u.name) as shop_name,
          u.shop_type,
          u.rating,
          u.is_verified,
          c.name as category_name,
          m.name as maker_name,
          mo.name as model_name
        FROM products p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN car_makers m ON p.maker_id = m.id
        LEFT JOIN car_models mo ON p.model_id = mo.id
        WHERE p.slug = ? AND p.status IN ('active', 'sold', 'reserved')
      `).bind(slugOrId).first()
      console.log('[商品詳細] 検索結果:', product ? `見つかった(ID:${product.id})` : '見つからない')
    } else {
      // IDの場合
      console.log('[商品詳細] IDで検索:', slugOrId)
      product = await DB.prepare(`
        SELECT 
          p.*,
          COALESCE(u.company_name, u.nickname, u.name) as shop_name,
          u.shop_type,
          u.rating,
          u.is_verified,
          c.name as category_name,
          m.name as maker_name,
          mo.name as model_name
        FROM products p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN car_makers m ON p.maker_id = m.id
        LEFT JOIN car_models mo ON p.model_id = mo.id
        WHERE p.id = ? AND p.status IN ('active', 'sold', 'reserved')
      `).bind(slugOrId).first()
      console.log('[商品詳細] 検索結果:', product ? `見つかった(ID:${product.id})` : '見つからない')
    }
    
    if (!product) {
      return c.json({ success: false, error: '商品が見つかりません' }, 404)
    }
    
    // 画像を取得
    const { results: rawImages } = await DB.prepare(`
      SELECT id, image_url, display_order FROM product_images
      WHERE product_id = ?
      ORDER BY display_order ASC
    `).bind(product.id).all()
    
    // 画像URLを変換
    const images = rawImages.map((img: any) => ({
      ...img,
      image_url: toImageUrl(img.image_url)
    }))
    
    // 適合情報を取得
    const compatibility = await DB.prepare(`
      SELECT * FROM product_compatibility
      WHERE product_id = ?
    `).bind(product.id).first()
    
    // OEM品番情報を取得（ARGOS JPC連携で紐付けられた品番）
    let oem_parts: any[] = []
    try {
      const { results: oemResults } = await DB.prepare(`
        SELECT oem_part_number, part_name, reference_price, compatible_part_numbers, 
               source, vin_used, group_name, subgroup_name, created_at
        FROM product_oem_parts
        WHERE product_id = ?
        ORDER BY created_at ASC
      `).bind(product.id).all()
      oem_parts = oemResults || []
    } catch (_) {
      // product_oem_parts テーブルが存在しない場合（マイグレーション未適用）はスキップ
    }
    
    // 閲覧数を増やす
    await DB.prepare(`
      UPDATE products SET view_count = view_count + 1 WHERE id = ?
    `).bind(product.id).run()
    
    return c.json({
      success: true,
      data: {
        ...product,
        images,
        compatibility,
        oem_parts
      }
    })
  } catch (error) {
    console.error('Get product error:', error)
    return c.json({ success: false, error: '商品の取得に失敗しました' }, 500)
  }
})

export default app
