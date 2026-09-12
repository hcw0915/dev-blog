/**
 * 全站搜尋索引：每篇文章的網址、標題、標籤、日期與純文字內文，build 時輸出成一個靜態 JSON。
 *
 * 為什麼不用 Pagefind：它的中文分詞依上下文切詞，「旋轉角度」在索引裡可能是一整個詞，
 * 查「旋轉」就對不上。對照 markdown 原文實測，zh-tw / zh / zh-cn / ja 四種設定召回率都是 0.77，
 * 「四元數」零命中還抓錯一篇，亂碼查詢回傳 11 筆。中文讀者期待的是「字出現在文章裡就找得到」，
 * 也就是子字串比對；52 篇文章直接 includes() 是精確的，開發模式也能用。
 *
 * ponytail: 索引一次整包載入，第一次按 ⌘K 才抓。含 playground 的檔案內容後是 342KB
 * （brotli 後 87KB）—— 為了能搜到 mask-composite 這類屬性，多付約 21KB 壓縮量。
 * 文章到上千篇、或壓縮後超過約 300KB 時，再換回分片索引（Pagefind 之類）。
 */
import type { APIRoute } from "astro"
import { displayTags } from "@/lib/tags"
import { playgrounds } from "@/data/playgrounds/index"
import { toPlainText } from "@/lib/plaintext.mjs"

export interface SearchDoc {
  /** 網址 */
  u: string
  /** 標題 */
  t: string
  /** 顯示用標籤（已濾掉 noise tag） */
  g: string[]
  /** 發佈日期 YYYY.MM.DD */
  d: string
  /** 純文字內文：程式碼區塊原樣保留，一般段落拿掉 markdown 語法（見 lib/plaintext.mjs） */
  b: string
  /** 非文章的來源標記，目前只有 playground；文章不帶這個欄位 */
  k?: string
}

const fmtDate = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export const GET: APIRoute = () => {
  const modules = import.meta.glob("./posts/*.md", { eager: true }) as Record<string, any>
  const docs: SearchDoc[] = Object.values(modules)
    .filter(p => p.frontmatter.public)
    .sort((a, b) => new Date(b.frontmatter.createdAt).valueOf() - new Date(a.frontmatter.createdAt).valueOf())
    .map(p => ({
      u: p.url,
      t: p.frontmatter.title,
      g: displayTags(p.frontmatter.tags ?? []),
      d: fmtDate(p.frontmatter.createdAt),
      b: toPlainText(p.rawContent())
    }))

  // playground 也進索引：搜「mask-composite」要找得到用到它的範例。
  // 內文收的是每個檔案的路徑與內容，所以搜 CSS 屬性、函式名都能命中。
  const playgroundDocs: SearchDoc[] = playgrounds.map(p => ({
    u: `/playground/${p.template}/${p.id}`,
    t: p.title,
    g: p.tags,
    d: p.createdAt.replace(/-/g, "."),
    b: [p.description, ...Object.entries(p.files).map(([path, content]) => `${path}\n${content}`)].join("\n"),
    k: "playground"
  }))

  return new Response(JSON.stringify([...docs, ...playgroundDocs]), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  })
}
