<template>
  <div class="themes-container">
    <!-- 頁面標題區域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <el-icon class="title-icon">
              <Grid />
            </el-icon>
            主題管理
          </h1>
          <p class="page-subtitle">管理課程主題和相關設定</p>
        </div>
        <div class="header-buttons">
          <el-button type="warning" size="large" @click="showExportDialog = true" class="export-button">
            <el-icon>
              <Download />
            </el-icon>
            匯出課程資訊
          </el-button>
          <el-button type="primary" size="large" @click="showCreateDialog = true" class="add-button">
            <el-icon>
              <Plus />
            </el-icon>
            新增主題
          </el-button>
        </div>
      </div>
    </div>


    <!-- 主題列表 -->
    <el-card class="themes-card">
      <template #header>
        <div class="card-header">
          <div class="title-with-count">
            <span class="card-title">主題列表</span>
            <el-tag type="info" size="large" class="count-tag">{{ themes.length }} 個主題</el-tag>
          </div>
          <div class="header-actions">
            <el-input v-model="searchText" placeholder="搜尋主題..." class="search-input" clearable>
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <!-- 響應式表格 -->
      <div class="table-container">
        <el-table v-loading="loading" :data="filteredThemes" class="themes-table" stripe empty-text="暫無主題數據"
          :row-class-name="getRowClassName" style="width: 100%">
          <el-table-column prop="theme_code" label="主題代碼" min-width="120" align="center" header-align="center">
            <template #default="scope">
              <el-tag type="primary" size="small">{{ scope.row.theme_code }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="theme_name" label="主題名稱" min-width="200" align="center" header-align="center">
            <template #default="scope">
              <div class="name-text">{{ scope.row.theme_name }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="theme_short_name" label="主題簡稱" min-width="120" align="center" header-align="center">
            <template #default="scope">
              <el-tag size="small" class="short-name-tag">{{ scope.row.theme_short_name }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="theme_english_name" label="英文名稱" min-width="200" align="center" header-align="center">
            <template #default="scope">
              <span class="english-name">{{ scope.row.theme_english_name }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="chinese_link" label="中文連結" min-width="120" align="center" header-align="center">
            <template #default="scope">
              <el-link v-if="scope.row.chinese_link" :href="scope.row.chinese_link" target="_blank" type="primary">
                <el-icon>
                  <Link />
                </el-icon>
                連結
              </el-link>
              <span v-else class="no-link">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="english_link" label="英文連結" min-width="120" align="center" header-align="center">
            <template #default="scope">
              <el-link v-if="scope.row.english_link" :href="scope.row.english_link" target="_blank" type="success">
                <el-icon>
                  <Link />
                </el-icon>
                連結
              </el-link>
              <span v-else class="no-link">-</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" min-width="300" align="center" header-align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-button type="primary" size="default" @click="goToSubThemes(scope.row.theme_code)"
                  class="action-btn">
                  <el-icon>
                    <List />
                  </el-icon>
                  子主題
                </el-button>
                <el-button type="warning" size="default" @click="editTheme(scope.row)" class="action-btn">
                  <el-icon>
                    <Edit />
                  </el-icon>
                  編輯
                </el-button>
                <el-button type="danger" size="default" @click="deleteTheme(scope.row)" class="action-btn">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  刪除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 匯出課程資訊對話框 -->
    <el-dialog v-model="showExportDialog" title="匯出課程資訊" width="700px" @close="resetExportForm" class="export-dialog">
      <el-form :model="exportForm" label-width="120px" class="export-form">
        <!-- 學年期起 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="學年期起(學年)" required>
              <el-input-number v-model="exportForm.academic_year_start" :min="100" :max="200" placeholder="如：114"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="學年期起(學期)" required>
              <el-select v-model="exportForm.academic_term_start" placeholder="請選擇學期" style="width: 100%">
                <el-option label="第1學期" :value="1" />
                <el-option label="第2學期" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 學年期訖 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="學年期訖(學年)" required>
              <el-input-number v-model="exportForm.academic_year_end" :min="100" :max="200" placeholder="如：114"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="學年期訖(學期)" required>
              <el-select v-model="exportForm.academic_term_end" placeholder="請選擇學期" style="width: 100%">
                <el-option label="第1學期" :value="1" />
                <el-option label="第2學期" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 開課單位 -->
        <el-form-item label="開課單位">
          <el-input v-model="exportForm.department" placeholder="請輸入開課單位代碼（可選）" clearable style="width: 100%" />
        </el-form-item>

        <!-- 成班與否 -->
        <el-form-item label="成班與否">
          <el-select v-model="exportForm.has_class" placeholder="全部" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="已成班" value="Y" />
            <el-option label="未成班" value="N" />
          </el-select>
        </el-form-item>

        <!-- 主題名稱 -->
        <el-form-item label="主題名稱">
          <el-select v-model="exportForm.theme_code" placeholder="全部" clearable style="width: 100%"
            @change="onExportThemeChange">
            <el-option label="全部" value="" />
            <el-option v-for="theme in themes" :key="theme.theme_code" :label="theme.theme_name"
              :value="theme.theme_code" />
          </el-select>
        </el-form-item>

        <!-- 細項主題名稱 -->
        <el-form-item label="細項主題名稱">
          <el-select v-model="exportForm.sub_theme_code" placeholder="全部" clearable style="width: 100%"
            :disabled="!exportForm.theme_code">
            <el-option label="全部" value="" />
            <el-option v-for="subTheme in exportSubThemes" :key="subTheme.sub_theme_code"
              :label="subTheme.sub_theme_name" :value="subTheme.sub_theme_code" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showExportDialog = false">取消</el-button>
          <el-button type="primary" @click="exportCourseInfo" :loading="exporting"
            :disabled="!exportForm.academic_year_start || !exportForm.academic_term_start || !exportForm.academic_year_end || !exportForm.academic_term_end">
            匯出
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/編輯主題對話框 -->
    <el-dialog v-model="showCreateDialog" :title="editingTheme ? '編輯主題' : '新增主題'" width="600px" @close="resetForm"
      class="theme-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="theme-form">
        <el-form-item label="主題代碼" prop="theme_code">
          <el-input v-model="form.theme_code" placeholder="請輸入主題代碼" />
        </el-form-item>
        <el-form-item label="主題名稱" prop="theme_name">
          <el-input v-model="form.theme_name" placeholder="請輸入主題名稱" />
        </el-form-item>
        <el-form-item label="主題簡稱" prop="theme_short_name">
          <el-input v-model="form.theme_short_name" placeholder="請輸入主題簡稱" />
        </el-form-item>
        <el-form-item label="主題英文名稱" prop="theme_english_name">
          <el-input v-model="form.theme_english_name" placeholder="請輸入主題英文名稱" />
        </el-form-item>
        <el-form-item label="中文連結">
          <el-input v-model="form.chinese_link" placeholder="請輸入中文說明連結網址" />
        </el-form-item>
        <el-form-item label="英文連結">
          <el-input v-model="form.english_link" placeholder="請輸入英文說明連結網址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ editingTheme ? '更新' : '創建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Grid, Link, Search, List, Edit, Delete, Download } from '@element-plus/icons-vue'
import { getThemes, createTheme, updateTheme, deleteTheme as deleteThemeApi, type Theme, type ThemeCreateRequest } from '../api/themes'
import { getSubThemesByTheme, type SubTheme } from '../api/subThemes'
import { exportCourseInfoCSVWithFilters, type ExportCSVRequest } from '../api/schoolYears'

const router = useRouter()

// 響應式數據
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const showExportDialog = ref(false)
const exporting = ref(false)
const editingTheme = ref<Theme | null>(null)
const themes = ref<Theme[]>([])
const searchText = ref('')

// 表單數據
const form = reactive<ThemeCreateRequest>({
  theme_code: '',
  theme_name: '',
  theme_short_name: '',
  theme_english_name: '',
  chinese_link: '',
  english_link: ''
})

// 匯出表單數據
const exportForm = reactive<ExportCSVRequest & { department: string; has_class: string }>({
  academic_year_start: 114,
  academic_term_start: 1,
  academic_year_end: 114,
  academic_term_end: 1,
  department: '',
  has_class: '',
  theme_code: '',
  sub_theme_code: ''
})

// 匯出用的細項主題列表
const exportSubThemes = ref<SubTheme[]>([])

// 表單驗證規則
const rules: FormRules = {
  theme_code: [
    { required: true, message: '請輸入主題代碼', trigger: 'blur' }
  ],
  theme_name: [
    { required: true, message: '請輸入主題名稱', trigger: 'blur' }
  ],
  theme_short_name: [
    { required: true, message: '請輸入主題簡稱', trigger: 'blur' }
  ],
  theme_english_name: [
    { required: true, message: '請輸入主題英文名稱', trigger: 'blur' }
  ]
}

const formRef = ref<FormInstance>()

// 計算屬性
const filteredThemes = computed(() => {
  if (!searchText.value) return themes.value
  return themes.value.filter(theme =>
    theme.theme_name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    theme.theme_code.toLowerCase().includes(searchText.value.toLowerCase()) ||
    theme.theme_short_name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 獲取主題列表
const fetchThemes = async () => {
  try {
    loading.value = true
    const response = await getThemes()
    if (response && response.result && response.result.themes) {
      themes.value = response.result.themes
    } else {
      themes.value = []
    }
  } catch (error) {
    console.error('獲取主題列表失敗:', error)
    ElMessage.error('獲取主題列表失敗，請檢查後端服務是否正常運行')
    themes.value = []
  } finally {
    loading.value = false
  }
}

// 前往子主題管理頁面
const goToSubThemes = (themeCode: string) => {
  router.push(`/themes/${themeCode}/subtopics`)
}

// 編輯主題
const editTheme = (theme: Theme) => {
  editingTheme.value = theme
  Object.assign(form, {
    theme_code: theme.theme_code,
    theme_name: theme.theme_name,
    theme_short_name: theme.theme_short_name,
    theme_english_name: theme.theme_english_name,
    chinese_link: theme.chinese_link || '',
    english_link: theme.english_link || ''
  })
  showCreateDialog.value = true
}

// 刪除主題
const deleteTheme = async (theme: Theme) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除主題「${theme.theme_name}」嗎？`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteThemeApi(theme.id)
    ElMessage.success('刪除成功')
    fetchThemes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('刪除主題失敗:', error)
    }
  }
}

// 提交表單
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (editingTheme.value) {
      // 更新主題
      await updateTheme(editingTheme.value.id, {
        theme_code: form.theme_code,
        theme_name: form.theme_name,
        theme_short_name: form.theme_short_name,
        theme_english_name: form.theme_english_name,
        chinese_link: form.chinese_link || undefined,
        english_link: form.english_link || undefined
      })
      ElMessage.success('更新成功')
    } else {
      // 創建主題
      await createTheme(form)
      ElMessage.success('創建成功')
    }

    showCreateDialog.value = false
    fetchThemes()
  } catch (error) {
    console.error('提交失敗:', error)
  } finally {
    submitting.value = false
  }
}

// 重置表單
const resetForm = () => {
  editingTheme.value = null
  Object.assign(form, {
    theme_code: '',
    theme_name: '',
    theme_short_name: '',
    theme_english_name: '',
    chinese_link: '',
    english_link: ''
  })
  formRef.value?.clearValidate()
}

// 重置匯出表單
const resetExportForm = () => {
  exportForm.academic_year_start = 114
  exportForm.academic_term_start = 1
  exportForm.academic_year_end = 114
  exportForm.academic_term_end = 1
  exportForm.department = ''
  exportForm.has_class = ''
  exportForm.theme_code = ''
  exportForm.sub_theme_code = ''
  exportSubThemes.value = []
}

// 主題變更時載入對應的細項主題
const onExportThemeChange = async (themeCode: string) => {
  exportForm.sub_theme_code = '' // 重置細項主題選擇
  exportSubThemes.value = []
  
  if (!themeCode) return
  
  try {
    // 找到選擇的主題
    const selectedTheme = themes.value.find(t => t.theme_code === themeCode)
    if (!selectedTheme?.id) return
    
    const response = await getSubThemesByTheme(selectedTheme.id)
    exportSubThemes.value = response.result.sub_themes
  } catch (error) {
    console.error('獲取細項主題失敗:', error)
  }
}

// 匯出課程資訊
const exportCourseInfo = async () => {
  if (!exportForm.academic_year_start || !exportForm.academic_term_start || 
      !exportForm.academic_year_end || !exportForm.academic_term_end) {
    ElMessage.warning('請填寫學年期起訖')
    return
  }

  try {
    exporting.value = true
    
    const requestData: ExportCSVRequest = {
      academic_year_start: exportForm.academic_year_start,
      academic_term_start: exportForm.academic_term_start,
      academic_year_end: exportForm.academic_year_end,
      academic_term_end: exportForm.academic_term_end,
    }
    
    // 只添加非空的可選欄位
    if (exportForm.department) requestData.department = exportForm.department
    if (exportForm.has_class) requestData.has_class = exportForm.has_class
    if (exportForm.theme_code) requestData.theme_code = exportForm.theme_code
    if (exportForm.sub_theme_code) requestData.sub_theme_code = exportForm.sub_theme_code
    
    const blob = await exportCourseInfoCSVWithFilters(requestData)

    // 創建下載連結
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `課程資訊_${exportForm.academic_year_start}${exportForm.academic_term_start}_${exportForm.academic_year_end}${exportForm.academic_term_end}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('匯出成功')
    showExportDialog.value = false
  } catch (error) {
    console.error('匯出失敗:', error)
    const err = error as { message?: string; response?: { data?: { detail?: string; message?: string } } }
    const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || '匯出失敗'
    ElMessage.error(errorMessage)
  } finally {
    exporting.value = false
  }
}

// 表格行樣式
const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 1 ? 'table-row-light' : ''
}

// 組件掛載時獲取數據
onMounted(() => {
  fetchThemes()
})
</script>

<style scoped>
.themes-container {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 頁面標題區域 */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.title-icon {
  margin-right: 12px;
  font-size: 32px;
  color: #409eff;
}

.page-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 16px;
}

.header-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.export-button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

/* 主題列表卡片 */
.themes-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  width: 100%;
  overflow: visible;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-with-count {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.count-tag {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 300px;
}

/* 表格容器 */
.table-container {
  overflow-x: auto;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

.themes-table {
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  min-width: 1080px;
  /* stable min width for desktop (更多欄位 + 更大按鈕) */
}

.themes-table :deep(.el-table__header) {
  background: #f8f9fa;
}

.themes-table :deep(.el-table__header th) {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
}

.themes-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.themes-table :deep(.el-table__row:hover) {
  background: #f8f9fa;
  transform: scale(1.01);
}

.themes-table :deep(.table-row-light) {
  background: #fafbfc;
}

/* 主題名稱樣式 */
.name-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.short-name-tag {
  background: #e9ecef;
  color: #7f8c8d;
  border: none;
}

.english-name {
  color: #495057;
  font-style: italic;
}

/* 連結樣式 */
.no-link {
  color: #adb5bd;
  font-style: italic;
  font-size: 13px;
}

/* 操作按鈕 */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
}

.action-btn {
  border-radius: 6px;
  font-size: 14px;
  padding: 8px 14px;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 對話框樣式 */
.theme-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.theme-form {
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 響應式設計 */
@media (max-width: 1024px) {
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .search-input {
    width: 250px;
  }
}

/* Medium desktop safeguard: keep a stable table width between 1024–1279 */
@media (max-width: 1279px) and (min-width: 1024px) {
  .themes-table {
    min-width: 1000px;
  }
}

@media (max-width: 768px) {
  .themes-container {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .page-title {
    font-size: 24px;
  }

  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .themes-container {
    padding: 12px;
  }

  .page-title {
    font-size: 20px;
  }

}
</style>
