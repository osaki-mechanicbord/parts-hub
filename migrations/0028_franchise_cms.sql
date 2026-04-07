-- フランチャイズ募集ページCMS管理テーブル
CREATE TABLE IF NOT EXISTS franchise_cms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_by INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- パートナー（エリア別）管理テーブル
CREATE TABLE IF NOT EXISTS franchise_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pref_slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK(status IN ('recruiting','planned','closed')),
  partner_count INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 資料請求・問い合わせテーブル
CREATE TABLE IF NOT EXISTS franchise_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  area_pref TEXT,
  occupation TEXT,
  experience TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','in_progress','closed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期CMS データ挿入
INSERT OR IGNORE INTO franchise_cms (key, value_json) VALUES
  ('hero_title', '"全国の整備工場と繋がる出品代行パートナー募集"'),
  ('hero_subtitle', '"PARTS HUBの出品代行パートナーとして、地域の整備工場の余剰パーツを全国に届けませんか？"'),
  ('initial_fee', '"150000"'),
  ('monthly_fee', '"0"'),
  ('commission_rate', '"5"'),
  ('platform_fee_rate', '"10"'),
  ('target_income_light', '"125000"'),
  ('target_income_standard', '"250000"'),
  ('target_income_heavy', '"700000"'),
  ('light_listings', '"50"'),
  ('standard_listings', '"100"'),
  ('heavy_listings', '"200"'),
  ('light_avg_price', '"5000"'),
  ('standard_avg_price', '"5000"'),
  ('heavy_avg_price', '"7000"'),
  ('is_published', '"true"'),
  ('job_description', '["工場訪問・情報ヒアリング","パーツの撮影・出品登録","問い合わせ・価格交渉対応","売上管理・報酬受取"]'),
  ('benefits', '["在庫リスクなし - パーツは工場に保管","初期費用のみ - 月額固定費ゼロ","自分のペースで - 副業としても可能","全国ネットワーク - 本部のSEO集客力を活用"]'),
  ('faq', '[{"q":"資格は必要ですか？","a":"特別な資格は不要です。自動車整備の知識があれば有利ですが、研修で必要なスキルを習得できます。"},{"q":"副業でも可能ですか？","a":"はい、副業として月10〜15万円の収入を得ているパートナーもいます。週末だけの活動でも十分な成果が見込めます。"},{"q":"在庫を仕入れる必要はありますか？","a":"いいえ。パーツは整備工場に保管されたままです。売れた場合に工場から直接発送します。"},{"q":"初期費用の内訳は？","a":"研修費用・マニュアル・管理画面アクセス権・初回営業ツールが含まれます。"},{"q":"どのエリアでも活動できますか？","a":"はい、基本的に全国どこでも活動可能です。ただし、既にパートナーがいるエリアでは調整が必要な場合があります。"},{"q":"収入の目安は？","a":"副業（月50件出品）で約12.5万円、標準（月100件）で約25万円、本格活動（月200件）で約70万円が目安です。"}]');

-- 全47都道府県の初期データ（全て募集中）
INSERT OR IGNORE INTO franchise_areas (pref_slug, status, partner_count) VALUES
  ('hokkaido', 'recruiting', 0), ('aomori', 'recruiting', 0), ('iwate', 'recruiting', 0),
  ('miyagi', 'recruiting', 0), ('akita', 'recruiting', 0), ('yamagata', 'recruiting', 0),
  ('fukushima', 'recruiting', 0), ('ibaraki', 'recruiting', 0), ('tochigi', 'recruiting', 0),
  ('gunma', 'recruiting', 0), ('saitama', 'recruiting', 0), ('chiba', 'recruiting', 0),
  ('tokyo', 'recruiting', 0), ('kanagawa', 'recruiting', 0), ('niigata', 'recruiting', 0),
  ('toyama', 'recruiting', 0), ('ishikawa', 'recruiting', 0), ('fukui', 'recruiting', 0),
  ('yamanashi', 'recruiting', 0), ('nagano', 'recruiting', 0), ('gifu', 'recruiting', 0),
  ('shizuoka', 'recruiting', 0), ('aichi', 'recruiting', 0), ('mie', 'recruiting', 0),
  ('shiga', 'recruiting', 0), ('kyoto', 'recruiting', 0), ('osaka', 'recruiting', 0),
  ('hyogo', 'recruiting', 0), ('nara', 'recruiting', 0), ('wakayama', 'recruiting', 0),
  ('tottori', 'recruiting', 0), ('shimane', 'recruiting', 0), ('okayama', 'recruiting', 0),
  ('hiroshima', 'recruiting', 0), ('yamaguchi', 'recruiting', 0), ('tokushima', 'recruiting', 0),
  ('kagawa', 'recruiting', 0), ('ehime', 'recruiting', 0), ('kochi', 'recruiting', 0),
  ('fukuoka', 'recruiting', 0), ('saga', 'recruiting', 0), ('nagasaki', 'recruiting', 0),
  ('kumamoto', 'recruiting', 0), ('oita', 'recruiting', 0), ('miyazaki', 'recruiting', 0),
  ('kagoshima', 'recruiting', 0), ('okinawa', 'recruiting', 0);
