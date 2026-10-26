---
public: true
slug: find-condition-operator-precedence
layout: ../../layouts/BlogPost.astro
title: a === b || c 的陷阱：find 條件恆真，永遠拿到第一筆
createdAt: 1792992166621
updatedAt: 1793002405595
tags:
  - Javascript
heroImage: /placeholder-hero.png
---

> 一個從別的專案搬進來的函式，要在使用者的多個錢包裡找出「目前選的那一個」，再讀它的鎖定狀態。條件寫成 `item.type === walletType || defaultType`，看起來像「沒有 walletType 就用 defaultType」，實際上只要 `defaultType` 不是 0，條件就永遠成立，`find` 永遠回傳第一筆。單一錢包時完全正常，所以一路搬進來、上線都沒被發現。

## 程式碼

```js
const walletType = user.defaultType ?? 0
const selected = user.wallets.find(
  (item) => item.type === walletType || user.defaultType,
)
if (!selected?.isLocked) return "none"
return getVerifyType(selected.lockConditions)
```

想表達的是：找 `type` 等於目前錢包類型的那一筆，目前類型沒有值就用預設類型。

## 實際的意思

`===` 的優先序比 `||` 高，所以這行等於：

```js
(item.type === walletType) || user.defaultType
```

`find` 的 callback 只要回傳 truthy 就算找到。`user.defaultType` 是 3 或 5 這種非零數字時，不管比對有沒有成立，整個條件都是 truthy，於是 `find` 在第一筆就停下來。

後面讀到的鎖定狀態、驗證條件，全部都是第一個錢包的。

## 為什麼很難發現

- **不會報錯**。`find` 回傳的是一筆真實存在的資料，型別也對。
- **大多數人只有一個錢包**。只有一筆時，第一筆剛好就是對的那筆。
- **多錢包時也不一定錯**。只有第一筆剛好不是目前錢包的使用者，才會讀到別的錢包的狀態。

> [!NOTE]
> 作者說明：影響範圍是讀程式碼推論的。只有多錢包、而且第一筆不是目前錢包的使用者會中招，可能把該鎖定的判成未鎖定，或反過來。這部分沒有實際重現過。

## 它是怎麼進來的

這段是從另一個專案搬過來的。原專案就是同樣的括號寫法，搬的時候只改了 `walletType` 的來源，括號沒動。有意思的是，原專案另外幾個同功能的面板寫法是對的：

```js
(item) => item.type === (walletType || user.defaultType)
```

同一個邏輯在原專案裡就有對、錯兩種版本，搬的時候剛好挑到錯的那個。

## 修法

補一組括號：

```js
const selected = user.wallets.find(
  (item) => item.type === (walletType || user.defaultType),
)
```

更好的寫法是把 fallback 拆成具名變數，讓條件只剩一個比對：

```js
const targetType = walletType || user.defaultType
const selected = user.wallets.find((item) => item.type === targetType)
```

拆出來以後，「目標是哪一種錢包」和「找出那一筆」變成兩件事，讀的人不用在腦中推算優先序。

## 判斷原則

- 看到 `a === b || c` 這種把比較和 fallback 寫在同一行的條件，先確認作者要的是 `(a === b) || c` 還是 `a === (b || c)`。前者在 `c` 為真時恆真。
- `find`、`filter`、`some` 的 callback 條件恆真時不會報錯，只會靜默回傳第一筆或全部。這類 bug 要靠測試資料涵蓋「多筆、而且目標不在第一筆」的情況才抓得到。
- 從別的專案搬進來的程式碼，不代表驗證過。原專案的 bug 會原封不動地帶過來。
