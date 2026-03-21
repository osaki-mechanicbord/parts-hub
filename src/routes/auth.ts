import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// JWT シークレット（本番環境では環境変数から取得）
const JWT_SECRET = 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60 // 7日間（秒）

// パスワードハッシュ化（Web Crypto API使用）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// パスワード検証
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// ランダムトークン生成
function generateToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// ユーザー登録
app.post('/register', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()

    // バリデーション
    const { email, password, shop_name, shop_type, phone, postal_code, prefecture, city, address } = body

    if (!email || !password || !shop_name || !shop_type) {
      return c.json({ success: false, error: '必須項目を入力してください' }, 400)
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ success: false, error: '有効なメールアドレスを入力してください' }, 400)
    }

    // パスワードの長さチェック
    if (password.length < 8) {
      return c.json({ success: false, error: 'パスワードは8文字以上である必要があります' }, 400)
    }

    // メールアドレス重複チェック
    const existingUser = await DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first()

    if (existingUser) {
      return c.json({ success: false, error: 'このメールアドレスは既に登録されています' }, 400)
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password)

    // ユーザー作成
    const result = await DB.prepare(`
      INSERT INTO users (
        email, password_hash, shop_name, shop_type, phone,
        postal_code, prefecture, city, address, is_verified, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `).bind(
      email,
      passwordHash,
      shop_name,
      shop_type,
      phone || null,
      postal_code || null,
      prefecture || null,
      city || null,
      address || null
    ).run()

    const userId = result.meta.last_row_id

    // メール確認トークン生成
    const verificationToken = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後

    await DB.prepare(`
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(userId, verificationToken, expiresAt).run()

    // TODO: メール送信処理（後で実装）
    // sendVerificationEmail(email, verificationToken)

    return c.json({
      success: true,
      data: {
        id: userId,
        email,
        shop_name,
        message: 'アカウントが作成されました。確認メールをご確認ください。'
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ success: false, error: 'アカウント作成に失敗しました' }, 500)
  }
})

// ログイン
app.post('/login', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()

    const { email, password } = body

    if (!email || !password) {
      return c.json({ success: false, error: 'メールアドレスとパスワードを入力してください' }, 400)
    }

    // ユーザー検索
    const user = await DB.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first()

    if (!user) {
      return c.json({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }

    // パスワード検証
    const isValid = await verifyPassword(password, user.password_hash as string)

    if (!isValid) {
      return c.json({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }

    // アカウント状態チェック
    if (!user.is_active) {
      return c.json({ success: false, error: 'このアカウントは無効化されています' }, 403)
    }

    // JWT トークン生成
    const jti = generateToken(16)
    const expiresAt = Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN

    const token = await sign({
      sub: user.id,
      email: user.email,
      shop_name: user.shop_name,
      jti,
      exp: expiresAt,
      iat: Math.floor(Date.now() / 1000)
    }, JWT_SECRET)

    // セッション記録
    await DB.prepare(`
      INSERT INTO user_sessions (user_id, token_jti, expires_at, device_info, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user.id,
      jti,
      new Date(expiresAt * 1000).toISOString(),
      c.req.header('user-agent') || null,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null
    ).run()

    // 最終ログイン時刻を更新
    await DB.prepare(`
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run()

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          shop_name: user.shop_name,
          shop_type: user.shop_type,
          is_verified: user.is_verified,
          rating: user.rating
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: 'ログインに失敗しました' }, 500)
  }
})

// ログアウト
app.post('/logout', async (c) => {
  try {
    const { DB } = c.env
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verify(token, JWT_SECRET, 'HS256') as any

    // セッションを無効化
    await DB.prepare(`
      UPDATE user_sessions SET is_active = 0 WHERE token_jti = ?
    `).bind(payload.jti).run()

    return c.json({ success: true, message: 'ログアウトしました' })
  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ success: false, error: 'ログアウトに失敗しました' }, 500)
  }
})

// 現在のユーザー情報取得
app.get('/me', async (c) => {
  try {
    const { DB } = c.env
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verify(token, JWT_SECRET, 'HS256') as any

    // セッションチェック
    const session = await DB.prepare(`
      SELECT * FROM user_sessions
      WHERE token_jti = ? AND is_active = 1 AND expires_at > datetime('now')
    `).bind(payload.jti).first()

    if (!session) {
      return c.json({ success: false, error: 'セッションが無効です' }, 401)
    }

    // ユーザー情報取得
    const user = await DB.prepare(`
      SELECT id, email, shop_name, shop_type, phone, postal_code, prefecture,
             city, address, is_verified, is_active, rating, total_sales,
             total_purchases, created_at
      FROM users
      WHERE id = ?
    `).bind(payload.sub).first()

    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }

    return c.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get me error:', error)
    return c.json({ success: false, error: 'ユーザー情報の取得に失敗しました' }, 500)
  }
})

// プロフィール更新
app.put('/profile', async (c) => {
  try {
    const { DB } = c.env
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verify(token, JWT_SECRET, 'HS256') as any

    const body = await c.req.json()
    const { shop_name, phone, postal_code, prefecture, city, address } = body

    // プロフィール更新
    await DB.prepare(`
      UPDATE users SET
        shop_name = COALESCE(?, shop_name),
        phone = COALESCE(?, phone),
        postal_code = COALESCE(?, postal_code),
        prefecture = COALESCE(?, prefecture),
        city = COALESCE(?, city),
        address = COALESCE(?, address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      shop_name || null,
      phone || null,
      postal_code || null,
      prefecture || null,
      city || null,
      address || null,
      payload.sub
    ).run()

    // 更新後のユーザー情報取得
    const user = await DB.prepare(`
      SELECT id, email, shop_name, shop_type, phone, postal_code, prefecture,
             city, address, is_verified, rating
      FROM users
      WHERE id = ?
    `).bind(payload.sub).first()

    return c.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({ success: false, error: 'プロフィールの更新に失敗しました' }, 500)
  }
})

// メールアドレス確認
app.post('/verify-email/:token', async (c) => {
  try {
    const { DB } = c.env
    const token = c.req.param('token')

    // トークン検証
    const verificationToken = await DB.prepare(`
      SELECT * FROM email_verification_tokens
      WHERE token = ? AND used = 0 AND expires_at > datetime('now')
    `).bind(token).first()

    if (!verificationToken) {
      return c.json({ success: false, error: '無効または期限切れのトークンです' }, 400)
    }

    // ユーザーを確認済みに更新
    await DB.prepare(`
      UPDATE users SET is_verified = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(verificationToken.user_id).run()

    // トークンを使用済みに
    await DB.prepare(`
      UPDATE email_verification_tokens SET used = 1 WHERE id = ?
    `).bind(verificationToken.id).run()

    return c.json({
      success: true,
      message: 'メールアドレスが確認されました'
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return c.json({ success: false, error: 'メールアドレスの確認に失敗しました' }, 500)
  }
})

// パスワードリセット要求
app.post('/password-reset-request', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { email } = body

    if (!email) {
      return c.json({ success: false, error: 'メールアドレスを入力してください' }, 400)
    }

    // ユーザー検索
    const user = await DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first()

    // セキュリティのため、ユーザーが存在しなくても成功レスポンスを返す
    if (!user) {
      return c.json({
        success: true,
        message: 'パスワードリセットメールを送信しました（該当するメールアドレスが登録されている場合）'
      })
    }

    // リセットトークン生成
    const resetToken = generateToken()
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString() // 1時間後

    await DB.prepare(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, resetToken, expiresAt).run()

    // TODO: メール送信処理（後で実装）
    // sendPasswordResetEmail(email, resetToken)

    return c.json({
      success: true,
      message: 'パスワードリセットメールを送信しました',
      // 開発用のみ：実際の本番環境では削除
      dev_token: resetToken
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return c.json({ success: false, error: 'パスワードリセット要求に失敗しました' }, 500)
  }
})

// パスワードリセット実行
app.post('/password-reset/:token', async (c) => {
  try {
    const { DB } = c.env
    const token = c.req.param('token')
    const body = await c.req.json()
    const { password } = body

    if (!password || password.length < 8) {
      return c.json({ success: false, error: 'パスワードは8文字以上である必要があります' }, 400)
    }

    // トークン検証
    const resetToken = await DB.prepare(`
      SELECT * FROM password_reset_tokens
      WHERE token = ? AND used = 0 AND expires_at > datetime('now')
    `).bind(token).first()

    if (!resetToken) {
      return c.json({ success: false, error: '無効または期限切れのトークンです' }, 400)
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password)

    // パスワード更新
    await DB.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(passwordHash, resetToken.user_id).run()

    // トークンを使用済みに
    await DB.prepare(`
      UPDATE password_reset_tokens SET used = 1 WHERE id = ?
    `).bind(resetToken.id).run()

    // 全セッションを無効化（セキュリティのため）
    await DB.prepare(`
      UPDATE user_sessions SET is_active = 0 WHERE user_id = ?
    `).bind(resetToken.user_id).run()

    return c.json({
      success: true,
      message: 'パスワードがリセットされました。新しいパスワードでログインしてください。'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return c.json({ success: false, error: 'パスワードのリセットに失敗しました' }, 500)
  }
})

export default app
