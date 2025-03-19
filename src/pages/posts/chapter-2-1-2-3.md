---
public: true
layout: ../../layouts/BlogPost.astro
title: 前端測試指南 - 策略與實踐 (Chapter 2-1 ~ 2-3)
createdAt: 1741705816939
updatedAt: 1742357496356
tags:
  - Testing
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: chapter-2-1-2-3
---

## 單元測試

單測著重在「最小單位的測試」與「獨立測試特定的程式碼片段, 確保能獨立運作並正確處理特定情境輸入與輸出

---

```js
// addNumbers.js
const addNumbers = (a, b) => Number((a + b).toFixed(1))

// addNumbers.test.js
it('should return 0.3 when 0.1 + 0.2', () => {
  expect(addNumbers(0.1, 0.2)).toBe(0.3)
})
```

- `提升程式碼品質`
- `節省成本`
- `提早發現潛在錯誤`
- `便於重構`: 重構時透過功能驗證確保重構後功能正常
- `作爲良好文件`

作為最小粒度測試, 但是也會有極端或是非實際使用者的意外狀況產生, 因此配合整合測試/端對端測試才可以更好的補足缺漏的地方, 提高測試覆蓋.


---

## Jest 

- `describe`: 提供一個或多個 test case 的組合, 包含不同 test cases 的測試情境
- `it`: 定義單個 test case 與他的測試情境
- `expect`: 利用斷言庫進行 assert 的位置, 用於判斷實際值與期望值是否相同, 決定是否通過測試

```js
toBe()          // shallow comparison
toEqual()       // deep comparison
toStrictEqual() // *稀疏陣列 / undefined 與 物件 kv => 是更嚴格檢查

toBeNull()      // 比對 null
=> toBe(null)
toBeUndefined() // 比對 undefined
=> toBe(undefined)
```
*稀疏陣列: `[,,,,,,1,]` 只存一個 1, 其他都是 null

---
Enzyme vs React Testing Library (RTL) 差異比較 可以另外看一篇

[前端測試指南 - 策略與實踐 (Chapter 2)](/posts/chapter-2-1-2-3)

但不外乎都是抓測試元件某個按鈕的屬性
```js
// in <component>.js
<button data-test-id="increment-button" ...> + </button>

// in <component>.test.js
>> Enzyme 
wrapper.find('[data-test-id="increment-button"]', () => {...})

>> RTL (RTL 預設 data-testId, 筆者有額外配成 data-test-id)
fireEvent.click(getByTestId("increment-button"))                             
```

---

#### Cypress (反正就只是介紹而已...)

---

## 最小範圍的驗證邏輯

要做到最小範圍驗證邏輯必須注意兩個原則: 
1. `檢視測試區塊, 是否只完成一件任務`: 功能太多太雜, 需要先分離 (單一職責模式)
2. `隔絕依賴`: 撰寫時需隔絕依賴, 只測試單一功能


#### 例子
```js
const checkValentinesDay = () => {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return month === 2 && day === 14 ? "情人節快樂" : "今天不是情人節"
}
```

`checkValentinesDay` 包含以下功能:
- 取得今天日期
- 確認是否為 2/14 
- 回傳字串 "情人節快樂" / "今天不是情人節"

因此將職責進行拆分如下
```js
const checkValentinesDay = () => {
  const today = getToday()
  return today === '2/14' ? "情人節快樂" : "今天不是情人節"
}

const getToday = () => {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return `${month}/${day}`
}
```

#### 隔絕依賴

先對 `getToday` 進行模擬, 接續進行測試
- 測試非 2/14 時是否得到 「今天不是情人節」
- 測試 2/14 是否得到 「今天是情人節」

> [!IMPORTANT]
> - 將複雜的程式碼分解成多個部分，確保這些部分與外部依賴隔離
> - 專注於驗證邏輯的最小範圍
> 

---

## `jest.mock` 什麼時候該用？

### ❌ **不適合用 `jest.mock` 的情境**
如果你的目的是：

- 確保 API 是否有回應
- 測試 API 連線是否正常
- 確認 API 回傳的數據格式

那就不該 mock，因為這些測試的目標是 **「測 API 是否正常運作」**。

---

### ✅ **適合用 `jest.mock` 的情境**
如果你的目的是：

- 測試你的函式如何處理 API 回應（但不測 API）
- 讓測試跑得更快、更穩定
- API 還沒開發好，但你想先測你的邏輯

這時候才需要 mock，因為這種測試的目標是 **「測你的程式邏輯是否正確」**，而不是測 API。

---