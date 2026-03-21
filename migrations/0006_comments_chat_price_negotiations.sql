-- 商品コメント・質問テーブル
CREATE TABLE IF NOT EXISTS product_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_comment_id INTEGER, -- 返信の場合は親コメントID
  comment_text TEXT NOT NULL,
  is_question BOOLEAN DEFAULT 0, -- 質問かどうか
  is_answered BOOLEAN DEFAULT 0, -- 質問が回答済みかどうか
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME, -- ソフトデリート
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES product_comments(id) ON DELETE CASCADE
);

-- コメントテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent_id ON product_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);

-- チャットルームテーブル
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- active, archived, closed
  last_message_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(product_id, buyer_id, seller_id) -- 同じ商品・購入者・出品者の組み合わせは1つのルームのみ
);

-- チャットルームのインデックス
CREATE INDEX IF NOT EXISTS idx_chat_rooms_product_id ON chat_rooms(product_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_buyer_id ON chat_rooms(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_seller_id ON chat_rooms(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC);

-- チャットメッセージテーブル
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, system, price_offer
  metadata TEXT, -- JSON形式で追加データを保存（画像URL、値下げ額など）
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- チャットメッセージのインデックス
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- 値下げ交渉テーブル
CREATE TABLE IF NOT EXISTS price_negotiations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  original_price INTEGER NOT NULL, -- 元の価格
  requested_price INTEGER NOT NULL, -- 希望価格
  counter_price INTEGER, -- 出品者の提示価格
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, countered, expired
  message TEXT, -- 値下げリクエストのメッセージ
  seller_response TEXT, -- 出品者の返信
  expires_at DATETIME, -- 有効期限（24時間など）
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 値下げ交渉のインデックス
CREATE INDEX IF NOT EXISTS idx_price_negotiations_product_id ON price_negotiations(product_id);
CREATE INDEX IF NOT EXISTS idx_price_negotiations_buyer_id ON price_negotiations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_price_negotiations_seller_id ON price_negotiations(seller_id);
CREATE INDEX IF NOT EXISTS idx_price_negotiations_status ON price_negotiations(status);
CREATE INDEX IF NOT EXISTS idx_price_negotiations_created_at ON price_negotiations(created_at DESC);

-- 価格変更履歴テーブル
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  changed_by INTEGER NOT NULL, -- 変更したユーザーID
  reason TEXT, -- 変更理由（値下げ交渉、セール、など）
  negotiation_id INTEGER, -- 値下げ交渉に基づく場合
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (negotiation_id) REFERENCES price_negotiations(id) ON DELETE SET NULL
);

-- 価格履歴のインデックス
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON price_history(created_at DESC);

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- comment, message, price_offer, price_accepted, price_rejected, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id INTEGER, -- 関連するID（商品ID、コメントID、チャットルームIDなど）
  related_type TEXT, -- product, comment, chat_room, negotiation
  action_url TEXT, -- クリック時の遷移先URL
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 通知のインデックス
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
