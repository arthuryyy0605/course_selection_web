import axios from 'axios'
import { ElMessage } from 'element-plus'
import tokenManager from '../utils/tokenManager'
import { API_BASE_URL } from '../config/api'

// 建立 axios 實例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// 請求攔截器
request.interceptors.request.use(
  (config) => {
    // 為 POST/PUT/DELETE 請求自動加入 user_id 和 token
    const method = config.method?.toUpperCase()
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      const authData = tokenManager.getAuthData()
      if (!authData) {
        // 如果沒有認證資料，拒絕請求
        ElMessage.error('認證失敗，請重新登入')
        return Promise.reject(new Error('認證資料不存在，請重新登入'))
      }

      // 確保 config.data 是一個對象
      if (!config.data || typeof config.data !== 'object') {
        config.data = {}
      }

      // 如果是 DELETE 請求，需要將 token 資料放在 data 中
      if (method === 'DELETE') {
        config.data = {
          ...authData,
          ...config.data
        }
      } else {
        // POST/PUT 請求將 token 資料合併到 data 中
        config.data = {
          ...config.data,
          ...authData
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 響應攔截器
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 處理 401 錯誤，清除 token 並導向首頁
    if (error.response?.status === 401) {
      ElMessage.error('認證失敗，請重新登入')
      tokenManager.clear()
      // 導向首頁
      window.location.href = '/'
      return Promise.reject(error)
    }

    const message = error.response?.data?.detail || error.response?.data?.message || error.message || '請求失敗'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request
