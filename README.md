# PARTS HUB - 自動車パーツ売買プラットフォーム

## プロジェクト概要
- **名前**: PARTS HUB (webapp)
- **目標**: 自動車整備工場向けの純正パーツ・工具の専門売買マーケットプレイス
- **コンセプト**: メルカリのように手軽に使える、整備工場専門のCtoCプラットフォーム

## URLs
- **本番**: https://parts-hub.pages.dev
- **Sandbox**: https://3000-iuwaode8f8wmya6easupd-0e616f0a.sandbox.novita.ai
- **デモページ**: `/argos-demo`（ARGOS JPC連携サンプルUI）

---

## 主要機能

### 実装済み ✅
1. **基本インフラ**: Hono + Cloudflare Pages + D1 + R2
2. **ユーザー認証**: 会員登録・ログイン（JWT）・プロフィール管理・退会（アカウント削除）
3. **商品管理**: 出品・編集・削除・画像アップロード（最大10枚、R2ストレージ）
4. **カテゴリシステム**: 10大カテゴリ、40+サブカテゴリ
5. **適合確認システム**: マイガレージ・適合マッチング・フィードバック
6. **取引機能**: Stripe決済連携・購入フロー・チャット
7. **価格交渉**: 出品者↔購入者間の値段交渉
8. **お気に入り・通知機能**
9. **レビュー・評価システム**
10. **管理画面**: 商品・ユーザー・取引管理（管理者認証付き）
11. **多言語対応**: 日本語・英語・中国語・韓国語（i18n）
12. **記事・コンテンツ管理**: 情報記事の投稿・表示
13. **メール通知**: Resend API連携
14. **出品代行**: 代行リクエスト・管理
15. **セキュリティ**: コメント・交渉の認証必須化、APIレートリミット（ログイン/コメント/レビュー/交渉）
16. **エラーハンドリング**: 404ページ・グローバルエラーハンドラー
17. **取引保護**: SOLD OUT時の値下げ交渉ボタン無効化、ヤマト追跡ボタン完了後無効化、受取完了ボタン二重クリック防止、レビュー不変性

### ARGOS JPC連携（本番実装準備完了 / 公開予定: 2026年6月以降）🔜
15. **VIN自動入力**: 車台番号から車両情報・適合情報を自動取得
16. **OEM品番連携**: VINベースで部品番号・互換品番を自動設定
17. **部品検索強化**: ARGOS JPCデータによる品番ベース商品検索
18. **D1キャッシュ**: VIN/部品検索結果の30日キャッシュ（APIコスト最適化）
19. **APIログ**: 全ARGOS API呼出のログ記録（コスト追跡・分析）

---

## ARGOS JPC API連携 詳細

### 概要
- **提供元**: ARGOS JPC（Level Bridge Inc. / ABPグループ）
- **対応車両**: 2000年以降の日系メーカー + 欧米/ASEAN/輸入車
- **データ精度**: 約95%
- **API形式**: 20+ RESTful endpoints（Bearer Token認証）

### 公開スケジュール
| フェーズ | 時期 | 内容 |
|---------|------|------|
| デモUI | ✅ 実装済み | `/argos-demo` でモックデータによるUI確認可能 |
| 本番APIルート | ✅ 実装済み | `src/routes/argos.ts` フィーチャーフラグ制御 |
| D1テーブル | ✅ 実装済み | `0018_argos_jpc_integration.sql` キャッシュ・ログ・OEM品番 |
| 出品ページVIN連携 | ✅ 実装済み | VIN入力→車両情報→適合情報自動反映（非表示） |
| 商品詳細OEM表示 | ✅ 実装済み | OEM品番・互換品番・参考価格の表示 |
| **本番公開** | **2026年6月以降** | ARGOS API契約完了後、環境変数を有効化して公開 |

### アーキテクチャ
```
フロントエンド → /api/argos/* → D1キャッシュチェック → ARGOS JPC外部API
                                ↳ キャッシュヒット → 即座に応答（~5ms）
                                ↳ キャッシュミス → 外部APIコール → D1に保存 → 応答
```

### 使用するARGOS JPC API
| # | API名 | 用途 | 優先度 |
|---|--------|------|--------|
| #13 | Get Car List by VIN | VIN→車両情報取得 | 必須 |
| #6 | Get Main Group List | 部品グループ一覧 | 必須 |
| #14 | Get Subgroup List by VIN | VIN別サブグループ | 必須 |
| #15 | Get Part List by VIN | VIN別部品一覧 | 必須 |
| #21 | Get Image | イラスト画像取得 | 推奨 |
| #1-#5 | Brand/Model/Type/Year | VIN不在時のフォールバック | 任意 |

### 本番公開手順（API準備完了後）
```bash
# 1. Cloudflare Secretsに設定
npx wrangler pages secret put ARGOS_API_KEY --project-name parts-hub
npx wrangler pages secret put ARGOS_API_URL --project-name parts-hub

# 2. 環境変数で有効化（Cloudflare Dashboard）
# ARGOS_API_ENABLED = "true"

# 3. 本番D1にマイグレーション適用
npx wrangler d1 migrations apply parts-hub-production

# 4. デプロイ
npm run deploy
```

### ローカル開発（.dev.vars）
```
ARGOS_API_KEY=your-bearer-token
ARGOS_API_URL=https://api.argos-jpc.example.com
ARGOS_API_ENABLED=true
```

---

## API エンドポイント一覧

### 基本
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/categories` | カテゴリ一覧 |
| GET | `/api/categories/:id` | カテゴリ詳細+サブカテゴリ |
| GET | `/api/makers` | メーカー一覧 |
| GET | `/api/makers/:id/models` | 車種一覧 |

### 商品
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/products` | 商品一覧（検索・フィルタ・ページネーション） |
| GET | `/api/products/:id` | 商品詳細（OEM品番含む） |
| POST | `/api/products` | 商品出品 |
| PUT | `/api/products/:id` | 商品編集 |
| DELETE | `/api/products/:id` | 商品削除 |
| POST | `/api/products/images/upload` | 画像アップロード |

### 認証・ユーザー
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/register` | 会員登録 |
| POST | `/api/auth/login` | ログイン |
| GET | `/api/auth/me` | ログインユーザー情報 |
| PUT | `/api/profile` | プロフィール更新 |

### 取引・決済
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/payment/create-checkout-session` | Stripe決済セッション |
| GET | `/api/transactions` | 取引一覧 |
| POST | `/api/reviews` | レビュー投稿 |
| DELETE | `/api/profile/account` | アカウント削除（退会） |

### 適合確認
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/fitment/vehicles` | ユーザー車両一覧 |
| POST | `/api/fitment/vehicles` | 車両登録 |
| POST | `/api/fitment/match` | 適合マッチング |
| POST | `/api/fitment/confirmations` | 適合確認投稿 |

### ARGOS JPC連携（2026年6月以降公開）
| メソッド | パス | 説明 | 状態 |
|---------|------|------|------|
| GET | `/api/argos/status` | 連携ステータス確認 | フィーチャーフラグ制御 |
| GET | `/api/argos/vin/:vin` | VIN→車両情報（D1キャッシュ付き） | 準備完了 |
| GET | `/api/argos/groups` | メイングループ一覧 | 準備完了 |
| GET | `/api/argos/groups/:id/subgroups` | サブグループ一覧 | 準備完了 |
| GET | `/api/argos/subgroups/:id/parts` | 部品一覧（D1キャッシュ付き） | 準備完了 |
| GET | `/api/argos/search-listings` | OEM品番でPARTS HUB内検索 | 準備完了 |
| POST | `/api/argos/link-parts` | 出品商品にOEM品番紐付け | 準備完了 |
| GET | `/api/argos/cache-stats` | キャッシュ統計（管理者向け） | 準備完了 |

### デモ（開発用モックAPI）
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/argos-demo/vin/:vin` | モックVIN検索 |
| GET | `/api/argos-demo/groups` | モックグループ一覧 |
| GET | `/api/argos-demo/groups/:id/subgroups` | モックサブグループ |
| GET | `/api/argos-demo/subgroups/:id/parts` | モック部品一覧 |
| GET | `/api/argos-demo/search-listings` | モックPARTS HUB検索 |

### その他
- **チャット**: `/api/chat/*`
- **お気に入り**: `/api/favorites/*`
- **通知**: `/api/notifications/*`
- **価格交渉**: `/api/negotiations/*`
- **記事**: `/api/articles/*`
- **メール**: `/api/email/*`
- **管理者**: `/api/admin/*`

---

## データアーキテクチャ

### 主要テーブル
| テーブル | 説明 |
|---------|------|
| `users` | ユーザー（整備工場・個人） |
| `categories` / `subcategories` | カテゴリ（10種 / 40+サブ） |
| `car_makers` / `car_models` | メーカー（12社）・車種 |
| `products` | 商品 |
| `product_images` | 商品画像（最大10枚、R2） |
| `product_compatibility` | 適合車両情報 |
| `transactions` | 取引 |
| `reviews` | レビュー |
| `chat_rooms` / `chat_messages` | チャット |
| `favorites` | お気に入り |
| `price_negotiations` | 価格交渉 |
| `admins` | 管理者 |

### ARGOS JPC連携テーブル（0018マイグレーション）
| テーブル | 説明 |
|---------|------|
| `argos_vin_cache` | VIN検索結果キャッシュ（30日TTL） |
| `argos_parts_cache` | 部品データキャッシュ（VIN×グループ別） |
| `argos_api_log` | API呼出ログ（コスト追跡） |
| `product_oem_parts` | 出品商品×OEM品番紐付け |

### ストレージサービス
- **Cloudflare D1**: メインDB（SQLite互換・グローバル分散）
- **Cloudflare R2**: 商品画像ストレージ
- **Cloudflare Pages**: 静的アセット + Workerランタイム

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Hono v4 + TypeScript |
| ランタイム | Cloudflare Workers (Edge) |
| データベース | Cloudflare D1 (SQLite) |
| ストレージ | Cloudflare R2 |
| フロントエンド | TailwindCSS (CDN) + Font Awesome + Axios |
| 決済 | Stripe Checkout |
| メール | Resend API |
| ビルド | Vite |
| デプロイ | Wrangler CLI → Cloudflare Pages |
| プロセス管理 | PM2（開発時） |
| バージョン管理 | Git |

---

## 開発ガイド

### セットアップ
```bash
npm install
npm run db:migrate:local    # D1マイグレーション
npm run db:seed             # テストデータ
npm run build               # ビルド
pm2 start ecosystem.config.cjs  # 開発サーバー
```

### よく使うコマンド
```bash
npm run build               # Viteビルド
npm run clean-port          # ポート3000クリーンアップ
npm run db:reset            # DB完全リセット
npm run deploy              # Cloudflare Pagesデプロイ
pm2 logs webapp --nostream  # ログ確認
```

---

## プロジェクト構造
```
webapp/
├── src/
│   ├── index.tsx              # メインアプリ + 全ページHTML
│   ├── types.ts               # TypeScript型定義（Bindings含む）
│   └── routes/
│       ├── api.ts             # 基本API
│       ├── products.ts        # 商品CRUD（OEM品番含む）
│       ├── auth.ts            # 認証
│       ├── fitment.ts         # 適合確認
│       ├── argos.ts           # 本番ARGOS JPC API（フィーチャーフラグ制御）
│       ├── argos-demo.ts      # デモ用モックAPI
│       ├── payment.ts         # Stripe決済
│       ├── chat.ts            # チャット
│       ├── negotiations.ts    # 価格交渉
│       ├── favorites.ts       # お気に入り
│       ├── notifications.ts   # 通知
│       ├── reviews.ts         # レビュー
│       ├── articles.ts        # 記事
│       ├── email.ts           # メール通知
│       ├── admin.ts           # 管理者API
│       ├── admin-pages.ts     # 管理画面HTML
│       └── ...
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── ...
│   ├── 0018_argos_jpc_integration.sql  # ARGOS連携テーブル
│   └── 0023_rate_limits.sql           # レートリミットテーブル
├── public/static/             # フロントエンドJS・CSS
├── wrangler.jsonc             # Cloudflare設定
├── ecosystem.config.cjs       # PM2設定
└── package.json
```

---

## デプロイ

### 本番（Cloudflare Pages）
```bash
# 認証
setup_cloudflare_api_key  # または npx wrangler login

# マイグレーション
npx wrangler d1 migrations apply parts-hub-production

# デプロイ
npm run build && npx wrangler pages deploy dist --project-name parts-hub
```

### 環境変数（本番）
- `ENVIRONMENT=production`
- `R2_PUBLIC_URL=https://images.parts-hub-tci.com`
- `JWT_SECRET` (secret)
- `STRIPE_PUBLIC_KEY` / `STRIPE_SECRET_KEY` (secret)
- `RESEND_API_KEY` (secret)
- `ARGOS_API_KEY` (secret / 2026年6月以降)
- `ARGOS_API_URL` (secret / 2026年6月以降)
- `ARGOS_API_ENABLED=true` (2026年6月以降)

---

**最終更新**: 2026-04-04
**ステータス**: 🟢 本番稼働中（ARGOS JPC連携: 2026年6月以降公開予定）
**進捗**: 全主要機能実装済み。セキュリティ強化（認証・レートリミット・CSRF対策）完了。退会機能追加。ARGOS JPC本番実装準備完了（API契約待ち）
