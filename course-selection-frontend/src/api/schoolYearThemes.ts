import request from './request'

// 學年期主題設定相關 API

export interface SchoolYearThemeSetting {
  id?: string // UUID
  academic_year: number
  academic_term: number
  coures_themes_id?: string // UUID - 主題 ID
  theme_id?: string // UUID - 主題 ID（與 coures_themes_id 相同）
  theme_code: string
  theme_name: string
  fill_in_week_enabled: boolean
  scale_max: number
  select_most_relevant_sub_theme_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export interface SchoolYearThemeSettingCreateRequest {
  academic_year: number
  academic_term: number
  theme_code: string
  fill_in_week_enabled?: boolean
  scale_max: number
  select_most_relevant_sub_theme_enabled?: boolean
}

export interface SchoolYearThemeSettingUpdateRequest {
  fill_in_week_enabled?: boolean
  scale_max?: number
  select_most_relevant_sub_theme_enabled?: boolean
}

export interface SchoolYearThemeSettingListResponse {
  settings: SchoolYearThemeSetting[]
}

export interface SchoolYearThemeSettingResponse {
  id?: string // UUID
  academic_year: number
  academic_term: number
  coures_themes_id?: string // UUID - 主題 ID
  theme_id?: string // UUID - 主題 ID（與 coures_themes_id 相同）
  theme_code: string
  theme_name: string
  fill_in_week_enabled: boolean
  scale_max: number
  select_most_relevant_sub_theme_enabled?: boolean
  created_at?: string
  updated_at?: string
}

// 查詢學年期所有主題設定
export const getSchoolYearThemeSettings = (academicYear: number, academicTerm: number): Promise<SchoolYearThemeSettingListResponse> => {
  return request.get(`/school-year-theme-settings/${academicYear}/${academicTerm}`)
}

// 查詢單一學年期主題設定（使用 settingId）
export const getSchoolYearThemeSetting = (settingId: string): Promise<SchoolYearThemeSettingResponse> => {
  return request.get(`/school-year-theme-settings/${settingId}`)
}

// 創建學年期主題設定
export const createSchoolYearThemeSetting = (data: SchoolYearThemeSettingCreateRequest): Promise<SchoolYearThemeSettingResponse> => {
  return request.post('/school-year-theme-settings', data)
}

// 更新學年期主題設定（使用 settingId）
export const updateSchoolYearThemeSetting = (settingId: string, data: SchoolYearThemeSettingUpdateRequest): Promise<SchoolYearThemeSettingResponse> => {
  return request.put(`/school-year-theme-settings/${settingId}`, data)
}

// 刪除學年期主題設定（使用 settingId）
export const deleteSchoolYearThemeSetting = (settingId: string): Promise<void> => {
  return request.delete(`/school-year-theme-settings/${settingId}`)
}
