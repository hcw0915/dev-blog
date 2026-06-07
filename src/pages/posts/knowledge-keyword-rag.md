---
public: true
slug: knowledge-keyword-rag
layout: ../../layouts/BlogPost.astro
title: Knowledge 系統總覽：用 Keyword RAG 打造團隊 AI 知識庫
createdAt: 1780810884082
updatedAt: 1780810884082
tags:
  - AI
heroImage: /placeholder-hero.png
---

> 用 Keyword RAG 解決團隊導入 AI 時最常見的問題：跨對話、跨成員、跨 agent 的「失憶」與「重複說明背景」。本文是這套 Knowledge 系統的總覽。

## 為什麼要做這套系統？

核心理念是一句話：**先查資料，再讓 AI 回答。**

傳統上 AI 要回答問題，只能依賴當下對話、模型本身的知識，或臨時貼上的專案上下文。當專案變大、歷史決策變多，就容易遺漏背景、誤解舊邏輯，或反覆確認同樣的問題。RAG（Retrieval-Augmented Generation）的作用，是讓 AI 在回答前先從外部知識來源檢索相關內容，再結合這些資料生成更準確的判斷。

這套做法要解決的具體痛點：

- 某些模組長期由特定成員維護，很多設計背景與歷史取捨不會寫在程式碼表面。
- 只看當前 diff 或單一檔案，容易誤刪保護邏輯、誤解舊決策。
- 任務跨成員、跨 session、跨 agent 時，背景散在聊天、commit 訊息與個人記憶裡。

帶來的好處：減少跨對話失憶與重複說明、讓工具穩定繼承團隊偏好與規則、保留歷史決策與邊界知識、降低新人或新 agent 的接手成本。

## 怎麼理解這套系統？

整個系統分成四層：`governance → agents → skills → knowledge`。

| 層級 | 主要職責 |
|---|---|
| `governance` | 定義系統治理、分層邊界、歸屬與主 workflow 契約 |
| `agents` | 承接執行、驗證、寫回的角色，有自己的工具與上下文 |
| `skills` | 可被關鍵字或場景觸發的能力，「在某種情況下該怎麼做」 |
| `knowledge` | 沉澱長期知識與一次性記錄，作為檢索、回答與寫回的資料層 |

## knowledge 層怎麼分類？

`knowledge` 再依「時效 / 視角」分成五類：

| 目錄 | 時效 / 視角 | 主要回答 |
|---|---|---|
| `modules/` | 長期 / 靜態結構 | 模組是什麼、怎麼運作 |
| `runtime-flows/` | 長期 / 運行時 | 跨 module 的鏈路怎麼跑 |
| `bugs/` | 一次性 / 問題修復 | 問題怎麼解 |
| `decisions/` | 一次性 / 方案取捨 | 為什麼選這條 |
| `events/` | 一次性 / 處理過程 | 過程發生了什麼 |

一個好記的分辨法：

- `bugs / decisions / events` 寫「發生過什麼」。
- `modules` 寫「平常怎麼運作」（靜態結構）。
- `runtime-flows` 寫「運行時怎麼跑」（時序 / race / chain）。

其中 **Decisions 與 Events 的差別**：Decisions 記「為什麼這樣做」，把時間線拿掉通常還成立；Events 記「這件事怎麼發生」，拿掉時間順序就會不好懂。

## 關鍵字檢索是怎麼發生的？

這套做法叫 **Keyword RAG**，關鍵在「關鍵字怎麼穩定命中 knowledge」。靠三個機制：

1. **命名約定**：所有歸檔用 `YY-MM-DD-<id>-<descriptive-tail>` 加上 frontmatter keywords，slug 必須含可檢索關鍵詞。
2. **入口路由**：由 `x-project-workflow` 在任務開始時判斷屬於 bug / feat / event，決定先讀 `knowledge/` 下哪幾個子目錄。
3. **檢索動作**：agent 透過 Grep / Glob 在 `knowledge/{bugs,decisions,events,modules}/` 做匹配，命中後再讀全文。

實際樣例：

- `26-05-25-12428663-建立-main-組件新增流程文檔/`
- `26-05-29-12543604-marquee-依賴messages引用-導致跑馬動畫反復中斷/`

## 當前已落地的核心工具

`knowledge/tools/common/` 放專案共用的 Agents / Skills，統一以 `x-*` 命名：

| 名稱 | 類型 | 主要作用 |
|---|---|---|
| `x-project-workflow` | governance | 判斷任務類型、決定先讀哪些 knowledge、何時驗證與歸檔 |
| `x-record` | skill | 判斷這次內容該怎麼歸檔、屬於哪一類記錄 |
| `x-commit-recorder` | agent | 把整理好的內容真正寫入 bugs / decisions / events |
| `x-modules` | agent | 建立或補齊長期有效的模組導航知識 |
| `x-meegle` | skill | 操作專案工作項、流轉、評論與欄位更新 |
| `x-lark` | skill | 操作文件、Wiki、Drive、Sheets 等 OpenAPI 能力 |

另有治理校驗器 `knowledge-check`（`pnpm knowledge:check`）：掃 knowledge/ 校驗 frontmatter 必填、status / evidence 合法、分類與目錄一致、cross-ref 連結存在、README 索引保鮮等。**規則只寫進文件沒人強制會慢慢腐爛，寫成 check 才有牙齒。**

可以這樣理解它們的關係：`x-project-workflow` 決定先怎麼讀，`x-record` 判斷怎麼歸檔，`x-commit-recorder` 真正寫回；`x-modules` 負責長期模組導航，`x-meegle` 與 `x-lark` 把這套 workflow 往專案管理與文件生態延伸。

## Source → Runtime 同步

`knowledge/tools/{common,<username>}/{agents,skills}/` 是**真理（source）**，會同步到各 IDE agent 的 runtime 掛載位置（`.codex/`、`.claude/` 等）。

原則很簡單：**source 是真理，runtime 是 snapshot；先改 source，再同步 runtime。** 同步腳本只動自己 manifest 裡記過的檔案，所以**手放在 runtime 的檔案永遠安全**。

每位成員還有自己的 `tools/<username>/` 個人覆寫空間：實驗或私人版本放這裡，驗證穩定後再遷進 `common/`。同名能力以個人覆寫優先。

## AI 在團隊裡更適合參與哪些地方？

結合這套 workflow，可以把 AI 的參與方式分成四類：

- **討論導向與局部實作**：開發者主動提出問題，給最小必要上下文，讓 AI 提供方案、思路或局部實現。
- **整體開發**：AI 先讀專案上下文與現有程式碼，再直接做整體修正；開發者負責分步審核與驗證。
- **審核導向**：AI 以 review 方式檢查潛在風險、邏輯漏洞、邊界條件、回歸影響與測試缺口。
- **沉澱導向**：AI 不直接參與功能開發，而是補模組文件、整理知識庫、歸納規則、記錄決策與處理脈絡。

## 小結

Knowledge 系統的本質，是把「散落在聊天、commit 與個人記憶裡的背景」收斂成一個可被關鍵字穩定命中的資料層，再用一套 governance / agents / skills 把「怎麼讀、怎麼做、怎麼寫回」固化下來。對導入 AI 的團隊來說，這正是讓知識能長期累積、而不是每次重新說明的關鍵。

> 應用範圍仍要依開發團隊的現況做實際調整。
