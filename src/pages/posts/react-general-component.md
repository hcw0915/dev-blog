---
public: true
layout: ../../layouts/BlogPost.astro
title: React General Component
createdAt: 1742278374514
updatedAt: 1742278398552
tags:
  - React
  - Typescript
  - Blog
heroImage: /placeholder-hero.png
slug: react-general-component
---

# [筆記] React General Component

```typescript!
// Typing Props
interface NameButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  name?: string;
}

const NameButton = ({ name = "World", ...props }: NameButtonProps) => {
  return <button {...props}>Hello, {name}!</button>;
};

const Page = () => {
  return <NameButton name="James" />;
};
```

可以把特定 `React.ComponentPropsWithoutRef<"button">` 擴展給 `NameButtonProps`
拿到對應 element 的屬性

避免用一個綁一個, 造成複用組件的低可靠性

```typescript
// Typing Props
interface NameButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  name?: string;
  onClick?: React.ComponentProps<"button">["onClick"];
}

const NameButton = ({ name = "World", onClick, ...props }: NameButtonProps) => {
  return (
    <button onClick={onClick} {...props}>
      Hello, {name}!
    </button>
  );
};

const Page = () => {
  return <NameButton name="James" />;
};
```

利用 `React.ComponentProps<"button">["onClick"];` 將刻意寫出來的 `onClick` 納入組件型別管制

```typescript
// Typing Props
interface NameButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  name?: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

const NameButton = ({ name = "World", ...props }: NameButtonProps) => {
  return (
    <button {...props}>
      <props.icon className="h-4 w-4" />
      Hello, {name}!
    </button>
  );
};

const Page = () => {
  return <NameButton icon={XXX} name="James" />;
};
```