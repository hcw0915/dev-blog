---
public: true
layout: ../../layouts/BlogPost.astro
title: Shadow-dom / WebComponent
createdAt: 1741576021264
updatedAt: 1742357540883
tags:
  - React
  - Micro-Frontend
  - Blog
heroImage: /placeholder-hero.png
slug: shadow-dom-web-component
---


[前置知识-webComponents_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1tg4y1x75Q?spm_id_from=333.788.videopod.episodes&vd_source=1f341f0ab335f404bf6079fee5d5b907&p=2)

實現類似 Wujie 的 shadow dom

## Web Component vs Shadow DOM

Web Component 和 Shadow DOM 是相關但不同的技術，它們的關係可以這樣理解：

### Web Component

Web Component 是一個標準規範，用來定義可重用的 HTML 元件，主要由四個技術組成：

- **Custom Elements（自訂元素）**：用 `customElements.define()` 註冊自訂標籤，如 `<my-button>`。
- **Shadow DOM（影子 DOM）**：用來封裝樣式和結構，避免與外部 CSS 或 JS 互相影響。
- **HTML Templates（模板）**：透過 `<template>` 和 `<slot>` 定義可重複使用的 HTML 結構。
- **ES Modules**：用來組織和載入 Web Component 相關的 JavaScript 代碼。

### Shadow DOM

Shadow DOM 是 Web Component 的其中一部分，專門用來提供 DOM 和 CSS 的封裝性：

- 透過 `element.attachShadow({ mode: 'open' | 'closed' })` 建立影子 DOM。
- 限制外部 CSS 影響影子 DOM 內部的樣式，也防止內部樣式影響外部頁面。

### 差異比較

| **比較項目** | **Web Component** | **Shadow DOM** |
|-------------|-----------------|--------------|
| **概念** | 一整套標準來建立可重用的 UI 元件 | 其中一種技術，用於封裝 DOM 和 CSS |
| **功能** | 定義、註冊、使用自訂 HTML 元素 | 提供 DOM 和樣式的封裝，避免外部影響 |
| **是否必要** | 可以不使用 Shadow DOM，但就少了封裝性 | 主要用於封裝 Web Component，但也可獨立使用 |
| **API 例子** | `customElements.define('my-element', MyElementClass)` | `this.attachShadow({ mode: 'open' })` |

### 簡單來說

- **Web Component 是一個整體概念，包含了 Shadow DOM，但不一定要使用它。**
- **Shadow DOM 是 Web Component 的封裝機制，用來確保樣式與 DOM 的隔離。**

你可以只使用 Custom Elements 來建立 Web Component，而不使用 Shadow DOM（這樣 CSS 仍然會受到外部影響）。但如果你希望真正封裝元件內部結構，就需要用 Shadow DOM。

如果你的 Web Component 需要提供主題自訂（讓外部 CSS 影響內部樣式），那麼就要避免使用 Shadow DOM，或者提供 `CSS Variables` 給外部控制。


```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script>
      window.onload = () => {
        class Wujie extends HTMLElement {
          constructor() {
            super();

            // 创建一个 shadow DOM
            const shadow = this.attachShadow({ mode: "open" });

            // 获取 template 元素
            const template = document.getElementById("wujie");

            // 克隆 template 元素
            const clone = document.importNode(template.content, true);

            // 将克隆的 template 元素添加到 shadow DOM 中
            shadow.appendChild(clone);
            console.log(this.getAttri("url"));
          }

          getAttri(arg) {
            return this.getAttribute(arg);
          }

          connectedCallback() {
            console.log("Custom element added to page.");
          }

          disconnectedCallback() {
            console.log("Custom element removed from page.");
          }

          adoptedCallback() {
            console.log("Custom element moved to new page.");
          }

          attributeChangedCallback(name, oldValue, newValue) {
            console.log(`Attribute ${name} has changed.`);
          }
        }

        // 注册自定义元素 => 原生 js 寫的組件
        window.customElements.define("wu-jie", Wujie); // wu-jie 是自定义元素的名称
      };
    </script>
  </head>
  <body>
    <wu-jie url="網站"></wu-jie>
    <div>我是外層的 div</div>

    <template id="wujie">
      <style>
        div {
          background: red;
        }
      </style>
      <div>我是 template 裡面的 div</div>
    </template>
  </body>
</html>

```