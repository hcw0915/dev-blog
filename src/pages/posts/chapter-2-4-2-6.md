---
public: true
layout: ../../layouts/BlogPost.astro
title: 前端測試指南 - 策略與實踐 (Chapter 2-4 ~ 2~6)
createdAt: 1742050081131
updatedAt: 1744167745360
tags:
  - Testing
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: chapter-2-4-2-6
---

### 測試實作 / 測試行為

以 `<Counter />` 組件去顯示時

實作部分, 通常代表 `increment` `decrement` 的行為差異
確保 `+1` `-1` 的實作正確無誤.

行為部分, 著重在 `{count}` 變數在畫面上的數值變化是否如預期

```js
import React, { Component } from "react";

class Counter extends Component {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  decrement = () => {
    this.setState({ count: this.state.count - 1 });
  };

  render() {
    return (
      <div>
        <h2>Class Counter</h2>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    );
  }
}

export default Counter;
```

```js
import React, { useState } from "react";

const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Function Counter</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
};

export default Counter;
```

可以透過 `class` 寫出的實作測試, 接續做出 `function` 的重構

---

商業邏輯與資料的分離是 `function components` 的好處, 將特定業務邏輯分離成 custom hooks, 並將畫面顯示的部份留給 UI 組件, 這同時也是現在流行的測試方式

React Testing Library 測試行為的做法會比 Enzyme 著重於測試實作的方式來得更主流

---

## **React Testing Library vs. Enzyme**

✅ **React Testing Library（行為導向測試）**

- 測試「使用者行為」，例如點擊按鈕後 UI 變化，而非測試內部實作。
- 不依賴內部狀態（如 `setState` 或 `props`），所以測試更接近真實使用情境。

✅ **Enzyme（實作導向測試）**

- 允許測試組件內部的 `state`、`props`，但這容易讓測試依賴內部實作，導致組件變更時測試容易失效。
- 目前官方已停止 Enzyme 的支援，且它不完全支援 React 18。

🔹 **結論**

- **現在主流測試方式是 React Testing Library**，因為它更關注「行為測試」，符合「測試應該像用戶使用應用程式一樣」的理念。
- **Enzyme 雖然靈活，但過於關注內部實作，且支援逐漸減少，未來可能會被淘汰。**

---

### 淺渲染 (shallow rendering)

元件渲染方式, 只對元件本身渲染

- **加快測試速度**: 由於只渲染單一組件，而不渲染子組件，所以測試執行得更快。
- **避免子組件影響測試**: 只關心當前組件的行為，避免子組件的變更影響測試結果。
- **測試組件的輸入/輸出**: 適合測試 **組件的 props 是否正確傳遞**，而不關心其內部實作。

#### **為什麼不推薦使用淺渲染？**

- **無法測試真實行為**: 只測試組件結構，而**不測試實際使用情境**，可能導致無法發現真實問題。
- **依賴內部實作**: `shallow` 測試組件內部的 JSX 結構，如果組件結構改變，測試可能就會失敗，這讓測試更脆弱。
- **React Testing Library 不支援**: React 官方推崇 **行為測試**，而不是測試組件內部結構。**React Testing Library 不支援 `shallow`，因為它強調測試應該模擬真實使用者行為**。

> [!WARNING]
> react-test-renderer 已經暫停維護了
> [`@testing-library/react`](https://testing-library.com/docs/react-testing-library/intro) 目前主要使用這個
> ![clipboard.png](/posts/chapter-2-4-2-6_14.png)
> [Migrate from Enzyme | Testing Library](https://testing-library.com/docs/react-testing-library/migrate-from-enzyme/#how-to-shallow-render-a-component)
> RTL 說明盡可能避免如果真的需要則使用 `jest.mock` 做模擬。

---

### 完全渲染 (full rendering)

顧名思義, 目的是可以測試組件的完整行為, 但會增加測試的複雜度, 適合 integration tests.

```js: full rendering
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders MyComponent with all state and effects', () => {
  render(<MyComponent />);

  // 假設 MyComponent 包含一個按鈕，點擊它會改變顯示的文本
  const button = screen.getByRole('button');
  const text = screen.getByText(/hello world/i);

  expect(text).toBeInTheDocument(); // 初次渲染文本
  button.click();

  const updatedText = screen.getByText(/goodbye world/i);
  expect(updatedText).toBeInTheDocument(); // 渲染後的文本

  // 這就是一次完整的渲染過程，涵蓋了狀態改變、事件觸發及更新
});
```

### **Full Rendering vs Shallow Rendering 的比較**

| 特點             | **Full Rendering**                                         | **Shallow Rendering**                        |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------- |
| **渲染的深度**   | 渲染組件及所有子組件                                       | 只渲染組件本身，子組件不會被渲染             |
| **副作用執行**   | 執行所有副作用（例如 `useEffect`、`componentDidMount` 等） | 不會執行子組件的副作用                       |
| **渲染真實 DOM** | 渲染到真實的 DOM 中，可以進行交互                          | 不會將子組件渲染到 DOM 中，僅是虛擬 DOM 渲染 |
| **測試範圍**     | 測試組件的所有行為及其與子組件的交互                       | 測試組件本身的行為，不測試子組件的行為       |
| **測試速度**     | 較慢，因為需要渲染整個組件樹                               | 較快，因為只渲染組件本身                     |
| **測試場景**     | 測試組件與其子組件的協作及交互，適合集成測試               | 測試組件的邏輯、方法和狀態，適合單元測試     |
