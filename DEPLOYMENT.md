# 前端部署指南

本指南說明如何將前端專案打包並部署到 `140.120.3.145` 伺服器。

## 前置需求

1. 已安裝 Node.js (版本 20.19+ 或 22.12+)
2. 已安裝 npm
3. 已配置 SSH 連接到遠端伺服器
4. 遠端伺服器已安裝 nginx

## 部署步驟

### 方法一：使用自動部署腳本（推薦）

1. **設定環境變數（可選）**：
   ```bash
   export REMOTE_USER=hostadm  # 預設為 hostadm，可通過環境變數覆蓋
   ```

2. **執行部署腳本**：
   ```bash
   ./deploy.sh
   ```

   腳本會自動：
   - 打包前端專案
   - 上傳到遠端伺服器 `~/frontend_web/dist`
   - 設定正確的目錄權限

3. **更新 nginx 配置**：
   ```bash
   ./nginx_config_update.sh
   ```

   或手動更新（見方法二）

### 方法二：手動部署

#### 1. 打包前端

```bash
cd course-selection-frontend
npm install  # 如果尚未安裝依賴
npm run build
```

打包產物會生成在 `dist/` 目錄。

#### 2. 上傳到遠端伺服器

```bash
# 使用 rsync（推薦）
rsync -avz --delete dist/ hostadm@140.120.3.145:~/frontend_web/dist/

# 或使用 scp
scp -r dist/* hostadm@140.120.3.145:~/frontend_web/dist/
```

#### 3. 設定遠端目錄權限

```bash
ssh hostadm@140.120.3.145 "chmod -R 755 ~/frontend_web/dist"
```

#### 4. 更新 nginx 配置

請參考 `nginx_config_manual.txt` 文件中的詳細說明，或執行：

```bash
./nginx_config_update.sh
```

## Nginx 配置要點

1. **前端靜態文件路徑**：`~/frontend_web/dist`（需要轉換為絕對路徑）
2. **API 代理**：`/api/` 路徑必須在根路徑配置之前
3. **Vue Router history 模式**：需要 `try_files $uri $uri/ /index.html;`
4. **靜態資源緩存**：已配置為 1 年，提升性能

## 驗證部署

部署完成後，請驗證：

1. **前端頁面**：訪問 `https://140.120.3.145/` 應該能看到前端頁面
2. **API 請求**：前端應能正常調用 `https://140.120.3.145/api/` 下的 API
3. **路由**：直接訪問子路由（如 `https://140.120.3.145/themes`）應該能正常顯示

## 故障排除

### 問題：前端頁面顯示 404

- 檢查 nginx 配置中的 `root` 路徑是否正確
- 確認 `try_files` 配置存在
- 檢查文件權限：`ls -la ~/frontend_web/dist`

### 問題：API 請求失敗

- 確認 `/api/` 配置在根路徑之前
- 檢查後端服務是否運行：`curl http://127.0.0.1:8000/health`
- 查看 nginx 錯誤日誌：`sudo tail -f /var/log/nginx/course_selection_api_error.log`

### 問題：靜態資源無法載入

- 檢查文件是否存在
- 確認 nginx 配置中的靜態資源路徑正確
- 清除瀏覽器緩存

## 回滾

如果需要回滾到之前的配置：

```bash
ssh hostadm@140.120.3.145
sudo cp /etc/nginx/sites-available/course_selection_api.backup.* /etc/nginx/sites-available/course_selection_api
sudo nginx -t
sudo systemctl reload nginx
```

## 相關文件

- `deploy.sh` - 自動部署腳本
- `nginx_config_update.sh` - Nginx 配置自動更新腳本
- `nginx_config_manual.txt` - Nginx 配置手動更新指南

