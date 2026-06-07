---
public: true
layout: ../../layouts/BlogPost.astro
title: '[心得]  Tailwind 在 Embedded UI 中的 CSS 覆蓋問題與解法'
createdAt: 1773425633944
updatedAt: 1773512807165
tags:
  - General
  - CSS
heroImage: /placeholder-hero.png
slug: tailwind-embedded-ui-css
---

> 本文初稿內容真實發生, 撰寫初版後, 轉由 AI 排版潤稿

## 背景

因為主站需要引用 **IIFE bundle 的組件**，主要原因是 `iframe` 的
scrollbar 以及 `viewport` 大小在不同環境下較難控制，因此部分頁面會使用
**embedded 方式嵌入**。

整體架構有一個核心原則：

> 所有 `Dialog / Toast / Tips / Message` 等 UI
> 訊息，都必須回歸主站統一處理。

因此設計了一個 **Bridge 機制**，讓 embedded 組件將事件 `emit`
到主站，由主站負責實際顯示 UI。

由於同時需要支援 `iframe` 與 `embedded` 兩種模式，所以 Bridge 也包含了
`postMessage` 的通信方式。

簡化範例如下：

```ts
export function emitToHost(event: string, payload?: any) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "bridge-event", event, payload }, "*");
  } else {
    window.dispatchEvent(
      new CustomEvent("bridge-event", {
        detail: { event, payload },
      })
    );
  }
}
```

組件內部只需要：

```ts
emitToHost("open-dialog", {
  title: "Example",
  content: "Hello",
});
```

主站則統一監聽並處理 UI。

---

## CSS 隔離策略

在 CSS 隔離方面：

- `iframe`：天然隔離，基本沒有問題
- `embedded`：透過 **Shadow DOM** 來做樣式隔離

```ts
const host = document.getElementById("embedded-root");

const shadowRoot = host.attachShadow({
  mode: "open",
});

const container = document.createElement("div");
shadowRoot.appendChild(container);
```

這樣 embedded UI 的 CSS 就不會污染主站。

---

## 遇到的問題

最近遇到一個特殊情境：

> 組件內需要 **調用主站的 Dialog**，但同時要使用 **embedded 的 CSS
> 樣式**。

因此在開啟 Dialog 時，會 **動態插入 CSS**：

```ts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "/embedded.css";

document.head.appendChild(link);
```

然而這裡出現了一個 Tailwind 的問題。

---

## Tailwind 編譯導致的樣式缺失

主站 Header 有這樣的 class：

```tsx
<div className="size-[32px] md:size-[40px]">...</div>
```

在打開 Dialog 時，Header 會出現 **尺寸跳動**。

排查過程：

- 斷點一致
- CSS 變數沒有衝突
- 最後定位到 **Tailwind 編譯結果**

原因是：

> Embedded bundle 中 **沒有使用 `md:size-[40px]`**

Tailwind 在 build 時會 **tree-shake 未使用的 class**，因此 embedded 的
CSS 裡沒有這個 rule。

當 Dialog CSS 被插入時，就覆蓋了主站原本的 Tailwind CSS。

---

## 一個理論可行但不合理的解法

可以透過 **顯式寫出 class**，讓 Tailwind 編譯進去：

```tsx
export const App = () => {
  const text = "md:size-[40px]"
  return (...)
}
```

這樣 Tailwind 就會生成對應 CSS。

但這其實是一個 **不可接受的方案**：

- 只是為了 Tailwind 掃描
- 汙染組件程式碼
- 無法保證未來主站 class 不變
- 也可能會有其他主站

因此很快就放棄這個做法。

---

## 最後考慮的幾種方案

### 方案一：Tailwind 加前綴

透過 `postcss` 或 `tailwind.config`，為 embedded CSS 增加 prefix。

```js
module.exports = {
  prefix: "act-",
};
```

原本：

    md:size-[40px]

變成：

    act-md:size-[40px]

優點：

- 與主站 CSS 完全隔離

缺點：

- 所有 class 都需要調整
- 斷點語法也會變得比較奇怪

---

### 方案二：Dialog 再包一層 Shadow DOM

將 Dialog 也放入 Shadow DOM 中，再做一次 CSS 隔離：

```ts
const dialogHost = document.createElement("div");

const shadow = dialogHost.attachShadow({
  mode: "open",
});

shadow.appendChild(dialogElement);
```

優點：

- CSS 完全隔離

缺點：

- Dialog 結構變複雜
- 與主站 UI 系統整合成本高

---

### 方案三：調整 CSS 插入順序

將 embedded CSS 插入到 **主站 `<head>` 的最前面**：

```ts
const head = document.head;

head.insertBefore(link, head.firstChild);
```

這樣：

    embedded css
    ↓
    host css

主站 CSS 就能覆蓋 embedded CSS。

優點：

- 不需要改 Tailwind
- 不需要調整 class
- 不需要 Shadow DOM

缺點：

- embedded CSS **不能依賴斷點覆蓋主站**

---

## 最終選擇

由於目前開發的頁面 **並沒有依賴 Tailwind 斷點來做
layout**，因此最終選擇了 **方案三：調整 CSS 插入順序**。

這樣可以在 **不改動主站、不改動 Tailwind、不增加架構複雜度**
的前提下解決問題。

---

## 小結

這個問題本質上是：

> **Tailwind 的 tree-shaking + 多份 CSS runtime 注入**

在 **micro frontend / embedded / iframe** 架構下，這類問題其實很常見。

常見解法通常是：

1.  CSS prefix
2.  Shadow DOM
3.  CSS 注入順序控制

不同專案會有不同的最佳解，但核心原則都是：

> 讓 CSS 的作用域與優先順序保持可預測。
