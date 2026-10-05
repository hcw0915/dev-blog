---
public: true
layout: ../../layouts/BlogPost.astro
title: JS - Shallow Copy & Deep Copy
createdAt: 1742274808288
updatedAt: 1742275058048
tags:
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: js-shallow-copy-deep-copy
---
# [筆記]淺複製 (Shallow Copy) & 深複製(Deep Copy)

- 參考 youtube "Dave Gray" 範例節錄與筆記
  https://www.youtube.com/watch?v=4Ej0LwjCDZQ
- codesandbox
  https://codesandbox.io/s/shallow-deep-60hw6r?file=/src/index.js

---

### 🌋 型別差異

要先提到基本型別(Primitive type)與物件型別(Object type)。

| 類型     | 內容                                                  |
| -------- | ----------------------------------------------------- |
| 基本型別 | undefined, Boolean, Number, String, BigInt, Symbol... |
| 物件型別 | Object, Array, Map, Set, WeakMap, Date...             |

- 基本型別傳「值」 -> values
- 物件型別傳「址」 -> references ->　址就是記憶體位置的地址

> 基本型別與物件型別的傳值/址差異

```jsx title="Primitive & Object"
// Primitive
let x = 2;
let y = x;
y += 1;
// Primitive 傳值後, 個別獨立計算
console.log("y", y); // 3
console.log("x", x); // 2

// Object
let xArray = [1, 2, 3];
let yArray = xArray; // -> 事實上指向同一個 reference
yArray.push(4);
// Object 傳址後, 改變 yArray 的同時也會改變 xArray
console.log("yArray", yArray); // [1, 2, 3, 4]
console.log("xArray", xArray); // [1, 2, 3, 4]
```

> 基本型別不可變(immutable)，但重新賦值(reassignment)不在此限。

```jsx
// Primitive is immutable
let myName = "Dave";
myName[0] = "w"; // Error!!
console.log(myName); // Dave

// but reassignment is available
myName = "David";
console.log(myName); // David
```

---

> 物件型別可變(mutable)

```jsx
// Object is mutable
const yArray = [1, 2, 3, 4];
yArray[0] = 9;
console.log(yArray); // [9, 2, 3, 4]
console.log(xArray); // [9, 2, 3, 4]
```

---

## 🌋 深/淺複製

會使用到深複製的場合基本上都是不想要改變原變數的資料數值，進而影響資料的原始內容。
相對應用到函數式程式設計 (functional programming) 上面， 純函式(Pure Function)對於資料可變性的要求自然相對較高，但並不太代表可變性是不好的，有時候開發過程還是需要改變資料內容。

### 🌋 淺複製 Shallow Copy

- 展開運算符(Spread operator)

```jsx title="Spread operator"
const yArray = [1, 2, 3, 4];
const zArray = [...yArray];
console.log(zArray === yArray); // false
```

- Object.assign()

```jsx title="Object.assign()"
const yArray = [1, 2, 3, 4];
const tArray = Object.assign([], yArray);
console.log(zArray === yArray); // false

tArray.push(11);
console.log(yArray); // [9, 2, 3, 4]
console.log(tArray); // [9, 2, 3, 4, 11]
```

- Array.prototype.slice()

```jsx title="Array.prototype.slice()"
const arr1 = [
  [1, 2, 3],
  [4, 5, 6],
];
const arr2 = arr1.slice(0); // [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]

// 修改原陣列
arr1[0][0] = "Hi";

// 兩個陣列都被修改了
console.log(arr1); // [ [ 'Hi', 2, 3 ], [ 4, 5, 6 ] ]
console.log(arr2); // [ [ 'Hi', 2, 3 ], [ 4, 5, 6 ] ]
```

- Array.from()

```jsx title="Array.from()"
let ary = [
  [1, 1],
  [2, 2],
];
let newAry = Array.from(ary);

newAry.push([3.3]);
newAry[0] = [0, 0];

// ary = [[1,1], [2,2]]
// newAry = [[0,0], [2,2], [3,3]]
```

:::danger
淺複製的物件內巢狀結構(nested)，沒有辦法複製，還是會更改到原物件。
:::

> Object.freeze() 也與淺複製一樣，在巢狀結構失效。
> (這個不是淺複製，只是說明有巢狀失效的特性)

```jsx
const scoreObj = {
  first: 44,
  second: 12,
  third: { a: 1, b: 2 },
};

Object.freeze(scoreObj);
scoreObj.first = 10; // unnested -> Error

scoreObj.third.a = 8; // nested -> success
console.log("scoreObj", scoreObj); // a:1 -> a:8
```

:::info
Note: `Array.from()`, 這兩個也是深拷創造者
:::

### 🌋 深複製 Deep Copy

為了避免淺拷出現的這個問題，所以深複製更為實用。
也有許多第三方庫內建有深複製的功能，像是`lodash`, `Ramda`。

- Lodash

```jsx
_.cloneDeep(value);
```

- #### 🌋JSON.parse(JSON.stringify())

```jsx
const A = JSON.parse(JSON.stringify(a));
```

- #### 🌋 手動刻一個吧

```jsx
/*
Here is one line Vanilla JS solution
but it doesn't work with
Dates, functions, undefined, Infinity, RegExps, Maps, Sets, Blobs, FileLists, ImageDatas,
and other complex data types.
*/
const deepClone = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  // Create an array or object to hold the values
  const newObject = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    const value = obj[key];
    // recursive call for nested objects & arrays
    newObject[key] = deepClone(value);
  }
  return newObject;
};
```