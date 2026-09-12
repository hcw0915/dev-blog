// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Antonio Hou · Frontend Engineer"
export const SITE_DESCRIPTION =
  "Antonio 的前端工程筆記：React、TypeScript、Three.js / Shader，以及帶領團隊導入 AI 開發工作流的實戰紀錄。"
// 換網域時：這裡與 astro.config.mjs 的 site 兩處需同步
export const SITE_URL = "https://antonio-blog-one.vercel.app"

/**
 * tag -> [主色, 輔色]。輔色讓單一主題的文章也有色彩層次，多主題則是多組色並置。
 * 多數取該技術的品牌色；Vite 本身就是紫→黃的雙色品牌。
 */
export const COLOR_MAP: Record<string, readonly [string, string]> = {
  shader: ["#FF6B9D", "#FFC4DD"],
  "anti-three": ["#8B7FE8", "#C4B5FD"],
  three: ["#4D55CC", "#8B93FF"],
  testing: ["#8BC34A", "#D9F27E"],
  "micro-frontend": ["#00C2A8", "#5EEAD4"],
  ai: ["#D97757", "#F2A98A"],
  react: ["#61DAFB", "#2E8FB0"],
  next: ["#A9AFC7", "#E8EBF5"],
  vue: ["#42B883", "#8FE3BC"],
  rust: ["#CE422B", "#DEA584"],
  vite: ["#BD34FE", "#FFD028"],
  css: ["#B83280", "#E85AAD"],
  typescript: ["#3178C6", "#5EA9FF"],
  javascript: ["#F7DF1E", "#FFA000"],
  general: ["#94A3B8", "#CBD5E1"],
  blog: ["#6B6478", "#948CA3"],
} as const

/**
 * 特異度權重：數字越大越能代表這篇文章，決定「主題色」取哪一個 tag。
 * 取代先前用 tags[0] 或 hex 字串排序的做法 —— 兩者都跟語意無關。
 */
export const TAG_WEIGHT: Record<string, number> = {
  shader: 90,
  "anti-three": 88,
  three: 85,
  testing: 82,
  "micro-frontend": 80,
  ai: 78,
  react: 75,
  next: 72,
  vue: 70,
  rust: 68,
  vite: 65,
  css: 62,
  typescript: 55,
  javascript: 50,
  general: 10,
  blog: 5,
}
export const TAG_WEIGHT_DEFAULT = 40

/** 泛用標籤：51/53 篇都掛著 blog，沒有辨識力，不進配色也不進 chips */
export const NOISE_TAGS = new Set(["blog"])

/**
 * 系列文章。陣列順序就是閱讀順序。
 * 文章底部的上一篇／下一篇原本按發佈時間排，讀完系列中的一篇會跳到不相干的文章；
 * 在系列裡的文章改成系列內導航，並在標題下列出整個系列。
 * build 時會檢查每個 slug 都存在（lib/series.ts），下架或改名文章時會直接報錯提醒改這裡。
 */
export const SERIES: { id: string; title: { zh: string; en: string }; slugs: string[] }[] = [
  {
    id: "anti-three",
    title: { zh: "AntiThree", en: "AntiThree" },
    slugs: [
      "anti-three-1-furniture",
      "anti-three-2-banana",
      "anti-three-3-lusion",
      "anti-three-4-bruno-simon-20-k",
      "anti-three-5-monitor-bunny",
    ],
  },
  {
    id: "frontend-testing",
    title: { zh: "前端測試指南", en: "Frontend Testing Guide" },
    slugs: ["chapter-1", "chapter-2-1-2-3", "chapter-2-4-2-6", "chapter-5"],
  },
  {
    id: "shader-basics",
    title: { zh: "Shader 入門", en: "Shader Basics" },
    slugs: [
      "shader-uniform-attribute-varying",
      "shader-template",
      "shader-color-offset",
      "shader-built-in-variables",
    ],
  },
]

/**
 * 首頁「精選」要放哪幾篇。刻意與時間無關 —— 先前首頁把最新 3 篇做成卡片、
 * 第 4 篇之後做成列表並標上「最新文章」，等於標題在說謊。
 *
 * 也可以在 Inkdrop 筆記的 frontmatter 寫 `featured: true`（會被 live-export
 * 保留），不用開 repo；這份清單是 repo 端的備援與預設。
 */
export const FEATURED_SLUGS: string[] = [
  // 第一個是釘選位，永遠排在最前；其餘依發佈日期新到舊排序。
  "knowledge-optimization", // AI：知識庫跑了三個月後的實際修正，附量測與取捨
  "tailwind-embedded-ui-css", // 真實約束下的方案取捨，含被否決的解法與理由
  "chapter-5", // 工具評比矩陣 + CI 整合，不只是教學
]
