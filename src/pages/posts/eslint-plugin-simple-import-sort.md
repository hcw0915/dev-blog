---
public: true
layout: ../../layouts/BlogPost.astro
title: Eslint-plugin-simple-import-sort
createdAt: 1742274629265
updatedAt: 1742274667996
tags:
  - General
  - Blog
heroImage: /placeholder-hero.png
slug: eslint-plugin-simple-import-sort
---

# [筆記] eslint-plugin-simple-import-sort 順序排列

```zsh
pnpm i -D eslint-plugin-simple-import-sort
```

### Group 可以制定特定編組排列

```js
// eslint-config
module.exports = {
  plugins: ['simple-import-sort'],
  rules: {
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // 1. React and third-party packages (node_modules)
          ['^react', '^\\w'],
          // 2. Internal components and modules (aliases like @components)
          ['^@', '^[^.]'],
          // 3. Static files: Images, SVGs, and styles (css, scss, etc.)
          ['^.+\\.(png|jpg|svg|css|scss)$']
        ]
      }
    ],
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  }
}
```