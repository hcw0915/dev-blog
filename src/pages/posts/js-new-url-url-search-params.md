---
public: true
layout: ../../layouts/BlogPost.astro
title: JS - new URL & URLSearchParams
createdAt: 1742277767519
updatedAt: 1742277792597
tags:
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: js-new-url-url-search-params
---

# [筆記] new URL & URLSearchParams

### new URL

```javascript
const url1 = new URL("http://localhost:5173/profile/1?token=1");
const url2 = new URL("/profile/1", "http://localhost:5173");
// 兩者相同
```

```javascript
{
  hash: "",
  host: "localhost:5173"
  hostname:"localhost"
  href:"http://localhost:5173/profile/1"
  origin:"http://localhost:5173"
  password:""
  pathname:"/profile/1"
  port:"5173"
  protocol:"http:"
  search:""
  searchParams: URLSearchParams {size: 0}
  username:""
}
```

`searchParams` 可以直接運用 get 對應 token 獲取資料

```javascript
url.searchParams.get("token"); // 1
```

---

### URL parameters

比較常用 `set` `get` k-v 方式去做獲取
或是可以直接使用 `query-string` 第三方 pkg 做使用

> https://www.npmjs.com/package/query-string

```javascript
url.searchParams.set("q", "test me!");
// https://google.com/search?q=test+me%21

url.searchParams.set("tbs", "qdr:y");
// https://google.com/search?q=test+me%21&tbs=qdr%3Ay
```

針對 queryString 常用到兩種做編解碼

`encodeURIComponent`, `decodeURIComponent`: 可以常見 `%20` `%26` 等等之類的編碼就是有透過 `encode` 行為

```javascript
let music = encodeURIComponent("Rock&Roll");

let url = `https://google.com/search?q=${music}`;
// https://google.com/search?q=Rock%26Roll
```

---