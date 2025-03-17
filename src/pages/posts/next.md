---
public: true
layout: ../../layouts/BlogPost.astro
title: 'Next '
createdAt: 1741854513250
updatedAt: 1741939868128
tags:
  - Next
heroImage: /placeholder-hero.png
slug: next
---

### Next.js 13 版本
```javascript!
export default function handler(req, res) {
  res.status(200).json(products);
}
```


### Next.js 14 版本
```javascript!
export async function GET() {
  return Response.json(products);
}
```

---
### SSR SSG CSR ISR

#### SSG
```javascript
async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

#### SSR
```javascript!
export const dynamic = 'force-dynamic';

async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

#### ISR
```javascript!
export const revalidate = 60; // 秒數

async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```



### 樹狀圖 // 預設結構 以及資料夾規則
```json
app/
├── layout.js                    // 全局布局
├── page.js                      // 首頁
├── not-found.js                 // 全局 404 頁面
├── loading.js                   // 全局加載 UI
├── error.js                     // 全局錯誤處理
├── (marketing)/                 // 分組路由（不影響 URL）
│   ├── about/
│   │   └── page.js              // /about
│   └── contact/
│       └── page.js              // /contact
├── dashboard/
│   ├── layout.js                // 儀表板布局
│   ├── page.js                  // 儀表板主頁
│   ├── loading.js               // 儀表板加載 UI
│   └── [id]/                    // 動態路由
│       ├── page.js              // /dashboard/123
│       └── error.js             // 特定儀表板項目的錯誤處理
├── blog/
│   ├── template.js              // 博客模板
│   ├── page.js                  // 博客首頁
│   └── [...slug]/               // 捕獲所有路由
│       ├── page.js              // /blog/2023/01/post
│       └── loading.js           // 博客文章加載 UI
├── products/
│   ├── page.js                  // /products
│   └── [[...categories]]/       // 可選的捕獲所有路由 包含 '/'
│       ├── page.js              // /products, /products/electronics, /products/electronics/laptops
│       └── not-found.js         // 產品類別的 404 頁面
├── api/
│   └── hello/
│       └── route.js             // API 路由
└── _utils/                      // 私有文件夾（不作為路由）
    └── helpers.js
middleware.js                    // 全局中間件（在 app 目錄外）
```




---

### middleware.ts

可以很好限制 url 導向 或是語系等等問題 `/zh/` `/en/` `/kr/` `/jp/`....

```typescript!
import { NextResponse, type NextRequest } from "next/server"

// 基本上類似攔截器功能, 可以針對 match 配對的檔案做處理一層處理
export const config = {
  // Do not run the middleware on the following paths
  // prettier-ignore
  matcher: '/provider'
};

export function middleware(request: NextRequest) {
     // 只要 url = /profile 都會被導到 /hello 的 url
     if (request.nextUrl.pathname === "/profile") {
       const redirectUrl = new URL("/hello", request.url)
       return NextResponse.rewrite()
     }
     return NextResponse.redirect(new URL("/", request.url))
    
     // 可以做一些處置 setHeader cookies 等等 request 內部的內容
//   const response = NextResponse.next()
//   const themePreference = request.cookies.get("theme")
//   if (!themePreference) {
//     response.cookies.set("theme", "dark")
//   }
//   response.headers.set("custom-header", "custom-value")
//   return response
}
```


---
---


# Next.js 渲染策略與最佳實踐指南 (241031)

## 目錄
- [渲染模式](#渲染模式)
- [Server Components](#server-components)
- [配置優先順序與衝突處理](#配置優先順序與衝突處理)
- [漸進式載入策略](#漸進式載入策略)
- [Partial Prerendering (PPR)](#partial-prerendering-ppr)

## 渲染模式

### 靜態生成 (SSG)
- Next.js 的預設渲染模式
- 在建置時生成靜態 HTML
- 最佳使用場景：
  - 營銷頁面
  - 部落格文章
  - 產品列表
  - 幫助和文檔

```typescript
// 基本 SSG
export default function Page() {
  return <div>Static Content</div>
}

// 帶有靜態數據的 SSG
export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({
    id: product.id,
  }))
}
```

### 增量式靜態重生成 (ISR)
- SSG 的延伸，允許在特定時間間隔更新靜態頁面
- 結合了 SSG 的性能和動態內容的新鮮度

```typescript
// 頁面層級的 ISR
export const revalidate = 60 // 60秒

// 數據層級的 ISR
fetch(URL, { next: { revalidate: 60 } })
```

### 客戶端渲染 (CSR)
- 在瀏覽器中執行的渲染
- 適用於高度互動的UI組件

```typescript
'use client'
export default function InteractiveComponent() {
  const [state, setState] = useState()
  return <button onClick={() => setState(!state)}>Toggle</button>
}
```

### 伺服器端渲染 (SSR)
- 每個請求都在伺服器端動態生成頁面
- 適用於需要實時數據的頁面

```typescript
// 強制 SSR
export const dynamic = 'force-dynamic'

// 或使用 no-store fetch
fetch(URL, { cache: 'no-store' })
```

## Server Components

### 基本概念
- App Router 中的預設組件類型
- 在伺服器端執行，減少客戶端 JavaScript

### 使用場景
1. **數據獲取**
```typescript
async function DataComponent() {
  const data = await fetchData() // 直接在伺服器端獲取
  return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>
}
```

2. **存取後端資源**
```typescript
import { db } from '@/lib/db'

async function DbComponent() {
  const user = await db.query('SELECT * FROM users')
  return <UserProfile user={user} />
}
```

3. **減少客戶端 Bundle**
```typescript
// 大型依賴庫保持在伺服器端
import { heavyLibrary } from 'heavy-library'

export default function ServerComponent() {
  const result = heavyLibrary.process()
  return <div>{result}</div>
}
```

### async 使用規則
- 只在需要非同步操作的組件中使用 async
- 可以混合使用 async 和非 async 組件

## 配置優先順序與衝突處理

### 靜態/動態渲染設置
```typescript
// 1. 路由層級設置（最高優先）
export const dynamic = 'force-dynamic' | 'force-static' | 'auto' | 'error'

// 2. 數據獲取設置
export const fetchCache = 'force-cache' | 'force-no-store' | 'default-cache'

// 3. 重驗證設置
export const revalidate = 60 // 秒
```

### 優先順序規則
1. 路由層級配置覆蓋所有其他配置
2. fetch 配置覆蓋組件層級配置
3. 動態設置覆蓋靜態設置

### 衝突解決策略
```typescript
// 示例：處理多層級配置
export const revalidate = 60 // 頁面級別

async function Component() {
  // 這個 fetch 會遵循頁面 revalidate
  const data1 = await fetch(URL1)
  
  // 這個 fetch 有自己的配置
  const data2 = await fetch(URL2, {
    cache: 'no-store' // 覆蓋頁面配置
  })
  
  // 這個 fetch 有特定的重驗證時間
  const data3 = await fetch(URL3, {
    next: { revalidate: 30 } // 特定時間
  })
}
```

## 漸進式載入策略

### 基本 Suspense 使用
```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent />
    </Suspense>
  )
}
```

### 串聯式載入
```typescript
export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<MainSkeleton />}>
        <MainContent />
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments />
        </Suspense>
      </Suspense>
    </>
  )
}
```

### 平行載入
```typescript
export default function Page() {
  return (
    <div className="grid">
      <Suspense fallback={<ProductSkeleton />}>
        <Product />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />
      </Suspense>
    </div>
  )
}
```

### Loading.tsx 整合
```typescript
// app/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}

// app/page.tsx
export default async function Page() {
  const data = await fetchData() // 自動使用 loading.tsx
  return <Content data={data} />
}
```

## Partial Prerendering (PPR)

### 概述
- Next.js 的新一代渲染模式
- 允許在同一頁面中混合靜態和動態內容
- 提供更好的首次載入性能

### 工作原理
1. 靜態外殼即時加載
2. 動態內容通過流式傳輸填充
3. 保持互動性而不犧牲性能

### 實作方式
```typescript
export default function Page() {
  return (
    <>
      <Static /> {/* 靜態預渲染 */}
      <Suspense fallback={<Loading />}>
        <Dynamic /> {/* 動態流式傳輸 */}
      </Suspense>
    </>
  )
}
```

### PPR 優勢
1. 更快的首次載入時間
2. 更好的 SEO 支持
3. 改善的用戶體驗
4. 降低伺服器負載

### 最佳實踐
- 識別並分離靜態/動態內容
- 使用適當的加載狀態
- 優化重要內容的優先級
- 監控性能指標

## 總結建議

1. **渲染策略選擇**
   - 優先考慮 Static Generation
   - 需要即時數據時使用 SSR
   - 互動組件使用 Client Components
   - 考慮使用 PPR 優化用戶體驗

2. **性能優化**
   - 適當使用 revalidate
   - 實施漸進式載入
   - 優化組件邊界
   - 監控關鍵性能指標

3. **開發最佳實踐**
   - 明確的組件職責
   - 適當的錯誤處理
   - 有效的緩存策略
   - 持續的性能監控

4. **未來展望**
   - 關注 PPR 發展
   - 適應新的渲染模式
   - 持續優化用戶體驗


---

## SEO 


### 🤯 favicon.ico 
網站主圖 `/app/favicon.ico`


### 🤯 opengraph-image.png (the OG image)

### 🤯 metadata
在主要 layout 設置 metadata 模板, 使之應用到其他頁面
`%s`: 主要對應各頁面 metadata title
![image](https://hackmd.io/_uploads/HyKZGjWFyx.png)

```typescript!
export const metadata: Metadata = {
  title: {
    default: "My Awesome Blog",
    template: "%s - My Awesome Blog"
  },
  description: "Come and read my awesome articles!",
  twitter: {
    card: "summary_large_image"
  }
}
```

https://www.opengraph.xyz/
可以透過此網站看到連結引用時的預覽截圖畫面
![image](https://hackmd.io/_uploads/By0dMj-Fke.png)


### generateMetadata 
可以依照動態頁面 id 而產生對應的 metadata, 


https://juejin.cn/post/7433796131858497546?searchId=20250206105037E0E160A3C9A702D0B0F4
![image](https://hackmd.io/_uploads/BJs14iWYkx.png)


官網demo也可以透過 jsx 編寫組件式的 og image
https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#generate-images-using-code-js-ts-tsx
![image](https://hackmd.io/_uploads/rklcSi-YJx.png)



### generateStaticParams
優先獲取靜態參數

https://nextjs.org/docs/app/api-reference/functions/generate-static-params

```typescript!
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then((res) => res.json())
 
  return posts.map((post) => ({
    slug: post.slug,
  }))
}
```

也可以控制返回的 `map array, slice(0, 5)` 去控制前五個為 pre-render, 更活動
特別可以依照貼文不同種類形式選擇是否需要做 pre-render.



![image](https://hackmd.io/_uploads/S1lcusbYkg.png)
![image](https://hackmd.io/_uploads/ByPiOs-KJx.png)

把動態加載的頁面調整為靜態 SSG, 提升 SEO 作法, 

### NotFound
可以針對沒有資料的頁面做 `notFound()` 導航
https://nextjs.org/docs/app/api-reference/functions/not-found

```typescript!
import { notFound } from 'next/navigation'
 
async function fetchUser(id) {
  const res = await fetch('https://...')
  if (!res.ok) return undefined
  return res.json()
}
 
export default async function Profile({ params }) {
  const user = await fetchUser((await params).id)
 
  if (!user) {
    notFound()
  }
 
  // ...
}
```



### Sitemap
可以透過 sitemap 讓爬蟲可以更好的去搜尋網站資訊
https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

可以手動新增, 也可以透過 `sitemap.ts` 動態生成, 
![image](https://hackmd.io/_uploads/SyqwRjZYJx.png)


### robots.txt
是告訴機器爬蟲該怎麼去爬, 哪些可以爬, 哪些不能爬等等資訊
https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
類似 sitemap 可以透過 robots.ts 動態生成 robots
![image](https://hackmd.io/_uploads/rkAukn-Y1e.png)
