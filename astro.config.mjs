import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
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
  integrations: [sitemap(), react(), tailwind()],
  markdown: {
    shikiConfig: {
      theme: "aurora-x"
    },
    extendDefaultPlugins: true
  }
})
