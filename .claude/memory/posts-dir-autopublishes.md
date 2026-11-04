---
name: posts-dir-autopublishes
description: 任何 src/pages/posts/ 的檔案變動（含 git rm）會被 watcher 兩分鐘內自動 commit + push 上線
metadata:
  node_type: memory
  type: project
  originSessionId: f64155f6-9b97-406a-9925-e33b605e7431
  modified: 2026-10-05T10:56:56.101Z
---

`tools/watch-publish.sh` 每 120 秒對 `src/pages/posts/*.md` 與 `public/posts` 做 `git add -A` 並推上 main。不只 Inkdrop 匯出，**手動刪檔、改檔也會被它自動發佈**。另外 live-export 只寫不刪：筆記改標題（slug 變）或設 `public: false` 後，舊 md 會一直留在 repo、照樣上線。

2026-10-05 實際踩到：刪 5 個舊匯出檔後還在補轉址，watcher 已先把刪除推上去，舊網址 404 了幾小時。

**Why:** posts/ 不是「本機草稿區」，動了就是上線。
**How to apply:** 下架或改網址時，轉址（vercel.json）要**先**推上線，再刪 md；或把刪檔與轉址在兩分鐘內同一筆 commit 推出。下架文章要三步：Inkdrop 設 `public: false` + 刪 md + 301。相關：[[ask-before-publishing]]
