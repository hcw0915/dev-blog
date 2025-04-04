---
public: true
layout: ../../layouts/BlogPost.astro
title: 'Shader ColorOffset '
createdAt: 1743735776014
updatedAt: 1743736351770
tags:
  - Three
  - Shader
  - Blog
heroImage: /placeholder-hero.png
slug: shader-color-offset
---

```js
// fragment.glsl
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;

void main() {

    // 數值差 取名 offset / bias , 倍數差 取名 multiplier / scale
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;

    // mix 0~1 兩個顏色過渡, 由 vElevation 控制混合比例
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>

    /**
    #include <colorspace_fragment> 主要是為了 確保顏色輸出符合 WebGL / Three.js 的色彩空間設定。
    建議加上，避免顏色偏暗或顯示不正確。
    如果你的渲染結果是直接給貼圖 (texture) 或特殊用途，可能可以省略。
    */
}
```

![clipboard.png](/posts/shader-color-offset_0.png)

# GLSL 顏色混合與 `mixStrength` 計算解析

## **1. `vElevation` 是什麼？**

- `vElevation` 是從 **vertex shader** 傳遞過來的變數，通常代表某個點的「高度」或「深度」。

- 它的值通常介於 `0.0`（最低點）到 `1.0`（最高點）之間。

- `mix(uDepthColor, uSurfaceColor, vElevation)` 會讓顏色隨著 `vElevation` 變化，但 `vElevation` 的範圍固定在 `[0, 1]`，變化幅度有限。

## **2. `uColorOffset` 是什麼？**

```glsl
(vElevation + uColorOffset)
```

- `uColorOffset` 是一個**偏移量**（offset / bias），用來讓 `vElevation` 整體提升或降低。

- 如果 `uColorOffset > 0`，則 `mixStrength` 會變大，導致顏色過渡提早發生（較低的 `vElevation` 也能影響顏色）。

- 如果 `uColorOffset < 0`，則顏色過渡會延遲到較高的 `vElevation` 才開始。

### **範例**：

| `vElevation` | `uColorOffset = 0.2` | `vElevation + uColorOffset` |
| ------------ | -------------------- | --------------------------- |
| `0.0`        | `0.2`                | `0.2`                       |
| `0.5`        | `0.2`                | `0.7`                       |
| `1.0`        | `0.2`                | `1.2`                       |

這讓顏色過渡往**上**移動了。

## **3. `uColorMultiplier` 是什麼？**

```glsl
(vElevation + uColorOffset) * uColorMultiplier
```

- `uColorMultiplier` 是一個**縮放係數**（multiplier / scale），用來調整 `mixStrength` 的變化速度。

- 當 `uColorMultiplier > 1.0`，顏色過渡會變快，`mixStrength` 的範圍變大，讓顏色變化更劇烈。

- 當 `uColorMultiplier < 1.0`，顏色過渡會變慢，`mixStrength` 的範圍變小，讓顏色變化更平滑。

### **範例**：

| `vElevation + uColorOffset` | `uColorMultiplier = 2.0` | `mixStrength` |
| --------------------------- | ------------------------ | ------------- |
| `0.0`                       | `2.0`                    | `0.0`         |
| `0.5`                       | `2.0`                    | `1.0`         |
| `1.0`                       | `2.0`                    | `2.0`         |

在這個例子中，`mixStrength` 變成 `[0, 2]`，超出了 `mix` 的標準 `[0,1]` 範圍，這可能會導致顏色過渡超過 `uSurfaceColor`，甚至變成 `uSurfaceColor` 之外的顏色。

## **4. 這行公式的作用**

整體來說：

```glsl
float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
```

- `uColorOffset` **改變顏色過渡的位置**（前移或後移）。

- `uColorMultiplier` **改變顏色過渡的強度**（快/慢變化）。

- `mixStrength` 會控制 `mix` 函數，影響最終顏色。

## **5. 為什麼要這樣設計？**

這樣的設計比單純 `mix(uDepthColor, uSurfaceColor, vElevation)` 更靈活：

1. **可以調整顏色過渡開始的高度（`uColorOffset`）** → 讓顏色變化區間更自由。

2. **可以控制顏色變化的速率（`uColorMultiplier`）** → 讓顏色變化更平滑或更劇烈。

3. **允許 `mixStrength` 超過 `[0,1]`，創造更多可能性** → 可以讓 `mix` 產生額外的顏色效果，例如 `vElevation` 超過 `1.0` 可能導致額外的高亮區域。

## **6. `mixStrength` 超過 `[0,1]` 會怎樣？**

GLSL 的 `mix(x, y, a)` **允許 `a` 超過 `1.0` 或低於 `0.0`**，這時候會進行線性外推（extrapolation）。

- 如果 `mixStrength < 0`，則顏色會**超過 `uDepthColor` 的範圍**，可能變得更深色。

- 如果 `mixStrength > 1`，則顏色會**超過 `uSurfaceColor` 的範圍**，可能變得更亮或產生不預期的顏色。

如果你希望 `mixStrength` 始終在 `[0,1]` 之間，可以用 `clamp()` 限制：

```glsl
mixStrength = clamp(mixStrength, 0.0, 1.0);
```

這樣就能確保顏色變化不會超過原本的範圍。

## **7. 總結**

這行程式碼：

```glsl
float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
```

- **`uColorOffset`**：改變顏色過渡的起點。

- **`uColorMultiplier`**：調整顏色過渡的強度。

- **這樣設計可以讓顏色過渡更加靈活，不只受限於 `vElevation` 的 0\~1 區間。**

這是用於 _地形、流體、火焰、雲層等漸變色_ 效果的常見技術！🔥🎨
