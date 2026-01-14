#!/bin/bash

# 在遠端伺服器上執行的 nginx 配置更新腳本
# 使用方法：將此腳本上傳到遠端伺服器後執行

set -e

NGINX_CONFIG="/etc/nginx/sites-available/course_selection_api"
FRONTEND_PATH="/home/hostadm/frontend_web/dist"
BACKUP_SUFFIX=$(date +%Y%m%d_%H%M%S)

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}開始更新 nginx 配置...${NC}"

# 檢查前端目錄是否存在
if [ ! -d "$FRONTEND_PATH" ]; then
    echo -e "${RED}錯誤：前端目錄不存在：${FRONTEND_PATH}${NC}"
    echo -e "${YELLOW}請先執行部署腳本上傳前端文件${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 前端目錄存在：${FRONTEND_PATH}${NC}"

# 備份現有配置
echo -e "${YELLOW}備份現有配置...${NC}"
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.${BACKUP_SUFFIX}"
echo -e "${GREEN}✓ 備份完成：${NGINX_CONFIG}.backup.${BACKUP_SUFFIX}${NC}"

# 創建新配置
echo -e "${YELLOW}創建新配置...${NC}"
sudo tee "$NGINX_CONFIG" > /dev/null << 'NGINX_EOF'
# Nginx 配置：HTTP 和 HTTPS
# 部署位置：/etc/nginx/sites-available/course_selection_api

# HTTP 伺服器（重定向到 HTTPS）
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Let's Encrypt 驗證路徑
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 其他所有請求重定向到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 伺服器配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;

    # SSL 證書配置
    ssl_certificate /etc/letsencrypt/live/140.120.3.145/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/140.120.3.145/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 日誌配置
    access_log /var/log/nginx/course_selection_api_access.log;
    error_log /var/log/nginx/course_selection_api_error.log;

    # 客戶端請求體大小限制
    client_max_body_size 10M;

    # 根目錄：服務前端靜態文件
    root /home/hostadm/frontend_web/dist;
    index index.html;

    # API 路徑反向代理到 FastAPI（必須在根路徑之前）
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        
        # 保留原始主機和協議信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket 支持（如果需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超時設置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 緩衝區設置
        proxy_buffering off;
    }

    # 前端靜態文件服務
    location / {
        try_files $uri $uri/ /index.html;
        
        # 靜態資源緩存設置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 健康檢查端點
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# 設定權限
sudo chown root:root "$NGINX_CONFIG"
sudo chmod 644 "$NGINX_CONFIG"

# 測試 nginx 配置
echo -e "${YELLOW}測試 nginx 配置...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx 配置測試通過${NC}"
    
    # 重新載入 nginx
    echo -e "${YELLOW}重新載入 nginx...${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx 已重新載入${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}配置更新完成！${NC}"
    echo -e "${GREEN}現在可以訪問 https://140.120.3.145/${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${RED}✗ Nginx 配置測試失敗${NC}"
    echo -e "${YELLOW}正在恢復備份配置...${NC}"
    sudo cp "${NGINX_CONFIG}.backup.${BACKUP_SUFFIX}" "$NGINX_CONFIG"
    sudo systemctl reload nginx
    echo -e "${YELLOW}已恢復備份配置${NC}"
    exit 1
fi









