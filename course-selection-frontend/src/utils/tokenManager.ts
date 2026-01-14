import CryptoJS from 'crypto-js'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

interface TokenData {
  userId: string
  token: string
  expiresAt: number // 過期時間戳記（毫秒）
  isExternalLogin: boolean // 標記是否為外部登入
}

class TokenManager {
  private userId: string | null = null
  private token: string | null = null
  private expiresAt: number | null = null
  private isExternalLogin: boolean = false
  private readonly baseURL = API_BASE_URL
  private readonly TOKEN_LIFETIME = 30 * 60 * 1000 // 30 分鐘（毫秒）

  /**
   * 生成 token
   * @param userId 用戶 ID
   * @returns MD5(userId + 'nchu' + 年月日)
   */
  generateToken(userId: string): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const content = userId + 'nchu' + dateStr
    return CryptoJS.MD5(content).toString()
  }

  /**
   * 設定用戶並生成 token（外部登入）
   * @param userId 用戶 ID
   * @param isExternal 是否為外部登入
   */
  setUser(userId: string, isExternal: boolean = true): void {
    this.userId = userId
    this.token = this.generateToken(userId)
    this.expiresAt = Date.now() + this.TOKEN_LIFETIME
    this.isExternalLogin = isExternal

    // 儲存到 localStorage
    const tokenData: TokenData = {
      userId: this.userId,
      token: this.token,
      expiresAt: this.expiresAt,
      isExternalLogin: this.isExternalLogin
    }
    localStorage.setItem('tokenData', JSON.stringify(tokenData))
  }

  /**
   * 從 localStorage 載入
   * @returns 是否成功載入
   */
  loadFromStorage(): boolean {
    try {
      const tokenDataStr = localStorage.getItem('tokenData')
      if (!tokenDataStr) return false

      const tokenData: TokenData = JSON.parse(tokenDataStr)

      // 檢查是否過期
      if (Date.now() > tokenData.expiresAt) {
        console.log('Token expired locally')
        this.clear()
        return false
      }

      this.userId = tokenData.userId
      this.token = tokenData.token
      this.expiresAt = tokenData.expiresAt
      this.isExternalLogin = tokenData.isExternalLogin || false

      return true
    } catch (error) {
      console.error('Failed to load token from storage:', error)
      this.clear()
      return false
    }
  }

  /**
   * 驗證 token（包含過期檢查）
   * @returns token 是否有效
   */
  async verify(): Promise<boolean> {
    // 1. 先檢查本地是否過期
    if (!this.userId || !this.token || !this.expiresAt) {
      return false
    }

    if (Date.now() > this.expiresAt) {
      console.log('Token expired locally')
      this.clear()
      return false
    }

    // 2. 向後端驗證
    try {
      const response = await axios.post(`${this.baseURL}/token/verify`, {
        user_id: this.userId,
        token: this.token
      })

      const isValid = response.data?.result?.valid === true

      if (!isValid) {
        this.clear()
      }

      return isValid
    } catch (error) {
      console.error('Token verification failed:', error)
      this.clear()
      return false
    }
  }

  /**
   * 更新過期時間（延長 session）
   */
  refreshExpiry(): void {
    if (this.userId && this.token) {
      this.expiresAt = Date.now() + this.TOKEN_LIFETIME
      const tokenData: TokenData = {
        userId: this.userId,
        token: this.token,
        expiresAt: this.expiresAt,
        isExternalLogin: this.isExternalLogin
      }
      localStorage.setItem('tokenData', JSON.stringify(tokenData))
    }
  }

  /**
   * 清除認證資料
   */
  clear(): void {
    this.userId = null
    this.token = null
    this.expiresAt = null
    this.isExternalLogin = false
    localStorage.removeItem('tokenData')
    // 清除舊格式的資料（如果存在）
    localStorage.removeItem('userId')
    localStorage.removeItem('token')
  }

  /**
   * 取得認證資料（用於 API 請求）
   * @returns { user_id, token }
   */
  getAuthData(): { user_id: string; token: string } | null {
    // 檢查是否過期
    if (!this.userId || !this.token || !this.expiresAt) {
      return null
    }

    if (Date.now() > this.expiresAt) {
      this.clear()
      return null
    }

    return {
      user_id: this.userId,
      token: this.token
    }
  }

  /**
   * 取得剩餘時間（秒）
   */
  getTimeRemaining(): number {
    if (!this.expiresAt) return 0
    const remaining = Math.floor((this.expiresAt - Date.now()) / 1000)
    return Math.max(0, remaining)
  }

  /**
   * 檢查是否為外部登入
   */
  isExternalLoginSession(): boolean {
    return this.isExternalLogin
  }

  /**
   * 檢查是否已登入且未過期
   */
  isAuthenticated(): boolean {
    if (!this.userId || !this.token || !this.expiresAt) {
      return false
    }
    return Date.now() <= this.expiresAt
  }

  /**
   * 取得用戶 ID
   */
  getUserId(): string | null {
    return this.userId
  }

  /**
   * 取得 token
   */
  getToken(): string | null {
    return this.token
  }
}

export default new TokenManager()
