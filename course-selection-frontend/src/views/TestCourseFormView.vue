<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, ArrowRight, StarFilled } from '@element-plus/icons-vue'
import { getSchoolYearInfo, getTeacherFormData, type SchoolYearInfoResponse, type TeacherFormDataResponse } from '../api/schoolYears'
import { createCourseEntry, updateCourseEntry, deleteCourseEntry } from '../api/courseEntries'
import tokenManager from '../utils/tokenManager'

const route = useRoute()
const router = useRouter()

const courseId = computed(() => route.params.course_id as string)
const academicYear = computed(() => parseInt(route.params.academic_year as string))
const academicTerm = computed(() => parseInt(route.params.academic_term as string))

// 從路由 query 參數或 formData 中獲取 ps_class_nbr
const psClassNbr = computed(() => {
  const queryPsClassNbr = route.query.ps_class_nbr as string | undefined
  return queryPsClassNbr || formData.value?.ps_class_nbr || ''
})

// 從 formData 中獲取 subj_no（對應 course_id）
const subjNo = computed(() => formData.value?.course_id || courseId.value)

interface SubTheme {
  sub_theme_code: string
  sub_theme_name: string
  sub_theme_english_name: string
  sub_theme_content?: string | null
  sub_theme_english_content?: string | null
  current_value?: string | null
  week_numbers?: number[] | null
  entry_id?: string | null // UUID - 從 number 改為 string
  enabled?: boolean
  is_most_relevant?: boolean
}

interface SubThemeWithTheme extends SubTheme {
  theme_code: string
}


const loading = ref(false)
const saving = ref(false)
const schoolYearInfo = ref<SchoolYearInfoResponse | null>(null)
const formData = ref<TeacherFormDataResponse | null>(null)

// 語言切換狀態
const isEnglish = ref(false)

// selections: key `${theme_code}:${sub_theme_code}` -> level number 1..N
const selections = reactive<Record<string, number>>({})
// weekNumbers: key `${theme_code}:${sub_theme_code}` -> array of week numbers
const weekNumbers = reactive<Record<string, number[]>>({})
// entryIds: key `${theme_code}:${sub_theme_code}` -> entry_id (for updates) - UUID string
const entryIds = reactive<Record<string, string | null>>({})
// originalData: key `${theme_code}:${sub_theme_code}` -> 原始後端資料（用於比對是否有變更）
const originalData = reactive<Record<string, {
  indicator_value: string
  week_numbers: number[]
}>>({})

// 已選擇和未選擇的子主題（按主題分組）
const selectedSubThemes = ref<Record<string, SubThemeWithTheme[]>>({})
const unselectedSubThemes = ref<Record<string, SubThemeWithTheme[]>>({})

// 主題展開狀態（預設全部收合）
const expandedThemes = reactive<Record<string, boolean>>({})

// 最相關科目追蹤：key `${theme_code}` -> `sub_theme_code`
const mostRelevant = reactive<Record<string, string>>({})

const scaleByTheme = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {}
  if (schoolYearInfo.value?.themes) {
    for (const t of schoolYearInfo.value.themes) {
      map[t.theme_code] = t.scale_max
    }
  }
  return map
})

const fillInWeekByTheme = computed<Record<string, boolean>>(() => {
  const map: Record<string, boolean> = {}
  if (schoolYearInfo.value?.themes) {
    for (const t of schoolYearInfo.value.themes) {
      map[t.theme_code] = t.fill_in_week_enabled || false
    }
  }
  return map
})

const selectMostRelevantByTheme = computed<Record<string, boolean>>(() => {
  const map: Record<string, boolean> = {}
  if (schoolYearInfo.value?.themes) {
    for (const t of schoolYearInfo.value.themes) {
      map[t.theme_code] = t.select_most_relevant_sub_theme_enabled || false
    }
  }
  return map
})

// 獲取滑桿刻度標記
const getMarks = (themeCode: string) => {
  const max = scaleByTheme.value[themeCode] || 5
  const marks: Record<number, string> = {}
  for (let i = 1; i <= max; i++) {
    marks[i] = `L${i}`
  }
  return marks
}

// 格式化週次顯示
const formatWeekNumbers = (weeks: number[]) => {
  if (!weeks || weeks.length === 0) return ''
  const sorted = [...weeks].sort((a, b) => a - b)
  if (isEnglish.value) {
    return `Week ${sorted.join(', ')}`
  }
  return `第${sorted.join(',')}週`
}

// 初始化時設定所有主題為收合狀態
const initializeExpandState = () => {
  if (schoolYearInfo.value?.themes) {
    for (const theme of schoolYearInfo.value.themes) {
      if (!(theme.theme_code in expandedThemes)) {
        expandedThemes[theme.theme_code] = false
      }
    }
  }
}

// 切換主題展開狀態
const toggleTheme = (themeCode: string) => {
  expandedThemes[themeCode] = !expandedThemes[themeCode]
}

// 判斷主題的填寫狀態
const getThemeStatus = (themeCode: string) => {
  const selected = selectedSubThemes.value[themeCode] || []

  // 如果沒有選擇任何細項，返回 'empty'
  if (selected.length === 0) {
    return 'empty'
  }

  // 檢查是否所有已選擇的細項都已填寫
  let allFilled = true
  let allSaved = true

  for (const sub of selected) {
    const key = keyOf(themeCode, sub.sub_theme_code)
    const hasLevel = selections[key] != null && selections[key] > 0
    const hasEntryId = entryIds[key] != null

    // 檢查是否填寫完整（程度 + 週次如果需要）
    let isFilled = hasLevel
    if (isFillInWeekEnabled(themeCode)) {
      const hasWeeks = weekNumbers[key] != null && weekNumbers[key].length > 0
      isFilled = hasLevel && hasWeeks
    }

    if (!isFilled) {
      allFilled = false
      allSaved = false
      break
    }

    // 檢查是否與後端資料一致（判斷是否已儲存）
    if (hasEntryId && originalData[key]) {
      const currentValue = String(selections[key])
      const originalValue = originalData[key].indicator_value
      const currentWeeks = weekNumbers[key] || []
      const originalWeeks = originalData[key].week_numbers || []

      // 比對程度和週次是否一致
      const valueChanged = currentValue !== originalValue
      const weeksChanged = JSON.stringify([...currentWeeks].sort()) !== JSON.stringify([...originalWeeks].sort())

      if (valueChanged || weeksChanged) {
        allSaved = false
      }
    } else {
      // 沒有 entry_id，表示尚未儲存過
      allSaved = false
    }
  }

  // 檢查未選擇列表中是否有待刪除的項目（有 entry_id 的）
  const unselected = unselectedSubThemes.value[themeCode] || []
  const hasPendingDelete = unselected.some(sub => {
    const key = keyOf(themeCode, sub.sub_theme_code)
    return entryIds[key] != null
  })

  // 如果有待刪除的項目，表示有未儲存的變更
  if (hasPendingDelete) {
    allSaved = false
  }

  // 檢查是否需要勾選最相關科目
  if (selectMostRelevantByTheme.value[themeCode]) {
    // 檢查該主題下是否有已填寫的項目
    const hasFilledItems = selected.some(sub => {
      const key = keyOf(themeCode, sub.sub_theme_code)
      const indicatorValue = selections[key]
      return indicatorValue != null && indicatorValue > 0
    })

    // 如果有已填寫的項目，但沒有勾選最相關科目，則視為未完成（橘色）
    if (hasFilledItems && !mostRelevant[themeCode]) {
      return 'partial'
    }
  }

  // 優先順序：saved > completed > partial > empty
  if (!allFilled) {
    return 'partial'
  }
  if (allSaved) {
    return 'saved'
  }
  return 'completed'
}

// 根據狀態返回對應的 CSS class
const getThemeClass = (themeCode: string) => {
  const status = getThemeStatus(themeCode)
  return {
    'theme-card': true,
    'theme-empty': status === 'empty',
    'theme-completed': status === 'completed',
    'theme-partial': status === 'partial',
    'theme-saved': status === 'saved'
  }
}

const fetchAll = async () => {
  try {
    loading.value = true
    // 從路由 query 參數獲取 ps_class_nbr，如果沒有則從 API 回應中獲取
    const queryPsClassNbr = route.query.ps_class_nbr as string | undefined

    const [a, b] = await Promise.all([
      getSchoolYearInfo(academicYear.value, academicTerm.value),
      getTeacherFormData(courseId.value, academicYear.value, academicTerm.value, queryPsClassNbr),
    ])
    schoolYearInfo.value = a
    formData.value = b

    // 分類子主題並預填已存在的資料
    categorizeSubThemes()
    // 初始化展開狀態
    initializeExpandState()
  } catch (e: unknown) {
    const error = e as { message?: string }
    ElMessage.error(error?.message || '載入失敗')
  } finally {
    loading.value = false
  }
}

// 分類子主題為已選擇和未選擇
const categorizeSubThemes = () => {
  if (!schoolYearInfo.value?.themes || !formData.value?.themes) return

  // 清空舊資料，準備重新載入
  Object.keys(selections).forEach(key => delete selections[key])
  Object.keys(weekNumbers).forEach(key => delete weekNumbers[key])
  Object.keys(entryIds).forEach(key => delete entryIds[key])
  Object.keys(originalData).forEach(key => delete originalData[key])

  const selected: Record<string, SubThemeWithTheme[]> = {}
  const unselected: Record<string, SubThemeWithTheme[]> = {}

  // 建立已填寫的子主題集合
  const filledMap = new Map<string, SubTheme>()
  for (const theme of formData.value.themes) {
    for (const sub of theme.sub_themes) {
      const key = keyOf(theme.theme_code, sub.sub_theme_code)
      filledMap.set(key, sub)

      // 預填資料
      if (sub.current_value) {
        selections[key] = parseInt(sub.current_value)
      }
      if (sub.week_numbers && Array.isArray(sub.week_numbers)) {
        weekNumbers[key] = sub.week_numbers
      }
      if (sub.entry_id != null) {
        entryIds[key] = sub.entry_id
        // 保存原始後端資料（用於判斷是否有變更）
        originalData[key] = {
          indicator_value: sub.current_value || '',
          week_numbers: sub.week_numbers ? [...sub.week_numbers] : []
        }
      }
    }
  }

  // 分類所有子主題
  for (const theme of schoolYearInfo.value.themes) {
    selected[theme.theme_code] = []
    unselected[theme.theme_code] = []

    for (const sub of theme.sub_themes) {
      // 跳過 enabled: false 的子主題（不顯示在未選擇列表中）
      // 但如果已經被選擇（有 entry_id），仍然顯示在已選擇列表中
      const key = keyOf(theme.theme_code, sub.sub_theme_code)
      const filled = filledMap.get(key)
      const isSelected = filled && filled.entry_id != null

      // 如果 enabled 為 false 且未被選擇，則跳過
      if (sub.enabled === false && !isSelected) {
        continue
      }

      const subWithTheme: SubThemeWithTheme = {
        ...sub,
        theme_code: theme.theme_code,
        current_value: filledMap.get(key)?.current_value,
        week_numbers: filledMap.get(key)?.week_numbers,
        entry_id: filledMap.get(key)?.entry_id,
        is_most_relevant: filledMap.get(key)?.is_most_relevant || false
      }

      // 檢查 entry_id 是否存在且不為 null，或者檢查 current_entry 是否存在
      if (isSelected) {
        selected[theme.theme_code]?.push(subWithTheme)
        // 如果是最相關的，記錄到 mostRelevant
        if (subWithTheme.is_most_relevant) {
          mostRelevant[theme.theme_code] = sub.sub_theme_code
        }
      } else {
        unselected[theme.theme_code]?.push(subWithTheme)
      }
    }
  }

  selectedSubThemes.value = selected
  unselectedSubThemes.value = unselected
}

const keyOf = (themeCode: string, subThemeCode: string) => `${themeCode}:${subThemeCode}`

const isFillInWeekEnabled = (themeCode: string) => {
  return fillInWeekByTheme.value[themeCode] || false
}

// 新增項目到已選擇列表
const addSubTheme = (themeCode: string, subTheme: SubThemeWithTheme) => {
  if (!unselectedSubThemes.value[themeCode] || !selectedSubThemes.value[themeCode]) return

  const idx = unselectedSubThemes.value[themeCode].findIndex(
    s => s.sub_theme_code === subTheme.sub_theme_code
  )
  if (idx !== undefined && idx >= 0) {
    unselectedSubThemes.value[themeCode].splice(idx, 1)
    selectedSubThemes.value[themeCode].push(subTheme)
  }
}

// 移除項目到未選擇列表
const removeSubTheme = async (themeCode: string, subTheme: SubThemeWithTheme) => {
  const key = keyOf(themeCode, subTheme.sub_theme_code)

  try {
    await ElMessageBox.confirm(
      `確定要移除「${subTheme.sub_theme_name}」嗎？`,
      '確認移除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    if (!selectedSubThemes.value[themeCode] || !unselectedSubThemes.value[themeCode]) return

    const idx = selectedSubThemes.value[themeCode].findIndex(
      s => s.sub_theme_code === subTheme.sub_theme_code
    )
    if (idx !== undefined && idx >= 0) {
      selectedSubThemes.value[themeCode].splice(idx, 1)
      unselectedSubThemes.value[themeCode].push(subTheme)

      // 清除前端填寫的資料（但保留 entryId 和 originalData 用於後續刪除）
      delete selections[key]
      delete weekNumbers[key]
      // 如果是最相關的，清除最相關標記
      if (mostRelevant[themeCode] === subTheme.sub_theme_code) {
        delete mostRelevant[themeCode]
      }
      // 注意：不刪除 entryIds[key] 和 originalData[key]，因為儲存時需要用它們來執行刪除操作
    }
  } catch {
    // 用戶取消
  }
}

// 切換最相關科目
const toggleMostRelevant = (themeCode: string, subThemeCode: string) => {
  if (!selectMostRelevantByTheme.value[themeCode]) {
    return // 如果主題不需要勾選最相關科目，則不允許切換
  }

  const currentMostRelevant = mostRelevant[themeCode]

  if (currentMostRelevant === subThemeCode) {
    // 如果點擊的是當前最相關的，則取消
    delete mostRelevant[themeCode]
  } else {
    // 設置新的最相關科目
    mostRelevant[themeCode] = subThemeCode
  }
}

// 檢查是否為最相關科目
const isMostRelevant = (themeCode: string, subThemeCode: string): boolean => {
  return mostRelevant[themeCode] === subThemeCode
}

// 儲存所有資料
const saveFormData = async () => {
  try {
    saving.value = true

    // 驗證：如果主題設定了 select_most_relevant_sub_theme_enabled = true，則該主題下必須有一個且僅有一個 is_most_relevant = true 的記錄
    if (schoolYearInfo.value?.themes) {
      for (const theme of schoolYearInfo.value.themes) {
        if (theme.select_most_relevant_sub_theme_enabled) {
          const themeCode = theme.theme_code
          const subThemes = selectedSubThemes.value[themeCode] || []

          // 檢查該主題下是否有已選擇且有填寫程度的項目
          const filledSubThemes = subThemes.filter(subTheme => {
            const key = keyOf(themeCode, subTheme.sub_theme_code)
            const indicatorValue = selections[key]
            return indicatorValue != null && indicatorValue > 0
          })

          // 如果該主題下沒有任何已填寫的項目，跳過驗證（因為可能還沒有開始填寫）
          if (filledSubThemes.length === 0) {
            continue
          }

          // 計算該主題下有多少個最相關的項目
          let mostRelevantCount = 0
          for (const subTheme of filledSubThemes) {
            if (isMostRelevant(themeCode, subTheme.sub_theme_code)) {
              mostRelevantCount++
            }
          }

          if (mostRelevantCount === 0) {
            const themeName = theme.theme_name || themeCode
            ElMessage.warning({
              message: `主題「${themeName}」需要勾選最相關科目，請先選擇最相關的項目後再儲存`,
              duration: 5000,
              showClose: true
            })
            throw new Error(`主題「${themeName}」需要勾選最相關科目`)
          } else if (mostRelevantCount > 1) {
            const themeName = theme.theme_name || themeCode
            ElMessage.error(`主題「${themeName}」只能有一個最相關的項目，但目前選擇了 ${mostRelevantCount} 個`)
            throw new Error(`主題「${themeName}」只能有一個最相關的項目`)
          }
        }
      }
    }

    // 獲取認證資料
    const userId = 'teacher001' // 測試用硬編碼
    const token = tokenManager.generateToken(userId)

    const promises: Promise<unknown>[] = []
    const toDelete: string[] = [] // UUID string array

    // 處理已選擇的項目
    for (const [themeCode, subThemes] of Object.entries(selectedSubThemes.value)) {
      for (const subTheme of subThemes) {
        const key = keyOf(themeCode, subTheme.sub_theme_code)
        const indicatorValue = selections[key]

        // 只儲存有選擇程度的項目
        if (indicatorValue) {
          const entryId = entryIds[key]
          const isMostRelevantValue = isMostRelevant(themeCode, subTheme.sub_theme_code)
          const data = {
            indicator_value: String(indicatorValue),
            week_numbers: isFillInWeekEnabled(themeCode) ? (weekNumbers[key] || []) : undefined,
            is_most_relevant: selectMostRelevantByTheme.value[themeCode] ? isMostRelevantValue : undefined,
            user_id: userId,
            token: token
          }

          if (entryId) {
            // 更新現有記錄
            promises.push(updateCourseEntry(entryId, data))
          } else {
            // 創建新記錄
            if (!psClassNbr.value) {
              ElMessage.error('缺少 ps_class_nbr，無法創建記錄')
              throw new Error('缺少 ps_class_nbr')
            }
            promises.push(createCourseEntry({
              subj_no: subjNo.value,
              ps_class_nbr: psClassNbr.value,
              academic_year: academicYear.value,
              academic_term: academicTerm.value,
              sub_theme_code: subTheme.sub_theme_code,
              ...data
            }))
          }
        }
      }
    }

    // 找出需要刪除的項目（在未選擇列表中但有 entry_id 的）
    for (const [themeCode, subThemes] of Object.entries(unselectedSubThemes.value)) {
      for (const subTheme of subThemes) {
        const key = keyOf(themeCode, subTheme.sub_theme_code)
        const entryId = entryIds[key]
        if (entryId) {
          toDelete.push(entryId)
        }
      }
    }

    // 執行所有儲存操作
    await Promise.all(promises)

    // 執行刪除操作
    const deletePromises = toDelete.map(entryId => deleteCourseEntry(entryId, {
      user_id: userId,
      token: token
    }))
    await Promise.all(deletePromises)

    ElMessage.success('儲存成功')

    // 重新載入資料
    await fetchAll()
  } catch (error: unknown) {
    console.error('儲存失敗:', error)
    const err = error as { message?: string }
    ElMessage.error(err?.message || '儲存失敗')
  } finally {
    saving.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <div class="test-course-form" v-loading="loading">
    <div class="form-header">
      <el-page-header @back="router.back"
        :content="formData ? `${academicYear}-${academicTerm} ${isEnglish ? formData.course_english_name : formData.course_chinese_name}` : (isEnglish ? 'Loading...' : '載入中...')" />
      <div class="header-actions">
        <el-button-group>
          <el-button :type="!isEnglish ? 'primary' : 'default'" @click="isEnglish = false" size="large">
            中文
          </el-button>
          <el-button :type="isEnglish ? 'primary' : 'default'" @click="isEnglish = true" size="large">
            English
          </el-button>
        </el-button-group>
        <el-button type="primary" :loading="saving" @click="saveFormData" size="large">
          {{ isEnglish ? 'Save' : '儲存' }}
        </el-button>
      </div>
    </div>

    <!-- 顏色說明 -->
    <el-card class="legend-card" v-if="schoolYearInfo?.themes">
      <div class="legend-container">
        <div class="legend-item">
          <div class="legend-color theme-empty"></div>
          <span>{{ isEnglish ? 'Empty/Partial: No items selected or partially filled' : '橘色：未填寫或部分填寫' }}</span>
        </div>
        <div class="legend-item">
          <div class="legend-color theme-completed"></div>
          <span>{{ isEnglish ? 'Completed: Filled but not saved' : '藍色：已完成填寫但尚未儲存' }}</span>
        </div>
        <div class="legend-item">
          <div class="legend-color theme-saved"></div>
          <span>{{ isEnglish ? 'Saved: Data saved' : '綠色：已儲存資料' }}</span>
        </div>
      </div>
    </el-card>

    <div v-if="schoolYearInfo?.themes" class="themes-container">
      <el-card v-for="theme in schoolYearInfo.themes" :key="theme.theme_code" :class="getThemeClass(theme.theme_code)">
        <template #header>
          <div class="theme-title" @click="toggleTheme(theme.theme_code)">
            <div class="title-left">
              <el-icon class="expand-icon" :class="{ 'is-expanded': expandedThemes[theme.theme_code] }">
                <ArrowRight />
              </el-icon>
              <span>{{ isEnglish ? theme.theme_english_name : theme.theme_name }}</span>
            </div>
          </div>
        </template>

        <div v-show="expandedThemes[theme.theme_code]" class="theme-content">
          <!-- 已選擇的子項目列表 -->
          <div class="selected-section">
            <h4>{{ isEnglish ? 'Sub-item List' : '子項目列表' }}</h4>
            <el-table :data="selectedSubThemes[theme.theme_code] || []" border style="width: 100%"
              :empty-text="isEnglish ? 'No items' : '暫無細項'">
              <el-table-column v-if="selectMostRelevantByTheme[theme.theme_code]"
                :label="isEnglish ? 'Most Relevant' : '最相關'" width="100" align="center">
                <template #default="scope">
                  <el-icon class="crown-icon"
                    :class="{ 'is-most-relevant': isMostRelevant(theme.theme_code, scope.row.sub_theme_code) }"
                    @click="toggleMostRelevant(theme.theme_code, scope.row.sub_theme_code)">
                    <StarFilled />
                  </el-icon>
                </template>
              </el-table-column>
              <el-table-column :label="isEnglish ? 'Sub-item' : '子項目'" :min-width="isEnglish ? 180 : 150">
                <template #default="scope">
                  {{ isEnglish ? scope.row.sub_theme_english_name : scope.row.sub_theme_name }}
                </template>
              </el-table-column>

              <el-table-column :label="isEnglish ? 'Related Content' : '相關內容'" :min-width="isEnglish ? 350 : 200">
                <template #default="scope">
                  <div class="sub-theme-content">
                    {{ isEnglish ? scope.row.sub_theme_english_content : scope.row.sub_theme_content }}
                  </div>
                </template>
              </el-table-column>

              <el-table-column :min-width="isEnglish ? 280 : 250">
                <template #header>
                  <span>{{ isEnglish ? 'Relevance Level' : '相關程度' }} <el-tag type="info" size="small">{{ isEnglish ?
                    'Max' : '最大值' }}: {{ theme.scale_max }}</el-tag></span>
                </template>
                <template #default="scope">
                  <el-slider v-model="selections[keyOf(theme.theme_code, scope.row.sub_theme_code)]" :min="1"
                    :max="theme.scale_max" :marks="getMarks(theme.theme_code)"
                    :format-tooltip="(val: number) => `L${val}`" show-stops />
                </template>
              </el-table-column>

              <el-table-column v-if="isFillInWeekEnabled(theme.theme_code)" :label="isEnglish ? 'Weeks' : '週次'"
                :min-width="isEnglish ? 220 : 200">
                <template #default="scope">
                  <el-popover placement="bottom" :width="320" trigger="click">
                    <template #reference>
                      <div class="week-display-button" :class="{
                        'week-empty': !weekNumbers[keyOf(theme.theme_code, scope.row.sub_theme_code)]?.length,
                        'week-selected': weekNumbers[keyOf(theme.theme_code, scope.row.sub_theme_code)]?.length
                      }">
                        {{ weekNumbers[keyOf(theme.theme_code, scope.row.sub_theme_code)]?.length
                          ? formatWeekNumbers(weekNumbers[keyOf(theme.theme_code, scope.row.sub_theme_code)] || [])
                          : (isEnglish ? 'Click to select weeks' : '點擊選擇週次') }}
                      </div>
                    </template>
                    <div class="week-selector-popup">
                      <div class="week-checkbox-container">
                        <el-checkbox-group v-model="weekNumbers[keyOf(theme.theme_code, scope.row.sub_theme_code)]">
                          <el-checkbox v-for="week in 18" :key="week" :label="week">
                            {{ isEnglish ? 'Week' : '第' }} {{ week }} {{ isEnglish ? '' : '週' }}
                          </el-checkbox>
                        </el-checkbox-group>
                      </div>
                    </div>
                  </el-popover>
                </template>
              </el-table-column>

              <el-table-column :label="isEnglish ? 'Action' : '操作'" width="80" fixed="right">
                <template #default="scope">
                  <el-button type="danger" size="small" :icon="Delete" circle
                    @click="removeSubTheme(theme.theme_code, scope.row)" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 未選擇的項目列表 -->
          <div class="unselected-section" :class="{ 'is-english': isEnglish }"
            v-if="(unselectedSubThemes[theme.theme_code] || []).length > 0">
            <h4>{{ isEnglish ? 'Unselected Items' : '未選擇項目' }}</h4>
            <div class="unselected-list">
              <el-tag v-for="subTheme in unselectedSubThemes[theme.theme_code]" :key="subTheme.sub_theme_code"
                class="unselected-item" @click="addSubTheme(theme.theme_code, subTheme)" effect="plain">
                <el-icon>
                  <Plus />
                </el-icon>
                {{ isEnglish ? subTheme.sub_theme_english_name : subTheme.sub_theme_name }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.test-course-form {
  padding: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.legend-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.legend-container {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid;
  flex-shrink: 0;
}

.legend-color.theme-empty {
  border-color: #ff9800;
  background-color: #fff3e0;
}

.legend-color.theme-completed {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.legend-color.theme-saved {
  border-color: #4caf50;
  background-color: #e8f5e9;
}

.themes-container {
  margin-top: 20px;
}

.theme-card {
  margin-bottom: 20px;
  border-radius: 16px;
  transition: all 0.3s ease;
}

/* 橘色 - 未填寫任何細項 */
.theme-empty {
  border: 2px solid #ff9800;
  background-color: #fff3e0;
}

.theme-empty :deep(.el-card__header) {
  background-color: #ffe0b2;
  border-bottom: 1px solid #ffb74d;
}

/* 淺藍色 - 前端已完成填寫但尚未儲存 */
.theme-completed {
  border: 2px solid #2196f3;
  background-color: #e3f2fd;
}

.theme-completed :deep(.el-card__header) {
  background-color: #bbdefb;
  border-bottom: 1px solid #64b5f6;
}

/* 綠色 - 後端已儲存 */
.theme-saved {
  border: 2px solid #4caf50;
  background-color: #e8f5e9;
}

.theme-saved :deep(.el-card__header) {
  background-color: #c8e6c9;
  border-bottom: 1px solid #81c784;
}

/* 部分填寫 - 橘色（表示有未完成的項目） */
.theme-partial {
  border: 2px solid #ff9800;
  background-color: #fff3e0;
}

.theme-partial :deep(.el-card__header) {
  background-color: #ffe0b2;
  border-bottom: 1px solid #ffb74d;
}

.theme-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.expand-icon {
  transition: transform 0.3s ease;
  font-size: 20px;
}

.expand-icon.is-expanded {
  transform: rotate(90deg);
}

/* 優化卡片標題圓角 */
:deep(.el-card__header) {
  border-radius: 14px 14px 0 0;
}

.theme-content {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  align-items: flex-start;
  min-height: 0;
}

.selected-section {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.unselected-section {
  width: 250px;
  flex-shrink: 0;
  min-width: 250px;
  align-self: flex-start;
}

.unselected-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #606266;
  font-size: 16px;
}

.unselected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unselected-item {
  cursor: pointer;
  transition: all 0.3s;
  width: 100% !important;
  box-sizing: border-box;
  height: auto !important;
  min-height: auto !important;
  padding: 8px 12px !important;
  white-space: normal !important;
  word-break: break-word;
  display: flex !important;
  align-items: flex-start;
  line-height: 1.5;
}

.unselected-item :deep(.el-tag__content) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.5;
  width: 100%;
  flex: 1;
  font-size: 15px;
}

.unselected-item :deep(.el-icon) {
  flex-shrink: 0;
  margin-top: 0;
  line-height: 1.5;
  align-self: flex-start;
}

.unselected-item:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

/* Slider 樣式調整 */
:deep(.el-slider__marks-text) {
  font-size: 16px;
  color: #909399;
}

:deep(.el-slider__stop) {
  background-color: #dcdfe6;
}

/* 週次選擇器樣式 */
.week-display-button {
  font-size: 15px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

/* 已選擇週次 - 藍色 */
.week-display-button.week-selected {
  color: #409eff;
  background-color: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.week-display-button.week-selected:hover {
  background-color: #d9ecff;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

/* 未選擇週次 - 玫瑰金色 */
.week-display-button.week-empty {
  color: #b76e79;
  background-color: #fce4ec;
  border: 1px solid #f8bbd0;
}

.week-display-button.week-empty:hover {
  background-color: #f8bbd0;
  border-color: #f06292;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(183, 110, 121, 0.2);
}

.week-selector-popup {
  padding: 12px;
}

.week-checkbox-container {
  max-height: 360px;
  overflow-y: auto;
}

.week-checkbox-container :deep(.el-checkbox-group) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.week-checkbox-container :deep(.el-checkbox) {
  margin-right: 0;
  white-space: nowrap;
}

.week-checkbox-container :deep(.el-checkbox__label) {
  font-size: 14px;
  padding-left: 8px;
}

.sub-theme-content {
  white-space: normal;
  word-break: break-word;
  line-height: 1.6;
  color: #606266;
}

/* 皇冠圖示樣式 */
.crown-icon {
  font-size: 24px;
  color: #dcdfe6;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.crown-icon:hover {
  transform: scale(1.2);
  color: #f5a623;
}

.crown-icon.is-most-relevant {
  color: #f5a623;
  filter: drop-shadow(0 2px 4px rgba(245, 166, 35, 0.4));
}

.crown-icon.is-most-relevant:hover {
  color: #d48806;
  transform: scale(1.3);
}

/* 英文模式下增加未選擇項目區域寬度 */
.unselected-section.is-english {
  width: 300px;
  min-width: 300px;
}

/* 響應式設計 */
@media (max-width: 1200px) {
  .theme-content {
    flex-direction: column;
  }

  .unselected-section {
    width: 100% !important;
    min-width: 100% !important;
  }

  .unselected-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
