---
name: check-wrapping-after-layout
description: 改版面寬度或寫完草稿後，要實際看有沒有孤字、表格短欄一行一字、圖表過大
metadata:
  type: feedback
---

2026-11-16 內文從 48rem 加寬到 52rem 後，他截圖指出：短循環影片那篇的 xychart 灰底生硬、撐太大；表格「解析度」被擠成「解析／度」。
他說：「你应该要确认 是否有 draft 之后孤字的状况」。我加寬時只截了文章頂部，沒捲到表格和圖表。

**Why:** 中文任何兩字間都能斷行，寬度一變，段落最後一行、表格短欄就可能只剩一個字；這在頂部截圖看不出來。

**How to apply:**
- 改內文寬度、表格或圖表樣式後，截整篇（含表格、mermaid 圖）而不只是第一屏，找孤字與一行一字的欄
- 草稿交給他看之前也掃一遍同樣的地方
- 已用版面層修掉：`text-wrap: pretty`、`th, td { min-width: 6em }`、xychart 透明底與 560×300（BlogPost.astro）；再出現先看是不是新的元素沒吃到這些規則

相關：[[verify-in-users-dev-server]]
