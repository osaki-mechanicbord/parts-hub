import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const notifications = new Hono<{ Bindings: Bindings }>()

// 通知一覧取得
notifications.get('/:userId', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')
    const limit = parseInt(c.req.query('limit') || '50')
    const onlyUnread = c.req.query('unread') === 'true'

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `
    
    if (onlyUnread) {
      query += ` AND is_read = 0`
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`

    const { results } = await DB.prepare(query).bind(userId, limit).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get notifications error:', error)
    return c.json({ success: false, error: '通知の取得に失敗しました' }, 500)
  }
})

// 未読通知数取得
notifications.get('/:userId/unread-count', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.param('userId')

    const result = await DB.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).first()

    return c.json({ success: true, data: { count: result?.count || 0 } })
  } catch (error) {
    console.error('Get unread count error:', error)
    return c.json({ success: false, error: '未読数の取得に失敗しました' }, 500)
  }
})

// 通知を既読にする
notifications.put('/:notificationId/read', async (c) => {
  try {
    const { DB } = c.env
    const notificationId = c.req.param('notificationId')
    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    await DB.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, user_id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    return c.json({ success: false, error: '既読処理に失敗しました' }, 500)
  }
})

// 全通知を既読にする
notifications.put('/read-all', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    await DB.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND is_read = 0
    `).bind(user_id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Mark all as read error:', error)
    return c.json({ success: false, error: '一括既読処理に失敗しました' }, 500)
  }
})

// 通知削除
notifications.delete('/:notificationId', async (c) => {
  try {
    const { DB } = c.env
    const notificationId = c.req.param('notificationId')
    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    await DB.prepare(`
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, user_id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    return c.json({ success: false, error: '通知の削除に失敗しました' }, 500)
  }
})

export default notifications
