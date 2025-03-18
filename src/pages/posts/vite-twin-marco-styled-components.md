---
public: true
layout: ../../layouts/BlogPost.astro
title: Vite twin.marco & styled-components
createdAt: 1742278843645
updatedAt: 1742278894281
tags:
  - Blog
  - Vite
  - General
  - React
  - Typescript
heroImage: /placeholder-hero.png
slug: vite-twin-marco-styled-components
---

# [筆記] Vite 配置 twin.marco / styled-components 的配置

為了方便配置 styled-component 與 tailwind 的組合, 選擇了 `twin.marco`

### 安裝
- 安裝 `twin.marco`, `styled-components`
- 安裝 `babel-plugin-macros`, `babel-plugin-styled-components`

- 再來是 建立 `twin.d.ts` 確保型別 

- `babel-plugin-macros`, `babel-plugin-styled-components` 配置於 `vite.config.ts` 
  此項可以透過 devTool 看到 className 對應組件名稱, 也可以取消選擇 `{ displayName: false }`

- `"preset": "styled-components"` 配置於 `package.json`

```js
// vite.config.ts
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-macros", "babel-plugin-styled-components"],
      },
    }),
  ],

// package.json
  "babelMacros": {
    "twin": {
      "preset": "styled-components"
    }
  }
```


```typescript
// twin.d.ts
import "twin.macro";

import type { CSSProp } from "styled-components";
import styledImport, { css as cssImport } from "styled-components";

declare module "twin.macro" {
  // The styled and css imports
  const styled: typeof styledImport;
  const css: typeof cssImport;
}

declare module "react" {
  // The css prop
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    css?: CSSProp;
    tw?: string;
  }
  // The inline svg css prop
  interface SVGProps<T> extends SVGProps<SVGSVGElement> {
    css?: CSSProp;
    tw?: string;
  }
}

// The 'as' prop on styled components
declare global {
  namespace JSX {
    interface IntrinsicAttributes<T> extends DOMAttributes<T> {
      as?: string;
    }
  }
}

```