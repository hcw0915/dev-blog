---
public: true
layout: ../../layouts/BlogPost.astro
title: Refactor Steps
createdAt: 1742274558342
updatedAt: 1742275023187
tags:
  - React
  - Blog
  - General
heroImage: /placeholder-hero.png
slug: refactor-steps
---
# [心得] 專案重構基礎流程

公司主產品專案, 因應不同客戶需求不同入口以及重定向的 API, 過去是針對客戶做個別立案處理
但現在會需要將其中兩項專案做整併. 整併前已預期會遇到幾個問題, 好在的是 兩個預計合併專案 都是以 `vite`, `React 18` 以上為基礎架構, 因此省了不少時間去做基礎建設, 另外 專案 A 的使用是一般客戶的官網點擊進入, 專案 B 則是必須透過 URL 打入對應 token, queryString 相關參數做驗證與導向, 所以後續兩項專案決定合併也是因為彼此依賴性低, 但主目的卻是同一個.

---

### 🌋 可預期整合項目

- CSS 工具衝突 (`pure css`, `sass module`)
- 環境整合
- 共用 `constants`, `utils`, `libs`, `hooks`, `assets` ...
- 基礎建設整合 `vite`, `vite-plugins`, `eslint`, `prettier` ...
- 語系 `i18n` 整合 `react-intl` `react-i18next`
- 同系列功能 但不同套件的必要性
- `errorCode message integration`

---

### 🌋 Phase 1 - 整理現有 code

在第一階段的整理, 專案 A 整合進 專案 B, 則首先對特有 `page`, `components`, `containers`, `services(api)` 等等基本與其他專案無關的地方做隔離建資料夾

只有公用的地方才不需要 e.g. `constants`, `utils`, `hooks` 等等, 這類本來就是被設計出來做複用.

---

### 🌋 Phase 2 - 搬 code (A 到 B) - 優先確保內容正常運作

先保有最原始結構, 優先確保畫面功能正常 e.g. `carousel` `navbar` `aside` 等等.

這個時候會需要安裝 A 的各種 `dependencies`, 就給他裝好裝滿.

如果專案過大 則建議可以以 page, feature 為單位去做漸進轉移.

---

### 🌋 Phase 3 - 確認需要整理的內容

這部分可大可小, 要看專案內容實際功能這部分不外乎就是常用套件整合, 散落或是具同性質的整合, 以及上述可預期整合項目的內容

例如：

```javascript
export queryString = new URLSearchParams(window.location.search)
```

```javascript
export const ENV = import.meta.env.VITE_ENV;
```

---

### 🌋 Phase 4 - 重構

這部分基本上就沒什麼好說的, 依照原有 React 專案分類方式處理即可.

但是有一點很重要, 在不能改 A 壞 B 的情況下, 要怎麼不過度共用 或是過度保留原專案的 舊 code, 甚至在搬運過程中 專案 B 的內容是否有受到影響 都會是需要去做處理與測試的, 在這兩項專案情況下，針對語系問題寫測試的話, 會大大減少後續測試時間.

語系問題

- 使用者瀏覽器設定語系 e.g. `navigator.language`
- 使用者 queryString 打的語系參數 e.g.`lang=cn` `language=zh`
- 使用者 語系不在專案設定範圍內的預設語系 e.g.`en`