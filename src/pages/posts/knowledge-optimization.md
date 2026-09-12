---
public: true
slug: knowledge-optimization
layout: ../../layouts/BlogPost.astro
title: Knowledge 優化：從關鍵字搜尋到結構化檢索
createdAt: 1789216382981
updatedAt: 1789216382981
tags:
  - AI
heroImage: /placeholder-hero.png
---

> 三個月前我寫過[這套 Knowledge 系統的總覽](/posts/knowledge-keyword-rag)：四層架構、五類知識、靠命名約定與 Grep 做 Keyword RAG。那篇仍然成立，但這三個月實際用下來，有幾個地方被改掉了 —— 一個類別被取消、檢索從掃全文換成查索引、多了一層落盤模板和一份硬約束。這篇只寫「變了什麼、為什麼變」。

## 先說結論：四件事被改了

| 項目 | 原版 | 現在 |
|---|---|---|
| 知識類別 | 五類（含 `runtime-flows/`） | 四類，跨 module 鏈路折進 owner module |
| 檢索方式 | Grep / Glob 掃 prose | `manifest.json` 索引 + 按欄位權重打分 |
| 落盤 | 命名約定 + frontmatter keywords | 多一層 `templates/`：模板骨架、schema、folder pattern |
| 約束 | 寫在各文件裡 | 獨立 `constraint.md`，每條 back-link 回出處 |

## 取消 runtime-flows：一條鏈路不該有兩個家

原版把「跨 module 的運行時鏈路」單獨列一類。實際跑下來的問題是：**一條鏈路永遠會牽涉到兩個以上的 module，寫在哪裡都不對**。寫在 `runtime-flows/`，讀 module 文件的人看不到；寫在 module 裡，又跟另一個 module 重複。結果是同一條鏈路被寫兩次，然後其中一份先過期。

現在的規則是：

- 跨 module 的鏈路**折進 owner module 的主檔**，由它寫自己的對外接縫，再連到協作 module。
- race / timing 類的 bug 進 `bugs/`，並**回寫 owner module 的「已知陷阱」段**。

換句話說，「誰負責這條鏈路」這個問題必須先有答案，文件才有地方放。`runtime-flows/` 現在是空目錄，四類變成 `modules / bugs / decisions / events`。

順帶一提，`decisions` 與 `events` 的分界比原版更明確了一個口訣：**選型取捨寫 decisions，排查與遷移的流水帳寫 events**。

## 檢索：從掃全文變成查索引

原版的檢索動作是「agent 用 Grep / Glob 在 `knowledge/` 下匹配關鍵字，命中後讀全文」。文件到幾十份時這樣夠用，到 483 份就不行了 —— 中文 prose 的關鍵字命中率不穩，而且命中之後要讀整份才知道有沒有用。

現在多了兩個東西：

**1. `manifest.json`：給機器看的總目錄**

由 `build-manifest.mjs` 從每份文件的 frontmatter 自動生成。目前 483 筆，每筆 12 個欄位：

```
id, type, has_sub_areas, path, title, feature_area,
files, tags, last_updated, last_verified, status, one_line
```

重點是 `one_line`（這份文件講什麼）和 `files`（它涵蓋哪些程式碼路徑）。有了這兩欄，agent 在讀全文之前就能判斷「這份要不要信、值不值得展開」。

**2. `recall.mjs`：按欄位權重打分**

檢索的對象從 raw prose 換成結構化欄位，權重是：

```
feature_area 5 · tags 4 · module 4 · title 3 · one_line 2 · files 2 · path 1
```

再加上「命中幾個查詢詞 × 3」，排序時**先比命中詞數、再比分數** —— 命中兩個詞的結果永遠排在只命中一個詞前面，哪怕後者單詞分數更高。這比單純累加分數更符合直覺：查「首屏 hydration ssr」時，同時提到三個詞的文件才是你要的。

為什麼欄位比全文好：`feature_area` 是人工標的、乾淨；`tags` 雙語都收，中英文查詢都能命中。附帶一個實測發現：`tags` 裡有約 45 對只差大小寫或分隔符的同義變體在稀釋命中率，而 `feature_area` 沒有這個問題 —— 所以權重才給它最高。

## 新增 templates/：讓落盤有統一骨架

原版只有命名約定。問題是「怎麼命名」跟「內容該長什麼樣」是兩件事，後者沒規定，每份文件的結構就各憑本事，檢索欄位也就填得參差不齊。

現在 `templates/` 放四類記錄的模板，外加 frontmatter schema 與 folder pattern。分工是：

- `skill` 定義「這項能力是什麼」
- `agent` 決定「這個任務怎麼跑」
- `templates` 決定「跑完之後怎麼落盤」

不管入口是 `x-project-workflow`、`x-seo` 還是 `x-record`，只要要寫回 `knowledge/`，都走同一套骨架。索引品質是被模板撐起來的 —— 這是因果關係，不是巧合。

順帶調整的是歸檔路徑：從原版平鋪的 `YY-MM-DD-<id>-<tail>/` 改成 `<YY-MM>/<YY-MM-DD-slug>/` 兩層。單純是因為一年下來平鋪會有上百個資料夾，`ls` 一次看不完。

## 新增 constraint.md：硬約束單獨拉出來

這是原版完全沒有的一層。它是一份「任何修正都必須符合」的清單，格式固定：

```
- NEVER/MUST <規則> — <原因>（→ 出處記錄）
```

兩個設計重點：

**每條都要 back-link 回它的出處 bug 或 decision。** 規則沒有出處就會變成教條，下一個人只能猜「為什麼不能這樣寫」，然後在某個看似合理的場合破例。有出處就能自己判斷這條規則適用到哪。

**只作用於新增與修正的內容，不回頭改既有程式碼。** 這條界線很重要 —— 否則每次套用約束都會變成大規模重排，跟「改動只動該動的範圍」互相矛盾。

舉一個實際的例子，這條是從一個真實 bug 長出來的：

```
NEVER 用 ?? 串 boolean 當 fallback 鏈
```

`a ?? b` 只在 `a` 是 `null` / `undefined` 時才落到 `b`，`a` 是 `false` 時不會。所以 `isMobileGlobal ?? isMobile ?? false` 這種寫法，當 `isMobileGlobal` 是 store 預設的 `false` 時，後面兩段全是死碼 —— 但它看起來像有效邏輯，review 時沒人會多看一眼。那次的後果是預覽把手機版渲染成 PC 版面。

規則裡機械可查的那幾條，由 `check-constraints.mjs` 掃。預設只看**本次改動的檔案**（working tree + staged vs HEAD），不是全專案 —— 全掃會翻出一堆既有程式碼，然後沒人想看。

## 保鮮：候選清單，不是判決

文件會過期，這是知識庫的根本問題。現在有三個機制，但它們的定位被刻意寫清楚了：**候選清單，需人工核實，不是判決、也不是 CI gate**。

| 腳本 | 看什麼 |
|---|---|
| `stale-modules.mjs` | module 文件的 `files` 裡有程式碼在文件更新後又被改過 |
| `stale-symbols.mjs` | 文件正文提到的符號名稱，在現在的程式碼裡已經不存在 |
| `build-manifest.mjs` | 生成索引時順便做漂移 lint |

為什麼不當 gate：「src 有比 doc 新的提交」不等於「doc 一定過時」—— 改個 CSS 不會讓模組導航失效。做成 gate 只會逼人為了過關而亂改日期，那比沒有機制更糟。所以它只產出 watch-list，由人決定要不要更新。

`stale-symbols` 還多一個判定：用三個月前作為歷史對照點，確認「這個名字曾經存在過」，避免把筆誤也報成失效引用。

另外 `wiki-mirrors.json` 處理對外發布的那一側：登記哪些 Lark wiki 文件是本地 module 的發布快照、上次同步到哪個日期。它明確標成 **best-effort、非實時**，只在本地文件比快照新且超過 14 天容忍值時才報漂移。

## 風險地圖：哪些檔案反覆出事

`manifest.json` 裡有一份 `risk_map`，反向索引「程式碼檔案 → 涵蓋它的 bug 文件」。目前 38 個檔案上榜，最高的是註冊流程的 `useRegister.ts`，累積 7 筆。

這份地圖的用處很直接：要動某個檔案之前，先看它有沒有前科。有的話，那幾筆 bug 就是必讀 —— 反覆出事的檔案通常有結構性原因，而不是每次都是新問題。這是原版完全沒有的視角：原版的檢索是「從問題找文件」，risk_map 是「從檔案找問題」。

## 工具長出來的樣子

原版列了 6 個 `x-*` 工具。現在的實際清單是 agents 8 支、skills 16 個，外加個人區：

- **agents**：`x-project-workflow`、`x-commit-recorder`、`x-modules`、`x-recall`、`x-retro`、`x-seo-workflow`、`x-seo-live-check`、`x-wiki-mirror-sync`
- **skills**：`x-record`、`x-recall` 之外，多了 `x-seo`、`x-e2e` 系列、`x-ui-check`、`x-figma-prototype`、`x-story-run`、`x-top` / `x-boss` 系列、`x-main-component`、`x-retro`，以及原本就有的 `x-meegle`、`x-lark`
- **個人區** `tools/antonio/`：`dx-record`、`ctx7`、`workers-best-practices`

新增的 `x-recall` 就是前面那套索引檢索的執行者；`x-retro` 做回顧；`x-wiki-mirror-sync` 管對外快照。

source → runtime 的同步規則也更明確了：`common/` 永遠是 base layer，其他使用者目錄**按字母序覆蓋**，同名時後者贏並印出警告。原則沒變 —— source 是真理，runtime 是 snapshot，先改 source 再同步。

## 一個要誠實說明的定位變化

原版把這套東西講成「團隊 AI 知識庫」。現在 `knowledge/` 在這個 repo 裡是**被 `.gitignore` 忽略的**，所以更準確的描述是「跟著專案走的本地長期記憶與 AI 工作區」，不是團隊主倉庫裡的正式文件區。`constraint.md` 開頭也明寫了「個人，不提交」。

這不是退步，而是把實情寫清楚：它同時服務兩個對象 —— 給開發者當專案記憶與導航入口，給 AI 代理當跨 session 的檢索上下文。要進團隊共享，該走的是 Lark wiki 那條發布快照的路，而不是把本地工作區直接當成團隊文件。

## 小結

這三個月的改動可以收斂成一句話：**原版解決了「知識要放哪」，這一版解決的是「483 份文件之後怎麼找得到、怎麼不腐爛」。**

三個具體的槓桿點：

1. 一條知識只能有一個家 —— 所以取消 `runtime-flows/`。
2. 檢索要查結構化欄位，不要掃全文 —— 所以有 `manifest.json` 和權重打分；而欄位品質靠 `templates/` 撐著。
3. 保鮮機制只給候選清單，判斷權留給人 —— 做成 gate 的那一刻，人就會開始騙過它。

> 完整的分層、分類與 Keyword RAG 基礎設計，見[前一篇總覽](/posts/knowledge-keyword-rag)。這篇只記錄差異，兩篇一起看才完整。
