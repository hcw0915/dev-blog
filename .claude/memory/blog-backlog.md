---
name: blog-backlog
description: Antonio 認可但延後的 blog 改進項目（2026-10-12）與 i18n 範圍規則
metadata:
  type: project
---

延後的待辦（2026-10-12 他說「待办」「先保留」）：
- 把 CLAUDE.md 寫作規範做成發佈前自動檢查（簡體詞表、圖片 alt、殘留 /drafts/ 圖片路徑、工作 repo 內部代號）
- 每篇文章的 OG 分享圖：先保留，未查現況
- 「每篇配 playground」不是固定規則，看文章實際內容決定
- 草稿（iframe/History、snapshot、啟動排程兩篇）先放著，不要催

**i18n 範圍：** 文章本身不翻譯沒關係；文章以外的介面與說明（playground 說明、頁面文字、主題名）英文頁都要有英文。
**Why:** 他明說「文章不翻译没关系, 其他的要翻译」。
**How to apply:** 新增 playground 必須寫 descriptionEn（缺了 build 會失敗）；新 UI 字串進 translations.ts。相關：[[ask-before-publishing]]
