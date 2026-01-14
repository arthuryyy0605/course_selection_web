<template>
  <div class="subthemes-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>
                <el-button type="text" @click="goBack">主題管理</el-button>
              </el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentTheme?.theme_name || '子主題管理' }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon>
              <Plus />
            </el-icon>
            新增子主題
          </el-button>
        </div>
      </template>

      <div v-if="currentTheme" class="theme-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="主題代碼">{{ currentTheme.theme_code }}</el-descriptions-item>
          <el-descriptions-item label="主題名稱">{{ currentTheme.theme_name }}</el-descriptions-item>
          <el-descriptions-item label="主題簡稱">{{ currentTheme.theme_short_name }}</el-descriptions-item>
          <el-descriptions-item label="主題英文名稱">{{ currentTheme.theme_english_name }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-table v-loading="loading" :data="subThemes" style="width: 100%; margin-top: 20px" stripe>
        <el-table-column prop="sub_theme_code" label="子主題代碼" width="120" />
        <el-table-column prop="sub_theme_name" label="子主題名稱" min-width="150" />
        <el-table-column prop="sub_theme_english_name" label="子主題英文名稱" min-width="200" />
        <el-table-column prop="sub_theme_content" label="子主題內容" min-width="300" />
        <el-table-column prop="sub_theme_english_content" label="子主題英文內容" min-width="300" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="warning" size="small" @click="editSubTheme(scope.row)">
              編輯
            </el-button>
            <el-button type="danger" size="small" @click="deleteSubTheme(scope.row)">
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/編輯子主題對話框 -->
    <el-dialog v-model="showCreateDialog" :title="editingSubTheme ? '編輯子主題' : '新增子主題'" width="600px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="子主題代碼" prop="sub_theme_code">
          <el-input v-model="form.sub_theme_code" placeholder="請輸入子主題代碼" />
        </el-form-item>
        <el-form-item label="子主題名稱" prop="sub_theme_name">
          <el-input v-model="form.sub_theme_name" placeholder="請輸入子主題名稱" />
        </el-form-item>
        <el-form-item label="子主題英文名稱" prop="sub_theme_english_name">
          <el-input v-model="form.sub_theme_english_name" placeholder="請輸入子主題英文名稱" />
        </el-form-item>
        <el-form-item label="子主題內容" prop="sub_theme_content">
          <el-input v-model="form.sub_theme_content" type="textarea" :rows="4" placeholder="請輸入子主題內容" />
        </el-form-item>
        <el-form-item label="子主題英文內容" prop="sub_theme_english_content">
          <el-input v-model="form.sub_theme_english_content" type="textarea" :rows="4" placeholder="請輸入子主題英文內容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ editingSubTheme ? '更新' : '創建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSubThemesByTheme, createSubTheme, updateSubTheme, deleteSubTheme as deleteSubThemeApi, type SubTheme, type SubThemeCreateRequest } from '../api/subThemes'
import { getThemes, type Theme } from '../api/themes'

const route = useRoute()
const router = useRouter()

// 響應式數據
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const editingSubTheme = ref<SubTheme | null>(null)
const subThemes = ref<SubTheme[]>([])
const themes = ref<Theme[]>([])

// 計算屬性
const themeCode = computed(() => route.params.theme_code as string)
const currentTheme = computed(() => themes.value.find(theme => theme.theme_code === themeCode.value))

// 表單數據
const form = reactive<SubThemeCreateRequest>({
  coures_themes_id: '',
  sub_theme_code: '',
  sub_theme_name: '',
  sub_theme_english_name: '',
  sub_theme_content: '',
  sub_theme_english_content: ''
})

// 表單驗證規則
const rules: FormRules = {
  sub_theme_code: [
    { required: true, message: '請輸入子主題代碼', trigger: 'blur' }
  ],
  sub_theme_name: [
    { required: true, message: '請輸入子主題名稱', trigger: 'blur' }
  ],
  sub_theme_english_name: [
    { required: true, message: '請輸入子主題英文名稱', trigger: 'blur' }
  ]
}

const formRef = ref<FormInstance>()

// 獲取主題列表
const fetchThemes = async () => {
  try {
    const response = await getThemes()
    themes.value = response.result.themes
  } catch (error) {
    console.error('獲取主題列表失敗:', error)
  }
}

// 獲取子主題列表
const fetchSubThemes = async () => {
  try {
    loading.value = true
    // 先通過 themeCode 找到 themeId
    const currentTheme = themes.value.find(t => t.theme_code === themeCode.value)
    if (!currentTheme?.id) {
      ElMessage.error('找不到主題 ID')
      return
    }
    const response = await getSubThemesByTheme(currentTheme.id)
    subThemes.value = response.result.sub_themes
  } catch (error) {
    console.error('獲取子主題列表失敗:', error)
  } finally {
    loading.value = false
  }
}

// 返回主題列表
const goBack = () => {
  router.push('/themes')
}

// 編輯子主題
const editSubTheme = (subTheme: SubTheme) => {
  editingSubTheme.value = subTheme
  Object.assign(form, {
    coures_themes_id: subTheme.coures_themes_id,
    sub_theme_code: subTheme.sub_theme_code,
    sub_theme_name: subTheme.sub_theme_name,
    sub_theme_english_name: subTheme.sub_theme_english_name,
    sub_theme_content: subTheme.sub_theme_content,
    sub_theme_english_content: subTheme.sub_theme_english_content
  })
  showCreateDialog.value = true
}

// 刪除子主題
const deleteSubTheme = async (subTheme: SubTheme) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除子主題「${subTheme.sub_theme_name}」嗎？`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteSubThemeApi(subTheme.id)
    ElMessage.success('刪除成功')
    fetchSubThemes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('刪除子主題失敗:', error)
    }
  }
}

// 提交表單
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 獲取當前主題的 ID
    const themeId = currentTheme.value?.id
    if (!themeId) {
      ElMessage.error('找不到主題 ID')
      return
    }

    if (editingSubTheme.value) {
      // 更新子主題
      await updateSubTheme(editingSubTheme.value.id, {
        coures_themes_id: form.coures_themes_id,
        sub_theme_code: form.sub_theme_code,
        sub_theme_name: form.sub_theme_name,
        sub_theme_english_name: form.sub_theme_english_name,
        sub_theme_content: form.sub_theme_content,
        sub_theme_english_content: form.sub_theme_english_content
      })
      ElMessage.success('更新成功')
    } else {
      // 創建子主題
      await createSubTheme({
        coures_themes_id: themeId,
        sub_theme_code: form.sub_theme_code,
        sub_theme_name: form.sub_theme_name,
        sub_theme_english_name: form.sub_theme_english_name,
        sub_theme_content: form.sub_theme_content,
        sub_theme_english_content: form.sub_theme_english_content
      })
      ElMessage.success('創建成功')
    }

    showCreateDialog.value = false
    fetchSubThemes()
  } catch (error) {
    console.error('提交失敗:', error)
  } finally {
    submitting.value = false
  }
}

// 重置表單
const resetForm = () => {
  editingSubTheme.value = null
  Object.assign(form, {
    coures_themes_id: currentTheme.value?.id || '',
    sub_theme_code: '',
    sub_theme_name: '',
    sub_theme_english_name: '',
    sub_theme_content: '',
    sub_theme_english_content: ''
  })
  formRef.value?.clearValidate()
}

// 組件掛載時獲取數據
onMounted(async () => {
  await fetchThemes()
  await fetchSubThemes()
})
</script>

<style scoped>
.subthemes-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb :deep(.el-breadcrumb) {
  display: flex;
  align-items: center;
}

.breadcrumb :deep(.el-breadcrumb-item) {
  display: flex;
  align-items: center;
}

.breadcrumb :deep(.el-button) {
  padding: 0;
  height: auto;
  vertical-align: baseline;
}

.theme-info {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 讓表格單元格文字自動換行 */
:deep(.el-table__cell) {
  word-break: break-word;
  white-space: normal;
  line-height: 1.6;
}

:deep(.el-table td) {
  padding: 12px 0;
}
</style>
