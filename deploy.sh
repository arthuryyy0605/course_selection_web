#!/bin/bash

# 前端部署腳本
# 用途：打包前端專案並部署到遠端伺服器

set -e  # 遇到錯誤立即退出

# 配置變數
REMOTE_HOST="140.120.3.145"
REMOTE_USER="${REMOTE_USER:-hostadm}"  # 預設使用 hostadm，可通過環境變數覆蓋
REMOTE_PATH="~/frontend_web"
FRONTEND_DIR="course-selection-frontend"
DIST_DIR="dist"

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}開始前端部署流程...${NC}"

# 1. 檢查前端目錄是否存在
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}錯誤：找不到前端目錄 $FRONTEND_DIR${NC}"
    exit 1
fi

# 2. 進入前端目錄並打包
echo -e "${YELLOW}步驟 1/3: 打包前端專案...${NC}"
cd "$FRONTEND_DIR"

# 檢查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未找到 node_modules，正在安裝依賴...${NC}"
    npm install
fi

# 執行打包
echo -e "${YELLOW}執行 npm run build...${NC}"
npm run build

# 檢查打包是否成功
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}錯誤：打包失敗，找不到 $DIST_DIR 目錄${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 打包完成${NC}"

# 3. 上傳到遠端伺服器
echo -e "${YELLOW}步驟 2/3: 上傳檔案到遠端伺服器...${NC}"
echo -e "${YELLOW}目標：${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}${NC}"

# 先創建遠端目錄（確保目錄存在）
echo -e "${YELLOW}創建遠端目錄...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_PATH}/dist"

# 使用 rsync 上傳（如果可用），否則使用 scp
if command -v rsync &> /dev/null; then
    echo -e "${YELLOW}使用 rsync 上傳...${NC}"
    rsync -avz --delete \
        --exclude '*.map' \
        "$DIST_DIR/" \
        "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/dist/"
else
    echo -e "${YELLOW}使用 scp 上傳...${NC}"
    # 上傳檔案
    scp -r "$DIST_DIR"/* "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/dist/"
fi

echo -e "${GREEN}✓ 上傳完成${NC}"

# 4. 設定遠端目錄權限
echo -e "${YELLOW}步驟 3/3: 設定遠端目錄權限...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "chmod -R 755 ${REMOTE_PATH}/dist"

echo -e "${GREEN}✓ 權限設定完成${NC}"

# 5. 提示更新 nginx 配置
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${YELLOW}請確保 nginx 配置已更新以服務前端靜態文件${NC}"
echo -e "${YELLOW}前端文件位置：${REMOTE_PATH}/dist${NC}"
echo -e "${GREEN}========================================${NC}"

