#!/usr/bin/env node
/**
 * 已公開文章裡的站內連結都必須指得到東西：公開文章、public/ 底下的檔案、playground、或既有頁面。
 * 連到草稿（未公開的文章或 /drafts/）在線上就是 404，所以擋下來。
 *
 *   node tools/check-links.mjs
 *
 * prebuild 會跑（壞了 Vercel build 失敗、線上維持舊版）；watch-publish.sh 推送前也跑，壞了就不推並跳通知。
 */
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"

const root = new URL("..", import.meta.url).pathname
const postsDir = join(root, "src/pages/posts")

const posts = readdirSync(postsDir)
  .filter(f => f.endsWith(".md"))
  .map(f => {
    const src = readFileSync(join(postsDir, f), "utf8")
    const fm = src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ""
    return {
      file: f,
      slug: fm.match(/^slug:\s*(.+)$/m)?.[1].trim(),
      public: /^public:\s*true\s*$/m.test(fm),
      body: src.slice(fm.length + 8)
    }
  })
const publicSlugs = new Set(posts.filter(p => p.public).map(p => p.slug))

const routeExists = path =>
  [".astro", ".md", "/index.astro", "/index.md"].some(ext => existsSync(join(root, "src/pages", path + ext)))

/** 回傳問題描述，沒問題回 null */
function check(href) {
  const path = decodeURIComponent(href.split(/[?#]/)[0]).replace(/\/$/, "") || "/"
  if (path.startsWith("/drafts")) return "連到草稿預覽（/drafts/ 不會上線）"
  // 有副檔名就是靜態檔
  if (/\.[a-z0-9]+$/i.test(path)) return existsSync(join(root, "public", path)) ? null : "public/ 底下沒有這個檔案"
  const bare = path.replace(/^\/en(?=\/|$)/, "") || "/"
  const post = bare.match(/^\/posts\/([^/]+)$/)
  if (post) return publicSlugs.has(post[1]) ? null : "文章不存在或還沒公開"
  const pg = bare.match(/^\/playground\/(vanilla|react)\/([^/]+)$/)
  if (pg) {
    const meta = join(root, "src/data/playgrounds", pg[2], "metadata.json")
    if (!existsSync(meta)) return "playground 不存在"
    const template = JSON.parse(readFileSync(meta, "utf8")).template ?? "vanilla"
    return template === pg[1] ? null : `playground 的 template 是 ${template}`
  }
  return bare === "/" || routeExists(bare) ? null : "找不到對應的頁面"
}

const problems = []
for (const p of posts.filter(p => p.public)) {
  // 程式碼區塊與行內程式碼裡的路徑是範例，不是連結
  const text = p.body.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "")
  const hrefs = [...text.matchAll(/\]\((\/[^)\s]*)|\b(?:href|src)="(\/[^"]*)"/g)].map(m => m[1] ?? m[2])
  for (const href of new Set(hrefs)) {
    if (href.startsWith("//")) continue // protocol-relative 外部連結
    const why = check(href)
    if (why) problems.push(`${p.file}: ${href} —— ${why}`)
  }
}

if (problems.length) {
  console.error(`站內連結有 ${problems.length} 個壞掉：\n  ${problems.join("\n  ")}`)
  process.exit(1)
}
console.log(`站內連結檢查通過（${publicSlugs.size} 篇公開文章）`)
