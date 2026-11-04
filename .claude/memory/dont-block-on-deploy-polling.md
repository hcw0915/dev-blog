---
name: dont-block-on-deploy-polling
description: 小改動推完就回報，不要卡幾分鐘輪詢正式站部署
metadata:
  type: feedback
---

文案、設定這類小改動：本機驗證、push 完就直接回報，不要再跑幾分鐘的正式站輪詢等 Vercel 部署。

**Why:** 2026-10-16 他中斷了等部署的輪詢，說「你怎麼那麼久」。
**How to apply:** 正式站驗證只在風險高（建置設定、轉址、會讓 build 失敗的改動）或他要求時做，而且放背景跑；回報時說明「已推送，部署約 1–2 分鐘」。相關：[[verify-in-users-dev-server]]
