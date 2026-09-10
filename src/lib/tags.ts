import {
  COLOR_MAP,
  NOISE_TAGS,
  TAG_WEIGHT,
  TAG_WEIGHT_DEFAULT
} from "@/config"
// @ts-expect-error — 純 JS 模組，共用給 tools/check-contrast.mjs
import { foregroundFor, inkOn } from "@/lib/color.mjs"

const FALLBACK = ["#a1a1aa", "#d4d4d8"] as const

export interface TagColor {
  tag: string
  base: string
  accent: string
}

const weightOf = (tag: string) => TAG_WEIGHT[tag] ?? TAG_WEIGHT_DEFAULT

/** 卡片底色：亮色主題是白，暗色主題是 zinc-950 上的一層白紗 */
const SURFACE_LIGHT = "#ffffff"
const SURFACE_DARK = "#131317"

export interface TagInk {
  /** tag 本色，用作填滿背景 */
  color: string
  /** 壓在本色上讀得清楚的文字色（黑或白，自動算） */
  fg: string
  /** 亮色主題下當文字用的顏色 */
  inkLight: string
  /** 暗色主題下當文字用的顏色 */
  inkDark: string
}

/**
 * 一個 tag 的完整可讀配色。前景色一律由對比度算出來，不人工指定 ——
 * 白字寫死的話，#F7DF1E（Javascript）這種亮色上就完全讀不到。
 */
export const inkForTag = (tag: string): TagInk => {
  const color = colorForTag(tag)
  return {
    color,
    fg: foregroundFor(color),
    inkLight: inkOn(color, SURFACE_LIGHT),
    inkDark: inkOn(color, SURFACE_DARK)
  }
}

/** 直接吐成 inline style 的 CSS 變數 */
export const tagStyle = (tag: string): string => {
  const ink = inkForTag(tag)
  return `--tag-color:${ink.color};--tag-fg:${ink.fg};--tag-ink:${ink.inkLight};--tag-ink-dark:${ink.inkDark}`
}

/** 單一 tag 的識別色（未知 tag 回灰色） */
export const colorForTag = (tag: string): string =>
  COLOR_MAP[tag.toLowerCase()]?.[0] ?? FALLBACK[0]

/**
 * 依特異度排序後的色盤，主題色在最前面。
 * 這是唯一決定「哪個 tag 代表這篇文章」的地方 —— 首頁色點、文章列表、
 * OG 圖全部走這條，改權重表就一次改到所有地方。
 */
export const paletteForTags = (
  tags: string[] = [],
  { includeNoise = false } = {}
): TagColor[] =>
  tags
    .map(t => t.toLowerCase())
    .filter(t => COLOR_MAP[t] && (includeNoise || !NOISE_TAGS.has(t)))
    .sort((a, b) => weightOf(b) - weightOf(a))
    .map(t => ({ tag: t, base: COLOR_MAP[t][0], accent: COLOR_MAP[t][1] }))

/** 文章的主題色。noise tag 被排除後若沒有任何已知 tag，退回含 noise 的第一個 */
export const colorForTags = (tags: string[] = []): string =>
  paletteForTags(tags)[0]?.base ??
  paletteForTags(tags, { includeNoise: true })[0]?.base ??
  FALLBACK[0]

/** 文章的主題 tag 名稱（原樣保留大小寫，找不到時回 undefined） */
export const primaryTag = (tags: string[] = []): string | undefined => {
  const primary = paletteForTags(tags)[0]?.tag
  return primary && tags.find(t => t.toLowerCase() === primary)
}

/** 要顯示給讀者的 tag：濾掉 noise、依特異度排序 */
export const displayTags = (tags: string[] = []): string[] => {
  const order = paletteForTags(tags).map(p => p.tag)
  const known = order
    .map(t => tags.find(x => x.toLowerCase() === t))
    .filter((t): t is string => Boolean(t))
  // COLOR_MAP 沒收錄的 tag 仍要顯示，只是排在已知色之後
  const unknown = tags.filter(
    t => !COLOR_MAP[t.toLowerCase()] && !NOISE_TAGS.has(t.toLowerCase())
  )
  return [...known, ...unknown]
}
