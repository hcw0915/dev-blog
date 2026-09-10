// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Antonio - DevLog"
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
