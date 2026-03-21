-- 大カテゴリ初期データ
INSERT INTO categories (name, slug, icon, display_order) VALUES
  ('エンジン関連部品', 'engine-parts', 'engine', 1),
  ('駆動系部品', 'drivetrain-parts', 'gear', 2),
  ('ボディパーツ', 'body-parts', 'car', 3),
  ('電装部品', 'electrical-parts', 'bolt', 4),
  ('内装部品', 'interior-parts', 'seat', 5),
  ('外装部品', 'exterior-parts', 'paint-brush', 6),
  ('足回り部品', 'suspension-parts', 'wheel', 7),
  ('工具・機器', 'tools-equipment', 'wrench', 8),
  ('消耗品', 'consumables', 'oil-can', 9),
  ('その他', 'others', 'box', 99);

-- メーカー初期データ
INSERT INTO car_makers (name, name_en, display_order) VALUES
  ('トヨタ', 'TOYOTA', 1),
  ('日産', 'NISSAN', 2),
  ('ホンダ', 'HONDA', 3),
  ('マツダ', 'MAZDA', 4),
  ('スバル', 'SUBARU', 5),
  ('スズキ', 'SUZUKI', 6),
  ('ダイハツ', 'DAIHATSU', 7),
  ('三菱', 'MITSUBISHI', 8),
  ('レクサス', 'LEXUS', 9),
  ('いすゞ', 'ISUZU', 10),
  ('日野', 'HINO', 11),
  ('輸入車その他', 'IMPORT', 99);

-- サブカテゴリ初期データ（エンジン関連）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (1, 'エンジン本体', 'engine-block', 1),
  (1, 'タービン', 'turbo', 2),
  (1, 'インタークーラー', 'intercooler', 3),
  (1, 'マフラー', 'exhaust', 4),
  (1, 'エアクリーナー', 'air-cleaner', 5);

-- サブカテゴリ初期データ（駆動系）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (2, 'ミッション', 'transmission', 1),
  (2, 'クラッチ', 'clutch', 2),
  (2, 'デファレンシャル', 'differential', 3),
  (2, 'ドライブシャフト', 'drive-shaft', 4);

-- サブカテゴリ初期データ（ボディパーツ）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (3, 'ドア', 'door', 1),
  (3, 'ボンネット', 'hood', 2),
  (3, 'フェンダー', 'fender', 3),
  (3, 'バンパー', 'bumper', 4),
  (3, 'トランク', 'trunk', 5);

-- サブカテゴリ初期データ（電装部品）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (4, 'バッテリー', 'battery', 1),
  (4, 'オルタネーター', 'alternator', 2),
  (4, 'スターター', 'starter', 3),
  (4, 'ECU', 'ecu', 4),
  (4, 'ヘッドライト', 'headlight', 5),
  (4, 'テールランプ', 'taillight', 6);

-- サブカテゴリ初期データ（内装部品）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (5, 'シート', 'seat', 1),
  (5, 'ダッシュボード', 'dashboard', 2),
  (5, 'ステアリング', 'steering', 3),
  (5, 'メーター', 'meter', 4);

-- サブカテゴリ初期データ（外装部品）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (6, 'エアロパーツ', 'aero-parts', 1),
  (6, 'ミラー', 'mirror', 2),
  (6, 'ウィンドウ', 'window', 3),
  (6, 'グリル', 'grill', 4);

-- サブカテゴリ初期データ（足回り部品）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (7, 'ホイール', 'wheel', 1),
  (7, 'タイヤ', 'tire', 2),
  (7, 'ブレーキ', 'brake', 3),
  (7, 'サスペンション', 'suspension', 4);

-- サブカテゴリ初期データ（工具・機器）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (8, '診断機', 'diagnostic-tool', 1),
  (8, '整備工具', 'mechanic-tool', 2),
  (8, 'リフト', 'lift', 3),
  (8, '測定器', 'measuring-tool', 4);

-- サブカテゴリ初期データ（消耗品）
INSERT INTO subcategories (category_id, name, slug, display_order) VALUES
  (9, 'オイル', 'oil', 1),
  (9, 'フィルター', 'filter', 2),
  (9, 'ワイパー', 'wiper', 3),
  (9, 'ブレーキパッド', 'brake-pad', 4);

-- デフォルト管理者アカウント (パスワード: admin123)
-- 実運用前に必ず変更してください
INSERT INTO admins (email, password_hash, name, role) VALUES
  ('admin@webapp.local', '$2a$10$example.hash.replace.this.in.production', 'システム管理者', 'admin');
