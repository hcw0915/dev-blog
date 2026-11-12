---
name: edit-inkdrop-first
description: 改文章一律先改 Inkdrop 筆記，再把它同步成 drafts/ 預覽；不要先改 drafts 再抄回 Inkdrop
metadata:
  type: feedback
---

2026-11-12 PWA 那篇的加強版（emoji、提示框、mermaid）我是先改 `src/pages/drafts/` 的預覽檔，
他確認後再整份抄進 Inkdrop。他說：「你的顺序应该是 先inkdrop 再处理同步过来，不是反过来」。

**Why:** Inkdrop 是唯一的來源，drafts/ 只是它的快照（AGENTS.md 發表流程第 2 步）。先改快照再抄回去，
兩份會分歧，也容易在抄寫時出錯（這次 `<` 就在中間被吃掉過一次）。

**How to apply:**
- 新文章：先在 Inkdrop 建 `public: false` 筆記，再從筆記產生 `drafts/<slug>.md` 給他預覽
- 修改：先改 Inkdrop 筆記，再重新產生 drafts 快照；不要在 drafts 上直接改
- 已公開（`public: true`）的筆記一改就會在兩分鐘內上線，所以改之前先把要改的內容講清楚、等他同意

相關：[[ask-before-publishing]] [[posts-dir-autopublishes]]
