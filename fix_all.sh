#!/bin/bash

# 一鍵修復腳本 - 解決權限和配置問題
# 在遠端伺服器上執行

set -e

FRONTEND_PATH="/home/hostadm/frontend_web/dist"
NGINX_CONFIG="/etc/nginx/sites-available/course_selection_api"

echo "=== 開始修復 ==="
echo ""

# 1. 修復權限 - 讓 nginx 可以讀取
echo "1. 修復文件權限..."
chmod 755 /home/hostadm
chmod 755 /home/hostadm/frontend_web
chmod 755 "$FRONTEND_PATH"
chmod 644 "$FRONTEND_PATH"/*
chmod 755 "$FRONTEND_PATH/assets" 2>/dev/null || true
chmod 644 "$FRONTEND_PATH/assets"/* 2>/dev/null || true
echo "✓ 權限已設定"
echo ""

# 2. 備份並修復 nginx 配置
echo "2. 修復 nginx 配置..."
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✓ 已備份到: $BACKUP_FILE"

# 讀取當前配置
TEMP_CONFIG=$(mktemp)
sudo cat "$NGINX_CONFIG" > "$TEMP_CONFIG"

# 檢查並修復
HAS_ROOT=false
HAS_TRY_FILES=false

# 檢查是否有 root 設定
if grep -q "root /home/hostadm/frontend_web/dist" "$TEMP_CONFIG"; then
    HAS_ROOT=true
fi

# 檢查 location / 配置
if grep -A 10 "location / {" "$TEMP_CONFIG" | grep -q "try_files"; then
    HAS_TRY_FILES=true
fi

# 如果缺少 root，添加它（在 HTTPS server 區塊內，location /api/ 之前）
if [ "$HAS_ROOT" = false ]; then
    echo "  添加 root 設定..."
    # 在 listen 443 之後添加
    sed -i '/listen \[::\]:443 ssl http2;/a\    # 根目錄：服務前端靜態文件\n    root /home/hostadm/frontend_web/dist;\n    index index.html;' "$TEMP_CONFIG"
fi

# 如果缺少 try_files，修復 location / 配置
if [ "$HAS_TRY_FILES" = false ]; then
    echo "  修復 location / 配置..."
    # 如果存在 return 404，替換它
    if grep -A 2 "location / {" "$TEMP_CONFIG" | grep -q "return 404"; then
        # 替換整個 location / 區塊
        sed -i '/location \/ {/,/^    }/c\
    # 前端靜態文件服務\
    location / {\
        try_files $uri $uri/ /index.html;\
    }' "$TEMP_CONFIG"
    else
        # 在 location / { 後添加 try_files
        sed -i '/location \/ {/a\        try_files $uri $uri/ /index.html;' "$TEMP_CONFIG"
    fi
fi

# 寫回配置
sudo cp "$TEMP_CONFIG" "$NGINX_CONFIG"
rm "$TEMP_CONFIG"
echo "✓ 配置已更新"
echo ""

# 3. 測試並重新載入
echo "3. 測試配置..."
if sudo nginx -t; then
    echo "✓ 配置測試通過"
    echo ""
    echo "4. 重新載入 nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx 已重新載入"
    echo ""
    echo "=== 修復完成 ==="
    echo "請訪問 https://140.120.3.145/ 測試"
else
    echo "✗ 配置測試失敗，恢復備份..."
    sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
    sudo nginx -t
    exit 1
fi









