#!/usr/bin/env node
/**
 * toPlainText 的回歸檢查：每一條都是實際在站上抓到過的壞例子。
 *
 *   node tools/check-plaintext.mjs
 */
import assert from "node:assert/strict"
import { toPlainText } from "../src/lib/plaintext.mjs"

const has = (md, s) => {
  const out = toPlainText(md)
  assert.ok(out.includes(s), `應包含 ${JSON.stringify(s)}\n  實際：${JSON.stringify(out)}`)
}
const lacks = (md, s) => {
  const out = toPlainText(md)
  assert.ok(!out.includes(s), `不應包含 ${JSON.stringify(s)}\n  實際：${JSON.stringify(out)}`)
}

// three-demo：程式碼裡的 < 與 > 之間被當成標籤整段刪掉，註解裡的「旋轉」搜不到
has("```js\nif (a < b) {\n  // 重置角速度，避免旋轉異常\n}\nconst c = d > e\n```", "旋轉異常")
// JSX 元件名要搜得到
has("```jsx\n<Canvas flat>\n  <mesh />\n</Canvas>\n```", "<Canvas flat>")
// js-proxy：連結文字有巢狀中括號，網址殘留在摘錄裡
has("參考 [[筆記] Javascript Proxy](https://blog.twjoin.com/x)", "[筆記] Javascript Proxy")
lacks("參考 [[筆記] Javascript Proxy](https://blog.twjoin.com/x)", "](https")
// 圖片整個拿掉
lacks("![clipboard.png](/posts/a_1.png) 後面的字", "clipboard")
has("![clipboard.png](/posts/a_1.png) 後面的字", "後面的字")
// 段落裡的 HTML 標籤拿掉、內容留下
lacks("<details><summary>標題</summary>內容</details>", "<summary>")
has("<details><summary>標題</summary>內容</details>", "內容")
// fence 那一行本身不進索引
lacks("```ts\nconst x = 1\n```", "```")
has("```ts\nconst x = 1\n```", "const x = 1")
// 波浪號 fence 也要認
has("~~~\nuseEffect(() => {}, [])\n~~~", "useEffect(() => {}, [])")
// 沒有閉合的 fence：後面視為程式碼保留
has("前言\n```js\nconst ok = b < c && d > e", "b < c && d > e")
// 段落裡的比較式不是標籤
has("當 a < b 且 c > d 時", "a < b 且 c > d")
// 識別字的底線保留
has("呼叫 use_state 之後", "use_state")
// 標題、清單、引言記號拿掉
lacks("## 核心原則\n- 第一點\n> 引言", "##")
has("## 核心原則\n- 第一點\n> 引言", "第一點")

console.log("✓ toPlainText 檢查全部通過")
