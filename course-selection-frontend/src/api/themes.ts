import request from './request'

// 主題相關 API

export interface Theme {
  id: string // UUID
  theme_code: string
  theme_name: string
  theme_short_name: string
  theme_english_name: string
  chinese_link?: string
  english_link?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface ThemeCreateRequest {
  theme_code: string
  theme_name: string
  theme_short_name: string
  theme_english_name: string
  chinese_link?: string
  english_link?: string
}

export interface ThemeUpdateRequest {
  theme_code?: string // 可修改
  theme_name?: string
  theme_short_name?: string
  theme_english_name?: string
  chinese_link?: string
  english_link?: string
}

export interface ThemeListResponse {
  result: {
    themes: Theme[]
  }
}

export interface ThemeCreateResponse {
  result: {
    id: string // UUID
    theme_code: string
    theme_name: string
    message: string
  }
}

export interface ThemeUpdateResponse {
  result: {
    id: string // UUID
    theme_code: string
    theme_name: string
    message: string
  }
}

export interface ThemeDeleteResponse {
  result: {
    id: string // UUID
    theme_code: string
    message: string
  }
}

// 獲取所有主題
export const getThemes = (): Promise<ThemeListResponse> => {
  return request.get('/themes/')
}

// 根據 ID 獲取單一主題
export const getThemeById = (themeId: string): Promise<{ result: Theme }> => {
  return request.get(`/themes/${themeId}`)
}

// 創建主題
export const createTheme = (data: ThemeCreateRequest): Promise<ThemeCreateResponse> => {
  return request.post('/themes/', data)
}

// 更新主題（使用 themeId）
export const updateTheme = (themeId: string, data: ThemeUpdateRequest): Promise<ThemeUpdateResponse> => {
  return request.put(`/themes/${themeId}`, data)
}

// 刪除主題（使用 themeId）
export const deleteTheme = (themeId: string): Promise<ThemeDeleteResponse> => {
  return request.delete(`/themes/${themeId}`)
}
