# Dev-Blog 全面改版設計（Dark Bento + SEO 修正）

日期：2026-06-12
狀態：待使用者核准

## 背景與目標

現況問題（已於線上版與程式碼確認）：

1. `astro.config.mjs` 的 `site` 仍是模板作者的 `https://uses.craftz.dog/`，導致 sitemap 與 canonical 全部指向錯誤網域，搜尋引擎無法正確索引。
2. `SITE_DESCRIPTION` 為 "Powered by Inkdrop"，`HOMEPAGE_URL` 指向 inkdrop.app（模板殘留）。
3. 已安裝 `@astrojs/rss` 但沒有 RSS endpoint。
4. 首頁只有 emoji + "HELLO"，看不出網站定位；53 篇文章被藏在第二層。
5. 文章列表只有標題＋日期，無摘要、無搜尋。
6. 53 篇文章中 52 篇封面圖是 `placeholder-hero.png`，OG 分享圖退回標籤漸層。
7. 文章頁缺 `og:type=article`、`article:published_time`、canonical、JSON-LD；長文無目錄、無上下篇導航。
8. 履歷檔名 `Antonio_Hou_260228 .pdf` 含空格。

目標：修正以上全部問題，並以「**暗色優先 Dark Bento**」風格重新設計每一頁。

## 已定案的方向（與使用者確認過）

- **風格**：Dark Bento——深色為預設主題、Bento 卡片結構、編輯級閱讀排版、cyan→violet 漸層做重點點綴。保留完整亮／暗雙主題切換。
- **定位**：個人品牌與技術筆記**並重**；首頁上半介紹人、下半接文章流。
- **Hero 文案**：「前端工程筆記」（簡潔版，不加副標語）。
- **首頁不做分類入口卡**（使用者明確要求拿掉）。
- **網域**：暫用 `https://antonio-blog-one.vercel.app`，設定集中一處方便日後更換。
- **封面圖策略**：build 時自動生成＋`public/hero/<slug>.png` 手動覆蓋優先（現有 fallback 機制保留並升級）。
- **進行方式**：原地改版。SEO 修正為第一個獨立 commit；設計改版按頁面分批 commit。
- **硬性約束**：所有現有功能原封保留——標籤篩選、i18n 路由與 redirect、Playground（vanilla + React）、主題切換、View Transitions、Inkdrop `live-import` 流程。只動樣式層，不動功能邏輯。

## 設計細節

### 1. 設計系統

- 色彩 token 進 `tailwind.config.cjs`：
  - 深色主場：`zinc-950` 系底色；卡片 `rgba(255,255,255,.04)` 底＋ `rgba(255,255,255,.09)` 邊框（玻璃感）。
  - 亮色模式：暖白底（`#fafaf8` 系）＋白卡片＋細邊框，同一套 token 的對應值，非事後補丁。
  - 主漸層 `cyan-400 → violet-400`：僅用於 logo、Playground 入口卡、連結 hover。
  - 既有 13 個標籤色（`COLOR_MAP`）保留為分類識別色。
- 字體：標題 serif（含中文明體 fallback 字串），內文無襯線；程式碼維持 Shiki `aurora-x`。
- 重複樣式（卡片、標籤膠囊、區塊標題）抽成 Astro 元件，不在頁面間複製 class 字串。

### 2. 首頁

由上而下：

1. **Hero Bento**：左大卡——「前端工程筆記」＋一行個人介紹（Antonio H.・前端工程師）；右卡——Playground 入口（漸層卡）；下排三張最新文章卡（標籤色＋標題＋日期）。
2. **最新文章流**：再列 5–8 篇，底部「全部文章 →」連結。
3. 移除現有 emoji 圖與 "HELLO" 字樣。

### 3. 文章列表頁 `/posts`

- 標籤篩選功能保留，樣式翻新為膠囊型（選中時填入該標籤色）。
- 每篇顯示：標題＋一行摘要＋日期＋標籤色點。摘要取 frontmatter `description`，無則 build 時取內文第一段純文字。
- 新增 client-side 標題即時搜尋（不引入新依賴）。
- 不分頁；以年份分隔線輔助瀏覽。

### 4. 文章內頁

- 單欄，行寬上限約 `68ch`，行高放寬（中文長文可讀性優先）。
- 桌面：右側浮動 TOC（由 headings 自動生成、捲動高亮目前章節）；行動：收合於文頂。
- 文頂：標題＋日期＋標籤＋預估閱讀時間。文末:上一篇／下一篇導航。
- 封面圖依第 9 節機制。

### 5. About 頁

內容不變（工作經歷、學歷、技能、履歷下載），版面改為與首頁一致的 Bento 卡片。履歷 PDF 改名移除空格（同步更新引用處）。

### 6. Playground

列表卡片套新設計語言；CodePlayground 本體（Monaco、分割面板、vanilla/React 雙模式）功能不動，僅外框配色融入深色主題。

### 7. 404 頁

套新風格，提供「回首頁」「看文章」兩個出口。

### 8. SEO／基礎建設（第一個 commit）

- `astro.config.mjs`：`site` 改為 `https://antonio-blog-one.vercel.app`（與 `src/config.ts` 共用單一常數來源）。
- `src/config.ts`：`SITE_DESCRIPTION` 改為實際網站介紹；移除 `HOMEPAGE_URL` 殘留引用。
- 新增 `src/pages/rss.xml.ts`（@astrojs/rss）。
- `BaseHead.astro` 強化：文章頁 `og:type=article` ＋ `article:published_time`；全站 canonical link；JSON-LD（文章頁 Article、About 頁 Person）。
- `public/robots.txt` 指向正確 sitemap。

### 9. OG／封面圖自動生成

- Build 時以 satori + resvg（或等效）為每篇文章生成 1200×630 OG 圖：深色底＋標題＋標籤色點綴＋署名。
- 優先序：`public/hero/<slug>.png`（手動）→ 自動生成圖 → 標籤漸層（最後保險）。
- frontmatter 中的 `/placeholder-hero.png` 引用由此機制接管，無需逐篇修改。
- 此為本次唯一新增的依賴。

### 10. 不變更項目

i18n 路由與英文 redirect、Inkdrop 匯入工具（`tools/import.mjs`）、主題切換腳本、View Transitions 進度條。

## 驗收標準

- 每階段 `pnpm build` 通過；本機 preview 截圖供使用者確認。
- SEO commit 部署後：線上 sitemap URL 為 vercel.app 網域、`/rss.xml` 可訂閱、文章頁 meta 含 article 標記與 canonical。
- 所有既有路由（含 `/en/*` redirect、playground 動態路由）行為不變。
- 標籤篩選、主題切換、Monaco playground 在改版後實測可用。

## 實作順序

1. SEO／基礎建設（獨立 commit，可立即部署）
2. 設計系統 token ＋共用元件
3. 首頁
4. 文章內頁（含 TOC、上下篇、OG 圖生成）
5. 文章列表頁（摘要＋搜尋＋年份分隔）
6. About ＋履歷檔名修正
7. Playground ＋ 404
