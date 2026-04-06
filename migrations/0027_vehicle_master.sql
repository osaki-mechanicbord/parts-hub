-- vehicle_master: CSVマスターデータ格納テーブル
-- メーカー→車種→駆動方式→グレード→タイヤサイズ の階層構造
CREATE TABLE IF NOT EXISTS vehicle_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maker TEXT NOT NULL,
  model TEXT NOT NULL,
  drive_type TEXT DEFAULT '',
  grade_name TEXT DEFAULT '',
  tire_size TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 検索用インデックス
CREATE INDEX IF NOT EXISTS idx_vm_maker ON vehicle_master(maker);
CREATE INDEX IF NOT EXISTS idx_vm_maker_model ON vehicle_master(maker, model);
CREATE INDEX IF NOT EXISTS idx_vm_maker_model_grade ON vehicle_master(maker, model, grade_name);

-- product_compatibility にタイヤサイズ・vehicle_master連動カラム追加
ALTER TABLE product_compatibility ADD COLUMN tire_size TEXT;
ALTER TABLE product_compatibility ADD COLUMN vm_maker TEXT;
ALTER TABLE product_compatibility ADD COLUMN vm_model TEXT;
ALTER TABLE product_compatibility ADD COLUMN vm_grade TEXT;

-- products テーブルにもvm_makerなどを追加（検索用）
ALTER TABLE products ADD COLUMN vm_maker TEXT;
ALTER TABLE products ADD COLUMN vm_model TEXT;
ALTER TABLE products ADD COLUMN vm_grade TEXT;
ALTER TABLE products ADD COLUMN vm_tire_size TEXT;
