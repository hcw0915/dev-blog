---
public: true
slug: sticky-wrapper-same-height
layout: ../../layouts/BlogPost.astro
title: position sticky 失效：外層包裝與元素等高，就沒有空間可以吸附
createdAt: 1792992155355
updatedAt: 1793002404374
tags:
  - CSS
heroImage: /placeholder-hero.png
---

> 一個設定成吸頂的導覽列，在正式頁面上正常吸附，放進後台的預覽頁就跟著捲走。元素本身的 CSS 完全沒變，差別是預覽頁替每個區塊多包了一層 `<div>`，而這層 div 跟導覽列一樣高。

## 現象

- 正式頁面：導覽列捲到頂端後停在 header 下方，正常
- 後台預覽頁：同樣的設定、同樣的元件，導覽列跟著內容一起捲走

導覽列本身寫的是：

```html
<nav class="sticky top-[44px] z-40" data-sticky="true">...</nav>
```

## 原因：sticky 只能在父層的範圍裡吸附

`position: sticky` 不是相對於整個視窗，而是**在它的包含區塊（通常就是父層）範圍內**吸附。父層捲出畫面時，sticky 元素也會被一起帶走。

預覽頁為了「點選區塊時捲動定位」和「選取外框」，在每個區塊外面包了一層：

```html
<div id="block-123">          <!-- 高度 = 導覽列高度 -->
  <nav class="sticky ...">...</nav>
</div>
```

這層 div 的高度就是導覽列的高度。父層跟自己一樣高，代表沒有任何可以「滑動」的空間：父層往上捲多少，導覽列就得跟著走多少。sticky 規則有生效，只是吸附的範圍是零。

正式頁面沒有這層包裝，導覽列的父層是整個頁面容器，所以吸得住。

## 修法：讓包裝層自己吸頂

不改導覽列，而是讓「裡面有吸頂元素」的包裝層自己變成 sticky。用 `:has()` 就不用在包裝層上另外傳參數：

```css
.block-wrapper:has([data-sticky="true"]) {
  position: sticky;
  top: 44px;
  z-index: 40;
}
```

用 Tailwind 寫是 `has-[[data-sticky=true]]:sticky` 這組 class。這樣包裝層的父層就是整個預覽頁容器，有足夠的空間吸附。

## 第二個坑：子元素的負 margin

第一版改完，導覽列吸住了，但停在 36px，蓋住 header 底部 8px。

原因是導覽列在吸頂狀態下，手機版會帶一個 `margin-top: -8px`，用來抵掉上方區塊的間距。原本 sticky 的是導覽列自己，負 margin 已經算在它的位置裡。現在 sticky 的是包裝層，包裝層停在 44px，導覽列又被自己的負 margin 往上拉了 8px。

這裡有個前提：包裝層的父層是 flex 容器。如果是一般的 block 排版，子元素的負 margin 會穿出包裝層、跟包裝層的 margin 合併，整個包裝層一起往上移，sticky 再把它推回 44px，反而看不出問題。

修法是讓包裝層的 `top` 補回這段間距：

```css
.block-wrapper:has([data-sticky="true"]) {
  top: calc(44px + var(--space-md)); /* 補回子元素的負 margin */
}
```

這種補償很容易被下一個人當成多餘的東西刪掉，所以要在程式碼裡寫註解說明它在抵什麼。

## 自己捲捲看

[Playground：Sticky Inside a Same-Height Wrapper](/playground/vanilla/sticky-wrapper) 把同一個導覽列放進三種結構，三欄同步捲動。虛線框是包裝層，導覽列上的數字是它離捲動容器頂端多少 px：

- A 直接放在捲動容器裡，停在 44px
- B 包一層等高的 div，被捲出畫面
- C 包裝層用 `:has()` 自己吸頂，停在 36px，蓋住 header 8px；勾選「top 補回負 margin」後回到 44px

## 判斷原則

- `position: sticky` 失效時，先看父層有多高。父層跟元素等高，或只比元素高一點點，sticky 就沒有作用。
- 「正式頁面好、預覽或嵌入環境壞」時，先找多出來的那層包裝。凡是依賴父層範圍的樣式（sticky、百分比高度、`overflow` 裁切），都可能被一層等高的 wrapper 影響。
- 要嘛讓那層包裝自己 sticky，要嘛拿掉中間層。不要去改元件本身，因為元件在正式頁面上是對的。
