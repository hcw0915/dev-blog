// 从文件系统读取 playgrounds
import type { PlaygroundItem } from "./types"

// 使用 import.meta.glob 动态导入所有 playground 文件
const htmlModules = import.meta.glob<string>('./*/index.html', { as: 'raw', eager: true })
const cssModules = import.meta.glob<string>('./*/style.css', { as: 'raw', eager: true })
const jsModules = import.meta.glob<string>('./*/index.js', { as: 'raw', eager: true })
const metadataModules = import.meta.glob<{
  title: string
  description: string
  tags: string[]
  author: string
  createdAt: string
}>('./*/metadata.json', { eager: true })

// 构建 playgrounds 数组
export const playgrounds: PlaygroundItem[] = Object.keys(metadataModules).map((metadataPath) => {
  // 从路径中提取 playground id（例如：./hello-world/metadata.json -> hello-world）
  const id = metadataPath.replace('./', '').replace('/metadata.json', '')
  
  // 获取对应的文件内容
  const htmlPath = `./${id}/index.html`
  const cssPath = `./${id}/style.css`
  const jsPath = `./${id}/index.js`
  
  const html = htmlModules[htmlPath] || ''
  const css = cssModules[cssPath] || ''
  const js = jsModules[jsPath] || ''
  const metadata = metadataModules[metadataPath]
  
  return {
    id,
    html,
    css,
    js,
    ...metadata
  } as PlaygroundItem
})
