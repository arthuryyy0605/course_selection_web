/**
 * API 配置
 * 根據環境變數自動切換 API 基礎 URL
 *
 * 開發環境：
 * - 如果設定了 VITE_API_BASE_URL，則使用該值
 * - 否則預設使用 http://localhost:8000/api
 *
 * 生產環境：
 * - 始終使用 https://140.120.3.145/api
 */

// 從環境變數讀取 API 基礎 URL（僅在開發環境生效）
const envApiUrl = import.meta.env.VITE_API_BASE_URL

// 根據環境決定 API 基礎 URL
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://140.120.3.145/api'  // 生產環境固定使用線上 API
  : envApiUrl || 'http://localhost:8000/api'  // 開發環境：優先使用環境變數，否則使用 localhost

