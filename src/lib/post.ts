/**
 * 文章列表共用的取值邏輯。首頁與 /posts 都靠這裡，卡片才不會兩邊長歪。
 */
import fs from "node:fs"
import path from "node:path"

export const slugOf = (post: any): string =>
  post.frontmatter.slug ?? post.file.split("/").pop()!.replace(/\.md$/, "")

// 建置時掃一次 public/hero/：真實封面圖優先於生成圖，避免逐篇做 fs 檢查
const heroDir = path.resolve("public/hero")
const heroMap = new Map<string, string>(
  fs.existsSync(heroDir)
    ? fs
        .readdirSync(heroDir)
        .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
        .map(f => [f.replace(/\.(png|jpe?g|webp)$/i, ""), f])
    : []
)

export const heroFor = (slug: string): string | null =>
  heroMap.has(slug) ? `/hero/${heroMap.get(slug)}` : null

/**
 * 摘要：優先 frontmatter.description，否則取內文第一段。
 *
 * 兩個順序很重要：
 *   1. 先整段移除 fenced code block 再切段落 —— 直接對原文 split(/\n{2,}/)
 *      的話，程式碼區塊內部只要有空行，後半段就會被當成普通段落。
 *   2. 先剝掉引言標記 `>` 再判斷可否跳過 —— 否則 `> - [連結](url)` 這種
 *      引言包清單會被當成正常段落放行，剝完才露出裡面是清單。
 */
const stripCode = (raw: string): string => {
  let s = raw.replace(/^[ \t]*(`{3,}|~{3,})[\s\S]*?^[ \t]*\1[ \t]*$/gm, "")
  // 未閉合的 fence：從那裡截斷，後面整段都是程式碼
  const stray = s.search(/^[ \t]*(`{3,}|~{3,})/m)
  if (stray >= 0) s = s.slice(0, stray)
  return s.replace(/<!--[\s\S]*?-->/g, "")
}

const unquote = (s: string) =>
  s
    .replace(/^\s*>\s?/gm, "")
    .replace(/\s+$/gm, "")
    .trim()

const isSkippable = (s: string) =>
  !s ||
  s.startsWith("#") ||
  s.startsWith("![") ||
  s.startsWith("|") ||
  s.startsWith("<") ||
  /^[-*_]{3,}\s*$/.test(s) || // 分隔線
  /^[-*+]\s/.test(s) || // 無序清單
  /^\d+\.\s/.test(s) || // 有序清單
  /^https?:\/\//.test(s) ||
  /^\[[^\]]*\]\(/.test(s) // 整段只是一個連結

const clean = (s: string) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[#*`_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()

export const getExcerpt = (post: any, max = 80): string => {
  if (post.frontmatter.description) return post.frontmatter.description

  const candidates = stripCode(post.rawContent())
    .split(/\n{2,}/)
    .map(block => ({ quoted: /^\s*>/.test(block), text: unquote(block) }))
    .filter(b => !isSkippable(b.text))
    .map(b => ({ quoted: b.quoted, text: clean(b.text) }))
    // 太短的多半是「(有 Accumulative)」這種殘句，寧可不顯示也不要爛摘要
    .filter(b => b.text.length >= 20)

  // 引言段降級：開頭的引言多半是「本文轉由 AI 潤稿」這類聲明，不是內容。
  // 有正常段落就用正常段落，整篇只有引言時才退回引言。
  const para =
    candidates.find(b => !b.quoted)?.text ?? candidates[0]?.text ?? ""
  if (!para) return ""
  return para.length > max ? para.slice(0, max) + "…" : para
}
