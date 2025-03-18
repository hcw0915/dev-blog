---
public: true
layout: ../../layouts/BlogPost.astro
title: TS 索引簽名問題
createdAt: 1742278619801
updatedAt: 1742278660638
tags:
  - Blog
  - Typescript
heroImage: /placeholder-hero.png
slug: ts
---

# [筆記] TS 索引簽名問題

```typescript
const routes = {
  home: "/",
  admin: "/admin",
  users: "/users",
};

const goToRoute = (route: "/" | "/admin" | "/users") => {};

goToRoute(routes.admin); // 此行會報錯
```

主要是因為 router 有可能會被修改所以是不一定可以被型別保護的。

所以重點應該是 要如何確認 `routes` 是不變的

1. 加入 `as const` 讓整個物件確認是不可變的

```typescript
const routes = {
  home: "/",
  admin: "/admin",
  users: "/users",
} as const;
```

---

2. 利用 `Object.freeze()` 去凍結物件, 但多層嵌套 會有問題

```typescript
const routes = Object.freeze({
  home: "/",
  admin: "/admin",
  users: "/users",
  deep: {
    route: "/xxxxxxxxxxx", // 此項是可以被修改的
  },
});
```

---

3. 加入 `Record<string, string>` 作為型別索引簽名使用

```typescript
const routes: Record<string, string> = {
  home: "/",
  admin: "/admin",
  users: "/users",
  deep: {
    route: "/xxxxxxxxxxx", // 此項是可以被修改的
  },
};
```

---

4. 獲取 `routes` 的型別定義, `keyof typeof routes` 獲取每一個 `key` 值

   最後得到 `Route = '/' | '/admin' | '.users'`

```typescript
const routes = {
  home: "/",
  admin: "/admin",
  users: "/users",
};

type RouterKeys = keyof typeof routes;

type Route = (typeof routes)[RouterKeys];
//  Route = '/' | '/admin' | '/users'

const goToRoute = (route: "/" | "/admin" | "/users") => {};

goToRoute(routes.admin); // 此行會報錯
```