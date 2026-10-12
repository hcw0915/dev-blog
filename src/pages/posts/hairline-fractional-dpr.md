---
public: true
slug: hairline-fractional-dpr
layout: ../../layouts/BlogPost.astro
title: 1px 的線為什麼粗細不一：非整數縮放下 border 與盒子的像素對齊
createdAt: 1791788669373
updatedAt: 1791788669373
tags:
  - CSS
  - Blog
heroImage: /placeholder-hero.png
---

> 設計稿上兩條都是 1px 的線，在某些螢幕上卻一粗一細。原因不在顏色或透明度，而在 125%、150%、160% 這類非整數縮放下，瀏覽器對「邊框」和「一般盒子」用的是兩套不同的像素對齊規則。這篇用實測截圖說明兩套規則各自怎麼算、為什麼 DevTools 量到的數字會誤導人，以及要畫一條在任何縮放下都穩定的線該用哪種寫法。文末附一個可以自己調縮放、拖位移觀察的 demo。

> [!NOTE]
> 作者說明：實測環境是 macOS 上的 Chrome 154，用 `--force-device-scale-factor` 指定 DPR，截圖後逐列數實體像素。其他瀏覽器的對齊細節可能不同，文中的規則只對 Chrome 驗證過。

## 一、現象：兩條 1px 的線，一條比較粗

頁面上有兩條分隔線：一條是元件的 `border-top: 1px`，另一條是獨立的分割線元件，用一個高 1px、有背景色的 `div` 畫成（Tailwind 的 `h-px`）。設計稿上兩條一樣，在大多數裝置上看起來也一樣，但在某台筆電上，分割線明顯比較粗、比較亮。

那台機器的 `window.devicePixelRatio` 是 1.6。DPR 是「一個 CSS 像素對應幾個實體像素」，1.6 常見的來源有兩種：

- Retina 螢幕（DPR 2）把瀏覽器縮放調到 80%：2 × 0.8 = 1.6
- Windows 筆電把系統縮放設在 125%、150%、175%，DPR 就是 1.25、1.5、1.75

只要 DPR 是整數（1、2、3），1px 剛好是整數個實體像素，兩種寫法畫出來完全一樣。問題只出在非整數 DPR。

## 二、DevTools 量到的數字會誤導

在 DPR 1.6 下，先用 DevTools 看兩條線：

| 寫法 | 量測方式 | 數值 |
|---|---|---|
| `border-top: 1px` | `getComputedStyle().borderTopWidth` | 0.625px |
| `height: 1px` 的 `div` | `getBoundingClientRect().height` | 0.996px |

看起來像是「border 被縮成 0.625px，div 維持 1px，所以 div 比較粗」。這個推論的前半段對，後半段不對：**這兩個數字量的都是版面，不是畫出來的樣子**。版面上的 0.996px 最後會畫成幾個實體像素，要看截圖才知道。

## 三、實際畫出來的樣子

我在同一頁放了三欄，各 12 條線，每條的 `top` 間隔 15.37px（刻意用小數，讓每條線落在不同的次像素位置）。DPR 1.6 下的截圖：

![DPR 1.6 下的 demo：border 那欄每條粗細相同；height: 1px 那欄右側的推算值在 1 和 2 之間交錯，粗的那幾條肉眼就看得出來](/posts/hairline-fractional-dpr_57.png)

把每欄前三條線放大 7 倍，用最近鄰縮放保留像素格：

![放大後的實體像素：border 每條都是 1 個實體像素；height: 1px 有的是 1 個、有的是 2 個；box-shadow 是一條全亮的線加一條半透明的線](/posts/hairline-fractional-dpr_56.png)

三種寫法畫出三種結果。把截圖逐列數實體像素，換不同 DPR 各跑一次（每格是同一欄 10 條線各自的實體像素數）：

| DPR | `border-top: 1px` | `height: 1px` | `box-shadow: inset 0 1px` |
|---|---|---|---|
| 1 | 1111111111 | 1111111111 | 每條 1 列 |
| 1.25 | 1111111111 | 1111211112 | 1～2 列，邊緣那列半透明 |
| 1.5 | 1111111111 | 2222222222 | 1～2 列，邊緣那列半透明 |
| 1.6 | 1111111111 | 2221122211 | 1～2 列，邊緣那列半透明 |
| 1.75 | 1111111111 | 1222222211 | 1～2 列，邊緣那列半透明 |
| 2 | 2222222222 | 2222222222 | 每條 2 列 |

border 那欄在每個 DPR 下都一致；`height: 1px` 在非整數 DPR 下會在 1 和 2 之間跳，而且跳的模式隨位置變。

## 四、兩套規則

### 邊框：寬度先取整，再畫

CSS Values 4 定義了一個步驟叫 [snap a length as a line width](https://drafts.csswg.org/css-values-4/#lengths)，border 寬度會先經過它：

> 1. If len is an integer number of device pixels, do nothing.
> 2. If the absolute value of len is greater than zero, but less than 1 device pixel, round it away from zero to 1 or -1 device pixel.
> 3. If the absolute value of len is greater than 1 device pixel, round it towards zero to the nearest integer number of device pixels.

DPR 1.6 時，1px 是 1.6 個實體像素，大於 1，所以往零的方向取整成 1 個實體像素，換回 CSS 像素就是 1 ÷ 1.6 = 0.625px，正是 DevTools 量到的值。DPR 1.25、1.5、1.75 也都取整成 1；DPR 2 剛好是整數，維持 2。

重點是：**取整發生在寬度上，跟這條線在哪個位置無關**，所以每條都一樣粗。

### 一般盒子：上下兩個邊各自對齊

`height: 1px` 的 `div` 沒有這個步驟。它的高度維持 1px，畫的時候是把盒子的上邊、下邊各自四捨五入到最近的實體像素：

```
實體像素數 = round((y + 1) × dpr) − round(y × dpr)
```

`y` 是線在頁面上的位置。DPR 1.6 時，1px 是 1.6 個實體像素，上下兩個邊各自取整後，差值可能是 1 也可能是 2，取決於 `y × 1.6` 的小數部分落在哪裡。我用這條式子推算 demo 裡每條線的粗細，跟截圖逐列數出來的結果全部吻合（上圖右側的數字就是推算值）。

所以 div 畫出來不是「1.6 個像素、比較糊」，而是**全亮的 1 或 2 個像素，看位置決定**。同一頁上兩條 `h-px` 的線，可能一條 1 個、一條 2 個；版面上方多一行字讓線往下移，粗細也可能跟著變。

### box-shadow：不對齊，靠反鋸齒

`box-shadow: inset 0 1px` 又是另一種結果：它不對齊實體像素，邊緣用反鋸齒補。放大後是一條全亮的線加上一條半透明的線，看起來比另外兩種都糊。

## 五、所以要畫一條穩定的線，用 border

回到一開始的兩條線。直覺的修法是「讓兩條用同一種寫法」，這個方向是對的，但要選對統一成哪一種：

- **都改成 `height: 1px` 的 div**：兩條是同一種寫法了，但在非整數 DPR 下，各自仍會因位置不同而是 1 或 2 個實體像素，不保證一樣粗。我一開始就差點往這個方向修，因為在當下那個畫面裡量到兩條「都是 0.996px」，看起來一致；那只是兩條線剛好落在同一種位置。
- **都改成 border**：寬度先取整，跟位置無關，任何 DPR 下每條都一樣粗、而且都是清楚的整數像素。

分割線改成 border 的寫法很簡單，讓元素本身高度為零，只留上邊框：

```html
<!-- 不穩定：粗細看位置 -->
<div class="h-px bg-white/5"></div>

<!-- 穩定：寬度先取整 -->
<div class="h-0 border-t border-white/5"></div>
```

代價是在 DPR 1.25～1.75 的螢幕上，border 會比設計稿的「1.6 個實體像素」細一點（1 個）。但它在整頁是一致的，這通常比「有的線粗、有的線細」容易接受。

## 六、自己玩玩看

[Playground：1px Line at Fractional DPR](/playground/vanilla/one-pixel-line) 有同樣的三欄。用 ⌘+／⌘−（Windows 用 Ctrl）把瀏覽器縮放調到 125%、150% 或 80%，DPR 會即時更新；拖動「整體位移」可以把所有線一起往下移 0～1px，看 `height: 1px` 那欄的粗細怎麼跟著跳，border 那欄則完全不動。

## 七、可以帶走的原則

- **只有非整數 DPR 才會出事。** 125%、150%、175% 的系統縮放，或 Retina 加 80%、90% 的瀏覽器縮放，都是常見的情境；DPR 1、2、3 不會。
- **DevTools 量的是版面，不是像素。** `borderTopWidth` 0.625px 和 `height` 0.996px 不能直接比粗細，要截圖、放大、數實體像素。
- **border 寬度先取整，跟位置無關；盒子的邊各自對齊，粗細看位置。** 這是兩套規則，不是同一套的誤差。
- **要穩定的細線就用 border。** `h-px` 的 div 方便，但在非整數 DPR 下粗細會隨位置跳；`box-shadow` 則會糊。
- **統一寫法時，選那個「行為不隨位置變」的。** 在單一畫面上量到兩條一樣，不代表換個位置、換個 DPR 還一樣。
