-- 商品の適合情報詳細テーブル
CREATE TABLE IF NOT EXISTS product_compatibility (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  
  -- 基本情報
  maker_id INTEGER,
  model_id INTEGER,
  year_from INTEGER,
  year_to INTEGER,
  
  -- 詳細情報（カンマ区切り対応）
  model_code TEXT,              -- 型式（例: "ZVW30,ZVW35"）
  grade TEXT,                   -- グレード（例: "S,G,L"）
  engine_type TEXT,             -- エンジン型式（例: "2ZR-FXE"）
  drive_type TEXT,              -- FF, 4WD, FR など
  transmission_type TEXT,       -- CVT, 5MT, 6AT など
  body_type TEXT,               -- セダン, ワゴン, SUV など
  
  -- 品番情報
  oem_part_number TEXT,         -- 純正品番
  aftermarket_part_number TEXT, -- 社外品番
  alternative_numbers TEXT,     -- 互換品番（カンマ区切り）
  
  -- 確認情報
  verification_method TEXT CHECK(verification_method IN ('actual_vehicle', 'part_number', 'catalog', 'manual')),
  fitment_notes TEXT,           -- 適合条件・注意事項
  special_requirements TEXT,    -- 特別な条件
  
  -- メタ情報
  confidence_level INTEGER DEFAULT 3 CHECK(confidence_level >= 1 AND confidence_level <= 5),
  verified_by_admin BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (maker_id) REFERENCES car_makers(id),
  FOREIGN KEY (model_id) REFERENCES car_models(id)
);

CREATE INDEX idx_compat_product ON product_compatibility(product_id);
CREATE INDEX idx_compat_maker_model ON product_compatibility(maker_id, model_id);
CREATE INDEX idx_compat_part_number ON product_compatibility(oem_part_number);
CREATE INDEX idx_compat_model_code ON product_compatibility(model_code);

-- ユーザーの登録車両（マイガレージ）
CREATE TABLE IF NOT EXISTS user_vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- 基本情報
  nickname TEXT NOT NULL,       -- ニックネーム（例: 'マイカー', '社用車1号'）
  maker_id INTEGER NOT NULL,
  model_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- 詳細情報
  model_code TEXT,              -- 型式（車検証の型式）
  grade TEXT,                   -- グレード
  engine_type TEXT,             -- エンジン型式
  drive_type TEXT,              -- FF, 4WD など
  transmission_type TEXT,       -- CVT, MT など
  body_type TEXT,               -- セダン, ワゴン など
  
  -- 識別情報（プライバシー保護）
  chassis_number_last4 TEXT,    -- 車台番号下4桁のみ
  registration_date TEXT,       -- 初度登録年月（YYYY-MM形式）
  
  -- 画像（オプション）
  registration_image_url TEXT,  -- 車検証画像URL
  
  -- メタ
  is_primary BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (maker_id) REFERENCES car_makers(id),
  FOREIGN KEY (model_id) REFERENCES car_models(id)
);

CREATE INDEX idx_vehicles_user ON user_vehicles(user_id);
CREATE INDEX idx_vehicles_maker_model ON user_vehicles(maker_id, model_id);

-- 適合実績データベース（クラウドソーシング）
CREATE TABLE IF NOT EXISTS fitment_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  user_vehicle_id INTEGER,
  
  -- 適合結果
  fits BOOLEAN NOT NULL,        -- 適合したか
  fit_quality INTEGER CHECK(fit_quality >= 1 AND fit_quality <= 5), -- 適合品質 1-5
  
  -- フィードバック
  installation_difficulty INTEGER CHECK(installation_difficulty >= 1 AND installation_difficulty <= 5),
  notes TEXT,                   -- コメント
  images TEXT,                  -- 取付画像URL（JSON配列形式）
  
  -- 検証
  verified_by_admin BOOLEAN DEFAULT 0,
  helpful_count INTEGER DEFAULT 0, -- 「役に立った」カウント
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (user_vehicle_id) REFERENCES user_vehicles(id)
);

CREATE INDEX idx_fitment_product ON fitment_confirmations(product_id);
CREATE INDEX idx_fitment_vehicle ON fitment_confirmations(user_vehicle_id);
CREATE INDEX idx_fitment_user ON fitment_confirmations(user_id);

-- 汎用部品テーブル
CREATE TABLE IF NOT EXISTS universal_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  
  -- 汎用部品の特性
  part_type TEXT,               -- 'オイルフィルター', 'ブレーキパッド' など
  universal_category TEXT,      -- 汎用カテゴリ
  
  -- 適合基準
  thread_size TEXT,             -- ねじサイズ（例: M12x1.25）
  dimensions TEXT,              -- 寸法（JSON形式）
  specifications TEXT,          -- 仕様（JSON形式）
  
  -- 適合車種範囲
  compatible_makers TEXT,       -- 対応メーカー（カンマ区切り）
  compatible_years TEXT,        -- 対応年式範囲（例: "2000-2020"）
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_universal_product ON universal_parts(product_id);
CREATE INDEX idx_universal_type ON universal_parts(part_type);

-- 品番マスターテーブル（クラウドソーシングで蓄積）
CREATE TABLE IF NOT EXISTS part_number_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 品番情報
  part_number TEXT NOT NULL UNIQUE,
  part_type TEXT,               -- '純正', '社外'
  manufacturer TEXT,            -- 部品メーカー
  part_name TEXT,               -- 部品名
  
  -- 適合情報
  maker_id INTEGER,
  compatible_models TEXT,       -- 対応車種（JSON配列形式）
  
  -- メタ情報
  description TEXT,
  alternative_numbers TEXT,     -- 互換品番（カンマ区切り）
  superseded_by TEXT,           -- 後継品番
  
  -- データソース
  data_source TEXT DEFAULT 'user_contributed' CHECK(data_source IN ('user_contributed', 'admin_verified', 'api', 'scraping')),
  contribution_count INTEGER DEFAULT 1,
  verified BOOLEAN DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (maker_id) REFERENCES car_makers(id)
);

CREATE INDEX idx_part_number ON part_number_master(part_number);
CREATE INDEX idx_part_maker ON part_number_master(maker_id);

-- 適合関連の検索履歴（機械学習用データ）
CREATE TABLE IF NOT EXISTS fitment_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  product_id INTEGER,
  user_vehicle_id INTEGER,
  
  -- 検索条件
  search_maker_id INTEGER,
  search_model_id INTEGER,
  search_year INTEGER,
  search_query TEXT,
  
  -- 結果
  matched BOOLEAN,
  confidence_level INTEGER,
  purchased BOOLEAN DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_vehicle_id) REFERENCES user_vehicles(id)
);

CREATE INDEX idx_search_user ON fitment_searches(user_id);
CREATE INDEX idx_search_product ON fitment_searches(product_id);
CREATE INDEX idx_search_vehicle ON fitment_searches(user_vehicle_id);
