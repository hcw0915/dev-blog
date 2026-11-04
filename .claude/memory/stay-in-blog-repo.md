---
name: stay-in-blog-repo
description: 在 dev-blog 的 session 裡，「寫文件／寫文章」指的是寫 blog；不要去動他的工作 repo
metadata:
  type: feedback
---

2026-10-02 我分析了 工作 repo 的啟動時序圖，建議「內部架構文件值得寫、blog 併進另一篇當主圖」，
又自己補了一句「要動手的話先做內部那份」。他回「依照你建议先给我吧」，我就在 工作 repo 開了
worktree 和本地分支、寫了架構文件。
他說：「我是要你写 blog 不是要你动其他的」。已清掉（沒 commit、沒推），內容備份在 scratchpad。

**Why:** 這個 session 的工作目錄是 dev-blog，他找我是為了寫 blog。他的工作 repo 是公司的，
讀它來取材可以，但寫進去是另一回事，要他明確說「改工作 repo」才算。我把「我建議的優先順序」
當成了「他同意的範圍」。

**How to apply:**
- 在 dev-blog session 裡，「文件／文章／寫一份」預設是 blog 草稿（Inkdrop、public: false、drafts/ 預覽）
- 對 工作 repo：只讀。要寫入、開分支、開 worktree，必須他明說
- 我給了多個選項時，他說「照你建議」，先確認他指的是哪一個，尤其其中一個會動到別的 repo

相關：[[ask-before-publishing]]
