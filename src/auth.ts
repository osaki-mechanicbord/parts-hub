import { Context, Next } from 'hono'
import { sign, verify } from 'hono/jwt'
import * as bcrypt from 'bcryptjs'

// JWT Secret取得関数
function getJWTSecret(c?: Context): string {
  // Cloudflare環境変数から取得（本番環境）
  if (c && c.env && (c.env as any).JWT_SECRET) {
    return (c.env as any).JWT_SECRET
  }
  // フォールバック（開発環境）
  return 'parts-hub-jwt-secret-key-2026-change-in-production'
}

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// パスワード検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWTトークン生成
export async function generateToken(userId: number, email: string, secret?: string): Promise<string> {
  const JWT_SECRET = secret || 'parts-hub-jwt-secret-key-2026-change-in-production'
  const payload = {
    sub: userId,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30日間有効
  }
  return await sign(payload, JWT_SECRET, 'HS256')
}

// JWTトークン検証
export async function verifyToken(token: string, secret?: string): Promise<any> {
  const JWT_SECRET = secret || 'parts-hub-jwt-secret-key-2026-change-in-production'
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256')
    return payload
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// 認証ミドルウェア
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '認証が必要です' }, 401)
  }

  const token = authHeader.substring(7)
  const secret = (c.env as any)?.JWT_SECRET
  const payload = await verifyToken(token, secret)

  if (!payload) {
    return c.json({ success: false, error: '無効なトークンです' }, 401)
  }

  // ユーザー情報をコンテキストに保存
  c.set('userId', payload.sub)
  c.set('userEmail', payload.email)

  await next()
}

// オプショナル認証ミドルウェア（ログインしていなくてもOK）
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const secret = (c.env as any)?.JWT_SECRET
    const payload = await verifyToken(token, secret)

    if (payload) {
      c.set('userId', payload.sub)
      c.set('userEmail', payload.email)
    }
  }

  await next()
}

// Cookie認証ミドルウェア（ブラウザ用）
export async function cookieAuthMiddleware(c: Context, next: Next) {
  const token = c.req.cookie('auth_token')
  
  if (!token) {
    return c.json({ success: false, error: '認証が必要です' }, 401)
  }

  const secret = (c.env as any)?.JWT_SECRET
  const payload = await verifyToken(token, secret)

  if (!payload) {
    return c.json({ success: false, error: '無効なトークンです' }, 401)
  }

  c.set('userId', payload.sub)
  c.set('userEmail', payload.email)

  await next()
}

// メールアドレスバリデーション
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// パスワード強度チェック
export function isStrongPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'パスワードは8文字以上である必要があります' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'パスワードには大文字を含める必要があります' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'パスワードには小文字を含める必要があります' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'パスワードには数字を含める必要があります' }
  }
  return { valid: true }
}
