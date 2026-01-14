/**
 * 學年期格式轉換工具函數
 */

/**
 * 將舊格式學年期字串轉換為新格式
 * @param semester 學年期字串，如 "1132"
 * @returns {year: number, term: number} 如 {year: 113, term: 2}
 */
export function parseSchoolYearSemester(semester: string): { year: number; term: number } {
  const year = parseInt(semester.slice(0, -1))
  const term = parseInt(semester.slice(-1))
  return { year, term }
}

/**
 * 格式化顯示學年期
 * @param year 學年，如 113
 * @param term 學期，如 2
 * @returns 格式化字串，如 "113-2"
 */
export function formatSchoolYear(year: number, term: number): string {
  return `${year}-${term}`
}

/**
 * 格式化顯示完整學年期
 * @param year 學年，如 113
 * @param term 學期，如 2
 * @returns 格式化字串，如 "113學年度第2學期"
 */
export function formatSchoolYearFull(year: number, term: number): string {
  return `${year}學年度第${term}學期`
}

/**
 * 將新格式轉換為舊格式（向後相容用）
 * @param year 學年，如 113
 * @param term 學期，如 2
 * @returns 舊格式字串，如 "1132"
 */
export function toOldFormat(year: number, term: number): string {
  return `${year}${term}`
}

/**
 * 根據當前日期計算學年和學期
 * 規則：
 * - 6月～11月：第一學期
 * - 12月～5月：第二學期
 * 學年計算：
 * - 8月～12月：當前年份-1911
 * - 1月～7月：當前年份-1912
 * @returns {year: number, term: number} 如 {year: 113, term: 2}
 */
export function getCurrentSchoolYearAndTerm(): { year: number; term: number } {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // getMonth() 返回 0-11，所以 +1

  let academicYear: number
  let academicTerm: number

  // 判斷學期：6月～11月為第一學期，其餘（12月～5月）為第二學期
  if (currentMonth >= 6 && currentMonth <= 11) {
    academicTerm = 1
  } else {
    academicTerm = 2
  }

  // 判斷學年：8月開始新學年
  if (currentMonth >= 8) {
    // 8月～12月：當前年份-1911
    academicYear = currentYear - 1911
  } else {
    // 1月～7月：當前年份-1912
    academicYear = currentYear - 1912
  }

  return { year: academicYear, term: academicTerm }
}

