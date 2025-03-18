---
public: true
layout: ../../layouts/BlogPost.astro
title: Vite config (env)
createdAt: 1742278672522
updatedAt: 1742278722419
tags:
  - Blog
  - Vite
  - General
heroImage: /placeholder-hero.png
slug: vite-config-env
---

# [筆記] Vite 生產/開發 config 配置小技巧

`vite.config.js` 可以配置專案內對於 `bundle` 或是其他相關選配(e.g. `rollup`, `vite-plugin-*`)

但在 `dev`, `production` 或是其他不同環境下會有不同樣式的配置.

- 建立 通用(general, base)配置 config 檔案, 取名為 vite.base.config,
- 建立 開發(dev)配置 config 檔案, 取名為 vite.dev.config,
- 建立 生產(prod)配置 config 檔案, 取名為 vite.prod.config,

```javascript
import { defineConfig } from "vite";
import viteBaseConfig from "./vite.base.config";
import viteDevConfig from "./vite.dev.config";
import viteProdConfig from "./vite.prod.config";

const envResolver = {
  serve: () => {
    console.log("進入開發環境");
    return { ...viteBaseConfig, viteDevConfig };
  },
  build: () => {
    console.log("進入生產環境");
    return { ...viteBaseConfig, viteProdConfig };
  },
};

export default defineConfig((command) => {
  return envResolver[command]();
});
```

可以透過 vite 的 command 命令選擇載入不同的配置

- `vite dev` => command ====>>> `serve`
- `vite build` => command ====>>> `build`