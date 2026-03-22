# 🖼️ PARTS HUB - 画像ストレージ設定ガイド

## ⚠️ 現状の問題

### 画像保存の実装状況
- ✅ **コード実装済み**: 画像アップロード処理（`src/routes/profile.ts`）
- ❌ **R2バケット未設定**: `wrangler.jsonc`にR2設定なし
- ❌ **現状**: 画像アップロードが動作しない

### 容量の問題
自動車パーツ取引サイトでは大量の画像が必要:
- **商品画像**: 1商品3-5枚 × 平均500KB = 1.5-2.5MB/商品
- **プロフィール画像**: 1ユーザー1枚 × 平均200KB

**容量試算**:
```
1,000商品   → 約2GB
10,000商品  → 約20GB
50,000商品  → 約100GB
100,000商品 → 約200GB
```

**D1データベースの制限**:
- 無料枠: 5GB（全データベース合計）
- 1行あたり: 最大1MB

→ **D1だけでは画像保存に不十分！**

---

## ✅ 推奨ソリューション: Cloudflare R2

### R2の特徴
| 項目 | 内容 |
|------|------|
| **無料枠** | 10GB ストレージ |
| **料金** | $0.015/GB/月（約¥2.1/GB） |
| **転送料金** | **完全無料**（エグレス無料） |
| **リクエスト** | 無料: 100万リクエスト/月 |
| **S3互換** | AWS S3 APIと互換性あり |
| **CDN連携** | Cloudflare CDN経由で高速配信 |

### 他サービスとの比較

| サービス | ストレージ料金 | 転送料金（送信） | 月額コスト例（20GB + 100GB転送） |
|---------|---------------|-----------------|------------------------------|
| **Cloudflare R2** | $0.015/GB | **無料** | 約¥420 |
| AWS S3 | $0.023/GB | $0.09/GB | 約¥2,100 |
| Google Cloud Storage | $0.020/GB | $0.12/GB | 約¥2,520 |

→ **R2が圧倒的にコスト効率が良い！**

---

## 📋 R2セットアップ手順

### ステップ1: R2バケット作成

#### ダッシュボードから作成（推奨）

1. **Cloudflareダッシュボードにアクセス**
   ```
   https://dash.cloudflare.com
   ```

2. **左サイドバー → R2 Object Storage**

3. **「Create bucket」をクリック**

4. **バケット設定**
   ```
   Bucket name: parts-hub-images
   Location: Automatic (推奨)
   ```

5. **「Create bucket」をクリック**

#### CLI から作成（権限があれば）

```bash
npx wrangler r2 bucket create parts-hub-images
```

---

### ステップ2: wrangler.jsonc に R2設定追加

`wrangler.jsonc` を編集:

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
      "database_id": "c99514a8-1aa1-4ad2-b3a2-906b8d8d26d5"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "parts-hub-images"
    }
  ]
}
```

---

### ステップ3: Cloudflare Pagesプロジェクトに R2バインディング追加

#### APIで追加

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/0aa080e5d86dabb95aea326d6e81ca18/pages/projects/parts-hub" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "deployment_configs": {
      "production": {
        "r2_buckets": {
          "R2": {
            "name": "parts-hub-images"
          }
        }
      }
    }
  }'
```

#### ダッシュボードから追加

1. **Workers & Pages → parts-hub → Settings → Bindings**
2. **「Add」→「R2 bucket」**
3. **設定**:
   ```
   Variable name: R2
   R2 bucket: parts-hub-images
   ```
4. **「Save」**

---

### ステップ4: 公開URL設定（R2ドメイン）

#### カスタムドメイン設定

1. **R2 → parts-hub-images → Settings → Public Access**

2. **「Connect Domain」**

3. **ドメイン設定**:
   ```
   Option 1: Cloudflare自動ドメイン
   → images.parts-hub-tci.com
   
   Option 2: R2.devドメイン（無料）
   → parts-hub-images.r2.cloudflarestorage.com
   ```

4. **自動的にDNSレコード作成**

#### コード内のURL更新

`src/routes/profile.ts` の157行目を更新:

```typescript
// 修正前
const publicUrl = `https://storage.example.com/${filename}`

// 修正後（Option 1: カスタムドメイン）
const publicUrl = `https://images.parts-hub-tci.com/${filename}`

// または（Option 2: R2.devドメイン）
const publicUrl = `https://parts-hub-images.r2.cloudflarestorage.com/${filename}`
```

---

### ステップ5: 再ビルド＆デプロイ

```bash
# ビルド
npm run build

# ローカルテスト
pm2 restart webapp

# 本番デプロイ
npx wrangler pages deploy dist --project-name parts-hub
```

---

## 📊 容量管理とコスト予測

### 無料枠（10GB）でできること
```
約4,000商品の画像（1商品2.5MB）
または
約50,000ユーザーのプロフィール画像（1枚200KB）
```

### 有料プランのコスト

| 月間画像数 | 容量 | 月額料金 |
|-----------|------|---------|
| 4,000商品 | 10GB | ¥0（無料枠） |
| 10,000商品 | 25GB | 約¥450 |
| 50,000商品 | 125GB | 約¥2,625 |
| 100,000商品 | 250GB | 約¥5,250 |

**追加料金**:
- ストレージ超過: $0.015/GB/月（約¥2.1/GB）
- リクエスト超過（100万/月以上）: $0.36/100万リクエスト
- 削除: $0.01/100万リクエスト

---

## 🔒 セキュリティ設定

### 画像アップロード制限

現在の実装（`src/routes/profile.ts`）:
```typescript
// ファイル形式チェック
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']

// サイズチェック（5MB）
if (imageFile.size > 5 * 1024 * 1024) {
  return c.json({ error: '画像サイズは5MB以下にしてください' }, 400)
}
```

### 推奨追加設定

1. **ユーザーごとのアップロード制限**
   ```typescript
   // 1ユーザーあたり最大10枚まで
   const userImageCount = await DB.prepare(
     'SELECT COUNT(*) as count FROM product_images WHERE user_id = ?'
   ).bind(userId).first()
   
   if (userImageCount.count >= 10) {
     return c.json({ error: 'アップロード上限に達しました' }, 429)
   }
   ```

2. **画像最適化（推奨）**
   - Cloudflare Imagesサービス利用
   - 自動リサイズ、WebP変換
   - 料金: $5/月（10万画像まで）

3. **公開アクセス制御**
   - 商品画像: 公開OK
   - プロフィール画像: 公開OK
   - 本人確認書類: 非公開（認証必須）

---

## 🚀 実装チェックリスト

### 必須作業
- [ ] R2バケット作成（`parts-hub-images`）
- [ ] `wrangler.jsonc` にR2設定追加
- [ ] Pagesプロジェクトに R2バインディング追加
- [ ] R2公開ドメイン設定
- [ ] `src/routes/profile.ts` のURL更新
- [ ] 再ビルド＆デプロイ

### テスト
- [ ] プロフィール画像アップロード動作確認
- [ ] 商品画像アップロード動作確認
- [ ] 画像URL公開アクセス確認
- [ ] 画像削除機能確認

### 運用
- [ ] R2容量監視設定（Cloudflare Dashboard）
- [ ] 月次コストレビュー
- [ ] 画像最適化の検討（Cloudflare Images）

---

## 💡 ベストプラクティス

### 1. 画像ファイル命名規則
```
profiles/{user_id}/{timestamp}.{ext}
products/{product_id}/{timestamp}-{index}.{ext}
documents/{user_id}/verification/{timestamp}.{ext}
```

### 2. メタデータ管理
D1データベースに画像情報を保存:
```sql
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER,
  type TEXT NOT NULL, -- 'profile', 'product', 'document'
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 3. 画像削除時の対応
```typescript
// R2から削除
await R2.delete(filename)

// DBから削除
await DB.prepare('DELETE FROM images WHERE filename = ?').bind(filename).run()
```

### 4. CDN キャッシュ設定
```typescript
// R2のHTTPメタデータでキャッシュ制御
await R2.put(filename, buffer, {
  httpMetadata: {
    contentType: imageFile.type,
    cacheControl: 'public, max-age=31536000' // 1年間キャッシュ
  }
})
```

---

## 📞 サポート情報

### Cloudflare R2 ドキュメント
- **公式ドキュメント**: https://developers.cloudflare.com/r2/
- **価格**: https://developers.cloudflare.com/r2/pricing/
- **APIリファレンス**: https://developers.cloudflare.com/r2/api/

### トラブルシューティング

#### Q: 画像がアップロードできない
**A**: 
1. R2バケットが作成されているか確認
2. `wrangler.jsonc`に設定があるか確認
3. Pagesプロジェクトにバインディングが追加されているか確認

#### Q: 画像URLにアクセスできない
**A**:
1. R2バケットの公開設定を確認
2. カスタムドメインが正しく設定されているか確認
3. DNSレコードが伝播しているか確認（数分かかる場合あり）

#### Q: 容量が足りなくなったら？
**A**:
1. 古い画像を定期的に削除
2. 画像圧縮・最適化（Cloudflare Images利用）
3. 不要な画像をアーカイブ（S3 Glacierなど）

---

## 🎯 結論

### 現状のまま（R2なし）
- ❌ 画像アップロードが動作しない
- ❌ 将来的に容量不足確実
- ❌ スケーラビリティなし

### R2導入後
- ✅ 大容量対応（10GB無料、以降$0.015/GB）
- ✅ 転送料金無料（コスト削減）
- ✅ 高速CDN配信
- ✅ 自動スケール
- ✅ S3互換で移行も容易

**推奨**: **今すぐR2を導入すべき**

初期コスト: ¥0（無料枠内）  
予想月額（10,000商品時）: 約¥450

---

## 📝 次のステップ

1. ✅ このガイドを参照してR2をセットアップ
2. ✅ 画像アップロード機能をテスト
3. ✅ 本番環境にデプロイ
4. ⏸️ 運用開始後、容量とコストを監視
5. ⏸️ 必要に応じてCloudflare Imagesで最適化

---

**設定完了までの想定時間**: 約15-30分  
**難易度**: 初級〜中級

何か質問があればお知らせください！🚀
