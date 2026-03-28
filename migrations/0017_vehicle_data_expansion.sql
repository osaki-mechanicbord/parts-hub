-- =====================================================
-- 適合車両情報データベース拡充
-- 本番未反映・ローカルテスト用
-- =====================================================

-- ============ スキーマ拡張 ============

-- car_models にgenerationカラム追加（世代名: 例「5代目」「E90系」）
ALTER TABLE car_models ADD COLUMN generation TEXT;
-- car_models にengine_typeカラム追加（エンジン型式: 例「2ZR-FXE」）
ALTER TABLE car_models ADD COLUMN engine_type TEXT;
-- car_models にbody_typeカラム追加（ボディタイプ: セダン/SUV/ミニバン等）
ALTER TABLE car_models ADD COLUMN body_type TEXT;
-- car_models にdisplay_orderカラム追加
ALTER TABLE car_models ADD COLUMN display_order INTEGER DEFAULT 0;

-- グレードテーブル新設
CREATE TABLE IF NOT EXISTS car_grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  engine_type TEXT,
  displacement INTEGER,       -- 排気量(cc)
  transmission TEXT,           -- AT/MT/CVT
  drive_type TEXT,             -- FF/FR/4WD/AWD
  fuel_type TEXT,              -- ガソリン/ディーゼル/ハイブリッド/EV/PHEV
  door_count INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES car_models(id)
);

CREATE INDEX IF NOT EXISTS idx_car_grades_model ON car_grades(model_id);

-- ============ メーカー拡充 ============

-- 国産メーカー追加（既存: トヨタ,ホンダ,日産,マツダ,スバル,スズキ,ダイハツ,三菱,いすゞ,日野,レクサス）
INSERT OR IGNORE INTO car_makers (name, name_en, country, display_order, is_active) VALUES
('光岡', 'MITSUOKA', 'JP', 12, 1),
('UDトラックス', 'UD TRUCKS', 'JP', 13, 1),
('ポルシェ', 'PORSCHE', 'DE', 20, 1),
('MINI', 'MINI', 'GB', 21, 1),
('ボルボ', 'VOLVO', 'SE', 22, 1),
('プジョー', 'PEUGEOT', 'FR', 23, 1),
('シトロエン', 'CITROEN', 'FR', 24, 1),
('ルノー', 'RENAULT', 'FR', 25, 1),
('フィアット', 'FIAT', 'IT', 26, 1),
('アルファロメオ', 'ALFA ROMEO', 'IT', 27, 1),
('ジャガー', 'JAGUAR', 'GB', 28, 1),
('ランドローバー', 'LAND ROVER', 'GB', 29, 1),
('フォード', 'FORD', 'US', 30, 1),
('シボレー', 'CHEVROLET', 'US', 31, 1),
('ジープ', 'JEEP', 'US', 32, 1),
('テスラ', 'TESLA', 'US', 33, 1),
('ヒョンデ', 'HYUNDAI', 'KR', 34, 1),
('BYD', 'BYD', 'CN', 35, 1);

-- ============ 車種データ大量投入 ============

-- ===== トヨタ（maker_id=1）=====
-- 既存: 86/GR86, アクア, カローラ, ハイエース, プリウス, ヤリス, ランドクルーザー
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
-- プリウス歴代
(1, 'プリウス', 'MXWH60', '5代目', 2023, 2026, 'セダン', '2ZR-FXE', 1),
(1, 'プリウス', 'ZVW50', '4代目', 2015, 2023, 'セダン', '2ZR-FXE', 2),
(1, 'プリウス', 'ZVW30', '3代目', 2009, 2015, 'セダン', '2ZR-FXE', 3),
(1, 'プリウス', 'NHW20', '2代目', 2003, 2009, 'セダン', '1NZ-FXE', 4),
-- クラウン
(1, 'クラウン', 'AZSH35', '16代目 クロスオーバー', 2022, 2026, 'セダン', 'A25A-FXS', 5),
(1, 'クラウン', 'GRS210', '14代目', 2012, 2018, 'セダン', '4GR-FSE', 6),
-- カムリ
(1, 'カムリ', 'AXVH70', '10代目', 2017, 2024, 'セダン', 'A25A-FXS', 7),
-- RAV4
(1, 'RAV4', 'MXAA54', '5代目', 2019, 2026, 'SUV', 'M20A-FKS', 8),
(1, 'RAV4', 'ACA36W', '3代目', 2005, 2013, 'SUV', '2AZ-FE', 9),
-- ハリアー
(1, 'ハリアー', 'MXUA80', '4代目', 2020, 2026, 'SUV', 'M20A-FKS', 10),
(1, 'ハリアー', 'ZSU60W', '3代目', 2013, 2020, 'SUV', '3ZR-FAE', 11),
-- ヴォクシー/ノア
(1, 'ヴォクシー', 'MZRA95W', '4代目 R90', 2022, 2026, 'ミニバン', 'M20A-FKS', 12),
(1, 'ヴォクシー', 'ZRR80', '3代目 R80', 2014, 2022, 'ミニバン', '3ZR-FAE', 13),
(1, 'ノア', 'MZRA90W', '4代目 R90', 2022, 2026, 'ミニバン', 'M20A-FKS', 14),
-- アルファード/ヴェルファイア
(1, 'アルファード', 'AAHH40W', '4代目 40系', 2023, 2026, 'ミニバン', 'A25A-FXS', 15),
(1, 'アルファード', 'AGH30W', '3代目 30系', 2015, 2023, 'ミニバン', '2AR-FE', 16),
(1, 'ヴェルファイア', 'AAHH45W', '4代目 40系', 2023, 2026, 'ミニバン', 'A25A-FXS', 17),
-- シエンタ
(1, 'シエンタ', 'MXPL10G', '3代目', 2022, 2026, 'ミニバン', 'M15A-FXE', 18),
(1, 'シエンタ', 'NHP170G', '2代目', 2015, 2022, 'ミニバン', '1NZ-FXE', 19),
-- C-HR
(1, 'C-HR', 'ZYX11', '2代目', 2023, 2026, 'SUV', 'M20A-FXS', 20),
(1, 'C-HR', 'NGX50', '初代', 2016, 2023, 'SUV', '8NR-FTS', 21),
-- スープラ
(1, 'GRスープラ', 'DB42', 'A90', 2019, 2026, 'クーペ', 'B58', 22),
(1, 'スープラ', 'JZA80', 'A80', 1993, 2002, 'クーペ', '2JZ-GTE', 23),
-- ハイラックス
(1, 'ハイラックス', 'GUN125', '8代目', 2017, 2026, 'ピックアップ', '2GD-FTV', 24),
-- GRヤリス
(1, 'GRヤリス', 'GXPA16', null, 2020, 2026, 'ハッチバック', 'G16E-GTS', 25),
-- ルーミー
(1, 'ルーミー', 'M900A', null, 2016, 2026, 'トールワゴン', '1KR-FE', 26),
-- コペン GR SPORT
(1, 'ライズ', 'A200A', null, 2019, 2026, 'SUV', '1KR-VET', 27);

-- ===== ホンダ（maker_id=2）=====
-- 既存: N-BOX, シビック, フィット, ヴェゼル
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(2, 'N-BOX', 'JF5', '3代目', 2023, 2026, '軽自動車', 'S07B', 1),
(2, 'N-BOX', 'JF3', '2代目', 2017, 2023, '軽自動車', 'S07B', 2),
(2, 'N-BOX', 'JF1', '初代', 2011, 2017, '軽自動車', 'S07A', 3),
(2, 'フィット', 'GR1', '4代目', 2020, 2026, 'ハッチバック', 'L13B', 4),
(2, 'フィット', 'GK3', '3代目', 2013, 2020, 'ハッチバック', 'L13B', 5),
(2, 'シビック', 'FL1', '11代目', 2021, 2026, 'セダン', 'L15C', 6),
(2, 'シビック タイプR', 'FL5', 'FK→FL', 2022, 2026, 'ハッチバック', 'K20C', 7),
(2, 'シビック タイプR', 'FK8', 'FK8', 2017, 2021, 'ハッチバック', 'K20C', 8),
(2, 'ヴェゼル', 'RV3', '2代目', 2021, 2026, 'SUV', 'L15Z', 9),
(2, 'ヴェゼル', 'RU1', '初代', 2013, 2021, 'SUV', 'L15B', 10),
(2, 'フリード', 'GB5', '2代目', 2016, 2024, 'ミニバン', 'L15B', 11),
(2, 'フリード', 'GB8', '3代目', 2024, 2026, 'ミニバン', 'L15Z', 12),
(2, 'ステップワゴン', 'RP8', '6代目', 2022, 2026, 'ミニバン', 'L15C', 13),
(2, 'ステップワゴン', 'RP1', '5代目', 2015, 2022, 'ミニバン', 'L15B', 14),
(2, 'ZR-V', 'RZ3', null, 2023, 2026, 'SUV', 'L15C', 15),
(2, 'CR-V', 'RT5', '5代目', 2018, 2022, 'SUV', 'L15B', 16),
(2, 'S660', 'JW5', null, 2015, 2022, '軽自動車', 'S07A', 17),
(2, 'N-WGN', 'JH3', '2代目', 2019, 2026, '軽自動車', 'S07B', 18),
(2, 'N-ONE', 'JG3', '2代目', 2020, 2026, '軽自動車', 'S07B', 19);

-- ===== 日産（maker_id=3）=====
-- 既存: スカイライン, セレナ, ノート, フェアレディZ
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(3, 'ノート', 'E13', '3代目 e-POWER', 2020, 2026, 'ハッチバック', 'HR12DE', 1),
(3, 'ノート', 'E12', '2代目', 2012, 2020, 'ハッチバック', 'HR12DE', 2),
(3, 'セレナ', 'C28', '6代目', 2022, 2026, 'ミニバン', 'MR20DD', 3),
(3, 'セレナ', 'C27', '5代目', 2016, 2022, 'ミニバン', 'MR20DD', 4),
(3, 'エクストレイル', 'T33', '4代目 e-POWER', 2022, 2026, 'SUV', 'KR15DDT', 5),
(3, 'エクストレイル', 'T32', '3代目', 2013, 2022, 'SUV', 'MR20DD', 6),
(3, 'フェアレディZ', 'RZ34', 'Z34後期', 2022, 2026, 'クーペ', 'VR30DDTT', 7),
(3, 'フェアレディZ', 'Z34', 'Z34前期', 2008, 2022, 'クーペ', 'VQ37VHR', 8),
(3, 'スカイライン', 'RV37', 'V37', 2019, 2026, 'セダン', 'VR30DDTT', 9),
(3, 'GT-R', 'R35', null, 2007, 2025, 'クーペ', 'VR38DETT', 10),
(3, 'リーフ', 'ZE1', '2代目', 2017, 2026, 'ハッチバック', 'EM57', 11),
(3, 'アリア', 'FE0', null, 2022, 2026, 'SUV', 'モーター', 12),
(3, 'キックス', 'P15', null, 2020, 2026, 'SUV', 'HR12DE', 13),
(3, 'デイズ', 'B40W', '3代目', 2019, 2026, '軽自動車', 'BR06', 14),
(3, 'ルークス', 'B44A', null, 2020, 2026, '軽自動車', 'BR06', 15),
(3, 'NV350キャラバン', 'E26', null, 2012, 2026, 'バン', 'QR20DE', 16);

-- ===== マツダ（maker_id=4）=====
-- 既存: CX-5, MAZDA3, ロードスター
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(4, 'CX-5', 'KF', '2代目', 2017, 2026, 'SUV', 'PE-VPS', 1),
(4, 'CX-5', 'KE', '初代', 2012, 2017, 'SUV', 'PE-VPS', 2),
(4, 'MAZDA3', 'BP', null, 2019, 2026, 'セダン/HB', 'PE-VPS', 3),
(4, 'CX-60', 'KH', null, 2022, 2026, 'SUV', 'SH-VPTS', 4),
(4, 'CX-30', 'DM', null, 2019, 2026, 'SUV', 'PE-VPS', 5),
(4, 'CX-8', 'KG', null, 2017, 2023, 'SUV', 'SH-VPTS', 6),
(4, 'MAZDA2', 'DJ', null, 2014, 2026, 'ハッチバック', 'P5-VPS', 7),
(4, 'ロードスター', 'ND5RC', 'ND', 2015, 2026, 'オープン', 'PE-VPR', 8),
(4, 'ロードスター', 'NCEC', 'NC', 2005, 2015, 'オープン', 'LF-VE', 9),
(4, 'ロードスター', 'NB8C', 'NB', 1998, 2005, 'オープン', 'BP-VE', 10),
(4, 'RX-7', 'FD3S', '3代目', 1991, 2002, 'クーペ', '13B-REW', 11),
(4, 'RX-8', 'SE3P', null, 2003, 2012, 'クーペ', '13B-MSP', 12);

-- ===== スバル（maker_id=5）=====
-- 既存: BRZ, インプレッサ, フォレスター
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(5, 'レヴォーグ', 'VN5', '2代目', 2020, 2026, 'ステーションワゴン', 'CB18', 1),
(5, 'レヴォーグ', 'VM4', '初代', 2014, 2020, 'ステーションワゴン', 'FB16', 2),
(5, 'WRX S4', 'VBH', null, 2021, 2026, 'セダン', 'FA24', 3),
(5, 'WRX STI', 'VAB', null, 2014, 2019, 'セダン', 'EJ20', 4),
(5, 'フォレスター', 'SK9', '5代目', 2018, 2025, 'SUV', 'FB25', 5),
(5, 'フォレスター', 'SJ5', '4代目', 2012, 2018, 'SUV', 'FB20', 6),
(5, 'クロストレック', 'GU', null, 2022, 2026, 'SUV', 'FB20', 7),
(5, 'BRZ', 'ZD8', '2代目', 2021, 2026, 'クーペ', 'FA24', 8),
(5, 'BRZ', 'ZC6', '初代', 2012, 2021, 'クーペ', 'FA20', 9),
(5, 'レガシィ アウトバック', 'BT5', '6代目', 2021, 2026, 'ステーションワゴン', 'CB18', 10),
(5, 'レガシィ アウトバック', 'BS9', '5代目', 2014, 2021, 'ステーションワゴン', 'FB25', 11);

-- ===== スズキ（maker_id=6）=====
-- 既存: ジムニー, スイフト, ハスラー
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(6, 'ジムニー', 'JB64W', '4代目', 2018, 2026, '軽自動車', 'R06A', 1),
(6, 'ジムニー', 'JB23W', '3代目', 1998, 2018, '軽自動車', 'K6A', 2),
(6, 'ジムニーシエラ', 'JB74W', '4代目', 2018, 2026, 'SUV', 'K15B', 3),
(6, 'スイフトスポーツ', 'ZC33S', '4代目', 2017, 2026, 'ハッチバック', 'K14C', 4),
(6, 'スイフト', 'ZC83S', '4代目', 2017, 2026, 'ハッチバック', 'K12C', 5),
(6, 'ハスラー', 'MR52S', '2代目', 2020, 2026, '軽自動車', 'R06D', 6),
(6, 'ハスラー', 'MR31S', '初代', 2014, 2020, '軽自動車', 'R06A', 7),
(6, 'スペーシア', 'MK53S', '2代目', 2017, 2023, '軽自動車', 'R06A', 8),
(6, 'スペーシア', 'MK54S', '3代目', 2023, 2026, '軽自動車', 'R06D', 9),
(6, 'アルト', 'HA37S', '9代目', 2021, 2026, '軽自動車', 'R06D', 10),
(6, 'アルトワークス', 'HA36S', null, 2015, 2021, '軽自動車', 'R06A', 11),
(6, 'エブリイ', 'DA17V', null, 2015, 2026, '軽バン', 'R06A', 12),
(6, 'クロスビー', 'MN71S', null, 2017, 2026, 'SUV', 'K10C', 13),
(6, 'ソリオ', 'MA37S', '4代目', 2020, 2026, 'トールワゴン', 'K12C', 14);

-- ===== ダイハツ（maker_id=7）=====
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(7, 'タント', 'LA650S', '4代目', 2019, 2026, '軽自動車', 'KF', 1),
(7, 'タント', 'LA600S', '3代目', 2013, 2019, '軽自動車', 'KF', 2),
(7, 'ムーヴ', 'LA150S', '6代目', 2014, 2023, '軽自動車', 'KF', 3),
(7, 'ムーヴキャンバス', 'LA850S', '2代目', 2022, 2026, '軽自動車', 'KF', 4),
(7, 'ミラ イース', 'LA350S', '2代目', 2017, 2026, '軽自動車', 'KF', 5),
(7, 'タフト', 'LA900S', null, 2020, 2026, '軽自動車', 'KF', 6),
(7, 'ロッキー', 'A200S', null, 2019, 2026, 'SUV', '1KR-VET', 7),
(7, 'コペン', 'LA400K', null, 2014, 2026, '軽自動車', 'KF-VET', 8),
(7, 'ハイゼット カーゴ', 'S700V', null, 2021, 2026, '軽バン', 'KF', 9),
(7, 'ハイゼット トラック', 'S500P', null, 2014, 2026, '軽トラック', 'KF', 10),
(7, 'アトレー', 'S700V', null, 2021, 2026, '軽バン', 'KF-VET', 11);

-- ===== 三菱（maker_id=8）=====
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(8, 'デリカD:5', 'CV1W', null, 2007, 2026, 'ミニバン', '4N14', 1),
(8, 'アウトランダー', 'GN0W', '4代目 PHEV', 2021, 2026, 'SUV', '4B12', 2),
(8, 'アウトランダー', 'GF8W', '3代目 PHEV', 2012, 2021, 'SUV', '4B11', 3),
(8, 'エクリプスクロス', 'GK1W', null, 2018, 2026, 'SUV', '4B40', 4),
(8, 'ランサーエボリューション', 'CZ4A', 'X(10)', 2007, 2016, 'セダン', '4B11', 5),
(8, 'パジェロ', 'V98W', '4代目', 2006, 2019, 'SUV', '6G75', 6),
(8, 'eKワゴン', 'B33W', null, 2019, 2026, '軽自動車', 'BR06', 7),
(8, 'eKクロス', 'B34W', null, 2019, 2026, '軽自動車', 'BR06', 8),
(8, 'トライトン', 'KL1T', null, 2024, 2026, 'ピックアップ', '4N16', 9);

-- ===== レクサス（maker_id=11）=====
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(11, 'RX', 'AALH10', 'RX 5代目', 2022, 2026, 'SUV', 'A25A-FXS', 1),
(11, 'RX', 'AGL20W', 'RX 4代目', 2015, 2022, 'SUV', '2GR-FKS', 2),
(11, 'NX', 'AAZH20', 'NX 2代目', 2021, 2026, 'SUV', 'A25A-FXS', 3),
(11, 'NX', 'AGZ10', 'NX 初代', 2014, 2021, 'SUV', '8AR-FTS', 4),
(11, 'IS', 'ASE30', 'IS 3代目', 2013, 2026, 'セダン', '8AR-FTS', 5),
(11, 'LC', 'URZ100', null, 2017, 2026, 'クーペ', '2UR-GSE', 6),
(11, 'LS', 'VXFA50', null, 2017, 2026, 'セダン', 'V35A-FTS', 7),
(11, 'LBX', 'MAYH10', null, 2023, 2026, 'SUV', 'M15A-FXE', 8),
(11, 'UX', 'MZAA10', null, 2018, 2026, 'SUV', 'M20A-FKS', 9),
(11, 'RC', 'ASC10', null, 2014, 2026, 'クーペ', '8AR-FTS', 10);

-- ===== BMW（maker_id=12）=====
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(12, '3シリーズ', 'G20', 'G20/G21', 2019, 2026, 'セダン', 'B48', 1),
(12, '3シリーズ', 'F30', 'F30/F31', 2012, 2019, 'セダン', 'B48/N20', 2),
(12, '3シリーズ', 'E90', 'E90/E91', 2005, 2012, 'セダン', 'N52/N54', 3),
(12, '5シリーズ', 'G60', 'G60', 2023, 2026, 'セダン', 'B48/B58', 4),
(12, '5シリーズ', 'G30', 'G30/G31', 2017, 2023, 'セダン', 'B48/B58', 5),
(12, 'X3', 'G01', null, 2017, 2024, 'SUV', 'B48', 6),
(12, 'X5', 'G05', null, 2019, 2026, 'SUV', 'B58', 7),
(12, 'M3', 'G80', null, 2021, 2026, 'セダン', 'S58', 8),
(12, 'M4', 'G82', null, 2021, 2026, 'クーペ', 'S58', 9),
(12, '1シリーズ', 'F40', null, 2019, 2026, 'ハッチバック', 'B38/B48', 10),
(12, 'iX', 'I20', null, 2021, 2026, 'SUV', 'モーター', 11);

-- ===== メルセデス・ベンツ（maker_id=13）=====
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(13, 'Cクラス', 'W206', 'W206', 2021, 2026, 'セダン', 'M254', 1),
(13, 'Cクラス', 'W205', 'W205', 2014, 2021, 'セダン', 'M264/M274', 2),
(13, 'Eクラス', 'W214', 'W214', 2023, 2026, 'セダン', 'M254', 3),
(13, 'Eクラス', 'W213', 'W213', 2016, 2023, 'セダン', 'M264/M274', 4),
(13, 'Aクラス', 'W177', null, 2018, 2026, 'ハッチバック', 'M282', 5),
(13, 'GLAクラス', 'H247', null, 2020, 2026, 'SUV', 'M282', 6),
(13, 'GLCクラス', 'X254', null, 2022, 2026, 'SUV', 'M254', 7),
(13, 'GLEクラス', 'V167', null, 2019, 2026, 'SUV', 'M256/M276', 8),
(13, 'Gクラス', 'W463', null, 2018, 2026, 'SUV', 'M176', 9),
(13, 'Sクラス', 'W223', null, 2020, 2026, 'セダン', 'M256', 10),
(13, 'AMG GT', 'X290', null, 2018, 2026, 'クーペ', 'M177', 11);

-- ===== フォルクスワーゲン（maker_id=14）=====
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(14, 'ゴルフ', 'CD', 'ゴルフ8', 2021, 2026, 'ハッチバック', 'EA211evo', 1),
(14, 'ゴルフ', 'AU', 'ゴルフ7', 2013, 2021, 'ハッチバック', 'EA211', 2),
(14, 'ポロ', 'AW', null, 2018, 2026, 'ハッチバック', 'EA211evo', 3),
(14, 'T-Cross', 'C11', null, 2019, 2026, 'SUV', 'EA211', 4),
(14, 'T-Roc', 'A11', null, 2020, 2026, 'SUV', 'EA211', 5),
(14, 'ティグアン', 'AD1', null, 2016, 2026, 'SUV', 'EA888', 6),
(14, 'パサート', 'B8', null, 2015, 2026, 'セダン/SW', 'EA888', 7),
(14, 'ID.4', null, null, 2022, 2026, 'SUV', 'モーター', 8);

-- ===== アウディ（maker_id=15）=====
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
(15, 'A3', '8Y', null, 2021, 2026, 'セダン/HB', 'EA211evo', 1),
(15, 'A4', 'B9', null, 2016, 2026, 'セダン/SW', 'EA888', 2),
(15, 'Q3', 'F3', null, 2019, 2026, 'SUV', 'EA888', 3),
(15, 'Q5', 'FY', null, 2017, 2026, 'SUV', 'EA888', 4),
(15, 'A5', 'F5', null, 2017, 2026, 'クーペ', 'EA888', 5),
(15, 'Q7', '4M', null, 2015, 2026, 'SUV', 'EA839', 6),
(15, 'e-tron', 'GE', null, 2020, 2026, 'SUV', 'モーター', 7);

-- ===== 新メーカーの車種 =====

-- ポルシェ
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
((SELECT id FROM car_makers WHERE name_en='PORSCHE'), '911', '992', '992', 2019, 2026, 'クーペ', null, 1),
((SELECT id FROM car_makers WHERE name_en='PORSCHE'), '911', '991', '991', 2011, 2019, 'クーペ', null, 2),
((SELECT id FROM car_makers WHERE name_en='PORSCHE'), 'カイエン', 'E3', '3代目', 2018, 2026, 'SUV', null, 3),
((SELECT id FROM car_makers WHERE name_en='PORSCHE'), 'マカン', '95B', null, 2014, 2026, 'SUV', null, 4),
((SELECT id FROM car_makers WHERE name_en='PORSCHE'), 'ボクスター/ケイマン', '718', '718', 2016, 2026, 'オープン/クーペ', null, 5),
((SELECT id FROM car_makers WHERE name_en='PORSCHE'), 'タイカン', 'Y1A', null, 2020, 2026, 'セダン', 'モーター', 6);

-- MINI
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
((SELECT id FROM car_makers WHERE name_en='MINI'), 'MINI 3ドア', 'F56', 'F56', 2014, 2024, 'ハッチバック', 'B38/B48', 1),
((SELECT id FROM car_makers WHERE name_en='MINI'), 'MINI クラブマン', 'F54', null, 2015, 2024, 'ステーションワゴン', 'B38/B48', 2),
((SELECT id FROM car_makers WHERE name_en='MINI'), 'MINI クロスオーバー', 'F60', null, 2017, 2024, 'SUV', 'B38/B48', 3);

-- ボルボ
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
((SELECT id FROM car_makers WHERE name_en='VOLVO'), 'XC60', 'UB', '2代目', 2017, 2026, 'SUV', 'B420', 1),
((SELECT id FROM car_makers WHERE name_en='VOLVO'), 'XC40', 'XB', null, 2018, 2026, 'SUV', 'B420', 2),
((SELECT id FROM car_makers WHERE name_en='VOLVO'), 'V60', 'ZB', null, 2018, 2026, 'ステーションワゴン', 'B420', 3),
((SELECT id FROM car_makers WHERE name_en='VOLVO'), 'XC90', 'LC', '2代目', 2015, 2026, 'SUV', 'B420', 4),
((SELECT id FROM car_makers WHERE name_en='VOLVO'), 'EX30', null, null, 2024, 2026, 'SUV', 'モーター', 5);

-- テスラ
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
((SELECT id FROM car_makers WHERE name_en='TESLA'), 'Model 3', null, null, 2019, 2026, 'セダン', 'モーター', 1),
((SELECT id FROM car_makers WHERE name_en='TESLA'), 'Model Y', null, null, 2022, 2026, 'SUV', 'モーター', 2),
((SELECT id FROM car_makers WHERE name_en='TESLA'), 'Model S', null, null, 2014, 2026, 'セダン', 'モーター', 3),
((SELECT id FROM car_makers WHERE name_en='TESLA'), 'Model X', null, null, 2016, 2026, 'SUV', 'モーター', 4);

-- ジープ
INSERT OR IGNORE INTO car_models (maker_id, name, model_code, generation, year_from, year_to, body_type, engine_type, display_order) VALUES
((SELECT id FROM car_makers WHERE name_en='JEEP'), 'ラングラー', 'JL', 'JL', 2018, 2026, 'SUV', null, 1),
((SELECT id FROM car_makers WHERE name_en='JEEP'), 'グランドチェロキー', 'WL', 'WL', 2022, 2026, 'SUV', null, 2),
((SELECT id FROM car_makers WHERE name_en='JEEP'), 'コンパス', 'MP', null, 2017, 2026, 'SUV', null, 3),
((SELECT id FROM car_makers WHERE name_en='JEEP'), 'レネゲード', 'BU', null, 2015, 2026, 'SUV', null, 4);


-- ============ グレードデータ（主要車種のみサンプル）============

-- プリウス 5代目 MXWH60のグレード
INSERT OR IGNORE INTO car_grades (model_id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order) VALUES
((SELECT id FROM car_models WHERE model_code='MXWH60' AND generation='5代目' LIMIT 1), 'X', '2ZR-FXE', 1797, 'eCVT', 'FF', 'ハイブリッド', 1),
((SELECT id FROM car_models WHERE model_code='MXWH60' AND generation='5代目' LIMIT 1), 'U', '2ZR-FXE', 1797, 'eCVT', 'FF', 'ハイブリッド', 2),
((SELECT id FROM car_models WHERE model_code='MXWH60' AND generation='5代目' LIMIT 1), 'G', '2ZR-FXE', 1797, 'eCVT', 'FF', 'ハイブリッド', 3),
((SELECT id FROM car_models WHERE model_code='MXWH60' AND generation='5代目' LIMIT 1), 'Z', '2ZR-FXE', 1797, 'eCVT', 'FF', 'ハイブリッド', 4),
((SELECT id FROM car_models WHERE model_code='MXWH60' AND generation='5代目' LIMIT 1), 'Z (E-Four)', '2ZR-FXE', 1797, 'eCVT', 'E-Four', 'ハイブリッド', 5);

-- N-BOX 3代目 JF5のグレード
INSERT OR IGNORE INTO car_grades (model_id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order) VALUES
((SELECT id FROM car_models WHERE model_code='JF5' AND generation='3代目' LIMIT 1), 'ベースグレード', 'S07B', 658, 'CVT', 'FF', 'ガソリン', 1),
((SELECT id FROM car_models WHERE model_code='JF5' AND generation='3代目' LIMIT 1), 'カスタム', 'S07B', 658, 'CVT', 'FF', 'ガソリン', 2),
((SELECT id FROM car_models WHERE model_code='JF5' AND generation='3代目' LIMIT 1), 'カスタム ターボ', 'S07B', 658, 'CVT', 'FF', 'ガソリン', 3),
((SELECT id FROM car_models WHERE model_code='JF5' AND generation='3代目' LIMIT 1), 'ベースグレード 4WD', 'S07B', 658, 'CVT', '4WD', 'ガソリン', 4),
((SELECT id FROM car_models WHERE model_code='JF5' AND generation='3代目' LIMIT 1), 'カスタム ターボ 4WD', 'S07B', 658, 'CVT', '4WD', 'ガソリン', 5);

-- ジムニー JB64Wのグレード
INSERT OR IGNORE INTO car_grades (model_id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order) VALUES
((SELECT id FROM car_models WHERE model_code='JB64W' AND generation='4代目' LIMIT 1), 'XG', 'R06A', 658, '5MT', '4WD', 'ガソリン', 1),
((SELECT id FROM car_models WHERE model_code='JB64W' AND generation='4代目' LIMIT 1), 'XG 4AT', 'R06A', 658, '4AT', '4WD', 'ガソリン', 2),
((SELECT id FROM car_models WHERE model_code='JB64W' AND generation='4代目' LIMIT 1), 'XL', 'R06A', 658, '5MT', '4WD', 'ガソリン', 3),
((SELECT id FROM car_models WHERE model_code='JB64W' AND generation='4代目' LIMIT 1), 'XL 4AT', 'R06A', 658, '4AT', '4WD', 'ガソリン', 4),
((SELECT id FROM car_models WHERE model_code='JB64W' AND generation='4代目' LIMIT 1), 'XC', 'R06A', 658, '5MT', '4WD', 'ガソリン', 5),
((SELECT id FROM car_models WHERE model_code='JB64W' AND generation='4代目' LIMIT 1), 'XC 4AT', 'R06A', 658, '4AT', '4WD', 'ガソリン', 6);

-- ロードスター ND5RCのグレード
INSERT OR IGNORE INTO car_grades (model_id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order) VALUES
((SELECT id FROM car_models WHERE model_code='ND5RC' AND generation='ND' LIMIT 1), 'S', 'PE-VPR', 1496, '6MT', 'FR', 'ガソリン', 1),
((SELECT id FROM car_models WHERE model_code='ND5RC' AND generation='ND' LIMIT 1), 'S Special Package', 'PE-VPR', 1496, '6MT', 'FR', 'ガソリン', 2),
((SELECT id FROM car_models WHERE model_code='ND5RC' AND generation='ND' LIMIT 1), 'S Leather Package', 'PE-VPR', 1496, '6MT', 'FR', 'ガソリン', 3),
((SELECT id FROM car_models WHERE model_code='ND5RC' AND generation='ND' LIMIT 1), 'RS', 'PE-VPR', 1496, '6MT', 'FR', 'ガソリン', 4),
((SELECT id FROM car_models WHERE model_code='ND5RC' AND generation='ND' LIMIT 1), 'NR-A', 'PE-VPR', 1496, '6MT', 'FR', 'ガソリン', 5);

-- GT-R R35のグレード
INSERT OR IGNORE INTO car_grades (model_id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order) VALUES
((SELECT id FROM car_models WHERE model_code='R35' LIMIT 1), 'ピュアエディション', 'VR38DETT', 3799, '6AT', 'AWD', 'ガソリン', 1),
((SELECT id FROM car_models WHERE model_code='R35' LIMIT 1), 'プレミアムエディション', 'VR38DETT', 3799, '6AT', 'AWD', 'ガソリン', 2),
((SELECT id FROM car_models WHERE model_code='R35' LIMIT 1), 'NISMO', 'VR38DETT', 3799, '6AT', 'AWD', 'ガソリン', 3),
((SELECT id FROM car_models WHERE model_code='R35' LIMIT 1), 'T-spec', 'VR38DETT', 3799, '6AT', 'AWD', 'ガソリン', 4);

-- アルファード 40系のグレード
INSERT OR IGNORE INTO car_grades (model_id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order) VALUES
((SELECT id FROM car_models WHERE model_code='AAHH40W' AND generation='4代目 40系' LIMIT 1), 'Z', 'A25A-FXS', 2487, 'eCVT', 'FF', 'ハイブリッド', 1),
((SELECT id FROM car_models WHERE model_code='AAHH40W' AND generation='4代目 40系' LIMIT 1), 'Z (E-Four)', 'A25A-FXS', 2487, 'eCVT', 'E-Four', 'ハイブリッド', 2),
((SELECT id FROM car_models WHERE model_code='AAHH40W' AND generation='4代目 40系' LIMIT 1), 'Executive Lounge', 'A25A-FXS', 2487, 'eCVT', 'FF', 'ハイブリッド', 3),
((SELECT id FROM car_models WHERE model_code='AAHH40W' AND generation='4代目 40系' LIMIT 1), 'Executive Lounge (E-Four)', 'A25A-FXS', 2487, 'eCVT', 'E-Four', 'ハイブリッド', 4);

-- BMW 3シリーズ G20のグレード
INSERT OR IGNORE INTO car_grades (model_id, name, engine_type, displacement, transmission, drive_type, fuel_type, display_order) VALUES
((SELECT id FROM car_models WHERE model_code='G20' AND generation='G20/G21' LIMIT 1), '320i', 'B48B20A', 1998, '8AT', 'FR', 'ガソリン', 1),
((SELECT id FROM car_models WHERE model_code='G20' AND generation='G20/G21' LIMIT 1), '320d xDrive', 'B47D20B', 1995, '8AT', 'AWD', 'ディーゼル', 2),
((SELECT id FROM car_models WHERE model_code='G20' AND generation='G20/G21' LIMIT 1), 'M340i xDrive', 'B58B30A', 2998, '8AT', 'AWD', 'ガソリン', 3),
((SELECT id FROM car_models WHERE model_code='G20' AND generation='G20/G21' LIMIT 1), '330e', 'B48B20A', 1998, '8AT', 'FR', 'PHEV', 4);
