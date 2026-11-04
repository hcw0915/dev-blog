---
name: judge-content-not-proxies
description: Antonio 要求評估內容價值時實際讀過內容，不要用字數/章節數這類代理指標
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f64155f6-9b97-406a-9925-e33b605e7431
  modified: 2026-09-10T14:50:02.243Z
---

被要求挑「值得放首頁精選」的文章時，我先用正文字數排序推薦，被打回：
「请你看内容 要具备 中高工程师的」。實際讀過章節結構後結論完全相反 ——
字數第一的 `react-three-fiber-apple-watch` 是「相機過渡的 5 種做法」廣度羅列，
`next-images` 有 35 個章節但是把 API props 抄一遍。

**Why:** 代理指標（字數、章節數、圖片數）衡量的是體積不是判斷力。他要的
訊號是「有真實約束、有被否決的方案與否決理由」這種資深工程決策敘事。

**How to apply:** 任何「哪個比較好 / 值得推薦」的判斷，先讀實際內容再給結論；
需要排序時把代理指標當成篩選候選的第一步，不能當成答案。策展類決定先給
他判斷依據，不要替他拍板。

相關：[[antonio-wants-root-cause-fixes]]
