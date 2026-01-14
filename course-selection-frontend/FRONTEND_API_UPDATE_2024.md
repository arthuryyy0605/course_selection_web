# 前端 API 更新指南 (2024)

## 📋 概述

本次更新包含兩個主要變更：

1. **課程識別欄位變更**：移除 `course_id`，改為明確傳送 `subj_no` 和 `ps_class_nbr`
2. **最相關科目功能**：新增最相關科目勾選功能

---

## ⚠️ Breaking Changes

### 1. 課程識別欄位變更

**所有使用 `course_id` 的地方都需要修改！**

#### 之前 (舊版)

```javascript
{
  "course_id": "CS101"  // 單一欄位
}
```

#### 現在 (新版)

```javascript
{
  "subj_no": "CS101",        // 課程代碼 (SUBJ_NO)
  "ps_class_nbr": "12345"    // 課程流水號 (PS_CLASS_NBR)
}
```

---

## 🔄 API 端點變更

### 1. POST /course-entries/single

**請求 Body 變更：**

```javascript
// ❌ 舊版 (不再支援)
{
  "course_id": "CS101",
  "academic_year": 113,
  "academic_term": 1,
  "sub_theme_code": "01",
  "indicator_value": "3",
  "week_numbers": [1, 2, 3],
  "user_id": "user123",
  "token": "xxx"
}

// ✅ 新版 (必須使用)
{
  "subj_no": "CS101",              // 改為 subj_no
  "ps_class_nbr": "12345",         // 新增 ps_class_nbr
  "academic_year": 113,
  "academic_term": 1,
  "sub_theme_code": "01",
  "indicator_value": "3",
  "week_numbers": [1, 2, 3],
  "is_most_relevant": false,       // 新增：是否為最相關科目
  "user_id": "user123",
  "token": "xxx"
}
```

### 2. POST /course-entries (批量創建)

**每個 entry 都需要包含 `subj_no` 和 `ps_class_nbr`：**

```javascript
// ✅ 新版
{
  "entries": [
    {
      "subj_no": "CS101",
      "ps_class_nbr": "12345",
      "academic_year": 113,
      "academic_term": 1,
      "sub_theme_code": "01",
      "indicator_value": "3",
      "week_numbers": [1, 2, 3],
      "is_most_relevant": false
    },
    {
      "subj_no": "CS101",
      "ps_class_nbr": "12345",
      "academic_year": 113,
      "academic_term": 1,
      "sub_theme_code": "02",
      "indicator_value": "2",
      "week_numbers": [1, 2],
      "is_most_relevant": true      // 標記為最相關
    }
  ],
  "user_id": "user123",
  "token": "xxx"
}
```

### 3. GET /courses/{course_id}/form-data/{academic_year}/{academic_term}

**新增 Query Parameter：**

```javascript
// ❌ 舊版
GET /courses/CS101/form-data/113/1

// ✅ 新版
GET /courses/CS101/form-data/113/1?ps_class_nbr=12345
```

**回應格式變更：**

```javascript
// ✅ 新版回應
{
  "course_id": "CS101",              // 仍保留 course_id (對應 subj_no)
  "ps_class_nbr": "12345",           // 新增
  "course_chinese_name": "程式設計",
  "course_english_name": "Programming",
  "academic_year": 113,
  "academic_term": 1,
  "themes": [
    {
      "theme_code": "A101",
      "theme_name": "聯合國全球永續發展目標",
      "fill_in_week_enabled": true,
      "scale_max": 3,
      "select_most_relevant_sub_theme_enabled": true,  // 新增：是否需要勾選最相關科目
      "sub_themes": [
        {
          "sub_theme_code": "01",
          "sub_theme_name": "消除貧窮",
          "current_value": "3",
          "week_numbers": [1, 2, 3],
          "is_most_relevant": false,  // 新增：是否為最相關科目
          "entry_id": 123
        }
      ]
    }
  ]
}
```

### 4. GET /course-entries/exists

**新增 Query Parameter：**

```javascript
// ❌ 舊版
GET /course-entries/exists?course_id=CS101&academic_year=113&academic_term=1

// ✅ 新版
GET /course-entries/exists?course_id=CS101&ps_class_nbr=12345&academic_year=113&academic_term=1
```

### 5. PUT /course-entries/{entry_id}

**請求 Body 變更：**

```javascript
// ✅ 新版
{
  "indicator_value": "4",
  "week_numbers": [1, 2, 3, 4],
  "is_most_relevant": true,  // 新增：可選，更新最相關標記
  "user_id": "user123",
  "token": "xxx"
}
```

### 6. POST /course-entries/copy

**請求 Body 變更：**

```javascript
// ✅ 新版
{
  "source_academic_year": 113,
  "source_academic_term": 1,
  "target_academic_year": 113,
  "target_academic_term": 2,
  "subj_no": "CS101",        // 改為 subj_no
  "ps_class_nbr": "12345",  // 新增 ps_class_nbr
  "user_id": "user123",
  "token": "xxx"
}
```

---

## 🆕 最相關科目功能

### 功能說明

當學年期主題設定中 `select_most_relevant_sub_theme_enabled = true` 時，該主題需要讓使用者勾選最相關的 sub_theme。

### 使用規則

1. **建立 course_entries 時**：

   - 如果主題設定需要勾選最相關科目（`select_most_relevant_sub_theme_enabled = true`）
   - 該批次中該主題下**必須**有至少一個 `is_most_relevant = true` 的記錄
   - 每個主題下**最多只能有一個** `is_most_relevant = true` 的記錄

2. **驗證邏輯**：
   - 如果主題需要勾選最相關科目，但沒有傳送 `is_most_relevant = true`，API 會回傳錯誤
   - 如果傳送多個 `is_most_relevant = true` 的記錄（同一主題下），API 會回傳錯誤

### 範例

```javascript
// 主題 A101 需要勾選最相關科目
// 正確：只有一個 is_most_relevant = true
{
  "entries": [
    {
      "subj_no": "CS101",
      "ps_class_nbr": "12345",
      "sub_theme_code": "01",
      "is_most_relevant": true,   // ✅ 標記為最相關
      ...
    },
    {
      "subj_no": "CS101",
      "ps_class_nbr": "12345",
      "sub_theme_code": "02",
      "is_most_relevant": false,  // ✅ 不是最相關
      ...
    }
  ]
}

// 錯誤：多個 is_most_relevant = true
{
  "entries": [
    {
      "sub_theme_code": "01",
      "is_most_relevant": true,   // ❌ 錯誤
      ...
    },
    {
      "sub_theme_code": "02",
      "is_most_relevant": true,   // ❌ 錯誤：同一主題下不能有多個
      ...
    }
  ]
}
```

---

## 📝 回應格式變更

### CourseEntryResponse

```javascript
// ✅ 新版
{
  "subj_no": "CS101",              // 改為 subj_no (不再使用 course_id)
  "ps_class_nbr": "12345",         // 新增
  "academic_year": 113,
  "academic_term": 1,
  "theme_code": "A101",
  "sub_theme_code": "01",
  "indicator_value": "3",
  "week_numbers": [1, 2, 3],
  "is_most_relevant": false,        // 新增
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

---

## 🔍 檢查清單

### 需要修改的地方

- [ ] 所有使用 `course_id` 的地方改為 `subj_no` 和 `ps_class_nbr`
- [ ] `POST /course-entries/single` 請求 body
- [ ] `POST /course-entries` 請求 body（每個 entry）
- [ ] `GET /courses/{course_id}/form-data/{academic_year}/{academic_term}` 加入 `ps_class_nbr` query parameter
- [ ] `GET /course-entries/exists` 加入 `ps_class_nbr` query parameter
- [ ] `POST /course-entries/copy` 請求 body
- [ ] 處理 `is_most_relevant` 欄位（顯示和傳送）
- [ ] 處理 `select_most_relevant_sub_theme_enabled` 欄位（顯示是否需要勾選最相關科目）
- [ ] 實作最相關科目驗證邏輯（確保每個主題只有一個最相關）

---

## 📌 重要提醒

1. **必須同時傳送 `subj_no` 和 `ps_class_nbr`**，不能只傳其中一個
2. **`is_most_relevant` 預設為 `false`**，只有需要標記為最相關時才設為 `true`
3. **最相關科目驗證**：如果主題需要勾選最相關科目，必須確保該主題下有一個且僅有一個 `is_most_relevant = true` 的記錄
4. **向後不相容**：此更新為 breaking change，舊版 API 不再支援

---

## 🆘 錯誤處理

### 常見錯誤訊息

1. **缺少 ps_class_nbr**

   ```
   錯誤：缺少必要參數 ps_class_nbr
   ```

2. **主題需要勾選最相關科目但未提供**

   ```
   錯誤：主題 'A101' 需要勾選最相關科目，但未提供 is_most_relevant=true
   ```

3. **同一主題下有多個最相關科目**
   ```
   錯誤：該課程在主題 'A101' 下已有其他最相關的 sub_theme，每個主題只能有一個最相關的 sub_theme
   ```

---

## 📚 相關文件

- 資料庫 Migration: `migrate_add_ps_class_nbr_and_most_relevant.sql`
- API Schema: `course_selection_api/schema/school_year_settings.py`
