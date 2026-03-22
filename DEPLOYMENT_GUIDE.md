# PARTS HUB Cloudflare Pages デプロイガイド

## 現在の状況
- ✅ ビルド完了: `dist/` ディレクトリに473.20 KBのWorkerファイル生成済み
- ✅ Git管理: すべての変更コミット済み（最新commit: 2a40f04）
- ✅ Cloudflare認証: API Token設定済み
- ⚠️ プロジェクト未作成: Cloudflareダッシュボードで手動作成が必要

## デプロイ手順

### 方法1: Cloudflareダッシュボードから（推奨）

1. **Cloudflareダッシュボードにアクセス**
   - https://dash.cloudflare.com にログイン
   - アカウント: Osaki.mf@gmail.com's Account
   - Account ID: 0aa080e5d86dabb95aea326d6e81ca18

2. **Pagesプロジェクト作成**
   - 左メニューから「Workers & Pages」を選択
   - 「Create application」→「Pages」→「Upload assets」を選択
   - プロジェクト名: `parts-hub`
   - Production branch: `main`

3. **distフォルダをアップロード**
   - `/home/user/webapp/dist` フォルダの内容をアップロード
   - または下記のコマンドでローカルマシンにダウンロードしてアップロード

4. **デプロイ設定**
   - Build command: （空欄）
   - Build output directory: `/`
   - Root directory: `/`

### 方法2: CLI経由（プロジェクト作成後）

プロジェクト作成後、以下のコマンドでデプロイ可能：

```bash
cd /home/user/webapp
CLOUDFLARE_ACCOUNT_ID=0aa080e5d86dabb95aea326d6e81ca18 \
npx wrangler pages deploy dist --project-name parts-hub --commit-dirty=true
```

## デプロイ後の設定

### 1. D1データベースの作成と接続

```bash
# 本番D1データベース作成
npx wrangler d1 create parts-hub-production

# 出力されたdatabase_idをメモ

# マイグレーション実行
npx wrangler d1 migrations apply parts-hub-production

# Pagesプロジェクトに接続
# ダッシュボード → parts-hub → Settings → Functions → D1 database bindings
# Binding name: DB
# Database: parts-hub-production
```

### 2. R2バケットの作成と接続（必要に応じて）

```bash
# R2バケット作成
npx wrangler r2 bucket create parts-hub-images

# Pagesプロジェクトに接続
# ダッシュボード → parts-hub → Settings → Functions → R2 bucket bindings
# Binding name: R2
# Bucket: parts-hub-images
```

### 3. 環境変数の設定（必要に応じて）

```bash
# Secretの設定
npx wrangler pages secret put API_KEY --project-name parts-hub

# 環境変数
# ダッシュボード → parts-hub → Settings → Environment variables
```

## デプロイ後のURL

- **Production**: https://parts-hub.pages.dev
- **Branch**: https://main.parts-hub.pages.dev

## トラブルシューティング

### APIトークンの権限不足
現在のAPI Tokenには以下の権限が必要：
- Account Settings: Read
- Cloudflare Pages: Edit
- Workers Scripts: Edit

権限を追加する場合:
1. https://dash.cloudflare.com/profile/api-tokens
2. 該当トークンを編集
3. 必要な権限を追加
4. トークンを再度 `setup_cloudflare_api_key` で設定

### プロジェクト名の重複
もし `parts-hub` が使用できない場合:
- `parts-hub-2`、`partshub`、`partshub-market` などの代替名を使用
- `wrangler.jsonc` の `name` を変更
- デプロイコマンドの `--project-name` も変更

## ビルド済みファイルの確認

```bash
ls -lh /home/user/webapp/dist/
```

出力:
- _worker.js (473.20 KB) - メインWorkerファイル
- _routes.json - ルーティング設定
- その他静的ファイル（publicディレクトリの内容）

## プロジェクト情報

- **プロジェクト名**: parts-hub
- **Build size**: 473.20 KB
- **総ページ数**: 35+
- **管理API数**: 20+
- **主な機能**:
  - ユーザー管理
  - 商品管理
  - 取引管理
  - レビュー管理
  - 通報管理
  - 売上レポート
  - SEO/LLMO最適化

## サポート

デプロイに問題がある場合は、Cloudflareサポートまたはドキュメントを参照：
- https://developers.cloudflare.com/pages/
- https://developers.cloudflare.com/workers/wrangler/
