---
public: true
layout: ../../layouts/BlogPost.astro
title: JS Proxy
createdAt: 1742274776969
updatedAt: 1742274795429
tags:
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: js-proxy
---
# [筆記] JS Proxy

> - [快来围观一下 JavaScript 的 Proxy](https://juejin.cn/post/6844903613001629703)
> - [bilibili-前端小夏老師](https://reurl.cc/XEl3Ge)
> - [[筆記] Javascript Proxy](https://blog.twjoin.com/%E7%AD%86%E8%A8%98-javascript-proxy-27efab4f0b81)
> - [[JS] JavaScript 代理（Proxy）](https://pjchender.dev/javascript/js-proxy/)
> - [[Javascript] 使用 Proxy 為 Object 代理進行前處理](https://reurl.cc/11oz3D)

---

### Proxy -> 代理 以物件(Object)為主。

- 預設值、預設格式
- 驗證、條件式轉換
- 限制訪問

> 🚩 範例一: 查找電話，某些屬性不允許訪問，但是原資料也會有。所以設定條件。

```javascript
let star = {
  name: "aaa",
  age: "20",
  number: "09123456789",
};

let proxy = new Proxy(star, {
  // 攔截用戶獲取(get)的行為
  get: function (target, key, receiver) {
    if (key === "number") {
      return "123456789";
    }
    return Reflect.get(target, key, receiver);
  },
});

console.log(proxy.number); // 123456789
```

> 🚩 範例二: 實現 陣列負索引查找，在取值時，針對 index 做條件式控制回傳的 index。

```javascript
let arr = [1, 2, 3, 4, 5];

function newArray() {
  return new Proxy(arr, {
    // target: arr, index: -1([-1]), receiver: 沒用到...
    get: (target, index, receiver) => {
      index = Number(index); // 轉型
      if (index < 0) {
        index = index + target.length; // -1+6 =5(也是最後一個)
      }
      return Reflect.get(target, index, receiver);
    },
  });
}

// 把這個帶有 proxy 代理的新array 覆蓋在 arr上
arr = newArray(arr);

console.log(arr[-1]); // 5
```

> 🚩 範例三: 限制年齡設置(偏驗證)，所以在下面 `luka.age = -1` 出現 `error`

```javascript
let data = {
  name: "luka",
  age: 10,
};

const luka = new Proxy(data, {
  set(target, prop, newValue) {
    if (prop === "age" && newValue < 0) {
      throw new Error("age不能小於0");
    }
    target[prop] = newValue;
  },
});

console.log(luka.age); // 10
luka.age = 15;
console.log(luka.age); // 15
luka.age = -1; // error
```

> 🚩 範例四: 依使用者輸入 `book.XXX / book['XXX']` 依參數不同導出不同轉換結果

```javascript
const book = new Proxy(
  {
    name: "javascript試煉",
    price: 150,
  },
  {
    get(target, prop) {
      if (prop === "twd") {
        return target.price * 30;
      }
      if (prop === "usd") {
        return target.price;
      }
      return target[prop];
    },
  }
);
console.log(book.usd); // 150
console.log(book.twd); // 4500
```

> 🚩 範例五: 資料處理格式化。

```javascript
const form = new Proxy(
  {},
  {
    set: (obj, prop, value) => {
      if (prop === "content") {
        obj[prop] = {
          ...value,
          isEditing: false,
          hasSubmitted: false,
        };
      }
    },
  }
);

form.content = {
  label: "Age",
  defaultValue: 20,
};

console.log(form.content);
// {
//  label: 'Age',
//  defaultValue: 20,
//  isEditing: false,
//  hasSubmitted: false
// }
```