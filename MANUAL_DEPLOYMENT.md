# PARTS HUB 手動デプロイマニュアル

## 📋 目次
1. [準備](#準備)
2. [ビルドファイルのダウンロード](#ビルドファイルのダウンロード)
3. [Cloudflareダッシュボードからデプロイ](#cloudflareダッシュボードからデプロイ)
4. [D1データベースのセットアップ](#d1データベースのセットアップ)
5. [デプロイ後の確認](#デプロイ後の確認)
6. [トラブルシューティング](#トラブルシューティング)

---

## 準備

### 必要なもの
- ✅ Cloudflareアカウント（Osaki.mf@gmail.com）
- ✅ ビルド済みファイル（`/home/user/webapp/dist/`）
- ✅ インターネット接続
- ✅ モダンなWebブラウザ

### アカウント情報
- **メールアドレス**: Osaki.mf@gmail.com
- **Account ID**: 0aa080e5d86dabb95aea326d6e81ca18
- **プロジェクト名**: parts-hub

---

## ビルドファイルのダウンロード

### 方法1: プロジェクトバックアップから取得（推奨）

1. **バックアップをダウンロード**
   ```
   URL: https://www.genspark.ai/api/files/s/W6XBnfwI
   ファイル名: parts-hub-production-ready.tar.gz
   サイズ: 1.3 MB
   ```

2. **解凍**
   ```bash
   # Windowsの場合: 7-Zipなどで解凍
   # Macの場合:
   tar -xzf parts-hub-production-ready.tar.gz
   
   # Linuxの場合:
   tar -xzf parts-hub-production-ready.tar.gz
   ```

3. **distフォルダを確認**
   ```
   解凍後のパス: /home/user/webapp/dist/
   
   含まれるファイル:
   - _worker.js (473.20 KB) ← メインファイル
   - _routes.json
   - その他静的ファイル
   ```

### 方法2: サンドボックスから直接ダウンロード

サンドボックス環境にアクセスできる場合：

```bash
cd /home/user/webapp
zip -r dist.zip dist/
# dist.zipをダウンロード
```

---

## Cloudflareダッシュボードからデプロイ

### ステップ1: Cloudflareダッシュボードにログイン

1. **ブラウザで開く**
   ```
   https://dash.cloudflare.com
   ```

2. **ログイン**
   - メール: Osaki.mf@gmail.com
   - パスワード: （既存のパスワード）
   - 2FAが有効な場合は認証コードを入力

3. **アカウント選択**
   - "Osaki.mf@gmail.com's Account" を選択

### ステップ2: Pagesプロジェクト作成

1. **左サイドバーから「Workers & Pages」を選択**

2. **「Create application」ボタンをクリック**

3. **「Pages」タブを選択**

4. **「Upload assets」を選択**
   - ※「Connect to Git」は選択しないでください

5. **プロジェクト名を入力**
   ```
   Project name: parts-hub
   ```
   
   ⚠️ 注意: 
   - プロジェクト名は小文字とハイフンのみ使用可能
   - もし `parts-hub` が使用済みの場合は `parts-hub-2` や `partshub` を使用

6. **「Create project」をクリック**

### ステップ3: ファイルのアップロード

1. **アップロード画面が表示される**

2. **distフォルダの中身をアップロード**
   
   **重要**: distフォルダ自体ではなく、**distフォルダの中のファイルすべて**をアップロードしてください。
   
   アップロードするファイル:
   ```
   ✅ _worker.js (必須 - 473.20 KB)
   ✅ _routes.json (必須)
   ✅ その他すべてのファイル
   ```

   **2つの方法**:
   
   **方法A: ドラッグ&ドロップ**
   - distフォルダを開く
   - すべてのファイルを選択（Ctrl+A / Cmd+A）
   - ブラウザのアップロード領域にドラッグ

   **方法B: ファイル選択**
   - 「Select from computer」をクリック
   - distフォルダ内のすべてのファイルを選択

3. **アップロード完了を待つ**
   - 進捗バーが表示されます
   - すべてのファイルがアップロードされるまで待ちます

4. **「Deploy site」をクリック**

### ステップ4: デプロイ完了

デプロイが完了すると、以下のURLが表示されます：

```
Production URL: https://parts-hub.pages.dev
または
Production URL: https://ランダム文字列.parts-hub.pages.dev
```

---

## D1データベースのセットアップ

デプロイ後、データベースを設定する必要があります。

### ステップ1: D1データベース作成（CLIから）

サンドボックスまたはローカル環境で実行：

```bash
# D1データベース作成
npx wrangler d1 create parts-hub-production

# 出力例:
# ✅ Successfully created DB 'parts-hub-production'!
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "parts-hub-production"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要**: `database_id` をメモしてください！

### ステップ2: マイグレーション実行

```bash
# マイグレーションファイルがある場合
cd /home/user/webapp
npx wrangler d1 migrations apply parts-hub-production

# テストデータ投入（必要に応じて）
npx wrangler d1 execute parts-hub-production --file=./seed.sql
```

### ステップ3: D1をPagesプロジェクトに接続

#### 方法A: ダッシュボードから設定（推奨）

1. **Cloudflareダッシュボード → Workers & Pages**

2. **parts-hub プロジェクトを選択**

3. **「Settings」タブをクリック**

4. **「Functions」セクションを開く**

5. **「D1 database bindings」セクションで「Add binding」をクリック**

6. **設定を入力**
   ```
   Variable name: DB
   D1 database: parts-hub-production を選択
   ```

7. **「Save」をクリック**

8. **再デプロイが必要**
   - ダッシュボードで「Deployments」タブ
   - 最新のデプロイの右側「...」メニュー
   - 「Retry deployment」をクリック

#### 方法B: wrangler.jsonc に追記（次回デプロイ時に有効）

`/home/user/webapp/wrangler.jsonc` を編集：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "parts-hub",
  "compatibility_date": "2026-03-21",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "parts-hub-production",
      "database_id": "your-database-id-here"  // ← ここに実際のIDを入力
    }
  ]
}
```

---

## デプロイ後の確認

### 1. サイトアクセス確認

ブラウザで以下のURLにアクセス：

```
https://parts-hub.pages.dev
```

**確認項目**:
- ✅ トップページが表示される
- ✅ 検索バーが動作する
- ✅ カテゴリが表示される
- ✅ フッターリンクが正しい

### 2. 各ページの確認

| ページ | URL | 確認内容 |
|--------|-----|----------|
| トップ | `/` | 商品一覧、検索バー |
| 検索 | `/search` | 検索機能、フィルター |
| 商品詳細 | `/products/1` | 商品情報表示 |
| ログイン | `/login` | ログインフォーム |
| FAQ | `/faq` | よくある質問 |
| 管理画面 | `/admin` | ダッシュボード |

### 3. APIエンドポイントの確認

ブラウザのデベロッパーツール（F12）→ Consoleで実行：

```javascript
// 商品一覧API
fetch('/api/products').then(r => r.json()).then(console.log)

// カテゴリAPI
fetch('/api/categories').then(r => r.json()).then(console.log)
```

### 4. SEO確認

1. **sitemap.xml**
   ```
   https://parts-hub.pages.dev/sitemap.xml
   ```

2. **robots.txt**
   ```
   https://parts-hub.pages.dev/robots.txt
   ```

3. **構造化データ**
   - トップページを開く
   - 右クリック → 「ページのソースを表示」
   - `application/ld+json` を検索
   - JSON-LDが表示されることを確認

---

## トラブルシューティング

### ❌ エラー: "Application error"

**原因**: D1データベースが接続されていない

**解決方法**:
1. D1データベースが作成されているか確認
2. D1 bindingが正しく設定されているか確認
3. 再デプロイを実行

### ❌ エラー: "_worker.js not found"

**原因**: ファイルアップロードが不完全

**解決方法**:
1. distフォルダの中身を確認（_worker.jsが存在するか）
2. 再度すべてのファイルをアップロード
3. ブラウザのキャッシュをクリア（Ctrl+Shift+Del）

### ❌ エラー: "Too many requests"

**原因**: Cloudflare無料プランの制限

**解決方法**:
1. 少し待ってから再度アクセス
2. 有料プランへのアップグレードを検討

### ❌ データベースエラー

**原因**: D1データベースが初期化されていない

**解決方法**:
```bash
# マイグレーション再実行
npx wrangler d1 migrations apply parts-hub-production

# または、直接SQL実行
npx wrangler d1 execute parts-hub-production --command="SELECT 1"
```

### ❌ 管理画面が表示されない

**原因**: ルートが正しく設定されていない

**確認事項**:
1. `_routes.json` がアップロードされているか
2. `/admin/*` ルートが含まれているか

**解決方法**:
```bash
# _routes.json の内容確認
cat /home/user/webapp/dist/_routes.json

# 再ビルド
cd /home/user/webapp
npm run build

# 再デプロイ
```

### ❌ 静的ファイルが読み込めない

**原因**: publicフォルダの内容がビルドに含まれていない

**解決方法**:
1. publicフォルダにファイルがあるか確認
2. ビルド設定を確認
3. 再ビルド・再デプロイ

---

## カスタムドメインの設定（オプション）

### 1. ドメインの追加

1. **Cloudflareダッシュボード → parts-hub → Custom domains**

2. **「Set up a custom domain」をクリック**

3. **ドメイン名を入力**
   ```
   例: www.parts-hub.com
   または: parts-hub.com
   ```

4. **DNSレコードの設定指示に従う**

5. **SSL証明書が自動発行される（数分かかる場合があります）**

---

## 継続的なデプロイ（オプション）

### GitHub経由の自動デプロイ設定

将来的にGitHubリポジトリと連携する場合：

1. **GitHubリポジトリを作成**

2. **Cloudflare Pages → parts-hub → Settings → Build & deployments**

3. **「Connect to Git」をクリック**

4. **GitHubアカウントを認証**

5. **リポジトリを選択**

6. **ビルド設定**
   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: (空欄)
   ```

7. **保存後、GitHubへのpushで自動デプロイされます**

---

## まとめ

### デプロイ完了チェックリスト

- [ ] Cloudflare Pagesプロジェクト作成完了
- [ ] distファイルアップロード完了
- [ ] サイトが正常に表示される
- [ ] D1データベース作成完了
- [ ] D1バインディング設定完了
- [ ] マイグレーション実行完了
- [ ] 管理画面にアクセスできる
- [ ] sitemap.xml が表示される
- [ ] robots.txt が表示される

### 本番環境URL

デプロイ完了後のURL:
```
https://parts-hub.pages.dev
```

管理画面:
```
https://parts-hub.pages.dev/admin
```

---

## サポート情報

### 公式ドキュメント
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

### プロジェクト情報
- プロジェクトバックアップ: https://www.genspark.ai/api/files/s/W6XBnfwI
- デモ環境: https://3000-iuwaode8f8wmya6easupd-5185f4aa.sandbox.novita.ai

---

**手動デプロイ完了！お疲れ様でした！** 🎉
