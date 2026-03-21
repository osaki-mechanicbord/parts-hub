import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

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
app.get('/:productId/images', async (c) => {
  try {
    const { DB } = c.env
    const productId = c.req.param('productId')

    const { results } = await DB.prepare(`
      SELECT * FROM product_images
      WHERE product_id = ?
      ORDER BY display_order ASC
    `).bind(productId).all()

    return c.json({
      success: true,
      data: results
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
    const required = ['seller_id', 'title', 'description', 'price', 'category_id', 'condition', 'stock_quantity']
    for (const field of required) {
      if (!body[field]) {
        return c.json({ success: false, error: `${field}は必須です` }, 400)
      }
    }

    // 商品登録
    const result = await DB.prepare(`
      INSERT INTO products (
        seller_id, title, description, price, category_id, subcategory_id,
        maker_id, model_id, part_number, compatible_models, condition,
        stock_quantity, status, is_proxy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.seller_id,
      body.title,
      body.description,
      body.price,
      body.category_id,
      body.subcategory_id || null,
      body.maker_id || null,
      body.model_id || null,
      body.part_number || null,
      body.compatible_models || null,
      body.condition,
      body.stock_quantity,
      body.status || 'draft',
      body.is_proxy || false
    ).run()

    const productId = result.meta.last_row_id

    // 適合情報を保存（ある場合）
    if (body.compatibility) {
      await DB.prepare(`
        INSERT INTO product_compatibility (
          product_id, maker_id, model_id, year_from, year_to, model_code,
          grade, engine_type, drive_type, transmission_type, body_type,
          oem_part_number, aftermarket_part_number, alternative_numbers,
          verification_method, fitment_notes, special_requirements,
          confidence_level, verified_by_admin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        false
      ).run()
    }

    return c.json({
      success: true,
      data: {
        id: productId,
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
        title = ?,
        description = ?,
        price = ?,
        category_id = ?,
        subcategory_id = ?,
        maker_id = ?,
        model_id = ?,
        part_number = ?,
        compatible_models = ?,
        condition = ?,
        stock_quantity = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.title,
      body.description,
      body.price,
      body.category_id,
      body.subcategory_id || null,
      body.maker_id || null,
      body.model_id || null,
      body.part_number || null,
      body.compatible_models || null,
      body.condition,
      body.stock_quantity,
      body.status,
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
            confidence_level, verified_by_admin
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          false
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

export default app
