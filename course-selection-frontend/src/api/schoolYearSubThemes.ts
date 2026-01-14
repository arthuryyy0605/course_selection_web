import request from './request'

// 學年期子主題設定相關 API

export interface SchoolYearSubThemeSetting {
  id?: string // UUID
  academic_year: number
  academic_term: number
  coures_sub_themes_id?: string // UUID - 細項主題 ID
  sub_theme_id?: string // UUID - 細項主題 ID（與 coures_sub_themes_id 相同）
  coures_themes_id?: string // UUID - 主題 ID
  theme_code: string
  sub_theme_code: string
  sub_theme_name: string
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface SchoolYearSubThemeSettingCreateRequest {
  academic_year: number
  academic_term: number
  theme_code: string
  sub_theme_code: string
  enabled?: boolean
}

export interface SchoolYearSubThemeSettingUpdateRequest {
  enabled: boolean
}

export interface SchoolYearSubThemeSettingListResponse {
  settings: SchoolYearSubThemeSetting[]
}

export interface SchoolYearSubThemeSettingResponse {
  id?: string // UUID
  academic_year: number
  academic_term: number
  coures_sub_themes_id?: string // UUID - 細項主題 ID
  sub_theme_id?: string // UUID - 細項主題 ID（與 coures_sub_themes_id 相同）
  coures_themes_id?: string // UUID - 主題 ID
  theme_code: string
  sub_theme_code: string
  sub_theme_name: string
  enabled: boolean
  created_at?: string
  updated_at?: string
}

// 查詢單一學年期細項設定（使用 settingId）
export const getSchoolYearSubThemeSetting = (settingId: string): Promise<SchoolYearSubThemeSettingResponse> => {
  return request.get(`/school-year-sub-theme-settings/${settingId}`)
}

// 查詢學年期主題下所有細項設定（使用 themeId）
export const getSchoolYearSubThemeSettings = (academicYear: number, academicTerm: number, themeId: string): Promise<SchoolYearSubThemeSettingListResponse> => {
  return request.get(`/school-year-sub-theme-settings/${academicYear}/${academicTerm}/${themeId}`)
}

// 創建學年期細項設定
export const createSchoolYearSubThemeSetting = (data: SchoolYearSubThemeSettingCreateRequest): Promise<SchoolYearSubThemeSettingResponse> => {
  return request.post('/school-year-sub-theme-settings', data)
}

// 更新學年期細項設定（使用 settingId）
export const updateSchoolYearSubThemeSetting = (settingId: string, data: SchoolYearSubThemeSettingUpdateRequest): Promise<SchoolYearSubThemeSettingResponse> => {
  return request.put(`/school-year-sub-theme-settings/${settingId}`, data)
}

// 刪除學年期細項設定（使用 settingId）
export const deleteSchoolYearSubThemeSetting = (settingId: string): Promise<void> => {
  return request.delete(`/school-year-sub-theme-settings/${settingId}`)
}
