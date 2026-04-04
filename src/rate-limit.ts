import { Context, Next } from 'hono'

/**
 * Cloudflare Workers向け軽量レートリミッター
 * D1に rate_limits テーブルを使用（存在しなければスキップ）
 */

interface RateLimitConfig {
  /** ウィンドウ秒数 */
  windowSec: number
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number
  /** 識別キーのプレフィックス */
  keyPrefix: string
}

export function rateLimiter(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    try {
      const DB = (c.env as any).DB as D1Database
      if (!DB) { await next(); return }

      // IPアドレスまたは認証ユーザーIDをキーに使用
      const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
      const userId = c.get('userId')
      const key = `${config.keyPrefix}:${userId || ip}`

      const now = Math.floor(Date.now() / 1000)
      const windowStart = now - config.windowSec

      // 期限切れレコードを削除 & カウント取得を1クエリで
      await DB.prepare(
        `DELETE FROM rate_limits WHERE expire_at < ?`
      ).bind(now).run().catch(() => {})

      const row = await DB.prepare(
        `SELECT count FROM rate_limits WHERE key = ? AND expire_at >= ?`
      ).bind(key, now).first().catch(() => null) as any

      const currentCount = row ? Number(row.count) : 0

      if (currentCount >= config.maxRequests) {
        return c.json({
          success: false,
          error: 'リクエストが多すぎます。しばらく経ってからお試しください。'
        }, 429)
      }

      // カウントアップ（UPSERT）
      await DB.prepare(
        `INSERT INTO rate_limits (key, count, expire_at)
         VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET count = count + 1, expire_at = MAX(expire_at, ?)`
      ).bind(key, now + config.windowSec, now + config.windowSec).run().catch(() => {})

      await next()
    } catch (e) {
      // レートリミットテーブルが存在しない等のエラーはスキップ
      await next()
    }
  }
}

// プリセット
/** ログイン: 60秒間に10回まで */
export const loginRateLimit = rateLimiter({ windowSec: 60, maxRequests: 10, keyPrefix: 'login' })

/** 会員登録: 60秒間に5回まで */
export const registerRateLimit = rateLimiter({ windowSec: 60, maxRequests: 5, keyPrefix: 'register' })

/** コメント投稿: 60秒間に10回まで */
export const commentRateLimit = rateLimiter({ windowSec: 60, maxRequests: 10, keyPrefix: 'comment' })

/** レビュー投稿: 60秒間に5回まで */
export const reviewRateLimit = rateLimiter({ windowSec: 60, maxRequests: 5, keyPrefix: 'review' })

/** 値下げ交渉: 60秒間に5回まで */
export const negotiationRateLimit = rateLimiter({ windowSec: 60, maxRequests: 5, keyPrefix: 'nego' })

/** パスワードリセット: 300秒間に3回まで */
export const passwordResetRateLimit = rateLimiter({ windowSec: 300, maxRequests: 3, keyPrefix: 'pwreset' })
