# 自動車パーツ売買プラットフォーム

## プロジェクト概要
- **名前**: webapp (自動車パーツ売買プラットフォーム)
- **目標**: 自動車整備工場向けの純正パーツ・工具の専門売買マーケットプレイス
- **コンセプト**: メルカリのように手軽に使える、整備工場専門のCtoCプラットフォーム

## 主要機能

### 現在実装済み ✅
1. **基本インフラ**
   - Hono + Cloudflare Pages構成
   - D1データベース（ローカル開発環境）
   - RESTful API設計

2. **データベース**
   - ユーザー管理（整備工場・個人）
   - カテゴリ・サブカテゴリ管理（10大カテゴリ、40+サブカテゴリ）
   - メーカー・車種管理（12メーカー、テスト用車種データ）
   - 商品管理（最大10枚の画像対応）
   - 取引・評価・メッセージシステム
   - お気に入り機能
   - 出品代行リクエスト管理

3. **API実装済み**
   - `GET /api/health` - ヘルスチェック
   - `GET /api/categories` - カテゴリ一覧
   - `GET /api/categories/:id` - カテゴリ詳細とサブカテゴリ
   - `GET /api/makers` - メーカー一覧
   - `GET /api/makers/:id/models` - 車種一覧
   - `GET /api/products` - 商品一覧（検索・フィルタ対応）
   - `GET /api/products/:id` - 商品詳細

4. **フロントエンド**
   - トップページ（商品一覧表示）
   - レスポンシブデザイン（TailwindCSS）
   - カテゴリナビゲーション
   - 検索バー

### 未実装機能 🚧
1. **ユーザー認証**
   - 会員登録・ログイン
   - メール認証
   - プロフィール管理

2. **商品機能**
   - 商品出品（画像アップロード含む）
   - 商品編集・削除
   - 商品検索の詳細フィルター

3. **取引機能**
   - Stripe決済連携
   - 購入フロー
   - 取引メッセージ
   - 発送通知・受取確認
   - 評価システム

4. **出品代行**
   - 代行依頼フォーム
   - 管理画面での承認フロー

5. **管理画面**
   - カテゴリ・メーカー・車種の追加/編集
   - ユーザー管理
   - 商品管理
   - 取引管理
   - 統計ダッシュボード

## URLs

### 開発環境
- **Sandbox URL**: https://3000-iuwaode8f8wmya6easupd-5185f4aa.sandbox.novita.ai
- **ローカル**: http://localhost:3000

### API エンドポイント
- ヘルスチェック: `/api/health`
- カテゴリ一覧: `/api/categories`
- メーカー一覧: `/api/makers`
- 商品一覧: `/api/products?limit=20&page=1`
- 商品詳細: `/api/products/:id`

## データ構造

### 主要テーブル
1. **users** - ユーザー（整備工場・個人）
2. **categories** - カテゴリ（10種類）
3. **subcategories** - サブカテゴリ（40+種類）
4. **car_makers** - メーカー（12社）
5. **car_models** - 車種
6. **products** - 商品
7. **product_images** - 商品画像（最大10枚）
8. **transactions** - 取引
9. **reviews** - 評価
10. **messages** - 取引メッセージ
11. **favorites** - お気に入り
12. **proxy_requests** - 出品代行依頼
13. **admins** - 管理者

### ストレージサービス
- **Cloudflare D1**: メインデータベース（SQLite互換）
- **Cloudflare R2**: 商品画像ストレージ（予定）
- **Cloudflare KV**: セッション管理（予定）

## 技術スタック

### バックエンド
- **フレームワーク**: Hono v4
- **ランタイム**: Cloudflare Workers
- **データベース**: Cloudflare D1 (SQLite)
- **言語**: TypeScript

### フロントエンド
- **スタイル**: TailwindCSS (CDN)
- **アイコン**: Font Awesome
- **HTTP**: Axios

### 開発ツール
- **ビルド**: Vite
- **デプロイ**: Wrangler (Cloudflare CLI)
- **プロセス管理**: PM2
- **バージョン管理**: Git

## 開発ガイド

### 前提条件
- Node.js 18+
- npm

### セットアップ
```bash
# 依存関係インストール
npm install

# データベースマイグレーション（ローカル）
npm run db:migrate:local

# シードデータ投入
npm run db:seed

# ビルド
npm run build

# 開発サーバー起動（PM2）
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs webapp --nostream
```

### よく使うコマンド
```bash
# ポートクリーンアップ
npm run clean-port

# ビルド
npm run build

# ローカルD1データベース操作
npm run db:migrate:local    # マイグレーション実行
npm run db:seed             # シードデータ投入
npm run db:reset            # DB完全リセット
npm run db:console:local    # SQLコンソール

# Git操作
npm run git:status
npm run git:log
npm run git:commit "commit message"
```

## ビジネスモデル

### 手数料構造
- **基本手数料**: 販売価格の5%
- **出品代行手数料**: 売買手数料の30%（販売価格の1.5%）
- **総手数料（代行時）**: 販売価格の6.5%

### 計算例
商品価格: ¥50,000の場合
- 基本手数料: ¥2,500 (5%)
- 出品代行手数料: ¥750 (1.5%)
- 購入者支払額: ¥52,500
- 出品者受取額: ¥46,750（代行時）/ ¥47,500（通常）

## 次の開発ステップ

### Phase 1: 認証・商品管理 🎯（優先度: 高）
1. ユーザー認証システム実装
2. 商品出品機能（画像アップロード含む）
3. 商品編集・削除機能

### Phase 2: 取引機能 🎯（優先度: 高）
1. Stripe決済連携
2. 購入フロー実装
3. 取引メッセージ機能
4. 評価システム

### Phase 3: 管理画面 🎯（優先度: 中）
1. 管理者認証
2. カテゴリ・メーカー・車種管理UI
3. 出品代行承認フロー
4. ユーザー・商品・取引管理

### Phase 4: 追加機能 🎯（優先度: 低）
1. 通知機能（メール/アプリ内）
2. 高度な検索・フィルター
3. レコメンデーション
4. モバイルアプリ対応

## プロジェクト構造
```
webapp/
├── src/
│   ├── index.tsx          # メインアプリケーション
│   ├── types.ts           # TypeScript型定義
│   └── routes/
│       └── api.ts         # APIルート
├── migrations/
│   ├── 0001_initial_schema.sql    # スキーマ定義
│   └── 0002_initial_data.sql      # 初期データ
├── public/
│   └── static/            # 静的ファイル
├── seed.sql               # テストデータ
├── wrangler.jsonc         # Cloudflare設定
├── ecosystem.config.cjs   # PM2設定
├── package.json
└── README.md
```

## デプロイ

### 本番環境（Cloudflare Pages）
```bash
# Cloudflare認証設定
npx wrangler login

# 本番D1データベース作成
npx wrangler d1 create webapp-production

# マイグレーション実行
npm run db:migrate:prod

# デプロイ
npm run deploy:prod
```

## 連絡先・サポート
開発中のため、問題や質問があればGitHubのIssueで報告してください。

---

**最終更新**: 2026-03-21  
**ステータス**: 🚧 開発中（MVP Phase 1）  
**進捗**: 基本インフラ・API実装完了、認証・取引機能開発中
