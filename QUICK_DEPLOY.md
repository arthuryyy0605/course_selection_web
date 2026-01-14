# 快速部署指南

如果遇到 404 錯誤，請按照以下步驟操作：

## 步驟 1: 確認前端文件已部署

SSH 連接到伺服器並檢查：

```bash
ssh hostadm@140.120.3.145
ls -la ~/frontend_web/dist/
```

如果目錄不存在或為空，請先執行本地部署腳本：

```bash
./deploy.sh
```

## 步驟 2: 更新 Nginx 配置

### 方法 A: 使用遠端腳本（推薦）

1. 將 `update_nginx_remote.sh` 上傳到伺服器：
   ```bash
   scp update_nginx_remote.sh hostadm@140.120.3.145:~/
   ```

2. SSH 連接到伺服器並執行：
   ```bash
   ssh hostadm@140.120.3.145
   chmod +x ~/update_nginx_remote.sh
   ~/update_nginx_remote.sh
   ```

### 方法 B: 手動更新

1. SSH 連接到伺服器：
   ```bash
   ssh hostadm@140.120.3.145
   ```

2. 備份現有配置：
   ```bash
   sudo cp /etc/nginx/sites-available/course_selection_api /etc/nginx/sites-available/course_selection_api.backup
   ```

3. 編輯配置文件：
   ```bash
   sudo nano /etc/nginx/sites-available/course_selection_api
   ```

4. 找到根路徑配置（約在第 60 行）：
   ```nginx
   location / {
       return 404;
   }
   ```

5. 替換為以下配置：
   ```nginx
   # 根目錄：服務前端靜態文件
   root /home/hostadm/frontend_web/dist;
   index index.html;

   # 前端靜態文件服務
   location / {
       try_files $uri $uri/ /index.html;
       
       # 靜態資源緩存設置
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

6. 確保 `/api/` 配置在根路徑配置之前（應該已經存在）

7. 測試配置：
   ```bash
   sudo nginx -t
   ```

8. 如果測試通過，重新載入 nginx：
   ```bash
   sudo systemctl reload nginx
   ```

## 步驟 3: 驗證

訪問 `https://140.120.3.145/` 應該能看到前端頁面。

如果仍然出現 404，請檢查：

1. 前端文件是否存在：
   ```bash
   ls -la /home/hostadm/frontend_web/dist/index.html
   ```

2. 文件權限是否正確：
   ```bash
   chmod -R 755 /home/hostadm/frontend_web/dist
   ```

3. Nginx 錯誤日誌：
   ```bash
   sudo tail -f /var/log/nginx/course_selection_api_error.log
   ```









