---
public: true
layout: ../../layouts/BlogPost.astro
title: React unstyled component
createdAt: 1742278455845
updatedAt: 1742278480706
tags:
  - React
  - Typescript
  - Blog
heroImage: /placeholder-hero.png
slug: react-unstyled-component
---

# [筆記] React unstyled Component

> https://www.youtube.com/watch?v=9iJK-Vl6PhE

對於 component 的 coding 方式各式各樣, 但是大多都是依照需求面去做 props 的外丟
但是這個過程取決於一項因素就是 UI/UX 專案整體風格的導引,

對於有 UI 庫(例如 `mui`, `bootstrap`), 都會有數項 `variant`, `type`, `size` 這類已經規範定好基礎規格 (顏色, 尺寸), 大多數限於不同規格的共用與強烈的設計規範.

但是實際情況卻是, 特定人士或是特定場景, 對按鈕或是組件有特殊需求.
同時 atomic css 在 React 的流行, 讓 unStyledComponent 是一種可以自由傳入 css 進入組件的內容

---

### 🌋 正常情況的 component

```tsx
export default function Button({
  isLoading,
  children,
  color
}: {
  isLoading: boolean;
  children: ReactNode;
  color: 'blue' | 'yellow'
}) {
  const classNames = {
    yellow: 'relative group rounded bg-amber-400 px-5 py-2 font-medium text-black'
    blue: 'relative group rounded bg-sky-400 px-5 py-2 font-medium text-white'
  }
  return (
    <button
      className={classNames[color]}
      type="submit"
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          // 任何一個 spinner 組件
          <Spinner />
        </span>
      )}
      <span className={isLoading ? "invisible" : ""}>{children}</span>
    </button>
  );
}
```

> 🌋 實際使用

```typescript
<Button color="blue" isLoading={isLoading}>
  Sign up today!
</Button>
```

在這段 components 裡面可以看到 對於狀態與顏色可以 handle, 但是對於按鈕的其他內容卻保持著封閉狀態，目前只有 yellow, blue 兩種顏色, 意味著今天有多一個紅色按鈕, 我就必須在這裡修改組件內的物件.
使用上沒什麼太大問題, 但是卻使用似乎不是那麼便利也不夠開放, 唯一優點就是畫面簡潔.

---

### 🌋 UnstyledComponent

```typescript
export default function LoadingButton({
  isLoading,
  children,
  className
  ...rest
}: {
  isLoading: boolean;
  children: ReactNode;
  className: string;
} & ComponentProps<"button">) {
  return (
    // 此處 relative 是為了讓 spinner 可以保持在組件的正中央 且寬度因為 inset-0 撐開保持與 button 所佔有的字空間等寬
    <button className={`${className} relative`} type="submit">
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          // 任何一個 spinner 組件
          <Spinner />
        </span>
      )}
      <span className={isLoading ? "invisible" : ""}>{children}</span>
    </button>
  );
}
```

> 🌋 實際使用

```typescript
<LoadingButton
  className="group rounded bg-amber-400 px-5 py-2 font-medium text-black"
  isLoading={isLoading}
  type="submit"
>
  Sign up today!
</LoadingButton>
```

對於 unStyled 寫法, 做到了幾點

- 對於按鈕作用目的性更明確 (LoadingButton)
- 開放式的 className 讓使用者不受規範限制開發 (但是如果專案有強規範與導引, 前者是比較好的做法)
- 對於顏色或是其他 css 相關屬性基本上可以全部由使用組件的位置去傳入, 不需要再修改 Button 組件.
- 比起前者, 維護者可以更好觀察的 css 樣式, 不需要再點入組件閱讀.

但是缺點就是敘述較冗長一點

---

基本上還是需要看需求跟團隊所注重的點, 規範 or 彈性？
但其實也可以混合使用在不同地方, 並非一個強規範.