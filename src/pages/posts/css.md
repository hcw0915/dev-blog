---
public: true
layout: ../../layouts/BlogPost.astro
title: CSS 打包工具選擇指南
createdAt: 1773511519295
updatedAt: 1773512656370
tags:
  - General
  - CSS
heroImage: /placeholder-hero.png
slug: css
---

> 本文應用技術真實使用, 撰寫初版後, 轉由 AI 排版潤稿

## 核心原則

**Tailwind 永遠需要 PostCSS**，不管用什麼打包工具，差別只在誰負責觸發它。流程永遠是：

```
你的 CSS → PostCSS → @tailwindcss/postcss → 輸出最終 CSS
```

---

## 工具對照：tsup vs Vite

兩者根本目標不同，不能互相取代。

|                      | Vite                             | tsup                       |
| -------------------- | -------------------------------- | -------------------------- |
| 核心目標             | 應用程式開發（dev server + HMR） | 函式庫打包（npm 套件發布） |
| CJS + ESM 雙格式輸出 | 麻煩，需額外設定                 | 原生支援                   |
| `.d.ts` 型別定義生成 | 需額外設定                       | 內建                       |
| CSS 處理能力         | 強（內建 PostCSS / Sass）        | 弱（需額外處理）           |
| dev server           | 有                               | 無                         |
| 適合情境             | 應用程式                         | 元件庫、SDK                |

**結論**：如果你在發布 npm 套件、需要多個 entry、`dts`、雙格式輸出，用 tsup。如果你在做應用程式，用 Vite。不是 Vite 比較好，而是用途不同。

---

## 各種情境下 CSS 的處理方式

### Tailwind CSS

| 情境     | Vite                               | tsup                          |
| -------- | ---------------------------------- | ----------------------------- |
| 應用程式 | 全自動（`postcss.config.js` 搞定） | 需獨立腳本（`build-css.mjs`） |
| 元件庫   | CSS import 進 entry + postcss      | 加 CSS entry 或獨立腳本       |
| SDK      | 不建議打入 CSS                     | 不建議打入 CSS                |

tsup 打包應用程式時，因為所有 entry 都是 `.ts` 檔，沒有地方觸發 PostCSS，所以需要獨立腳本在 `onSuccess` 裡執行：

```ts
async onSuccess() {
  await execAsync("node scripts/build-css.mjs");
}
```

### Sass / SCSS

| 情境     | Vite                           | tsup                       |
| -------- | ------------------------------ | -------------------------- |
| 應用程式 | 全自動（安裝 `sass` 套件即可） | 需裝 `esbuild-sass-plugin` |
| 元件庫   | CSS import 進 JS，Vite 編譯    | 同應用程式                 |
| SDK      | sass CLI 獨立編譯後發布        | sass CLI 獨立編譯後發布    |

### Pure CSS

| 情境     | Vite              | tsup              |
| -------- | ----------------- | ----------------- |
| 應用程式 | 全自動            | 加 CSS entry 即可 |
| 元件庫   | 全自動            | 加 CSS entry 即可 |
| SDK      | 直接 copy 進 dist | 直接 copy 進 dist |

---

## Next.js + Turbopack 的影響

- Next.js v15 開始，**dev mode 預設使用 Turbopack**
- **Production build 仍然是 webpack**（Turbopack production 支援尚未完整）
- Turbopack 有自己的 CSS pipeline，**不完整支援 `postcss.config.js`**，與 `@tailwindcss/postcss` 可能行為不一致

### 對使用 tsup 打包的專案影響

如果你用 tsup 打包、CSS 用獨立腳本處理，產物是靜態的 `dist/styles.css`。Next.js 直接 import 這個 CSS 檔，**完全繞過 Turbopack 的 CSS pipeline**，不受影響。

受影響的只有**直接在 Next.js 專案裡寫 Tailwind** 的部分（非打包產物）。

---

## SDK 的 Bundle 工具選擇

SDK 分兩種情境：

### 情境一：給開發者用的 SDK（提供 API / 元件）

不建議打入 CSS，讓使用者自己的專案處理樣式。只需：

- 輸出 `cjs` + `esm` + `dts`
- 文件說明需要哪些 Tailwind class
- 工具選 tsup

### 情境二：直接掛載到頁面的 SDK（如 `mountBonusCenter`、`mountInvite`）

這類 SDK 是**端對端產物**，需要自帶樣式。有兩種策略：

**策略一：自包含 bundle（推薦）**

```
SDK → iife/umd JS + 獨立 CSS 檔案
```

使用方：

```html
<script src="sdk.js"></script>
<link rel="stylesheet" href="sdk.css" />
```

重點設定（`tailwind.config.js`）：

```js
module.exports = {
  prefix: "sdk-", // 避免 class 名稱與宿主頁面衝突
  corePlugins: {
    preflight: false, // 避免全域 CSS reset 污染宿主頁面
  },
};
```

tsup 設定加入 `iife` 格式輸出，CSS 獨立腳本處理。

**策略二：Shadow DOM 隔離（高隔離需求）(實際執行內容)**

CSS 注入 shadow root，與宿主頁面完全隔離。實作複雜度高，適合對樣式污染容忍度極低的場景。

---

## 快速決策流程

```
你要做什麼？
├── 應用程式 → Vite（CSS 全自動）
├── npm 套件 / 元件庫 → tsup
│   ├── 有 CSS → 加 CSS entry 或獨立腳本
│   └── 沒有 CSS → 純 tsup 即可
└── 掛載型 SDK → tsup + iife 格式 + 獨立 CSS 腳本
    └── 記得設定 Tailwind prefix + 關閉 preflight
```
