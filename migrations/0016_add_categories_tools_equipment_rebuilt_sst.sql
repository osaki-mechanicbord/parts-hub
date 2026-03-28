-- =====================================================
-- 新カテゴリ4件追加 + サブカテゴリ
-- 工具、設備、リビルト品、SST（特殊工具）
-- =====================================================

-- ============ カテゴリ追加 ============
-- 「その他」の前に挿入するため、「その他」のdisplay_orderを後ろにずらす
UPDATE categories SET display_order = 17 WHERE slug = 'other';

INSERT OR IGNORE INTO categories (name, slug, icon, display_order, is_active) VALUES
('工具', 'tools', 'fa-wrench', 13, 1),
('設備', 'equipment', 'fa-industry', 14, 1),
('リビルト品', 'rebuilt', 'fa-recycle', 15, 1),
('SST（特殊工具）', 'sst', 'fa-screwdriver-wrench', 16, 1);

-- ============ サブカテゴリ追加 ============

-- カテゴリ: 工具
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
((SELECT id FROM categories WHERE slug = 'tools'), 'ハンドツール（レンチ・スパナ・ドライバー）', 'hand-tools', 1),
((SELECT id FROM categories WHERE slug = 'tools'), 'ソケットレンチセット', 'socket-wrench-set', 2),
((SELECT id FROM categories WHERE slug = 'tools'), 'トルクレンチ', 'torque-wrench', 3),
((SELECT id FROM categories WHERE slug = 'tools'), 'プライヤー・ペンチ', 'pliers', 4),
((SELECT id FROM categories WHERE slug = 'tools'), 'インパクトレンチ', 'impact-wrench', 5),
((SELECT id FROM categories WHERE slug = 'tools'), 'エアツール', 'air-tools', 6),
((SELECT id FROM categories WHERE slug = 'tools'), '電動工具（ドリル・グラインダー）', 'power-tools', 7),
((SELECT id FROM categories WHERE slug = 'tools'), '溶接機・溶接用品', 'welding-tools', 8),
((SELECT id FROM categories WHERE slug = 'tools'), '測定工具（ノギス・マイクロメーター）', 'measuring-tools', 9),
((SELECT id FROM categories WHERE slug = 'tools'), 'ジャッキ・ウマ（リジッドラック）', 'jack-stand', 10),
((SELECT id FROM categories WHERE slug = 'tools'), '工具箱・ツールキャビネット', 'tool-box-cabinet', 11),
((SELECT id FROM categories WHERE slug = 'tools'), 'プーラー・ベアリング抜き', 'puller-bearing', 12),
((SELECT id FROM categories WHERE slug = 'tools'), 'タップ・ダイス', 'tap-die', 13),
((SELECT id FROM categories WHERE slug = 'tools'), 'その他一般工具', 'other-general-tools', 14);

-- カテゴリ: 設備
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
((SELECT id FROM categories WHERE slug = 'equipment'), '2柱リフト', 'two-post-lift', 1),
((SELECT id FROM categories WHERE slug = 'equipment'), '4柱リフト', 'four-post-lift', 2),
((SELECT id FROM categories WHERE slug = 'equipment'), 'シザーズリフト', 'scissors-lift', 3),
((SELECT id FROM categories WHERE slug = 'equipment'), 'タイヤチェンジャー', 'tire-changer', 4),
((SELECT id FROM categories WHERE slug = 'equipment'), 'ホイールバランサー', 'wheel-balancer', 5),
((SELECT id FROM categories WHERE slug = 'equipment'), 'エアコンプレッサー', 'air-compressor', 6),
((SELECT id FROM categories WHERE slug = 'equipment'), 'エアコンガスチャージャー', 'ac-gas-charger', 7),
((SELECT id FROM categories WHERE slug = 'equipment'), '塗装ブース・スプレーガン', 'paint-booth-spray', 8),
((SELECT id FROM categories WHERE slug = 'equipment'), '洗車機・高圧洗浄機', 'car-wash-pressure-washer', 9),
((SELECT id FROM categories WHERE slug = 'equipment'), '排ガステスター', 'emission-tester', 10),
((SELECT id FROM categories WHERE slug = 'equipment'), 'サイドスリップテスター', 'side-slip-tester', 11),
((SELECT id FROM categories WHERE slug = 'equipment'), 'ブレーキテスター', 'brake-tester', 12),
((SELECT id FROM categories WHERE slug = 'equipment'), 'ヘッドライトテスター', 'headlight-tester', 13),
((SELECT id FROM categories WHERE slug = 'equipment'), '診断機（スキャンツール）', 'diagnostic-scanner', 14),
((SELECT id FROM categories WHERE slug = 'equipment'), 'オイルチェンジャー', 'oil-changer', 15),
((SELECT id FROM categories WHERE slug = 'equipment'), 'プレス機', 'press-machine', 16),
((SELECT id FROM categories WHERE slug = 'equipment'), '旋盤・フライス盤', 'lathe-milling', 17),
((SELECT id FROM categories WHERE slug = 'equipment'), 'その他設備', 'other-equipment', 18);

-- カテゴリ: リビルト品
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトエンジン', 'rebuilt-engine', 1),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトミッション（AT/MT/CVT）', 'rebuilt-transmission', 2),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトオルタネーター', 'rebuilt-alternator', 3),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトスターター', 'rebuilt-starter', 4),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトターボチャージャー', 'rebuilt-turbo', 5),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトパワステポンプ', 'rebuilt-ps-pump', 6),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトコンプレッサー（エアコン）', 'rebuilt-ac-compressor', 7),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトブレーキキャリパー', 'rebuilt-brake-caliper', 8),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトドライブシャフト', 'rebuilt-drive-shaft', 9),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトラック＆ピニオン', 'rebuilt-rack-pinion', 10),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトECU', 'rebuilt-ecu', 11),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトインジェクター', 'rebuilt-injector', 12),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'リビルトデフ（デファレンシャル）', 'rebuilt-differential', 13),
((SELECT id FROM categories WHERE slug = 'rebuilt'), 'その他リビルト品', 'other-rebuilt', 14);

-- カテゴリ: SST（特殊工具）
INSERT OR IGNORE INTO subcategories (category_id, name, slug, display_order) VALUES
((SELECT id FROM categories WHERE slug = 'sst'), 'タイミングベルト交換用SST', 'sst-timing-belt', 1),
((SELECT id FROM categories WHERE slug = 'sst'), 'クラッチ交換用SST', 'sst-clutch', 2),
((SELECT id FROM categories WHERE slug = 'sst'), 'ベアリング脱着用SST', 'sst-bearing', 3),
((SELECT id FROM categories WHERE slug = 'sst'), 'ブレーキ整備用SST', 'sst-brake', 4),
((SELECT id FROM categories WHERE slug = 'sst'), 'ステアリング脱着用SST', 'sst-steering', 5),
((SELECT id FROM categories WHERE slug = 'sst'), 'エンジン整備用SST', 'sst-engine', 6),
((SELECT id FROM categories WHERE slug = 'sst'), 'ミッション整備用SST', 'sst-transmission', 7),
((SELECT id FROM categories WHERE slug = 'sst'), 'サスペンション用SST（スプリングコンプレッサー等）', 'sst-suspension', 8),
((SELECT id FROM categories WHERE slug = 'sst'), 'エアバッグ整備用SST', 'sst-airbag', 9),
((SELECT id FROM categories WHERE slug = 'sst'), 'ボールジョイントセパレーター', 'sst-ball-joint', 10),
((SELECT id FROM categories WHERE slug = 'sst'), 'オイルシール打ち込み工具', 'sst-oil-seal', 11),
((SELECT id FROM categories WHERE slug = 'sst'), 'メーカー純正SST（トヨタ・日産・ホンダ等）', 'sst-oem-maker', 12),
((SELECT id FROM categories WHERE slug = 'sst'), 'その他SST', 'other-sst', 13);

-- ============ 既存「その他」カテゴリから工具サブカテゴリを整理 ============
-- 「工具・ツール」は新カテゴリ「工具」に移行したため、「その他」から非アクティブ化
UPDATE subcategories SET is_active = 0 
WHERE category_id = 12 AND slug = 'tools';
