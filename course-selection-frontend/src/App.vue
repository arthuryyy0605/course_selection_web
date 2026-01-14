<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Grid, Calendar, Document } from '@element-plus/icons-vue'

// Tab routing control
const route = useRoute()
const router = useRouter()

// Map route.path to tab name
const routeToTab = (path: string): string => {
  if (path.startsWith('/school-year-themes')) return '/school-year-themes'
  if (path.startsWith('/test')) return '/test'
  return '/themes'
}

const activeTab = ref(routeToTab(route.path))

// 判斷是否需要顯示 header（排除課程編輯表單頁面）
const shouldShowHeader = ref(!route.path.match(/^\/test\/[^/]+\/[^/]+\/[^/]+$/))

watch(
  () => route.path,
  (newPath) => {
    shouldShowHeader.value = !newPath.match(/^\/test\/[^/]+\/[^/]+\/[^/]+$/)
  }
)

watch(
  () => route.path,
  (newPath) => {
    activeTab.value = routeToTab(newPath)
  }
)

const onTabChange = (name: string) => {
  if (name && name !== routeToTab(route.path)) {
    router.push(name)
  }
}
</script>

<template>
  <div id="app">
    <el-container>
      <el-header v-if="shouldShowHeader" class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <el-icon class="logo-icon">
              <Grid />
            </el-icon>
            <h1 class="app-title">課程選擇系統</h1>
          </div>
          <el-tabs v-model="activeTab" type="card" class="top-tabs" @tab-change="onTabChange">
            <el-tab-pane label="主題管理" name="/themes">
              <template #label>
                <span class="tab-label">
                  <el-icon class="tab-icon">
                    <Grid />
                  </el-icon>
                  主題管理
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="學年期設定" name="/school-year-themes">
              <template #label>
                <span class="tab-label">
                  <el-icon class="tab-icon">
                    <Calendar />
                  </el-icon>
                  學年期設定
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="測試" name="/test">
              <template #label>
                <span class="tab-label">
                  <el-icon class="tab-icon">
                    <Document />
                  </el-icon>
                  測試
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-header>
      <el-main class="app-main">
        <RouterView />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: #f8f9fa;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  padding: 0 24px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}

.logo-icon {
  font-size: 28px;
  color: white;
}

.app-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

/* Tabs styling */
.top-tabs {
  --el-tabs-header-height: 52px;
}

.top-tabs :deep(.el-tabs__header) {
  border-bottom: none;
}

.top-tabs :deep(.el-tabs__item) {
  color: rgba(255, 255, 255, 0.85);
  background-color: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 12px 12px 0 0;
  margin: 0 4px;
  padding: 0 20px;
  height: 44px;
  line-height: 44px;
  transition: all 0.2s ease;
}

.top-tabs :deep(.el-tabs__item:hover) {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.top-tabs :deep(.el-tabs__item.is-active) {
  background-color: #fff;
  color: #667eea;
  font-weight: 600;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  font-size: 18px;
}

.app-main {
  background: transparent;
  min-height: calc(100vh - 64px);
  padding: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
  }

  .app-title {
    font-size: 20px;
  }

  .nav-menu {
    width: 100%;
    justify-content: center;
  }

  .nav-menu .el-menu-item {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 12px 16px;
  }

  .app-title {
    font-size: 18px;
  }

  .logo-icon {
    font-size: 24px;
  }
}
</style>
