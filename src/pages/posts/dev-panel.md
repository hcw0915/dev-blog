---
public: true
slug: dev-panel
layout: ../../layouts/BlogPost.astro
title: 站內調試面板：把散落的臨時程式碼收編成一套工具
createdAt: 1789321080267
updatedAt: 1789321080267
tags:
  - AI
heroImage: /placeholder-hero.png
---

> 專案裡的臨時調試碼有個共通命運：寫的時候很快，用完沒刪，下次要用又得改一次程式碼。這篇記錄把它們收編成一套站內面板的過程 —— 11 支模組、4 個注入點，以及為什麼正式包裡完全看不到它。

## 收編前的樣子

先看被收掉的三處，它們的共通點不是「寫得爛」，而是**每次要用都得動程式碼**：

- **jackpot 的浮動按鈕**：直接掛在頁面上，不用時要記得拿掉。
- **kyc.store 尾巴那段 `createElement` 面板**：整段被註解掉，要用時解註解。註解裡還留著當初的理由 ——「掛載方式刻意用 `createElement` 直接塞 body，不進 React 樹、不動任何組件，驗完把這整段刪掉就乾淨了」。
- **AuthLayout 裡那行被註解的 JSX**：解註解就能預覽登入表單。

第三個特別能說明問題：**那行被誤提交過兩次**。這不是粗心，是機制問題 —— 當「啟用調試」的操作等同「修改程式碼」，那它遲早會跟著功能一起被提交。

`kyc.store.ts` 這次減了 183 行，全部是那段註解掉的面板。

## 開關：兩個條件都要成立

```ts
export const isDevPanelEnabled = () => {
  if (enabled !== null) return enabled;
  if (process.env.NEXT_PUBLIC_ENV !== "dev" || typeof window === "undefined") return false;

  enabled = new URLSearchParams(window.location.search).get(QUERY_KEY) === "1";
  return enabled;
};
```

dev 環境**加上** `?dev_panel=1`，缺一不可。正式站就算有人手動加參數也開不了。

這裡有個小細節：結果會被快取。因為每個 main 組件在 render 時都會呼叫它，不該每次都重新解析 query string。

儲存也刻意分開：面板的狀態一律走 sessionStorage，而且用自己的 key，不進正式碼共用的 `LocalStorageKey` 列舉。理由是兩層 —— 調試工具往正式碼的列舉裡塞東西就是多一處侵入；而調試覆蓋「關掉分頁就該消失」，不該跟著人到下一次開站。

## 4 個注入點，沒開就原樣回傳

面板要能改變頁面行為（換盤口、換版面順序、換組件樣式、預覽表單），就得在正式碼裡留鉤子。這是整件事最需要克制的地方：**鉤子越多，正式碼被調試邏輯污染得越嚴重**。

最後收斂成 4 個 choke point，每個都是該資料的唯一出口：

| 注入點 | 覆蓋什麼 |
|---|---|
| `PageCompositionClient` | 版面順序 |
| `RuntimeComponentRenderer` | 組件 style |
| `BrandConfigProvider` | 盤口身分 |
| `AuthLayout` | 表單預覽 |

寫法完全一致，以組件渲染器為例：

```tsx
// dev 面板（?dev_panel=1）的组件侦测与 style 覆盖挂在这唯一的注入点上；
// 没开面板时原样回传，正式环境等同不存在。
// 订阅版本号是为了让面板改完即时生效 —— 面板没开时这个 store 永远不会变动。
useDevComponentVersion();
const componentData = applyDevComponentOverride(data.component);
```

盤口身分那個注入點的註解把「為什麼是這裡」講得最清楚：**全站的 `isCompliant` / `isReviewEnv` / auth 模板都從這個 context 出去**，所以覆蓋只需要掛在這一個出口。版面順序同理 —— 底下的估高、blocking data、render plan 全由那份陣列派生，改這裡等同後端改了下發順序。

選對位置，一個鉤子就夠；選錯位置，就要在十個地方各補一次。

## 一個會靜默失效的坑

組件 style 的覆蓋採「就地改寫」而不是「返回副本」。這不是風格偏好，是被逼出來的：

`withCsrFetchComponentData` 取數後會做 `{ ...props, ...fetchedProps }`，這個展開會**覆蓋掉上游傳入的副本**；而它的取數快取以組件 id 為鍵、不含 style，所以切換樣式檔位並不會重新取數。

兩個條件疊起來的結果是：如果覆蓋時返回副本，帶 CSR 取數的組件（game-list-top10、competition）會**靜默失效** —— 面板顯示已套用，畫面沒有任何變化，也不會報錯。

這種坑只能靠逐項驗證找出來。四個注入點都在瀏覽器裡逐一驗過。

## 掛載：一次失敗的嘗試

理想的掛載方式是 0 侵入 —— 掛在 Next 原生的客戶端入口 `instrumentation-client.ts`，完全不碰任何業務組件。

試了，Turbopack 編不過：

> 面板會 import `features/dialogs` 那份 registry，而它的 loader 指向 `app/` 底下的模組，從非 app 入口去建那些 chunk 會報「An unexpected Turbopack error occurred」。

結論是 **kit 必須待在 app graph 裡面**。所以最後掛在 popup initializer 裡：

```tsx
const XDevKitPanel =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/features/dev-panels").then((m) => m.XDevKitPanel), {
        ssr: false,
      })
    : () => null;
```

關鍵是 `process.env.NODE_ENV === "development"` 這個**字面量分支**：正式建置時它是常數 false，整條分支連同底下的動態 import 會被搖掉，整個 chunk 不會進正式包。

面板集合內部還有第二層：皮膚面板會 import 全部 17 套皮膚加 3 套主題的 CSS（切換時需要它們在頁面上），所以單獨切一個 chunk，一樣用 `NODE_ENV` 包住。這一層刻意用 **`React.lazy` 而不是 `next/dynamic`** —— 那段程式碼在面板集合內部，用 React 原生的 lazy 就不必把打包器的 app-graph 機制牽扯進來。

## 配色：要的不是「跟著主題」，是「跟主題相反」

面板的強調色取當前皮膚主色的**互補色**（色相 +180°）。理由寫在程式碼註解裡，我覺得是整套工具裡最好的一個判斷：

> 為什麼不直接吃 `--color-*`：那樣面板會跟盤口同色（黃底盤口的黃面板、綠底盤口的綠高亮），反而分不出哪裡是面板、哪裡是頁面 —— 調試工具最該做到的就是「一眼看出這不是頁面的一部分」。

實作上只轉色相，飽和度與亮度一律釘在「深底上看得清」的那一檔。因為皮膚主色有的很暗（`#00983a`）有的很淡（`#f7ce7f`），照抄 S/L 會得到在深色面板上讀不出來的字。

主色接近灰階時互補色沒有意義（轉 180° 還是同一個灰），這時直接不設，讓它落回 fallback 的洋紅 —— 而洋紅是實測 17 套皮膚後挑的：**沒有任何一套用到 290–310° 這段色相**，所以算不出互補色時也不會跟頁面糊在一起。

## 探針：自訂屬性的值不是顏色

要算互補色，得先拿到皮膚主色的 RGB。這裡有個會讓人整套落回 fallback 的陷阱：

**自訂屬性的 computed 值是「原樣的字面量」。** 皮膚檔寫 `#31ed87`，`getComputedStyle` 拿到的就是字串 `#31ed87`，不是 `rgb()`。直接用正則抓數字只會抓到 `31` 和 `87` 兩段，判定成「不是顏色」，然後每套皮膚都長一樣。

解法是丟一個隱藏的探針元素進去，讓瀏覽器幫你正規化：

```ts
const probe = document.createElement("span");
probe.style.display = "none";
probe.style.color = declared;      // 先塞進去
document.body.appendChild(probe);
const primary = getComputedStyle(probe).color;  // 讀回來就是 rgb(r, g, b)
probe.remove();
```

元素檢視的 token 反查用的是同一招：掃 `<html>` 上所有 `--` 開頭的自訂屬性，逐一丟進探針正規化，建成「顏色值 → token 名稱」的反查表，於是滑到任何元素都能顯示它用的是哪個 token 而不只是色碼。

但長度類 token（radius / space）**刻意不繞這一層**，直接比字面值 —— 繞過去反而會把 `6px` 和 `0.375rem` 判成不同的東西。同一個技巧不是到處都適用，這個分寸寫在註解裡。

CSS 變數還有個位置問題：變數掛在 `<html>` 而不是面板根節點。因為元素檢視的浮層是 portal 到 body 的，掛在面板上它讀不到。

## 11 支模組分三組

| 組別 | 模組 |
|---|---|
| 盤口 | 盤口身分（6 國 × 合規／非合規／審核服）、皮膚 / 主題 / 語言（17 皮膚 + 3 主題 + 5 語系） |
| 美術 | 首頁組件樣式表（style 檔位、拖拉換序、展開後端下發的 JSON）、元素檢視（盒模型色塊 + token 反查） |
| 功能 | SEO / TDK、狀態 / 接口資料、登入註冊表單（18 個 auth 狀態）、彈窗（78 支分 19 組 + 87 個活動）、通知 / toast、websocket 推送模擬（30 種 type）、帳號綁定 / KYC |

兩個設計細節：

**彈窗面板的 props 骨架由 TS 型別產出**，不是手寫。78 支彈窗手寫一份 props 範本，第一次改型別就會全部過期。

**websocket 模擬走真實的 `handleSwitch`**，不是假造畫面。走真實分發路徑才驗得到「收到這個 type 之後整條鏈路的反應」，否則只是自己騙自己。

還有一個很小但值得記的：分組順序寫死在常數裡，不從模組清單推導。註解寫「推導的話加一支新面板就可能把分組順序帶亂」。

## 登入表單的預覽：誰 import 誰

auth 面板跟其他面板不同 —— 它要把表單塞進 `AuthLayout` 的內容區，不能自己浮在角落。這產生一個依賴方向的問題，而選錯方向會把調試碼釘進正式包：

> 這裡存的是**已經渲染好的節點**，不是讓 AuthLayout 自己去 render 的 key。存 key 的話 AuthLayout 就得 import `renderAuthPreset`，那會把面板連同它 import 的全部 auth 表單一起釘進正式包。

所以節點由面板產出、往共用狀態推，`AuthLayout` 只負責讀。兩邊都不必 import 對方，而面板那側本來就有 `NODE_ENV` 的閘門擋著。

**依賴方向決定了 tree-shaking 能不能生效**，這比「寫得漂不漂亮」重要得多。

## 小結

這套東西的價值不在功能多，而在把「調試」從「改程式碼」變成「加一個網址參數」。三個可以帶走的判斷：

1. **鉤子要下在唯一出口**，不是下在每個使用處 —— 選對位置，4 個就夠覆蓋版面、樣式、身分、表單。
2. **調試工具要看起來不像頁面的一部分** —— 所以配色取互補色，而不是沿用主題。
3. **依賴方向決定它會不會漏進正式包** —— 讓調試側 import 正式側，不要反過來。

至於為什麼值得花這個工：被收掉的那三段臨時程式碼裡，有一段被誤提交過兩次。工具化之後，「用完忘了刪」這件事在機制上就不會發生了。
