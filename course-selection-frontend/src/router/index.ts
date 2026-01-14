import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import tokenManager from '../utils/tokenManager'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/themes',
    },
    {
      path: '/login-required',
      name: 'login-required',
      component: () => import('../views/LoginRequiredView.vue'),
      meta: { requiresAuth: false } // 不需要認證
    },
    {
      path: '/themes',
      name: 'themes',
      component: () => import('../views/ThemesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/themes/:theme_code/subtopics',
      name: 'subthemes',
      component: () => import('../views/SubThemesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/school-year-themes',
      name: 'school-year-themes',
      component: () => import('../views/SchoolYearThemesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/school-year-themes/:academic_year/:academic_term/:theme_code/subtopics',
      name: 'school-year-subthemes',
      component: () => import('../views/SchoolYearSubThemesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/test',
      name: 'test-courses',
      component: () => import('../views/TestCoursesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/test/:course_id/:academic_year/:academic_term',
      name: 'test-course-form',
      component: () => import('../views/TestCourseFormView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// 導航守衛：處理認證和 token 驗證
router.beforeEach(async (to, from, next) => {
  const { user_id, token } = to.query

  // 1. 如果 URL 包含 user_id 和 token（外部登入）
  if (user_id && token) {
    try {
      // 標記為外部登入
      tokenManager.setUser(user_id as string, true)

      // 驗證 token
      const isValid = await tokenManager.verify()

      if (isValid) {
        ElMessage.success('登入成功')
        // 移除 URL 參數並重新導向到當前路徑
        const targetPath = to.path === '/' ? '/themes' : to.path
        next({ path: targetPath, query: {} })
      } else {
        ElMessage.error('Token 驗證失敗')
        tokenManager.clear()
        next('/login-required')
      }
      return
    } catch (error) {
      console.error('Token 驗證過程發生錯誤:', error)
      ElMessage.error('驗證過程發生錯誤')
      tokenManager.clear()
      next('/login-required')
      return
    }
  }

  // 2. 檢查路由是否需要認證
  if (to.meta.requiresAuth !== false) {
    // 嘗試從 localStorage 載入
    if (!tokenManager.isAuthenticated()) {
      const loaded = tokenManager.loadFromStorage()

      if (!loaded) {
        // 沒有 token 或已過期
        ElMessage.warning('請先登入')
        next('/login-required')
        return
      }
    }

    // 3. 驗證 token 是否有效
    try {
      const isValid = await tokenManager.verify()

      if (!isValid) {
        ElMessage.error('登入已過期，請重新登入')
        next('/login-required')
        return
      }

      // 4. 驗證成功，更新過期時間（延長 session）
      tokenManager.refreshExpiry()

      // 5. 顯示剩餘時間提示（可選）
      const timeRemaining = tokenManager.getTimeRemaining()
      if (timeRemaining < 5 * 60 && timeRemaining > 0) { // 少於 5 分鐘
        console.warn(`Token 將在 ${Math.floor(timeRemaining / 60)} 分鐘後過期`)
      }

      next()
    } catch (error) {
      console.error('認證檢查失敗:', error)
      ElMessage.error('認證檢查失敗，請重新登入')
      tokenManager.clear()
      next('/login-required')
    }
  } else {
    // 不需要認證的頁面
    next()
  }
})

export default router
