export type PlaygroundTemplate = "vanilla" | "react"

export interface PlaygroundMeta {
  title: string
  description: string
  tags: string[]
  author: string
  createdAt: string
  /** 決定出現在哪個列表；預設 vanilla */
  template?: PlaygroundTemplate
  /** 預覽入口，預設 index.html */
  entry?: string
  /** 對應文章的 slug；文章已發佈時，playground 頁會連過去 */
  post?: string
}

export interface PlaygroundItem extends PlaygroundMeta {
  id: string
  template: PlaygroundTemplate
  entry: string
  /** 資料夾內所有檔案（相對路徑 → 內容），metadata.json 除外 */
  files: Record<string, string>
}
