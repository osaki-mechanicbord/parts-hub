import { Hono } from 'hono'
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  isValidEmail,
  isStrongPassword,
  authMiddleware 
} from '../auth'
import { sendEmail } from '../email-config'
import * as tpl from '../email-templates'

type Bindings = {
  DB: D1Database
  RESEND_API_KEY?: string
  JWT_SECRET?: string
}

const auth = new Hono<{ Bindings: Bindings }>()

// ユーザー登録
auth.post('/register', async (c) => {
  try {
    const { name, email, password, phone, company_name, nickname, shop_name, shop_type, postal_code, prefecture, city, address } = await c.req.json()

    // バリデーション
    if (!name || !email || !password) {
      return c.json({ 
        success: false, 
        error: '名前、メールアドレス、パスワードは必須です' 
      }, 400)
    }

    if (!isValidEmail(email)) {
      return c.json({ 
        success: false, 
        error: '有効なメールアドレスを入力してください' 
      }, 400)
    }

    const passwordCheck = isStrongPassword(password)
    if (!passwordCheck.valid) {
      return c.json({ 
        success: false, 
        error: passwordCheck.message 
      }, 400)
    }

    // メールアドレスの重複チェック
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return c.json({ 
        success: false, 
        error: 'このメールアドレスは既に登録されています' 
      }, 400)
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password)

    // ユーザー作成
    const displayName = nickname || name
    const companyOrShop = company_name || shop_name || null
    const result = await c.env.DB.prepare(`
      INSERT INTO users (
        name, email, password_hash, phone, company_name, nickname,
        shop_type, postal_code, prefecture, city, address,
        status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(
      name, email, passwordHash, phone || null, companyOrShop, displayName,
      shop_type || 'individual', postal_code || null, prefecture || null, city || null, address || null
    ).run()

    const userId = result.meta.last_row_id

    // JWTトークン生成
    const secret = (c.env as any)?.JWT_SECRET
    const token = await generateToken(userId as number, email, secret)

    // メールアドレス認証トークン生成＆メール送信
    try {
      const apiKey = (c.env as any)?.RESEND_API_KEY
      if (apiKey) {
        // 認証トークン生成
        const verifyToken = crypto.randomUUID()
        await c.env.DB.prepare(`
          INSERT INTO auth_tokens (user_id, token, token_type, expires_at, created_at)
          VALUES (?, ?, 'email_verify', datetime('now', '+24 hours'), datetime('now'))
        `).bind(userId, verifyToken).run()

        const verifyUrl = `https://parts-hub-tci.com/api/auth/verify-email?token=${verifyToken}`

        // 1) メールアドレス認証メール
        const verifyEmail = tpl.emailVerification({ userName: name, verifyUrl })
        await sendEmail(apiKey, { to: email, ...verifyEmail })

        // 2) 会員登録完了メール
        const regEmail = tpl.registrationComplete({ userName: name })
        await sendEmail(apiKey, { to: email, ...regEmail })
      }
    } catch (emailError) {
      console.error('Failed to send registration emails:', emailError)
      // メール送信失敗でも登録は成功とする
    }

    return c.json({
      success: true,
      message: 'ユーザー登録が完了しました',
      token: token,
      user: {
        id: userId,
        name: name,
        nickname: displayName,
        email: email,
        phone: phone,
        company_name: companyOrShop,
        shop_type: shop_type || 'individual',
        postal_code: postal_code || null,
        prefecture: prefecture || null,
        city: city || null,
        address: address || null
      }
    }, 201)

  } catch (error: any) {
    console.error('Registration error:', error)
    return c.json({ 
      success: false, 
      error: 'ユーザー登録に失敗しました' 
    }, 500)
  }
})

// メールアドレス認証エンドポイント
auth.get('/verify-email', async (c) => {
  try {
    const token = c.req.query('token')
    if (!token) {
      return c.html('<html><body style="text-align:center;padding:60px;font-family:sans-serif;"><h2>無効なリンクです</h2><p><a href="/">トップページに戻る</a></p></body></html>')
    }

    // トークン検索
    const record = await c.env.DB.prepare(`
      SELECT user_id FROM auth_tokens
      WHERE token = ? AND token_type = 'email_verify' AND expires_at > datetime('now')
    `).bind(token).first()

    if (!record) {
      return c.html('<html><body style="text-align:center;padding:60px;font-family:sans-serif;"><h2>リンクが無効または期限切れです</h2><p><a href="/">トップページに戻る</a></p></body></html>')
    }

    // メール認証済みに更新
    await c.env.DB.prepare(`
      UPDATE users SET is_verified = 1, updated_at = datetime('now') WHERE id = ?
    `).bind(record.user_id).run()

    // 使用済みトークンを削除
    await c.env.DB.prepare(`
      DELETE FROM auth_tokens WHERE token = ? AND token_type = 'email_verify'
    `).bind(token).run()

    return c.html(`<html><body style="text-align:center;padding:60px;font-family:sans-serif;">
      <div style="max-width:400px;margin:0 auto;background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:40px;">
        <h2 style="color:#16a34a;">✅ メールアドレスの認証が完了しました！</h2>
        <p>ご確認ありがとうございます。</p>
        <p><a href="/" style="display:inline-block;margin-top:16px;padding:12px 32px;background:#ef4444;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">PARTS HUBに戻る</a></p>
      </div>
    </body></html>`)
  } catch (error) {
    console.error('Email verify error:', error)
    return c.html('<html><body style="text-align:center;padding:60px;font-family:sans-serif;"><h2>認証処理でエラーが発生しました</h2><p><a href="/">トップページに戻る</a></p></body></html>')
  }
})

// ログイン
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    // バリデーション
    if (!email || !password) {
      return c.json({ 
        success: false, 
        error: 'メールアドレスとパスワードを入力してください' 
      }, 400)
    }

    // ユーザー検索
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, password_hash, phone, company_name, nickname, status,
             shop_type, postal_code, prefecture, city, address
      FROM users
      WHERE email = ?
    `).bind(email).first()

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'メールアドレスまたはパスワードが正しくありません' 
      }, 401)
    }

    // ユーザーステータスチェック
    if (user.status === 'suspended') {
      return c.json({ 
        success: false, 
        error: 'このアカウントは停止されています' 
      }, 403)
    }

    if (user.status === 'banned') {
      return c.json({ 
        success: false, 
        error: 'このアカウントは利用禁止されています' 
      }, 403)
    }

    // パスワード検証
    const isValid = await verifyPassword(password, user.password_hash as string)

    if (!isValid) {
      return c.json({ 
        success: false, 
        error: 'メールアドレスまたはパスワードが正しくありません' 
      }, 401)
    }

    // 最終ログイン時刻を更新
    await c.env.DB.prepare(`
      UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(user.id).run()

    // JWTトークン生成
    const secret = (c.env as any)?.JWT_SECRET
    const token = await generateToken(user.id as number, user.email as string, secret)

    return c.json({
      success: true,
      message: 'ログインに成功しました',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname || user.name,
        email: user.email,
        phone: user.phone,
        company_name: user.company_name,
        status: user.status,
        shop_type: user.shop_type,
        postal_code: user.postal_code,
        prefecture: user.prefecture,
        city: user.city,
        address: user.address
      }
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({ 
      success: false, 
      error: 'ログインに失敗しました' 
    }, 500)
  }
})

// ログアウト（トークンブラックリスト方式）
auth.post('/logout', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    // auth_tokensテーブルにトークンを記録（無効化用）
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.substring(7) || ''

    await c.env.DB.prepare(`
      INSERT INTO auth_tokens (user_id, token, expires_at, created_at)
      VALUES (?, ?, datetime('now', '+7 days'), datetime('now'))
    `).bind(userId, token).run()

    return c.json({
      success: true,
      message: 'ログアウトしました'
    })

  } catch (error: any) {
    console.error('Logout error:', error)
    return c.json({ 
      success: false, 
      error: 'ログアウトに失敗しました' 
    }, 500)
  }
})

// 現在のユーザー情報取得
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const user = await c.env.DB.prepare(`
      SELECT id, name, email, phone, company_name, nickname, shop_type, rating,
             is_verified, total_sales, bio, profile_image_url, status, created_at
      FROM users
      WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'ユーザーが見つかりません' 
      }, 404)
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname || user.name,
        email: user.email,
        phone: user.phone,
        company_name: user.company_name,
        shop_type: user.shop_type,
        rating: user.rating,
        is_verified: user.is_verified,
        total_sales: user.total_sales,
        bio: user.bio,
        profile_image_url: user.profile_image_url,
        status: user.status,
        created_at: user.created_at
      }
    })

  } catch (error: any) {
    console.error('Get user error:', error)
    return c.json({ 
      success: false, 
      error: 'ユーザー情報の取得に失敗しました' 
    }, 500)
  }
})

// パスワード変更
auth.post('/change-password', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { current_password, new_password } = await c.req.json()

    if (!current_password || !new_password) {
      return c.json({ 
        success: false, 
        error: '現在のパスワードと新しいパスワードを入力してください' 
      }, 400)
    }

    // 新しいパスワードの強度チェック
    const passwordCheck = isStrongPassword(new_password)
    if (!passwordCheck.valid) {
      return c.json({ 
        success: false, 
        error: passwordCheck.message 
      }, 400)
    }

    // 現在のパスワードハッシュを取得
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'ユーザーが見つかりません' 
      }, 404)
    }

    // 現在のパスワードを検証
    const isValid = await verifyPassword(current_password, user.password_hash as string)

    if (!isValid) {
      return c.json({ 
        success: false, 
        error: '現在のパスワードが正しくありません' 
      }, 401)
    }

    // 新しいパスワードをハッシュ化
    const newPasswordHash = await hashPassword(new_password)

    // パスワード更新
    await c.env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newPasswordHash, userId).run()

    return c.json({
      success: true,
      message: 'パスワードを変更しました'
    })

  } catch (error: any) {
    console.error('Change password error:', error)
    return c.json({ 
      success: false, 
      error: 'パスワード変更に失敗しました' 
    }, 500)
  }
})

// パスワードリセットリクエスト（メール送信は後で実装）
auth.post('/password-reset-request', async (c) => {
  try {
    const { email } = await c.req.json()

    if (!email) {
      return c.json({ 
        success: false, 
        error: 'メールアドレスを入力してください' 
      }, 400)
    }

    // ユーザー存在チェック
    const user = await c.env.DB.prepare(
      'SELECT id, name FROM users WHERE email = ?'
    ).bind(email).first()

    // セキュリティのため、ユーザーが存在しない場合も成功レスポンスを返す
    if (!user) {
      return c.json({
        success: true,
        message: 'パスワードリセット用のメールを送信しました'
      })
    }

    // リセットトークン生成（6桁の数字）
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
    const resetTokenHash = await hashPassword(resetToken)

    // トークンをDBに保存（有効期限30分）
    await c.env.DB.prepare(`
      INSERT INTO auth_tokens (user_id, token, token_type, expires_at, created_at)
      VALUES (?, ?, 'password_reset', datetime('now', '+30 minutes'), datetime('now'))
    `).bind(user.id, resetTokenHash).run()

    // TODO: メール送信（Day 5で実装）
    // 開発中は resetToken をレスポンスに含める
    return c.json({
      success: true,
      message: 'パスワードリセット用のメールを送信しました',
      // 開発用（本番では削除）
      debug_reset_token: resetToken
    })

  } catch (error: any) {
    console.error('Password reset request error:', error)
    return c.json({ 
      success: false, 
      error: 'パスワードリセットリクエストに失敗しました' 
    }, 500)
  }
})

// パスワードリセット実行
auth.post('/password-reset', async (c) => {
  try {
    const { email, reset_token, new_password } = await c.req.json()

    if (!email || !reset_token || !new_password) {
      return c.json({ 
        success: false, 
        error: 'すべての項目を入力してください' 
      }, 400)
    }

    // 新しいパスワードの強度チェック
    const passwordCheck = isStrongPassword(new_password)
    if (!passwordCheck.valid) {
      return c.json({ 
        success: false, 
        error: passwordCheck.message 
      }, 400)
    }

    // ユーザー検索
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'ユーザーが見つかりません' 
      }, 404)
    }

    // 有効なリセットトークンを検索
    const tokens = await c.env.DB.prepare(`
      SELECT token FROM auth_tokens
      WHERE user_id = ? 
        AND token_type = 'password_reset'
        AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `).bind(user.id).all()

    if (!tokens.results || tokens.results.length === 0) {
      return c.json({ 
        success: false, 
        error: 'リセットトークンが無効または期限切れです' 
      }, 400)
    }

    // トークン検証
    let tokenValid = false
    for (const tokenRecord of tokens.results) {
      const isValid = await verifyPassword(reset_token, tokenRecord.token as string)
      if (isValid) {
        tokenValid = true
        break
      }
    }

    if (!tokenValid) {
      return c.json({ 
        success: false, 
        error: 'リセットトークンが正しくありません' 
      }, 400)
    }

    // 新しいパスワードをハッシュ化
    const newPasswordHash = await hashPassword(new_password)

    // パスワード更新
    await c.env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newPasswordHash, user.id).run()

    // 使用済みトークンを削除
    await c.env.DB.prepare(`
      DELETE FROM auth_tokens
      WHERE user_id = ? AND token_type = 'password_reset'
    `).bind(user.id).run()

    return c.json({
      success: true,
      message: 'パスワードをリセットしました'
    })

  } catch (error: any) {
    console.error('Password reset error:', error)
    return c.json({ 
      success: false, 
      error: 'パスワードリセットに失敗しました' 
    }, 500)
  }
})

export default auth
