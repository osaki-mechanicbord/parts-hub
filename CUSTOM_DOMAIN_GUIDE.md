# PARTS HUB 独自ドメイン設定ガイド

## 📋 目次
1. [独自ドメインについて](#独自ドメインについて)
2. [ドメイン取得方法](#ドメイン取得方法)
3. [Cloudflareでのドメイン設定](#cloudflareでのドメイン設定)
4. [DNS設定](#dns設定)
5. [SSL証明書の設定](#ssl証明書の設定)
6. [動作確認](#動作確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 独自ドメインについて

### 現在の状況
- **デフォルトURL**: `https://parts-hub.pages.dev`
- **必要**: 独自ドメイン（例: `parts-hub.com`）

### おすすめドメイン候補
1. `parts-hub.com` - シンプルで覚えやすい
2. `partshub.jp` - 日本向けサービスを強調
3. `parts-hub.shop` - ショッピングサイトを明示
4. `auto-parts-hub.com` - 自動車部品を明示
5. `tci-parts.com` - 会社名を含む

### 独自ドメインのメリット
- ✅ ブランド力向上
- ✅ SEO効果の向上
- ✅ 信頼性の向上
- ✅ 覚えやすいURL
- ✅ メールアドレスも取得可能（info@parts-hub.com など）

---

## ドメイン取得方法

### おすすめレジストラ

#### 1. **お名前.com**（日本語サポート充実）
- **URL**: https://www.onamae.com/
- **料金例**:
  - `.com`: 約¥1,408/年
  - `.jp`: 約¥3,278/年
  - `.shop`: 約¥298/年（初年度）
- **メリット**: 日本語サポート、日本円決済
- **デメリット**: 更新料が高め、自動更新に注意

#### 2. **Cloudflare Registrar**（最安値、推奨）
- **URL**: https://www.cloudflare.com/products/registrar/
- **料金**: 原価のみ（手数料なし）
  - `.com`: 約$10/年
  - `.net`: 約$13/年
  - `.org`: 約$13/年
- **メリット**: 最安値、Cloudflareと統合、WHOIS保護無料
- **デメリット**: `.jp` ドメイン非対応
- **注意**: Cloudflareアカウント必須

#### 3. **Google Domains**（→ Squarespaceに統合）
- **URL**: https://domains.google/
- **料金例**:
  - `.com`: $12/年
  - `.net`: $12/年
- **メリット**: シンプル、Google統合
- **デメリット**: Squarespaceに移行中

#### 4. **ムームードメイン**（日本語、GMO系）
- **URL**: https://muumuu-domain.com/
- **料金例**:
  - `.com`: ¥1,728/年
  - `.jp`: ¥3,344/年
- **メリット**: 日本語サポート、キャンペーン多い
- **デメリット**: オプション多数

### ドメイン取得手順（お名前.comの例）

#### ステップ1: ドメイン検索
1. https://www.onamae.com/ にアクセス
2. 希望のドメイン名を入力（例: `parts-hub`）
3. 検索ボタンをクリック

#### ステップ2: ドメイン選択
1. 利用可能なドメインの一覧が表示される
2. 希望のドメインを選択（例: `parts-hub.com`）
3. カートに追加

#### ステップ3: 会員登録・決済
1. 会員登録（メールアドレス、パスワード）
2. 登録情報入力（氏名、住所、電話番号）
   - **重要**: WHOIS情報公開代行を有効にする
3. 決済方法選択（クレジットカード推奨）
4. 購入完了

#### ステップ4: ドメイン取得完了
- メールが届く（ドメイン登録完了通知）
- 管理画面でドメインを確認

---

## Cloudflareでのドメイン設定

### 前提条件
- ✅ ドメインを取得済み（例: `parts-hub.com`）
- ✅ Cloudflare Pagesプロジェクト作成済み（`parts-hub`）
- ✅ Cloudflareアカウントでログイン済み

### 方法A: Cloudflareにドメインを追加（推奨）

#### ステップ1: ドメインをCloudflareに追加

1. **Cloudflareダッシュボードにアクセス**
   ```
   https://dash.cloudflare.com
   ```

2. **「Add a Site」をクリック**

3. **ドメイン名を入力**
   ```
   例: parts-hub.com
   ```

4. **プランを選択**
   - 「Free」プラン（$0/月）を選択
   - 「Continue」をクリック

5. **DNSレコードのスキャン**
   - Cloudflareが既存のDNSレコードを自動検出
   - 1-2分待つ

6. **DNSレコードの確認**
   - 検出されたレコードを確認
   - 「Continue」をクリック

#### ステップ2: ネームサーバーの変更

Cloudflareが指定するネームサーバーに変更します：

1. **Cloudflareが表示するネームサーバーをメモ**
   ```
   例:
   ネームサーバー1: alex.ns.cloudflare.com
   ネームサーバー2: maya.ns.cloudflare.com
   ```

2. **ドメインレジストラの管理画面にログイン**
   - お名前.comの場合: https://www.onamae.com/navi/login

3. **ネームサーバー設定を変更**
   
   **お名前.comの場合**:
   - ドメイン一覧 → 該当ドメインを選択
   - 「ネームサーバーの設定」→「ネームサーバーの変更」
   - 「他のネームサーバーを利用」を選択
   - Cloudflareのネームサーバーを入力
   - 「確認」→「設定する」

   **ムームードメインの場合**:
   - コントロールパネル → ドメイン管理 → ドメイン操作
   - 「ネームサーバ設定変更」
   - 「GMOペパボ以外のネームサーバを使用する」
   - Cloudflareのネームサーバーを入力
   - 「ネームサーバ設定変更」

4. **反映を待つ**
   - 通常: 数分〜24時間
   - 平均: 2-3時間

5. **Cloudflareで確認**
   - ダッシュボードに「Active」と表示されれば完了

#### ステップ3: Pagesプロジェクトにカスタムドメインを追加

1. **Cloudflareダッシュボード → Workers & Pages**

2. **parts-hub プロジェクトを選択**

3. **「Custom domains」タブをクリック**

4. **「Set up a custom domain」をクリック**

5. **ドメイン名を入力**
   ```
   parts-hub.com
   ```
   
   または
   
   ```
   www.parts-hub.com
   ```
   
   **推奨**: 両方設定する
   - `parts-hub.com`（ルートドメイン）
   - `www.parts-hub.com`（WWWサブドメイン）

6. **「Continue」をクリック**

7. **DNS設定の確認**
   - Cloudflareが自動でDNSレコードを追加
   - CNAMEレコードが作成される
   ```
   Type: CNAME
   Name: parts-hub.com
   Content: parts-hub.pages.dev
   Proxy: ON (オレンジクラウド)
   ```

8. **「Activate domain」をクリック**

9. **SSL証明書の発行を待つ**
   - 通常: 数分〜15分
   - 「Active」と表示されれば完了

### 方法B: 外部DNSを使用（他のレジストラでDNS管理）

Cloudflareにドメインを追加せず、現在のレジストラでDNS管理する場合：

#### ステップ1: Cloudflare PagesでカスタムドメインをTXTレコードで検証

1. **Workers & Pages → parts-hub → Custom domains**

2. **「Set up a custom domain」→ ドメイン入力**

3. **TXTレコードが表示される**
   ```
   Name: _cf-custom-hostname.parts-hub.com
   Value: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

#### ステップ2: レジストラのDNS設定

お名前.comの場合:

1. **お名前.com管理画面 → DNS設定**

2. **TXTレコードを追加**
   ```
   ホスト名: _cf-custom-hostname
   VALUE: （Cloudflareが表示した値）
   TTL: 3600
   ```

3. **CNAMEレコードを追加**
   ```
   ホスト名: www
   VALUE: parts-hub.pages.dev
   TTL: 3600
   ```

4. **Aレコード（ルートドメイン用）**
   ```
   ホスト名: @（または空欄）
   VALUE: （CloudflareのIPアドレス - 後述）
   TTL: 3600
   ```
   
   **注意**: ルートドメインはCNAMEが使えないため、CNAME Flatteningまたはエイリアス機能が必要

#### ステップ3: 反映を待つ
- DNS反映: 数分〜48時間
- SSL証明書発行: 自動（数分）

---

## DNS設定

### 基本的なDNSレコード

#### 1. WWWあり（www.parts-hub.com）
```
Type: CNAME
Name: www
Content: parts-hub.pages.dev
Proxy: ON (Cloudflare Proxyを有効化)
TTL: Auto
```

#### 2. WWWなし（parts-hub.com）
```
Type: CNAME
Name: @（またはルートドメイン）
Content: parts-hub.pages.dev
Proxy: ON
TTL: Auto
```

**注意**: ルートドメインでCNAMEを使用するには、Cloudflare DNSが必要（CNAME Flattening機能）

#### 3. リダイレクト設定（WWWあり → WWWなし、またはその逆）

Cloudflare Page Rulesで設定:

1. **Cloudflareダッシュボード → parts-hub.com → Rules → Page Rules**

2. **「Create Page Rule」をクリック**

3. **www → non-www リダイレクト**
   ```
   URL: www.parts-hub.com/*
   Setting: Forwarding URL
   Status Code: 301 (Permanent Redirect)
   Destination URL: https://parts-hub.com/$1
   ```

または

4. **non-www → www リダイレクト**
   ```
   URL: parts-hub.com/*
   Setting: Forwarding URL
   Status Code: 301 (Permanent Redirect)
   Destination URL: https://www.parts-hub.com/$1
   ```

### メールサーバーの設定（オプション）

独自ドメインでメールを使用する場合:

#### Google Workspace（推奨）
```
Type: MX
Name: @
Content: 1 ASPMX.L.GOOGLE.COM
Priority: 1
TTL: Auto
```

追加のMXレコード:
```
5 ALT1.ASPMX.L.GOOGLE.COM
5 ALT2.ASPMX.L.GOOGLE.COM
10 ALT3.ASPMX.L.GOOGLE.COM
10 ALT4.ASPMX.L.GOOGLE.COM
```

#### Microsoft 365
```
Type: MX
Name: @
Content: 0 parts-hub-com.mail.protection.outlook.com
Priority: 0
TTL: Auto
```

---

## SSL証明書の設定

### Cloudflare Pagesの場合（自動）

**Cloudflare Pagesは自動でSSL証明書を発行します**:

1. **無料SSL証明書**
   - Let's Encrypt証明書を自動発行
   - 自動更新（90日ごと）
   - ワイルドカード非対応

2. **発行時間**
   - 通常: 5-15分
   - 最大: 24時間

3. **確認方法**
   - Custom domains タブで「Active」と表示
   - ブラウザでアクセスして🔒マークを確認

### SSL/TLS設定

Cloudflareダッシュボード → ドメイン → SSL/TLS:

**推奨設定**:
```
SSL/TLS encryption mode: Full (strict)
```

**設定オプション**:
- `Off`: SSL無効（非推奨）
- `Flexible`: Cloudflare ↔ ブラウザ間のみ暗号化
- `Full`: 全体暗号化（自己署名証明書OK）
- `Full (strict)`: 全体暗号化（有効な証明書必須）← **推奨**

### HTTPS強制リダイレクト

すべてのHTTPトラフィックをHTTPSにリダイレクト:

1. **SSL/TLS → Edge Certificates**

2. **「Always Use HTTPS」をON**

3. **「Automatic HTTPS Rewrites」もON推奨**

---

## 動作確認

### 1. DNS伝播の確認

**ツール**: https://www.whatsmydns.net/

1. ドメイン名を入力（例: `parts-hub.com`）
2. レコードタイプを選択（A, CNAME）
3. 「Search」をクリック
4. 世界各地のDNSサーバーからの応答を確認

### 2. SSL証明書の確認

**ブラウザで確認**:
```
https://parts-hub.com
```

- 🔒 マークが表示される
- 「接続は保護されています」と表示
- 証明書の詳細を確認（Let's Encrypt）

**オンラインツール**: https://www.ssllabs.com/ssltest/

1. ドメイン名を入力
2. 「Submit」をクリック
3. グレード A 以上が理想

### 3. ページ表示の確認

以下のURLすべてでアクセスできるか確認:

```
http://parts-hub.com → https://parts-hub.com（リダイレクト）
https://parts-hub.com ✅
http://www.parts-hub.com → https://www.parts-hub.com（リダイレクト）
https://www.parts-hub.com ✅（またはメインドメインにリダイレクト）
```

### 4. 主要ページの確認

| URL | 確認内容 |
|-----|----------|
| `https://parts-hub.com/` | トップページ表示 |
| `https://parts-hub.com/admin` | 管理画面表示 |
| `https://parts-hub.com/search` | 検索ページ表示 |
| `https://parts-hub.com/sitemap.xml` | サイトマップ表示 |
| `https://parts-hub.com/robots.txt` | robots.txt表示 |

---

## トラブルシューティング

### ❌ DNSが反映されない

**原因**: DNS伝播に時間がかかっている

**解決方法**:
1. 最大48時間待つ（通常2-3時間）
2. ネームサーバー設定を再確認
3. TTL設定を確認（短い方が早い）
4. DNSキャッシュをクリア
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### ❌ SSL証明書が発行されない

**原因**: DNS設定が正しくない、またはCAA レコードの問題

**解決方法**:
1. DNS設定を再確認
2. CAA レコードを確認（Let's Encryptを許可）
   ```
   Type: CAA
   Name: @
   Value: 0 issue "letsencrypt.org"
   ```
3. 24時間待つ
4. Cloudflareサポートに問い合わせ

### ❌ 「この接続ではプライバシーが保護されません」エラー

**原因**: SSL証明書が未発行、または期限切れ

**解決方法**:
1. SSL証明書の発行を待つ（最大24時間）
2. Cloudflare SSL/TLS設定を確認
3. ブラウザのキャッシュをクリア
4. シークレットモードで再度アクセス

### ❌ ページが表示されない（404エラー）

**原因**: DNSは正しいが、Pagesプロジェクトとの連携が失敗

**解決方法**:
1. Custom domains設定を確認
2. CNAMEレコードが正しいか確認
3. Cloudflare Proxyが有効か確認（オレンジクラウド）
4. プロジェクトを再デプロイ

### ❌ wwwありとなしで別々のサイトが表示される

**原因**: リダイレクト設定が未設定

**解決方法**:
1. Page Rulesでリダイレクト設定
2. または、どちらか一方のみCustom domainsに追加

---

## おすすめの設定

### 最終的な推奨設定

#### 1. ドメイン
- **メインドメイン**: `parts-hub.com`（WWWなし）
- **リダイレクト**: `www.parts-hub.com` → `parts-hub.com`

#### 2. DNS
```
parts-hub.com     CNAME  parts-hub.pages.dev  (Proxy ON)
www.parts-hub.com CNAME  parts-hub.pages.dev  (Proxy ON)
```

#### 3. Page Rules
```
www.parts-hub.com/* → 301リダイレクト → https://parts-hub.com/$1
```

#### 4. SSL/TLS
```
Encryption mode: Full (strict)
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
```

---

## コスト概算

### 初年度
| 項目 | 費用 |
|------|------|
| ドメイン取得（.com） | ¥1,408/年 |
| Cloudflare Pages（Free） | ¥0 |
| SSL証明書 | ¥0（無料） |
| **合計** | **約¥1,408** |

### 次年度以降
| 項目 | 費用 |
|------|------|
| ドメイン更新（.com） | ¥1,728/年 |
| Cloudflare Pages（Free） | ¥0 |
| **合計** | **約¥1,728** |

**節約のコツ**:
- Cloudflare Registrarでドメインを取得・移管（約$10/年）
- 複数年契約で割引
- キャンペーン時期に購入

---

## まとめ

### 設定完了チェックリスト

- [ ] ドメイン取得完了
- [ ] Cloudflareにドメイン追加完了
- [ ] ネームサーバー変更完了（Active表示）
- [ ] Custom domainsにドメイン追加完了
- [ ] DNS設定完了（CNAME/Aレコード）
- [ ] SSL証明書発行完了（🔒表示）
- [ ] HTTPSリダイレクト設定完了
- [ ] wwwリダイレクト設定完了
- [ ] 全ページ動作確認完了

### 設定後のURL

**本番環境**:
```
https://parts-hub.com
```

**管理画面**:
```
https://parts-hub.com/admin
```

**旧URL（自動リダイレクト）**:
```
https://parts-hub.pages.dev → https://parts-hub.com
```

---

**独自ドメイン設定完了！** 🎉
