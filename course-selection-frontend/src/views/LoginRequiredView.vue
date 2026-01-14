<template>
  <div class="login-required-container">
    <el-card class="login-card">
      <div class="content">
        <el-icon class="icon" :size="80" color="#E6A23C">
          <Lock />
        </el-icon>
        <h1>需要登入</h1>
        <p class="message">您的登入已過期或尚未登入</p>
        <p class="sub-message">請從外部系統重新進入本系統</p>
        
        <div class="info-box">
          <el-alert
            title="提示"
            type="info"
            :closable="false"
            show-icon
          >
            <p>本系統需要透過外部系統進行認證。</p>
            <p>請返回外部系統並重新點擊進入連結。</p>
          </el-alert>
        </div>

        <!-- 開發環境測試連結 -->
        <div v-if="isDevelopment" class="dev-section">
          <el-divider>開發測試</el-divider>
          <p class="dev-hint">以下為測試用登入連結：</p>
          <div class="test-links">
            <el-button type="primary" @click="testLogin('test_user')">
              <el-icon><User /></el-icon>
              測試用戶登入
            </el-button>
            <el-button type="success" @click="testLogin('admin')">
              <el-icon><UserFilled /></el-icon>
              管理員登入
            </el-button>
          </div>
          <el-input
            v-model="customUserId"
            placeholder="自訂用戶 ID"
            class="custom-input"
            @keyup.enter="testLogin(customUserId)"
          >
            <template #append>
              <el-button @click="testLogin(customUserId)">登入</el-button>
            </template>
          </el-input>
        </div>

        <!-- 系統資訊 -->
        <div class="system-info">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="系統名稱">課程選擇系統</el-descriptions-item>
            <el-descriptions-item label="認證方式">外部系統 Token</el-descriptions-item>
            <el-descriptions-item label="Session 有效期">30 分鐘</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Lock, User, UserFilled } from '@element-plus/icons-vue'
import tokenManager from '../utils/tokenManager'

// 檢查是否為開發環境
const isDevelopment = computed(() => {
  return import.meta.env.MODE === 'development' || import.meta.env.DEV
})

// 自訂用戶 ID
const customUserId = ref('')

/**
 * 測試登入功能（僅開發環境）
 */
const testLogin = (userId: string) => {
  if (!userId) {
    return
  }

  // 生成測試 token
  const token = tokenManager.generateToken(userId)
  
  // 構建測試登入 URL
  const baseUrl = window.location.origin
  const loginUrl = `${baseUrl}/?user_id=${encodeURIComponent(userId)}&token=${token}`
  
  // 導向測試 URL
  window.location.href = loginUrl
}
</script>

<style scoped>
.login-required-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  max-width: 600px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.content {
  text-align: center;
  padding: 20px;
}

.icon {
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

h1 {
  font-size: 32px;
  color: #2c3e50;
  margin: 20px 0 10px;
  font-weight: 700;
}

.message {
  font-size: 18px;
  color: #606266;
  margin: 10px 0;
}

.sub-message {
  font-size: 14px;
  color: #909399;
  margin-bottom: 30px;
}

.info-box {
  margin: 30px 0;
  text-align: left;
}

.info-box :deep(.el-alert__description) p {
  margin: 5px 0;
  line-height: 1.6;
}

.dev-section {
  margin-top: 40px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.dev-hint {
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
}

.test-links {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 15px;
}

.test-links .el-button {
  flex: 1;
}

.custom-input {
  margin-top: 10px;
}

.system-info {
  margin-top: 30px;
}

.system-info :deep(.el-descriptions__label) {
  width: 120px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .login-card {
    max-width: 100%;
  }

  h1 {
    font-size: 24px;
  }

  .message {
    font-size: 16px;
  }

  .test-links {
    flex-direction: column;
  }
}
</style>

