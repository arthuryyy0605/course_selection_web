# 修復 500 Internal Server Error

出現 500 錯誤通常是因為 nginx 配置問題或文件權限問題。請按照以下步驟修復：

## 快速修復

### 方法 1: 使用診斷和修復腳本（推薦）

1. **上傳診斷腳本並執行**：
   ```bash
   scp diagnose_nginx.sh fix_nginx_500.sh hostadm@140.120.3.145:~/
   ssh hostadm@140.120.3.145 "chmod +x ~/diagnose_nginx.sh ~/fix_nginx_500.sh && ~/diagnose_nginx.sh"
   ```

2. **根據診斷結果修復**：
   ```bash
   ssh hostadm@140.120.3.145 "~/fix_nginx_500.sh"
   ```

### 方法 2: 手動診斷和修復

1. **SSH 連接到伺服器**：
   ```bash
   ssh hostadm@140.120.3.145
   ```

2. **檢查前端文件是否存在**：
   ```bash
   ls -la /home/hostadm/frontend_web/dist/
   ```
   
   如果目錄不存在或為空，請先執行部署：
   ```bash
   # 在本地執行
   ./deploy.sh
   ```

3. **檢查 nginx 錯誤日誌**：
   ```bash
   sudo tail -30 /var/log/nginx/course_selection_api_error.log
   ```
   
   常見錯誤：
   - `open() "/home/hostadm/frontend_web/dist/index.html" failed (13: Permission denied)`
     → 權限問題，執行：`chmod -R 755 /home/hostadm/frontend_web/dist`
   
   - `directory index of "/home/hostadm/frontend_web/dist/" is forbidden`
     → 缺少 index.html 或權限問題
   
   - `"root" directive is not allowed here`
     → nginx 配置語法錯誤

4. **檢查 nginx 配置語法**：
   ```bash
   sudo nginx -t
   ```

5. **檢查配置中的 root 設定**：
   ```bash
   sudo grep -A 10 "location / {" /etc/nginx/sites-available/course_selection_api
   ```
   
   應該看到類似：
   ```nginx
   root /home/hostadm/frontend_web/dist;
   index index.html;
   
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

6. **如果配置有問題，手動修復**：
   ```bash
   sudo nano /etc/nginx/sites-available/course_selection_api
   ```
   
   確保 HTTPS server 區塊中有：
   ```nginx
   # 在 location /api/ 之前
   root /home/hostadm/frontend_web/dist;
   index index.html;
   
   # API 配置
   location /api/ {
       ...
   }
   
   # 前端配置
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

7. **設定正確的權限**：
   ```bash
   chmod -R 755 /home/hostadm/frontend_web
   chmod -R 644 /home/hostadm/frontend_web/dist/*
   ```

8. **測試並重新載入**：
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

## 常見問題和解決方案

### 問題 1: Permission denied (13)

**原因**：nginx 用戶（通常是 www-data）無法讀取文件

**解決**：
```bash
# 設定目錄權限
chmod -R 755 /home/hostadm/frontend_web
chmod -R 644 /home/hostadm/frontend_web/dist/*

# 或者將目錄所有者改為 nginx 用戶
sudo chown -R www-data:www-data /home/hostadm/frontend_web/dist
```

### 問題 2: directory index is forbidden

**原因**：缺少 index.html 或目錄權限不足

**解決**：
```bash
# 確認 index.html 存在
ls -l /home/hostadm/frontend_web/dist/index.html

# 如果不存在，重新部署
./deploy.sh

# 設定權限
chmod 644 /home/hostadm/frontend_web/dist/index.html
```

### 問題 3: "root" directive is not allowed here

**原因**：root 指令放在了錯誤的位置

**解決**：確保 `root` 指令在 `server` 區塊內，而不是在 `location` 區塊內（除非是特定 location）

正確配置：
```nginx
server {
    root /home/hostadm/frontend_web/dist;  # 在 server 區塊內
    index index.html;
    
    location /api/ {
        # 這裡不需要 root
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 驗證修復

修復後，訪問 `https://140.120.3.145/` 應該能看到前端頁面。

如果仍有問題，請檢查：
1. nginx 錯誤日誌：`sudo tail -f /var/log/nginx/course_selection_api_error.log`
2. nginx 訪問日誌：`sudo tail -f /var/log/nginx/course_selection_api_access.log`









