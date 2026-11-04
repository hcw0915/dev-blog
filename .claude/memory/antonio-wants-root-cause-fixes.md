---
name: antonio-wants-root-cause-fixes
description: Antonio 明確要求根除式修法，拒絕只補症狀的小 diff
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f64155f6-9b97-406a-9925-e33b605e7431
  modified: 2026-09-10T14:50:18.185Z
---

原話：「都处理吧 要根除的方式 不要 偷懒」。在 dev-blog 的 UI 改版中，他要的
不是把幾個畫面問題各補一塊，而是找到共同成因一次解掉。

**Why:** 他自己就是前端工程師，看得出症狀修法會在別處復發。實際案例：白字
壓在淺色 tag 上讀不到，正解不是逐個挑顏色，而是用 WCAG 對比度算前景色
（`src/lib/color.mjs`）＋ 一支會 exit 1 的檢查腳本，之後新增顏色自動守住。

**How to apply:** 提修法前先問「這個 bug 的同類還有哪些地方會犯」。重複的
檔案要抽成共用元件而不是兩邊各改一次；人工挑的常數要換成算出來的。
同時保留可跑的檢查，讓修法在未來也成立。

相關：[[judge-content-not-proxies]]
