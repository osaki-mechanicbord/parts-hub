# parts-hub-tci.com ドメイン設定手順

## 🎉 ドメイン購入完了

**ドメイン名**: `parts-hub-tci.com`  
**レジストラ**: Cloudflare Registrar  
**アカウント**: Osaki.mf@gmail.com's Account

---

## ✅ 現在の状況

- ✅ ドメイン購入完了（Cloudflare Registrar）
- ✅ ドメインは既にCloudflareアカウントに存在
- ✅ ネームサーバー設定不要（Cloudflare管理下）
- ⏳ Pagesプロジェクトへの接続が必要

---

## 🚀 設定手順（所要時間: 約5分）

### ステップ1: Cloudflareダッシュボードにログイン

1. **ブラウザで開く**
   ```
   https://dash.cloudflare.com
   ```

2. **ログイン**
   - アカウント: Osaki.mf@gmail.com

3. **左サイドバーで `parts-hub-tci.com` を確認**
   - ドメインリストに表示されているはずです

### ステップ2: DNS設定を確認

1. **parts-hub-tci.com をクリック**

2. **左メニュー「DNS」→「Records」を選択**

3. **現在のレコードを確認**
   - 既存のレコードがあれば確認
   - なければ新規追加

### ステップ3: Pagesプロジェクトにカスタムドメインを追加

1. **左サイドバーから「Workers & Pages」を選択**

2. **`parts-hub` プロジェクトをクリック**
   - ※もしプロジェクトがまだ作成されていない場合は、先にプロジェクトをデプロイしてください

3. **「Custom domains」タブをクリック**

4. **「Set up a custom domain」ボタンをクリック**

5. **ドメイン名を入力**
   ```
   parts-hub-tci.com
   ```

6. **「Continue」をクリック**

7. **DNS設定の確認画面が表示される**
   - Cloudflareが自動でDNSレコードを追加します
   ```
   Type: CNAME
   Name: parts-hub-tci.com
   Content: parts-hub.pages.dev
   Proxy: ON (オレンジクラウド)
   ```

8. **「Activate domain」をクリック**

9. **SSL証明書の自動発行を待つ**
   - 通常: 5-15分
   - 「Active」と表示されれば完了

### ステップ4: www サブドメインも追加（推奨）

1. **再度「Set up a custom domain」をクリック**

2. **www付きドメインを入力**
   ```
   www.parts-hub-tci.com
   ```

3. **「Continue」→「Activate domain」**

4. **SSL証明書発行を待つ**

### ステップ5: wwwリダイレクト設定（オプション）

www → non-www にリダイレクトする場合:

1. **左サイドバー → parts-hub-tci.com → Rules → Page Rules**

2. **「Create Page Rule」をクリック**

3. **設定を入力**
   ```
   URL: www.parts-hub-tci.com/*
   Setting: Forwarding URL
   Status Code: 301 - Permanent Redirect
   Destination URL: https://parts-hub-tci.com/$1
   ```

4. **「Save and Deploy」をクリック**

---

## 📊 DNS設定の詳細

### 自動作成されるレコード

#### 1. ルートドメイン
```
Type: CNAME
Name: parts-hub-tci.com (または @)
Content: parts-hub.pages.dev
Proxy: ✅ Proxied (オレンジクラウド)
TTL: Auto
```

#### 2. WWWサブドメイン
```
Type: CNAME
Name: www
Content: parts-hub.pages.dev
Proxy: ✅ Proxied (オレンジクラウド)
TTL: Auto
```

### 手動でDNS設定する場合

もし自動作成されない場合、手動で追加:

1. **DNS → Records → Add record**

2. **ルートドメイン用**
   ```
   Type: CNAME
   Name: @ (またはルートドメイン)
   Target: parts-hub.pages.dev
   Proxy status: Proxied (クリックしてオレンジに)
   TTL: Auto
   ```

3. **WWWサブドメイン用**
   ```
   Type: CNAME
   Name: www
   Target: parts-hub.pages.dev
   Proxy status: Proxied
   TTL: Auto
   ```

4. **「Save」をクリック**

---

## 🔒 SSL証明書の確認

### 自動発行（Cloudflare Pages）

- **証明書タイプ**: Let's Encrypt
- **発行時間**: 5-15分（最大24時間）
- **自動更新**: 90日ごと

### SSL/TLS設定の確認

1. **parts-hub-tci.com → SSL/TLS → Overview**

2. **暗号化モードを確認**
   ```
   推奨: Full (strict)
   ```

3. **Edge Certificatesを確認**
   ```
   Always Use HTTPS: ON ← 有効化推奨
   Automatic HTTPS Rewrites: ON ← 有効化推奨
   ```

---

## ✅ 動作確認

### 1. DNS伝播確認

**オンラインツール**: https://www.whatsmydns.net/

1. `parts-hub-tci.com` を入力
2. レコードタイプ: CNAME
3. 「Search」をクリック
4. 世界各地で `parts-hub.pages.dev` を指していることを確認

### 2. ブラウザで確認

以下のURLすべてでアクセスできることを確認:

```
✅ http://parts-hub-tci.com
   → https://parts-hub-tci.com にリダイレクト

✅ https://parts-hub-tci.com
   → PARTS HUBトップページが表示

✅ http://www.parts-hub-tci.com
   → https://parts-hub-tci.com または https://www.parts-hub-tci.com

✅ https://www.parts-hub-tci.com
   → 表示されるか、https://parts-hub-tci.com にリダイレクト
```

### 3. SSL証明書確認

ブラウザで `https://parts-hub-tci.com` にアクセス:

- ✅ アドレスバーに🔒マークが表示される
- ✅ 「接続は保護されています」と表示
- ✅ 証明書の詳細を確認（Let's Encrypt発行）

### 4. 主要ページの確認

| URL | 確認内容 |
|-----|----------|
| `https://parts-hub-tci.com/` | トップページ |
| `https://parts-hub-tci.com/admin` | 管理画面 |
| `https://parts-hub-tci.com/search` | 検索ページ |
| `https://parts-hub-tci.com/faq` | FAQページ |
| `https://parts-hub-tci.com/sitemap.xml` | サイトマップ |
| `https://parts-hub-tci.com/robots.txt` | robots.txt |

---

## 🎯 推奨設定まとめ

### 最終的な構成

```
メインドメイン:     https://parts-hub-tci.com
wwwリダイレクト:   https://www.parts-hub-tci.com → https://parts-hub-tci.com
旧URL:             https://parts-hub.pages.dev → https://parts-hub-tci.com
```

### DNS設定
```
parts-hub-tci.com → CNAME → parts-hub.pages.dev (Proxied)
www               → CNAME → parts-hub.pages.dev (Proxied)
```

### SSL/TLS設定
```
Encryption mode:           Full (strict)
Always Use HTTPS:          ON
Automatic HTTPS Rewrites:  ON
```

### Page Rules
```
www.parts-hub-tci.com/* → 301 Redirect → https://parts-hub-tci.com/$1
```

---

## 🔧 トラブルシューティング

### ❌ 「Project not found」エラー

**原因**: Pagesプロジェクト `parts-hub` がまだ作成されていない

**解決方法**:
1. 先にPagesプロジェクトをデプロイ
2. `MANUAL_DEPLOYMENT.md` を参照してデプロイ実行
3. デプロイ完了後、カスタムドメイン設定を実施

### ❌ SSL証明書エラー

**原因**: 証明書発行中、またはDNS設定が正しくない

**解決方法**:
1. 15-30分待つ
2. DNS設定を再確認
3. Cloudflare Proxy（オレンジクラウド）が有効か確認
4. 最大24時間待つ

### ❌ 「Too many redirects」エラー

**原因**: SSL/TLS設定が不適切

**解決方法**:
1. SSL/TLS → Overview
2. Encryption modeを `Full (strict)` に変更
3. ブラウザキャッシュをクリア
4. シークレットモードで再度アクセス

### ❌ ページが表示されない（404）

**原因**: カスタムドメイン設定が完了していない

**解決方法**:
1. Workers & Pages → parts-hub → Custom domains
2. ドメインのステータスを確認（Activeか？）
3. 「Retry」または再度ドメイン追加
4. DNS伝播を待つ（数分）

---

## 📱 最終確認チェックリスト

### デプロイ前
- [x] Cloudflareでドメイン購入完了
- [ ] Pagesプロジェクトデプロイ完了
- [ ] Custom domains設定開始

### 設定中
- [ ] parts-hub-tci.com を Custom domains に追加
- [ ] www.parts-hub-tci.com を Custom domains に追加
- [ ] SSL証明書発行完了（Active表示）
- [ ] DNS設定確認（CNAME x2）

### 設定後
- [ ] https://parts-hub-tci.com でアクセス可能
- [ ] 🔒マーク表示確認
- [ ] 管理画面アクセス可能
- [ ] sitemap.xml表示確認
- [ ] robots.txt表示確認

---

## 🎉 設定完了後のURL

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
ダッシュボード: https://parts-hub-tci.com/admin
ユーザー管理:   https://parts-hub-tci.com/admin/users
商品管理:       https://parts-hub-tci.com/admin/products
取引管理:       https://parts-hub-tci.com/admin/transactions
売上レポート:   https://parts-hub-tci.com/admin/sales
```

**SEO関連**:
```
Sitemap:      https://parts-hub-tci.com/sitemap.xml
Robots:       https://parts-hub-tci.com/robots.txt
```

---

## 📧 メールアドレスの設定（オプション）

ドメインでメールを使用する場合（例: info@parts-hub-tci.com）:

### Google Workspace（推奨）

**料金**: ¥680/月/ユーザー

**設定手順**:
1. Google Workspace購入
2. MXレコード追加
   ```
   Type: MX
   Name: @
   Priority: 1
   Target: ASPMX.L.GOOGLE.COM
   ```
3. その他4つのMXレコード追加（Google指示に従う）
4. SPF, DKIM, DMARC設定

### Cloudflare Email Routing（無料）

**料金**: 無料（転送のみ）

**設定手順**:
1. parts-hub-tci.com → Email → Email Routing
2. Enable Email Routing
3. 転送先アドレスを設定（例: osaki.mf@gmail.com）
4. MXレコード自動追加
5. info@parts-hub-tci.com に届いたメールが転送される

---

## 💰 コスト

### 年間費用

```
ドメイン（.com）:       約$10/年（約¥1,400）
Cloudflare Pages:      ¥0（無料）
SSL証明書:             ¥0（無料）
────────────────────────────────
合計:                  約¥1,400/年
```

### オプション費用

```
Google Workspace:      ¥680/月/ユーザー（メール用）
Cloudflare Pro:        $20/月（高度な機能）
Cloudflare D1:         ¥0（無料枠内）
```

---

## 📞 サポート情報

### Cloudflareサポート
- **ダッシュボード**: https://dash.cloudflare.com
- **ドキュメント**: https://developers.cloudflare.com/
- **Community**: https://community.cloudflare.com/

### プロジェクト情報
- **プロジェクト名**: parts-hub
- **ドメイン**: parts-hub-tci.com
- **Account ID**: 0aa080e5d86dabb95aea326d6e81ca18

---

## 🚀 次のステップ

1. **Custom domains設定を完了させる**
   - Workers & Pages → parts-hub → Custom domains
   - parts-hub-tci.com を追加
   - www.parts-hub-tci.com を追加

2. **SSL証明書の発行を待つ**
   - 5-15分待機
   - Activeステータスを確認

3. **動作確認**
   - https://parts-hub-tci.com にアクセス
   - 全ページの表示確認
   - 管理画面の動作確認

4. **SEO対策**
   - Google Search Consoleに登録
   - サイトマップ送信
   - Google Analyticsセットアップ

5. **メール設定（必要に応じて）**
   - Cloudflare Email Routing設定
   - または Google Workspace購入

---

**設定完了までの想定時間**: 約15-30分

何か問題があればお知らせください！
