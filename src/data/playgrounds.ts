// 重新导出，保持向后兼容
export type { PlaygroundItem } from "./playgrounds/types"
export { playgrounds } from "./playgrounds/index"

// 所有 playgrounds 现在从文件系统读取
// 每个 playground 都有自己的文件夹，包含：
// - index.html (HTML 代码)
// - style.css (CSS 代码)
// - index.js (JavaScript 代码)
// - metadata.json (标题、描述、标签等信息)
