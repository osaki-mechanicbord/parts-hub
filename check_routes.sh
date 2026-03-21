#!/bin/bash
routes=(
  "/listing/edit/:id"
  "/products/:id"
  "/chat/:id"
  "/chat"
  "/transactions/:id"
  "/contact"
  "/favorites"
  "/search"
  "/privacy"
  "/terms"
  "/password-reset"
  "/profile/edit"
  "/notifications"
)

echo "=== Route Check ==="
for route in "${routes[@]}"; do
  clean_route=$(echo "$route" | sed 's/:id//')
  grep -q "app.get('$route'" src/index.tsx 2>/dev/null || grep -q "app.get('${clean_route}" src/index.tsx 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ $route"
  else
    echo "❌ $route"
  fi
done
