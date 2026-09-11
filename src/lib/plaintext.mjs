/**
 * Markdown 轉搜尋用純文字。
 *
 * 程式碼區塊原樣保留（讀者會搜 API 名稱、JSX 元件名），只有一般段落才拿掉 markdown / HTML 語法。
 * 先前把 HTML 標籤的正規式 `/<[^>]+>/` 套在整份文件上：它會跨行，從程式碼裡某個 `<` 一路吃到
 * 下一個 `>`，中間的程式碼連同註解整段消失 —— 寫在註解裡的「旋轉」就這樣搜不到。
 *
 * 純 .mjs：tools/check-plaintext.mjs 要能直接 import 同一份邏輯。
 */

const OPEN_FENCE = /^[ \t]*(`{3,}|~{3,})/

/** 一般段落：拿掉 markdown 與 HTML 語法 @param {string} text */
const stripProse = text =>
  text
    // 圖片整個拿掉；alt 允許一層巢狀中括號
    .replace(/!\[(?:[^[\]]|\[[^\]]*\])*\]\([^)]*\)/g, "")
    // 連結只留文字；文字允許一層巢狀中括號，例如 [[筆記] Proxy](url)
    .replace(/\[((?:[^[\]]|\[[^\]]*\])*)\]\([^)]*\)/g, "$1")
    // 只認真正的標籤格式且不跨行：`<` 後面緊接字母；「a < b」這種比較不會被當成標籤
    .replace(/<\/?[a-zA-Z][\w-]*(?:\s[^<>\n]*)?\/?>/g, " ")
    .replace(/^[ \t]*(#{1,6}|>|[-*+]|\d+\.)[ \t]+/gm, "")
    // 底線保留：識別字（use_state）在段落裡也會出現
    .replace(/[*~`]/g, "")

/** @param {string} md @returns {string} */
export const toPlainText = md => {
  const parts = []
  let buf = []
  /** @type {RegExp | null} 目前所在程式碼區塊的結束 fence；null 代表在一般段落 */
  let close = null

  const flush = inCode => {
    if (!buf.length) return
    const text = buf.join("\n")
    parts.push(inCode ? text : stripProse(text))
    buf = []
  }

  for (const line of md.split("\n")) {
    if (!close) {
      const m = line.match(OPEN_FENCE)
      if (m) {
        flush(false)
        close = new RegExp(`^[ \\t]*${m[1][0] === "`" ? "`" : "~"}{${m[1].length},}[ \\t]*$`)
        continue // fence 那一行本身（```ts）不進索引
      }
    } else if (close.test(line)) {
      flush(true)
      close = null
      continue
    }
    buf.push(line)
  }
  // 沒有閉合的 fence：剩下的都當程式碼保留
  flush(close !== null)

  return parts.join(" ").replace(/\s+/g, " ").trim()
}
