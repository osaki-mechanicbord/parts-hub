-- 問い合わせ管理テーブル
-- サイト全体のお問い合わせを一元管理
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 問い合わせ種別: general, proxy_onsite, proxy_shipping, technical, payment, product_question, other
  inquiry_type TEXT NOT NULL DEFAULT 'general',
  -- 送信者情報
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  -- 問い合わせ内容
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  -- 関連情報（商品問い合わせの場合）
  product_id INTEGER DEFAULT NULL,
  user_id INTEGER DEFAULT NULL,
  -- 管理用
  status TEXT NOT NULL DEFAULT 'new',  -- new, in_progress, resolved, closed
  admin_note TEXT DEFAULT '',
  replied_at DATETIME DEFAULT NULL,
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_type ON contact_inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
