# 🚨 R2バケット作成が必要です

## 現在の状況

✅ **コード準備完了**: R2設定済み  
✅ **ビルド完了**: 473.28 KB  
❌ **デプロイ失敗**: R2バケット `parts-hub-images` が存在しない

**エラーメッセージ**:
```
R2 bucket 'parts-hub-images' not found.
```

---

## 🔧 解決方法: R2バケットを作成する

APIトークンの権限不足のため、**Cloudflareダッシュボードから手動で作成**する必要があります。

---

## 📋 R2バケット作成手順（5分）

### ステップ1: Cloudflareダッシュボードにアクセス

```
https://dash.cloudflare.com
```

**ログイン情報**:
- アカウント: Osaki.mf@gmail.com
- Account ID: 0aa080e5d86dabb95aea326d6e81ca18

---

### ステップ2: R2サービスへ移動

1. **左サイドバーから「R2 Object Storage」をクリック**

2. **初回アクセスの場合**:
   - 「Enable R2」ボタンが表示されます
   - **クリックして R2 を有効化**
   - 利用規約に同意

3. **支払い方法の確認**:
   - クレジットカードが未登録の場合、登録を求められます
   - 「Add Payment Method」からカード情報を入力

---

### ステップ3: バケット作成

1. **「Create bucket」ボタンをクリック**

2. **バケット設定を入力**:
   ```
   Bucket name: parts-hub-images
   Location: Automatic (推奨)
   Storage class: Standard
   ```

3. **「Create bucket」をクリック**

4. ✅ **完了**: バケット一覧に `parts-hub-images` が表示される

---

### ステップ4: 公開アクセス設定（重要）

1. **作成した `parts-hub-images` バケットをクリック**

2. **「Settings」タブをクリック**

3. **「Public Access」セクションを探す**

4. **「Connect Domain」をクリック**

5. **カスタムドメインを入力**:
   ```
   Domain: images.parts-hub-tci.com
   ```

6. **「Connect domain」をクリック**

7. ✅ **完了**: DNSレコードが自動作成される（数分で有効化）

---

### ステップ5: Pagesプロジェクトに R2バインディング追加

1. **左サイドバー → Workers & Pages**

2. **`parts-hub` プロジェクトをクリック**

3. **「Settings」タブ → 下にスクロール**

4. **「Functions」セクション → 「R2 bucket bindings」**

5. **「Add binding」をクリック**

6. **設定を入力**:
   ```
   Production:
     Variable name: R2
     R2 bucket: parts-hub-images
   
   Preview (オプション):
     Variable name: R2
     R2 bucket: parts-hub-images
   ```

7. **「Save」をクリック**

8. ✅ **完了**: バインディング一覧に表示される

---

## 🚀 作成完了後の再デプロイ手順

バケット作成とバインディング追加が完了したら、以下のコマンドで再デプロイします:

```bash
cd /home/user/webapp
npx wrangler pages deploy dist --project-name parts-hub --branch main
```

**期待される結果**:
```
✨ Deployment complete! Take a peek over at https://xxxxxxxx.parts-hub.pages.dev
```

---

## 💰 課金について

### R2の無料枠
- **ストレージ**: 10GB/月
- **クラスAオペレーション（書き込み）**: 100万リクエスト/月
- **クラスBオペレーション（読み取り）**: 1000万リクエスト/月
- **データ転送**: 完全無料

### 超過料金
- **ストレージ**: $0.015/GB/月（約¥2.1/GB）
- **クラスA**: $4.50/100万リクエスト
- **クラスB**: $0.36/100万リクエスト

### 初期コスト
```
R2有効化: ¥0
バケット作成: ¥0
初月（10GB以内）: ¥0
```

### 想定月額（10,000商品時）
```
画像容量: 約20GB
→ 超過10GB × $0.015 × 140円/$ = 約¥21/月
```

---

## 📊 支払い方法の登録（必要な場合）

R2を有効化する際、クレジットカードの登録が必要です。

### 登録手順

1. **右上のアカウントアイコン → Billing**

2. **「Payment Methods」セクション**

3. **「Add Payment Method」をクリック**

4. **カード情報を入力**:
   ```
   Card Number: ****-****-****-****
   Expiry Date: MM/YY
   CVV: ***
   Billing Address: 住所
   ```

5. **「Add Payment Method」をクリック**

6. ✅ **完了**: カードが登録される

### 請求タイミング
- **月初**: 前月分の使用料金を自動請求
- **最低請求額**: なし（$0.01から請求）

---

## 📱 課金アラート設定（推奨）

月額料金が予想を超えた場合に通知を受け取る設定:

1. **Billing → Notifications**

2. **「Create Notification」をクリック**

3. **設定**:
   ```
   Type: Billing Threshold
   Threshold Amount: $10（約¥1,400）
   Email: あなたのメールアドレス
   ```

4. **「Create」をクリック**

5. ✅ **完了**: 月額$10を超えたらメール通知

---

## ✅ 完了チェックリスト

作業完了後、以下を確認してください:

### ダッシュボード確認
- [ ] R2が有効化されている
- [ ] バケット `parts-hub-images` が作成されている
- [ ] カスタムドメイン `images.parts-hub-tci.com` が接続されている
- [ ] Pagesプロジェクトに R2バインディングが追加されている

### 支払い設定確認
- [ ] クレジットカードが登録されている
- [ ] 課金アラートが設定されている（推奨）

### デプロイ確認
- [ ] 再デプロイが成功した
- [ ] 本番環境にアクセスできる

---

## 🆘 トラブルシューティング

### Q: R2が有効化できない
**A**: 支払い方法が未登録の可能性があります。クレジットカードを登録してください。

### Q: バケット名が使えない
**A**: すでに他のアカウントで使用されている可能性があります。別の名前（例: `parts-hub-images-2`）を試してください。その場合、`wrangler.jsonc` の `bucket_name` も変更が必要です。

### Q: カスタムドメインが接続できない
**A**: 
1. ドメイン `parts-hub-tci.com` がCloudflareで管理されているか確認
2. DNSゾーンが有効か確認
3. 別のサブドメイン（例: `cdn.parts-hub-tci.com`）を試す

---

## 📞 サポート情報

### Cloudflare
- **ダッシュボード**: https://dash.cloudflare.com
- **R2ドキュメント**: https://developers.cloudflare.com/r2/
- **価格詳細**: https://developers.cloudflare.com/r2/pricing/
- **Community**: https://community.cloudflare.com/

### プロジェクト情報
- **Account ID**: 0aa080e5d86dabb95aea326d6e81ca18
- **Project**: parts-hub
- **Bucket Name**: parts-hub-images
- **Custom Domain**: images.parts-hub-tci.com

---

## 🚀 次のステップ

1. ✅ **R2バケット作成**（上記手順）
2. ✅ **R2バインディング追加**（上記手順）
3. ✅ **再デプロイ実行**
   ```bash
   npx wrangler pages deploy dist --project-name parts-hub
   ```
4. ✅ **動作確認**
   - 画像アップロードテスト
   - 公開URL確認

---

**想定作業時間**: 5-10分  
**初期コスト**: ¥0  
**月額コスト**: ¥0-¥21（使用量による）

バケット作成が完了したら、お知らせください。再デプロイを実行します！🚀
