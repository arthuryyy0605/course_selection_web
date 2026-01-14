import request from './request'

// 課程記錄相關 API

export interface CourseEntryExistsResponse {
  exists: boolean
}

export interface CopyCourseEntriesRequest {
  source_academic_year: number
  source_academic_term: number
  target_academic_year: number
  target_academic_term: number
  subj_no: string
  ps_class_nbr: string
  user_id: string
  token: string
}

export interface CopyCourseEntriesResponse {
  message: string
  copied_count: number
  skipped_count: number
  deleted_count: number
}

/**
 * 檢查指定課程在指定學年期是否已有填寫記錄
 * @param courseId 課程 ID (course_id，對應 subj_no)
 * @param psClassNbr 課程流水號 (PS_CLASS_NBR)
 * @param academicYear 學年
 * @param academicTerm 學期
 * @returns { exists: boolean }
 */
export const checkCourseExists = (
  courseId: string,
  psClassNbr: string,
  academicYear: number,
  academicTerm: number
): Promise<CourseEntryExistsResponse> => {
  return request.get(`/course-entries/exists?course_id=${courseId}&ps_class_nbr=${psClassNbr}&academic_year=${academicYear}&academic_term=${academicTerm}`)
}

/**
 * 將課程記錄從一個學年期複製到另一個學年期
 * @param data 複製請求資料
 * @returns 複製結果統計
 */
export const copyCourseEntries = (
  data: CopyCourseEntriesRequest
): Promise<CopyCourseEntriesResponse> => {
  return request.post('/course-entries/copy', data)
}

// 課程記錄 CRUD 操作

export interface CourseEntryCreateRequest {
  subj_no: string
  ps_class_nbr: string
  academic_year: number
  academic_term: number
  sub_theme_code: string
  indicator_value: string
  week_numbers?: number[]
  is_most_relevant?: boolean
  user_id: string
  token: string
}

export interface CourseEntryUpdateRequest {
  indicator_value: string
  week_numbers?: number[]
  is_most_relevant?: boolean
  user_id: string
  token: string
}

export interface CourseEntryResponse {
  id?: string // UUID - 記錄 ID（從 int 改為 string）
  subj_no: string
  ps_class_nbr: string
  academic_year: number
  academic_term: number
  coures_sub_themes_id?: string // UUID - 細項主題 ID
  sub_theme_id?: string // UUID - 細項主題 ID
  theme_code: string // 顯示用
  sub_theme_code: string // 顯示用
  indicator_value: string
  week_numbers?: number[]
  is_most_relevant?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * 創建課程記錄
 */
export const createCourseEntry = (
  data: CourseEntryCreateRequest
): Promise<CourseEntryResponse> => {
  return request.post('/course-entries/single', data)
}

/**
 * 更新課程記錄（entryId 改為 string UUID）
 */
export const updateCourseEntry = (
  entryId: string,
  data: CourseEntryUpdateRequest
): Promise<CourseEntryResponse> => {
  return request.put(`/course-entries/${entryId}`, data)
}

export interface CourseEntryDeleteRequest {
  user_id: string
  token: string
}

/**
 * 刪除課程記錄（entryId 改為 string UUID）
 */
export const deleteCourseEntry = (
  entryId: string,
  data: CourseEntryDeleteRequest
): Promise<void> => {
  return request.delete(`/course-entries/${entryId}`, { data })
}

