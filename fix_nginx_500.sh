#!/bin/bash

# 修復 Nginx 500 錯誤的腳本
# 在遠端伺服器上執行

set -e

FRONTEND_PATH="/home/hostadm/frontend_web/dist"
NGINX_CONFIG="/etc/nginx/sites-available/course_selection_api"

echo "=== 開始修復 Nginx 500 錯誤 ==="
echo ""

# 1. 確保前端目錄存在
echo "1. 檢查前端目錄..."
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "✗ 前端目錄不存在，創建中..."
    mkdir -p "$FRONTEND_PATH"
    echo "✓ 目錄已創建"
else
    echo "✓ 前端目錄存在"
fi
echo ""

# 2. 檢查 index.html
if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "✗ index.html 不存在！"
    echo "  請先執行部署腳本上傳前端文件"
    exit 1
fi
echo "✓ index.html 存在"
echo ""

# 3. 設定正確的權限
echo "2. 設定文件權限..."
chmod -R 755 "$(dirname "$FRONTEND_PATH")"
chmod -R 644 "$FRONTEND_PATH"/*
chmod 755 "$FRONTEND_PATH"
echo "✓ 權限已設定"
echo ""

# 4. 檢查並修復 nginx 配置
echo "3. 檢查 nginx 配置..."

# 檢查配置中是否有 root 設定
if ! sudo grep -q "root /home/hostadm/frontend_web/dist" "$NGINX_CONFIG"; then
    echo "✗ 配置中缺少 root 設定，正在修復..."
    
    # 備份配置
    BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "✓ 已備份到: $BACKUP_FILE"
    
    # 使用 sed 添加 root 設定（在 server 區塊內，location /api/ 之前）
    # 如果已經有 root，先移除舊的
    sudo sed -i '/^[[:space:]]*root[[:space:]]/d' "$NGINX_CONFIG"
    
    # 在 location /api/ 之前添加 root 和 index
    sudo sed -i '/location \/api\//i\    # 根目錄：服務前端靜態文件\n    root /home/hostadm/frontend_web/dist;\n    index index.html;' "$NGINX_CONFIG"
    
    echo "✓ 配置已更新"
else
    echo "✓ root 設定已存在"
fi

# 檢查是否有 try_files
if ! sudo grep -q "try_files" "$NGINX_CONFIG"; then
    echo "✗ 配置中缺少 try_files，正在修復..."
    
    # 在 location / { 區塊中添加 try_files
    sudo sed -i '/location \/ {/a\        try_files $uri $uri/ /index.html;' "$NGINX_CONFIG"
    
    echo "✓ try_files 已添加"
else
    echo "✓ try_files 已存在"
fi

echo ""

# 5. 測試配置
echo "4. 測試 nginx 配置..."
if sudo nginx -t; then
    echo "✓ 配置測試通過"
    echo ""
    
    # 重新載入 nginx
    echo "5. 重新載入 nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx 已重新載入"
    echo ""
    
    echo "=== 修復完成 ==="
    echo "請重新訪問 https://140.120.3.145/"
else
    echo "✗ 配置測試失敗"
    echo "請檢查錯誤訊息並手動修復配置"
    exit 1
fi









