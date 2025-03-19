---
public: true
layout: ../../layouts/BlogPost.astro
title: Next (Images)
createdAt: 1741750197583
updatedAt: 1742357553687
tags:
  - Next
  - Blog
heroImage: /placeholder-hero.png
slug: next-images
---

# Next.js Image 元件筆記

## 基本介紹

`next/image` 是 Next.js 提供的圖片優化元件，可以自動進行尺寸調整、格式轉換和品質優化。

> 注意: 如果使用 Next.js 13 之前的版本，需要使用 `next/legacy/image`，因為元件已被重新命名。

## 基本用法

```jsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/profile.png"
      width={500}
      height={500}
      alt="Picture of the author"
    />
  )
}
```

## 必要屬性

- **src**: 圖片來源，可以是靜態導入的圖片檔案或路徑字串
- **width**: 圖片固有寬度（像素）
- **height**: 圖片固有高度（像素）
- **alt**: 圖片替代文字，用於螢幕閱讀器和搜尋引擎

> 注意: 當使用 `fill` 屬性或靜態導入圖片時，`width` 和 `height` 可以省略

## 可選屬性

### 📕 loader

自定義解析圖片 URL 的函數：

```jsx
const imageLoader = ({ src, width, quality }) => {
  return `https://example.com/${src}?w=${width}&q=${quality || 75}`
}

export default function Page() {
  return (
    <Image
      loader={imageLoader}
      src="me.png"
      alt="Picture of the author"
      width={500}
      height={500}
    />
  )
}
```

也可以在 `next.config.js` 中使用 `loaderFile` 全局配置。

### 📕 fill

當 `width` 和 `height` 未知時使用：

```jsx
<div style={{ position: 'relative', width: '300px', height: '500px' }}>
  <Image
    src="/profile.png"
    alt="Profile image"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

父元素必須設定 `position: "relative"`、`position: "fixed"` 或 `position: "absolute"` 樣式。

### 📕 sizes

提供關於圖片在不同斷點的寬度資訊的媒體查詢字串：

```jsx
<Image
  fill
  src="/example.png"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

這會影響 `srcset` 的生成並優化效能。

### 📕 quality

優化圖片的品質，1-100 的整數，預設為 75：

```jsx
<Image quality={90} ... />
```

### 📕 priority

當為 `true` 時，將預先加載圖片，適用於 LCP (Largest Contentful Paint) 元素：

```jsx
<Image priority ... />
```

### 📕 placeholder

圖片加載時使用的佔位符，可能值為 `blur`、`empty` 或 `data:image/...`：

```jsx
<Image
  src="/profile.png"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  ...
/>
```

當 `placeholder="blur"` 且圖片是靜態導入的 .jpg、.png、.webp 或 .avif 文件時，`blurDataURL` 會自動填充。

## 進階屬性

### 📕 style

允許將 CSS 樣式傳遞給底層圖片元素：

```jsx
const imageStyle = {
  borderRadius: '50%',
  border: '1px solid #fff',
}

export default function ProfileImage() {
  return <Image src="..." style={imageStyle} />
}
```

### 📕 onLoad

圖片完全加載後調用的回調函數：

```jsx
<Image onLoad={(e) => console.log(e.target.naturalWidth)} />
```

### 📕 onError

圖片加載失敗時調用的回調函數：

```jsx
<Image onError={(e) => console.error(e.target.id)} />
```

### 📕 loading

圖片的加載行為，可為 `lazy` 或 `eager`，預設為 `lazy`：

```jsx
<Image loading="eager" ... />
```

### 📕 blurDataURL

用作佔位符的 Base64 編碼圖片，搭配 `placeholder="blur"` 使用：

```jsx
<Image
  src="/profile.png"
  blurDataURL="data:image/jpeg;base64,..."
  placeholder="blur"
  ...
/>
```

### 📕 unoptimized

當為 `true` 時，圖片將按原樣提供，不改變品質、大小或格式：

```jsx
<Image unoptimized ... />
```

也可以在 `next.config.js` 中全局設定：

```js
module.exports = {
  images: {
    unoptimized: true,
  },
}
```

### 📕 overrideSrc

覆寫自動生成的 `src` 屬性，對 SEO 目的有用：

```jsx
<Image src="/me.jpg" overrideSrc="/override.jpg" ... />
```

## 配置選項 (next.config.js)

### 📕 remotePatterns

配置允許優化的外部圖片來源：

```js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/account123/**',
        search: '',
      },
    ],
  },
}
```

支持通配符：

- `*` 匹配單一路徑段或子域名
- `**` 匹配結尾的任意數量路徑段或開頭的子域名

### 📕 domains (已棄用)

僅當你擁有從域名提供的所有內容時使用：

```js
module.exports = {
  images: {
    domains: ['assets.acme.com'],
  },
}
```

### 📕 formats

配置圖片格式優先順序：

```js
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
  },
}
```

### 📕 deviceSizes

指定設備寬度斷點清單：

```js
module.exports = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
}
```

### 📕 imageSizes

指定圖片寬度清單：

```js
module.exports = {
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

### 📕 minimumCacheTTL

配置優化圖片的緩存生存時間（秒）：

```js
module.exports = {
  images: {
    minimumCacheTTL: 60, // 1 分鐘
  },
}
```

### 📕 dangerouslyAllowSVG

允許優化 SVG 圖片（建議同時設定安全相關配置）：

```js
module.exports = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}
```

## 響應式圖片技巧

### 📕 使用靜態導入的響應式圖片

```jsx
import Image from 'next/image'
import me from '../photos/me.jpg'

export default function Author() {
  return (
    <Image
      src={me}
      alt="Picture of the author"
      sizes="100vw"
      style={{
        width: '100%',
        height: 'auto',
      }}
    />
  )
}
```

### 📕 具有寬高比的響應式圖片

```jsx
import Image from 'next/image'

export default function Page({ photoUrl }) {
  return (
    <Image
      src={photoUrl}
      alt="Picture of the author"
      sizes="100vw"
      style={{
        width: '100%',
        height: 'auto',
      }}
      width={500}
      height={300}
    />
  )
}
```

### 📕 使用 fill 的響應式圖片

```jsx
import Image from 'next/image'

export default function Page({ photoUrl }) {
  return (
    <div style={{ position: 'relative', width: '300px', height: '500px' }}>
      <Image
        src={photoUrl}
        alt="Picture of the author"
        sizes="300px"
        fill
        style={{
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
```

## 進階用法

### 主題檢測 (明/暗模式)

可以創建一個包裝兩個 `<Image>` 組件的新組件，並根據 CSS 媒體查詢顯示正確的圖片：

```css
/* theme-image.module.css */
.imgDark {
  display: none;
}

@media (prefers-color-scheme: dark) {
  .imgLight {
    display: none;
  }
  .imgDark {
    display: unset;
  }
}
```

```jsx
import styles from './theme-image.module.css'
import Image from 'next/image'

export default function ThemeImage({ srcLight, srcDark, ...rest }) {
  return (
    <>
      <Image {...rest} src={srcLight} className={styles.imgLight} />
      <Image {...rest} src={srcDark} className={styles.imgDark} />
    </>
  )
}
```

### 使用 getImageProps 獲取圖片屬性

可以使用 `getImageProps()` 獲取將傳遞給底層 `<img>` 元素的屬性：

```jsx
import { getImageProps } from 'next/image'

export default function Page() {
  const common = { alt: 'Theme Example', width: 800, height: 400 }
  const {
    props: { srcSet: dark },
  } = getImageProps({ ...common, src: '/dark.png' })
  const {
    props: { srcSet: light, ...rest },
  } = getImageProps({ ...common, src: '/light.png' })

  return (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={dark} />
      <source media="(prefers-color-scheme: light)" srcSet={light} />
      <img {...rest} />
    </picture>
  )
}
```

### 藝術指導 (不同裝置顯示不同圖片)

```jsx
import { getImageProps } from 'next/image'

export default function Home() {
  const common = { alt: 'Art Direction Example', sizes: '100vw' }
  const {
    props: { srcSet: desktop },
  } = getImageProps({
    ...common,
    width: 1440,
    height: 875,
    quality: 80,
    src: '/desktop.jpg',
  })
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({
    ...common,
    width: 750,
    height: 1334,
    quality: 70,
    src: '/mobile.jpg',
  })

  return (
    <picture>
      <source media="(min-width: 1000px)" srcSet={desktop} />
      <source media="(min-width: 500px)" srcSet={mobile} />
      <img {...rest} style={{ width: '100%', height: 'auto' }} />
    </picture>
  )
}
```

## 已知的瀏覽器問題

- Safari 15.4 之前的版本可能會回退到即時加載

- Safari 12 之前的版本在使用模糊佔位符時會回退為空佔位符

- Safari 15-16.3 加載時顯示灰色邊框（Safari 16.4 已修復）

  - 解決方案: 使用 CSS `@supports (font: -apple-system-body) and (-webkit-appearance: none) { img[loading="lazy"] { clip-path: inset(0.6px) } }`
  - 或者對首屏圖片使用 `priority`

- Firefox 67+ 加載時顯示白色背景
  - 解決方案: 啟用 `AVIF` 格式
