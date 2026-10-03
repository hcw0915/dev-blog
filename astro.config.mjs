import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import fs from "node:fs"
import vercel from "@astrojs/vercel"
import react from "@astrojs/react"
import tailwind from "@astrojs/tailwind"
import path from "path"
import { fileURLToPath } from "url"
import remarkAlerts from "./src/lib/remark-alerts.mjs"

// sitemap 的 lastmod 來源：直接讀文章 md 的 frontmatter（config 階段還沒有 Astro 的內容 API）
const postUpdatedAt = Object.fromEntries(
  fs.readdirSync("./src/pages/posts")
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const fm = fs.readFileSync(`./src/pages/posts/${f}`, "utf8").split("\n---")[0]
      const slug = fm.match(/^slug:\s*(\S+)/m)?.[1] ?? f.replace(/\.md$/, "")
      const t = Number(fm.match(/^updatedAt:\s*(\d+)/m)?.[1] ?? fm.match(/^createdAt:\s*(\d+)/m)?.[1])
      return [slug, t]
    })
    .filter(([, t]) => t)
)

// 获取当前文件的目录路径（ES module 中 __dirname 的替代方案）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://astro.build/config
export default defineConfig({
  // 換網域時：這裡與 src/config.ts 的 SITE_URL 兩處需同步
  site: "https://antonio-blog-one.vercel.app",
  // 轉接器只為了 /api/views 這一支動態路由；其餘頁面維持預先渲染（Astro 5 的 static 預設）
  adapter: vercel(),
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: {
      prefixDefaultLocale: false
    }
  },
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@/components": path.resolve(__dirname, "./src/components"),
        "@/config": path.resolve(__dirname, "./src/config"),
        "@/i18n": path.resolve(__dirname, "./src/i18n"),
        "@/layouts": path.resolve(__dirname, "./src/layouts"),
        "@/pages": path.resolve(__dirname, "./src/pages"),
        "@/styles": path.resolve(__dirname, "./src/styles")
      }
    }
  },
  integrations: [
    sitemap({
      // /en/posts/<slug>/ 是 noindex 的 redirect stub，不進 sitemap（/en/posts/ 列表頁保留）
      filter: page => !/\/en\/posts\/.+/.test(new URL(page).pathname),
      // 文章加上 lastmod（frontmatter 的 updatedAt），搜尋引擎據此決定多久回來重抓
      serialize: item => {
        const slug = new URL(item.url).pathname.match(/^\/posts\/([^/]+)\/?$/)?.[1]
        const updatedAt = slug && postUpdatedAt[slug]
        return updatedAt ? { ...item, lastmod: new Date(updatedAt).toISOString() } : item
      }
    }),
    react(),
    tailwind()
  ],
  markdown: {
    shikiConfig: {
      theme: "aurora-x"
    },
    // mermaid 圍欄不交給 Shiki 上色，原文留給文章頁在瀏覽器渲染成圖（見 BlogPost.astro）
    syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] },
    // > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION] 提示框
    remarkPlugins: [remarkAlerts],
    extendDefaultPlugins: true
  }
})
