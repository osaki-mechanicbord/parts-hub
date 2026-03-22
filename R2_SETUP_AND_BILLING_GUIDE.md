# 🚀 R2ストレージ セットアップ＆課金手順

## ⚠️ 重要: 課金について

### R2の課金体系

**無料枠（毎月自動リセット）**:
- ストレージ: 10GB
- クラスAオペレーション（書き込み）: 100万リクエスト
- クラスBオペレーション（読み取り）: 1000万リクエスト

**超過料金**:
- ストレージ: $0.015/GB/月（約¥2.1/GB）
- クラスAオペレーション: $4.50/100万リクエスト
- クラスBオペレーション: $0.36/100万リクエスト
- **データ転送（エグレス）: 完全無料**

**請求タイミング**:
- 毎月月初に前月分を請求
- 最低請求額: なし（$0.01から請求）
- 請求方法: クレジットカード自動決済

---

## 📋 ステップ1: 支払い方法の登録（必須）

### 1-1. Cloudflareダッシュボードにアクセス
```
https://dash.cloudflare.com
```

### 1-2. 支払い方法の確認・登録

1. **右上のアカウントアイコン → Billing**

2. **Payment Methods セクション**
   - クレジットカードが登録されているか確認
   - 未登録の場合: 「Add Payment Method」をクリック

3. **カード情報入力**
   ```
   Card Number: ****-****-****-****
   Expiry Date: MM/YY
   CVV: ***
   Billing Address: 住所入力
   ```

4. **「Add Payment Method」をクリック**

5. ✅ 「Payment method added successfully」と表示されれば完了

---

## 📋 ステップ2: R2バケット作成

### 2-1. R2サービスへ移動

1. **左サイドバー → R2 Object Storage**

2. **初回アクセス時の確認**
   - 「Enable R2」ボタンが表示される場合はクリック
   - 利用規約に同意

### 2-2. バケット作成

1. **「Create bucket」をクリック**

2. **バケット設定**
   ```
   Bucket name: parts-hub-images
   Location: Automatic (推奨)
   Storage class: Standard
   ```

3. **「Create bucket」をクリック**

4. ✅ バケット一覧に `parts-hub-images` が表示されれば完了

---

## 📋 ステップ3: 公開アクセス設定

### 3-1. カスタムドメイン設定

1. **バケット `parts-hub-images` をクリック**

2. **「Settings」タブ → 「Public Access」セクション**

3. **「Connect Domain」をクリック**

4. **ドメイン入力**
   ```
   Domain: images.parts-hub-tci.com
   ```

5. **「Connect domain」をクリック**

6. ✅ 自動的にDNSレコードが作成される（数分で有効化）

### 3-2. 公開URL確認

接続完了後、画像URLは以下の形式でアクセス可能:
```
https://images.parts-hub-tci.com/profiles/1/1234567890.jpg
```

---

## 📋 ステップ4: Cloudflare Pagesに R2バインディング追加

### 4-1. Pagesプロジェクトへ移動

1. **Workers & Pages → parts-hub**

2. **「Settings」タブ → 「Functions」セクション**

3. **「R2 bucket bindings」を探す**

### 4-2. R2バインディング追加

1. **「Add binding」をクリック**

2. **設定入力**
   ```
   Variable name: R2
   R2 bucket: parts-hub-images
   Environment: Production
   ```

3. **「Save」をクリック**

4. ✅ バインディング一覧に表示されれば完了

---

## 📋 ステップ5: コード修正

### 5-1. 公開URLの更新

`src/routes/profile.ts` の157行目を修正:

現在:
```typescript
const publicUrl = `https://storage.example.com/${filename}`
```

修正後:
```typescript
const publicUrl = `https://images.parts-hub-tci.com/${filename}`
```

### 5-2. 商品画像アップロード対応

`src/routes/products.ts` にも同様の処理を追加（必要に応じて）

---

## 📋 ステップ6: ビルド＆デプロイ

### 6-1. ローカルでビルド

```bash
cd /home/user/webapp
npm run build
```

### 6-2. 本番環境にデプロイ

```bash
npx wrangler pages deploy dist --project-name parts-hub --branch main
```

### 6-3. デプロイ確認

デプロイ完了後、以下のURLで確認:
```
https://parts-hub.pages.dev/
https://parts-hub-tci.com/  （SSL発行後）
```

---

## 📋 ステップ7: 動作確認

### 7-1. 画像アップロードテスト

1. **プロフィール画像アップロード**
   - ログイン → マイページ → プロフィール編集
   - 画像ファイルを選択してアップロード

2. **エラーチェック**
   - ブラウザの開発者ツール（F12）でエラー確認
   - Cloudflare Dashboard → R2 → parts-hub-images で画像確認

### 7-2. 公開URL確認

アップロードした画像URLにアクセス:
```
https://images.parts-hub-tci.com/profiles/{user_id}/{timestamp}.jpg
```

✅ 画像が表示されれば成功！

---

## 💰 課金の仕組みと監視

### 月次コストの確認方法

1. **Cloudflare Dashboard → Billing → Usage**

2. **R2のセクションで確認**
   ```
   Storage: 使用量 / 10GB（無料枠）
   Class A Operations: リクエスト数 / 100万（無料枠）
   Class B Operations: リクエスト数 / 1000万（無料枠）
   ```

3. **超過した場合の料金表示**
   ```
   例: Storage 15GB使用
   → 無料枠10GB + 超過5GB × $0.015 = $0.075（約¥10.5）
   ```

### 請求書の確認

1. **Cloudflare Dashboard → Billing → Invoices**

2. **過去の請求書一覧を確認**
   - 請求日
   - 金額
   - 内訳（R2, Pages, D1など）

### アラート設定（推奨）

1. **Billing → Notifications**

2. **「Create Notification」**
   ```
   Type: Billing Threshold
   Threshold: $10（約¥1,400）
   Email: あなたのメールアドレス
   ```

3. ✅ 月額$10を超えたらメール通知

---

## 📊 コスト試算ツール

### 想定シナリオ

**シナリオ1: スタートアップ（1,000商品）**
```
画像容量: 2GB
月間アップロード: 1,000回（クラスA）
月間閲覧: 10,000回（クラスB）

→ 無料枠内: ¥0/月
```

**シナリオ2: 成長期（10,000商品）**
```
画像容量: 20GB
月間アップロード: 10,000回
月間閲覧: 100,000回

→ ストレージ超過料金:
   (20GB - 10GB) × $0.015 × 140円/$ = 約¥21/月
→ リクエスト: 無料枠内
→ 合計: 約¥21/月
```

**シナリオ3: 拡大期（50,000商品）**
```
画像容量: 100GB
月間アップロード: 50,000回
月間閲覧: 500,000回

→ ストレージ超過料金:
   (100GB - 10GB) × $0.015 × 140円/$ = 約¥189/月
→ リクエスト: 無料枠内
→ 合計: 約¥189/月
```

---

## 🔒 セキュリティとベストプラクティス

### 画像アップロード制限

現在実装済み:
```typescript
// ファイル形式制限
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']

// サイズ制限（5MB）
if (imageFile.size > 5 * 1024 * 1024) {
  return c.json({ error: '画像サイズは5MB以下にしてください' }, 400)
}
```

### 推奨追加設定

1. **Rate Limiting（レート制限）**
   ```typescript
   // 1ユーザーあたり1時間に10回まで
   const uploadCount = await checkUserUploadCount(userId)
   if (uploadCount >= 10) {
     return c.json({ error: 'アップロード制限に達しました' }, 429)
   }
   ```

2. **画像最適化**
   - アップロード時に自動リサイズ
   - WebP形式への変換（ファイルサイズ削減）
   - サムネイル自動生成

3. **定期的なクリーンアップ**
   ```sql
   -- 削除された商品の画像をクリーンアップ
   DELETE FROM images 
   WHERE product_id IN (
     SELECT id FROM products WHERE status = 'deleted' AND updated_at < datetime('now', '-30 days')
   )
   ```

---

## ⚠️ トラブルシューティング

### 問題1: 画像がアップロードできない

**確認事項**:
1. R2バケットが作成されているか
2. wrangler.jsonc にR2設定があるか
3. Pagesプロジェクトにバインディングが追加されているか
4. 再デプロイしたか

**解決方法**:
```bash
# 再デプロイ
npm run build
npx wrangler pages deploy dist --project-name parts-hub
```

### 問題2: 画像URLにアクセスできない

**確認事項**:
1. カスタムドメインが接続されているか
2. DNSが伝播しているか（最大24時間）

**解決方法**:
```bash
# DNS確認
nslookup images.parts-hub-tci.com

# 一時的にR2.devドメインを使用
# https://pub-xxxxx.r2.dev/profiles/1/12345.jpg
```

### 問題3: 課金が発生した

**確認方法**:
1. Billing → Usage でどのサービスが超過しているか確認
2. R2 → parts-hub-images → Metrics で詳細確認

**対策**:
1. 不要な画像を削除
2. 画像サイズを圧縮
3. アップロード頻度制限を強化

---

## 📞 サポート

### Cloudflare サポート

- **ドキュメント**: https://developers.cloudflare.com/r2/
- **価格**: https://developers.cloudflare.com/r2/pricing/
- **Community**: https://community.cloudflare.com/

### プロジェクト情報

- **Account ID**: 0aa080e5d86dabb95aea326d6e81ca18
- **R2 Bucket**: parts-hub-images
- **Public URL**: https://images.parts-hub-tci.com

---

## ✅ セットアップ完了チェックリスト

### 必須タスク
- [ ] 支払い方法を登録
- [ ] R2バケット `parts-hub-images` を作成
- [ ] カスタムドメイン `images.parts-hub-tci.com` を接続
- [ ] Pagesプロジェクトに R2バインディング追加
- [ ] `src/routes/profile.ts` の公開URL更新
- [ ] `wrangler.jsonc` にR2設定追加
- [ ] ビルド＆デプロイ
- [ ] 画像アップロード動作確認

### 推奨タスク
- [ ] 課金アラート設定（$10）
- [ ] 定期的な使用量チェック（月1回）
- [ ] 画像最適化の検討
- [ ] バックアップポリシーの策定

---

**想定作業時間**: 20-30分  
**初期費用**: ¥0  
**月額費用（スタート時）**: ¥0（無料枠内）

セットアップ完了後、すぐに本番環境で画像アップロードが可能になります！🚀
