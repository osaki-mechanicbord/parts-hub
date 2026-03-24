# PARTS HUB コラム機能 完全ガイド

## 📋 機能概要

PARTS HUBにコラム（ニュース）機能が追加されました。管理画面から手動または自動でコラム記事を作成・公開できます。

### 主要機能
- ✅ コラム一覧・詳細ページ
- ✅ 管理画面でのCRUD操作
- ✅ AI自動生成（OpenAI GPT-4o-mini）
- ✅ アイキャッチ画像自動生成（DALL-E 3）
- ✅ TOPページに注目記事表示
- ✅ 閲覧数カウント
- ✅ カテゴリ・タグ管理

## 🚀 クイックスタート

### 1. OpenAI APIキーの設定

```bash
# OpenAI APIキーを設定（必須）
npx wrangler pages secret put OPENAI_API_KEY --project-name parts-hub
# プロンプトで sk-proj-xxxxxxxxxxxxx を入力
```

### 2. 管理画面でコラムを作成

#### 方法A: AI自動生成（テキストのみ）
1. https://parts-hub-tci.com/admin/articles にアクセス
2. 「AI自動生成」ボタンをクリック
3. トピックを入力（例: ブレーキパッドの選び方）
4. カテゴリを選択
5. 「生成する」をクリック
6. 生成された記事を確認・編集
7. 「保存」をクリック

#### 方法B: 完全自動生成（画像付き）⭐おすすめ
1. https://parts-hub-tci.com/admin/articles にアクセス
2. 「自動生成（画像付き）」ボタンをクリック
3. 確認ダイアログで「OK」
4. 生成完了を待つ（30-60秒）
5. 自動的に公開される

#### 方法C: 手動作成
1. 管理画面で記事を新規作成
2. タイトル、本文、画像URLを入力
3. ステータスを「公開」に設定
4. 保存

## 📚 APIエンドポイント

### フロントエンド用
- `GET /api/articles` - 記事一覧（ページネーション）
- `GET /api/articles/featured` - 注目記事
- `GET /api/articles/:slug` - 記事詳細（閲覧数カウント）

### 管理画面用
- `GET /api/admin/articles` - 管理用記事一覧
- `POST /api/admin/articles` - 記事作成
- `PUT /api/admin/articles/:id` - 記事更新
- `DELETE /api/admin/articles/:id` - 記事削除
- `POST /api/admin/articles/generate` - AI自動生成（テキストのみ）
- `POST /api/admin/articles/auto-generate-with-image` - 完全自動生成⭐

## 🎨 データベース構造

```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                    -- タイトル
  slug TEXT UNIQUE NOT NULL,              -- URLスラッグ
  summary TEXT,                           -- 要約
  content TEXT NOT NULL,                  -- 本文（HTML）
  thumbnail_url TEXT,                     -- サムネイル画像URL
  category TEXT DEFAULT 'general',        -- カテゴリ
  tags TEXT,                              -- タグ（カンマ区切り）
  status TEXT DEFAULT 'draft',            -- ステータス（draft/published/archived）
  is_featured INTEGER DEFAULT 0,          -- 注目記事フラグ
  view_count INTEGER DEFAULT 0,           -- 閲覧数
  published_at DATETIME,                  -- 公開日時
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 💰 コスト

### OpenAI API料金（1記事あたり）
- **テキスト生成**: GPT-4o-mini 約$0.01
- **画像生成**: DALL-E 3 (1792x1024) 約$0.04
- **合計**: 約$0.05/記事

### 月額コスト見積もり
- **1日1記事**: 約$1.50/月
- **週2記事**: 約$0.40/月
- **月4記事**: 約$0.20/月

### Cloudflare料金
- Workers/Pages: 無料（Free plan）
- D1 Database: 無料（5GBまで）
- **追加料金なし** 🎉

## 🤖 毎日自動投稿の設定（オプション）

Cloudflare Workers Cronを使用して、毎日自動でコラムを投稿できます。

### ステップ1: wrangler.jsonc にCron設定を追加

```jsonc
{
  "name": "parts-hub",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  
  // 毎日UTC 0時（JST 9時）に実行
  "triggers": {
    "crons": ["0 0 * * *"]
  }
}
```

### ステップ2: Scheduled Handlerを実装

`src/index.tsx` に以下を追加：

```typescript
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return app.fetch(request, env);
  },
  
  // Cron Trigger
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log('Auto article generation started');
    
    try {
      // 自動生成APIを内部呼び出し
      const response = await fetch('https://parts-hub-tci.com/api/admin/articles/auto-generate-with-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      console.log('Auto generation completed:', result);
    } catch (error) {
      console.error('Auto generation failed:', error);
    }
  }
};
```

### ステップ3: デプロイ

```bash
npm run build
npx wrangler pages deploy dist --project-name parts-hub
```

### Cron設定例
- `"0 0 * * *"` - 毎日0時（UTC）
- `"0 9 * * *"` - 毎日9時（UTC）
- `"0 0 * * 1"` - 毎週月曜日0時
- `"0 0 1 * *"` - 毎月1日0時

## 📖 ページURL

- **TOPページ（注目記事表示）**: https://parts-hub-tci.com/
- **コラム一覧**: https://parts-hub-tci.com/news
- **コラム詳細**: https://parts-hub-tci.com/news/:slug
- **管理画面**: https://parts-hub-tci.com/admin/articles

## 🔍 トラブルシューティング

### エラー: "OpenAI APIキーが設定されていません"
**原因**: 環境変数が未設定
**解決策**:
```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name parts-hub
```

### エラー: "OpenAI API呼び出しに失敗しました"
**原因**: APIキーが無効、または残高不足
**解決策**: 
1. https://platform.openai.com/account/billing にアクセス
2. 残高を確認
3. 必要に応じてチャージ

### 画像URLが表示されない
**原因**: DALL-E 3が生成する画像URLは1時間で期限切れ
**解決策**: 
- 画像生成後、すぐにR2やS3に保存する実装を追加
- または、外部画像ホスティングサービスを使用

### 記事が表示されない
**原因**: ステータスが「下書き」になっている
**解決策**:
1. 管理画面で記事を開く
2. ステータスを「公開」に変更
3. 保存

## 📚 関連ドキュメント

- `COLUMN_AI_SETUP.md` - OpenAI API設定ガイド
- `AUTO_COLUMN_SETUP.md` - 自動投稿設定ガイド

## 🎯 今後の拡張案

- [ ] R2ストレージへの画像永続保存
- [ ] 記事のスケジュール予約投稿
- [ ] カテゴリ別のアーカイブページ
- [ ] タグ検索機能
- [ ] 関連記事の自動推薦
- [ ] SNSシェア機能
- [ ] コメント機能

## 📝 変更履歴

### 2026-03-24
- ✅ コラム機能リリース
- ✅ AI自動生成機能追加
- ✅ DALL-E 3画像生成統合
- ✅ 管理画面UI実装
- ✅ 完全ドキュメント作成
