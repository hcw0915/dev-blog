/**
 * 頁面的 H1 是版型用 frontmatter 的 title 畫的；內文再寫 `# 標題` 就變成兩個 H1、標題連續出現兩次
 * （從舊 blog 搬來的筆記大多開頭自帶一個）。內文第一個區塊是 H1 就拿掉，其餘的 H1 降成 H2。
 */
export default function remarkSingleH1() {
  return tree => {
    const [first] = tree.children
    if (first?.type === "heading" && first.depth === 1) tree.children.shift()
    for (const node of tree.children) if (node.type === "heading" && node.depth === 1) node.depth = 2
  }
}
