-- テスト用の適合情報データ

-- 商品1（プリウスドア）の適合情報
INSERT OR IGNORE INTO product_compatibility (
  product_id, maker_id, model_id, year_from, year_to,
  model_code, grade, engine_type, drive_type,
  oem_part_number, verification_method, confidence_level,
  fitment_notes
) VALUES (
  1, 1, 1, 2009, 2015,
  'ZVW30', 'S,G,L', '2ZR-FXE', 'FF',
  '67002-47130', 'actual_vehicle', 5,
  'プリウス30系の全グレード対応。マイナーチェンジ前後共通です。'
);

-- 商品2（セレナエンジン）の適合情報
INSERT OR IGNORE INTO product_compatibility (
  product_id, maker_id, model_id, year_from, year_to,
  model_code, grade, engine_type, drive_type,
  oem_part_number, verification_method, confidence_level,
  fitment_notes
) VALUES (
  2, 2, 2, 2010, 2016,
  'C26', 'X,XS,ハイウェイスター', 'MR20DD', 'FF',
  '10102-4BA0A', 'actual_vehicle', 5,
  'セレナC26のMR20DDエンジン搭載車全般に対応。'
);

-- 商品3（フィットミッション）の適合情報
INSERT OR IGNORE INTO product_compatibility (
  product_id, maker_id, model_id, year_from, year_to,
  model_code, grade, transmission_type, drive_type,
  oem_part_number, verification_method, confidence_level,
  fitment_notes
) VALUES (
  3, 3, 3, 2007, 2013,
  'GE6,GE7,GE8,GE9', 'RS', '5MT', 'FF',
  '20011-RB1-000', 'part_number', 5,
  'フィットGE系のRSグレード（5MT）専用です。CVT車には適合しません。'
);

-- 商品4（アクセラヘッドライト）の適合情報
INSERT OR IGNORE INTO product_compatibility (
  product_id, maker_id, model_id, year_from, year_to,
  model_code, grade,
  oem_part_number, verification_method, confidence_level,
  fitment_notes, special_requirements
) VALUES (
  4, 4, 4, 2013, 2019,
  'BM5FS,BM5AS,BMEFS', '15S,20S,22XD',
  'BHP9-51-041', 'catalog', 4,
  '2016年7月のマイナーチェンジ後モデル対応。',
  'マイナーチェンジ前モデルには形状が異なるため装着不可'
);

-- 商品5（レガシィタービン）の適合情報
INSERT OR IGNORE INTO product_compatibility (
  product_id, maker_id, model_id, year_from, year_to,
  model_code, grade, engine_type,
  oem_part_number, verification_method, confidence_level,
  fitment_notes
) VALUES (
  5, 5, 5, 2003, 2009,
  'BP5,BL5', 'GT,GT-B', 'EJ20ターボ',
  '14411-AA700', 'actual_vehicle', 5,
  'レガシィBP5/BL5のEJ20ターボエンジン搭載車に対応。'
);

-- 商品6（スキャンツール）の汎用部品情報
INSERT OR IGNORE INTO universal_parts (
  product_id, part_type, universal_category,
  compatible_makers, compatible_years,
  specifications, notes
) VALUES (
  6, 'スキャンツール', '診断機器',
  'トヨタ,日産,ホンダ,マツダ,スバル,スズキ,ダイハツ,三菱', '1996-2024',
  '{"protocol": "OBD2", "connector": "16pin", "display": "LCD"}',
  'OBD2対応の国産車全般に使用可能。1996年以降の車両対応。'
);

-- テスト用ユーザー車両登録
INSERT OR IGNORE INTO user_vehicles (
  user_id, nickname, maker_id, model_id, year,
  model_code, grade, engine_type, drive_type, transmission_type,
  is_primary
) VALUES
  (1, 'マイカー（プリウス）', 1, 1, 2012, 'DAA-ZVW30', 'S', '2ZR-FXE', 'FF', 'CVT', 1),
  (2, '社用車1号', 2, 2, 2014, 'DBA-C26', 'ハイウェイスター', 'MR20DD', 'FF', 'CVT', 1),
  (3, '通勤車（フィット）', 3, 3, 2010, 'DBA-GE6', 'RS', '1.5L', 'FF', '5MT', 1);

-- テスト用適合確認フィードバック
INSERT OR IGNORE INTO fitment_confirmations (
  product_id, user_id, user_vehicle_id, fits, fit_quality,
  installation_difficulty, notes, helpful_count
) VALUES
  (1, 2, 1, 1, 5, 3, '問題なく取付できました。ボルト穴もピッタリです。', 5),
  (1, 3, 1, 1, 5, 2, '完璧にフィットしました。純正同等の品質です。', 3),
  (2, 1, 2, 1, 5, 5, 'エンジン載せ替え作業は大変でしたが、適合は完璧です。', 8),
  (3, 2, 3, 1, 5, 4, 'MTミッション交換。ギアの入りも良好です。', 6);

-- テスト用品番マスター
INSERT OR IGNORE INTO part_number_master (
  part_number, part_type, manufacturer, part_name,
  maker_id, compatible_models, description,
  data_source, contribution_count, verified
) VALUES
  ('67002-47130', '純正', 'トヨタ', 'フロントドア左', 1, 
   '["プリウス ZVW30 (2009-2015)"]', 
   'プリウス30系の左フロントドアASSY',
   'user_contributed', 3, 1),
  
  ('10102-4BA0A', '純正', '日産', 'エンジン本体', 2,
   '["セレナ C26 (2010-2016)"]',
   'MR20DDエンジン完成品',
   'user_contributed', 2, 1),
  
  ('20011-RB1-000', '純正', 'ホンダ', 'ミッションASSY', 3,
   '["フィット GE6-9 (2007-2013)"]',
   '5速MTミッション',
   'user_contributed', 1, 0);
