---
public: true
layout: ../../layouts/BlogPost.astro
title: TS infer 推斷型別
createdAt: 1742278539816
updatedAt: 1742278577308
tags:
  - Typescript
  - Blog
heroImage: /placeholder-hero.png
slug: ts-infer
---

# [筆記] TS infer 推斷型別

### 🌋 練習 1 : 完整 `Return<T>` 完整取的泛型內的函式回傳值 (類似 ReturnType)

```typescript
type sum = (a: number, b: number) => number;
type concat = (a: any[], b: any[]) => any[];

let sumResult = Return<sum>; // number
let concatResult = Return<concat>; // any[]
```

```typescript
// type Return<T> = T 是一個函數 ? 函數的返回類型 : T
type Return<T> = T extends (...args: any[]) => infer R ? R : T;
```

---

### 🌋 練習 2 : 完整 PromiseType<T>

```typescript
type pt = PromiseType<string>; // string
```

```typescript
// type PromiseType<T> = T 是一個 Promise<泛型為 K> ? Promise 帶的 K : T
type PromiseType<T> = T extends Promise<infer K> ? K : T;
```

> 如果 `pt` 多層泛型則遞迴 K 去多層深挖

```typescript
// type PromiseType<T> = T 是一個 Promise<泛型為 K> ? Promise 帶的 K : T
type PromiseType<T> = T extends Promise<infer K> ? PromiseType<K> : T;

type pt = PromiseType<<PromiseType<string>>>; // string
```

---

### 🌋 練習 3 : 取得函式第一個參數推斷型別

狀況類似練習 1, 只是利用 剩餘參數的特性 去做參數分離

```typescript
type FirstArg<T> = T extends (first: infer K, ...args: any[]) : any ? K : T

type fa = FirstArg<(name: string, age: number) => void>;
```

---

### 🌋 練習 4 : 或許陣列泛型內的型別

T 必須是個陣列, 什麼陣列？ 請 infer 幫我推斷
然後拿取推斷出來的型別當作 T, 否則不是 陣列就回傳 T 類型

```typescript
type ArrayType<T> = T extends (infer K)[] ? K : T;

type ItemType1 = ArrayType<[string, number]>; // string | number
type ItemType1 = ArrayType<string[]>; // string
// string[] => [string, string, ...]
```

---

#### 其他： 函式表達式可表達形式

- `T extends (...args: any[]) => XXX `
- `T extends Function`

```typescript
interface GenericFunction<T, U, R> {
  (arg1: T, arg2: U): R;
}

interface MyFunction {
  (a: number, b: string): boolean;
}

type MyFunction = (a: number, b: string) => boolean;
```

---