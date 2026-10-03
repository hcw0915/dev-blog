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
  "euler-vs-quaternion": ["threejs-basics"],
  "rotation-euler-quaterion": ["threejs-basics"],
  "three-euler-vs-quaternion": ["threejs-basics"],
  "euler-quaternion": ["threejs-basics"],
  "three-euler-quaternion": ["threejs-basics"],
  texture: ["threejs-basics"],
  "three-texture": ["threejs-basics"],
  "galaxy-generator": ["threejs-basics", "shader-glsl"],
  "three-demo": ["threejs-basics", "r3f-showcase"],

  // Shader
  shader: ["shader-glsl"],
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
export const TWINS: string[][] = [
  ["euler-vs-quaternion", "rotation-euler-quaterion", "three-euler-vs-quaternion"],
  ["euler-quaternion", "three-euler-quaternion"],
  ["texture", "three-texture"],
  ["shader", "shader-uniform-attribute-varying"],
]

const twinGroupOf = new Map(TWINS.flatMap((group, i) => group.map(slug => [slug, i] as const)))
export const twinGroup = (slug: string) => twinGroupOf.get(slug)
