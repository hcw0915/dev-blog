---
public: true
layout: ../../layouts/BlogPost.astro
title: TS React Hook Form 推斷表單型別
createdAt: 1742278591205
updatedAt: 1742278611171
tags:
  - React
  - Typescript
  - Blog
heroImage: /placeholder-hero.png
slug: ts-react-hook-form
---
# [筆記] TS React Hook Form 推斷表單型別

對於主要表單操作型別整合做一個簡單的筆記

### 🌋 統一管理 表單驗證規則 以及相關型別內容

- `FormValues`: 是表單的項次代號
- `FormBaseTypes`: 是表單的基礎型別
  基礎型別包含了 `input` 的 `type` 內建型別 (主要透過 `JSX.IntrinsicElements["input"]["type"]` 來推斷, `HTMLInputElement["type"]` 給出的型別是 `string`)
- `validationConfig` 是表單驗證規則配置

```typescript
import React from "react";
import { type RegisterOptions, useForm } from "react-hook-form";

type FormValues = {
  username: string;
  email: string;
  isMarried: string;
};

type FormBaseTypes = {
  title?: string;
  type?: JSX.IntrinsicElements["input"]["type"];
};

const validationConfig: Record<
  keyof FormValues,
  FormBaseTypes & RegisterOptions<FormValues>
> = {
  username: {
    title: "用戶名",
    type: "text",
    required: "用戶名是必填的",
  },
  email: {
    title: "電子郵件",
    type: "email",
    required: "電子郵件是必填的",
    pattern: {
      value: /^[^@]+@[^@]+\.[^@]+$/,
      message: "無效的電子郵件格式",
    },
  },
  isMarried: {
    title: "是否已婚",
    type: "checkbox",
  },
};

const Page = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    console.log("表單資料：", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {Object.entries(validationConfig).map(([key, formField], idx) => {
        // 這裡暫時無法避免用 as, 因為無法直接推斷出 key 的型別
        const typedKey = key as keyof FormValues;
        return (
          <div key={idx}>
            <label>{formField.title}</label>
            <input
              type={formField.type}
              {...register(typedKey, validationConfig[typedKey])}
            />
            {errors[typedKey] ? <p>{errors[typedKey]?.message}</p> : null}
          </div>
        );
      })}

      <button type="submit">提交</button>
    </form>
  );
};

export default Page;
```