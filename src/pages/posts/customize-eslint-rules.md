---
public: true
layout: ../../layouts/BlogPost.astro
title: Customize Eslint Rules
createdAt: 1742228979125
updatedAt: 1742275034661
tags:
  - General
  - Blog
heroImage: /placeholder-hero.png
slug: customize-eslint-rules
---
# [筆記] Customize Eslint Rules 專案內客製化規則

客製化新的 eslint 規則, 僅在專案內部使用, 不會影響到其他專案, 也不需要發布到 NPM .

### 🌋 新增一個新的堪用

使用 astexplorer playground 去測試想要的語法限制, 可以參考 huli 的部落格

> https://astexplorer.net/

> https://blog.huli.tw/2021/03/20/eslint-plugin/

這是一個將 `import` 靜態資源(`jpg`, `png`, `jpeg`) 建議轉換成 `webp` 的範例.
但是這個寫法卻又跟 `eslint` 官方寫法有些許差異, 下面會說明.
但還是可以看一下官方說明的關於客製化規則還有一些其他的參數設定可以使用.

```javascript
const webpForImages = {
  rules: {
    "webp-for-images": {
      create(context) {
        return {
          ImportDeclaration(declare) {
            const importPath = declare.source.value;
            // 確保正則表達式正確匹配常見的圖片格式
            if (/\.(png|jpe?g)$/.test(importPath)) {
              context.report({
                node: declare,
                message: `Wrong image format, should use .webp instead of ${importPath}`,
              });
            }
          },
        };
      },
    },
  },
};

export default webpForImages;
```

---

### 🌋 eslint 資料夾建立

因為只在內部使用 所以直接建立 `eslint-plugins` 的資料夾, 並將規則檔案放在裡面, 並且建立 `package.json` 與 `pnpm-lock.yaml`, 考慮到有不同規則的擴充, 所以依照類別建立不同規則 `@assets` 負責靜態資料相關的規則等等.

```json
(root)
  /eslint-plugins
    ├── @assets
    │   ├── webp-for-images.js
    │   └── webp-for-images.test.js
    ├── README.md
    ├── package.json
    └── pnpm-lock.yaml
  /src
```

測試資料 則另外額外建立, 基本上還是建議寫一下, GPT 協助產出就好, 我在這裡使用專案內原有的測試做整合, 不使用 eslint 提供的 RuleTest.

因為在過程中遇到`測試`與實際 執行 `npm run lint` 說找不到 rules 的問題, 加了 `rules:` 專案就可以吃到規則, 但是測試就不過, 所以後來是一樣保持 `rules:` 寫法, 另外寫測試(從原本的 RuleTester)

> https://eslint.org/docs/latest/extend/custom-rules

```javascript
// test case
import { Linter } from "eslint";
import webpForImages from "./webp-for-images.js";

// 在這裡創建 Linter 實例
const linter = new Linter();

// 直接在配置數組中定義自定義規則
const config = {
  rules: { "webp-for-images/webp-for-images": "warn" },
  plugins: { "webp-for-images": webpForImages },
};

describe("webp-for-images rule", () => {
  it("should validate image imports", () => {
    const validTests = [
      "import image from './image.webp';",
      "import image from './assets/image.webp';",
    ];

    const invalidTests = [
      {
        code: "import image from './image.png';",
        errors: [
          {
            message:
              "Wrong image format, should use .webp instead of ./image.png",
            severity: 1,
            // ruleId: 'webp-for-images/webp-for-images', // 添加規則 ID
            // nodeType: 'ImportDeclaration', // 修改為 nodeType
          },
        ],
      },
      {
        code: "import image from './image.jpg';",
        errors: [
          {
            message:
              "Wrong image format, should use .webp instead of ./image.jpg",
            severity: 1,
            // ruleId: 'webp-for-images/webp-for-images',
            // nodeType: 'ImportDeclaration',
          },
        ],
      },
      {
        code: "import image from './image.jpeg';",
        errors: [
          {
            message:
              "Wrong image format, should use .webp instead of ./image.jpeg",
            severity: 1,
            // ruleId: 'webp-for-images/webp-for-images',
            // nodeType: 'ImportDeclaration',
          },
        ],
      },
    ];

    // 合法的情況
    for (const code of validTests) {
      const messages = linter.verify(code, config);
      expect(messages).toEqual([]);
    }

    // 不合法的情況
    for (const { code, errors } of invalidTests) {
      const messages = linter.verify(code, config);

      // 使用 .toMatchObject() 來匹配錯誤對象的必要屬性
      const errorMessages = messages.map((msg) => ({
        message: msg.message,
        severity: msg.severity,
        // ruleId: msg.ruleId,
        // nodeType: msg.nodeType,
      }));

      // 檢查返回的錯誤消息是否包含預期的錯誤
      expect(errorMessages).toEqual(expect.arrayContaining(errors));
    }
  });
});
```

### 🌋 實際安裝與使用

手動新增 `eslint-plugins` 在 `devDeps` 裡面, 名稱可自取, 但是連接需要指向你要導出的那個資料夾, 然後在 eslint 裡面 plugin 跟 rules 去指定.

```json
"devDependencies": {
  "eslint-plugin-assets": "file:eslint-plugins/@assets",
  // "eslint-plugin-assets": "v0.0.1", // 從 npm 安裝的話應該是這樣
}
```

依照安裝裝依賴的名稱去做更新, rules 的地方則是 我要引入這個插件裡面的哪一項規則, 因為安裝 `eslint-plugins/@assets` 所以是他之下的規則, 現在只有一個所以預設匯出只有他, 後續如果有更多的規則就要去調整結構. 不能預設匯出.

```javascript
import webpForImages from './eslint-plugins/@assets/webp-for-images.js'
// import eslintPluginAssets from 'eslint-plugin-assets' // 從 npm 安裝的話應該是這樣

plugins: {
  // <依賴名稱>: <規則檔案引用>
  'eslint-plugin-assets': webpForImages,
  // 'eslint-plugin-assets': eslintPluginAssets, // 從 npm 安裝的話應該是這樣
  ...
},
rules: {
  // <依賴名稱>/<規則名稱>: <嚴格程度>
  'eslint-plugin-assets/webp-for-images': 'warn', // off, warn ,error
  ...
}
```
