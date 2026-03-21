#!/bin/bash
# アルゴスAPI連携テストスクリプト

echo "==================================="
echo "アルゴスAPI連携テスト"
echo "==================================="
echo ""

# カラー定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# サーバーURL
SERVER_URL="http://localhost:3000"

echo "1. ヘルスチェック"
echo "-----------------------------------"
HEALTH=$(curl -s ${SERVER_URL}/api/external/argos/health)
echo $HEALTH | jq '.'
echo ""

ENABLED=$(echo $HEALTH | jq -r '.enabled')
CONFIGURED=$(echo $HEALTH | jq -r '.configured')

if [ "$ENABLED" = "true" ] && [ "$CONFIGURED" = "true" ]; then
    echo -e "${GREEN}✓ アルゴスAPI: 有効${NC}"
    echo ""
    
    echo "2. 品番検索テスト"
    echo "-----------------------------------"
    curl -s ${SERVER_URL}/api/external/argos/part-number/67002-47130/vehicles | jq '.'
    echo ""
    
    echo "3. 車両別部品検索テスト"
    echo "-----------------------------------"
    curl -s -X POST ${SERVER_URL}/api/external/argos/vehicle/parts \
      -H 'Content-Type: application/json' \
      -d '{
        "maker": "トヨタ",
        "model": "プリウス",
        "model_code": "ZVW30",
        "year": 2012,
        "category": "ボディパーツ"
      }' | jq '.'
    echo ""
    
    echo "4. 互換品番検索テスト"
    echo "-----------------------------------"
    curl -s ${SERVER_URL}/api/external/argos/part-number/67002-47130/alternatives | jq '.'
    echo ""
    
else
    echo -e "${YELLOW}⚠ アルゴスAPI: 未設定${NC}"
    echo ""
    echo "アルゴスAPIを有効にするには:"
    echo "1. .dev.vars ファイルを作成"
    echo "2. 以下を設定:"
    echo "   ARGOS_API_ENABLED=true"
    echo "   ARGOS_API_KEY=your_api_key_here"
    echo "3. サーバーを再起動"
    echo ""
    
    echo "モックレスポンステスト:"
    echo "-----------------------------------"
    curl -s ${SERVER_URL}/api/external/argos/part-number/test123/vehicles | jq '.'
    echo ""
fi

echo "==================================="
echo "テスト完了"
echo "==================================="
