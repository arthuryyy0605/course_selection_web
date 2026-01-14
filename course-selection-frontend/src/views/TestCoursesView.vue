<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 新課程資料（格式：PS_CLASS_NBR\tSUBJ_NO\tACADEMIC_YEAR\tACADEMIC_TERM\tCOURSE_NAME）
const rawCourseData = `2545	12057	114	1	英語會話
5014	04640	114	2	基礎Python與環境數據
5539	61805	114	1	精密加工
5976	43792	114	1	中高級英語閱讀
4975	40604	114	2	工程統計學
5044	82001	114	2	獨立研究(一)
1327	05986	114	1	英語溝通與表達
2071	31646	114	1	作物生產概論
5056	00012	114	2	綠色科技與永續發展
5435	52539	114	1	普通植物學
1573	51534	114	1	普通化學
1614	53870	114	1	微積分(一)
1666	54543	114	1	普通物理學
5268	99999	114	1	操行
5093	40665	114	2	數值分析
2026	04490	114	2	高級英語聽講
3985	24007	114	1	國際私法
4672	04103	114	1	職場競爭力
1487	31519	114	1	生物統計學
1724	12070	114	1	英文作文(一)
2069	31519	114	1	生物統計學
2572	97072	114	1	政府會計
5211	48009	114	1	零售管理
5883	06106	114	1	全球永續教育
2517	00979	114	1	動物農場管理
2033	98430	114	1	農企業管理
4084	53631	114	1	資料結構
2528	06075	114	2	兒童醫學
2017	06071	114	2	影像醫學實習
5608	64889	114	2	前瞻類比積體電路設計
3152	03592	114	1	物聯網與雲端系統
5142	05414	114	1	太極拳2B
6180	12879	114	1	華語教學導論
6174	02356	114	1	股市投資模擬實作
5588	05392	114	1	創新思維與應用
4964	05646	114	2	STEM與半導體微型課程(五) -綠色製造
1310	00914	114	1	國文/語文領域本國語文教材教法
4174	00870	114	1	青少年輔導實務
3253	23116	114	2	招募與甄選
4800	04987	114	2	心血管疾病與麻醉風暴
5159	04647	114	2	歷史與電影
5003	06109	114	2	健康醫學與蟲蟲危機
3640	23116	114	2	招募與甄選
5394	05569	114	1	生成式AI與ChatGPT應用
2897	N3060	114	1	文化創意產業概論
3693	05861	114	1	敘事表達：語文素養
5141	03987	114	1	數位人文的人工智慧
1583	51792	114	1	普通化學實驗(甲)
2036	05988	114	1	學術英文說寫
6117	03330	114	1	通識學習拼圖（二）`

// 解析資料並去重（相同的課程代碼+學年期只保留一個）
const courses = computed(() => {
  const courseMap = new Map<string, { psClassNbr: string; subjNo: string; name: string; year: number; term: number }>()

  rawCourseData.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return

    const parts = trimmed.split('\t')
    if (parts.length >= 5 && parts[0] && parts[1] && parts[2] && parts[3] && parts[4]) {
      const psClassNbr = parts[0].trim()
      const subjNo = parts[1].trim()
      const year = parseInt(parts[2].trim())
      const term = parseInt(parts[3].trim())
      const name = parts[4].trim()
      const key = `${subjNo}-${psClassNbr}-${year}-${term}`

      if (!courseMap.has(key)) {
        courseMap.set(key, { psClassNbr, subjNo, name, year, term })
      }
    }
  })

  return Array.from(courseMap.values())
})

// 從課程資料中提取唯一的學年期
const semesters = computed(() => {
  const semesterSet = new Set<string>()
  courses.value.forEach(c => {
    semesterSet.add(`${c.year}-${c.term}`)
  })

  return Array.from(semesterSet).map(s => {
    const parts = s.split('-')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return {
        year: parseInt(parts[0]),
        term: parseInt(parts[1]),
        display: s
      }
    }
    return { year: 114, term: 1, display: s }
  })
})

const goForm = (subjNo: string, psClassNbr: string, year: number, term: number) => {
  // 使用 subj_no 作為 course_id（向後相容），ps_class_nbr 作為 query parameter
  router.push({
    path: `/test/${subjNo}/${year}/${term}`,
    query: { ps_class_nbr: psClassNbr }
  })
}
</script>

<template>
  <div class="test-courses">
    <el-page-header content="測試 - 課程清單" />

    <div class="grid">
      <el-card v-for="c in courses" :key="`${c.subjNo}-${c.psClassNbr}-${c.year}-${c.term}`" class="course-card" shadow="hover">
        <div class="course-title">{{ c.name }}</div>
        <div class="course-id">課程代碼: {{ c.subjNo }} ({{ c.psClassNbr }})</div>
        <div class="semesters">
          <el-tag v-for="s in semesters" :key="`${s.year}-${s.term}`" type="info" size="large" class="sem"
            @click="goForm(c.subjNo, c.psClassNbr, s.year, s.term)">
            {{ s.display }}
          </el-tag>
        </div>
      </el-card>
    </div>
  </div>

</template>

<style scoped>
.test-courses {
  padding: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.course-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s;
}

.course-card:hover {
  transform: translateY(-4px);
}

.course-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.course-id {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.semesters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.sem {
  cursor: pointer;
  transition: all 0.3s;
}

.sem:hover {
  transform: scale(1.05);
}
</style>
