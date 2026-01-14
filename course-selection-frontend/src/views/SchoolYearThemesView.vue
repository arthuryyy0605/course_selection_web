<template>
  <div class="school-year-themes-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>學年期主題設定</span>
        </div>
      </template>

      <!-- 查詢區域 -->
      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="學年">
          <el-input-number v-model="queryForm.academic_year" :min="100" :max="200" placeholder="請輸入學年，如：113"
            style="width: 180px" />
        </el-form-item>
        <el-form-item label="學期">
          <el-select v-model="queryForm.academic_term" placeholder="請選擇學期" style="width: 120px">
            <el-option label="第1學期" :value="1" />
            <el-option label="第2學期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSettings" :loading="loading">
            <el-icon>
              <Search />
            </el-icon>
            查詢
          </el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按鈕 -->
      <div class="action-buttons">
        <el-button type="primary" @click="showCreateDialog = true"
          :disabled="!queryForm.academic_year || !queryForm.academic_term">
          <el-icon>
            <Plus />
          </el-icon>
          新增設定
        </el-button>
        <el-button type="info" @click="showBatchCreateDialog = true">
          <el-icon>
            <Plus />
          </el-icon>
          批次建立
        </el-button>
        <el-button type="success" @click="openCopyDialog"
          :disabled="!queryForm.academic_year || !queryForm.academic_term">
          <el-icon>
            <DocumentCopy />
          </el-icon>
          複製設定
        </el-button>
        <el-button type="warning" @click="exportCourseInfo"
          :disabled="!queryForm.academic_year || !queryForm.academic_term" :loading="exporting">
          <el-icon>
            <Download />
          </el-icon>
          匯出課程資訊
        </el-button>
      </div>

      <!-- 設定列表 -->
      <el-table v-loading="loading" :data="settings" style="width: 100%; margin-top: 20px" stripe>
        <el-table-column prop="academic_year" label="學年" width="100" />
        <el-table-column prop="academic_term" label="學期" width="100">
          <template #default="scope">
            第{{ scope.row.academic_term }}學期
          </template>
        </el-table-column>
        <el-table-column prop="theme_code" label="主題代碼" width="120" />
        <el-table-column prop="theme_name" label="主題名稱" min-width="200" />
        <el-table-column prop="fill_in_week_enabled" label="啟用週次填寫" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.fill_in_week_enabled ? 'success' : 'danger'">
              {{ scope.row.fill_in_week_enabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scale_max" label="指標數量" width="100" />
        <el-table-column prop="select_most_relevant_sub_theme_enabled" label="需要勾選最相關科目" width="150">
          <template #default="scope">
            <el-tag :type="scope.row.select_most_relevant_sub_theme_enabled ? 'success' : 'info'">
              {{ scope.row.select_most_relevant_sub_theme_enabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380" fixed="right">
          <template #default="scope">
            <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: nowrap;">
              <el-button type="primary" size="small" @click="goToSubThemeSettings(scope.row)">
                管理子主題設定
              </el-button>
              <el-button type="warning" size="small" @click="editSetting(scope.row)">
                編輯
              </el-button>
              <el-button type="danger" size="small" @click="deleteSetting(scope.row)">
                刪除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空狀態 -->
      <el-empty v-if="!loading && settings.length === 0 && queryForm.academic_year && queryForm.academic_term"
        description="該學年期暫無主題設定" />
    </el-card>

    <!-- 新增/編輯設定對話框 -->
    <el-dialog v-model="showCreateDialog" :title="editingSetting ? '編輯學年期主題設定' : '新增學年期主題設定'" width="600px"
      @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="學年" prop="academic_year">
          <el-input-number v-model="form.academic_year" :disabled="!!editingSetting" :min="100" :max="200"
            placeholder="請輸入學年，如：113" style="width: 100%" />
        </el-form-item>
        <el-form-item label="學期" prop="academic_term">
          <el-select v-model="form.academic_term" :disabled="!!editingSetting" placeholder="請選擇學期" style="width: 100%">
            <el-option label="第1學期" :value="1" />
            <el-option label="第2學期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="主題" prop="theme_code">
          <el-select v-model="form.theme_code" :disabled="!!editingSetting" placeholder="請選擇主題" style="width: 100%">
            <el-option v-for="theme in availableThemes" :key="theme.theme_code"
              :label="`${theme.theme_code} - ${theme.theme_name}`" :value="theme.theme_code" />
          </el-select>
        </el-form-item>
        <el-form-item label="啟用週次填寫" prop="fill_in_week_enabled">
          <el-switch v-model="form.fill_in_week_enabled" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="指標數量" prop="scale_max">
          <el-input-number v-model="form.scale_max" :min="1" :max="10" placeholder="請輸入指標數量" style="width: 100%" />
        </el-form-item>
        <el-form-item label="需要勾選最相關科目" prop="select_most_relevant_sub_theme_enabled">
          <el-switch v-model="form.select_most_relevant_sub_theme_enabled" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ editingSetting ? '更新' : '創建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 複製設定對話框 -->
    <el-dialog v-model="showCopyDialog" title="複製學年期主題設定" width="800px" @close="resetCopyDialog">
      <div class="copy-dialog-content">
        <!-- 目標學年期選擇 -->
        <el-card class="target-info-card" shadow="never">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon class="header-icon">
                <Aim />
              </el-icon>
              <span>目標學年期</span>
            </div>
          </template>

          <el-form :model="copyTarget" label-width="100px" class="copy-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="學年">
                  <el-input-number v-model="copyTarget.academic_year" :min="100" :max="200" placeholder="請輸入學年，如：113"
                    style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="學期">
                  <el-select v-model="copyTarget.academic_term" placeholder="請選擇學期" style="width: 100%">
                    <el-option label="第1學期" :value="1" />
                    <el-option label="第2學期" :value="2" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 來源學年期選擇和設定 -->
        <el-card class="source-card" shadow="never">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon class="header-icon">
                <DocumentCopy />
              </el-icon>
              <span>來源學年期</span>
            </div>
          </template>

          <el-form :model="copySource" label-width="100px" class="copy-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="學年">
                  <el-input-number v-model="copySource.academic_year" :min="100" :max="200" placeholder="請輸入學年，如：113"
                    style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="學期">
                  <el-select v-model="copySource.academic_term" placeholder="請選擇學期" style="width: 100%">
                    <el-option label="第1學期" :value="1" />
                    <el-option label="第2學期" :value="2" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item>
              <el-button type="primary" @click="loadSourceSettings" :loading="loadingSource"
                :disabled="!copySource.academic_year || !copySource.academic_term" size="default">
                <el-icon>
                  <Refresh />
                </el-icon>
                載入設定
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 來源設定顯示區域 -->
          <div v-loading="loadingSource" class="settings-display">
            <div v-if="sourceInfo">
              <el-descriptions :column="3" border size="default" class="summary-descriptions">
                <el-descriptions-item label="總主題數">
                  <span class="stat-value">{{ sourceInfo.summary.total_themes }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="總子主題數">
                  <span class="stat-value">{{ sourceInfo.summary.total_sub_themes }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="啟用子主題數">
                  <span class="stat-value">{{ sourceInfo.summary.enabled_sub_themes }}</span>
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="sourceInfo.themes && sourceInfo.themes.length > 0" class="themes-container">
                <el-collapse v-model="activeThemeCollapse" accordion>
                  <el-collapse-item v-for="theme in sourceInfo.themes" :key="theme.theme_code" :name="theme.theme_code">
                    <template #title>
                      <div class="theme-title">
                        <el-icon class="theme-icon">
                          <FolderOpened />
                        </el-icon>
                        <span class="theme-code">{{ theme.theme_code }}</span>
                        <span class="theme-name">{{ theme.theme_name }}</span>
                      </div>
                    </template>
                    <div class="theme-details">
                      <el-descriptions :column="2" border size="small" class="theme-info">
                        <el-descriptions-item label="啟用週次填寫">
                          <el-tag :type="theme.fill_in_week_enabled ? 'success' : 'danger'" size="default">
                            {{ theme.fill_in_week_enabled ? '是' : '否' }}
                          </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="指標數量">
                          <span class="scale-value">{{ theme.scale_max }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="需要勾選最相關科目">
                          <el-tag :type="theme.select_most_relevant_sub_theme_enabled ? 'success' : 'info'"
                            size="default">
                            {{ theme.select_most_relevant_sub_theme_enabled ? '是' : '否' }}
                          </el-tag>
                        </el-descriptions-item>
                      </el-descriptions>
                      <div class="sub-themes-list">
                        <div class="sub-themes-title">
                          <el-icon>
                            <List />
                          </el-icon>
                          子主題列表（{{ theme.sub_themes.length }} 個）
                        </div>
                        <div class="sub-themes-tags">
                          <el-tag v-for="subTheme in theme.sub_themes" :key="subTheme.sub_theme_code"
                            :type="subTheme.enabled ? 'primary' : 'info'" size="default" class="sub-theme-tag">
                            {{ subTheme.sub_theme_code }} - {{ subTheme.sub_theme_name }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
              <el-empty v-else description="該學年期暫無主題設定" :image-size="100" />
            </div>
            <div v-else-if="!loadingSource" class="empty-hint">
              <el-icon class="empty-icon">
                <Document />
              </el-icon>
              <p>請選擇來源學年期並點擊「載入設定」</p>
            </div>
          </div>
        </el-card>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCopyDialog = false">取消</el-button>
          <el-button type="primary" @click="copySettings" :loading="copying"
            :disabled="!sourceInfo || !copyTarget.academic_year || !copyTarget.academic_term" size="default">
            <el-icon>
              <Check />
            </el-icon>
            確定複製
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批次建立對話框 -->
    <el-dialog v-model="showBatchCreateDialog" title="批次建立學年期主題設定" width="800px" @close="resetBatchForm">
      <el-form ref="batchFormRef" :model="batchForm" :rules="batchRules" label-width="140px">
        <el-card class="batch-form-card" shadow="never">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon class="header-icon">
                <Calendar />
              </el-icon>
              <span>學年期設定</span>
            </div>
          </template>
          <el-form-item label="起始學年" prop="start_year">
            <el-input-number v-model="batchForm.start_year" :min="100" :max="200" placeholder="請輸入起始學年"
              style="width: 100%" />
          </el-form-item>
          <el-form-item label="結束學年" prop="end_year">
            <el-input-number v-model="batchForm.end_year" :min="100" :max="200" placeholder="請輸入結束學年"
              style="width: 100%" />
          </el-form-item>
          <el-form-item label="學期" prop="academic_terms">
            <el-checkbox-group v-model="batchForm.academic_terms">
              <el-checkbox :label="1">第1學期</el-checkbox>
              <el-checkbox :label="2">第2學期</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-card>

        <el-card class="batch-form-card" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon class="header-icon">
                <Collection />
              </el-icon>
              <span>主題選擇</span>
            </div>
          </template>
          <el-form-item prop="selected_themes">
            <div class="theme-selector">
              <div style="margin-bottom: 12px;">
                <el-button size="small" @click="selectAllThemes">全選</el-button>
                <el-button size="small" @click="clearAllThemes">清除</el-button>
              </div>
              <el-checkbox-group v-model="batchForm.selected_themes" class="theme-checkbox-group">
                <el-checkbox v-for="theme in themes" :key="theme.theme_code" :label="theme.theme_code"
                  class="theme-checkbox">
                  <span class="theme-label">{{ theme.theme_code }} - {{ theme.theme_name }}</span>
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-form-item>
        </el-card>

        <el-card class="batch-form-card" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon class="header-icon">
                <Setting />
              </el-icon>
              <span>預設設定</span>
            </div>
          </template>
          <el-form-item label="啟用週次填寫">
            <el-switch v-model="batchForm.fill_in_week_enabled" active-text="是" inactive-text="否" />
          </el-form-item>
          <el-form-item label="指標數量" prop="scale_max">
            <el-input-number v-model="batchForm.scale_max" :min="1" :max="10" placeholder="請輸入指標數量"
              style="width: 100%" />
          </el-form-item>
          <el-form-item label="需要勾選最相關科目">
            <el-switch v-model="batchForm.select_most_relevant_sub_theme_enabled" active-text="是" inactive-text="否" />
          </el-form-item>
        </el-card>

        <el-alert v-if="batchFormPreview.length > 0" type="info" :closable="false" style="margin-top: 20px;">
          <template #title>
            <div>
              <strong>預覽：將建立 {{ batchFormPreview.length }} 筆設定</strong>
              <div style="margin-top: 8px; font-size: 12px; max-height: 150px; overflow-y: auto;">
                <div v-for="(item, index) in batchFormPreview.slice(0, 20)" :key="index" style="margin: 4px 0;">
                  • 學年 {{ item.academic_year }} - 第{{ item.academic_term }}學期 - {{ item.theme_code }}
                </div>
                <div v-if="batchFormPreview.length > 20" style="color: #909399; margin-top: 4px;">
                  ... 還有 {{ batchFormPreview.length - 20 }} 筆
                </div>
              </div>
            </div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBatchCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitBatchForm" :loading="batchSubmitting"
            :disabled="batchFormPreview.length === 0">
            <el-icon>
              <Check />
            </el-icon>
            批次建立（{{ batchFormPreview.length }} 筆）
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
import { Plus, Search, DocumentCopy, Aim, Refresh, FolderOpened, List, Document, Check, Download, Calendar, Collection, Setting } from '@element-plus/icons-vue'
import { getSchoolYearThemeSettings, createSchoolYearThemeSetting, updateSchoolYearThemeSetting, deleteSchoolYearThemeSetting, type SchoolYearThemeSetting, type SchoolYearThemeSettingCreateRequest } from '../api/schoolYearThemes'
import { getThemes, type Theme } from '../api/themes'
import { getSchoolYearSubThemeSettings } from '../api/schoolYearSubThemes'
import { getSchoolYearInfo, copySchoolYearSettings, exportCourseInfoCSVWithFilters, type SchoolYearInfoResponse } from '../api/schoolYears'
import { getCurrentSchoolYearAndTerm } from '../utils/schoolYear'

const router = useRouter()

// 響應式數據
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const showBatchCreateDialog = ref(false)
const batchSubmitting = ref(false)
const showCopyDialog = ref(false)
const copying = ref(false)
const exporting = ref(false)
const editingSetting = ref<SchoolYearThemeSetting | null>(null)
const settings = ref<SchoolYearThemeSetting[]>([])
const themes = ref<Theme[]>([])

// 複製功能相關（初始化時使用當前學年）
const initCopyData = () => {
  const { year } = getCurrentSchoolYearAndTerm()
  return {
    source: { academic_year: year, academic_term: 1 },
    target: { academic_year: year, academic_term: 2 }
  }
}

const copySource = reactive(initCopyData().source)
const copyTarget = reactive(initCopyData().target)
const sourceInfo = ref<SchoolYearInfoResponse | null>(null)
const loadingSource = ref(false)
const activeThemeCollapse = ref<string | number>('')

// 根據當前日期初始化學年和學期
const initSchoolYearAndTerm = () => {
  const { year, term } = getCurrentSchoolYearAndTerm()
  return { academic_year: year, academic_term: term }
}

// 查詢表單
const queryForm = reactive(initSchoolYearAndTerm())

// 表單數據（初始化時使用當前學年期）
const initFormData = () => {
  const { year, term } = getCurrentSchoolYearAndTerm()
  return {
    academic_year: year,
    academic_term: term,
    theme_code: '',
    fill_in_week_enabled: true,
    scale_max: 3,
    select_most_relevant_sub_theme_enabled: false
  }
}

const form = reactive<SchoolYearThemeSettingCreateRequest>(initFormData())

// 表單驗證規則
const rules: FormRules = {
  academic_year: [
    { required: true, message: '請輸入學年', trigger: 'blur' }
  ],
  academic_term: [
    { required: true, message: '請選擇學期', trigger: 'change' }
  ],
  theme_code: [
    { required: true, message: '請選擇主題', trigger: 'change' }
  ],
  scale_max: [
    { required: true, message: '請輸入指標數量', trigger: 'blur' }
  ]
}

const formRef = ref<FormInstance>()
const batchFormRef = ref<FormInstance>()

// 批次建立表單數據（初始化時使用當前學年）
const initBatchFormData = () => {
  const { year } = getCurrentSchoolYearAndTerm()
  return {
    start_year: year,
    end_year: year,
    academic_terms: [] as number[],
    selected_themes: [] as string[],
    fill_in_week_enabled: true,
    scale_max: 3,
    select_most_relevant_sub_theme_enabled: false
  }
}

const batchForm = reactive(initBatchFormData())

// 批次表單驗證規則
const batchRules: FormRules = {
  start_year: [
    { required: true, message: '請輸入起始學年', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (batchForm.end_year && value > batchForm.end_year) {
          callback(new Error('起始學年不能大於結束學年'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  end_year: [
    { required: true, message: '請輸入結束學年', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (batchForm.start_year && value < batchForm.start_year) {
          callback(new Error('結束學年不能小於起始學年'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  academic_terms: [
    { required: true, type: 'array', min: 1, message: '請至少選擇一個學期', trigger: 'change' }
  ],
  selected_themes: [
    { required: true, type: 'array', min: 1, message: '請至少選擇一個主題', trigger: 'change' }
  ],
  scale_max: [
    { required: true, message: '請輸入指標數量', trigger: 'blur' }
  ]
}

// 計算屬性：批次建立預覽
const batchFormPreview = computed(() => {
  const preview: Array<{ academic_year: number; academic_term: number; theme_code: string }> = []

  if (!batchForm.start_year || !batchForm.end_year ||
    batchForm.academic_terms.length === 0 ||
    batchForm.selected_themes.length === 0) {
    return preview
  }

  for (let year = batchForm.start_year; year <= batchForm.end_year; year++) {
    for (const term of batchForm.academic_terms) {
      for (const themeCode of batchForm.selected_themes) {
        preview.push({
          academic_year: year,
          academic_term: term,
          theme_code: themeCode
        })
      }
    }
  }

  return preview
})

// 計算屬性：可用的主題（排除已設定的主題）
const availableThemes = computed(() => {
  if (!queryForm.academic_year || !queryForm.academic_term) return themes.value
  const usedThemeCodes = settings.value.map(s => s.theme_code)
  return themes.value.filter(theme => !usedThemeCodes.includes(theme.theme_code))
})

// 獲取主題列表
const fetchThemes = async () => {
  try {
    const response = await getThemes()
    themes.value = response.result.themes
  } catch (error) {
    console.error('獲取主題列表失敗:', error)
  }
}

// 獲取設定列表
const fetchSettings = async () => {
  if (!queryForm.academic_year || !queryForm.academic_term) {
    ElMessage.warning('請先輸入學年和學期')
    return
  }

  try {
    loading.value = true
    const response = await getSchoolYearThemeSettings(queryForm.academic_year, queryForm.academic_term)
    settings.value = response.settings
  } catch (error) {
    console.error('獲取設定列表失敗:', error)
    settings.value = []
  } finally {
    loading.value = false
  }
}

// 重置查詢
const resetQuery = () => {
  const { year, term } = getCurrentSchoolYearAndTerm()
  queryForm.academic_year = year
  queryForm.academic_term = term
  settings.value = []
}

// 前往子主題設定頁面
const goToSubThemeSettings = (setting: SchoolYearThemeSetting) => {
  router.push(`/school-year-themes/${setting.academic_year}/${setting.academic_term}/${setting.theme_code}/subtopics`)
}

// 編輯設定
const editSetting = (setting: SchoolYearThemeSetting) => {
  editingSetting.value = setting
  Object.assign(form, {
    academic_year: setting.academic_year,
    academic_term: setting.academic_term,
    theme_code: setting.theme_code,
    fill_in_week_enabled: setting.fill_in_week_enabled,
    scale_max: setting.scale_max,
    select_most_relevant_sub_theme_enabled: setting.select_most_relevant_sub_theme_enabled || false
  })
  showCreateDialog.value = true
}

// 刪除設定
const deleteSetting = async (setting: SchoolYearThemeSetting) => {
  try {
    if (!setting.id) {
      ElMessage.error('設定 ID 不存在')
      return
    }
    await ElMessageBox.confirm(
      `確定要刪除學年期「${setting.academic_year}-${setting.academic_term}」主題「${setting.theme_name}」的設定嗎？`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteSchoolYearThemeSetting(setting.id)
    ElMessage.success('刪除成功')
    fetchSettings()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('刪除設定失敗:', error)
    }
  }
}

// 提交表單
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (editingSetting.value) {
      if (!editingSetting.value.id) {
        ElMessage.error('設定 ID 不存在')
        return
      }
      // 更新設定
      await updateSchoolYearThemeSetting(editingSetting.value.id, {
        fill_in_week_enabled: form.fill_in_week_enabled,
        scale_max: form.scale_max,
        select_most_relevant_sub_theme_enabled: form.select_most_relevant_sub_theme_enabled
      })
      ElMessage.success('更新成功')
      showCreateDialog.value = false
      fetchSettings()
    } else {
      // 創建設定
      await createSchoolYearThemeSetting({
        academic_year: form.academic_year,
        academic_term: form.academic_term,
        theme_code: form.theme_code,
        fill_in_week_enabled: form.fill_in_week_enabled,
        scale_max: form.scale_max,
        select_most_relevant_sub_theme_enabled: form.select_most_relevant_sub_theme_enabled
      })
      ElMessage.success('創建成功')
      showCreateDialog.value = false

      // 新增設定後，自動切換查詢表單到新設定的學年期並查詢
      queryForm.academic_year = form.academic_year
      queryForm.academic_term = form.academic_term
      await fetchSettings()
    }
  } catch (error) {
    console.error('提交失敗:', error)
  } finally {
    submitting.value = false
  }
}

// 重置表單
const resetForm = () => {
  editingSetting.value = null
  Object.assign(form, {
    academic_year: queryForm.academic_year || getCurrentSchoolYearAndTerm().year,
    academic_term: queryForm.academic_term || getCurrentSchoolYearAndTerm().term,
    theme_code: '',
    fill_in_week_enabled: true,
    scale_max: 3,
    select_most_relevant_sub_theme_enabled: false
  })
  formRef.value?.clearValidate()
}

// 載入來源設定
const loadSourceSettings = async () => {
  if (!copySource.academic_year || !copySource.academic_term) {
    ElMessage.warning('請選擇來源學年期')
    return
  }

  try {
    loadingSource.value = true
    const info = await getSchoolYearInfo(copySource.academic_year, copySource.academic_term)

    // 為每個主題獲取子主題的啟用狀態
    if (info.themes && info.themes.length > 0) {
      for (const theme of info.themes) {
        try {
          const subSettingsResponse = await getSchoolYearSubThemeSettings(
            copySource.academic_year,
            copySource.academic_term,
            theme.theme_code
          )

          // 建立啟用狀態的映射
          const enabledMap = new Map<string, boolean>()
          subSettingsResponse.settings.forEach(setting => {
            enabledMap.set(setting.sub_theme_code, setting.enabled)
          })

          // 為每個子主題添加 enabled 狀態
          theme.sub_themes = theme.sub_themes.map(subTheme => ({
            ...subTheme,
            enabled: enabledMap.get(subTheme.sub_theme_code) || false
          }))
        } catch (error) {
          console.warn(`獲取主題 ${theme.theme_code} 的子主題設定失敗:`, error)
          // 如果獲取失敗，預設所有子主題為未啟用
          theme.sub_themes = theme.sub_themes.map(subTheme => ({
            ...subTheme,
            enabled: false
          }))
        }
      }
    }

    sourceInfo.value = info
    activeThemeCollapse.value = info.themes && info.themes.length > 0 ? info.themes[0]?.theme_code || '' : ''
    ElMessage.success('來源設定載入成功')
  } catch (error) {
    console.error('載入來源設定失敗:', error)
    ElMessage.error('載入來源設定失敗')
    sourceInfo.value = null
  } finally {
    loadingSource.value = false
  }
}

// 打開複製對話框
const openCopyDialog = () => {
  const { year } = getCurrentSchoolYearAndTerm()
  // 初始化目標為當前查詢的學年期
  copyTarget.academic_year = queryForm.academic_year || year
  copyTarget.academic_term = queryForm.academic_term || 1
  // 初始化來源為預設值（當前學年第一學期）
  copySource.academic_year = year
  copySource.academic_term = 1
  // 清空已載入的設定
  sourceInfo.value = null
  loadingSource.value = false
  activeThemeCollapse.value = ''
  showCopyDialog.value = true
}

// 重置複製對話框
const resetCopyDialog = () => {
  const { year } = getCurrentSchoolYearAndTerm()
  copyTarget.academic_year = queryForm.academic_year || year
  copyTarget.academic_term = queryForm.academic_term || 1
  copySource.academic_year = year
  copySource.academic_term = 1
  sourceInfo.value = null
  loadingSource.value = false
  activeThemeCollapse.value = ''
}

// 複製設定功能
const copySettings = async () => {
  if (!sourceInfo.value) {
    ElMessage.warning('請先載入來源學年期設定')
    return
  }

  if (!copyTarget.academic_year || !copyTarget.academic_term) {
    ElMessage.warning('請選擇目標學年期')
    return
  }

  // 檢查是否為同一個學年期
  if (copySource.academic_year === copyTarget.academic_year && copySource.academic_term === copyTarget.academic_term) {
    ElMessage.warning('來源學年期與目標學年期不能相同')
    return
  }

  if (!sourceInfo.value.themes || sourceInfo.value.themes.length === 0) {
    ElMessage.warning('來源學年期沒有主題設定')
    return
  }

  try {
    await ElMessageBox.confirm(
      `確定要從「${copySource.academic_year}-${copySource.academic_term}」複製所有主題設定到「${copyTarget.academic_year}-${copyTarget.academic_term}」嗎？\n\n此操作將複製所有主題設定和子主題設定。`,
      '確認複製',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    copying.value = true

    // 使用新的 API 端點複製設定
    // user_id 和 token 會由 request 攔截器自動添加
    await copySchoolYearSettings({
      source_academic_year: copySource.academic_year,
      source_academic_term: copySource.academic_term,
      target_academic_year: copyTarget.academic_year,
      target_academic_term: copyTarget.academic_term
    })

    ElMessage.success('複製完成！')

    // 如果目標是當前查詢的學年期，重新載入設定列表
    if (copyTarget.academic_year === queryForm.academic_year && copyTarget.academic_term === queryForm.academic_term) {
      await fetchSettings()
    }

    showCopyDialog.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('複製設定失敗:', error)
      const err = error as { message?: string }
      ElMessage.error(err?.message || '複製設定失敗')
    }
  } finally {
    copying.value = false
  }
}

// 匯出課程資訊
const exportCourseInfo = async () => {
  if (!queryForm.academic_year || !queryForm.academic_term) {
    ElMessage.warning('請先選擇學年和學期')
    return
  }

  try {
    exporting.value = true
    const blob = await exportCourseInfoCSVWithFilters({
      academic_year_start: queryForm.academic_year,
      academic_term_start: queryForm.academic_term,
      academic_year_end: queryForm.academic_year,
      academic_term_end: queryForm.academic_term,
    })

    // 創建下載連結
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `課程資訊_${queryForm.academic_year}_${queryForm.academic_term}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('匯出成功')
  } catch (error) {
    console.error('匯出失敗:', error)
    const err = error as { message?: string; response?: { data?: { detail?: string; message?: string } } }
    const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || '匯出失敗'
    ElMessage.error(errorMessage)
  } finally {
    exporting.value = false
  }
}

// 批次建立相關函數
const selectAllThemes = () => {
  batchForm.selected_themes = themes.value.map(theme => theme.theme_code)
}

const clearAllThemes = () => {
  batchForm.selected_themes = []
}

const resetBatchForm = () => {
  const { year } = getCurrentSchoolYearAndTerm()
  Object.assign(batchForm, {
    start_year: year,
    end_year: year,
    academic_terms: [],
    selected_themes: [],
    fill_in_week_enabled: true,
    scale_max: 3,
    select_most_relevant_sub_theme_enabled: false
  })
  batchFormRef.value?.clearValidate()
}

const submitBatchForm = async () => {
  if (!batchFormRef.value) return

  try {
    await batchFormRef.value.validate()

    if (batchFormPreview.value.length === 0) {
      ElMessage.warning('請至少選擇一個學年期和主題組合')
      return
    }

    // 確認對話框
    await ElMessageBox.confirm(
      `確定要批次建立 ${batchFormPreview.value.length} 筆設定嗎？\n\n學年範圍：${batchForm.start_year} ~ ${batchForm.end_year}\n學期：${batchForm.academic_terms.map(t => `第${t}學期`).join('、')}\n主題數：${batchForm.selected_themes.length} 個`,
      '確認批次建立',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    batchSubmitting.value = true

    // 批次建立所有設定
    const promises = batchFormPreview.value.map(item =>
      createSchoolYearThemeSetting({
        academic_year: item.academic_year,
        academic_term: item.academic_term,
        theme_code: item.theme_code,
        fill_in_week_enabled: batchForm.fill_in_week_enabled,
        scale_max: batchForm.scale_max,
        select_most_relevant_sub_theme_enabled: batchForm.select_most_relevant_sub_theme_enabled
      }).catch(error => {
        // 記錄錯誤但繼續處理其他項目
        console.error(`建立設定失敗：學年 ${item.academic_year} - 第${item.academic_term}學期 - ${item.theme_code}`, error)
        return null // 返回 null 表示失敗
      })
    )

    const results = await Promise.allSettled(promises)

    // 統計成功和失敗的數量
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length
    const failCount = results.length - successCount

    if (failCount === 0) {
      ElMessage.success(`批次建立成功！共建立 ${successCount} 筆設定`)
    } else {
      ElMessage.warning(`批次建立完成：成功 ${successCount} 筆，失敗 ${failCount} 筆（可能部分設定已存在）`)
    }

    showBatchCreateDialog.value = false

    // 如果當前查詢的學年期在批次建立範圍內，重新載入設定列表
    const currentInRange = batchFormPreview.value.some(
      item => item.academic_year === queryForm.academic_year && item.academic_term === queryForm.academic_term
    )
    if (currentInRange) {
      await fetchSettings()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批次建立失敗:', error)
      const err = error as { message?: string }
      ElMessage.error(err?.message || '批次建立失敗')
    }
  } finally {
    batchSubmitting.value = false
  }
}

// 組件掛載時獲取數據
onMounted(async () => {
  await fetchThemes()
  // 自動載入當前學年期的設定
  await fetchSettings()
})
</script>

<style scoped>
.school-year-themes-container {
  padding: 24px;
  width: 100%;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 20px;
  font-weight: 600;
}

.query-form {
  margin-bottom: 24px;
}

.action-buttons {
  margin-bottom: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 表格樣式 */
:deep(.el-table) {
  font-size: 15px;
}

:deep(.el-table th) {
  font-size: 16px;
  font-weight: 600;
  padding: 16px 12px;
}

:deep(.el-table td) {
  padding: 16px 12px;
  font-size: 15px;
  line-height: 1.6;
}

:deep(.el-table .el-tag) {
  font-size: 14px;
  padding: 6px 12px;
}

/* 表格行高優化 */
:deep(.el-table__row) {
  height: 50px;
}

:deep(.el-table__body tr) {
  height: 50px;
}

/* 按鈕樣式 */
:deep(.el-button) {
  font-size: 14px;
  padding: 10px 18px;
  margin-right: 8px;
}

:deep(.el-button + .el-button) {
  margin-left: 0;
}

/* 操作按鈕組間距 */
:deep(.el-table .el-button) {
  margin-right: 6px;
}

/* 表單樣式 */
:deep(.el-form-item__label) {
  font-size: 15px;
  padding-bottom: 8px;
}

:deep(.el-input__inner) {
  font-size: 15px;
  padding: 10px 12px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 卡片內邊距 */
:deep(.el-card__body) {
  padding: 24px;
}

/* 複製對話框樣式 */
.copy-dialog-content {
  padding: 0;
}

.target-info-card {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.target-info-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 4px 4px 0 0;
}

.target-info-card :deep(.el-card__body) {
  padding: 20px;
}

.card-header-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.header-icon {
  font-size: 18px;
}

.target-value {
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
}

.target-value-tag {
  font-size: 15px;
  font-weight: 600;
  padding: 8px 16px;
}

.source-card {
  border: 1px solid #e4e7ed;
}

.source-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 4px 4px 0 0;
}

.source-card :deep(.el-card__body) {
  padding: 24px;
}

.copy-form {
  margin-bottom: 24px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.settings-display {
  margin-top: 20px;
  min-height: 300px;
}

.summary-descriptions {
  margin-bottom: 24px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.themes-container {
  margin-top: 16px;
}

.theme-title {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.theme-icon {
  font-size: 18px;
  color: #409eff;
}

.theme-code {
  font-weight: 700;
  color: #303133;
  font-size: 15px;
  min-width: 60px;
}

.theme-name {
  color: #606266;
  font-size: 15px;
  flex: 1;
}

.theme-details {
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
}

.theme-info {
  margin-bottom: 16px;
}

.scale-value {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.sub-themes-list {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.sub-themes-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 600;
}

.sub-themes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sub-theme-tag {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.3s;
}

.sub-theme-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.empty-hint {
  text-align: center;
  color: #909399;
  padding: 60px 20px;
  font-size: 14px;
}

.empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.empty-hint p {
  margin: 0;
  color: #909399;
}

/* 改進按鈕樣式（僅限對話框內） */
.copy-dialog-content :deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.copy-dialog-content :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 改進卡片樣式（僅限對話框內） */
.target-info-card,
.source-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.target-info-card:hover,
.source-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

/* 改進折疊面板樣式（僅限對話框內） */
.copy-dialog-content :deep(.el-collapse) {
  border: none;
}

.copy-dialog-content :deep(.el-collapse-item__header) {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.copy-dialog-content :deep(.el-collapse-item__header:hover) {
  background-color: #e9ecef;
}

.copy-dialog-content :deep(.el-collapse-item__content) {
  padding: 0;
}

/* 改進描述列表樣式（僅限對話框內） */
.copy-dialog-content :deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
}

.copy-dialog-content :deep(.el-descriptions__content) {
  color: #303133;
}

/* 批次建立對話框樣式 */
.batch-form-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.batch-form-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 4px 4px 0 0;
}

.batch-form-card :deep(.el-card__body) {
  padding: 20px;
}

.theme-selector {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}

.theme-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-checkbox {
  width: 100%;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  transition: all 0.2s;
}

.theme-checkbox:hover {
  background-color: #f0f9ff;
}

.theme-label {
  font-size: 14px;
  color: #303133;
}
</style>
