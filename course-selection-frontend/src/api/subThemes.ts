import request from './request'

// 子主題相關 API

export interface SubTheme {
  id: string // UUID
  coures_themes_id: string // UUID - 主題 ID
  theme_code: string
  sub_theme_code: string
  sub_theme_name: string
  sub_theme_english_name: string
  sub_theme_content?: string
  sub_theme_english_content?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface SubThemeCreateRequest {
  coures_themes_id: string // 主題 ID (UUID)
  sub_theme_code: string
  sub_theme_name: string
  sub_theme_english_name: string
  sub_theme_content?: string
  sub_theme_english_content?: string
}

export interface SubThemeUpdateRequest {
  coures_themes_id?: string // 主題 ID (UUID)，可修改
  sub_theme_code?: string // 可修改
  sub_theme_name?: string
  sub_theme_english_name?: string
  sub_theme_content?: string
  sub_theme_english_content?: string
}

export interface SubThemeListResponse {
  result: {
    sub_themes: SubTheme[]
  }
}

export interface SubThemeCreateResponse {
  result: {
    id: string // UUID
    theme_code: string
    sub_theme_code: string
    sub_theme_name: string
    message: string
  }
}

export interface SubThemeUpdateResponse {
  result: {
    id: string // UUID
    theme_code: string
    sub_theme_code: string
    sub_theme_name: string
    message: string
  }
}

export interface SubThemeDeleteResponse {
  result: {
    id: string // UUID
    sub_theme_code: string
    message: string
  }
}

// 獲取所有子主題
export const getSubThemes = (): Promise<SubThemeListResponse> => {
  return request.get('/sub_themes/')
}

// 根據主題 ID 獲取子主題
export const getSubThemesByTheme = (themeId: string): Promise<SubThemeListResponse> => {
  return request.get(`/sub_themes/by_theme/${themeId}`)
}

// 根據 ID 獲取單一子主題
export const getSubThemeById = (subThemeId: string): Promise<{ result: SubTheme }> => {
  return request.get(`/sub_themes/${subThemeId}`)
}

// 創建子主題
export const createSubTheme = (data: SubThemeCreateRequest): Promise<SubThemeCreateResponse> => {
  return request.post('/sub_themes/', data)
}

// 更新子主題（使用 subThemeId）
export const updateSubTheme = (subThemeId: string, data: SubThemeUpdateRequest): Promise<SubThemeUpdateResponse> => {
  return request.put(`/sub_themes/${subThemeId}`, data)
}

// 刪除子主題（使用 subThemeId）
export const deleteSubTheme = (subThemeId: string): Promise<SubThemeDeleteResponse> => {
  return request.delete(`/sub_themes/${subThemeId}`)
}
