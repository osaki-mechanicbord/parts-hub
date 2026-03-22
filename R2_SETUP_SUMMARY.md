# 🎯 R2ストレージセットアップ - 実施内容まとめ

## ✅ 完了した作業

### 1. コード準備（完了）
- ✅ `wrangler.jsonc` にR2設定追加
  ```jsonc
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "parts-hub-images"
    }
  ]
  ```

- ✅ `src/routes/profile.ts` の公開URL更新
  ```typescript
  const publicUrl = `https://images.parts-hub-tci.com/${filename}`
  ```

- ✅ ビルド完了: 473.28 KB

- ✅ Gitコミット完了: `f9275e2`

---

## ⏳ あなたが実施する作業（手動）

APIトークンの権限不足のため、以下の作業は**Cloudflareダッシュボードから手動**で実施する必要があります。

### ステップ1: R2バケット作成（必須）⭐

**URL**: https://dash.cloudflare.com

1. 左サイドバー → **R2 Object Storage**
2. 初回の場合: **「Enable R2」**をクリック
3. **「Create bucket」**をクリック
4. 設定入力:
   ```
   Bucket name: parts-hub-images
   Location: Automatic
   ```
5. **「Create bucket」**をクリック

**支払い方法**: R2有効化時にクレジットカード登録が必要
- 無料枠: 10GB/月
- 超過料金: $0.015/GB/月（約¥2.1/GB）

---

### ステップ2: カスタムドメイン接続（必須）⭐

1. `parts-hub-images` バケットをクリック
2. **「Settings」** → **「Public Access」**
3. **「Connect Domain」**をクリック
4. ドメイン入力:
   ```
   images.parts-hub-tci.com
   ```
5. **「Connect domain」**をクリック

→ DNSレコードが自動作成される（数分で有効化）

---

### ステップ3: R2バインディング追加（必須）⭐

1. **Workers & Pages** → **parts-hub**
2. **Settings** → **Functions** → **R2 bucket bindings**
3. **「Add binding」**をクリック
4. 設定:
   ```
   Production:
     Variable name: R2
     R2 bucket: parts-hub-images
   ```
5. **「Save」**をクリック

---

### ステップ4: 再デプロイ通知

上記3つのステップが完了したら、**私にお知らせください**。
以下のコマンドで本番環境に再デプロイします:

```bash
npx wrangler pages deploy dist --project-name parts-hub
```

---

## 💰 課金情報

### 無料枠（毎月リセット）
- ストレージ: 10GB
- 書き込み: 100万リクエスト
- 読み取り: 1000万リクエスト
- データ転送: 無制限・無料

### 超過料金
- ストレージ: $0.015/GB/月（約¥2.1/GB）
- 書き込み: $4.50/100万リクエスト
- 読み取り: $0.36/100万リクエスト

### 月額コスト試算

| 商品数 | 画像容量 | 月額料金 |
|--------|----------|---------|
| 1,000 | 2GB | **¥0**（無料枠内） |
| 4,000 | 10GB | **¥0**（無料枠内） |
| 10,000 | 25GB | 約¥450 |
| 50,000 | 125GB | 約¥2,625 |

**支払い**: 毎月月初に自動クレジットカード決済

---

## 🔒 セキュリティ設定

### 実装済みの制限
```typescript
// ファイル形式: JPEG, PNG のみ
// サイズ上限: 5MB
// ファイル名: profiles/{user_id}/{timestamp}.{ext}
```

### 推奨追加設定
- Rate Limiting（アップロード回数制限）
- 画像最適化（WebP変換、リサイズ）
- 定期クリーンアップ（削除商品の画像削除）

---

## 📊 容量管理

### 使用量の確認方法

1. **Cloudflare Dashboard → R2 → parts-hub-images**
2. **Metrics タブ**で以下を確認:
   - ストレージ使用量
   - リクエスト数
   - データ転送量

### アラート設定（推奨）

1. **Billing → Notifications**
2. **「Create Notification」**
3. 設定:
   ```
   Type: Billing Threshold
   Amount: $10（約¥1,400）
   Email: あなたのメールアドレス
   ```

→ 月額$10を超えたらメール通知

---

## 📝 関連ドキュメント

### 詳細ガイド
- **課金と設定の詳細**: `/home/user/webapp/R2_SETUP_AND_BILLING_GUIDE.md`
- **バケット作成手順**: `/home/user/webapp/R2_BUCKET_CREATION_REQUIRED.md`
- **画像ストレージ概要**: `/home/user/webapp/IMAGE_STORAGE_SETUP.md`

### Cloudflare公式
- **R2ドキュメント**: https://developers.cloudflare.com/r2/
- **価格詳細**: https://developers.cloudflare.com/r2/pricing/
- **ダッシュボード**: https://dash.cloudflare.com

---

## ✅ 完了チェックリスト

### あなたが実施する作業
- [ ] クレジットカード登録（未登録の場合）
- [ ] R2を有効化
- [ ] R2バケット `parts-hub-images` を作成
- [ ] カスタムドメイン `images.parts-hub-tci.com` を接続
- [ ] PagesプロジェクトにR2バインディング追加
- [ ] 完了を私に通知

### 私が実施する作業
- [ ] 再デプロイ実行
- [ ] デプロイ確認
- [ ] 画像アップロード動作テスト
- [ ] 公開URL確認

---

## 🚀 完了後の動作

R2セットアップ完了後、以下が可能になります:

### 画像アップロード
```
プロフィール画像 → R2バケット → 公開URL
商品画像 → R2バケット → 公開URL
```

### 公開URL形式
```
https://images.parts-hub-tci.com/profiles/1/1234567890.jpg
https://images.parts-hub-tci.com/products/100/1234567890-1.jpg
```

### 容量
- 初期: 10GB無料
- 拡張: 無制限（従量課金）
- 転送: 完全無料

---

## 📞 サポート

### プロジェクト情報
- **Account ID**: 0aa080e5d86dabb95aea326d6e81ca18
- **Project**: parts-hub
- **Bucket**: parts-hub-images
- **Domain**: images.parts-hub-tci.com
- **Git Commit**: f9275e2

### 問い合わせ先
- **Cloudflare Support**: https://community.cloudflare.com/
- **緊急時**: Cloudflare Dashboard → Support

---

## 🎯 次のステップ

1. **あなた**: 上記3ステップを実施（5-10分）
2. **通知**: 完了を私に連絡
3. **私**: 再デプロイ実行
4. **確認**: 画像アップロード動作テスト
5. **完了**: 本番環境で画像機能が使用可能に

---

**想定作業時間**: 5-10分  
**初期コスト**: ¥0  
**月額コスト**: ¥0-¥450（使用量による）

準備ができましたらお知らせください！🚀
