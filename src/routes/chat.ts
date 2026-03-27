import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const chat = new Hono<{ Bindings: Bindings }>()

// チャットルーム一覧取得
chat.get('/rooms', async (c) => {
  try {
    const { DB } = c.env
    const userId = c.req.query('user_id')

    if (!userId) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    const { results } = await DB.prepare(`
      SELECT 
        cr.*,
        p.title as product_title,
        p.price as product_price,
        COALESCE(buyer.company_name, buyer.nickname, buyer.name) as buyer_name,
        COALESCE(seller.company_name, seller.nickname, seller.name) as seller_name,
        (SELECT message_text FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM chat_rooms cr
      JOIN products p ON cr.product_id = p.id
      JOIN users buyer ON cr.buyer_id = buyer.id
      JOIN users seller ON cr.seller_id = seller.id
      WHERE cr.buyer_id = ? OR cr.seller_id = ?
      ORDER BY cr.last_message_at DESC NULLS LAST, cr.created_at DESC
    `).bind(userId, userId, userId).all()

    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Get chat rooms error:', error)
    return c.json({ success: false, error: 'チャットルームの取得に失敗しました' }, 500)
  }
})

// チャットルーム取得または作成
chat.post('/rooms', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    const { product_id, buyer_id, seller_id } = body

    if (!product_id || !buyer_id || !seller_id) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    // 既存のルームを検索
    let room = await DB.prepare(`
      SELECT * FROM chat_rooms 
      WHERE product_id = ? AND buyer_id = ? AND seller_id = ?
    `).bind(product_id, buyer_id, seller_id).first()

    if (!room) {
      // 新しいルームを作成
      const result = await DB.prepare(`
        INSERT INTO chat_rooms (product_id, buyer_id, seller_id)
        VALUES (?, ?, ?)
      `).bind(product_id, buyer_id, seller_id).run()

      const roomId = result.meta.last_row_id
      room = await DB.prepare(`SELECT * FROM chat_rooms WHERE id = ?`).bind(roomId).first()
    }

    return c.json({ success: true, data: room })
  } catch (error) {
    console.error('Create chat room error:', error)
    return c.json({ success: false, error: 'チャットルームの作成に失敗しました' }, 500)
  }
})

// メッセージ一覧取得
chat.get('/rooms/:roomId/messages', async (c) => {
  try {
    const { DB } = c.env
    const roomId = c.req.param('roomId')
    const limit = parseInt(c.req.query('limit') || '50')
    const before = c.req.query('before') // メッセージID（ページネーション用）

    let query = `
      SELECT 
        cm.*,
        COALESCE(u.company_name, u.nickname, u.name) as sender_name,
        COALESCE(u.is_verified, 0) as sender_verified
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = ?
    `
    
    const params: any[] = [roomId]
    
    if (before) {
      query += ` AND cm.id < ?`
      params.push(before)
    }
    
    query += ` ORDER BY cm.created_at DESC LIMIT ?`
    params.push(limit)

    const { results } = await DB.prepare(query).bind(...params).all()

    // メッセージを古い順に並び替え
    const messages = results.reverse()

    return c.json({ success: true, data: messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return c.json({ success: false, error: 'メッセージの取得に失敗しました' }, 500)
  }
})

// メッセージ送信
chat.post('/rooms/:roomId/messages', async (c) => {
  try {
    const { DB } = c.env
    const roomId = c.req.param('roomId')
    const body = await c.req.json()
    const { sender_id, message_text, message_type, metadata } = body

    if (!sender_id || !message_text) {
      return c.json({ success: false, error: '必須項目が不足しています' }, 400)
    }

    // メッセージ挿入
    const result = await DB.prepare(`
      INSERT INTO chat_messages 
        (room_id, sender_id, message_text, message_type, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).bind(roomId, sender_id, message_text, message_type || 'text', metadata || null).run()

    const messageId = result.meta.last_row_id

    // チャットルームの最終メッセージ時刻を更新
    await DB.prepare(`
      UPDATE chat_rooms 
      SET last_message_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(roomId).run()

    // 受信者に通知を作成
    const room = await DB.prepare(`
      SELECT buyer_id, seller_id, product_id FROM chat_rooms WHERE id = ?
    `).bind(roomId).first()

    if (room) {
      const receiverId = sender_id === room.buyer_id ? room.seller_id : room.buyer_id
      
      await DB.prepare(`
        INSERT INTO notifications 
          (user_id, type, title, message, related_id, related_type, action_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        receiverId,
        'message',
        '新しいメッセージが届きました',
        message_text.substring(0, 100),
        roomId,
        'chat_room',
        `/chat/${roomId}`
      ).run()
    }

    return c.json({ success: true, data: { id: messageId } })
  } catch (error) {
    console.error('Send message error:', error)
    return c.json({ success: false, error: 'メッセージの送信に失敗しました' }, 500)
  }
})

// メッセージ既読
chat.put('/rooms/:roomId/read', async (c) => {
  try {
    const { DB } = c.env
    const roomId = c.req.param('roomId')
    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json({ success: false, error: 'ユーザーIDが必要です' }, 400)
    }

    await DB.prepare(`
      UPDATE chat_messages 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE room_id = ? AND sender_id != ? AND is_read = 0
    `).bind(roomId, user_id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    return c.json({ success: false, error: '既読処理に失敗しました' }, 500)
  }
})

export default chat
