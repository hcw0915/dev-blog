---
public: true
slug: document-title-mutation-observer-loop
layout: ../../layouts/BlogPost.astro
title: document.title 讀寫不對稱：一個雙空格讓 MutationObserver 卡死頁面
createdAt: 1791370428714
updatedAt: 1791370428714
tags:
  - General
  - Blog
heroImage: /placeholder-hero.png
---

> 某個頁面只在英文語系下會讓 Chrome 跳出「網頁沒有回應」，其他語系完全正常。原因是兩個各自合理的瀏覽器行為疊在一起：`document.title` 寫進去的是原字串，讀出來的卻是折疊過空白的版本；而對 `document.title` 賦值，在 DOM 層算的是 `childList` 變動。一個「標題被改掉就寫回去」的 MutationObserver，碰上 i18n 插值留下的雙空格，就變成永遠收斂不了的迴圈。這篇記錄排查過程、規格依據、一個可以直接跑的最小重現，以及修法為什麼放在字串而不是翻譯檔。

> [!NOTE]
> 作者說明：排查時我和 AI 助手一起追，前兩個錯誤方向是在「locale 必現」這條線索還沒被納入時走的。文中的模板數量來自當時盤點的英文翻譯檔；規格引文與重現結果都是寫這篇時重新核對、實際跑過的。

## 一、症狀：只有一個語系會卡死

使用者回報：打開某一類內容頁，Chrome 跳出「網頁沒有回應」的對話框。這個對話框代表主執行緒被同步工作佔住太久，不是頁面崩潰，也不是網路慢。

最關鍵的觀察是**語系必現**：

| 網址 | 結果 |
|---|---|
| `/en/<頁面>` | 卡死 |
| `/<頁面>`（預設語系） | 正常 |

同一個頁面、同一份前端程式碼，只差語系。

## 二、兩個錯誤方向

**第一輪：當成伺服器端問題。** 一開始把截圖讀成「頁面壞掉」，於是往 SSR 那一側找：站台設定的動態載入有沒有包 try/catch、爬蟲與一般使用者兩條路徑的 Server Component 樹是否不同而造成 hydration mismatch、快取 key 會不會讓快取被污染。這些都跟實際問題無關。

確認是「沒有回應」而不是「崩潰」之後，範圍才縮到**客戶端主執行緒被卡住**。

**第二輪：懷疑大型 iframe。** 那類頁面會用 `srcdoc` 內嵌一份第三方 HTML，體積可能到數 MB；同源的 srcdoc iframe 和父頁共用主執行緒，對方同步初始化太久確實可能卡住。方向聽起來合理，但它同樣解釋不了「為什麼只有英文會卡」。

真正收斂的轉折，是把注意力放回 locale 必現，再對照頁面裡一段看起來無害的程式碼：設定標題、然後用 MutationObserver 守住它。

## 三、那段「守住標題」的程式碼

頁面元件掛載時會做這件事（已簡化，名稱經過改寫）：

```ts
const targetTitle = t("seo.page-title", {
  appName: site.appName,
  location: site.location ?? "",
  provider: item.provider ?? "",
});
document.title = targetTitle;

const observer = new MutationObserver(() => {
  if (document.title !== targetTitle) document.title = targetTitle;
});
observer.observe(document.head, {
  childList: true,
  subtree: true,
  characterData: true,
});
```

意圖很清楚：`<head>` 裡有其他東西（框架的 metadata 更新、動態載入的模組、開發時的 HMR）可能把標題改掉，觀察到變動就寫回去。`if` 那行看起來是防止重複寫入的保險。問題就出在這個保險永遠不會生效。

## 四、事實 A：插值留下雙空格

英文的標題模板大致長這樣：

```
"{appName} {location} | 頁面標題..."
```

當站台設定沒有填 `location`，`?? ""` 讓它變成空字串，插值結果就是：

```
"站名  | 頁面標題..."   ← 站名後面兩個空格
```

預設語系的模板剛好寫成 `"{appName} {location}| ..."`，`|` 前面沒有空格，所以 `location` 為空時只會留下一個空格。**它不會出事純屬運氣**，不是誰刻意處理過。

## 五、事實 B：`document.title` 讀寫不對稱

WHATWG HTML 規範裡，[`document.title` 的 getter](https://html.spec.whatwg.org/multipage/dom.html#document.title) 是這樣定義的（HTML 文件的情況）：

> 2. Otherwise, let *value* be the child text content of the title element, or the empty string if the title element is null.
> 3. [Strip and collapse ASCII whitespace](https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace) in *value*.
> 4. Return *value*.

而 Infra 規範對這個步驟的定義是：

> To strip and collapse ASCII whitespace in a string, replace any sequence of one or more consecutive code points that are ASCII whitespace in the string with a single U+0020 SPACE code point, and then remove any leading and trailing ASCII whitespace from that string.

setter 則沒有任何正規化，找到（或建立）`<title>` 之後直接：

> String replace all with the given value within element.

也就是說：

```js
document.title = "站名  | 頁面標題";
document.title; // "站名 | 頁面標題"  ← 讀回來只剩一個空格
```

`<title>` 裡實際存的是兩個空格的原字串，只有透過 getter 讀出來時才被折疊。所以 `document.title !== targetTitle` 在雙空格時**永遠成立**，不管寫回去幾次。

## 六、事實 C：賦值算的是 `childList`，不是 `characterData`

直覺上「改標題文字」應該是 `characterData` 變動，但規格不是這樣走的。上面 setter 用的 [string replace all](https://dom.spec.whatwg.org/#string-replace-all)，在 DOM 規範裡是：

> 1. Let *node* be null.
> 2. If *string* is not the empty string, then set *node* to the result of creating a text node given *parent*'s node document and *string*.
> 3. Replace all with *node* within *parent*.

而 [replace all](https://dom.spec.whatwg.org/#concept-node-replace-all) 的最後一步是：

> If either *addedNodes* or *removedNodes* is not empty, then queue a tree mutation record for *parent* with *addedNodes*, *removedNodes*, null, and null.

tree mutation record 的型別就是 `childList`。換句話說，`document.title = X`（以及 `el.textContent = X`）是「移除舊的 Text 節點、插入一個新的 Text 節點」，而不是修改既有 Text 節點的 `.data`。

我在 Chrome 裡直接驗證過：觀察 `<head>`、設一次標題、用 `takeRecords()` 取出紀錄，得到的是

```json
[{ "type": "childList", "target": "TITLE", "added": 1, "removed": 1 }]
```

三個 flag 在這個情境裡的角色：

| flag | 抓什麼 | 和迴圈的關係 |
|---|---|---|
| `childList` | 子節點增刪 | 抓得到 `document.title = X`，是閉環的關鍵 |
| `subtree` | 把觀察範圍延伸到所有後代 | 讓觀察 `<head>` 的 observer 看得到 `<title>` 底下的變動 |
| `characterData` | 既有 Text 節點的 `.data` 被直接修改 | 抓不到 `document.title = X` |

## 七、閉環

把三件事接起來：

```
<head> 有任何外部變動（metadata 更新、動態模組、HMR…）
  ↓
observer 回呼：document.title（折疊成單空格）!== targetTitle（雙空格）→ 成立
  ↓
document.title = targetTitle
  ↓
<title> 的子節點被整批替換 → childList 紀錄
  ↓
observer 被自己這次寫入觸發，再排一輪回呼 → 回到第二步
```

MutationObserver 的回呼是用 microtask 派送的。每一輪回呼都會再排一輪，microtask 佇列永遠清不空，瀏覽器就沒有機會處理輸入、繪製畫面，最後跳出「網頁沒有回應」。

這也解釋了語系必現：預設語系的插值結果只有單空格，讀寫一致，`if` 不成立，回呼寫都不寫就結束了。

## 八、最小重現

下面這份 HTML 可以直接存檔用瀏覽器打開。為了不真的卡死分頁，回呼跑到 1000 次就自己斷開：

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>init</title></head>
<body><pre id="out"></pre>
<script>
const LIMIT = 1000; // 安全閥：超過就斷開，避免真的卡死分頁

function run(desired, options) {
  return new Promise((resolve) => {
    let calls = 0;
    document.title = desired;
    const observer = new MutationObserver(() => {
      calls++;
      if (calls >= LIMIT) { observer.disconnect(); return; }
      if (document.title !== desired) document.title = desired;
    });
    observer.observe(document.head, options);
    // 模擬一次外部的 head 變動
    document.head.appendChild(document.createElement("meta"));
    // 等 microtask 全部跑完才會輪到這個 macrotask
    setTimeout(() => {
      observer.disconnect();
      resolve({ got: document.title, calls });
    });
  });
}

(async () => {
  const all = { childList: true, subtree: true, characterData: true };
  const rows = [
    ["a b", await run("a b", all)],
    ["a  b", await run("a  b", all)],
    ["a  b，只開 characterData", await run("a  b", { subtree: true, characterData: true })],
    ["a  b，先正規化", await run("a  b".replace(/\s+/g, " ").trim(), all)],
  ];
  document.getElementById("out").textContent = rows
    .map(([k, r]) => `${k} → get=${JSON.stringify(r.got)} callbacks=${r.calls}`)
    .join("\n");
})();
</script></body></html>
```

在 headless Chrome（151）跑出來的結果：

| 情境 | 寫入 | 讀回 | 回呼次數 |
|---|---|---|---|
| 單空格 | `"a b"` | `"a b"` | 1 |
| 雙空格 | `"a  b"` | `"a b"` | **1000**（撞到安全閥） |
| 雙空格，只開 `characterData` | `"a  b"` | `"a b"` | 0 |
| 雙空格，寫入前先正規化 | `"a b"` | `"a b"` | 1 |

單空格時，外部那一次 `<meta>` 插入觸發一次回呼，比對相等，結束。雙空格時，每次寫回都替自己排下一輪，沒有安全閥就不會停。

第三列值得多看一眼：關掉 `childList` 確實能止血，但同時連外部的 `<meta>` 插入也看不到了，回呼一次都沒跑。`<head>` 裡幾乎不會有人直接改既有 Text 節點的 `.data`，所以這個 observer 還掛著，實際上已經什麼都抓不到。這個專案之前遇過類似的卡死，當時的處理正是關掉 `childList`，症狀消失了，根因還在。

## 九、修法：讓寫入的值本來就是讀得回來的形狀

最後的修法是在產生標題字串時，先做一次和 getter 相同的正規化：

```ts
const targetTitle = t("seo.page-title", { /* ... */ })
  .replace(/\s+/g, " ") // 連續空白折疊成一個空格
  .trim();              // 去掉頭尾空白
document.title = targetTitle;
```

寫進去的值和讀回來的值一致，`if` 在任何變數為空的組合下都不會誤判，閉環從源頭斷開。附帶的好處是使用者在分頁標籤上看到的標題也乾淨了，不再有雙空格。

> [!TIP]
> `\s` 涵蓋的範圍比規格的 ASCII whitespace（tab、換行、form feed、carriage return、空格）大，例如也包含不換行空格（U+00A0）。標題裡如果刻意放了 U+00A0，這個正規化會把它換成一般空格；規格的 getter 則會保留它。這裡的標題模板沒有這種情況，所以用 `\s` 足夠。（在 Chrome 裡設 `"a\u00a0\u00a0b"`，讀回來確實原樣保留兩個不換行空格。）

### 為什麼不去修翻譯檔

盤點英文翻譯檔，帶 `-title` 的標題模板一共 26 條都有同款風險：`{location}` 為空會觸發的有 17 條，`{provider}` 為空會觸發的有 10 條，其中 1 條兩者都會觸發。其他語系也有模板結尾是 `{location}`、變數為空時留下尾隨空白的情況。

逐條改翻譯可以修掉現在這些，但修不掉下一條：以後新增的模板，還是得靠每個寫翻譯的人記得「變數旁邊的空白要小心」。在程式碼裡正規化一次，就涵蓋所有語系、所有模板、所有變數缺值的組合，也不仰賴任何人的紀律。

## 十、可以帶走的原則

- **DOM API 的 getter 和 setter 不一定對稱。** `document.title` 會折疊空白；同類的例子還有 `a.href = "foo"` 讀回來是解析後的絕對網址、`el.style.color = "#FFF"` 讀回來是 `rgb(255, 255, 255)`、`<input type="text">` 的 `value` 寫入含換行的字串會被去掉換行（這三個我都在 Chrome 裡實際跑過）。只要程式碼是「寫進去，再讀出來比對」，就先確認讀寫是否對稱。
- **要比較，就比較正規化過的值。** 寫入前先轉成 API 讀回來的形狀，或比較時兩邊都經過同一個正規化函式。不要拿原始字串和 API 回傳值直接比。
- **會寫入自己觀察目標的 observer，一定要有收斂保證。** 要嘛寫入前後 `disconnect()`／`observe()` 把自己的寫入排除，要嘛確保比較條件在寫入後必定不成立。「寫之前檢查一下」只有在讀寫對稱時才算數。
- **`textContent` 與 `document.title` 的賦值是 `childList` 變動。** 選 MutationObserver 的 flag 時，依規格的實際行為選，不要依「我改的是文字」的直覺選。
- **關掉一個 flag 讓症狀消失，不代表修好了。** 先問它是不是同時讓 observer 失去了原本的作用。
- **「只在某個語系重現」是很強的線索。** 同一份客戶端程式碼在不同語系表現不同，差異只可能來自翻譯字串本身、翻譯插值的結果，或依語系變化的 API 回應。從這三處收斂，比從整個頁面重新讀起快得多。
- **i18n 插值留下的空白是安靜的 bug。** `"前綴 {var} 後綴"` 在變數為空時會留下雙空格，多數情況只是難看；遇上會做正規化的 API，就可能變成死迴圈。插值結果先 collapse、trim 一次，成本很低。
- **「網頁沒有回應」是主執行緒問題。** 看到這個對話框，先用 DevTools Performance 找出長任務，再提假說，不要先往 SSR、hydration、快取那個方向猜。
