# OpenAI APIキー設定ガイド（初心者向け）

## 📋 ステップ1: OpenAI APIキーを取得する

### 1-1. OpenAIアカウントの作成

1. **OpenAIのサイトにアクセス**
   - ブラウザで https://platform.openai.com/signup を開く
   
2. **アカウント作成**
   - メールアドレスを入力
   - または「Continue with Google」でGoogleアカウントで登録
   - パスワードを設定（Googleアカウントの場合は不要）
   
3. **メール認証**
   - 登録したメールアドレスに届いた確認メールを開く
   - 「Verify email address」ボタンをクリック

4. **電話番号認証**
   - 携帯電話番号を入力（日本の場合: +81 90-xxxx-xxxx）
   - SMSで届いた6桁のコードを入力

### 1-2. APIキーの作成

1. **APIキー管理ページへ移動**
   - https://platform.openai.com/api-keys にアクセス
   - または、ダッシュボード左メニューから「API keys」をクリック

2. **新しいAPIキーを作成**
   - 「+ Create new secret key」ボタンをクリック
   - キーの名前を入力（例: "PARTS HUB Production"）
   - 「Create secret key」をクリック

3. **APIキーをコピー**
   - 表示されたAPIキーをコピー
   - **形式**: `sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - ⚠️ **重要**: このキーは一度しか表示されません！
   - すぐにメモ帳などに保存してください

### 1-3. 支払い方法の設定（必須）

OpenAI APIは従量課金制です。使用するには支払い方法の登録が必要です。

1. **支払い設定ページへ**
   - https://platform.openai.com/settings/organization/billing/overview にアクセス
   - または、左メニューから「Settings」→「Billing」

2. **支払い方法を追加**
   - 「Add payment method」をクリック
   - クレジットカード情報を入力
   - 「Save」をクリック

3. **初回クレジット（$5〜$10）をチャージ**
   - 「Add to credit balance」をクリック
   - 金額を入力（推奨: $10）
   - 「Continue」→「Confirm payment」

4. **使用制限を設定（推奨）**
   - 「Usage limits」タブをクリック
   - 「Monthly budget」を設定（例: $5 または $10）
   - これで予期しない高額請求を防げます

---

## 📋 ステップ2: Cloudflare Pagesに設定する

APIキーを取得したら、次はPARTS HUBに設定します。

### 方法A: コマンドライン（推奨・簡単）

ターミナル/コマンドプロンプトで以下を実行：

```bash
# プロジェクトディレクトリに移動
cd /home/user/webapp

# OpenAI APIキーを設定
npx wrangler pages secret put OPENAI_API_KEY --project-name parts-hub
```

実行すると、プロンプトが表示されます：

```
Enter a secret value: 
```

ここで、先ほどコピーしたAPIキー（`sk-proj-XXX...`）をペースト（貼り付け）してください。

- **Windows**: Ctrl+V
- **Mac**: Cmd+V
- **ターミナル**: 右クリック → 貼り付け

Enterキーを押すと設定完了です！

```
✨ Success! Uploaded secret OPENAI_API_KEY
```

### 方法B: Cloudflareダッシュボード（GUIで設定）

コマンドラインが苦手な方向けです。

1. **Cloudflareダッシュボードにログイン**
   - https://dash.cloudflare.com/ にアクセス
   - メールアドレスとパスワードでログイン

2. **PARTS HUBプロジェクトを選択**
   - 左メニューから「Workers & Pages」をクリック
   - プロジェクト一覧から「parts-hub」をクリック

3. **環境変数設定ページへ**
   - 上部タブから「Settings」をクリック
   - 左メニューから「Environment variables」を選択

4. **環境変数を追加**
   - 「Add variable」ボタンをクリック
   - **Variable name**: `OPENAI_API_KEY` と入力
   - **Value**: コピーしたAPIキー（`sk-proj-XXX...`）をペースト
   - 「Encrypt」にチェックを入れる（重要！）
   - 「Save」をクリック

5. **Production環境に適用**
   - 「Production」タブで設定されていることを確認
   - 設定が表示されていれば完了です

---

## 📋 ステップ3: 動作確認

設定が完了したら、実際に動作するか確認しましょう。

### 3-1. 管理画面でテスト

1. **コラム管理ページにアクセス**
   - https://parts-hub-tci.com/admin/articles を開く

2. **AI自動生成をテスト**
   - 「AI自動生成」ボタンをクリック
   - トピック: `ブレーキパッドの選び方` と入力
   - カテゴリ: 「パーツガイド」を選択
   - 「生成する」をクリック

3. **結果を確認**
   - ✅ 成功: 記事が生成され、編集画面が表示される
   - ❌ エラー: エラーメッセージが表示される
     → 「トラブルシューティング」セクションを参照

### 3-2. 画像付き自動生成をテスト

1. **完全自動生成ボタンをクリック**
   - 「自動生成（画像付き）」ボタンをクリック
   - 確認ダイアログで「OK」

2. **生成を待つ**
   - 30〜60秒ほど待ちます
   - ボタンに「生成中...」と表示されます

3. **結果を確認**
   - ✅ 成功: 「記事が生成され、公開されました！」メッセージが表示
   - 記事一覧に新しい記事が追加される
   - TOPページ（https://parts-hub-tci.com/）で記事が表示される

---

## 🔍 トラブルシューティング

### エラー: "OpenAI APIキーが設定されていません"

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. 設定コマンドを再実行
2. APIキーにスペースや改行が入っていないか確認
3. Cloudflareダッシュボードで設定を確認

### エラー: "OpenAI API呼び出しに失敗しました"

**原因1**: APIキーが無効
- APIキーをコピーし直して再設定

**原因2**: 支払い方法が登録されていない
- https://platform.openai.com/settings/organization/billing にアクセス
- クレジットカードを登録
- $5〜$10をチャージ

**原因3**: 残高不足
- 現在の残高を確認: https://platform.openai.com/settings/organization/billing/overview
- 追加チャージ

### エラー: "Rate limit exceeded"

**原因**: API制限（1分間の呼び出し回数超過）

**解決策**:
- 1〜2分待ってから再試行
- 無料枠の場合: 有料プランにアップグレード

### 生成が途中で止まる

**原因**: ネットワークタイムアウト

**解決策**:
- ページをリロードして再試行
- ブラウザのコンソール（F12）でエラーを確認

---

## 💰 料金について

### 従量課金制

OpenAI APIは使った分だけ課金されます。

**PARTS HUBでの使用料金（1記事あたり）**:
- テキスト生成（GPT-4o-mini）: 約$0.01
- 画像生成（DALL-E 3）: 約$0.04
- **合計**: 約$0.05/記事

**月額コスト見積もり**:
- 1日1記事（30記事/月）: 約$1.50
- 週2記事（8記事/月）: 約$0.40
- 月4記事: 約$0.20

### 料金を抑えるコツ

1. **使用制限を設定**
   - OpenAIの設定で月額上限を設定（例: $5）
   
2. **必要な時だけ生成**
   - 自動生成は必要な時だけ使う
   - 下書きを編集して再利用

3. **画像なし生成を活用**
   - 「AI自動生成」（画像なし）: $0.01/記事
   - 画像は別途用意（無料素材サイトなど）

---

## 📚 参考リンク

- OpenAI API キー管理: https://platform.openai.com/api-keys
- OpenAI 料金ページ: https://openai.com/api/pricing/
- OpenAI 使用量確認: https://platform.openai.com/usage
- OpenAI 支払い設定: https://platform.openai.com/settings/organization/billing
- Cloudflareダッシュボード: https://dash.cloudflare.com/

---

## ✅ チェックリスト

設定完了の確認用チェックリスト：

- [ ] OpenAIアカウント作成完了
- [ ] APIキー取得完了（`sk-proj-XXX...`）
- [ ] 支払い方法登録完了
- [ ] 初回チャージ完了（$5〜$10）
- [ ] Cloudflare Pagesに環境変数設定完了
- [ ] AI自動生成テスト成功
- [ ] 画像付き自動生成テスト成功

すべてチェックが付いたら完了です！🎉

---

## 🆘 サポート

問題が解決しない場合：

1. **OpenAI公式ドキュメント**: https://platform.openai.com/docs/
2. **OpenAI サポート**: https://help.openai.com/
3. **Cloudflareドキュメント**: https://developers.cloudflare.com/pages/
