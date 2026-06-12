import { COLOR_MAP } from "@/config"

/** 單一 tag 對應的識別色（未知 tag 回灰色） */
export const colorForTag = (tag: string): string =>
  COLOR_MAP[tag.toLowerCase()] ?? '#a1a1aa'

/** 文章 tags 的代表色（取第一個 tag） */
export const colorForTags = (tags: string[] = []): string =>
  colorForTag(tags[0] ?? '')
