---
public: true
layout: ../../layouts/BlogPost.astro
title: 多語系取值次序選擇 Language Source Priority Strategy
createdAt: 1772303412375
updatedAt: 1772304393701
tags:
  - Blog
  - General
heroImage: /placeholder-hero.png
slug: language-source-priority-strategy
---

# 🌍 多語系取值次序選擇

## 📌 目的

在多語系網站中，語言來源可能來自多個地方，例如：

- URL
- Cookie
- localStorage
- Browser 設定（navigator.language）
- 系統預設值

如果沒有明確的優先順序，可能會出現：

- 使用者切換語言後被覆蓋
- SSR 與 Client 語言不一致
- SEO 出問題
- Hydration mismatch

本文件定義語言來源的設計策略與建議實作方式。

---

## 🎯 建議順序

1.  URL
2.  Cookie
3.  localStorage
4.  Browser Language

---

### 🥇 1. URL（最高優先）

範例：

    /en/products
    /zh-TW/products
    ?lang=ja

#### 為什麼 URL 要放第一？

- URL 是最明確的語言來源
- 支援 SEO（搜尋引擎依據 URL 分語系）
- 可分享連結
- SSR 可以直接讀取
- 使用者切換語言通常會改 URL

👉 URL = 當前頁面的權威語言

---

### Cookie

當 URL 沒指定語言時：

- 代表使用者沒有在當前頁面強制指定語言
- 但可能之前選過語言

## 適合場景

- SSR 專案（例如 Next.js）
- 需要 server 端預先決定語言
- 跨頁保存使用者語言偏好

---

### localStorage

適合：

- SPA 專案
- 不需要 SSR
- 不重視 SEO

## 缺點

- Server 讀不到
- SEO 無幫助
- 無法跨子網域
- 可能導致 hydration mismatch

---

### navigator

在不確定使用者語言狀況下使用客戶端 navigator 獲取對方可能語言

navigator.language;

---

例如：

    en

當所有來源都不存在時使用。

---

# 🧠 語言偵測流程範例

```js
function detectLanguage() {
  const urlLang = getLangFromUrl();
  if (urlLang) return urlLang;

  const cookieLang = getCookie("lang");
  if (cookieLang) return cookieLang;

  const localLang = localStorage.getItem("lang");
  if (localLang) return localLang;

  const browserLang = navigator.language;
  if (browserLang) return mapToSupportedLang(browserLang);

  return "en";
}
```

---

# 🔄 語言切換設計原則

當使用者切換語言時：

1.  更新 URL
2.  寫入 Cookie
3.  （可選）寫入 localStorage

範例：

```js
function switchLanguage(lang) {
  updateUrl(lang);
  setCookie("lang", lang);
  localStorage.setItem("lang", lang);
}
```

---

### 🏗 不同專案架構建議

#### SPA

    URL > localStorage > Browser > Default

#### Next.js / SSR 專案（推薦）

    URL > Cookie > Default

---

# 🚨 常見錯誤設計

- localStorage 優先於 URL（會覆蓋分享連結語言）
- 同時把 Cookie 與 localStorage 當權威來源
- SSR 使用 localStorage

---

# 🏁 最佳實務總結

來源 是否權威 適用場景

---

URL ✅ 最權威 SEO / SSR
Cookie ✅ 使用者偏好 SSR
localStorage ⚠️ Client only SPA
Browser ❌ 猜測 初次訪問
Default ❌ fallback 最後手段

---

> 多語系語言優先順序應為：\
> **URL \> Cookie \> localStorage \> Browser \> Default**
