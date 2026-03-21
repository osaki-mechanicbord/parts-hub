# アルゴスAPI連携ガイド

## 概要

アルゴス（ARGOS）は自動車部品の適合情報データベースサービスです。
このドキュメントでは、アルゴスAPIとの連携方法を説明します。

---

## 📋 前提条件

1. **アルゴスAPIアカウント**
   - アルゴスの公式サイトでアカウント登録
   - APIキーの取得

2. **料金プラン**
   - アルゴスAPIは有料サービスです
   - 利用前に料金プランを確認してください

---

## 🔧 セットアップ

### 1. 環境変数の設定

#### ローカル開発環境

`.dev.vars` ファイルを作成し、以下を設定：

```bash
# アルゴスAPI設定
ARGOS_API_ENABLED=true
ARGOS_API_KEY=your_actual_api_key_here
ARGOS_API_URL=https://api.argos-example.com/v1
```

#### 本番環境（Cloudflare）

```bash
# APIキーを安全に保存
npx wrangler secret put ARGOS_API_KEY
# プロンプトでAPIキーを入力

# wrangler.jsonc に追加
{
  "vars": {
    "ARGOS_API_ENABLED": "true",
    "ARGOS_API_URL": "https://api.argos-example.com/v1"
  }
}
```

### 2. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/api/external/argos/health

# レスポンス例:
{
  "success": true,
  "enabled": true,
  "configured": true,
  "endpoint": "https://api.argos-example.com/v1",
  "status": "ready"
}
```

---

## 📡 API エンドポイント

### 1. 品番から適合車種を検索

**エンドポイント:** `GET /api/external/argos/part-number/:partNumber/vehicles`

**使用例:**
```bash
curl http://localhost:3000/api/external/argos/part-number/67002-47130/vehicles
```

**レスポンス:**
```json
{
  "success": true,
  "part_number": "67002-47130",
  "part_name": "フロントドアASSY 左",
  "compatible_vehicles": [
    {
      "maker": "トヨタ",
      "model": "プリウス",
      "model_code": "ZVW30",
      "year_from": 2009,
      "year_to": 2015,
      "grade": ["S", "G", "L"],
      "notes": "全グレード対応"
    }
  ]
}
```

### 2. 車両情報から適合部品を検索

**エンドポイント:** `POST /api/external/argos/vehicle/parts`

**使用例:**
```bash
curl -X POST http://localhost:3000/api/external/argos/vehicle/parts \
  -H 'Content-Type: application/json' \
  -d '{
    "maker": "トヨタ",
    "model": "プリウス",
    "model_code": "ZVW30",
    "year": 2012,
    "category": "ボディパーツ"
  }'
```

**レスポンス:**
```json
{
  "success": true,
  "vehicle": {
    "maker": "トヨタ",
    "model": "プリウス",
    "model_code": "ZVW30",
    "year": 2012
  },
  "parts": [
    {
      "part_number": "67002-47130",
      "part_name": "フロントドア 左",
      "category": "ボディパーツ",
      "price_range": "20000-30000"
    }
  ]
}
```

### 3. 品番の互換性確認

**エンドポイント:** `GET /api/external/argos/part-number/:partNumber/alternatives`

**使用例:**
```bash
curl http://localhost:3000/api/external/argos/part-number/67002-47130/alternatives
```

**レスポンス:**
```json
{
  "success": true,
  "original_part_number": "67002-47130",
  "alternatives": [
    {
      "part_number": "67002-47131",
      "type": "互換品",
      "manufacturer": "純正"
    }
  ],
  "superseded_by": "67002-47140"
}
```

---

## 🔄 データフロー

### 適合情報の取得と保存

```
1. ユーザーが品番を入力
     ↓
2. ローカルDBを検索
     ↓
3. データがない場合、アルゴスAPIを呼び出し
     ↓
4. 取得した適合情報をDBに保存
     ↓
5. ユーザーに結果を表示
```

### キャッシュ戦略

```typescript
// 疑似コード
async function getCompatibility(partNumber) {
  // 1. ローカルDBから取得
  const cached = await db.getCompatibility(partNumber)
  if (cached && !cached.isExpired()) {
    return cached
  }

  // 2. アルゴスAPIから取得
  const argosData = await argosAPI.getCompatibility(partNumber)
  
  // 3. DBに保存（7日間キャッシュ）
  await db.saveCompatibility(partNumber, argosData, 7 * 24 * 60 * 60)
  
  return argosData
}
```

---

## 💡 活用例

### 1. 商品出品時の適合情報自動入力

```typescript
// 商品出品フォームで品番を入力すると自動で適合車種を取得
async function onPartNumberInput(partNumber) {
  const response = await fetch(
    `/api/external/argos/part-number/${partNumber}/vehicles`
  )
  const data = await response.json()
  
  // フォームに適合情報を自動入力
  if (data.compatible_vehicles.length > 0) {
    autoFillCompatibilityForm(data.compatible_vehicles)
  }
}
```

### 2. 検索精度の向上

```typescript
// ユーザーが車両登録時に、アルゴスAPIで車種情報を補完
async function enrichVehicleData(modelCode) {
  const response = await fetch(
    `/api/external/argos/vehicle/details?model_code=${modelCode}`
  )
  const data = await response.json()
  
  // グレード、エンジン型式などを自動入力
  return {
    grade: data.grades,
    engine_type: data.engine_type,
    drive_type: data.drive_type
  }
}
```

### 3. 後継品番の提案

```typescript
// 廃版部品の場合、後継品番を提案
async function checkSuperseded(partNumber) {
  const response = await fetch(
    `/api/external/argos/part-number/${partNumber}/alternatives`
  )
  const data = await response.json()
  
  if (data.superseded_by) {
    showMessage(`この部品は廃版です。後継品番: ${data.superseded_by}`)
  }
}
```

---

## ⚠️ 注意事項

### 1. APIレート制限

- アルゴスAPIには呼び出し回数制限があります
- ローカルDBにキャッシュして呼び出し回数を削減してください

### 2. エラーハンドリング

```typescript
try {
  const response = await fetch(argosApiUrl)
  if (!response.ok) {
    // APIエラーの処理
    if (response.status === 429) {
      // レート制限エラー
      return useLocalDataOnly()
    }
  }
} catch (error) {
  // ネットワークエラーの処理
  console.error('Argos API error:', error)
  return fallbackToLocalData()
}
```

### 3. コスト管理

- API呼び出し回数に応じて課金されます
- 不要な重複呼び出しを避けてください
- キャッシュを活用してください

---

## 🚀 今後の実装予定

### Phase 1: 基本連携（準備完了）
- ✅ APIルート準備
- ✅ 環境変数設定
- ⏳ 実際のAPI呼び出し実装

### Phase 2: データ統合
- ⏳ アルゴスデータのDB保存
- ⏳ キャッシュ機構実装
- ⏳ データ同期バッチ処理

### Phase 3: 高度な機能
- ⏳ 画像データ連携
- ⏳ リアルタイム在庫確認
- ⏳ 価格情報取得

---

## 📞 サポート

### アルゴスAPI関連

- 公式サイト: https://argos-api-example.com
- サポート: support@argos-api-example.com
- ドキュメント: https://docs.argos-api-example.com

### プロジェクト関連

- GitHub Issues で質問してください
- README.md を参照してください

---

## 📝 更新履歴

- 2026-03-21: 初版作成（API連携準備実装）
