#!/bin/bash

# 生成測試用 token 和 URL 的腳本
# Token 格式：MD5(userId + 'nchu' + 年月日)

# 如果提供了用戶 ID，使用它；否則使用預設值
USER_ID="${1:-test_user}"

# 獲取當前日期（格式：YYYYMMDD）
DATE=$(date +%Y%m%d)

# 生成 token：MD5(userId + 'nchu' + 日期)
CONTENT="${USER_ID}nchu${DATE}"

# 使用不同的方法生成 MD5（根據系統可用的命令）
if command -v md5sum &> /dev/null; then
    TOKEN=$(echo -n "$CONTENT" | md5sum | awk '{print $1}')
elif command -v md5 &> /dev/null; then
    TOKEN=$(echo -n "$CONTENT" | md5 | awk '{print $1}')
elif command -v openssl &> /dev/null; then
    TOKEN=$(echo -n "$CONTENT" | openssl dgst -md5 | awk '{print $2}')
else
    echo "錯誤：找不到 MD5 工具（需要 md5sum、md5 或 openssl）"
    exit 1
fi

# 生成 URL
BASE_URL="https://140.120.3.145"
TEST_URL="${BASE_URL}/?user_id=${USER_ID}&token=${TOKEN}"

echo "=========================================="
echo "測試 Token 資訊"
echo "=========================================="
echo "用戶 ID: $USER_ID"
echo "日期: $DATE"
echo "Token 內容: $CONTENT"
echo "Token (MD5): $TOKEN"
echo ""
echo "測試 URL:"
echo "$TEST_URL"
echo ""
echo "=========================================="
echo "使用方式："
echo "1. 直接在瀏覽器訪問上面的 URL"
echo "2. 或使用 curl 測試："
echo "   curl \"$TEST_URL\""
echo ""
echo "注意：Token 每天會變更（基於日期）"
echo "如果後端驗證失敗，請確認後端也使用相同的算法"
echo "=========================================="









