#!/bin/bash

# Nginx 配置更新腳本
# 用途：更新遠端伺服器的 nginx 配置以支援前端靜態文件服務

set -e

# 配置變數
REMOTE_HOST="140.120.3.145"
REMOTE_USER="${REMOTE_USER:-hostadm}"
NGINX_CONFIG="/etc/nginx/sites-available/course_selection_api"
FRONTEND_PATH="~/frontend_web/dist"

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}準備更新 nginx 配置...${NC}"

# 創建臨時配置文件
TEMP_CONFIG=$(mktemp)
cat > "$TEMP_CONFIG" << 'NGINX_EOF'
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
    root FRONTEND_PATH_PLACEHOLDER;
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

# 獲取遠端用戶的 home 目錄絕對路徑
echo -e "${YELLOW}獲取遠端伺服器路徑資訊...${NC}"
REMOTE_HOME=$(ssh "${REMOTE_USER}@${REMOTE_HOST}" "echo \$HOME")
FRONTEND_ABSOLUTE_PATH="${REMOTE_HOME}/frontend_web/dist"

# 替換配置文件中的路徑佔位符
sed -i.bak "s|FRONTEND_PATH_PLACEHOLDER|${FRONTEND_ABSOLUTE_PATH}|g" "$TEMP_CONFIG"

echo -e "${YELLOW}前端文件路徑：${FRONTEND_ABSOLUTE_PATH}${NC}"

# 備份現有配置
echo -e "${YELLOW}備份現有 nginx 配置...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo cp ${NGINX_CONFIG} ${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# 上傳新配置
echo -e "${YELLOW}上傳新 nginx 配置...${NC}"
scp "$TEMP_CONFIG" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/course_selection_api_new"

# 移動配置文件到正確位置（需要 sudo）
echo -e "${YELLOW}應用新配置...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo mv /tmp/course_selection_api_new ${NGINX_CONFIG} && sudo chown root:root ${NGINX_CONFIG} && sudo chmod 644 ${NGINX_CONFIG}"

# 測試 nginx 配置
echo -e "${YELLOW}測試 nginx 配置...${NC}"
if ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo nginx -t"; then
    echo -e "${GREEN}✓ Nginx 配置測試通過${NC}"
    
    # 重新載入 nginx
    echo -e "${YELLOW}重新載入 nginx...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "sudo systemctl reload nginx"
    echo -e "${GREEN}✓ Nginx 已重新載入${NC}"
else
    echo -e "${RED}✗ Nginx 配置測試失敗，請檢查配置${NC}"
    echo -e "${YELLOW}已備份原配置，可以恢復：${NC}"
    echo -e "${YELLOW}ssh ${REMOTE_USER}@${REMOTE_HOST} 'sudo cp ${NGINX_CONFIG}.backup.* ${NGINX_CONFIG}'${NC}"
    rm -f "$TEMP_CONFIG" "$TEMP_CONFIG.bak"
    exit 1
fi

# 清理臨時文件
rm -f "$TEMP_CONFIG" "$TEMP_CONFIG.bak"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Nginx 配置更新完成！${NC}"
echo -e "${GREEN}========================================${NC}"

