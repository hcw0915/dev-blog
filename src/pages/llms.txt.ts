/**
 * llms.txt（https://llmstxt.org）：給 LLM 與 AI 搜尋讀的站台目錄。
 * 一行一篇：標題、網址、摘要。摘要跟 meta description 同一個來源（lib/plaintext 的 summarize），
 * 文章新增或改寫時自動跟著變，不用手動維護。
 */
import type { APIRoute } from "astro"
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/config"
import { playgrounds } from "@/data/playgrounds/index"
import { summarize } from "@/lib/plaintext.mjs"
import { displayTags } from "@/lib/tags"

export const GET: APIRoute = () => {
  const modules = import.meta.glob("./posts/*.md", { eager: true }) as Record<string, any>
  const posts = Object.values(modules)
    .filter(p => p.frontmatter.public)
    .sort((a, b) => new Date(b.frontmatter.createdAt).valueOf() - new Date(a.frontmatter.createdAt).valueOf())

  const url = (path: string) => new URL(path, SITE_URL).href
  const line = (title: string, href: string, note: string) => `- [${title}](${href})${note ? `: ${note}` : ""}`

  const body = [
    `# ${SITE_TITLE}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Antonio Hou 的個人技術部落格與作品集。文章以台灣繁體中文撰寫，主題包含前端效能與排程、React／Next.js、瀏覽器平台、CSS、Three.js／Shader，以及團隊導入 AI 開發工作流的實務紀錄。",
    "",
    "## 文章",
    "",
    ...posts.map(p => {
      const tags = displayTags(p.frontmatter.tags ?? [])
      const summary = p.frontmatter.description || summarize(p.rawContent())
      return line(p.frontmatter.title, url(p.url), [tags.length ? `[${tags.join(", ")}]` : "", summary].filter(Boolean).join(" "))
    }),
    "",
    "## Playground",
    "",
    ...playgrounds.map(p => line(p.title, url(`/playground/${p.template}/${p.id}`), p.description)),
    "",
    "## Optional",
    "",
    line("關於作者", url("/about/"), "經歷、技能與作品案例"),
    line("RSS", url("/rss.xml"), "全部文章的訂閱源"),
    "",
  ].join("\n")

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
