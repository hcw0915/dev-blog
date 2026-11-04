---
name: tag-by-topic-not-implementation
description: 文章標籤掛「在講什麼」不掛「用什麼實作」；依序判斷效能 → 框架獨有 → 語言 → General
metadata:
  type: feedback
---

2026-10-02 他看到首頁：排程兩篇顯示 REACT、dev-panel 顯示 REACT，說「這是效能吧」「這是 General」，
並說「你需要学习判断 是否框架独有, 是否影响效能 等等评分」。

原因是我把「實作用了 React／Next」也掛成標籤，而 React 權重 75 會壓過 General（10），
Performance 當時甚至不在配色表裡、沒資格當主標籤（已補進 config.ts，權重 76）。

**Why:** 主標籤決定首頁 chip、主題色、OG 圖與相關文章配對。掛錯不是小事，讀者看到的分類就是錯的。

**How to apply:** 規則寫在 CLAUDE.md「標題與標籤」的判斷表。掛標籤前依序問：
效能？→ Performance；拿掉框架還成立？不成立才掛框架；語言特性？→ JS/TS；其餘 → General。
新標籤要先確認它在 COLOR_MAP 與 TAG_WEIGHT 裡，否則它永遠當不了主標籤，並跑 tools/check-contrast.mjs。

相關：[[ask-before-publishing]]
