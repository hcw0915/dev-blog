---
public: true
slug: pwa-start-inline-script
layout: ../../layouts/BlogPost.astro
title: SSR 寫入、瀏覽器執行：PWA 啟動中轉頁的內聯腳本做法
createdAt: 1794464367623
updatedAt: 1794464367623
tags:
  - General
heroImage: /placeholder-hero.png
---

> 一支只活零點幾秒的頁面，被 Service Worker 永久快取、被 CDN 快取，還得每次都做出最新的判斷。這篇記錄它最後的寫法：**伺服器把腳本寫進 HTML，瀏覽器讀到就執行。**

## 這支頁面在做什麼

PWA 從桌面圖示打開時，第一個載入的是 Manifest 的 `start_url`。我們把它指向一個「啟動中轉頁」`/pwa/start`，它幾乎不顯示內容，只做三件事：

1. 記錄啟動方式（standalone 還是 browser），寫進 `localStorage` 並用 `BroadcastChannel` 通知落地頁做統計
2. 向後端問出目前可用的站點
3. 帶著參數跳轉過去

麻煩在環境的兩個限制：

- **Service Worker**：同網域的主站有自己的 SW，網址含 `/pwa/start` 的請求一律 Cache-First，第一次之後永遠回放快取的 HTML。
- **CDN**：邊緣也會快取 HTML 幾分鐘，所以 SSR 輸出不能依 cookie、UA 或其他 query 分支。

換句話說，**這份 HTML 一旦送出去，就要假設它永遠不會再變。**

## 做法：伺服器寫腳本，瀏覽器執行腳本

跳轉邏輯寫成一個普通的 TypeScript 函式，SSR 時把它的原始碼轉成字串，接上序列化好的參數，內聯進 `<head>`：

```ts
// 一般的函式：可以 import 進單元測試、有型別檢查與 lint
export function redirectPwaStart(fallbackHost: string, hostApi: string, timeoutMs: number) {
  // 只能用參數與瀏覽器全域物件，不能引用任何模組變數
}

// 頁面元件
if (import.meta.server) {
  const args = [fallbackHost, hostApi, 1500].map(v => JSON.stringify(v)).join(", ")
  useHead({
    script: [{ children: `(${redirectPwaStart.toString()})(${args});` }],
  })
}
```

輸出的 HTML 長這樣：

```html
<script>(function redirectPwaStart(fallbackHost, hostApi, timeoutMs) { ... })("", "/api/abc", 1500);</script>
```

瀏覽器解析到這段 `<script>` 就立刻執行，這時框架和 bundle 都還沒載入。

關鍵是分清楚誰在做什麼：**伺服器端那段程式沒有發出任何請求**，它只是產生「瀏覽器之後要執行的程式文字」。像是寫一張紙條夾進 HTML，真正的 `fetch` 和跳轉都發生在瀏覽器。

## 每個繞路都對應一個限制

| 選擇 | 不這樣做會怎樣 |
|---|---|
| 內聯，不用 `<script src>` | 舊 HTML 指向已不存在的 JS 檔，白屏 |
| 不放進 `onMounted` | 要等 bundle 與 hydration，慢，也一樣可能載不到 |
| 參數在 SSR 時填 | 瀏覽器拿不到只有伺服器知道的值 |
| 用 `toString()` 產生腳本 | 手寫字串無法測試、沒有型別檢查 |
| 只在伺服器端產生 | 參數算錯，或腳本執行兩次 |

### 內聯：HTML 在，腳本就在

- **SW 凍結 HTML**：外部 JS 的 hash 檔名每次部署都會變，被凍結的舊 HTML 指向已經不存在的檔案，腳本載不到就是白屏。
- **主網域連不上時**：外部 JS 一樣載不到。
- **內聯之後**：腳本和 HTML 是同一份，HTML 在就能跑，還省一次請求。

`onMounted` 也是同樣的問題，而且還要多等 bundle 下載與 hydration。

### SSR 填參數：只放不會變的值

- 腳本需要只有伺服器知道的值，例如依網域決定的 API 路徑。
- 這個值只隨網域變化，不隨使用者變化，所以放進會被快取的 HTML 是安全的。

### `toString()`：能測試，但有兩條限制

好處是函式可以被單元測試 import（這支有 30 多個測試），也有型別檢查。代價是：

- **不能引用閉包或模組變數**：內聯之後外層作用域不存在，一引用就 `ReferenceError`。有一個測試專門把 `toString()` 的結果丟進 `new Function()` 執行，鎖住這條限制。
- **語法要保守**：這段程式不經過 bundler 的瀏覽器端降級，直接在舊手機瀏覽器上跑，所以刻意不用可選鏈 `?.` 這類較新的語法。

### 只在伺服器端產生：避免算錯與跑兩次

- **算錯**：參數要靠請求標頭才算得出來，客戶端算會錯。
- **跑兩次**：hydration 時 head 管理器可能再插一次 `<script>`，結果是重複請求、重複跳轉。

> 參數如果可能含使用者輸入，`JSON.stringify` 之後還要把 `<` 轉成 `<`，否則 `</script>` 會提早結束標籤。這裡的參數都是伺服器端常數，所以沒有這個風險。

## 演進：從「寫死答案」到「寫下問法」

**最初的版本**：SSR 時伺服器自己呼叫後端選好站點，把答案寫進參數，例如 `})("https://site-a.example.com")`。瀏覽器只是照著跳。

問題是 HTML 被 SW 凍結以後，站點永遠是第一次選到的那個，後台換站也沒用。

**第一版修正**：SSR 不再選站，腳本改成去問我們自己的伺服器代理（`GET /pwa/api/host`）。當時以為瀏覽器連不到後端。

**第二版**：實測發現後端本來就有公開、不需簽章的介面，主站前端也是直接呼叫。於是拿掉代理，把選站規則（依渠道過濾、沒有符合的就取第一筆、補上 `https://`）原樣搬進腳本。HTML 裡只剩一個依網域決定、不會變的路徑。

最後的原則是**不快取、不寫死**：

- 請求用 `POST` 加 `cache: 'no-store'`，網址刻意不含 `/pwa/start`，避開 SW 的 Cache-First 規則
- HTML 裡不放任何會變的值
- 逾時 1.5 秒；失敗時依序退回 `localStorage` 裡上次的站點，再退回同源首頁

代價是啟動多一次請求，實測約 0.2 秒。

## 順帶發現

### 同網域多個 Manifest，要注意 `id`

主站的 manifest 和落地頁的 manifest 用了同一個 `id`（`"/"`）。PWA 第一次打開、跳進主站之後，桌面版 Chrome 把主站的 manifest 當成同一個 App 的更新，把 `start_url` 改成主站頁面，之後從圖示啟動就不再經過中轉頁。

同一個網域下有多個 manifest 時，`id` 要分開，不然 Chrome 會把它們當成同一個 App。

### 怎麼觀察一支零點幾秒就跳走的頁面

DevTools 來不及接上，Network 面板什麼都看不到。兩個做法：

- Chrome 加 `--remote-debugging-port` 啟動，從外部用 CDP（`Target.setAutoAttach` + `Network.enable`）錄下所有請求
- 先開一個空白分頁讓 DevTools 接上，勾選 Preserve log，再導向啟動頁

## 結論

當一份 HTML 會被永久快取，能放進去的只有「不會變的東西」。站點會變，所以不能寫答案，只能寫問法：伺服器寫下怎麼問、往哪問，瀏覽器每次啟動自己去問。

`toString()` 內聯讓這段程式既能在 HTML 裡獨立執行，又能像一般程式碼一樣被測試，只要守住「不引用外部變數、語法夠保守」這兩條。
