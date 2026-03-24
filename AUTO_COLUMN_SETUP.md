# 毎日自動コラム投稿の設定手順

## 概要
Cloudflare Workers Cronを使用して、毎日自動で以下を実行：
1. トピックを自動決定
2. OpenAI APIでコラム記事を生成
3. DALL-E 3でアイキャッチ画像を生成
4. 記事を公開

## 必要な設定

### 1. 環境変数の追加
```bash
# OpenAI APIキー（テキスト生成と画像生成の両方に使用）
npx wrangler pages secret put OPENAI_API_KEY --project-name parts-hub

# Cloudflare R2アクセス（画像保存用、オプション）
npx wrangler pages secret put R2_ACCESS_KEY_ID --project-name parts-hub
npx wrangler pages secret put R2_SECRET_ACCESS_KEY --project-name parts-hub
```

### 2. wrangler.jsonc にCron設定を追加
```jsonc
{
  "name": "parts-hub",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  
  // Cron Triggersを追加（毎日午前9時に実行）
  "triggers": {
    "crons": ["0 9 * * *"]
  },
  
  // R2バケット設定（画像保存用、オプション）
  "r2_buckets": [
    {
      "binding": "ARTICLE_IMAGES",
      "bucket_name": "parts-hub-articles"
    }
  ]
}
```

### 3. Cron設定の説明
- `"0 9 * * *"` - 毎日午前9時（UTC）に実行
- `"0 0 * * *"` - 毎日午前0時（UTC）に実行
- `"0 */6 * * *"` - 6時間ごとに実行
- 日本時間で午前9時に実行したい場合: `"0 0 * * *"` (UTC 0時 = JST 9時)

## 実装コード（src/index.tsx に追加）

### オプション1: シンプル版（外部画像URL使用）
記事に外部の画像URLを使用する簡易版です。

```typescript
// Cron Triggerハンドラー
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // 既存のHonoアプリケーション処理
    return app.fetch(request, env);
  },
  
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log('Auto article generation started at:', new Date().toISOString());
    
    try {
      await generateDailyArticle(env);
      console.log('Auto article generation completed');
    } catch (error) {
      console.error('Auto article generation failed:', error);
    }
  }
};

async function generateDailyArticle(env: any) {
  const topics = [
    'ブレーキパッドの選び方',
    'エンジンオイル交換の適切な時期',
    'タイヤの寿命を延ばすメンテナンス方法',
    'バッテリーの点検と交換時期',
    '中古パーツの賢い選び方',
    'エアフィルター交換のタイミング',
    'ワイパーブレード交換のポイント',
    'スパークプラグの役割と交換時期'
  ];
  
  const categories = ['parts-guide', 'maintenance', 'tips'];
  
  // ランダムにトピックとカテゴリを選択
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // OpenAI APIでコラムを生成
  const articleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは自動車パーツ専門のライターです。'
        },
        {
          role: 'user',
          content: `トピック: ${topic}\nカテゴリ: ${category}\n\nJSON形式で記事を生成してください。`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  const articleData = await articleResponse.json();
  const article = JSON.parse(articleData.choices[0].message.content);
  
  // DALL-E 3でアイキャッチ画像を生成
  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Professional automotive parts blog header image about: ${topic}. Clean, modern design with car parts. High quality, photorealistic.`,
      n: 1,
      size: '1792x1024',
      quality: 'standard'
    })
  });
  
  const imageData = await imageResponse.json();
  const thumbnailUrl = imageData.data[0].url;
  
  // データベースに記事を保存
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO articles (title, slug, summary, content, thumbnail_url, category, tags, status, is_featured, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?)
  `).bind(
    article.title,
    article.slug + '-' + Date.now(),
    article.summary,
    article.content,
    thumbnailUrl,
    category,
    article.tags,
    now,
    now
  ).run();
  
  console.log('Article published:', article.title);
}
```

### オプション2: 高度版（R2に画像保存）
生成した画像をCloudflare R2に永続保存する版です。

```typescript
async function generateDailyArticleWithR2(env: any) {
  // ... 記事生成コード（同上）
  
  // DALL-E 3で画像生成
  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Professional automotive parts blog header image about: ${topic}`,
      n: 1,
      size: '1792x1024'
    })
  });
  
  const imageData = await imageResponse.json();
  const tempImageUrl = imageData.data[0].url;
  
  // 画像をダウンロード
  const imageBlob = await fetch(tempImageUrl).then(r => r.blob());
  
  // R2に保存
  const imageKey = `articles/${Date.now()}-${article.slug}.png`;
  await env.ARTICLE_IMAGES.put(imageKey, imageBlob, {
    httpMetadata: { contentType: 'image/png' }
  });
  
  // R2の公開URLを作成
  const thumbnailUrl = `https://articles.parts-hub-tci.com/${imageKey}`;
  
  // データベースに保存（同上）
  // ...
}
```

## デプロイ手順

1. **R2バケット作成（画像保存する場合）**
```bash
npx wrangler r2 bucket create parts-hub-articles
```

2. **wrangler.jsonc を更新**
上記のCron設定を追加

3. **コードをデプロイ**
```bash
npm run build
npx wrangler pages deploy dist --project-name parts-hub
```

4. **Cron動作確認**
```bash
# Cronトリガーをテスト実行
npx wrangler pages deployment tail --project-name parts-hub
```

## Cloudflareダッシュボードでの設定

1. https://dash.cloudflare.com/ にログイン
2. Workers & Pages → parts-hub
3. Settings → Triggers
4. Cron Triggersセクションで設定を確認
5. Logs で実行履歴を確認

## コスト見積もり

### OpenAI API
- GPT-4o-mini: 記事生成 約$0.01/記事
- DALL-E 3: 画像生成 約$0.04/画像（1792x1024, standard品質）
- **1日1記事の場合: 月額約$1.50**

### Cloudflare
- Workers Cron: 無料（Free planで1日1回まで）
- R2 Storage: 10GB無料、超過分 $0.015/GB/月
- **月額: ほぼ無料**

## テスト実行

手動でCronを実行してテスト：
```bash
# ローカルでテスト
npx wrangler dev

# 本番環境でテスト（即座に実行）
curl -X POST https://parts-hub-tci.com/api/admin/articles/auto-generate
```

## トラブルシューティング

### Cronが実行されない
- wrangler.jsonc のCron設定を確認
- Cloudflareダッシュボードでトリガーが有効か確認
- Logsでエラーを確認

### 画像生成に失敗
- OpenAI APIの残高を確認
- DALL-E 3のAPI制限（1分間に5リクエスト）を確認

### 画像URLが期限切れ
- DALL-E 3が生成する画像URLは1時間で期限切れ
- R2に保存する実装を推奨
