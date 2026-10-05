/**
 * 文章主題分類：讀過每篇內容後人工歸類，給「相關文章」用。
 *
 * 標籤是作者寫文章時順手掛的，粒度很粗（大量文章都掛 General），只靠標籤配對會配出不相干的文章。
 * 這裡依「文章實際在講什麼」分主題：同主要主題的優先，再來是同次要主題，標籤權重只用來決定同分時的先後。
 *
 * 新文章沒列在 POST_TOPICS 時會退回只用標籤配對，build 會印出提醒（不會失敗 —— 文章從 Inkdrop
 * 自動發佈，不能因為還沒分類就擋住部署）。
 */

export type TopicId =
  | "perf-scheduling"
  | "frontend-architecture"
  | "browser-platform"
  | "nextjs-rendering"
  | "ai-knowledge"
  | "css-styling"
  | "build-tooling"
  | "testing"
  | "react-components"
  | "typescript"
  | "javascript-core"
  | "threejs-basics"
  | "shader-glsl"
  | "r3f-showcase"

export const TOPICS: Record<TopicId, { zh: string; en: string }> = {
  "perf-scheduling": { zh: "前端效能與任務排程", en: "Performance & scheduling" },
  "frontend-architecture": { zh: "前端架構設計", en: "Frontend architecture" },
  "browser-platform": { zh: "瀏覽器平台與儲存", en: "Browser platform & storage" },
  "nextjs-rendering": { zh: "Next.js 與渲染策略", en: "Next.js & rendering" },
  "ai-knowledge": { zh: "AI 知識庫", en: "AI knowledge base" },
  "css-styling": { zh: "CSS 與樣式隔離", en: "CSS & style isolation" },
  "build-tooling": { zh: "建置與工具鏈", en: "Build & tooling" },
  testing: { zh: "前端測試", en: "Frontend testing" },
  "react-components": { zh: "React 元件設計", en: "React component design" },
  typescript: { zh: "TypeScript 型別", en: "TypeScript types" },
  "javascript-core": { zh: "JavaScript 基礎", en: "JavaScript fundamentals" },
  "threejs-basics": { zh: "Three.js 基礎", en: "Three.js basics" },
  "shader-glsl": { zh: "Shader 與 GLSL", en: "Shaders & GLSL" },
  "r3f-showcase": { zh: "React Three Fiber 作品拆解", en: "React Three Fiber breakdowns" },
}

/** slug → 主題，第一個是主要主題 */
export const POST_TOPICS: Record<string, TopicId[]> = {
  // 效能與排程：首屏之後的工作怎麼排、預載怎麼不搶當前頁
  "page-startup-scheduling": ["perf-scheduling", "frontend-architecture"],
  "preload-scheduling-tradeoffs": ["perf-scheduling", "frontend-architecture"],

  // 架構：共用機制的職責邊界、契約與擴充方式
  "popup-queue-soft-navigation": ["frontend-architecture", "nextjs-rendering"],
  "error-code-event-bus": ["frontend-architecture", "javascript-core"],
  "dev-panel": ["frontend-architecture", "build-tooling"],
  "refactor-steps": ["frontend-architecture", "react-components"],

  // 瀏覽器平台：儲存、快取、容器、Web API
  "webview-shell-detection": ["browser-platform", "frontend-architecture"],
  "ssr-login-token-layers": ["browser-platform", "nextjs-rendering"],
  "cookie-local-storage": ["browser-platform"],
  browser: ["browser-platform"],
  "blob-file": ["browser-platform", "javascript-core"],
  "js-new-url-url-search-params": ["browser-platform", "javascript-core"],
  "language-source-priority-strategy": ["browser-platform", "nextjs-rendering"],
  "shadow-dom-web-component": ["browser-platform", "css-styling"],

  // Next.js：渲染模式、內建元件
  "ssr-ssg-csr-isr": ["nextjs-rendering"],
  "next-images": ["nextjs-rendering", "perf-scheduling"],

  // AI 知識庫：同一套系統的總覽與後續修正
  "knowledge-keyword-rag": ["ai-knowledge"],
  "knowledge-optimization": ["ai-knowledge"],

  // CSS：打包、樣式隔離、CSS-in-JS
  "tailwind-embedded-ui-css": ["css-styling", "browser-platform"],
  css: ["css-styling", "build-tooling"],
  "vite-twin-marco-styled-components": ["css-styling", "build-tooling"],

  // 工具鏈：建置設定、monorepo、lint
  "vite-config-env": ["build-tooling"],
  "pnpm-monorepo": ["build-tooling"],
  "eslint-plugin-simple-import-sort": ["build-tooling"],
  "customize-eslint-rules": ["build-tooling", "javascript-core"],

  // 測試：同一本書的筆記 + 工具比較
  "chapter-1": ["testing"],
  "chapter-2-1-2-3": ["testing"],
  "chapter-2-4-2-6": ["testing"],
  "chapter-5": ["testing"],
  "enzyme-vs-react-testing-library-rtl": ["testing", "react-components"],

  // React 元件：props 設計、children、遞迴元件
  "react-general-component": ["react-components", "typescript"],
  "react-unstyled-component": ["react-components", "typescript"],
  "react-children": ["react-components"],
  "react-recursive-folders-components": ["react-components"],

  // TypeScript
  ts: ["typescript"],
  "ts-infer": ["typescript"],
  "ts-react-hook-form": ["typescript", "react-components"],

  // JavaScript 語言基礎
  "js-var-let-const": ["javascript-core"],
  "js-shallow-copy-deep-copy": ["javascript-core"],
  "js-proxy": ["javascript-core"],

  // Three.js 基礎：旋轉、紋理、幾何、控制
  "three-euler-vs-quaternion": ["threejs-basics"],
  texture: ["threejs-basics"],
  "galaxy-generator": ["threejs-basics", "shader-glsl"],
  "three-demo": ["threejs-basics", "r3f-showcase"],

  // Shader
  "shader-uniform-attribute-varying": ["shader-glsl"],
  "shader-built-in-variables": ["shader-glsl"],
  "shader-color-offset": ["shader-glsl"],
  "shader-template": ["shader-glsl"],

  // React Three Fiber 作品拆解
  "react-three-fiber-apple-watch": ["r3f-showcase", "threejs-basics"],
  "anti-three-1-furniture": ["r3f-showcase"],
  "anti-three-2-banana": ["r3f-showcase"],
  "anti-three-3-lusion": ["r3f-showcase"],
  "anti-three-4-bruno-simon-20-k": ["r3f-showcase"],
  "anti-three-5-monitor-bunny": ["r3f-showcase", "shader-glsl"],
}

/**
 * 內容幾乎相同的文章（同一份筆記的不同版本）。相關文章不會推薦自己的分身，
 * 同一組也只會出現一篇，避免三個推薦裡有兩個是同一篇。
 */
export const TWINS: string[][] = []

const twinGroupOf = new Map(TWINS.flatMap((group, i) => group.map(slug => [slug, i] as const)))
export const twinGroup = (slug: string) => twinGroupOf.get(slug)

/**
 * 文章性質：跟主題（講什麼技術）正交，描述「寫法與深度」。讀過內容後人工判斷，給首頁專區與列表篩選用。
 * - deep：在真實系統裡做過的事 —— 問題、取捨、量測、沒解掉的部分
 * - note：讀書、課程、官方文件的整理
 * - tip：單一問題的小技巧或踩坑
 * 系列是另一個維度（config.ts 的 SERIES），同一篇可以是系列文又是 deep。
 * 放在 repo 而不是 Inkdrop frontmatter：這是編輯判斷，改 55 份筆記會觸發 55 次部署。
 * 沒列到的文章視為 note，build 時印提醒（不擋部署，理由同 POST_TOPICS）。
 */
export type PostKind = "deep" | "note" | "tip"

export const KINDS: Record<PostKind, { zh: string; en: string }> = {
  deep: { zh: "專案經驗", en: "Project work" },
  note: { zh: "學習筆記", en: "Notes" },
  tip: { zh: "小技巧", en: "Tips" },
}

const DEEP = [
  "page-startup-scheduling", "preload-scheduling-tradeoffs", "startup-scheduling-wait-outside-slot",
  "startup-measurement-pitfalls", "knowledge-keyword-rag", "knowledge-optimization",
  "popup-queue-soft-navigation", "error-code-event-bus", "dev-panel", "webview-shell-detection",
  "ssr-login-token-layers", "tailwind-embedded-ui-css", "css", "language-source-priority-strategy",
]
const TIP = [
  "browser", "eslint-plugin-simple-import-sort", "customize-eslint-rules", "js-new-url-url-search-params",
  "react-children", "react-general-component", "ts", "ts-infer", "ts-react-hook-form", "vite-config-env",
  "vite-twin-marco-styled-components", "refactor-steps", "shader-template",
]
const NOTE = [
  "anti-three-1-furniture", "anti-three-2-banana", "anti-three-3-lusion", "anti-three-4-bruno-simon-20-k",
  "anti-three-5-monitor-bunny", "chapter-1", "chapter-2-1-2-3", "chapter-2-4-2-6", "chapter-5",
  "enzyme-vs-react-testing-library-rtl", "texture", "galaxy-generator", "three-euler-vs-quaternion",
  "three-demo",
  "react-three-fiber-apple-watch", "shader-uniform-attribute-varying", "shader-color-offset",
  "shader-built-in-variables", "next-images", "ssr-ssg-csr-isr", "js-var-let-const", "js-shallow-copy-deep-copy",
  "js-proxy", "blob-file", "cookie-local-storage", "shadow-dom-web-component", "pnpm-monorepo",
  "react-unstyled-component", "react-recursive-folders-components",
]

export const POST_KIND: Record<string, PostKind> = Object.fromEntries([
  ...DEEP.map(s => [s, "deep"] as const),
  ...TIP.map(s => [s, "tip"] as const),
  ...NOTE.map(s => [s, "note"] as const),
])

const warned = new Set<string>()
export const kindOf = (slug: string): PostKind => {
  const k = POST_KIND[slug]
  if (!k && !warned.has(slug)) {
    warned.add(slug)
    console.warn(`[topics] ${slug} 還沒標性質，暫時視為 note（src/data/topics.ts 的 POST_KIND）`)
  }
  return k ?? "note"
}
