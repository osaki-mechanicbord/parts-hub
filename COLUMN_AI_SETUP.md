# コラムAI自動生成の設定手順

## 1. OpenAI APIキーの設定

### ステップ1: OpenAI APIキーの取得
1. https://platform.openai.com/ にアクセス
2. アカウント作成/ログイン
3. API Keys ページへ移動
4. "Create new secret key" をクリック
5. APIキーをコピー（例: sk-proj-xxxxxxxxxxxxx）

### ステップ2: Cloudflare Pagesに環境変数を設定

#### 方法A: Wranglerコマンド（推奨）
```bash
# 本番環境にAPIキーを設定
npx wrangler pages secret put OPENAI_API_KEY --project-name parts-hub

# プロンプトが表示されたら、OpenAI APIキーをペースト
```

#### 方法B: Cloudflareダッシュボード
1. https://dash.cloudflare.com/ にログイン
2. Workers & Pages → parts-hub を選択
3. Settings → Environment Variables
4. "Add variable" をクリック
5. 変数名: `OPENAI_API_KEY`
6. 値: OpenAI APIキー（sk-proj-xxxxxxxxxxxxx）
7. "Encrypt" にチェック
8. 保存

### ステップ3: ローカル開発環境の設定（オプション）
```bash
# プロジェクトルートに .dev.vars ファイルを作成
echo "OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx" > .dev.vars

# .gitignore に追加されていることを確認
grep ".dev.vars" .gitignore
```

## 2. wrangler.jsonc の設定確認

`wrangler.jsonc` に以下の設定があることを確認：

```jsonc
{
  "name": "parts-hub",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

## 3. 動作確認

### 管理画面でテスト
1. https://parts-hub-tci.com/admin/articles にアクセス
2. "AI自動生成" ボタンをクリック
3. トピックを入力（例: "ブレーキパッドの選び方"）
4. カテゴリを選択
5. "生成する" をクリック

### APIで直接テスト
```bash
curl -X POST https://parts-hub-tci.com/api/admin/articles/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"ブレーキパッドの選び方","category":"parts-guide"}'
```

## トラブルシューティング

### エラー: "OpenAI APIキーが設定されていません"
→ 環境変数が設定されていません。ステップ2を実行してください。

### エラー: "OpenAI API呼び出しに失敗しました"
→ APIキーが無効、または残高不足です。OpenAIアカウントを確認してください。

### エラー: "記事の生成に失敗しました"
→ OpenAI APIからのレスポンスが不正です。トピックを変更して再試行してください。
