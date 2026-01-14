<template>
  <div class="school-year-subthemes-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="header-title-row">
              <el-button type="text" @click="goBack" class="back-button">
                <el-icon>
                  <ArrowLeft />
                </el-icon>
                <span>{{ language === 'zh' ? '返回' : 'Back' }}</span>
              </el-button>
              <div class="title-text">
                <span class="page-title">{{ currentTheme?.theme_name || '子主題設定' }}</span>
                <span class="page-subtitle">{{ academicYear }}-{{ academicTerm }} - {{ currentTheme?.theme_code
                  }}</span>
              </div>
            </div>
          </div>
          <div class="header-right">
            <el-radio-group v-model="language" size="default" class="language-switch">
              <el-radio-button label="zh">中文</el-radio-button>
              <el-radio-button label="en">English</el-radio-button>
            </el-radio-group>
            <div class="action-buttons">
              <el-button type="success" @click="enableAll" :loading="batchLoading">
                {{ language === 'zh' ? '全部啟用' : 'Enable All' }}
              </el-button>
              <el-button type="warning" @click="disableAll" :loading="batchLoading">
                {{ language === 'zh' ? '全部停用' : 'Disable All' }}
              </el-button>
            </div>
          </div>
        </div>
      </template>

      <!-- 當前設定資訊 -->
      <div v-if="currentTheme" class="theme-info">
        <el-descriptions :column="3" border>
          <el-descriptions-item :label="language === 'zh' ? '學年' : 'Academic Year'">{{ academicYear
            }}</el-descriptions-item>
          <el-descriptions-item :label="language === 'zh' ? '學期' : 'Term'">
            {{ language === 'zh' ? `第${academicTerm}學期` : `Term ${academicTerm}` }}
          </el-descriptions-item>
          <el-descriptions-item :label="language === 'zh' ? '主題代碼' : 'Theme Code'">{{ currentTheme.theme_code
            }}</el-descriptions-item>
          <el-descriptions-item :label="language === 'zh' ? '主題名稱' : 'Theme Name'" :span="2">
            {{ language === 'zh' ? currentTheme.theme_name : (currentTheme.theme_english_name ||
              currentTheme.theme_name) }}
          </el-descriptions-item>
          <el-descriptions-item :label="language === 'zh' ? '啟用週次填寫' : 'Enable Week Filling'">
            <el-tag :type="currentTheme.fill_in_week_enabled ? 'success' : 'danger'">
              {{ currentTheme.fill_in_week_enabled ? (language === 'zh' ? '是' : 'Yes') : (language === 'zh' ? '否' :
              'No') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="language === 'zh' ? '指標數量' : 'Scale Max'">{{ currentTheme.scale_max
            }}</el-descriptions-item>
          <el-descriptions-item :label="language === 'zh' ? '子主題總數' : 'Total Sub-themes'">{{ subThemeSettings.length
            }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 子主題設定列表 -->
      <el-table v-loading="loading" :data="subThemeSettings" style="width: 100%; margin-top: 20px" stripe>
        <el-table-column prop="sub_theme_code" :label="language === 'zh' ? '子主題代碼' : 'Sub-theme Code'" width="120" />
        <el-table-column :label="language === 'zh' ? '子主題名稱' : 'Sub-theme Name'" min-width="200">
          <template #default="scope">
            {{ language === 'zh' ? scope.row.sub_theme_name : scope.row.sub_theme_english_name }}
          </template>
        </el-table-column>
        <el-table-column :label="language === 'zh' ? '子主題內容' : 'Sub-theme Content'" min-width="300">
          <template #default="scope">
            <div class="sub-theme-content">
              {{ language === 'zh' ? scope.row.sub_theme_content : scope.row.sub_theme_english_content }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="language === 'zh' ? '啟用狀態' : 'Enabled Status'" width="120" fixed="right">
          <template #default="scope">
            <el-switch v-model="scope.row.enabled" @change="updateSetting(scope.row)" :loading="scope.row.updating" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 空狀態 -->
      <el-empty v-if="!loading && subThemeSettings.length === 0"
        :description="language === 'zh' ? '該主題暫無子主題設定' : 'No sub-theme settings for this theme'" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getSchoolYearSubThemeSettings, updateSchoolYearSubThemeSetting, type SchoolYearSubThemeSetting } from '../api/schoolYearSubThemes'
import { getSchoolYearThemeSetting, getSchoolYearThemeSettings, type SchoolYearThemeSetting } from '../api/schoolYearThemes'
import { getSubThemesByTheme, type SubTheme } from '../api/subThemes'
import { getThemes, type Theme } from '../api/themes'

const route = useRoute()
const router = useRouter()

// 響應式數據
const loading = ref(false)
const batchLoading = ref(false)
const subThemeSettings = ref<(SchoolYearSubThemeSetting & {
  updating?: boolean
  sub_theme_content?: string
  sub_theme_english_content?: string
  sub_theme_english_name?: string
})[]>([])
const currentTheme = ref<(SchoolYearThemeSetting & { theme_english_name?: string }) | null>(null)
const language = ref<'zh' | 'en'>('zh')

// 計算屬性
const academicYear = computed(() => parseInt(route.params.academic_year as string))
const academicTerm = computed(() => parseInt(route.params.academic_term as string))
const themeCode = computed(() => route.params.theme_code as string)

// 獲取當前主題設定
const fetchCurrentTheme = async () => {
  try {
    // 先獲取所有主題設定，找到對應 theme_code 的設定
    const { getSchoolYearThemeSettings } = await import('../api/schoolYearThemes')
    const settingsResponse = await getSchoolYearThemeSettings(academicYear.value, academicTerm.value)
    const setting = settingsResponse.settings.find(s => s.theme_code === themeCode.value)

    if (!setting?.id) {
      ElMessage.error('找不到對應的主題設定')
      return
    }

    // 使用 settingId 獲取詳細資訊
    const response = await getSchoolYearThemeSetting(setting.id)

    // 獲取主題的英文名稱
    try {
      const themesResponse = await getThemes()
      const themeDetail = themesResponse.result.themes.find(t => t.theme_code === themeCode.value)
      currentTheme.value = {
        ...response,
        theme_english_name: themeDetail?.theme_english_name || ''
      }
    } catch (error) {
      console.warn('獲取主題詳細資訊失敗:', error)
      currentTheme.value = response
    }
  } catch (error) {
    console.error('獲取主題設定失敗:', error)
  }
}

// 獲取子主題設定列表
const fetchSubThemeSettings = async () => {
  try {
    loading.value = true

    // 1. 先找到主題 ID
    const themesResponse = await getThemes()
    const theme = themesResponse.result.themes.find(t => t.theme_code === themeCode.value)
    if (!theme?.id) {
      ElMessage.error('找不到主題 ID')
      return
    }

    // 2. 獲取子主題設定（包含啟用狀態）- 使用 themeId
    const settingsResponse = await getSchoolYearSubThemeSettings(academicYear.value, academicTerm.value, theme.id)

    // 3. 獲取子主題詳細資訊（包含內容）- 使用 themeId
    const subThemesResponse = await getSubThemesByTheme(theme.id)
    const subThemesMap = new Map<string, SubTheme>()
    subThemesResponse.result.sub_themes.forEach(subTheme => {
      subThemesMap.set(subTheme.sub_theme_code, subTheme)
    })

    // 4. 合併設定和詳細資訊
    subThemeSettings.value = settingsResponse.settings.map(setting => {
      const subThemeDetail = subThemesMap.get(setting.sub_theme_code)
      return {
        ...setting,
        updating: false,
        sub_theme_content: subThemeDetail?.sub_theme_content || '',
        sub_theme_english_content: subThemeDetail?.sub_theme_english_content || '',
        sub_theme_english_name: subThemeDetail?.sub_theme_english_name || ''
      }
    })
  } catch (error) {
    console.error('獲取子主題設定列表失敗:', error)
    subThemeSettings.value = []
  } finally {
    loading.value = false
  }
}

// 更新單個設定
const updateSetting = async (setting: SchoolYearSubThemeSetting & {
  updating?: boolean
  sub_theme_english_name?: string
}) => {
  try {
    if (!setting.id) {
      ElMessage.error('設定 ID 不存在')
      return
    }
    if (setting.updating !== undefined) {
      setting.updating = true
    }
    await updateSchoolYearSubThemeSetting(setting.id, { enabled: setting.enabled })
    const name = language.value === 'zh' ? setting.sub_theme_name : (setting.sub_theme_english_name || setting.sub_theme_name)
    const status = setting.enabled
      ? (language.value === 'zh' ? '已啟用' : 'Enabled')
      : (language.value === 'zh' ? '已停用' : 'Disabled')
    ElMessage.success(`${name} ${status}`)
  } catch (error) {
    // 如果更新失敗，恢復原狀態
    setting.enabled = !setting.enabled
    console.error('更新設定失敗:', error)
  } finally {
    if (setting.updating !== undefined) {
      setting.updating = false
    }
  }
}

// 全部啟用
const enableAll = async () => {
  try {
    batchLoading.value = true
    const promises = subThemeSettings.value
      .filter(setting => !setting.enabled && setting.id)
      .map(setting =>
        updateSchoolYearSubThemeSetting(setting.id!, { enabled: true })
          .then(() => {
            setting.enabled = true
          })
      )

    await Promise.all(promises)
    ElMessage.success(language.value === 'zh' ? '全部啟用成功' : 'All enabled successfully')
  } catch (error) {
    console.error('批量啟用失敗:', error)
  } finally {
    batchLoading.value = false
  }
}

// 全部停用
const disableAll = async () => {
  try {
    batchLoading.value = true
    const promises = subThemeSettings.value
      .filter(setting => setting.enabled && setting.id)
      .map(setting =>
        updateSchoolYearSubThemeSetting(setting.id!, { enabled: false })
          .then(() => {
            setting.enabled = false
          })
      )

    await Promise.all(promises)
    ElMessage.success(language.value === 'zh' ? '全部停用成功' : 'All disabled successfully')
  } catch (error) {
    console.error('批量停用失敗:', error)
  } finally {
    batchLoading.value = false
  }
}

// 返回上一頁
const goBack = () => {
  router.back()
}

// 組件掛載時獲取數據
onMounted(async () => {
  await fetchCurrentTheme()
  await fetchSubThemeSettings()
})
</script>

<style scoped>
.school-year-subthemes-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #409eff;
  font-size: 14px;
  padding: 4px 8px;
  transition: all 0.3s;
}

.back-button:hover {
  color: #66b1ff;
  background-color: #ecf5ff;
}

.back-button .el-icon {
  font-size: 16px;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.language-switch {
  margin-right: 8px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.theme-info {
  margin-bottom: 20px;
}

/* 修正 Descriptions 組件的垂直對齊 */
:deep(.el-descriptions__label) {
  vertical-align: middle;
  line-height: 1.6;
}

:deep(.el-descriptions__content) {
  vertical-align: middle;
  line-height: 1.6;
}

:deep(.el-descriptions-item__cell) {
  vertical-align: middle;
}

.sub-theme-content {
  color: #606266;
  line-height: 1.6;
  word-break: break-word;
}
</style>
