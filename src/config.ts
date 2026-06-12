// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Antonio - DevLog"
export const SITE_DESCRIPTION =
  "Antonio 的前端工程筆記：React、TypeScript、Three.js / Shader，以及帶領團隊導入 AI 開發工作流的實戰紀錄。"
// 換網域時：這裡與 astro.config.mjs 的 site 兩處需同步
export const SITE_URL = "https://antonio-blog-one.vercel.app"

export const COLOR_MAP: Record<string, string> = {
  ai: "#D97757",
  javascript: "#F7DF1E",
  typescript: "#3178C6",
  vue: "#C1E1C1",
  react: "#61DAFB",
  general: "#42B883",
  blog: "#D4A5E6",
  rust: "#DEA584",
  next: "#3E3F5B",
  three: "#4D55CC",
  shader: "#F9AFAF",
  css: "#B83280",
} as const
