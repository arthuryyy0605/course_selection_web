# 前端 API 變更說明 - UUID ID 版本

## 概述

本次更新將所有 API 端點從使用 `theme_code` 和 `sub_theme_code` 作為路徑參數改為使用 UUID `id`。所有資料庫表格現在使用 UUID 作為主鍵，`theme_code` 和 `sub_theme_code` 變為可修改的顯示欄位。

**重要變更日期**: 2024-12-24

---

## 主要變更

### 1. 所有 Response 都包含 `id` 欄位

所有 API 回應現在都包含 `id` 欄位（UUID 格式），例如：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "theme_code": "A101",
  "theme_name": "聯合國全球永續發展目標",
  ...
}
```

### 2. 路徑參數從 CODE 改為 ID

所有單一資源操作（GET、PUT、DELETE）現在使用 `id` 作為路徑參數，而不是 `code`。

### 3. 移除所有向後兼容的 API

所有通過 `code` 操作的端點已被移除，統一使用 `id`。

---

## API 端點變更詳情

### 主題相關 API (`/api/themes/`)

#### ✅ 不變的端點

- `POST /api/themes/` - 創建主題
- `GET /api/themes/` - 獲取所有主題列表

#### 🔄 變更的端點

| 舊端點                            | 新端點                          | 變更說明                                       |
| --------------------------------- | ------------------------------- | ---------------------------------------------- |
| `GET /api/themes/{theme_code}`    | `GET /api/themes/{theme_id}`    | 路徑參數從 `theme_code` 改為 `theme_id` (UUID) |
| `PUT /api/themes/{theme_code}`    | `PUT /api/themes/{theme_id}`    | 路徑參數從 `theme_code` 改為 `theme_id` (UUID) |
| `DELETE /api/themes/{theme_code}` | `DELETE /api/themes/{theme_id}` | 路徑參數從 `theme_code` 改為 `theme_id` (UUID) |

#### ❌ 移除的端點

- 無（主題端點已全部使用 ID）

---

### 細項主題相關 API (`/api/sub_themes/`)

#### ✅ 不變的端點

- `POST /api/sub_themes/` - 創建細項主題
- `GET /api/sub_themes/` - 獲取所有細項主題列表

#### 🔄 變更的端點

| 舊端點                                                 | 新端點                                    | 變更說明                                       |
| ------------------------------------------------------ | ----------------------------------------- | ---------------------------------------------- |
| `GET /api/sub_themes/by_theme/{theme_code}`            | `GET /api/sub_themes/by_theme/{theme_id}` | 路徑參數從 `theme_code` 改為 `theme_id` (UUID) |
| `GET /api/sub_themes/{sub_theme_code}`                 | `GET /api/sub_themes/{sub_theme_id}`      | 新增：通過 ID 獲取單一細項主題                 |
| `PUT /api/sub_themes/{theme_code}/{sub_theme_code}`    | `PUT /api/sub_themes/{sub_theme_id}`      | 路徑參數簡化為單一 `sub_theme_id` (UUID)       |
| `DELETE /api/sub_themes/{theme_code}/{sub_theme_code}` | `DELETE /api/sub_themes/{sub_theme_id}`   | 路徑參數簡化為單一 `sub_theme_id` (UUID)       |

#### ❌ 移除的端點

- 無（細項主題端點已全部使用 ID）

---

### 學年期主題設定 API (`/api/school-year-theme-settings`)

#### ✅ 不變的端點

- `POST /api/school-year-theme-settings` - 創建學年期主題設定
- `GET /api/school-year-theme-settings/{academic_year}/{academic_term}` - 獲取學年期所有主題設定

#### 🔄 變更的端點

| 舊端點                                                                                | 新端點                                                | 變更說明                                         |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `GET /api/school-year-theme-settings/{academic_year}/{academic_term}/{theme_code}`    | `GET /api/school-year-theme-settings/{setting_id}`    | 改為使用設定 ID (UUID)，不再需要學年期和主題代碼 |
| `PUT /api/school-year-theme-settings/{academic_year}/{academic_term}/{theme_code}`    | `PUT /api/school-year-theme-settings/{setting_id}`    | 改為使用設定 ID (UUID)                           |
| `DELETE /api/school-year-theme-settings/{academic_year}/{academic_term}/{theme_code}` | `DELETE /api/school-year-theme-settings/{setting_id}` | 改為使用設定 ID (UUID)                           |

#### ❌ 移除的端點

- `GET /api/school-year-theme-settings/by-id/{setting_id}` - 已合併到主路徑
- 所有通過 `{academic_year}/{academic_term}/{theme_code}` 的端點

---

### 學年期細項主題設定 API (`/api/school-year-sub-theme-settings`)

#### ✅ 不變的端點

- `POST /api/school-year-sub-theme-settings` - 創建學年期細項設定

#### 🔄 變更的端點

| 舊端點                                                                                                     | 新端點                                                                               | 變更說明                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `GET /api/school-year-sub-theme-settings/{academic_year}/{academic_term}/{theme_code}`                     | `GET /api/school-year-sub-theme-settings/{academic_year}/{academic_term}/{theme_id}` | 路徑參數從 `theme_code` 改為 `theme_id` (UUID) |
| `GET /api/school-year-sub-theme-settings/by-id/{setting_id}`                                               | `GET /api/school-year-sub-theme-settings/{setting_id}`                               | 移除 `/by-id` 前綴                             |
| `PUT /api/school-year-sub-theme-settings/by-id/{setting_id}`                                               | `PUT /api/school-year-sub-theme-settings/{setting_id}`                               | 移除 `/by-id` 前綴                             |
| `PUT /api/school-year-sub-theme-settings/{academic_year}/{academic_term}/{theme_code}/{sub_theme_code}`    | `PUT /api/school-year-sub-theme-settings/{setting_id}`                               | 改為使用設定 ID (UUID)                         |
| `DELETE /api/school-year-sub-theme-settings/by-id/{setting_id}`                                            | `DELETE /api/school-year-sub-theme-settings/{setting_id}`                            | 移除 `/by-id` 前綴                             |
| `DELETE /api/school-year-sub-theme-settings/{academic_year}/{academic_term}/{theme_code}/{sub_theme_code}` | `DELETE /api/school-year-sub-theme-settings/{setting_id}`                            | 改為使用設定 ID (UUID)                         |

#### ❌ 移除的端點

- 所有通過 `{academic_year}/{academic_term}/{theme_code}/{sub_theme_code}` 的端點

---

### 課程相關 API (`/api/course-entries`)

#### 🔄 變更的端點

| 舊端點                                  | 新端點                                  | 變更說明                                     |
| --------------------------------------- | --------------------------------------- | -------------------------------------------- |
| `PUT /api/course-entries/{entry_id}`    | `PUT /api/course-entries/{entry_id}`    | `entry_id` 類型從 `int` 改為 `string` (UUID) |
| `DELETE /api/course-entries/{entry_id}` | `DELETE /api/course-entries/{entry_id}` | `entry_id` 類型從 `int` 改為 `string` (UUID) |

#### 🔄 變更的端點（查詢）

| 舊端點                                                                                                          | 新端點                                                                                                      | 變更說明                                                                             |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /api/school-years/{academic_year}/{academic_term}/themes/{theme_code}/sub-themes/{sub_theme_code}/courses` | `GET /api/school-years/{academic_year}/{academic_term}/themes/{theme_id}/sub-themes/{sub_theme_id}/courses` | 路徑參數從 `theme_code` 和 `sub_theme_code` 改為 `theme_id` 和 `sub_theme_id` (UUID) |

---

## Response 資料結構變更

### 主題 Response

**新增欄位**:

- `id: string` - 主題 ID (UUID)

**保留欄位**:

- `theme_code: string` - 主題代碼（可修改）
- `theme_name: string` - 主題名稱
- 其他欄位不變

**範例**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "theme_code": "A101",
  "theme_name": "聯合國全球永續發展目標",
  "theme_short_name": "SDGs",
  "theme_english_name": "SDGs",
  "chinese_link": "https://globalgoals.tw/",
  "english_link": null,
  "created_at": "2024-12-24T10:00:00",
  "updated_at": "2024-12-24T10:00:00",
  "created_by": "user123",
  "updated_by": "user123"
}
```

### 細項主題 Response

**新增欄位**:

- `id: string` - 細項主題 ID (UUID)
- `coures_themes_id: string` - 主題 ID (UUID)

**保留欄位**:

- `theme_code: string` - 主題代碼（可修改）
- `sub_theme_code: string` - 細項主題代碼（可修改）
- 其他欄位不變

**範例**:

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "coures_themes_id": "550e8400-e29b-41d4-a716-446655440000",
  "theme_code": "A101",
  "sub_theme_code": "01",
  "sub_theme_name": "消除貧窮",
  "sub_theme_english_name": "No Poverty",
  ...
}
```

### 學年期主題設定 Response

**新增欄位**:

- `id: string` - 設定 ID (UUID)
- `coures_themes_id: string` - 主題 ID (UUID)
- `theme_id: string` - 主題 ID (UUID，與 coures_themes_id 相同)

**保留欄位**:

- `theme_code: string` - 主題代碼（顯示用）
- 其他欄位不變

### 學年期細項主題設定 Response

**新增欄位**:

- `id: string` - 設定 ID (UUID)
- `coures_sub_themes_id: string` - 細項主題 ID (UUID)
- `sub_theme_id: string` - 細項主題 ID (UUID，與 coures_sub_themes_id 相同)
- `coures_themes_id: string` - 主題 ID (UUID)

**保留欄位**:

- `theme_code: string` - 主題代碼（顯示用）
- `sub_theme_code: string` - 細項主題代碼（顯示用）
- 其他欄位不變

### 課程填寫記錄 Response

**新增欄位**:

- `id: string` - 記錄 ID (UUID，從 `int` 改為 `string`)
- `coures_sub_themes_id: string` - 細項主題 ID (UUID)
- `sub_theme_id: string` - 細項主題 ID (UUID)

**保留欄位**:

- `theme_code: string` - 主題代碼（顯示用）
- `sub_theme_code: string` - 細項主題代碼（顯示用）
- 其他欄位不變

---

## 前端需要修改的地方

### 1. 路徑參數修改

#### 主題操作

```javascript
// ❌ 舊方式
GET /api/themes/A101
PUT /api/themes/A101
DELETE /api/themes/A101

// ✅ 新方式
GET /api/themes/550e8400-e29b-41d4-a716-446655440000
PUT /api/themes/550e8400-e29b-41d4-a716-446655440000
DELETE /api/themes/550e8400-e29b-41d4-a716-446655440000
```

#### 細項主題操作

```javascript
// ❌ 舊方式
GET /api/sub_themes/by_theme/A101
PUT /api/sub_themes/A101/01
DELETE /api/sub_themes/A101/01

// ✅ 新方式
GET /api/sub_themes/by_theme/550e8400-e29b-41d4-a716-446655440000
PUT /api/sub_themes/660e8400-e29b-41d4-a716-446655440001
DELETE /api/sub_themes/660e8400-e29b-41d4-a716-446655440001
```

#### 學年期主題設定操作

```javascript
// ❌ 舊方式
GET /api/school-year-theme-settings/113/2/A101
PUT /api/school-year-theme-settings/113/2/A101
DELETE /api/school-year-theme-settings/113/2/A101

// ✅ 新方式
GET /api/school-year-theme-settings/770e8400-e29b-41d4-a716-446655440002
PUT /api/school-year-theme-settings/770e8400-e29b-41d4-a716-446655440002
DELETE /api/school-year-theme-settings/770e8400-e29b-41d4-a716-446655440002
```

#### 學年期細項主題設定操作

```javascript
// ❌ 舊方式
GET /api/school-year-sub-theme-settings/113/2/A101
PUT /api/school-year-sub-theme-settings/113/2/A101/01
DELETE /api/school-year-sub-theme-settings/113/2/A101/01

// ✅ 新方式
GET /api/school-year-sub-theme-settings/113/2/550e8400-e29b-41d4-a716-446655440000
PUT /api/school-year-sub-theme-settings/880e8400-e29b-41d4-a716-446655440003
DELETE /api/school-year-sub-theme-settings/880e8400-e29b-41d4-a716-446655440003
```

### 2. 資料結構修改

#### 儲存 ID 而非 CODE

```javascript
// ❌ 舊方式：使用 theme_code 作為識別符
const themeCode = "A101";
fetch(`/api/themes/${themeCode}`);

// ✅ 新方式：使用 id 作為識別符
const themeId = "550e8400-e29b-41d4-a716-446655440000";
fetch(`/api/themes/${themeId}`);
```

#### 從 Response 中提取 ID

```javascript
// ✅ 從 API 回應中提取 ID
const response = await fetch("/api/themes/");
const data = await response.json();
const themes = data.result.themes;

// 使用 id 進行後續操作
themes.forEach((theme) => {
  const themeId = theme.id; // UUID
  const themeCode = theme.theme_code; // 顯示用
  // 使用 themeId 進行操作
});
```

### 3. 狀態管理修改

#### 使用 ID 作為鍵值

```javascript
// ❌ 舊方式：使用 theme_code 作為鍵
const themeMap = {};
themes.forEach((theme) => {
  themeMap[theme.theme_code] = theme;
});

// ✅ 新方式：使用 id 作為鍵
const themeMap = {};
themes.forEach((theme) => {
  themeMap[theme.id] = theme;
});
```

### 4. 路由修改

#### React Router 範例

```javascript
// ❌ 舊方式
<Route path="/themes/:themeCode" component={ThemeDetail} />
<Route path="/sub-themes/:themeCode/:subThemeCode" component={SubThemeDetail} />

// ✅ 新方式
<Route path="/themes/:themeId" component={ThemeDetail} />
<Route path="/sub-themes/:subThemeId" component={SubThemeDetail} />
```

### 5. 表單提交修改

#### 創建/更新操作

```javascript
// ✅ 創建主題（不變）
const createTheme = async (data) => {
  await fetch("/api/themes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// ✅ 更新主題（使用 id）
const updateTheme = async (themeId, data) => {
  await fetch(`/api/themes/${themeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
```

---

## 遷移步驟建議

### 步驟 1: 更新 API 調用

1. 搜尋所有使用舊端點的地方
2. 將路徑參數從 `code` 改為 `id`
3. 確保從 API 回應中提取 `id` 欄位

### 步驟 2: 更新資料結構

1. 將所有使用 `theme_code` 或 `sub_theme_code` 作為識別符的地方改為使用 `id`
2. 保留 `code` 欄位用於顯示

### 步驟 3: 更新狀態管理

1. 將 Redux/Vuex 等狀態管理中的鍵值從 `code` 改為 `id`
2. 更新所有相關的 reducer/action

### 步驟 4: 測試

1. 測試所有 CRUD 操作
2. 確認所有列表和詳情頁面正常顯示
3. 確認所有表單提交正常運作

---

## 常見問題

### Q1: 如何從 theme_code 獲取 theme_id？

**A**: 需要先調用 `GET /api/themes/` 獲取所有主題，然後根據 `theme_code` 找到對應的 `id`。或者，如果已經有主題列表，可以直接使用。

```javascript
// 範例：根據 theme_code 查找 theme_id
const themes = await fetch("/api/themes/").then((r) => r.json());
const theme = themes.result.themes.find((t) => t.theme_code === "A101");
const themeId = theme.id;
```

### Q2: 創建主題時還需要提供 theme_code 嗎？

**A**: 是的，創建主題時仍然需要提供 `theme_code`，因為它是顯示欄位。但創建後會返回包含 `id` 的完整資料。

### Q3: 可以修改 theme_code 嗎？

**A**: 可以，`theme_code` 現在是可修改的欄位。更新主題時可以修改 `theme_code`。

### Q4: entry_id 從 int 改為 string，需要特別處理嗎？

**A**: 是的，確保所有使用 `entry_id` 的地方都改為 string 類型，而不是 number。

```javascript
// ❌ 舊方式
const entryId = 12345;

// ✅ 新方式
const entryId = "550e8400-e29b-41d4-a716-446655440000";
```

---

## 完整 API 端點列表

### 主題 API

- `POST /api/themes/` - 創建主題
- `GET /api/themes/` - 獲取所有主題
- `GET /api/themes/{theme_id}` - 獲取單一主題（新增）
- `PUT /api/themes/{theme_id}` - 更新主題
- `DELETE /api/themes/{theme_id}` - 刪除主題

### 細項主題 API

- `POST /api/sub_themes/` - 創建細項主題
- `GET /api/sub_themes/` - 獲取所有細項主題
- `GET /api/sub_themes/by_theme/{theme_id}` - 根據主題 ID 獲取細項主題列表
- `GET /api/sub_themes/{sub_theme_id}` - 獲取單一細項主題（新增）
- `PUT /api/sub_themes/{sub_theme_id}` - 更新細項主題
- `DELETE /api/sub_themes/{sub_theme_id}` - 刪除細項主題

### 學年期主題設定 API

- `POST /api/school-year-theme-settings` - 創建學年期主題設定
- `GET /api/school-year-theme-settings/{setting_id}` - 獲取單一設定
- `GET /api/school-year-theme-settings/{academic_year}/{academic_term}` - 獲取學年期所有設定
- `PUT /api/school-year-theme-settings/{setting_id}` - 更新設定
- `DELETE /api/school-year-theme-settings/{setting_id}` - 刪除設定

### 學年期細項主題設定 API

- `POST /api/school-year-sub-theme-settings` - 創建學年期細項設定
- `GET /api/school-year-sub-theme-settings/{setting_id}` - 獲取單一設定
- `GET /api/school-year-sub-theme-settings/{academic_year}/{academic_term}/{theme_id}` - 獲取主題下所有細項設定
- `PUT /api/school-year-sub-theme-settings/{setting_id}` - 更新設定
- `DELETE /api/school-year-sub-theme-settings/{setting_id}` - 刪除設定

### 課程相關 API

- `POST /api/course-entries` - 批量創建課程填寫記錄
- `POST /api/course-entries/single` - 創建單一課程填寫記錄
- `PUT /api/course-entries/{entry_id}` - 更新課程填寫記錄（entry_id 改為 string）
- `DELETE /api/course-entries/{entry_id}` - 刪除課程填寫記錄（entry_id 改為 string）
- `GET /api/school-years/{academic_year}/{academic_term}/themes/{theme_id}/sub-themes/{sub_theme_id}/courses` - 查詢已填寫指定細項的課程列表

---

## 聯絡資訊

如有任何問題，請聯繫後端開發團隊。

**最後更新**: 2024-12-24
