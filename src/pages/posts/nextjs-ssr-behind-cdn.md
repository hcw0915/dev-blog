---
public: true
slug: nextjs-ssr-behind-cdn
layout: ../../layouts/BlogPost.astro
title: CDN 後面的 Next.js：爬蟲、快取與瀏覽器拿到的不是同一份 HTML
createdAt: 1791370428676
updatedAt: 1791370428676
tags:
  - Next
  - Blog
heroImage: /placeholder-hero.png
---

> 這篇整理四個只在正式環境出現的問題。它們的共同點是：我在瀏覽器裡看到的頁面，跟爬蟲、CDN、或另一個使用者拿到的那一份不一樣，而且每一次「本機看起來沒問題」都是真的，只是看錯了地方。分享連結沒有預覽、桌機比手機多一張活動卡、sitemap 裡的網域全是別的站、分頁標題顯示成首頁，這四個症狀各自都像前端 bug，但其中桌機手機不一致那個，前端一行都不用改。最後附上一組可以直接帶走的 curl 檢查。

> [!NOTE]
> 作者說明：情境是一個多站台共用的 Next.js App Router 前端，前面擋著一層整頁快取的 CDN（本例是 Cloudflare），同一套程式碼掛在幾個並行網域上。Next 版本是 15.5.9。文中的數字都來自當時的實測，網域一律換成 `example.com`、`a.example`、`b.example`。

## 一、同一個 URL，至少有四份「頁面」

先把這篇反覆出現的四個觀察者分開：

| 誰在看 | 拿到的是什麼 | 常見的誤判 |
|---|---|---|
| 不跑 JS 的爬蟲（分享預覽、部分搜尋抓取） | 伺服器送出的原始 HTML，只讀 `<head>` | 用瀏覽器的 view-source 去驗它 |
| CDN | 依它自己的 cache key 存下的某一份回應，可能好幾個小時前的 | 以為 `vary` 沒寫的維度就不會分 |
| 源站 | 經過代理改寫過的請求，`Host` 不一定是使用者打的那個 | 以為 DevTools 看到的請求標頭就是源站收到的 |
| 瀏覽器分頁 | SSR 之後再被客戶端程式碼改過的執行期狀態 | 以為 view-source 對，畫面就對 |

下面四節各對應一列。

## 二、OG 標籤被串流進 `<body>`：streaming metadata 與 edge runtime

### 現象

使用者回報：分享到 Facebook、WhatsApp、X（Twitter）都沒有預覽卡。本機 dev 一切正常，一發版就壞，初期還誤判成環境變數或建置差異。

用 curl 抓首頁，看位元組位置：`</head>` 在第 10,610 個位元組附近，`<title>` 與所有 `og:` 標籤在第 17.8 萬個位元組附近，深在 `<body>` 裡。換成 `facebookexternalhit`、`Twitterbot`、`WhatsApp`、`Discordbot` 等 UA 重抓，結果一樣。

### 機制：Next 15.2 起的 streaming metadata

Next 15.2 開始，`generateMetadata` 支援串流：先把 HTML 外殼送出去，metadata 算好之後再附加到 `<body>`，由客戶端的 React 把它們提升回 `<head>`。真實瀏覽器無感，對 TTFB 還有幫助。

代價是不跑 JS 的爬蟲只看得到 `<body>` 裡的標籤。Next 的對策是看 User-Agent：命中「HTML-limited bots」清單的請求，metadata 改回阻塞渲染，直接出現在 `<head>`。15.5.9 裡的判斷函式很短：

```js
function shouldServeStreamingMetadata(userAgent, htmlLimitedBots) {
  const blockingMetadataUARegex = new RegExp(
    htmlLimitedBots || HTML_LIMITED_BOT_UA_RE_STRING, 'i'
  );
  if (userAgent && blockingMetadataUARegex.test(userAgent)) return false;
  return true;
}
```

預設清單涵蓋 `facebookexternalhit`、`Twitterbot`、`WhatsApp`、`Discordbot`、`LinkedInBot`、`Slackbot`、`Bingbot` 等。值得注意的是，主要的 `Googlebot` **不在**這份清單裡：官方文件說明他們驗證過會執行 JS 的爬蟲能正確讀到串流進 body 的 metadata，所以 Googlebot 拿到的本來就是串流版。用 Googlebot UA 抓到 og 在 body，不代表壞了。

### 為什麼 UA 判斷沒生效：edge runtime 的 SSR 路徑沒有呼叫它

根 layout 宣告了 `export const runtime = "edge"`，整個語系路由段都被編譯成 edge。翻 `node_modules/next` 對照兩條路徑：

- **Node 伺服器路徑**（`dist/server/base-server.js`）：`serveStreamingMetadata` 由 `shouldServeStreamingMetadata(ua, this.nextConfig.htmlLimitedBots)` 決定。
- **Edge SSR 模板**（`dist/build/templates/edge-ssr-app.js`，第 139 行）：`serveStreamingMetadata: true` 寫死。它有算 `botType`、也把 `htmlLimitedBots` 往下傳，但從頭到尾沒有呼叫判斷函式。

所以在 edge runtime 下，metadata **永遠**串流，與 UA 無關，與 `htmlLimitedBots` 設定也無關。本機 dev 正常，我當時的判讀是 dev 走的是另一條渲染路徑；這一點沒有逐行追到底，屬於推論。

這個寫死的狀態延續了很久。我對照 Next 原始碼各版本 tag 的 `edge-ssr-app.ts`：15.5.x、16.0、16.1、16.2、16.3 都還是 `serveStreamingMetadata: true`；**16.4.0 起改成呼叫 `shouldServeStreamingMetadata(userAgent, nextConfig.htmlLimitedBots)`**。也就是說，如果你在 16.4 之前的版本用 edge runtime 渲染頁面，這個問題大概率還在；16.4 之後模板層面已經補上，但我沒有在 16.4 上實際跑過驗證。

### CDN 疊上來：誰先填快取，誰說了算

就算渲染層的 UA 判斷正常運作，前面還有一層整頁快取。正式站的回應帶著 `cf-cache-status: HIT`、`age` 好幾個小時，而 cache key 不含 UA。

UA 分流 + 不分 UA 的整頁快取 = 快取內容由「誰先來」決定：

- 一般瀏覽器先來 → 快取被填成 body 版 → 之後的爬蟲命中快取，拿到 body 版
- 爬蟲先來 → 快取被填成 head 版 → 這次碰巧沒事

這種問題會「隨機復發」，最難查。有個對照組幫忙排除了「純快取問題」的解釋：另一個不做快取的部署（`cf-cache-status: DYNAMIC`），`facebookexternalhit` 照樣拿到 body 版，矛頭因此指回渲染層本身。

### 考慮過的修法

| 方向 | 結果 |
|---|---|
| 根 layout 改回 `runtime = "nodejs"` | 渲染層會恢復 UA 判斷，第一時間做了，但沒有留在主線上。而且它解不了上面那個快取競態 |
| `htmlLimitedBots: /.*/`，讓所有 UA 都走阻塞 | 官方文件寫的「完全停用 streaming metadata」做法。但在 edge 模板下根本沒被讀，設了等於沒設；就算在 Node 路徑有效，也是用全站 TTFB 換 |
| 改 CDN 規則，不快取 HTML 或按 UA 分桶 | 需要 CDN 權限，而且是在繞開問題 |
| **在根 layout 無條件把完整 SEO 標籤渲染進 `<head>` 外殼** | **實際上線的做法** |

### 實際上線的做法：不靠串流，也不看 UA

思路是：既然串流版會把 metadata 放進 body，那就不要讓 metadata 走串流。根 layout 的 `<head>` 是文件外殼的一部分，跟著第一批位元組送出，寫在這裡的標籤對任何 UA 都在 `<head>` 裡。

具體做了三件事：

1. **停用各頁的 `generateMetadata`**，改由根 layout 統一輸出 title、description、canonical、hreflang、og、twitter、robots。這樣不會有兩份 metadata 互相打架。
2. **讓 layout 知道「現在是哪一頁」。** layout 拿不到子路由的參數，所以由 middleware 把原始路徑塞進一個自訂的 request header，layout 讀這個 header 反查路由表，算出該頁的 metadata。有一條 rewrite 分支原本沒帶這個 header，結果那條路徑上的 og 全部退回首頁的值，是一起補上的。
3. **整段包 try/catch，失敗時退化成只有品牌名的最小 head。** metadata 相依於後端（翻譯、og 圖、內容詳情），後端掛掉不能拖著整個 layout 一起 500。

這個做法順手消解了快取競態：所有 UA 拿到的 HTML 是同一份，快取先被誰填都一樣。

代價也要講清楚：

- **head 外殼要等 metadata 算完才送出。** layout 在回傳 JSX 之前 `await` 了這段計算，等於放棄了 streaming metadata 原本要給的 TTFB 好處。正式站有整頁快取，大部分請求吃不到這段成本。
- **路由表成了單一事實來源。** 某條路由沒登記進表，就會掉到預設的首頁 metadata，連 SSR 都是錯的。第五節的分頁標題問題，就有一半出在這裡。

### 怎麼驗

**不要用瀏覽器的 view-source。** 它送的是一般瀏覽器 UA，拿到串流版是設計如此。要用爬蟲 UA 抓，比 og 標籤與 `</head>` 的位元組位置：

```bash
curl -s -A "facebookexternalhit/1.1" "https://example.com/?_cb=$RANDOM" \
  | grep -bo '</head>\|property="og:image"'
# og:image 的位元組位置 < </head> 的位元組位置，才算正確
```

修好之後還要去刷各平台自己的抓取快取：Facebook 與 WhatsApp 共用 Facebook 的快取，用 [Sharing Debugger](https://developers.facebook.com/tools/debug/) 按「Scrape Again」。

## 三、CDN 的 cache key 不等於 `vary`

### 現象

促銷頁在桌機顯示 13 張活動卡，手機只有 12 張。同一時刻、同一個 URL，只換 User-Agent：

```
UA            data-device  cf-cache  age     活動數
Chrome 桌機    desktop      HIT       34126   13
Firefox 桌機   desktop      HIT       34126   13
Android       mobile       HIT       320     12
iPhone        mobile       HIT       320     12
iPad          mobile       HIT       321     12
```

桌機那份的 `age` 連續四次取樣是 `33855 → 33877 → 33896 → 34126`，只增不減：同一個快取物件，全程沒回源。它停在那檔活動還在列表裡的那一刻。

### 第一層：`vary` 沒寫，CDN 還是分了變體

```
cache-control: no-store                                     ← 源站要求不要快取
cf-cache-status: HIT                                        ← CDN 還是快取了
vary: Accept-Encoding, rsc, next-router-state-tree, ...     ← 沒有 User-Agent
```

標準的 HTTP 內容協商必須靠 `vary` 宣告。`vary` 裡沒有 User-Agent，卻確實分出了桌機與行動兩份，就代表分變體的是 **CDN 自己的 cache key**。以 Cloudflare 來說，可能是 Page Rule 的 Cache By Device Type、Cache Rules 的 Cache Key 勾了 Device Type，或 Worker 自訂了 cache key。`no-store` 被無視，同理代表規則裡覆寫了源站的快取指示。

這是一個很好用的判準：**看到「分了，但 `vary` 沒宣告」，直接去翻 CDN 規則，不要繼續讀伺服器端程式碼。**

### 第二層：SSR 內嵌的資料，跟著文件一起被快取

未登入時，活動資料在伺服器端取得、內嵌進 HTML 與 RSC payload，客戶端整個載入過程沒有任何一支取活動資料的請求。所以文件被快取，資料就被快取。這類頁面的資料新鮮度上限等於文件快取的 TTL，跟 API 自己的快取策略完全無關。

### 第三層：客戶端沒有兜底重拉

客戶端有一段「受眾不同才重拉」的邏輯：SSR 給的是訪客版，客戶端初始化完如果還是訪客，兩者相等就直接返回。登入使用者會重拉，看到的永遠是新的；未登入使用者永遠不重拉。

三層疊起來：CDN 快取陳舊 → 內嵌資料陳舊 → 前端沒有自我修正，未登入使用者可以看到任意久以前的活動列表。前端的過濾邏輯有四個條件，沒有一個跟視窗或裝置有關；本機用桌機與窄視窗渲染，結果逐字相同。這一條就足以把整個前端排除。**先量 `age`，再懷疑程式碼。**

### `age` 不是 TTL

我第一版結論寫的是「兩份的 TTL 不一致（9 小時 25 分 vs 90 秒）」，這是把觀察當成了設定值。`age` 只能給 TTL 一個下界：桌機那份 `age` 衝到 34126 秒還在 HIT，只能說它的 edge TTL ≥ 9.5 小時。手機那份 `age` 小，可能是 TTL 短，也可能剛被驅逐或清除，反推不出 TTL。想知道實際 TTL，不需要後台權限：持續取樣 `age`，看它漲到多少之後歸零，峰值就是答案。

### 延伸：cookie 不在 cache key 裡，「伺服器讀 cookie 決定輸出」會安靜失效

同一天，促銷詳情頁還有另一個修正：SSR 拿不到使用者維度的權限，登入使用者被誤判成 404。修法是讓伺服器讀登入態的 cookie，訪客才判 404、登入使用者不判。

診斷是對的，但前提在 CDN 後面站不住。三條 curl 換 cookie：

```
無 cookie           HTTP/2 404   cf-cache-status: HIT   age: 41
帶登入 cookie        HTTP/2 404   cf-cache-status: HIT   age: 41   ← 同一個快取物件
帶隨機 cookie        HTTP/2 404   cf-cache-status: HIT   age: 41
```

兩件事：404 回應本身也被快取（第一次 MISS、再打 HIT），一樣無視 `no-store`；cookie 完全不在 cache key 裡，也不觸發 bypass。於是兩個方向都會壞：

| 誰先訪問 | 邊緣快取存下 | 後來的人拿到 |
|---|---|---|
| 訪客 | 404 | 登入使用者也是 404，修了等於沒修 |
| 登入使用者 | 200 空殼 | 訪客也拿到 200，該 404 的頁面被搜尋引擎收錄成空頁 |

更糟的是詳情頁沒有自我修正的機會。列表頁拿到錯的 SSR 資料，客戶端還有一次重拉；詳情頁一旦呼叫 `notFound()`，Next 送出的是 not-found 頁，負責重拉的客戶端元件根本不會掛載，錯一次就錯到快取過期。

> [!WARNING]
> 凡是新增「伺服器讀 cookie 決定輸出」的地方，先量一下 CDN 的 cache key 含不含 cookie。成本是三條 curl；不量的代價是修正靜默失效：快取命中時程式碼根本沒跑，看日誌也看不出來。

順帶要檢查的是個資風險。判準是「登入態的 SSR 有沒有把使用者維度的資料寫進 HTML」。這兩條路由在登入態一律不內嵌、只出空殼，資料全交給客戶端帶 token 去拉，所以就算登入版 HTML 被快取發給別人，裡面也沒有使用者內容。同一條 CDN 規則如果還罩著其他 SSR 頁面，要各自用這個判準再查一遍。

當時列出的出路有三條，都還沒定：把這些路徑排除在 CDN 快取規則之外；伺服器端不做 404 判定，改由客戶端拿到空資料時決定；或讓 cookie 進 cache key／遇 cookie 就 bypass。

## 四、`Host` 被代理改寫：`host || x-forwarded-host` 的右半邊是死程式碼

### 現象

同一套程式碼掛在三個並行網域，各自的 canonical 都指向自己，都想被獨立索引。但三個網域的 `robots.txt` 全部宣告同一個網域的 sitemap，`sitemap.xml` 裡 4352 條 `<loc>` 百分之百是另一個網域，沒有一條跟隨訪客實際造訪的網域。

| 造訪網域 | `robots.txt` 的 `Sitemap:` | sitemap 首條 `<loc>` | HTML canonical |
|---|---|---|---|
| a.example | `https://b.example/sitemap.xml` ❌ | `https://c.example` ❌ | `https://a.example` ✅ |
| b.example | `https://b.example/sitemap.xml` | `https://c.example` ❌ | `https://b.example` ✅ |
| c.example | `https://b.example/sitemap.xml` ❌ | `https://c.example` | `https://c.example` ✅ |

### 根因

`robots.ts` 與 `sitemap.ts` 這兩條 metadata route 都這樣取網域：

```ts
const domain = headersList.get("host") || headersList.get("x-forwarded-host") || "";
```

`Host` 從 HTTP/1.1 起就是必填標頭，永遠非空，所以 `||` 右邊一次都不會執行。在 CDN 或反向代理後面，`Host` 已經被改寫成回源用的固定網域，訪客真正造訪的網域只留在 `X-Forwarded-Host`。這種寫法不會報錯、不會告警，只會安靜地永遠取錯值。

修法是調換順序。但這只解決了「該信哪個標頭」，還有第二個坑：`X-Forwarded-*` 在多層代理下慣例是逗號分隔，最左邊最接近原始客戶端（例如 `a.example, cdn.internal`）；`Host` 只會被最後一層覆寫，永遠是單值。直接拿整串去拼，會產出 `https://a.example, cdn.internal/sitemap.xml` 這種非法 URL，比原本的 bug 更糟：原本至少輸出一個合法（只是錯誤）的網域。

```ts
const domain =
  headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ||
  headersList.get("host") ||
  "";
const protocol =
  headersList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
```

`X-Forwarded-Proto` 是同一個坑（`https, http` 會拼成 `https, http://...`），一起處理。驗了 12 個案例：

| 場景 | 送的值 | 結果 |
|---|---|---|
| 兩層 | `a.example, cdn.internal` | `a.example` ✅ |
| 三層無空格 | `origin.example,mid.proxy,last.hop` | `origin.example` ✅ |
| 前後多空格 | `  spaced.example  ,  mid.example  ` | `spaced.example` ✅ |
| 單值／沒有 XFH | — | 行為不變 ✅ |
| proto 多值 | `https, http` | `https://` ✅ |
| 畸形 | `,,,`／空值／全空白 | 退回 `Host`，沒有產出畸形 URL |

畸形輸入不需要額外防禦：`",,,".split(",")[0]` 是空字串，`trim()` 之後仍是 falsy，被既有的 `|| host` 接住。

> [!NOTE]
> 一個原紀錄沒有處理、屬於我自己的補充：`X-Forwarded-Host` 是客戶端也送得出來的標頭。如果 CDN 是「附加」而不是「覆寫」它，最左邊那個值就是客戶端自己填的；再加上 sitemap 會被長時間快取，理論上存在用偽造網域污染快取的風險。要信任最左值，前提是確認 CDN 會覆寫這個標頭，或在源站只接受白名單內的網域。我沒有實測這個 CDN 的行為。

### 怎麼驗：在本機模擬 CDN

瀏覽器 DevTools 看到的是「瀏覽器 → CDN」那一段的請求，看不到「CDN → 源站」那一段，而這類問題恰好發生在後半段。本機可以手動構造：

```bash
# 模擬 CDN：Host 是回源網域，真實造訪網域放在 X-Forwarded-Host
curl -s -H "Host: origin.example" -H "X-Forwarded-Host: a.example" \
  http://localhost:3000/robots.txt
```

流程上有兩個重點：

- **改程式碼之前先用這條命令重現，改完再跑逐字相同的命令。** 少了改前那一步，改後「輸出正確」就分不出是「修好了」還是「它本來就對」。
- **再跑一次只給 `Host`、不給 `X-Forwarded-Host` 的版本。** 結果和改前一致，代表這個改動的最壞情況是「無效」，不會讓現狀變糟。

驗畸形輸入時，我一度懷疑 `X-Forwarded-Host: ,,,` 是不是被 curl 靜默丟掉了，那樣結果就等同於沒送這個標頭。用 `curl -v` 看實際送出的報文，確認標頭在請求裡，才敢下「程式碼真的有兜底」的結論。**否定性的斷言，先懷疑觀測手段。**

### 先分清「被快取凍結」和「本來就取錯」

這個案例兩者同時存在。`robots.txt` 不帶快取標頭、每次即時回源，是實時取錯；`sitemap.xml` 回的是 `cache-control: public, max-age=2678400`（31 天），實測 `age` 已經七萬多秒，是取錯之後又被凍住。

我第一輪只看 sitemap，差點把根因判成純快取問題、修錯地方，是「robots.txt 沒有快取標頭」這個細節把結論拉回來的。所以：

- **要驗「網域取對沒有」，用 `robots.txt` 當探針。** 它即時回源，內容本身就是拼出來的 base URL。
- **sitemap 修完要 purge。** 它被快取 31 天，`vary` 裡也沒有 Host，不清掉的話線上會繼續發舊的那份。

## 五、分頁標題：view-source 對，不代表畫面對

這一節跟 CDN 無關，但它是同一類錯覺的瀏覽器版本，所以簡短記一下。

### 現象

內容詳情頁的瀏覽器分頁顯示首頁標題，但「檢視網頁原始碼」裡是正確的標題。這不矛盾：Chrome 的 view-source 會對當前 URL **重新發一次請求**，拿到的是 SSR HTML；分頁上的標題是執行期的值，站內導航之後被客戶端程式碼改過。兩者分歧本身就是訊號：問題在 SSR 之後的客戶端覆寫，不在 metadata 的產生。

這個站有兩種詳情頁：桌機的獨立頁面，以及行動版以彈窗形態呈現的同一份內容。它們症狀相同、成因不同：

- **桌機版**：客戶端有一段歷史遺留的特判，站內導航到這類頁面時「統一顯示首頁標題」。它當初成立的前提是「SSR 只能給通用標題」，但那個前提早就被推翻了，SSR 已經輸出各頁自己的標題。這段覆寫沒有跟著刪，反而把對的蓋成錯的。
- **行動版彈窗**：這條路由根本沒登記進 SEO 路由表，反查不到就掉到首頁的預設值，連 SSR 的 `<title>` 都是首頁。這正是第二節說的「路由表成了單一事實來源」的代價。

這類頁面占了 sitemap 裡絕大多數的 URL，影響的是全站大部分可被索引的頁面。

修法是在伺服器端算好標題，交給一個只負責寫 `document.title` 的客戶端元件；拿掉那段特判；補上路由表。修完後隨機抽 12 個詳情頁，桌機與行動版各打一次 SSR，「不是首頁標題、兩版一致、非空」三項全數通過。過程中有三個值得記的觀念：

**一、從 Router Cache 還原的頁面，effect 不會重跑。** 「進詳情頁 → 去另一頁 → 按上一頁」，標題沒有恢復。用探針記錄 effect 的每次執行，回上一頁時一次都沒跑；同時確認回上一頁時沒有任何 RSC 請求，Next 是從客戶端的 Router Cache 還原。React 復用同一個元素、props 沒變，只相依於 `[title]` 的 effect 自然不會重跑。修法是把 `usePathname()` 加進相依陣列。

通則是：**任何「隨頁面掛載寫一次全域副作用」的元件，都不能假設每次導航都會重新掛載。** 讓 effect 的相依陣列反映「什麼變了要重做」，不要相依於掛載生命週期。

**二、彈窗形態的頁面，頁面級副作用要寫在彈窗本體。** 我一開始把算標題的邏輯放在行動版的獨立 page 路由上：直接開網址有效，從站內點進來無效。原因是站內導航時，彈窗由客戶端的彈窗路由註冊表渲染，獨立的 page 路由完全不參與，只有直接造訪才走它。Next 原生的 Intercepting Routes 也是同樣的形狀：軟導航時渲染的是被攔截的那個版本，不是獨立頁面。任何「進這個畫面就該發生一次」的事（寫標題、埋點、拉資料）掛在外層，都會表現成「直接開網址對、站內點進來沒反應」。

**三、不要用 MutationObserver 看守 `document.title`。** 這個站以前出過一次主執行緒卡死（細節寫在〈[document.title 讀寫不對稱](/posts/document-title-mutation-observer-loop)〉）：observer 的 callback 裡回寫標題、又讀回來比對，撞上 setter 與 getter 對空白折疊的不對稱，形成自我觸發的迴圈。這次的做法刻意避開：沒有 observer、不讀回比對、伺服器端與客戶端都經過同一個空白正規化、寫入標題不改變 effect 的相依，構不成迴圈。

驗執行期的標題，在 DevTools Console 掛一個 setter 計數器，比看畫面可靠：

```js
const desc = Object.getOwnPropertyDescriptor(Document.prototype, "title");
let writes = 0;
Object.defineProperty(document, "title", {
  configurable: true,
  get() { return desc.get.call(this); },
  set(v) { writes++; console.log("title ←", v, `(#${writes})`); desc.set.call(this, v); },
});
```

直接造訪、站內點擊、離開再按上一頁，各看一次寫入了幾次、寫了什麼。

## 六、工具箱：一組可以重用的 curl

```bash
URL='https://example.com/some-page'
UA_PC='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'
UA_H5='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1'
```

**1. 爬蟲看到的 `<head>`：og 是否在 `</head>` 之前**

```bash
for ua in 'facebookexternalhit/1.1' 'Twitterbot/1.0' 'WhatsApp/2.23' "$UA_PC"; do
  echo "== $ua"
  curl -s -A "$ua" "$URL?_cb=$RANDOM" | grep -bo '</head>\|property="og:image"'
done
```

`?_cb=$RANDOM` 是為了打穿快取看源站。Cloudflare 預設的 cache key 包含 query string，所以加了它通常會 MISS；想看「CDN 實際發給大家的那份」，就把它拿掉再跑一次，兩次結果不同就是快取問題。

**2. 快取狀態：有沒有被快取、`vary` 宣告了什麼**

```bash
for ua in "$UA_PC" "$UA_H5"; do
  echo "== $ua"
  curl -sSI -A "$ua" "$URL" | grep -iE 'cf-cache-status|^age|cache-control|^vary'
done
```

兩個 UA 的 `age` 不同而 `vary` 沒有 User-Agent，就是 CDN 自己的 cache key 在分變體。

**3. 量實際 TTL：取樣 `age` 直到歸零**

```bash
while true; do
  printf '%s  ' "$(date +%T)"
  curl -sSI -A "$UA_PC" "$URL" | grep -i '^age' || echo 'age: (none)'
  sleep 30
done
```

**4. cookie 在不在 cache key 裡**

```bash
for c in '' 'session=1' "rand=$RANDOM"; do
  curl -sSI -H "Cookie: $c" "$URL" | grep -iE '^HTTP|cf-cache-status|^age' | tr '\n' ' '; echo
done
```

三次的 `age` 相同，就是同一個快取物件，「伺服器讀 cookie 決定輸出」在這條路徑上不會生效。

**5. 在本機模擬代理改寫的標頭，並確認標頭真的送出**

```bash
curl -v -H "Host: origin.example" \
        -H "X-Forwarded-Host: a.example, cdn.internal" \
        -H "X-Forwarded-Proto: https, http" \
        http://localhost:3000/robots.txt
```

**6. 伺服器按裝置輸出的痕跡**

如果伺服器有把裝置類型寫進 `<html>` 的屬性（這個站是 `data-device`），可以直接數：

```bash
curl -sS -A "$UA_H5" "$URL" | grep -oE 'data-device="[^"]*"' | sort | uniq -c
```

## 七、可以帶走的原則

1. **先決定你要驗的是誰看到的那一份。** 爬蟲、CDN、源站、瀏覽器執行期是四個不同的觀察者，view-source 和 DevTools 預設只代表其中一個。
2. **metadata 要讓不跑 JS 的爬蟲讀到，最穩的是讓它不相依於 UA。** 依 UA 分流的輸出一碰上不分 UA 的整頁快取，就變成「誰先來誰說了算」。如果你在 Next 16.4 之前用 edge runtime，`htmlLimitedBots` 對 edge 渲染的頁面不會生效。
3. **`vary` 沒宣告、快取卻分了變體，就是 CDN 的 cache key 在做。** 去翻 CDN 規則，不要繼續讀伺服器端程式碼。
4. **`age` 是 TTL 的下界，不是 TTL。** 要知道 TTL，就持續取樣看它在哪裡歸零。
5. **SSR 內嵌資料的頁面，被快取就等於資料被快取。** 要看兩點：資料是內嵌還是客戶端拉；客戶端有沒有兜底重拉。錯誤回應會不會掛載客戶端元件，決定了它有沒有自我修正的機會。
6. **伺服器按 cookie 分流之前，先量 cache key 含不含 cookie。** 快取命中時程式碼根本沒跑，失效是靜默的。
7. **在代理後面，`Host` 是回源網域；要造訪網域就讀 `X-Forwarded-Host`，取最左值，並確認它可信。** `host || x-forwarded-host` 的右半邊永遠不會執行。
8. **先分清「被快取凍結」和「本來就取錯」。** 找一個不被快取的探針（例如 `robots.txt`）把兩者拆開。
9. **全域副作用不要相依於「每次導航都會重新掛載」。** Router Cache 還原與彈窗形態的路由，都會讓這個假設失效。
