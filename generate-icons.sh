#!/bin/bash
# PWAアイコン生成スクリプト（開発用プレースホルダー）

echo "PWAアイコン生成中..."

# 実際のプロジェクトでは、以下のツールを使用してアイコン生成
# - https://realfavicongenerator.net/
# - https://www.pwabuilder.com/imageGenerator

# ここでは開発用にSVGプレースホルダーを作成

ICON_DIR="/home/user/webapp/public/icons"

# SVGアイコン（プレースホルダー）
cat > "$ICON_DIR/icon.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#2563eb" rx="80"/>
  <g fill="#ffffff">
    <!-- 車のアイコン -->
    <path d="M120 200 L150 150 L362 150 L392 200 Z" stroke="#ffffff" stroke-width="4" fill="none"/>
    <rect x="100" y="200" width="312" height="120" rx="20" stroke="#ffffff" stroke-width="4" fill="none"/>
    <circle cx="160" cy="340" r="30" fill="#ffffff"/>
    <circle cx="352" cy="340" r="30" fill="#ffffff"/>
    <text x="256" y="280" font-size="48" font-weight="bold" text-anchor="middle" fill="#ffffff">部品</text>
  </g>
</svg>
EOF

echo "✓ icon.svg 作成完了"

# 注意メッセージ
cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  重要: 本番環境用アイコンの準備
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

現在、プレースホルダーアイコン（icon.svg）のみ作成されています。
本番環境では、以下のサイズのPNGアイコンが必要です：

必須サイズ:
- 72x72, 96x96, 128x128, 144x144, 152x152
- 192x192, 384x384, 512x512
- maskable: 192x192, 512x512

推奨ツール:
1. https://realfavicongenerator.net/
   → icon.svgをアップロードして全サイズ生成

2. https://www.pwabuilder.com/imageGenerator
   → PWA用アイコンセット一括生成

生成後、public/icons/ に配置してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo ""
echo "開発用プレースホルダー作成完了"
