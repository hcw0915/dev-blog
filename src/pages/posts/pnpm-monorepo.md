---
public: true
layout: ../../layouts/BlogPost.astro
title: Pnpm monorepo
createdAt: 1742274668646
updatedAt: 1742274716976
tags:
  - Blog
  - General
heroImage: /placeholder-hero.png
slug: pnpm-monorepo
---

# [筆記] pnpm Monorepo 簡要說明

### Pnpm

- Soft Link (軟連結):
軟連結指向應用內部的依賴，使得這些依賴在開發過程中能夠快速更新和修改。當你需要頻繁地更改某個依賴時，軟連結可以讓你在不重新安裝的情況下直接在源頭修改。
這種方式使得開發者能夠更方便地進行迭代，特別是在多個項目之間共享相同的依賴時。

- Hard Link (硬連結):
硬連結指向 pnpm store 中的真實位置，這樣可以避免重複安裝同一個依賴，節省磁碟空間。由於硬連結與原始文件共享相同的存儲位置，這也使得包的管理變得更高效。
使用硬連結還能保證依賴的版本一致性，避免了版本衝突的問題。

---
### 建立 monorepo

web 內部的 react / vue 專案 使用 vite 產生 (還不需要 install), 會透過 pnpm-workspace.yaml 做共同配置並安裝

```bash
/monorepo-test
 |-- package.json
 |-- main
 |   |-- index.js
 |   |-- package.json
 |-- web
    |-- react-demo
    |   |-- package.json
    |   |-- (...vite 其他配置)
    |-- vue-demo
    |   |-- package.json
    |   |-- (...vite 其他配置)
```

---
### 配置 workspace

`pnpm-workspace.yaml`
說明有多少內容需要納入 pnpm 工作管制中
```bash
packages:
  - 'main'
  - 'web/**' # 包含了 react / vue 的內容
```


---
### pnpm install

在 root 目錄下執行 `pnpm install` 會自動安裝所有 workspace 的依賴, 
並且會在個別專案中建立一個 `node_modules`,
同時把個專案共同的依賴安裝在最外層.


### 執行專案 

可以個別進行啟動, 而不需要進入資料夾內
`pnpm -F <package-name> <package-script>`
`pnpm -F react-demo dev`
`pnpm --filter react-demo dev`

---

### 新增 common 組件

```bash
/monorepo-test
 |-- package.json
 |-- main
 |   |-- index.js
 |   |-- package.json
 |-- common
 |   |-- index.js # 共用的組件 導出
 |   |-- package.json

 |-- web
    |-- react-demo
    |   |-- package.json
    |   |-- (...vite 其他配置)
    |-- vue-demo
    |   |-- package.json
    |   |-- (...vite 其他配置)
```

react-demo 安裝 => `pnpm -F react-demo add common` 
> 注意內容 安裝後的 deps 應該是顯示 `workspace:<版本號>`, 但有可能會對應到 npm 發布撞名問題.  

安裝成功之後基本上就可以正常使用