---
name: verify-in-users-dev-server
description: Antonio 看的是長時間運行的 localhost:5000 dev server；Vite 預打包快取過期會讓 React island 整塊空白（沒動 node_modules 也會發生），重啟並清 .vite，驗證要在他實際用的環境做
metadata:
  type: feedback
---

Antonio 平常開著 `astro dev --port 5000` 看網站，那個程序可以連跑好幾天不重啟。

2026-09-11 我在這個 repo 裝了又移除 Pagefind（`pnpm add` / `pnpm remove`），只拿
`astro build` + `astro preview` 驗證，全部通過；但他的 dev server 從前一天就在跑，
`node_modules/.vite` 的預打包依賴過期，瀏覽器端出現兩份 React（`Cannot read properties
of null (reading 'useState')`、`jsxDEV is not a function`），語言切換元件 hydrate 時崩潰、
把 SSR 輸出的按鈕也清掉。他連說兩次「沒看到語言切換」，正式站其實是好的。

同一天第二次：這次沒有動 `node_modules`，只刪了幾個 playground 資料夾、連跑幾次 `pnpm build`
（dev server 同時開著）。他回報 `/en/playground/vanilla/warning-bar`「沒看到內容」：頁首正常、
下面整片空白。瀏覽器 console 是 `504 (Outdated Optimize Dep)` 加
`Error hydrating /src/components/Sandbox.tsx … Failed to fetch dynamically imported module`，
整個編輯器 island 沒掛上去，所有 playground 編輯頁都一樣。重啟 + 清 `.vite` 後恢復。
確切觸發原因沒有驗證（推測是 dev server 跑太久、中途有 build），所以不能只在改 node_modules 時才懷疑它。

**Why:** preview build 是乾淨的，dev server 的 Vite 快取不是；兩者會分歧，而他看的是後者。

**How to apply:**
- 重開 dev server 一律加 `--host 127.0.0.1`：2026-10-02 不加時只聽在 IPv6 `[::1]:5000`，他的瀏覽器走 127.0.0.1 回「地址錯誤」，
  而我用 curl localhost 走 IPv6 驗證是 200，沒發現。驗證時要打 `http://127.0.0.1:5000`
- 任何改動 `node_modules` 的操作（pnpm add/remove/install、升級套件）之後：找 5000 port 上的
  PID 停掉（`pkill -f "astro dev"` 對不到，實際 cmdline 是 `astro.js dev`），
  `rm -rf node_modules/.vite`，再在背景 `npm run dev -- --port 5000` 重啟
- 他回報「看不到 / 不見了 / 沒內容」時，先查 localhost:5000 在瀏覽器端的 console 錯誤，
  不要只看 HTML 輸出或 preview build
- console 出現 `Outdated Optimize Dep`（504）或 `Error hydrating … Failed to fetch dynamically imported module`
  就是這個快取問題，直接照上面重啟 + 清 `.vite`，不必去懷疑元件或草稿
- dev server 的輸出寫在 scratchpad 的 `dev-server.log`，`lsof -p <PID>` 看 fd 1 就找得到
- 截圖裡出現 localhost:5000 就代表他在看 dev server

2026-10-12 找到根因並修掉：`@splinetool/runtime`、`@monaco-editor/react`、`mermaid` 都是動態 import，
Vite 啟動時沒掃到，第一次進該頁才發現 → 重新預打包 → 換掉 browserHash，已載入的頁面拿舊 `?v=` 去抓就 404。
清 `.vite` 重啟反而必然觸發一次。已在 astro.config.mjs 的 `vite.optimizeDeps.include` 列出這些套件，啟動就打包。
之後再遇到同樣錯誤：先看是不是新加了別的動態 import 大套件，補進 include，而不是只重啟。

相關：[[antonio-wants-root-cause-fixes]] [[inkdrop-publish]]
