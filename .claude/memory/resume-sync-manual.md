---
name: resume-sync-manual
description: 履歷改完 Canva 之後，網站上的 PDF 與 About 頁不會自動跟著變，要手動同步兩處
metadata:
  type: project
---

網站上的履歷有兩份副本，都不會跟著 Canva 自動更新：

1. `public/Antonio_Hou_resume.pdf`：靜態檔，要從 Canva 匯出 PDF（A4）後覆蓋
2. `src/i18n/translations.ts` 的 About 工作經歷（中英各一份）：職稱、期間等文字是寫死的

2026-11-27 把 Brilliant Gaming 的職稱從 Mid–Sr. 改成 Sr.，Canva 改完才發現這兩處還是舊的。
他被問到要不要自動同步（watcher 輪詢 Canva API，或改連 Canva 公開檢視頁）時，選了**維持手動**。

**How to apply:** 每次改 Canva 履歷，存檔後順手匯出 PDF 換掉 `public/` 那份，並 grep `translations.ts` 對應文字一起改，
渲染 PDF 預覽和舊版比對過再提交推送（這屬於網站改動，驗證過就可以推）。
