# 🚀 PARTS HUB - Cloudflare Pages 本番デプロイ手順

## ✅ 現在の状況

- ✅ ドメイン購入完了: `parts-hub-tci.com`（Cloudflare Registrar）
- ✅ プロジェクトビルド完了: `dist/` フォルダ（473.28 KB）
- ✅ コード内ドメイン参照を更新済み
- ✅ Git コミット完了
- ⏳ **次のステップ**: Cloudflare Pages プロジェクト作成＆デプロイ

---

## 📋 デプロイ手順（所要時間: 約10-15分）

### ステップ1: Cloudflare ダッシュボードにアクセス

1. **ブラウザで開く**
   ```
   https://dash.cloudflare.com
   ```

2. **ログイン**
   - アカウント: `Osaki.mf@gmail.com`
   - Account ID: `0aa080e5d86dabb95aea326d6e81ca18`

3. **左サイドバーから「Workers & Pages」を選択**

---

### ステップ2: Pagesプロジェクトを作成

1. **「Create application」ボタンをクリック**

2. **「Pages」タブを選択**

3. **「Upload assets」を選択**
   - ※「Connect to Git」ではなく「Upload assets」を選択してください

4. **プロジェクト名を入力**
   ```
   parts-hub
   ```

5. **「Create project」をクリック**

---

### ステップ3: ビルドファイルをアップロード

#### 🔴 重要: アップロードするのは `dist` フォルダの**中身**のみ

以下の方法でファイルをアップロードします:

#### 方法A: ダッシュボードから直接アップロード

1. **バックアップファイルをダウンロード**
   ```
   https://www.genspark.ai/api/files/s/W6XBnfwI
   ファイル名: parts-hub-production-ready.tar.gz
   ```

2. **解凍**
   ```bash
   # Macの場合
   tar -xzf parts-hub-production-ready.tar.gz
   
   # Windowsの場合
   7-Zipなどで解凍
   ```

3. **`dist/` フォルダの中身を確認**
   ```
   dist/
   ├── _worker.js       (473 KB) ← これが必須
   ├── _routes.json     ← これも必須
   └── その他のファイル
   ```

4. **`dist/` フォルダ内のすべてのファイルを選択**
   - ⚠️ `dist` フォルダ自体ではなく、**中身のファイル**を選択

5. **ドラッグ&ドロップでアップロード**
   - または「Select from computer」でファイル選択

6. **「Deploy site」をクリック**

---

#### 方法B: wrangler CLI（ダッシュボードでプロジェクト作成後）

プロジェクト作成後、以下のコマンドでデプロイ可能:

```bash
cd /home/user/webapp
CLOUDFLARE_ACCOUNT_ID=0aa080e5d86dabb95aea326d6e81ca18 \
npx wrangler pages deploy dist \
  --project-name parts-hub \
  --commit-dirty=true
```

---

### ステップ4: デプロイ完了を確認

1. **デプロイが完了すると、以下のURLが表示されます**
   ```
   ✅ Production: https://random-id.pages.dev
   ✅ Branch: https://main.parts-hub.pages.dev
   ```

2. **URLにアクセスして動作確認**
   ```
   https://parts-hub.pages.dev/
   https://parts-hub.pages.dev/admin
   ```

3. **正常に表示されることを確認**

---

### ステップ5: カスタムドメインを設定

1. **Workers & Pages → parts-hub → Custom domains タブ**

2. **「Set up a custom domain」をクリック**

3. **ドメイン名を入力**
   ```
   parts-hub-tci.com
   ```

4. **「Continue」をクリック**

5. **DNS設定を確認**
   - Cloudflareが自動でCNAMEレコードを追加します
   ```
   Type: CNAME
   Name: parts-hub-tci.com
   Content: parts-hub.pages.dev
   Proxy: ON (オレンジクラウド)
   ```

6. **「Activate domain」をクリック**

7. **SSL証明書の発行を待つ**
   - 通常: 5-15分
   - 最大: 24時間
   - 「Active」と表示されれば完了

---

### ステップ6: www サブドメインも追加（推奨）

1. **再度「Set up a custom domain」をクリック**

2. **www付きドメインを入力**
   ```
   www.parts-hub-tci.com
   ```

3. **「Continue」→「Activate domain」**

4. **SSL証明書発行を待つ**

---

### ステップ7: D1 データベースの設定

#### 7-1: D1データベースを作成

```bash
# ローカルターミナルで実行
cd /home/user/webapp
npx wrangler d1 create parts-hub-production
```

**出力例:**
```
✅ Successfully created DB 'parts-hub-production'!

[[d1_databases]]
binding = "DB"
database_name = "parts-hub-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### 7-2: マイグレーションを実行

```bash
npx wrangler d1 migrations apply parts-hub-production
```

#### 7-3: Pagesプロジェクトにバインディングを追加

1. **Workers & Pages → parts-hub → Settings → Bindings**

2. **「Add」をクリック → 「D1 database」を選択**

3. **設定を入力**
   ```
   Variable name: DB
   D1 database: parts-hub-production
   ```

4. **「Save」をクリック**

5. **再デプロイ**
   - プロジェクトが自動的に再デプロイされます

---

## ✅ 動作確認チェックリスト

### 基本確認

- [ ] https://parts-hub-tci.com でアクセス可能
- [ ] 🔒マークが表示される（SSL有効）
- [ ] トップページが正しく表示される

### 主要ページ確認

- [ ] トップページ: https://parts-hub-tci.com/
- [ ] 検索ページ: https://parts-hub-tci.com/search
- [ ] 出品ページ: https://parts-hub-tci.com/listing
- [ ] FAQページ: https://parts-hub-tci.com/faq

### 管理画面確認

- [ ] ダッシュボード: https://parts-hub-tci.com/admin
- [ ] ユーザー管理: https://parts-hub-tci.com/admin/users
- [ ] 商品管理: https://parts-hub-tci.com/admin/products
- [ ] 取引管理: https://parts-hub-tci.com/admin/transactions
- [ ] 売上レポート: https://parts-hub-tci.com/admin/sales

### SEO確認

- [ ] Sitemap: https://parts-hub-tci.com/sitemap.xml
- [ ] Robots: https://parts-hub-tci.com/robots.txt
- [ ] JSON-LD 構造化データ（ページソース確認）
- [ ] Open Graph タグ（ページソース確認）

---

## 🔧 トラブルシューティング

### ❌ 「Project not found」エラー

**原因**: ダッシュボードでプロジェクトを先に作成する必要がある

**解決方法**:
1. ダッシュボードで「Create application」
2. 「Pages」→「Upload assets」
3. プロジェクト名「parts-hub」で作成
4. その後、ファイルをアップロード

---

### ❌ 「_worker.js not found」エラー

**原因**: `dist` フォルダではなく、その親フォルダをアップロードしている

**解決方法**:
1. `dist/` フォルダを開く
2. **中身のファイルだけ**を選択してアップロード
3. `_worker.js` と `_routes.json` が必須

---

### ❌ SSL証明書エラー

**原因**: 証明書発行中、またはDNS設定が未完了

**解決方法**:
1. 15-30分待つ
2. DNS設定を確認（Proxyが有効か）
3. 最大24時間待つ
4. それでもダメなら、カスタムドメインを削除して再追加

---

### ❌ ページが404エラー

**原因**: ルーティング設定またはバインディングの問題

**解決方法**:
1. `dist/_routes.json` が正しくアップロードされているか確認
2. D1バインディングが正しく設定されているか確認
3. 再デプロイを試す

---

## 📊 デプロイ後の次のステップ

### 1. SEO対策

- [ ] Google Search Console に登録
  ```
  https://search.google.com/search-console
  ```

- [ ] サイトマップを送信
  ```
  https://parts-hub-tci.com/sitemap.xml
  ```

- [ ] Google Analytics セットアップ

---

### 2. メール設定（オプション）

#### Cloudflare Email Routing（無料）

1. **parts-hub-tci.com → Email → Email Routing**
2. **「Enable Email Routing」**
3. **転送先アドレスを設定**
   - 例: `osaki.mf@gmail.com`
4. **MXレコード自動追加**
5. **完了**
   - `info@parts-hub-tci.com` に届いたメールが転送される

---

### 3. 監視とアラート設定

- [ ] Cloudflare Analytics を確認
- [ ] エラーログの監視設定
- [ ] アップタイム監視（UptimeRobot等）

---

### 4. パフォーマンス最適化

- [ ] Cloudflare Cache設定の最適化
- [ ] 画像の最適化（R2バケット設定）
- [ ] CDN設定の確認

---

## 💰 運用コスト

### 月間費用（想定）

```
ドメイン（parts-hub-tci.com）:  ¥120/月（年間¥1,400）
Cloudflare Pages:               ¥0（無料）
D1 Database:                    ¥0（無料枠: 5GB, 5M reads/day）
R2 Storage:                     ¥0（無料枠: 10GB）
SSL証明書:                      ¥0（無料）
────────────────────────────────────────
合計:                           ¥120/月（約¥1,400/年）
```

### 有料プラン（必要に応じて）

```
Cloudflare Pro:                 $20/月（高度な機能）
D1 超過料金:                    5GB超過時、¥150/月〜
R2 超過料金:                    10GB超過時、¥15/月〜
Google Workspace:               ¥680/月/ユーザー（メール用）
```

---

## 📞 サポート情報

### Cloudflare

- **ダッシュボード**: https://dash.cloudflare.com
- **ドキュメント**: https://developers.cloudflare.com/
- **Community**: https://community.cloudflare.com/
- **Status**: https://www.cloudflarestatus.com/

### プロジェクト情報

- **プロジェクト名**: parts-hub
- **ドメイン**: parts-hub-tci.com
- **Account ID**: 0aa080e5d86dabb95aea326d6e81ca18
- **バックアップ**: https://www.genspark.ai/api/files/s/W6XBnfwI

---

## 🎉 デプロイ完了後のURL

### 本番環境

**メインサイト**:
```
https://parts-hub-tci.com
```

**主要ページ**:
```
トップ:       https://parts-hub-tci.com/
検索:         https://parts-hub-tci.com/search
商品一覧:     https://parts-hub-tci.com/products
ログイン:     https://parts-hub-tci.com/login
出品:         https://parts-hub-tci.com/listing
マイページ:   https://parts-hub-tci.com/mypage
FAQ:          https://parts-hub-tci.com/faq
```

**管理画面**:
```
ダッシュボード:   https://parts-hub-tci.com/admin
ユーザー管理:     https://parts-hub-tci.com/admin/users
商品管理:         https://parts-hub-tci.com/admin/products
取引管理:         https://parts-hub-tci.com/admin/transactions
レビュー管理:     https://parts-hub-tci.com/admin/reviews
通報管理:         https://parts-hub-tci.com/admin/reports
売上レポート:     https://parts-hub-tci.com/admin/sales
```

**SEO関連**:
```
Sitemap:      https://parts-hub-tci.com/sitemap.xml
Robots:       https://parts-hub-tci.com/robots.txt
```

---

## 📝 重要な注意事項

### アップロードするファイル

✅ **正しい方法**:
- `dist/_worker.js` ← **必須**
- `dist/_routes.json` ← **必須**
- その他 `dist/` 内のすべてのファイル

❌ **間違った方法**:
- `dist` フォルダ自体をアップロード
- `src/` フォルダをアップロード
- プロジェクトルートをアップロード

### DNS設定

- Cloudflare管理下のドメインは**ネームサーバー設定不要**
- カスタムドメイン追加時に**自動でCNAMEレコードが作成**される
- **Proxy（オレンジクラウド）を必ず有効化**

### SSL証明書

- 自動発行のため**手動設定不要**
- 発行に**5-15分**、最大**24時間**かかる
- 「Active」表示を確認してからアクセス

---

**想定デプロイ時間**: 10-15分  
**完了確認**: `https://parts-hub-tci.com` にアクセス

何か問題があればお知らせください！🚀
