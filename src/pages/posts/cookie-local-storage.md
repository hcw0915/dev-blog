---
public: true
layout: ../../layouts/BlogPost.astro
title: Cookie & LocalStorage
createdAt: 1742228736901
updatedAt: 1742228902284
tags:
  - General
  - Blog
heroImage: /placeholder-hero.png
slug: cookie-local-storage
---

# [心得] Cookie LocalStorage SessionStorage

### 🌋 Cookie

由 `Server Side` 產生內容, 發送給瀏覽器並且保存, 瀏覽器會自動協助在後續每個請求都帶上 `cookie`, 發送回 `Server`.
因為是會被來回傳遞的, 所以是可以傳輸 Session, 身份驗證, 以及跟蹤使用者設定或行為等等.

#### 優點：

- 在瀏覽器和 Server 之間來回傳遞, 適用於跟蹤用戶行為.
- 可以手動設置過期時間, 靈活調節.

#### 缺點：

- 每次都會攜帶 cookie 資訊, 增加傳輸流量.
- 明文傳輸, 安全性低
- 容量小, `4KB`

---

### 🌋 LocalStorage

Web API 允許數據以 K-V 方式儲存,

#### 優點：

- 容量較大, `5MB`
- 數據可存在 `Client Side`, 並且永久保存, 不因為關閉瀏覽器而消失.
- 可以透過 `API` 在 `JavaScript` 裡面操作.

#### 缺點：

- 同個網站只能訪問自己網域的 LocalStorage (同源)
- 不支持在不同瀏覽器之間共享數據

---

### 🌋 Session Storage

#### 優點：

- 數據只存在於 `Client Side`.
- 刷新頁面仍然會有原來的 `Session`.
- 每個瀏覽器 Tab / 窗口間數據相互獨立
- 可以透過 `API` 在 `JavaScript` 裡面操作.

#### 缺點：

- 不適合長期儲存.
- 數據不共享, 使用場景有限. (e.g. 多步驟表單, 可以暫時保存表格資訊使用者可以點選上一步/下一步, 修改數據)

---

### 🌋 共通點

都保存在 Client side, 且不支持跨域.

### 🌋 不同點

|                       |       Cookie       |   Local Storage    |  Session Storage   |
| --------------------- | :----------------: | :----------------: | :----------------: |
| 內容是否發送到 Server |  每次請求都會發回  |      只在本地      |      只在本地      |
| 容量大小              |        4KB         |        5MB         |        5MB         |
| 數據有效期限          |  自行設定失效時間  |      永久有效      | 關閉瀏覽器之前有效 |
| 作用域                | 同源同窗口是共享的 | 同源同窗口是共享的 |   不同窗口不共享   |
