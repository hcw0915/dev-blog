import { SERIES } from "@/config"

export interface SeriesPosition {
  id: string
  title: { zh: string; en: string }
  slugs: string[]
  /** 0 起算 */
  index: number
  prev: string | null
  next: string | null
}

/** 這篇文章在哪個系列、第幾篇；不在任何系列回 null */
export const seriesOf = (slug: string): SeriesPosition | null => {
  for (const s of SERIES) {
    const index = s.slugs.indexOf(slug)
    if (index === -1) continue
    return {
      ...s,
      index,
      prev: s.slugs[index - 1] ?? null,
      next: s.slugs[index + 1] ?? null
    }
  }
  return null
}

/**
 * build 時呼叫：系列裡的每個 slug 都必須是存在且公開的文章，同一篇也不能掛在兩個系列。
 * 在 Inkdrop 下架或改 slug 後忘了改 SERIES，build 會直接失敗，而不是線上出現壞連結。
 */
export const assertSeries = (existingSlugs: Iterable<string>) => {
  const exists = new Set(existingSlugs)
  const seen = new Map<string, string>()
  const problems: string[] = []
  for (const s of SERIES) {
    for (const slug of s.slugs) {
      if (!exists.has(slug)) problems.push(`系列「${s.id}」引用了不存在或未公開的文章：${slug}`)
      const other = seen.get(slug)
      if (other) problems.push(`文章 ${slug} 同時在系列「${other}」與「${s.id}」`)
      seen.set(slug, s.id)
    }
  }
  if (problems.length) throw new Error(`SERIES 設定有誤（src/config.ts）：\n  ${problems.join("\n  ")}`)
}
