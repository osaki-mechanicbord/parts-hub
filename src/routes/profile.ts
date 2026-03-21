import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const profile = new Hono<{ Bindings: Bindings }>()

// プロフィール情報取得
profile.get('/:userId', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')

    const user = await DB.prepare(`
      SELECT 
        id, email, shop_name, shop_type, phone, bio,
        postal_code, prefecture, city, address,
        profile_image_url, is_verified, created_at,
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
profile.put('/:userId', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')
    const body = await c.req.json()

    const {
      shop_name,
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

    // 必須項目チェック
    if (!shop_name || !shop_type || !phone || !email) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    // ユーザー存在確認
    const user = await DB.prepare(`
      SELECT id FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    // プロフィール更新
    await DB.prepare(`
      UPDATE users SET
        shop_name = ?,
        shop_type = ?,
        phone = ?,
        email = ?,
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
      shop_name,
      shop_type,
      phone,
      email,
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

    // ファイル拡張子チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(imageFile.type)) {
      return c.json({ success: false, error: 'JPGまたはPNG形式の画像を指定してください' }, 400)
    }

    // ファイルサイズチェック（5MB）
    if (imageFile.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: '画像サイズは5MB以下にしてください' }, 400)
    }

    // ファイル名生成（ユーザーID + タイムスタンプ）
    const ext = imageFile.type.split('/')[1]
    const filename = `profiles/${userId}/${Date.now()}.${ext}`

    // R2にアップロード
    const buffer = await imageFile.arrayBuffer()
    await R2.put(filename, buffer, {
      httpMetadata: {
        contentType: imageFile.type
      }
    })

    // 公開URLを生成（環境変数から取得、または固定値）
    const publicUrl = `https://storage.example.com/${filename}`

    return c.json({
      success: true,
      data: {
        url: publicUrl,
        filename: filename
      }
    })
  } catch (error) {
    console.error('Upload image error:', error)
    return c.json({ success: false, error: '画像アップロードに失敗しました' }, 500)
  }
})

export default profile
