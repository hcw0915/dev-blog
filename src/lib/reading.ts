/** 文章的閱讀時間與預覽摘要。文章頁與搜尋索引共用，兩邊算出來的分鐘數才會一致。 */
import { toPlainText } from "@/lib/plaintext.mjs"

const CJK = /[一-鿿㐀-䶿]/g

/** 閱讀時間：CJK 字元以 400 字/分、其餘以 220 詞/分估算（略過程式碼區塊） */
export const readingMinutes = (raw: string): number => {
  const prose = raw.replace(/```[\s\S]*?```/g, "")
  const cjkChars = (prose.match(CJK) ?? []).length
  const words = (prose.replace(CJK, " ").match(/[A-Za-z0-9]+/g) ?? []).length
  return Math.max(1, Math.round(cjkChars / 400 + words / 220))
}

/** 摘要：第一個不是標題、圖片、提示框、程式碼的段落（多數文章開頭是一段引言） */
export const excerptOf = (raw: string, max = 160): string => {
  const block = raw
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .find(b => b && !/^(#|!\[|<|> \[!|\||---)/.test(b))
  if (!block) return ""
  const text = toPlainText(block.replace(/^>\s?/gm, "")).replace(/\s+/g, " ").trim()
  return text.length > max ? text.slice(0, max) + "…" : text
}

/** 二級標題，給預覽當目錄 */
export const headingsOf = (raw: string): string[] =>
  [...raw.replace(/```[\s\S]*?```/g, "").matchAll(/^##\s+(.+)$/gm)].map(m =>
    toPlainText(m[1]).trim()
  )
