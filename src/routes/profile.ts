import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const profile = new Hono<{ Bindings: Bindings }>()

// ログインユーザーのプロフィール取得（認証トークンから）
profile.get('/me', async (c) => {
  try {
    const { DB } = c.env

    // Authorization ヘッダーからユーザーID取得
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'ログインが必要です' }, 401)
    }
    const token = authHeader.substring(7)

    // JWTデコード（hono/jwtを使わずペイロード部分を直接読む）
    let userId: number
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.userId || payload.id || payload.sub
      if (!userId) throw new Error('Invalid token payload')
    } catch (e) {
      return c.json({ success: false, error: '無効なトークンです' }, 401)
    }

    const user = await DB.prepare(`
      SELECT 
        id, name, nickname, email, phone, company_name, shop_type, bio,
        postal_code, prefecture, city, address,
        profile_image_url, is_verified, rating, created_at,
        bank_name, branch_name, account_type, account_number, account_holder
      FROM users
      WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    return c.json({ success: true, data: user })
  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({ success: false, error: 'プロフィール情報の取得に失敗しました' }, 500)
  }
})

// プロフィール情報取得（ID指定 - 後方互換）
profile.get('/:userId', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')

    const user = await DB.prepare(`
      SELECT 
        id, name, nickname, email, phone, company_name, shop_type, bio,
        postal_code, prefecture, city, address,
        profile_image_url, is_verified, rating, created_at,
        bank_name, branch_name, account_type, account_number, account_holder
      FROM users
      WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    return c.json({ success: true, data: user })
  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({ success: false, error: 'プロフィール情報の取得に失敗しました' }, 500)
  }
})

// プロフィール情報更新
profile.put('/me', async (c) => {
  try {
    const { DB } = c.env

    // Authorization ヘッダーからユーザーID取得
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'ログインが必要です' }, 401)
    }
    const token = authHeader.substring(7)

    let userId: number
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.userId || payload.id || payload.sub
      if (!userId) throw new Error('Invalid token payload')
    } catch (e) {
      return c.json({ success: false, error: '無効なトークンです' }, 401)
    }

    const body = await c.req.json()

    const {
      name,
      nickname,
      company_name,
      shop_type,
      phone,
      email,
      bio,
      postal_code,
      prefecture,
      city,
      address,
      profile_image_url,
      bank_name,
      branch_name,
      account_type,
      account_number,
      account_holder
    } = body

    // ユーザー存在確認
    const user = await DB.prepare(`SELECT id FROM users WHERE id = ?`).bind(userId).first()
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // プロフィール更新
    await DB.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        nickname = COALESCE(?, nickname),
        company_name = ?,
        shop_type = COALESCE(?, shop_type),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        bio = ?,
        postal_code = ?,
        prefecture = ?,
        city = ?,
        address = ?,
        profile_image_url = COALESCE(?, profile_image_url),
        bank_name = ?,
        branch_name = ?,
        account_type = ?,
        account_number = ?,
        account_holder = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name || null,
      nickname || null,
      company_name || null,
      shop_type || null,
      phone || null,
      email || null,
      bio || null,
      postal_code || null,
      prefecture || null,
      city || null,
      address || null,
      profile_image_url || null,
      bank_name || null,
      branch_name || null,
      account_type || null,
      account_number || null,
      account_holder || null,
      userId
    ).run()

    // 更新後のユーザー情報をlocalStorageと同期するためにレスポンスに含める
    const updated = await DB.prepare(`
      SELECT id, name, nickname, email, phone, company_name
      FROM users WHERE id = ?
    `).bind(userId).first()

    return c.json({ success: true, message: 'プロフィールを更新しました', user: updated })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({ success: false, error: 'プロフィールの更新に失敗しました' }, 500)
  }
})

// 後方互換: PUT /:userId
profile.put('/:userId', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')
    const body = await c.req.json()

    const {
      company_name, shop_name,
      shop_type, phone, email, bio,
      postal_code, prefecture, city, address,
      profile_image_url,
      bank_name, branch_name, account_type, account_number, account_holder
    } = body

    const companyOrShop = company_name || shop_name || null

    const user = await DB.prepare(`SELECT id FROM users WHERE id = ?`).bind(userId).first()
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    await DB.prepare(`
      UPDATE users SET
        company_name = ?,
        shop_type = COALESCE(?, shop_type),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        bio = ?,
        postal_code = ?,
        prefecture = ?,
        city = ?,
        address = ?,
        profile_image_url = COALESCE(?, profile_image_url),
        bank_name = ?,
        branch_name = ?,
        account_type = ?,
        account_number = ?,
        account_holder = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      companyOrShop,
      shop_type || null, phone || null, email || null,
      bio || null, postal_code || null, prefecture || null,
      city || null, address || null, profile_image_url || null,
      bank_name || null, branch_name || null, account_type || null,
      account_number || null, account_holder || null,
      userId
    ).run()

    return c.json({ success: true, message: 'プロフィールを更新しました' })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({ success: false, error: 'プロフィールの更新に失敗しました' }, 500)
  }
})

// プロフィール画像アップロード
profile.post('/upload-image', async (c) => {
  try {
    const { R2 } = c.env
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as File
    const userId = formData.get('user_id') as string

    if (!imageFile) {
      return c.json({ success: false, error: '画像ファイルが必要です' }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(imageFile.type)) {
      return c.json({ success: false, error: 'JPGまたはPNG形式の画像を指定してください' }, 400)
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: '画像サイズは5MB以下にしてください' }, 400)
    }

    const ext = imageFile.type.split('/')[1]
    const filename = `profiles/${userId}/${Date.now()}.${ext}`

    const buffer = await imageFile.arrayBuffer()
    await R2.put(filename, buffer, {
      httpMetadata: { contentType: imageFile.type }
    })

    const publicUrl = `https://images.parts-hub-tci.com/${filename}`

    return c.json({
      success: true,
      data: { url: publicUrl, filename: filename }
    })
  } catch (error) {
    console.error('Upload image error:', error)
    return c.json({ success: false, error: '画像アップロードに失敗しました' }, 500)
  }
})

export default profile
