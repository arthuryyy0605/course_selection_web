#!/bin/bash

# 修復權限和 nginx 配置的腳本
# 在遠端伺服器上執行

set -e

FRONTEND_PATH="/home/hostadm/frontend_web/dist"
NGINX_CONFIG="/etc/nginx/sites-available/course_selection_api"
NGINX_USER="www-data"

echo "=== 修復權限和 Nginx 配置 ==="
echo ""

# 1. 修復文件權限
echo "1. 修復文件權限..."

# 確保目錄存在
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "✗ 前端目錄不存在: $FRONTEND_PATH"
    exit 1
fi

# 設定目錄權限（允許 nginx 用戶讀取）
chmod -R 755 /home/hostadm/frontend_web
chmod -R 644 "$FRONTEND_PATH"/*
chmod 755 "$FRONTEND_PATH"
chmod 755 "$FRONTEND_PATH/assets" 2>/dev/null || true

# 將文件所有者改為 nginx 用戶（或使用 ACL）
# 方法 1: 改變所有者（如果可能）
if sudo chown -R "$NGINX_USER:$NGINX_USER" "$FRONTEND_PATH" 2>/dev/null; then
    echo "✓ 已將文件所有者改為 $NGINX_USER"
else
    echo "⚠ 無法改變所有者，使用權限方式"
    # 方法 2: 使用 ACL 或確保目錄可讀
    # 確保所有父目錄都有執行權限
    chmod 755 /home/hostadm
    chmod 755 /home/hostadm/frontend_web
    chmod 755 "$FRONTEND_PATH"
    chmod 644 "$FRONTEND_PATH"/*
fi

echo "✓ 權限已設定"
echo ""

# 2. 檢查並修復 nginx 配置
echo "2. 檢查並修復 nginx 配置..."

# 備份配置
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✓ 已備份配置到: $BACKUP_FILE"

# 檢查是否已有 root 設定
if sudo grep -q "root /home/hostadm/frontend_web/dist" "$NGINX_CONFIG"; then
    echo "✓ root 設定已存在"
else
    echo "✗ 缺少 root 設定，正在添加..."
    
    # 在 HTTPS server 區塊內，location /api/ 之前添加 root
    # 找到 server { 區塊（443端口）
    sudo sed -i '/listen 443 ssl http2;/a\    # 根目錄：服務前端靜態文件\n    root /home/hostadm/frontend_web/dist;\n    index index.html;' "$NGINX_CONFIG"
    
    echo "✓ root 設定已添加"
fi

# 檢查並修復 location / 配置
if sudo grep -q "location / {" "$NGINX_CONFIG"; then
    # 檢查是否有 try_files
    if ! sudo grep -A 5 "location / {" "$NGINX_CONFIG" | grep -q "try_files"; then
        echo "✗ 缺少 try_files，正在添加..."
        
        # 替換現有的 location / { return 404; } 或添加 try_files
        if sudo grep -A 2 "location / {" "$NGINX_CONFIG" | grep -q "return 404"; then
            # 替換 return 404
            sudo sed -i '/location \/ {/,/}/ {
                /return 404;/c\        try_files $uri $uri/ /index.html;
            }' "$NGINX_CONFIG"
        else
            # 在 location / { 後添加 try_files
            sudo sed -i '/location \/ {/a\        try_files $uri $uri/ /index.html;' "$NGINX_CONFIG"
        fi
        
        echo "✓ try_files 已添加"
    else
        echo "✓ try_files 已存在"
    fi
else
    echo "✗ 缺少 location / 配置，正在添加..."
    # 在 location /api/ 之後添加
    sudo sed -i '/location \/api\/ {/,/^    }/a\
\
    # 前端靜態文件服務\
    location / {\
        try_files $uri $uri/ /index.html;\
    }' "$NGINX_CONFIG"
    echo "✓ location / 配置已添加"
fi

echo ""

# 3. 測試配置
echo "3. 測試 nginx 配置..."
if sudo nginx -t; then
    echo "✓ 配置測試通過"
    echo ""
    
    # 4. 重新載入 nginx
    echo "4. 重新載入 nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx 已重新載入"
    echo ""
    
    echo "=== 修復完成 ==="
    echo "請訪問 https://140.120.3.145/ 測試"
else
    echo "✗ 配置測試失敗"
    echo "正在恢復備份..."
    sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo "已恢復備份配置"
    exit 1
fi









