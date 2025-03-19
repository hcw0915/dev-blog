---
public: true
layout: ../../layouts/BlogPost.astro
title: 前端測試指南-策略與實踐 (Chapter 1)
createdAt: 1741319042769
updatedAt: 1742357485374
tags:
  - Javascript
  - Testing
  - Blog
heroImage: /placeholder-hero.png
slug: chapter-1
---

![clipboard.png](/posts/chapter-1_clipboard-png.png)

- Unit Tests：針對最小範圍進行邏輯驗證
- Integration Tests：驗證特定功能
- End-to-End Test：驗證操作流程

---
### 🔍 Unit Tests Demo
主要驗證 `function`, `method`, `class instance` 程式碼最小單元功能確保獨立運作, 讓 input, output 可以符合預期.
```js
const divideNumbers = (num, den) => {
  if (den === 0) {
    throw new Error('CAN NOT DIVIDE BY ZERO!!')
  }
  return num / den
} 
```

關於 `divideNumbers` 可能有下列四種:
- 兩數整除 => 得一整數
- 兩數不整 => 得一小數
- 分子為零 => 得 0
- 分母為零 => 錯誤訊息

所以測試實例應該涵蓋上述四種狀況
```js
// example: 兩數整除, 得到一個整數
it('should return the correct integer when dividing two integers that are divisible.', ...)
```
---
### 🔍 Integeration Tests Demo
主要針對「合併的程式碼」做測試, 包含整合元件/套件等等, 以及取得整合元件正確協同運作, 在實際操作中獲得預期成果.

```js
const HelloWorld = () => {
  const [msg, setMsg] = useState('')
  
  return (
    <div>
      <button 
        data-test-id="show-message-button"
        onClick={() => setMsg('Hello World!')}
      >
        Click!
      </button>
      <Text data-test-id="message">{message}</Text>
    </div>
  )
}
```

```js
it('...', () => {
  const { getByTestId } = render(<HelloWorld />)
                                 
  // 點擊按鈕
  fireEvent.click(getByTestId('show-message-button'))
  
  // 檢視的顯示訊息是否符合預期
  expect(getByTestId('message')).toHaveTextContent("Hello World!")
})
```

此例整合 `<HelloWorld>`, `<Text>` 兩個組件的點擊與顯示訊息的流程. 

---

## 🔍 End-to-End Test
模擬使用者操作流程去測試整個網站的內容, 是否符合實際情境使用. 

## 🔍 Visual Test
是一種自動化測試方法，主要用來檢查應用程式的 UI 是否在不同版本或不同環境中保持一致。它通常用於 **偵測 UI 變更**，防止無意間的視覺錯誤，例如：

- **排版錯誤**（字體、顏色、間距變化）
- **元件錯位**（按鈕、圖標、圖像的位置）
- **跨瀏覽器或裝置的 UI 差異**
- **意外變更**（因 CSS、JavaScript 變更導致的 UI 問題）

視覺測試的核心是「**快照比對**」，常見的方法有：

1️⃣ **像素對比（Pixel-by-Pixel）**：
- 比較兩張相同畫面（Baseline vs. Latest）的像素差異
- 適合簡單 UI，但對於小變化（如陰影、字體渲染）較敏感

2️⃣ **DOM/樣式分析（DOM Snapshot）**：
- 分析 HTML 結構與 CSS 樣式變更
- 避免小像素變動導致的誤報，但可能忽略一些視覺異常

--- 

| 測試類型 | 說明 | 優點 | 缺點 | 適用時機 |
|-----------|------------|------------|------------|------------|
| **單元測試（Unit Test）** | 測試單一函式、元件或模組的行為，確保其獨立運作正常。 | - 快速執行，容易維護 <br> - 針對特定功能測試，問題易於定位 | - 無法測試元件之間的互動 <br> - 可能無法捕捉 UI 錯誤 | - 測試邏輯函式（如計算、資料處理） <br> - 測試 React/Vue 等 UI 元件（例如 `Jest + React Testing Library`） |
| **整合測試（Integration Test）** | 測試多個模組如何互動，例如 API 服務與資料庫的連結。 | - 能檢測不同模組之間的問題 <br> - 確保 API、前端、資料庫的協同運作 | - 比單元測試慢 <br> - 需要模擬資料或 API 回應（Mocking） | - 測試 API 的請求與回應 <br> - 確保後端與前端能正確溝通 |
| **端對端測試（E2E Test）** | 測試整個應用的運作，模擬使用者行為（如登入、操作 UI）。 | - 真實模擬使用者操作 <br> - 確保所有系統部分正常運作 | - 執行速度較慢 <br> - 容易受 UI 變動影響，維護成本高 | - 測試完整用戶流程（例如 **Cypress、Playwright、Selenium**） <br> - 交易流程（如結帳、購物車） |
| **視覺測試（Visual Test）** | 透過快照比對 UI 畫面，檢查視覺變更是否符合預期。 | - 偵測 UI 變更，防止視覺錯誤 <br> - 適用於多瀏覽器測試 | - 容易受到小變化（如字型、陰影）的影響 <br> - 可能產生誤報 | - 測試 UI 是否有無意間的變更 <br> - 適合使用 **Chromatic、Applitools、Percy** |


---

#### 🔍 GWT (Given-When-Then)
測試命名模式, 確保 test case 清晰度與一致性

- Given: 測試的前置條件, 測試前所需要的初始狀態 (prepare)
- When: 描述測試特定行為與步驟, 測試事件操作, 觸發測試的階段
- Then: 結果驗證, 確認是否符合預期

#### 🔍 it should
直接指名測試條件與預期結果
```js
describe('', ()=>{
  it('should return 3 when 1 + 2')
})
```

#### 🔍 3A (Arrange/Act/Assert)
對應到 Given-When-Then 的三個階段
- 清晰好讀, 流程容易理解
- 明確分層部分撰寫
- 統一結構, 風格一致



> **重點**： 清楚表達測試目的, 要做什麼, 預期結果

---

## 🔍 Mock Spy Double
用於模擬, 監視, 替代真實物件, 以便進行測試

#### 🔍 Mock
模擬替代目標元件/第三方套件/函式庫, 以及 API 回應的物件或函式
> 允許開發者在不需要實際依賴的情況下, 對程式碼的一部分進行測試, 專注於測試中的特定功能或行為

利用 `jest.mock` 模擬指定路徑下的元件與內容, 後續只要遇到 `<MyComponent>` 都會以 `<div>Hello World!</div>` 取代之.


```js
// 書內案例
jest.mock('./src/MyComponent', () => <div>Hello World!</div>)
```

[Jest](https://jestjs.io/docs/mock-functions)
```js
// foo-bar-baz.js
export const foo = 'foo';
export const bar = () => 'bar';
export default () => 'baz';

//test.js
import defaultExport, {bar, foo} from '../foo-bar-baz';

jest.mock('../foo-bar-baz', () => {
  const originalModule = jest.requireActual('../foo-bar-baz');

  // Mock the default export and named export 'foo'
  return {
    __esModule: true, // 讓 jest 知道這是 ESM
    ...originalModule, // 把原有的內容 spread 進去
    default: jest.fn(() => 'mocked baz'), // 取代 模組 default 的內容
    foo: 'mocked foo', // 取代 {foo} 的內容
  };
});

test('should do a partial mock', () => {
  const defaultExportResult = defaultExport();
  expect(defaultExportResult).toBe('mocked baz'); // default 執行結果被修改為 'mocked baz'
  expect(defaultExport).toHaveBeenCalled(); // 確認有被呼叫

  expect(foo).toBe('mocked foo'); // foo 被修改為 mocked foo
  expect(bar()).toBe('bar'); // 沒有對 bar 處理事情
});
```

---

#### 🔍 Spy
監視目標物件行為並記錄相關方法/參數/回傳值的物件, 過程不影響原有行為

```js
it('should clean up the timer when unmount', () => {
  // 解構出 unmount 方法模擬 Timer 卸載
  const { unmount } = render(<Timer>) 
  // 監視全域(global)的 clearInterval 有沒有被 Timer 調用過
  const spyOnClearInterval = jest.spyOn(global, 'clearInterval'); 
  // 卸載組件 => 會觸發 clearInterval 被調用
  unmount()
  
  // 針對被調用結果寫 Assert 斷言
  expect(spyOnClearInterval).toHaveBeenCalledTimes(1);
})
```

```js
const obj = {
  foo: (x) => x + 1,
};

test('jest.spyOn() example', () => {
  // 使用 spy 監視 obj.foo 方法
  const spy = jest.spyOn(obj, 'foo');

  // 調用 obj.foo 方法
  obj.foo(1);
  
  // 驗證 obj.foo 是否被調用過
  expect(spy).toHaveBeenCalled();
  expect(spy).toHaveBeenCalledWith(1); // 應該傳入 1 作為參數

  // 確保 spy 被呼叫後，會執行原本的方法
  expect(obj.foo(1)).toBe(2); // foo(1) 應該返回 2
});
```

---

#### 🔍 Double
在測試中，"double" 是指「模擬對象」（Test Double）的概念。Test Double 是測試中用來替代實際對象的物件，通常是為了測試的目的而創建的，它可以模擬某些對象的行為或狀態。

```js
// Dummy: 只是一個佔位符，通常不會被使用
const dummy = new Object(); // 只是填充，不會使用到的對象

// Fake: 一個簡單的替代實現，它的行為與真實對象相似
const fakeDatabase = {
  save: jest.fn(() => 'data saved'), // 一個假的數據庫方法
};

// Stubs: 會提供某些預設的行為，通常用來讓測試的控制更精確
const stub = jest.fn().mockReturnValue('stubbed result');
console.log(stub()); // 輸出 "stubbed result"

// Spies: 跟踪對象的函數調用，並記錄它的調用細節（比如調用了幾次，傳遞了哪些參數）。
...

// Mocks: 模擬對象的行為，並允許你定制其行為。這與 spy 類似，但提供更多功能。
...
```