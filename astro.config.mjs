import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import vercel from "@astrojs/vercel"
import react from "@astrojs/react"
import tailwind from "@astrojs/tailwind"
import path from "path"
import { fileURLToPath } from "url"

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
      filter: page => !/\/en\/posts\/.+/.test(new URL(page).pathname)
    }),
    react(),
    tailwind()
  ],
  markdown: {
    shikiConfig: {
      theme: "aurora-x"
    },
    extendDefaultPlugins: true
  }
})
