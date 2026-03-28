-- =====================================================
-- サブカテゴリの大幅拡充
-- 既存22件 → 約100件以上に拡充
-- カテゴリ9-12のサブカテゴリ新規追加 + 既存カテゴリのサブカテゴリ追加
-- =====================================================

-- カテゴリ1: エンジンパーツ（既存4件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(1, 'カムシャフト', 'camshaft', 5),
(1, 'クランクシャフト', 'crankshaft', 6),
(1, 'シリンダーヘッド', 'cylinder-head', 7),
(1, 'バルブ・バルブスプリング', 'valve-spring', 8),
(1, 'コンロッド', 'connecting-rod', 9),
(1, 'ウォーターポンプ', 'water-pump', 10),
(1, 'サーモスタット', 'thermostat', 11),
(1, 'インテークマニホールド', 'intake-manifold', 12),
(1, 'エキゾーストマニホールド', 'exhaust-manifold', 13),
(1, 'ターボチャージャー', 'turbocharger', 14),
(1, 'スーパーチャージャー', 'supercharger', 15),
(1, 'インジェクター', 'injector', 16),
(1, 'スロットルボディ', 'throttle-body', 17),
(1, 'エアクリーナー', 'air-cleaner', 18),
(1, 'オイルフィルター', 'oil-filter', 19),
(1, 'エンジンマウント', 'engine-mount', 20);

-- カテゴリ2: ブレーキパーツ（既存3件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(2, 'ブレーキホース', 'brake-hose', 4),
(2, 'ブレーキマスターシリンダー', 'brake-master-cylinder', 5),
(2, 'ブレーキブースター', 'brake-booster', 6),
(2, 'ABSユニット', 'abs-unit', 7),
(2, 'サイドブレーキ・パーキングブレーキ', 'parking-brake', 8),
(2, 'ブレーキシュー', 'brake-shoe', 9),
(2, 'ブレーキドラム', 'brake-drum', 10),
(2, 'ブレーキフルード', 'brake-fluid', 11);

-- カテゴリ3: サスペンション（既存3件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(3, 'スタビライザー', 'stabilizer', 4),
(3, 'ブッシュ・ゴム類', 'bushing-rubber', 5),
(3, 'ナックル', 'knuckle', 6),
(3, 'ハブベアリング', 'hub-bearing', 7),
(3, 'ボールジョイント', 'ball-joint', 8),
(3, 'タイロッドエンド', 'tie-rod-end', 9),
(3, 'ストラットマウント', 'strut-mount', 10),
(3, '車高調キット', 'coilover-kit', 11),
(3, 'エアサスペンション', 'air-suspension', 12);

-- カテゴリ4: 電装パーツ（既存3件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(4, 'バッテリー', 'battery', 4),
(4, 'ヘッドライト', 'headlight', 5),
(4, 'テールランプ', 'tail-lamp', 6),
(4, 'フォグランプ', 'fog-lamp', 7),
(4, 'ウインカー', 'turn-signal', 8),
(4, 'ワイパーモーター', 'wiper-motor', 9),
(4, 'パワーウィンドウモーター', 'power-window-motor', 10),
(4, 'セルモーター', 'starter-motor', 11),
(4, 'ECU・コンピューター', 'ecu-computer', 12),
(4, 'センサー類', 'sensors', 13),
(4, 'ヒューズ・リレー', 'fuse-relay', 14),
(4, 'カーナビ・オーディオ', 'car-navi-audio', 15),
(4, 'ETC車載器', 'etc-device', 16),
(4, 'ドライブレコーダー', 'drive-recorder', 17);

-- カテゴリ5: 外装パーツ（既存3件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(5, 'ボンネット', 'bonnet', 4),
(5, 'トランクリッド', 'trunk-lid', 5),
(5, 'サイドミラー', 'side-mirror', 6),
(5, 'グリル', 'grille', 7),
(5, 'スポイラー・エアロ', 'spoiler-aero', 8),
(5, 'ルーフパネル', 'roof-panel', 9),
(5, 'モール・トリム', 'moulding-trim', 10),
(5, 'ドアハンドル', 'door-handle', 11),
(5, 'ウィンドウガラス', 'window-glass', 12),
(5, 'ワイパーブレード', 'wiper-blade', 13);

-- カテゴリ6: 内装パーツ（既存2件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(6, 'ダッシュボード', 'dashboard', 3),
(6, 'メーター・ゲージ', 'meter-gauge', 4),
(6, 'シフトノブ・レバー', 'shift-knob', 5),
(6, 'ペダル類', 'pedals', 6),
(6, 'フロアマット', 'floor-mat', 7),
(6, 'サンバイザー', 'sun-visor', 8),
(6, 'ルームランプ', 'room-lamp', 9),
(6, 'コンソールボックス', 'console-box', 10),
(6, 'ドアトリム・内張り', 'door-trim', 11),
(6, 'エアコン部品', 'aircon-parts', 12);

-- カテゴリ7: ホイール・タイヤ（既存2件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(7, 'スチールホイール', 'steel-wheel', 3),
(7, 'スペアタイヤ', 'spare-tire', 4),
(7, 'ナット・ボルト', 'wheel-nuts-bolts', 5),
(7, 'ホイールキャップ', 'wheel-cap', 6),
(7, 'スタッドレスタイヤ', 'studless-tire', 7),
(7, 'タイヤチェーン', 'tire-chain', 8),
(7, 'ホイールスペーサー', 'wheel-spacer', 9),
(7, 'TPMS（空気圧センサー）', 'tpms-sensor', 10);

-- カテゴリ8: 排気系パーツ（既存2件に追加）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(8, 'フロントパイプ', 'front-pipe', 3),
(8, 'センターパイプ', 'center-pipe', 4),
(8, 'エキマニ', 'exhaust-manifold', 5),
(8, 'O2センサー', 'o2-sensor', 6),
(8, 'サイレンサー', 'silencer', 7),
(8, 'DPF（ディーゼル微粒子フィルター）', 'dpf-filter', 8),
(8, 'EGRバルブ', 'egr-valve', 9);

-- カテゴリ9: 駆動系パーツ（新規）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(9, 'クラッチ', 'clutch', 1),
(9, 'フライホイール', 'flywheel', 2),
(9, 'トランスミッション', 'transmission', 3),
(9, 'デフ（デファレンシャル）', 'differential', 4),
(9, 'ドライブシャフト', 'drive-shaft', 5),
(9, 'プロペラシャフト', 'propeller-shaft', 6),
(9, 'CVTベルト・チェーン', 'cvt-belt-chain', 7),
(9, 'トランスファー', 'transfer-case', 8),
(9, 'ジョイント（等速・ユニバーサル）', 'cv-universal-joint', 9),
(9, 'ATF・ミッションオイル', 'atf-mission-oil', 10),
(9, 'シフトケーブル・リンク', 'shift-cable-link', 11);

-- カテゴリ10: 冷却系パーツ（新規）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(10, 'ラジエーター', 'radiator', 1),
(10, 'ラジエーターホース', 'radiator-hose', 2),
(10, 'ラジエーターファン', 'radiator-fan', 3),
(10, 'ラジエーターキャップ', 'radiator-cap', 4),
(10, 'クーラント（冷却液）', 'coolant', 5),
(10, 'ウォーターポンプ', 'cooling-water-pump', 6),
(10, 'サーモスタット', 'cooling-thermostat', 7),
(10, 'インタークーラー', 'intercooler', 8),
(10, 'オイルクーラー', 'oil-cooler', 9),
(10, 'エアコンコンプレッサー', 'ac-compressor', 10),
(10, 'エアコンコンデンサー', 'ac-condenser', 11),
(10, 'エバポレーター', 'evaporator', 12),
(10, 'ヒーターコア', 'heater-core', 13);

-- カテゴリ11: ボディパーツ（新規）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(11, 'フレーム・シャシー', 'frame-chassis', 1),
(11, 'クロスメンバー', 'cross-member', 2),
(11, 'サブフレーム', 'sub-frame', 3),
(11, 'フロアパネル', 'floor-panel', 4),
(11, 'ピラー（A/B/C）', 'pillar', 5),
(11, 'ロッカーパネル', 'rocker-panel', 6),
(11, 'ラジエーターサポート', 'radiator-support', 7),
(11, 'リアゲート・ハッチ', 'rear-gate-hatch', 8),
(11, 'ドア本体（ASSY）', 'door-assy', 9),
(11, 'ヒンジ・ステー', 'hinge-stay', 10);

-- カテゴリ12: その他（新規）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
(12, '工具・ツール', 'tools', 1),
(12, 'オイル・ケミカル', 'oil-chemical', 2),
(12, 'ボルト・ナット・クリップ', 'bolts-nuts-clips', 3),
(12, 'ガスケット・パッキン（汎用）', 'gasket-packing-general', 4),
(12, 'チューニングパーツ', 'tuning-parts', 5),
(12, 'ドレスアップパーツ', 'dress-up-parts', 6),
(12, '牽引・レッカー用品', 'towing-equipment', 7),
(12, 'キャリア・ラック', 'carrier-rack', 8),
(12, 'セキュリティ・盗難防止', 'security-anti-theft', 9),
(12, 'その他汎用パーツ', 'other-general-parts', 10);
