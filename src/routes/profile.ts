import { Hono } from 'hono'
import { verifyToken, verifyPassword } from '../auth'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const profile = new Hono<{ Bindings: Bindings }>()

// 認証ヘッダーからユーザーIDを取得するヘルパー
async function getUserIdFromToken(c: any): Promise<number | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.substring(7)
  const secret = (c.env as any)?.JWT_SECRET
  const payload = await verifyToken(token, secret)
  if (!payload || !payload.sub) {
    return null
  }
  return payload.sub as number
}

// ログインユーザーのプロフィール取得（認証トークンから）
profile.get('/me', async (c) => {
  try {
    const { DB } = c.env

    const userId = await getUserIdFromToken(c)
    if (!userId) {
      return c.json({ success: false, error: 'ログインが必要です' }, 401)
    }

    const user = await DB.prepare(`
      SELECT 
        id, name, nickname, email, phone, company_name, shop_type, bio,
        postal_code, prefecture, city, address,
        profile_image_url, is_verified, rating, created_at,
        bank_name, bank_code, branch_name, branch_code, account_type, account_number, account_holder
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
        bank_name, bank_code, branch_name, branch_code, account_type, account_number, account_holder
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

    const userId = await getUserIdFromToken(c)
    if (!userId) {
      return c.json({ success: false, error: 'ログインが必要です' }, 401)
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
      bank_code,
      branch_name,
      branch_code,
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
        bank_code = ?,
        branch_name = ?,
        branch_code = ?,
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
      bank_code || null,
      branch_name || null,
      branch_code || null,
      account_type || null,
      account_number || null,
      account_holder || null,
      userId
    ).run()

    // 更新後のユーザー情報をlocalStorageと同期するためにレスポンスに含める
    const updated = await DB.prepare(`
      SELECT id, name, nickname, email, phone, company_name, shop_type
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
      bank_name, bank_code, branch_name, branch_code, account_type, account_number, account_holder
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
        bank_code = ?,
        branch_name = ?,
        branch_code = ?,
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
      bank_name || null, bank_code || null, branch_name || null, branch_code || null, account_type || null,
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

// アカウント削除（退会）
profile.delete('/account', async (c) => {
  try {
    const { DB } = c.env
    const userId = await getUserIdFromToken(c)
    if (!userId) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }

    const body = await c.req.json()
    const { password } = body

    if (!password) {
      return c.json({ success: false, error: 'パスワードを入力してください' }, 400)
    }

    // パスワード確認
    const user = await DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(userId).first() as any
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return c.json({ success: false, error: 'パスワードが正しくありません' }, 403)
    }

    // 進行中の取引がないか確認
    const activeTx = await DB.prepare(
      `SELECT COUNT(*) as cnt FROM transactions WHERE (buyer_id = ? OR seller_id = ?) AND status IN ('pending','paid','shipped')`
    ).bind(userId, userId).first() as any
    if (activeTx && activeTx.cnt > 0) {
      return c.json({ success: false, error: '進行中の取引があるため退会できません。取引完了後に再度お試しください。' }, 400)
    }

    // ソフトデリート: ユーザーを無効化し個人情報を匿名化
    await DB.prepare(`
      UPDATE users SET
        status = 'deleted',
        email = 'deleted_' || id || '@deleted.local',
        name = '退会済みユーザー',
        nickname = NULL,
        company_name = NULL,
        phone = NULL,
        address = NULL,
        city = NULL,
        prefecture = NULL,
        postal_code = NULL,
        password_hash = 'DELETED',
        profile_image_url = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(userId).run()

    // 出品中の商品を取り下げ
    await DB.prepare(
      `UPDATE products SET status = 'inactive' WHERE user_id = ? AND status = 'active'`
    ).bind(userId).run()

    return c.json({ success: true, message: '退会処理が完了しました' })
  } catch (error) {
    console.error('Delete account error:', error)
    return c.json({ success: false, error: '退会処理に失敗しました' }, 500)
  }
})

export default profile
