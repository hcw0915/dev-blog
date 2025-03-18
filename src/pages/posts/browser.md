---
public: true
layout: ../../layouts/BlogPost.astro
title: Browser - 強協商, 協商緩存
createdAt: 1741833628423
updatedAt: 1741944222956
tags:
  - General
  - Blog
heroImage: /placeholder-hero.png
slug: browser
---

非第一次請求具有兩種情況取決於 `no-cache` 後續請求是否攜帶 

![clipboard.png](/posts/browser_clipboard-png.png)
- Etag: `if-none-match` 

![clipboard.png](/posts/browser_clipboard-png.png)


- Last-Modified: `if-none-since`

![clipboard.png](/posts/browser_clipboard-png.png)
