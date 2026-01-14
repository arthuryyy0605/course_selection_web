#!/bin/bash

# Nginx 診斷腳本
# 在遠端伺服器上執行以診斷 500 錯誤

echo "=== Nginx 診斷報告 ==="
echo ""

# 1. 檢查前端目錄是否存在
echo "1. 檢查前端目錄..."
FRONTEND_PATH="/home/hostadm/frontend_web/dist"
if [ -d "$FRONTEND_PATH" ]; then
    echo "✓ 目錄存在: $FRONTEND_PATH"
    echo "  文件列表:"
    ls -la "$FRONTEND_PATH" | head -10
else
    echo "✗ 目錄不存在: $FRONTEND_PATH"
fi
echo ""

# 2. 檢查 index.html 是否存在
echo "2. 檢查 index.html..."
if [ -f "$FRONTEND_PATH/index.html" ]; then
    echo "✓ index.html 存在"
    echo "  權限: $(ls -l "$FRONTEND_PATH/index.html" | awk '{print $1, $3, $4}')"
else
    echo "✗ index.html 不存在"
fi
echo ""

# 3. 檢查目錄權限
echo "3. 檢查目錄權限..."
echo "  目錄權限: $(stat -c '%a %U:%G' "$FRONTEND_PATH" 2>/dev/null || echo '無法讀取')"
echo ""

# 4. 檢查 nginx 配置語法
echo "4. 檢查 nginx 配置語法..."
sudo nginx -t 2>&1
echo ""

# 5. 查看最近的 nginx 錯誤日誌
echo "5. 最近的 nginx 錯誤日誌（最後 20 行）..."
echo "---"
sudo tail -20 /var/log/nginx/course_selection_api_error.log 2>/dev/null || echo "無法讀取錯誤日誌"
echo "---"
echo ""

# 6. 檢查 nginx 配置中的 root 路徑
echo "6. 檢查 nginx 配置中的 root 設定..."
ROOT_PATH=$(sudo grep -A 5 "location / {" /etc/nginx/sites-available/course_selection_api | grep "root" | awk '{print $2}' | tr -d ';')
if [ -n "$ROOT_PATH" ]; then
    echo "  配置的 root 路徑: $ROOT_PATH"
    if [ -d "$ROOT_PATH" ]; then
        echo "  ✓ 路徑存在"
    else
        echo "  ✗ 路徑不存在"
    fi
else
    echo "  未找到 root 設定"
fi
echo ""

# 7. 檢查 nginx 進程狀態
echo "7. Nginx 服務狀態..."
sudo systemctl status nginx --no-pager -l | head -10
echo ""

echo "=== 診斷完成 ==="









