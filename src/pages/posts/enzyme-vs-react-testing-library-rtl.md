---
public: true
layout: ../../layouts/BlogPost.astro
title: Enzyme vs React Testing Library (RTL)
createdAt: 1741707508104
updatedAt: 1742357501464
tags:
  - Testing
  - Javascript
  - Blog
heroImage: /placeholder-hero.png
slug: enzyme-vs-react-testing-library-rtl
---

# Enzyme vs React Testing Library (RTL) 差異比較

## 1. 設計理念

| 特性               | Enzyme                                 | React Testing Library (RTL)        |
| ---------------- | -------------------------------------- | ---------------------------------- |
| **測試方式**         | 偏向測試 **內部實作 (Implementation details)** | 偏向測試 **使用者行為 (User interactions)** |
| **測試目標**         | 可測試元件的 **內部狀態、方法、props**               | 主要關注 **畫面輸出 (DOM) 和使用者行為**         |
| **渲染方式**         | `shallow` (淺渲染) 和 `mount` (完整渲染)       | `render()` 直接掛載到 DOM               |
| **與 React 的相容性** | 需要額外適配新版本 React                        | 官方維護，與 React 版本同步                  |

***

## 2. API 和測試方式對比

### (1) 元件渲染方式

#### **Enzyme**

```jsx
import { shallow, mount } from 'enzyme';
import MyComponent from './MyComponent';

test('Enzyme 測試', () => {
  const wrapper = shallow(<MyComponent />);
  expect(wrapper.find('button').text()).toBe('Click me');
});
```

- `shallow(<MyComponent />)`: 只渲染 `MyComponent`，但不會渲染內部的子元件。
- `mount(<MyComponent />)`: 完整渲染 `MyComponent` 和所有子元件。

#### **React Testing Library**

```jsx
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('RTL 測試', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

- `render(<MyComponent />)`: 直接掛載整個元件到 DOM，像真實使用者一樣互動。
- `screen.getByRole('button')`: 透過 **語意化** 選取元素，而不是像 Enzyme 那樣直接 `.find('button')`。

***

### (2) 事件模擬

#### **Enzyme**

```jsx
test('按鈕點擊', () => {
  const wrapper = shallow(<MyComponent />);
  wrapper.find('button').simulate('click');
  expect(wrapper.find('.count').text()).toBe('1');
});
```

- `simulate('click')`：模擬點擊，但這種方式可能會因為沒有完全掛載元件而有副作用。

#### **React Testing Library**

```jsx
import userEvent from '@testing-library/user-event';

test('按鈕點擊', async () => {
  render(<MyComponent />);
  const button = screen.getByRole('button');
  await userEvent.click(button);
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

- `userEvent.click(button)`：模擬 **真實的瀏覽器行為**，更符合使用者操作方式。

***

## 3. Enzyme vs RTL 適用場景

| 適用情境                               | Enzyme      | React Testing Library |
| ---------------------------------- | ----------- | --------------------- |
| **測試內部邏輯** (state, props, methods) | ✅ 適合        | ❌ 不適合                 |
| **測試 UI 和互動** (DOM 渲染、按鈕點擊)        | ❌ 不推薦       | ✅ 更適合                 |
| **React Hooks 相容性**                | ❌ 需要額外適配    | ✅ 天然支援                |
| **React 18 支援**                    | 🚧 (官方不再更新) | ✅ 完全相容                |
| **學習曲線**                           | 📉 易上手      | 📈 需要適應               |

***

## 4. 結論

- **Enzyme** 偏向測試 **內部實作**，例如 `state` 和 `props`，但這種方式在 React 18 以後逐漸被淘汰。
- **React Testing Library** 偏向 **使用者體驗**，更符合現代 React 測試標準，因此 **官方推薦 RTL** 取代 Enzyme。

如果你的專案是新的，建議直接使用 **React Testing Library**，因為 Enzyme 已經不再更新，未來可能會有相容性問題。

