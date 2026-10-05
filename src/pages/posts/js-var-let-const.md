---
public: true
layout: ../../layouts/BlogPost.astro
title: JS - var let const
createdAt: 1742274843298
updatedAt: 1742274874699
tags:
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: js-var-let-const
---
# [筆記]JS-無宣告/var/let/const

![](/blog/JS_Variables/variables.webp)
https://dev.to/niharrs/demystifying-var-let-and-const-1olf

#### 先前並沒有把 JS 基礎打好，因此在面試的時候對於作用域的概念有點一知半解，所以還是需要做個筆記稍微歸類一下，如果有錯誤的地方還麻煩指正一下=) 大大感謝。

> 內容將會隨著實際狀況做變動與更新。

---

### 🚩 全域變數(global variables)

- 全域變數：在函式作用域(function scope)之外宣告的變數，全域變數在整個程式中都可以被存取與修改。

- 可以藉由呼叫 window 確認變數是否存在。

> 但要如何宣告全域變數呢 ?

```javascript
var x = 100; // 函示外宣告
x = 100; // 無宣告變數
window.x = 100; // 直接產生 window 物件
```

### 🚩 無宣告變數

- 無宣告與 var 的最大差異在於是否能透過 delete 完成刪除。

> 透過 Object.getOwnPropertyDescriptor 或取全域屬性。
> 無宣告變數 具 ( configurable = true )屬性，代表可以被刪除。

```javascript
// 無宣告
x = 100;
Object.getOwnPropertyDescriptor(window, "a");
// {value: 6, writable: true, enumerable: true, configurable: true}
```

> 已宣告變數 具 (configurable = false) 屬性，代表無法被刪除。

```javascript
// 已宣告
var x = 999;
Object.getOwnPropertyDescriptor(window, "b");
// {value: 10, writable: true, enumerable: true, configurable: false}
```

---

🚫🚫🚫**_嚴格模式(strict mode 不允許使用未宣告的變數)_**

## ✈️ var

**_特性：⭕️ 可更改內容 ⭕️ 函式變數 ⭕️ 宣告前可使用(不報錯)_**

- 可重複宣告(後宣告覆蓋前宣告)，與變數提升。

- 不受限於區域內，但可能會汙染全域變數(global variables)。

- 作用域(scope)都可以被存取**。**

- 可先宣告後賦值。
  > 可在宣告前使用，雖顯示 **undefined** 但**不報錯**。
  > 也可以先宣告後賦值
  > 有變數宣告 = 此變數具有**位址 (reference)**，因未賦值 = 輸出為 **undefined**。

```javascript
console.log(x); // undefined
var x = 999;

var y;
console.log(y); // undefined
```

> **函式(function)「外」**宣告的 **var** 影響 **全域(global scope)**。

```javascript
var x = 999;
// --------------------------- ↓ 無 function 屬於 全域(global scope)
if (x) {
  var x = 10;
  console.log(x); // Ans. 10
}
// --------------------------- ↑ 無 function 屬於 全域(global scope)

console.log(x); // Ans. 10
```

> **函式(function)「內」**宣告的 **var** **只**影響 **函式作用域(function scope)**。

```javascript
var x = 999;
// --------------------------- ↓ 有 function 屬於 函式作用域(function scope)
function test() {
  var x = 10;
  console.log(x); // Ans. 10
}
// --------------------------- ↑ 有 function 屬於 函式作用域(function scope)

console.log(x); // Ans. 999
```

---

## 🚕 let \_ (ES6)

**_特性：⭕️ 可更改內容 ⭕️ 區域變數 ⭕️ 需宣告後使用_**

- 不可重複宣告。

- 存在於區塊內( **{ }** )，而不一定需要函式(function)。

- 無法在同一層重複宣告變數。

- 可先宣告後賦值。
  > 有變數宣告 = 此變數具有**位址 (reference)**，因未賦值 = 輸出為 **undefined**。

🚫🚫🚫**_嚴格模式(strict mode 不允許使用未宣告的變數)_**

```javascript
let x;
console.log(x); // undefined

console.log(y); // Uncaught ReferenceError: y is not defined
```

> **{ }** 內宣告的 **let** **只**影響 **{ }** **區域(block scope)。**

```javascript
var x = 999;
// --------------------------- ↓ if 內 {} 區域 可使用 let
if (x) {
  let x = 10;
  console.log(x); // Ans. 10
}
// --------------------------- ↑ if 內 {} 區域 可使用 let

console.log(x); // Ans. 999
```

> 無法在同一層區域重複宣告。

```javascript
let x = 1;
let x = 2;
console.log(x); //  Identifier 'x' has already been declared.
```

---

## 🚌 const \_ (ES6)

**_特性：❌ 不可更改內容 ⭕️ 區域變數 ⭕️ 需宣告後使用_**

- 不可重複宣告。

- 存在於區塊內( **{ }** )，而不一定需要函式(function)。

- 無法在同一層重複宣告變數。

- 宣告時必須同時給值。

- 賦值後不可更改位址(reference)
  > 宣告時必須同時給值。

```javascript
    const x
    // Uncaught SyntaxError: Missing initializer in const declaration
```

> 賦值後無法更動(reference 位址 無法更動)。

```javascript
const x = 100;
x = 999;
// Uncaught TypeError: Assignment to constant variable.
```

### 參考資料

- [https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Guide/Grammar_and_types](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Guide/Grammar_and_types)
- [https://tw.alphacamp.co/blog/javascript-var-let-const](https://tw.alphacamp.co/blog/javascript-var-let-const)
- [https://ithelp.ithome.com.tw/articles/10259899](https://ithelp.ithome.com.tw/articles/10259899)
- [https://totoroliu.medium.com/javascript-var-let-const-%E5%B7%AE%E7%95%B0-e3d930521230](https://totoroliu.medium.com/javascript-var-let-const-%E5%B7%AE%E7%95%B0-e3d930521230)
- [https://w3c.hexschool.com/blog/530adff5](https://w3c.hexschool.com/blog/530adff5)