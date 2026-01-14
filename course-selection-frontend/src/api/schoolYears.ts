import request from './request'
import axios from 'axios'
import tokenManager from '../utils/tokenManager'
import { API_BASE_URL } from '../config/api'

// 學年期完整資訊回應介面
export interface SchoolYearInfoResponse {
  academic_year: number
  academic_term: number
  summary: {
    total_themes: number
    total_sub_themes: number
    enabled_sub_themes: number
  }
  themes_summary: Array<{
    theme_code: string
    theme_name: string
    scale_max: number
    sub_themes_count: number
    enabled_sub_themes_count: number
  }>
  themes: Array<{
    theme_code: string
    theme_name: string
    theme_short_name: string
    theme_english_name: string
    fill_in_week_enabled: boolean
    scale_max: number
    select_most_relevant_sub_theme_enabled?: boolean
    sub_themes: Array<{
      sub_theme_id?: string | null // UUID - 細項主題 ID
      sub_theme_code: string
      sub_theme_name: string
      sub_theme_english_name: string
      sub_theme_content?: string | null
      sub_theme_english_content?: string | null
      enabled?: boolean // 啟用狀態（在載入時動態添加）
    }>
  }>
}

// 教師表單資料回應介面
export interface TeacherFormDataResponse {
  course_id: string
  ps_class_nbr?: string
  course_chinese_name: string
  course_english_name: string
  academic_year: number
  academic_term: number
  themes: Array<{
    theme_code: string
    theme_name: string
    fill_in_week_enabled: boolean
    scale_max: number
    select_most_relevant_sub_theme_enabled?: boolean
    sub_themes: Array<{
      sub_theme_code: string
      sub_theme_name: string
      sub_theme_english_name: string
      sub_theme_content?: string | null
      sub_theme_english_content?: string | null
      current_value?: string | null
      week_numbers?: number[] | null
      entry_id?: string | null // UUID - 記錄 ID（從 number 改為 string）
      is_most_relevant?: boolean
    }>
  }>
}

// 學年期完整資訊
export const getSchoolYearInfo = async (academicYear: number, academicTerm: number): Promise<SchoolYearInfoResponse> => {
  const response = await request.get(`/school-years/${academicYear}/${academicTerm}`)
  return response as unknown as SchoolYearInfoResponse
}

// 教師表單資料
export const getTeacherFormData = async (courseId: string, academicYear: number, academicTerm: number, psClassNbr?: string): Promise<TeacherFormDataResponse> => {
  let url = `/courses/${courseId}/form-data/${academicYear}/${academicTerm}`
  if (psClassNbr) {
    url += `?ps_class_nbr=${psClassNbr}`
  }
  const response = await request.get(url)
  return response as unknown as TeacherFormDataResponse
}

export type ScaleByTheme = Record<string, number>

// 複製學年期設定請求介面
// 注意：user_id 和 token 會由 request 攔截器自動添加，但為了符合 API 規範，仍需要在請求中包含
export interface CopySchoolYearSettingsRequest {
  source_academic_year: number
  source_academic_term: number
  target_academic_year: number
  target_academic_term: number
  user_id?: string  // 可選，會由攔截器自動添加
  token?: string    // 可選，會由攔截器自動添加
}

// 複製學年期設定
export const copySchoolYearSettings = async (data: Omit<CopySchoolYearSettingsRequest, 'user_id' | 'token'>): Promise<void> => {
  await request.post('/school-years/copy-settings', data)
}

// 匯出課程資訊 CSV（舊版 GET API，保留向後兼容）
export const exportCourseInfoCSV = async (academicYear: number, academicTerm: number): Promise<Blob> => {
  const authData = tokenManager.getAuthData()
  const config: {
    method: string
    url: string
    responseType: 'blob'
    timeout: number
    params?: { user_id: string; token: string }
  } = {
    method: 'GET',
    url: `${API_BASE_URL}/school-years/${academicYear}/${academicTerm}/export-csv`,
    responseType: 'blob',
    timeout: 30000, // CSV 匯出可能需要較長時間
  }

  // 如果有認證資料，添加到查詢參數中
  if (authData) {
    config.params = {
      user_id: authData.user_id,
      token: authData.token
    }
  }

  const response = await axios(config)
  return response.data
}

// 匯出課程資訊 CSV 請求介面（新版 POST API）
export interface ExportCSVRequest {
  academic_year_start: number    // 必填：學年期起（學年）
  academic_term_start: number    // 必填：學年期起（學期）
  academic_year_end: number      // 必填：學年期訖（學年）
  academic_term_end: number      // 必填：學年期訖（學期）
  department?: string            // 可選：開課單位代碼
  has_class?: string             // 可選：成班與否 (Y/N)
  theme_code?: string            // 可選：主題代碼
  sub_theme_code?: string        // 可選：細項主題代碼
}

// 匯出課程資訊 CSV（新版 POST API，支援篩選條件）
export const exportCourseInfoCSVWithFilters = async (data: ExportCSVRequest): Promise<Blob> => {
  const authData = tokenManager.getAuthData()
  
  // 過濾掉空字串的可選欄位
  const payload: Record<string, unknown> = {
    academic_year_start: data.academic_year_start,
    academic_term_start: data.academic_term_start,
    academic_year_end: data.academic_year_end,
    academic_term_end: data.academic_term_end,
  }
  
  if (data.department) payload.department = data.department
  if (data.has_class) payload.has_class = data.has_class
  if (data.theme_code) payload.theme_code = data.theme_code
  if (data.sub_theme_code) payload.sub_theme_code = data.sub_theme_code
  
  // 如果有認證資料，添加到請求體中
  if (authData) {
    payload.user_id = authData.user_id
    payload.token = authData.token
  }

  const response = await axios({
    method: 'POST',
    url: `${API_BASE_URL}/school-years/export-csv`,
    data: payload,
    responseType: 'blob',
    timeout: 60000, // CSV 匯出可能需要較長時間
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.data
}
