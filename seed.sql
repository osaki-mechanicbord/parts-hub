-- テスト用車種データ
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, year_from, year_to) VALUES
  (1, 'プリウス', 'ZVW30', 2009, 2015),
  (2, 'セレナ', 'C26', 2010, 2016),
  (3, 'フィット', 'GE6-9', 2007, 2013),
  (4, 'アクセラ', 'BM/BY', 2013, 2019),
  (5, 'レガシィ', 'BP5', 2003, 2009);

-- テスト用ユーザーデータ
-- パスワード: password123 (実運用前に変更必須)
INSERT OR IGNORE INTO users (email, password_hash, shop_name, shop_type, postal_code, prefecture, city, address, phone, is_verified, rating, total_sales, total_purchases) VALUES
  ('shop1@example.com', '$2a$10$example.hash.replace.this', '山田自動車整備工場', 'factory', '100-0001', '東京都', '千代田区', '千代田1-1-1', '03-1234-5678', 1, 4.8, 50, 20),
  ('shop2@example.com', '$2a$10$example.hash.replace.this', '田中モータース', 'factory', '150-0001', '東京都', '渋谷区', '神宮前2-2-2', '03-2345-6789', 1, 4.5, 30, 15),
  ('user1@example.com', '$2a$10$example.hash.replace.this', '佐藤太郎', 'individual', '160-0001', '東京都', '新宿区', '新宿3-3-3', '090-1111-2222', 1, 4.2, 10, 25);

-- テスト用商品データ
INSERT OR IGNORE INTO products (seller_id, title, description, price, category_id, subcategory_id, maker_id, model_id, part_number, compatible_models, condition, status, view_count, favorite_count) VALUES
  (1, 'トヨタ プリウス 30系 フロントドア 左側 純正', '2010年式プリウス30系の左フロントドアです。
小傷はありますが、大きな凹みやサビはありません。
動作確認済み、パワーウィンドウ正常動作します。', 25000, 3, 10, 1, 1, '67002-47130', 'プリウス 30系 (2009-2015)', 'good', 'active', 45, 3),
  
  (1, '日産 セレナ C26 エンジン本体 MR20DD', 'セレナC26のMR20DDエンジンです。
走行距離8万キロ、圧縮良好。
オイル漏れなし、異音なし。', 80000, 1, 1, 2, 2, '10102-4BA0A', 'セレナ C26 (2010-2016)', 'good', 'active', 78, 8),
  
  (2, 'ホンダ フィット GE6 ミッション MT 純正', 'フィットGE6の5速MTミッションです。
ギア抜け、異音なし。
クラッチも良好です。', 50000, 2, 6, 3, 3, '20011-RB1-000', 'フィット GE6-9 (2007-2013)', 'like_new', 'active', 62, 12),
  
  (2, 'マツダ アクセラ BM系 ヘッドライト 右 LED', 'アクセラBM系の右ヘッドライトです。
LED仕様、曇りなし、動作確認済み。', 35000, 4, 19, 4, 4, 'BHP9-51-041', 'アクセラ BM/BY系 (2013-2019)', 'good', 'active', 33, 5),
  
  (3, 'スバル レガシィ BP5 タービン VF40', 'レガシィBP5のVF40タービンです。
約5万キロ走行、オイル漏れなし。
ブーストも正常です。', 45000, 1, 2, 5, 5, '14411-AA700', 'レガシィ BP5 (2003-2009)', 'good', 'active', 91, 15),
  
  (1, '整備工場用 スキャンツール OBD2対応', '各メーカー対応のスキャンツールです。
ほとんど使用していないため美品です。', 15000, 8, 34, NULL, NULL, NULL, NULL, 'like_new', 'active', 28, 6);

-- テスト用商品画像データ（ダミーURL）
INSERT OR IGNORE INTO product_images (product_id, image_url, image_key, display_order) VALUES
  (1, 'https://example.com/images/door1-1.jpg', 'products/1/image1.jpg', 0),
  (1, 'https://example.com/images/door1-2.jpg', 'products/1/image2.jpg', 1),
  (2, 'https://example.com/images/engine1-1.jpg', 'products/2/image1.jpg', 0),
  (3, 'https://example.com/images/trans1-1.jpg', 'products/3/image1.jpg', 0),
  (4, 'https://example.com/images/light1-1.jpg', 'products/4/image1.jpg', 0),
  (5, 'https://example.com/images/turbo1-1.jpg', 'products/5/image1.jpg', 0),
  (6, 'https://example.com/images/tool1-1.jpg', 'products/6/image1.jpg', 0);

-- テスト用お気に入りデータ
INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES
  (2, 1),
  (3, 1),
  (3, 2),
  (1, 3);
