/**
 * ARGOS JPC API モック（拡充版）
 * 
 * 本番連携時は、このファイル内のモックレスポンスを
 * 実際のARGOS JPC APIコール（Bearer Token認証）に差し替えるだけ。
 * 
 * フロントエンドのUI・内部APIインターフェースは一切変更不要。
 * 
 * ARGOS JPC 標準API一覧（Bearer Token認証）:
 *   #1  Get Car Brand List
 *   #2  Get Car Model List
 *   #3  Get Car Type List
 *   #4  Get Car Year List
 *   #5  Get Car List
 *   #6  Get Main Group List
 *   #7  Get Subgroup List
 *   #8  Get Part List
 *   #13 Get Car List by VIN
 *   #14 Get Subgroup List by VIN
 *   #15 Get Part List by VIN
 *   #21 Get Image
 *   #33 Get PartCategory List
 *   #34 Get Subgroup List By Shortcut
 *   #35 Get Car Additional Data
 */

import { Hono } from 'hono'
import type { Bindings } from '../types'

const argosDemo = new Hono<{ Bindings: Bindings }>()

// ============================================================
// モックデータ定義
// ============================================================

// 車台番号 → 車両情報マッピング（モック）
const VIN_DB: Record<string, any> = {
  // トヨタ プリウス 5代目
  'JTDKN3DU5P0000001': {
    brand: 'TOYOTA', brand_ja: 'トヨタ',
    model: 'PRIUS', model_ja: 'プリウス',
    type: 'MXWH60', generation: '5代目',
    year: 2023, month: 6,
    engine: '2ZR-FXE', displacement: '1797cc',
    transmission: 'eCVT', drive: 'FF',
    grade: 'Z', color: 'ブラック(202)',
    body_type: 'セダン', fuel: 'ハイブリッド',
    vin: 'JTDKN3DU5P0000001',
    full_model_code: 'ZVW60-AHXEB',
    katashiki: '6AA-MXWH60',
    type_class: '3060', ruibetsu: '0016',
    doors: 4, seats: 5, weight: '1420kg',
    maker_logo: 'TOYOTA'
  },
  // トヨタ ハイエース
  'TRH200-0300001': {
    brand: 'TOYOTA', brand_ja: 'トヨタ',
    model: 'HIACE VAN', model_ja: 'ハイエースバン',
    type: 'TRH200V', generation: '5代目(200系)',
    year: 2018, month: 3,
    engine: '1TR-FE', displacement: '1998cc',
    transmission: '5MT', drive: 'FR',
    grade: 'DX', color: 'ホワイト(058)',
    body_type: 'バン', fuel: 'ガソリン',
    vin: 'TRH200-0300001',
    full_model_code: 'TRH200V-SRTDK',
    katashiki: 'CBF-TRH200V',
    type_class: '1058', ruibetsu: '0501',
    doors: 5, seats: 6, weight: '1680kg',
    maker_logo: 'TOYOTA'
  },
  // ホンダ N-BOX
  'JF5-1000001': {
    brand: 'HONDA', brand_ja: 'ホンダ',
    model: 'N-BOX', model_ja: 'N-BOX',
    type: 'JF5', generation: '3代目',
    year: 2024, month: 1,
    engine: 'S07B', displacement: '658cc',
    transmission: 'CVT', drive: 'FF',
    grade: 'カスタム ターボ', color: 'プラチナホワイトパール',
    body_type: '軽自動車', fuel: 'ガソリン',
    vin: 'JF5-1000001',
    full_model_code: 'JF5-100',
    katashiki: '6BA-JF5',
    type_class: '18819', ruibetsu: '0003',
    doors: 4, seats: 4, weight: '920kg',
    maker_logo: 'HONDA'
  },
  // 日産 セレナ
  'C28-100001': {
    brand: 'NISSAN', brand_ja: '日産',
    model: 'SERENA', model_ja: 'セレナ',
    type: 'C28', generation: '6代目',
    year: 2023, month: 4,
    engine: 'MR20DD', displacement: '1997cc',
    transmission: 'eCVT', drive: 'FF',
    grade: 'ハイウェイスター V e-POWER', color: 'ダイヤモンドブラック',
    body_type: 'ミニバン', fuel: 'e-POWER',
    vin: 'C28-100001',
    full_model_code: 'C28-012',
    katashiki: '6AA-C28',
    type_class: '19544', ruibetsu: '0005',
    doors: 5, seats: 8, weight: '1790kg',
    maker_logo: 'NISSAN'
  },
  // 三菱 デリカD:5
  'CV1W-0400001': {
    brand: 'MITSUBISHI', brand_ja: '三菱',
    model: 'DELICA D:5', model_ja: 'デリカD:5',
    type: 'CV1W', generation: '後期',
    year: 2020, month: 10,
    engine: '4N14', displacement: '2267cc',
    transmission: '8AT', drive: '4WD',
    grade: 'P', color: 'ブラックマイカ',
    body_type: 'ミニバン', fuel: 'ディーゼル',
    vin: 'CV1W-0400001',
    full_model_code: 'CV1W-GNFXZ',
    katashiki: '3DA-CV1W',
    type_class: '17890', ruibetsu: '0012',
    doors: 5, seats: 8, weight: '1930kg',
    maker_logo: 'MITSUBISHI'
  },
  // ダイハツ タント
  'LA650S-0100001': {
    brand: 'DAIHATSU', brand_ja: 'ダイハツ',
    model: 'TANTO', model_ja: 'タント',
    type: 'LA650S', generation: '4代目',
    year: 2022, month: 8,
    engine: 'KF', displacement: '658cc',
    transmission: 'CVT', drive: 'FF',
    grade: 'X', color: 'パールホワイトIII',
    body_type: '軽自動車', fuel: 'ガソリン',
    vin: 'LA650S-0100001',
    full_model_code: 'LA650S-GBSZ',
    katashiki: '5BA-LA650S',
    type_class: '19001', ruibetsu: '0002',
    doors: 4, seats: 4, weight: '880kg',
    maker_logo: 'DAIHATSU'
  },
  // スズキ ジムニー
  'JB64W-200001': {
    brand: 'SUZUKI', brand_ja: 'スズキ',
    model: 'JIMNY', model_ja: 'ジムニー',
    type: 'JB64W', generation: '4代目',
    year: 2021, month: 5,
    engine: 'R06A', displacement: '658cc',
    transmission: '4AT', drive: '4WD',
    grade: 'XC', color: 'キネティックイエロー',
    body_type: 'SUV', fuel: 'ガソリン',
    vin: 'JB64W-200001',
    full_model_code: 'JB64W-JSZR',
    katashiki: '3BA-JB64W',
    type_class: '18322', ruibetsu: '0007',
    doors: 3, seats: 4, weight: '1040kg',
    maker_logo: 'SUZUKI'
  },
  // マツダ ロードスター
  'ND5RC-300001': {
    brand: 'MAZDA', brand_ja: 'マツダ',
    model: 'ROADSTER', model_ja: 'ロードスター',
    type: 'ND5RC', generation: 'ND',
    year: 2022, month: 11,
    engine: 'P5-VPR', displacement: '1496cc',
    transmission: '6MT', drive: 'FR',
    grade: 'S Special Package', color: 'ソウルレッドクリスタルメタリック',
    body_type: 'オープン', fuel: 'ガソリン',
    vin: 'ND5RC-300001',
    full_model_code: 'ND5RC-200S',
    katashiki: '5BA-ND5RC',
    type_class: '18645', ruibetsu: '0004',
    doors: 2, seats: 2, weight: '1020kg',
    maker_logo: 'MAZDA'
  }
}

// 部品メイングループ（共通構造）
const MAIN_GROUPS = [
  { id: 'ENG', name: 'エンジン', icon: 'fa-cog', parts_count: 450 },
  { id: 'ELC', name: '電装', icon: 'fa-bolt', parts_count: 280 },
  { id: 'BDY', name: 'ボディ・外装', icon: 'fa-car-side', parts_count: 520 },
  { id: 'CHS', name: 'シャシー', icon: 'fa-gears', parts_count: 380 },
  { id: 'TRM', name: 'トランスミッション', icon: 'fa-arrows-spin', parts_count: 190 },
  { id: 'BRK', name: 'ブレーキ', icon: 'fa-circle-stop', parts_count: 120 },
  { id: 'SUS', name: 'サスペンション', icon: 'fa-arrows-up-down', parts_count: 95 },
  { id: 'EXH', name: '排気', icon: 'fa-wind', parts_count: 65 },
  { id: 'CLG', name: '冷却', icon: 'fa-temperature-low', parts_count: 85 },
  { id: 'INT', name: '内装', icon: 'fa-couch', parts_count: 310 },
  { id: 'STR', name: 'ステアリング', icon: 'fa-dharmachakra', parts_count: 70 },
  { id: 'FUL', name: '燃料', icon: 'fa-gas-pump', parts_count: 55 }
]

// サブグループ（全グループ分拡充）
const SUB_GROUPS: Record<string, any[]> = {
  'ENG': [
    { id: 'ENG-01', name: 'シリンダーブロック', has_illustration: true },
    { id: 'ENG-02', name: 'シリンダーヘッド', has_illustration: true },
    { id: 'ENG-03', name: 'タイミングチェーン・ベルト', has_illustration: true },
    { id: 'ENG-04', name: 'エンジンマウント', has_illustration: true },
    { id: 'ENG-05', name: 'オイルポンプ', has_illustration: true },
    { id: 'ENG-06', name: 'ウォーターポンプ', has_illustration: true },
    { id: 'ENG-07', name: '吸気系（インテーク）', has_illustration: true },
    { id: 'ENG-08', name: 'スロットルボディ', has_illustration: true },
    { id: 'ENG-09', name: 'インジェクター', has_illustration: true },
    { id: 'ENG-10', name: 'エキゾーストマニホールド', has_illustration: true },
    { id: 'ENG-11', name: 'オイルフィルター', has_illustration: true },
    { id: 'ENG-12', name: 'スパークプラグ・イグニッション', has_illustration: true }
  ],
  'ELC': [
    { id: 'ELC-01', name: 'オルタネーター', has_illustration: true },
    { id: 'ELC-02', name: 'スターター', has_illustration: true },
    { id: 'ELC-03', name: 'バッテリー', has_illustration: false },
    { id: 'ELC-04', name: 'ヘッドライト', has_illustration: true },
    { id: 'ELC-05', name: 'テールランプ', has_illustration: true },
    { id: 'ELC-06', name: 'ワイパーモーター', has_illustration: true },
    { id: 'ELC-07', name: 'パワーウインドウモーター', has_illustration: true },
    { id: 'ELC-08', name: 'ECU・コンピューター', has_illustration: false },
    { id: 'ELC-09', name: 'メーター・計器類', has_illustration: true },
    { id: 'ELC-10', name: 'エアバッグ', has_illustration: true }
  ],
  'BDY': [
    { id: 'BDY-01', name: 'フロントバンパー', has_illustration: true },
    { id: 'BDY-02', name: 'リアバンパー', has_illustration: true },
    { id: 'BDY-03', name: 'フロントフェンダー', has_illustration: true },
    { id: 'BDY-04', name: 'ボンネット', has_illustration: true },
    { id: 'BDY-05', name: 'フロントドア', has_illustration: true },
    { id: 'BDY-06', name: 'リアドア', has_illustration: true },
    { id: 'BDY-07', name: 'トランクリッド・バックドア', has_illustration: true },
    { id: 'BDY-08', name: 'フロントガラス', has_illustration: true },
    { id: 'BDY-09', name: 'ドアミラー', has_illustration: true },
    { id: 'BDY-10', name: 'グリル・エンブレム', has_illustration: true }
  ],
  'CHS': [
    { id: 'CHS-01', name: 'フレーム・クロスメンバー', has_illustration: true },
    { id: 'CHS-02', name: 'サブフレーム', has_illustration: true },
    { id: 'CHS-03', name: 'ドライブシャフト', has_illustration: true },
    { id: 'CHS-04', name: 'プロペラシャフト', has_illustration: true },
    { id: 'CHS-05', name: 'デフ（デファレンシャル）', has_illustration: true },
    { id: 'CHS-06', name: 'ハブ・ベアリング', has_illustration: true }
  ],
  'TRM': [
    { id: 'TRM-01', name: 'AT/CVTアセンブリ', has_illustration: true },
    { id: 'TRM-02', name: 'MT/マニュアルミッション', has_illustration: true },
    { id: 'TRM-03', name: 'クラッチ', has_illustration: true },
    { id: 'TRM-04', name: 'トルクコンバーター', has_illustration: true },
    { id: 'TRM-05', name: 'シフトケーブル・リンク', has_illustration: false }
  ],
  'BRK': [
    { id: 'BRK-01', name: 'フロントブレーキ', has_illustration: true },
    { id: 'BRK-02', name: 'リアブレーキ', has_illustration: true },
    { id: 'BRK-03', name: 'ブレーキマスターシリンダー', has_illustration: true },
    { id: 'BRK-04', name: 'ブレーキブースター', has_illustration: true },
    { id: 'BRK-05', name: 'パーキングブレーキ', has_illustration: true },
    { id: 'BRK-06', name: 'ABSユニット', has_illustration: false }
  ],
  'SUS': [
    { id: 'SUS-01', name: 'フロントショックアブソーバー', has_illustration: true },
    { id: 'SUS-02', name: 'リアショックアブソーバー', has_illustration: true },
    { id: 'SUS-03', name: 'コイルスプリング', has_illustration: true },
    { id: 'SUS-04', name: 'ロアアーム', has_illustration: true },
    { id: 'SUS-05', name: 'スタビライザー', has_illustration: true },
    { id: 'SUS-06', name: 'ブッシュ・マウント', has_illustration: false }
  ],
  'EXH': [
    { id: 'EXH-01', name: 'エキゾーストマニホールド', has_illustration: true },
    { id: 'EXH-02', name: '触媒（キャタライザー）', has_illustration: true },
    { id: 'EXH-03', name: 'マフラー', has_illustration: true },
    { id: 'EXH-04', name: 'O2センサー', has_illustration: false },
    { id: 'EXH-05', name: 'EGRバルブ', has_illustration: false }
  ],
  'CLG': [
    { id: 'CLG-01', name: 'ラジエーター', has_illustration: true },
    { id: 'CLG-02', name: 'ラジエーターファン', has_illustration: true },
    { id: 'CLG-03', name: 'サーモスタット', has_illustration: true },
    { id: 'CLG-04', name: 'ウォーターホース', has_illustration: true },
    { id: 'CLG-05', name: 'エアコンコンデンサー', has_illustration: true },
    { id: 'CLG-06', name: 'エアコンコンプレッサー', has_illustration: true }
  ],
  'INT': [
    { id: 'INT-01', name: 'シート（フロント）', has_illustration: true },
    { id: 'INT-02', name: 'シート（リア）', has_illustration: true },
    { id: 'INT-03', name: 'ダッシュボード', has_illustration: true },
    { id: 'INT-04', name: 'コンソール', has_illustration: true },
    { id: 'INT-05', name: 'ステアリングコラム', has_illustration: true },
    { id: 'INT-06', name: 'ドアトリム', has_illustration: true },
    { id: 'INT-07', name: 'フロアカーペット', has_illustration: false }
  ],
  'STR': [
    { id: 'STR-01', name: 'パワステポンプ/モーター', has_illustration: true },
    { id: 'STR-02', name: 'ステアリングラック', has_illustration: true },
    { id: 'STR-03', name: 'ステアリングホイール', has_illustration: true },
    { id: 'STR-04', name: 'タイロッド', has_illustration: true }
  ],
  'FUL': [
    { id: 'FUL-01', name: '燃料タンク', has_illustration: true },
    { id: 'FUL-02', name: '燃料ポンプ', has_illustration: true },
    { id: 'FUL-03', name: '燃料フィルター', has_illustration: false },
    { id: 'FUL-04', name: 'デリバリーパイプ', has_illustration: true }
  ]
}

// 部品データ例（全サブグループ拡充）
const PARTS_DATA: Record<string, any[]> = {
  'BRK-01': [
    { part_number: '04465-47070', name: 'フロントブレーキパッド', price: 8800, qty: 1, remark: '左右セット', compatible: ['04465-47050', '04465-47060'] },
    { part_number: '43512-47040', name: 'フロントブレーキディスクローター', price: 12500, qty: 1, remark: '1枚', compatible: [] },
    { part_number: '47730-47030', name: 'フロントブレーキキャリパー RH', price: 34000, qty: 1, remark: '右側', compatible: [] },
    { part_number: '47750-47030', name: 'フロントブレーキキャリパー LH', price: 34000, qty: 1, remark: '左側', compatible: [] },
    { part_number: '04947-47020', name: 'ブレーキパッドシムキット', price: 2200, qty: 1, remark: '', compatible: [] },
    { part_number: '90080-11051', name: 'フロントブレーキホース', price: 3800, qty: 1, remark: '', compatible: ['90080-11048'] }
  ],
  'BRK-02': [
    { part_number: '04466-47060', name: 'リアブレーキパッド', price: 7200, qty: 1, remark: '左右セット', compatible: ['04466-47050'] },
    { part_number: '42431-47050', name: 'リアブレーキディスクローター', price: 9800, qty: 1, remark: '1枚', compatible: [] },
    { part_number: '47830-47050', name: 'リアブレーキキャリパー RH', price: 28000, qty: 1, remark: '右側', compatible: [] },
    { part_number: '47850-47050', name: 'リアブレーキキャリパー LH', price: 28000, qty: 1, remark: '左側', compatible: [] }
  ],
  'BRK-03': [
    { part_number: '47201-47140', name: 'ブレーキマスターシリンダー', price: 25000, qty: 1, remark: '', compatible: [] },
    { part_number: '47220-12551', name: 'マスターシリンダーリペアキット', price: 4500, qty: 1, remark: '', compatible: [] }
  ],
  'ENG-12': [
    { part_number: '90919-01275', name: 'スパークプラグ', price: 1650, qty: 4, remark: 'イリジウム', compatible: ['90919-01253'] },
    { part_number: '90919-02276', name: 'イグニッションコイル', price: 6500, qty: 1, remark: '', compatible: ['90919-02265'] },
    { part_number: '19070-21030', name: 'プラグホールシール', price: 380, qty: 4, remark: '', compatible: [] }
  ],
  'ENG-11': [
    { part_number: '04152-YZZA1', name: 'オイルフィルター', price: 1100, qty: 1, remark: '純正', compatible: ['04152-37010', '04152-40060'] },
    { part_number: '90915-YZZD1', name: 'オイルドレンプラグ', price: 380, qty: 1, remark: '', compatible: [] },
    { part_number: '90430-12031', name: 'ドレンプラグガスケット', price: 60, qty: 1, remark: '', compatible: ['90430-12028'] }
  ],
  'ENG-01': [
    { part_number: '11401-29755', name: 'シリンダーブロックASSY', price: 185000, qty: 1, remark: 'ショートブロック', compatible: [] },
    { part_number: '13011-37100', name: 'ピストンリングセット', price: 12500, qty: 1, remark: '4気筒分', compatible: [] },
    { part_number: '13211-37020', name: 'コンロッドベアリング', price: 5800, qty: 1, remark: 'STD', compatible: [] },
    { part_number: '13041-37020', name: 'クランクシャフトベアリング', price: 6200, qty: 1, remark: 'STD', compatible: [] }
  ],
  'ENG-02': [
    { part_number: '11101-29625', name: 'シリンダーヘッドASSY', price: 125000, qty: 1, remark: 'バルブ付', compatible: [] },
    { part_number: '11115-37010', name: 'シリンダーヘッドガスケット', price: 4800, qty: 1, remark: '', compatible: [] },
    { part_number: '13711-37040', name: 'インテークバルブ', price: 3200, qty: 1, remark: '1本', compatible: [] },
    { part_number: '13715-37020', name: 'エキゾーストバルブ', price: 3500, qty: 1, remark: '1本', compatible: [] }
  ],
  'ENG-03': [
    { part_number: '13506-37030', name: 'タイミングチェーン', price: 8500, qty: 1, remark: '', compatible: [] },
    { part_number: '13540-37020', name: 'チェーンテンショナー', price: 6200, qty: 1, remark: '', compatible: [] },
    { part_number: '13559-37010', name: 'チェーンガイド', price: 3800, qty: 1, remark: '', compatible: [] }
  ],
  'ENG-04': [
    { part_number: '12361-37060', name: 'エンジンマウント RH', price: 8500, qty: 1, remark: '右側', compatible: [] },
    { part_number: '12372-37040', name: 'エンジンマウント LH', price: 7800, qty: 1, remark: '左側', compatible: [] },
    { part_number: '12371-37080', name: 'エンジンマウント リア', price: 5500, qty: 1, remark: 'リア', compatible: [] }
  ],
  'ELC-01': [
    { part_number: '27060-37040', name: 'オルタネーター', price: 42000, qty: 1, remark: '14V 100A', compatible: [] },
    { part_number: '27060-37040-84', name: 'リビルトオルタネーター', price: 22000, qty: 1, remark: 'リビルト品', compatible: [] }
  ],
  'ELC-02': [
    { part_number: '28100-37070', name: 'スターターモーター', price: 38000, qty: 1, remark: '', compatible: [] },
    { part_number: '28100-37070-84', name: 'リビルトスターター', price: 18000, qty: 1, remark: 'リビルト品', compatible: [] }
  ],
  'ELC-04': [
    { part_number: '81110-47690', name: 'ヘッドランプASSY RH', price: 65000, qty: 1, remark: '右側 LED', compatible: [] },
    { part_number: '81150-47690', name: 'ヘッドランプASSY LH', price: 65000, qty: 1, remark: '左側 LED', compatible: [] },
    { part_number: '81220-47010', name: 'フォグランプ RH', price: 12000, qty: 1, remark: '右側', compatible: [] }
  ],
  'BDY-01': [
    { part_number: '52119-47070', name: 'フロントバンパーカバー', price: 35000, qty: 1, remark: '未塗装', compatible: [] },
    { part_number: '52611-47060', name: 'フロントバンパーグリル', price: 15000, qty: 1, remark: '', compatible: [] },
    { part_number: '52127-47030', name: 'バンパーリテーナー RH', price: 2800, qty: 1, remark: '', compatible: [] }
  ],
  'BDY-02': [
    { part_number: '52159-47060', name: 'リアバンパーカバー', price: 32000, qty: 1, remark: '未塗装', compatible: [] },
    { part_number: '52161-47060', name: 'リアバンパーアッパーガーニッシュ', price: 8500, qty: 1, remark: '', compatible: [] }
  ],
  'BDY-09': [
    { part_number: '87910-47700', name: 'ドアミラーASSY RH', price: 28000, qty: 1, remark: 'ヒーター付 電動格納', compatible: [] },
    { part_number: '87940-47700', name: 'ドアミラーASSY LH', price: 28000, qty: 1, remark: 'ヒーター付 電動格納', compatible: [] },
    { part_number: '87961-47150', name: 'ミラーガラス RH', price: 3800, qty: 1, remark: '', compatible: [] }
  ],
  'CLG-01': [
    { part_number: '16400-37261', name: 'ラジエーターASSY', price: 35000, qty: 1, remark: 'AT用', compatible: [] },
    { part_number: '16401-37130', name: 'ラジエーターキャップ', price: 1200, qty: 1, remark: '', compatible: ['16401-37100'] },
    { part_number: '16363-37020', name: 'ラジエーターファンモーター', price: 18000, qty: 1, remark: '', compatible: [] }
  ],
  'CLG-06': [
    { part_number: '88310-47130', name: 'エアコンコンプレッサー', price: 55000, qty: 1, remark: '', compatible: [] },
    { part_number: '88310-47130-84', name: 'リビルトコンプレッサー', price: 28000, qty: 1, remark: 'リビルト品', compatible: [] }
  ],
  'SUS-01': [
    { part_number: '48510-80550', name: 'フロントショックアブソーバー RH', price: 22000, qty: 1, remark: '', compatible: [] },
    { part_number: '48520-80310', name: 'フロントショックアブソーバー LH', price: 22000, qty: 1, remark: '', compatible: [] }
  ],
  'SUS-03': [
    { part_number: '48131-47330', name: 'フロントコイルスプリング', price: 8500, qty: 1, remark: '1本', compatible: [] },
    { part_number: '48231-47190', name: 'リアコイルスプリング', price: 7200, qty: 1, remark: '1本', compatible: [] }
  ],
  'EXH-02': [
    { part_number: '17140-37290', name: '触媒コンバーター', price: 85000, qty: 1, remark: '', compatible: [] },
    { part_number: '89467-47070', name: 'O2センサー (上流)', price: 15000, qty: 1, remark: 'フロント', compatible: [] },
    { part_number: '89465-47100', name: 'O2センサー (下流)', price: 12000, qty: 1, remark: 'リア', compatible: [] }
  ],
  'EXH-03': [
    { part_number: '17430-47190', name: 'リアマフラー', price: 35000, qty: 1, remark: '', compatible: [] },
    { part_number: '17420-47180', name: 'センターパイプ', price: 18000, qty: 1, remark: '', compatible: [] }
  ],
  'STR-02': [
    { part_number: '45510-47060', name: 'ステアリングラック＆ピニオン', price: 68000, qty: 1, remark: 'EPS付', compatible: [] },
    { part_number: '45503-47060', name: 'タイロッドエンド RH', price: 4500, qty: 1, remark: '', compatible: [] },
    { part_number: '45504-47040', name: 'タイロッドエンド LH', price: 4500, qty: 1, remark: '', compatible: [] }
  ],
  'FUL-02': [
    { part_number: '77020-47190', name: '燃料ポンプASSY', price: 32000, qty: 1, remark: 'インタンク式', compatible: [] },
    { part_number: '23300-47020', name: '燃料フィルター', price: 4200, qty: 1, remark: '', compatible: [] }
  ],
  'INT-01': [
    { part_number: '71071-47330', name: 'フロントシートクッション RH', price: 45000, qty: 1, remark: '運転席', compatible: [] },
    { part_number: '71073-47020', name: 'シートバックASSY RH', price: 38000, qty: 1, remark: '運転席', compatible: [] }
  ]
}

// デフォルト部品ジェネレータ（未定義サブグループ用）
function generateDefaultParts(subgroupId: string, subgroupName: string): any[] {
  const prefix = subgroupId.replace(/-\d+$/, '')
  const num = parseInt(subgroupId.replace(/^.*-/, ''), 10)
  return [
    { part_number: `${prefix}${num.toString().padStart(2,'0')}-00010`, name: `${subgroupName} ASSY`, price: Math.floor(15000 + Math.random()*50000), qty: 1, remark: '', compatible: [] },
    { part_number: `${prefix}${num.toString().padStart(2,'0')}-00020`, name: `${subgroupName} ブラケット`, price: Math.floor(2000 + Math.random()*8000), qty: 1, remark: '', compatible: [] },
    { part_number: `${prefix}${num.toString().padStart(2,'0')}-00030`, name: `${subgroupName} ガスケット/シール`, price: Math.floor(300 + Math.random()*2000), qty: 1, remark: '', compatible: [] }
  ]
}

// ============================================================
// APIエンドポイント（ARGOS JPC APIと同一構造を模倣）
// ============================================================

// #13相当: VINから車両情報を取得
argosDemo.get('/vin/:vin', async (c) => {
  const vin = c.req.param('vin').toUpperCase().replace(/[\s-]/g, '')
  
  // モックDB検索（本番では ARGOS API #13 Get Car List by VIN を呼ぶ）
  let vehicle = null
  for (const [key, val] of Object.entries(VIN_DB)) {
    if (key.replace(/-/g, '') === vin || key === c.req.param('vin').toUpperCase()) {
      vehicle = val
      break
    }
  }
  
  if (!vehicle) {
    const vinSamples = Object.entries(VIN_DB).map(([k, v]) => `${k}（${v.brand_ja} ${v.model_ja}）`).join(', ')
    return c.json({
      success: false,
      error: '車台番号に該当する車両が見つかりません',
      hint: 'デモ用VIN: ' + vinSamples,
      mock: true
    }, 404)
  }
  
  return c.json({
    success: true,
    data: vehicle,
    mock: true,
    _note: '本番ではARGOS JPC API #13 Get Car List by VIN のレスポンス'
  })
})

// #6相当: メイングループ一覧
argosDemo.get('/groups', async (c) => {
  return c.json({
    success: true,
    data: MAIN_GROUPS,
    mock: true,
    _note: '本番ではARGOS JPC API #6 Get Main Group List'
  })
})

// #7/#14相当: サブグループ一覧
argosDemo.get('/groups/:groupId/subgroups', async (c) => {
  const groupId = c.req.param('groupId')
  const subgroups = SUB_GROUPS[groupId] || [
    { id: groupId + '-01', name: 'サブグループ1', has_illustration: false },
    { id: groupId + '-02', name: 'サブグループ2', has_illustration: false },
    { id: groupId + '-03', name: 'サブグループ3', has_illustration: false }
  ]
  return c.json({
    success: true,
    data: subgroups,
    mock: true,
    _note: '本番ではARGOS JPC API #7 Get Subgroup List / #14 Get Subgroup List by VIN'
  })
})

// #8/#15相当: 部品一覧
argosDemo.get('/subgroups/:subgroupId/parts', async (c) => {
  const subgroupId = c.req.param('subgroupId')
  const parts = PARTS_DATA[subgroupId]
  
  if (parts) {
    return c.json({ success: true, data: parts, mock: true, _note: '本番ではARGOS JPC API #8/#15' })
  }

  // 未定義のサブグループ → サブグループ名を探してデフォルト生成
  let sgName = 'サンプル部品'
  for (const grp of Object.values(SUB_GROUPS)) {
    const found = grp.find((s: any) => s.id === subgroupId)
    if (found) { sgName = found.name; break }
  }
  
  return c.json({
    success: true,
    data: generateDefaultParts(subgroupId, sgName),
    mock: true,
    _note: '本番ではARGOS JPC API #8 Get Part List / #15 Get Part List by VIN'
  })
})

// 品番からPARTS HUB内の出品商品を検索（将来的にD1を検索）
argosDemo.get('/search-listings', async (c) => {
  const partNumbers = c.req.query('pn')?.split(',') || []
  
  // モック：PARTS HUBの出品商品に該当するものをシミュレート
  const mockListings = partNumbers.slice(0, 3).map((pn, i) => ({
    id: 1000 + i,
    part_number: pn,
    title: `${pn} 適合部品 中古品`,
    price: Math.floor(3000 + Math.random() * 20000),
    condition: ['美品', '良品', '傷あり'][i % 3],
    seller: ['中古パーツ太郎', 'カーパーツPRO', '自動車リサイクル田中'][i % 3],
    image_count: Math.floor(1 + Math.random() * 5),
    listed_at: '2026-03-' + (15 + i).toString().padStart(2, '0')
  }))
  
  return c.json({
    success: true,
    data: mockListings,
    total: mockListings.length,
    mock: true
  })
})

export default argosDemo
