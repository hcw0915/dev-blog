/**
 * 每個 playground 是一個資料夾，裡面的任何檔案都算數（metadata.json 除外）。
 * 先前只認 index.html / style.css / index.js 三個固定檔名，做不出多檔案專案。
 */
import type { PlaygroundItem, PlaygroundMeta } from "./types"

const raw = import.meta.glob<string>("./*/**", {
  query: "?raw",
  import: "default",
  eager: true
})
const metas = import.meta.glob<PlaygroundMeta>("./*/metadata.json", {
  import: "default",
  eager: true
})

export const playgrounds: PlaygroundItem[] = Object.entries(metas)
  .map(([metaPath, meta]) => {
    const id = metaPath.slice(2, -"/metadata.json".length)
    const prefix = `./${id}/`
    const files: Record<string, string> = {}
    for (const [p, content] of Object.entries(raw)) {
      if (!p.startsWith(prefix) || p.endsWith("/metadata.json")) continue
      files[p.slice(prefix.length)] = content
    }
    return {
      ...meta,
      id,
      template: meta.template ?? "vanilla",
      entry: meta.entry ?? "index.html",
      files
    }
  })
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

export const playgroundsByTemplate = (template: PlaygroundItem["template"]) =>
  playgrounds.filter(p => p.template === template)
