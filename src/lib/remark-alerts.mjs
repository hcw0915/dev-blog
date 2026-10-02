/**
 * GitHub 風格的提示框：`> [!NOTE]`、`> [!TIP]`、`> [!IMPORTANT]`、`> [!WARNING]`、`> [!CAUTION]`。
 *
 * 在 Inkdrop 裡照常寫引言，第一行放標記即可；這裡把那種 blockquote 改成帶類型的提示框，
 * 標記換成標題。沒有標記的引言不受影響。樣式在 BlogPost.astro 的 `.callout`。
 *
 * ponytail: 自己走樹而不 import unist-util-visit —— 它只是 astro 的間接相依，pnpm 下不保證能直接 import。
 */
const TITLES = {
  note: "備註",
  tip: "提示",
  important: "重要",
  warning: "注意",
  caution: "警告",
}
const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/i

function convert(node) {
  const first = node.children?.[0]
  const text = first?.type === "paragraph" ? first.children?.[0] : undefined
  const m = text?.type === "text" ? text.value.match(MARKER) : null
  if (!m) return

  const type = m[1].toLowerCase()
  text.value = text.value.slice(m[0].length)
  // 標記自成一行時，剩下的段落可能是空的（或只剩換行）
  if (!text.value) first.children.shift()
  if (first.children[0]?.type === "break") first.children.shift()
  if (first.children.length === 0) node.children.shift()

  node.data = { hName: "div", hProperties: { className: ["callout", `callout-${type}`] } }
  node.children.unshift({
    type: "paragraph",
    data: { hName: "p", hProperties: { className: ["callout-title"] } },
    children: [{ type: "text", value: TITLES[type] }],
  })
}

function walk(node) {
  if (node.type === "blockquote") convert(node)
  node.children?.forEach(walk)
}

export default function remarkAlerts() {
  return tree => walk(tree)
}

// 自檢：node src/lib/remark-alerts.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const quote = value => ({
    type: "root",
    children: [{ type: "blockquote", children: [{ type: "paragraph", children: [{ type: "text", value }] }] }],
  })
  const run = tree => (remarkAlerts()(tree), tree.children[0])

  const a = run(quote("[!WARNING]\n內容"))
  console.assert(a.data.hProperties.className[1] === "callout-warning", "類型")
  console.assert(a.children[0].children[0].value === "注意", "標題")
  console.assert(a.children[1].children[0].value === "內容", "標記被拿掉")

  const b = run(quote("[!note] 同一行"))
  console.assert(b.children[1].children[0].value === "同一行", "標記與內容同一行")

  const c = run(quote("一般引言"))
  console.assert(!c.data, "沒有標記的引言不動")
  console.log("remark-alerts ok")
}
