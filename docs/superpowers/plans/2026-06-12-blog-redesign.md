# Dev-Blog 改版實作計畫（SEO 修正 + Dark Bento 全站重新設計）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正所有 SEO／模板殘留問題，並以「暗色優先 Dark Bento」風格重新設計每一頁，所有既有功能（i18n、標籤篩選、Playground、主題切換、View Transitions）原封保留。

**Architecture:** Astro 5 靜態站（file-based routing，文章為 `src/pages/posts/*.md` 直接掛 `BlogPost.astro` layout）。改版只動樣式層與 head metadata：設計 token 進 Tailwind config、重複樣式抽成 Astro 元件、OG 圖用 satori 在 build 時生成（新增的唯一依賴）。

**Tech Stack:** Astro 5、Tailwind 3、React islands（既有）、satori + @resvg/resvg-js（新增）、pnpm。

**Spec:** `docs/superpowers/specs/2026-06-12-blog-redesign-design.md`

**驗證方式說明:** 本專案沒有測試框架，每個任務的驗證以 `pnpm build`（必須零錯誤）＋ 對 `dist/` 產物做 grep／檔案檢查＋ `pnpm preview` 目視確認取代單元測試。不要為這次改版引入測試框架（YAGNI）。

**重要背景知識（執行前必讀）:**
- 文章 frontmatter 範例：`public: true` / `slug: knowledge-keyword-rag` / `layout: ../../layouts/BlogPost.astro` / `title: ...` / `createdAt: 1780810884082`（毫秒 timestamp 數字）/ `tags: [AI]` / `heroImage: /placeholder-hero.png`。
- `src/pages/en/posts/[...slug].astro` 只做 redirect 到 `/posts/<slug>`，文章是單語的，不用動。
- 標籤篩選靠 `li` 的 class 含 tag 名稱 ＋ inline script 操作 `style.display`，此機制保留。
- `BaseHead.astro` 內含主題 script 與 View Transitions 進度條 script，動它時不可刪掉這兩段。
- 路徑別名 `@/` 指向 `src/`（見 astro.config.mjs）。

---

### Task 1: SEO 基礎建設＋模板殘留清除（獨立 commit，可立即部署）

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/config.ts`
- Create: `src/pages/rss.xml.ts`
- Create: `public/robots.txt`
- Modify: `src/components/BaseHead.astro`
- Modify: `src/components/Header.astro`（移除無用 import）
- Modify: `src/components/Footer.astro`（移除 Inkdrop 殘留）
- Modify: `src/pages/posts/index.astro`、`src/pages/en/posts/index.astro`（移除 Inkdrop 推廣段落）
- Modify: `src/pages/404.astro`（移除 HOMEPAGE_URL import 與用法）

- [ ] **Step 1.1: 修正 `astro.config.mjs` 的 site**

把 `site: "https://uses.craftz.dog/",` 改成：

```js
  // 換網域時：這裡與 src/config.ts 的 SITE_URL 兩處需同步
  site: "https://antonio-blog-one.vercel.app",
```

（astro.config.mjs 無法 import src 下的 .ts，所以兩處各放一份，互留註解。）

- [ ] **Step 1.2: 改寫 `src/config.ts` 頂部常數**

把 `SITE_TITLE`/`SITE_DESCRIPTION`/`HOMEPAGE_URL` 三行換成（`COLOR_MAP` 不動）：

```ts
export const SITE_TITLE = "Antonio - DevLog"
export const SITE_DESCRIPTION =
  "Antonio 的前端工程筆記：React、TypeScript、Three.js / Shader，以及帶領團隊導入 AI 開發工作流的實戰紀錄。"
// 換網域時：這裡與 astro.config.mjs 的 site 兩處需同步
export const SITE_URL = "https://antonio-blog-one.vercel.app"
```

`HOMEPAGE_URL` 直接刪除——下面步驟會清掉所有 import 它的地方。

- [ ] **Step 1.3: 清除 `HOMEPAGE_URL` 的所有引用**

先跑 `grep -rn "HOMEPAGE_URL" src/` 確認清單，逐一處理：

1. `src/components/Header.astro`：import 行改為 `import { SITE_TITLE } from "@/config"`（markup 沒用到，純移除）。
2. `src/components/Footer.astro`：整檔重写为（移除 Inkdrop logo 與連結；RSS 連結 Task 2 還會再潤飾樣式，這裡先求正確）：

```astro
---
const today = new Date()
---

<footer class="p-6 text-center text-sm text-zinc-500 dark:text-zinc-600">
  <div>
    &copy; {today.getFullYear()} <span>Antonio H</span>. All rights reserved. ·
    <a href="/rss.xml" class="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-400">RSS</a>
  </div>
</footer>
```

3. `src/pages/posts/index.astro` 與 `src/pages/en/posts/index.astro`：
   - import 區移除 `HOMEPAGE_URL`（保留其他）與 `import { IoArrowForward } from "react-icons/io5"`。
   - 刪除整個「writtenWith / learnMore」`<section>`（內含 `href={HOMEPAGE_URL}` 連結的那段）。
4. `src/pages/404.astro`：import 區移除 `HOMEPAGE_URL`；若 markup 中有使用（讀整檔確認），把該連結改為 `href={locale === 'zh' ? '/posts' : '/en/posts'}`。

- [ ] **Step 1.4: 新增 `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { SITE_TITLE, SITE_DESCRIPTION } from '@/config'

export async function GET(context: APIContext) {
  const modules = import.meta.glob('./posts/*.md', { eager: true }) as Record<
    string,
    any
  >
  const posts = Object.values(modules)
    .filter(p => p.frontmatter.public)
    .sort((a, b) => b.frontmatter.createdAt - a.frontmatter.createdAt)

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map(p => ({
      title: p.frontmatter.title,
      pubDate: new Date(p.frontmatter.createdAt),
      link: `/posts/${p.frontmatter.slug}/`,
      categories: p.frontmatter.tags ?? []
    }))
  })
}
```

- [ ] **Step 1.5: 新增 `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://antonio-blog-one.vercel.app/sitemap-index.xml
```

- [ ] **Step 1.6: 強化 `src/components/BaseHead.astro`**

只動 frontmatter 的 Props／常數與 meta 區塊；**檔案底部的兩段 `<script is:inline>`（主題＋進度條）原封保留**。

Props 介面改為：

```ts
export interface Props {
  title: string
  description: string
  image?: string
  article?: {
    publishedTime: string
    modifiedTime?: string
    tags?: string[]
  }
}

const { title, description, image = '/cover.png', article } = Astro.props
const canonical = new URL(Astro.url.pathname, Astro.site)
```

meta 區塊改為（取代現有 Primary/OG/Twitter 三段）：

```astro
<!-- Primary Meta Tags -->
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<link rel="alternate" type="application/rss+xml" title={title} href={new URL('rss.xml', Astro.site)} />

<!-- Open Graph -->
<meta property="og:type" content={article ? 'article' : 'website'} />
<meta property="og:url" content={canonical} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL(image, Astro.site)} />
{
  article && (
    <>
      <meta property="article:published_time" content={article.publishedTime} />
      {article.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {(article.tags ?? []).map(tag => (
        <meta property="article:tag" content={tag} />
      ))}
    </>
  )
}

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content={canonical} />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
<meta property="twitter:image" content={new URL(image, Astro.site)} />
```

- [ ] **Step 1.7: `BlogPost.astro` 傳入 article 資訊**

frontmatter 區新增（`content` 解構處之後）：

```ts
const articleMeta = {
  publishedTime: new Date(createdAt).toISOString(),
  modifiedTime: updatedAt ? new Date(updatedAt).toISOString() : undefined,
  tags
}
```

注意：現有 Props 解構沒有取出 `updatedAt`，要在解構中補上。`<BaseHead title={title} description={description} />` 改為 `<BaseHead title={title} description={description} article={articleMeta} />`。（og:image 接線在 Task 5 做，這裡先不動 image。）

- [ ] **Step 1.8: Build 驗證**

```bash
pnpm build
grep -r "uses.craftz.dog" dist/ | wc -l        # 期望 0
grep -r "inkdrop" dist/index.html | wc -l       # 期望 0
test -f dist/rss.xml && echo RSS_OK             # 期望 RSS_OK
grep -o 'antonio-blog-one' dist/sitemap-0.xml | head -1   # 期望 antonio-blog-one
grep -c 'og:type" content="article"' dist/posts/knowledge-keyword-rag/index.html  # 期望 1
grep -c 'rel="canonical"' dist/index.html       # 期望 1
```

- [ ] **Step 1.9: Commit**

```bash
git add -A
git commit -m "fix: correct site URL, add RSS/robots/canonical/article meta, remove template leftovers"
```

---

### Task 2: 設計 token＋共用元件＋全站外殼（Header/Footer/Body/Content）

**Files:**
- Modify: `tailwind.config.cjs`
- Modify: `src/styles/global.css`
- Modify: `src/components/Body.astro`
- Modify: `src/components/BaseHead.astro`（僅主題 script 預設值一行）
- Modify: `src/components/Content.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Create: `src/components/BentoCard.astro`

- [ ] **Step 2.1: `tailwind.config.cjs` 加入 token**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mplus: ["'M PLUS Rounded 1c'", 'Verdana', 'sans-serif'],
        ptsans: ["'PT Sans'", 'sans-serif'],
        serif: ['Georgia', "'Noto Serif TC'", 'ui-serif', 'serif']
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #22d3ee, #a78bfa)'
      }
    }
  },
  plugins: []
}
```

- [ ] **Step 2.2: `src/styles/global.css` 加入標題字體**

檔案頂部三個 `@import` 後新增一行：

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&display=swap');
```

- [ ] **Step 2.3: 暗色優先——`BaseHead.astro` 主題 script**

`applyTheme()` 內這段：

```js
const theme =
  stored ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light')
```

改為（無記錄偏好時一律深色）：

```js
const theme = stored || 'dark'
```

- [ ] **Step 2.4: `Body.astro` 換底色 token**

class 改為：

```
bg-[#fafaf8] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300 break-words leading-7 transition-colors duration-500
```

（其餘內容——progress bar div、slot、QRModal——不動。）

- [ ] **Step 2.5: 新增 `src/components/BentoCard.astro`**

```astro
---
export interface Props {
  class?: string
  href?: string
}

const { class: className = '', href } = Astro.props
const Tag = href ? 'a' : 'div'
---

<Tag
  href={href}
  class={`block rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none ${
    href ? 'transition-transform duration-300 hover:-translate-y-1' : ''
  } ${className}`}
>
  <slot />
</Tag>
```

- [ ] **Step 2.6: `Content.astro` 改為透明容器**

新設計裡卡片由各頁自己排，Content 只負責寬度：

```astro
---
export interface Props {
  className?: string
}

const { className = '' } = Astro.props
---

<article class={`mt-4 px-4 py-6 mx-auto max-w-5xl ${className}`}>
  <slot />
</article>
```

- [ ] **Step 2.7: `Header.astro` 改版**

`<header>` 開頭 class 改為：

```
fixed w-full p-2 z-20 bg-[#fafaf8]/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200/60 dark:border-white/5 transition-colors
```

Logo 區（`<a href={homePath}>` 內）改為文字 logo：

```astro
<a href={homePath} class="group flex-shrink-0">
  <h2 class="font-bold tracking-tight p-2 text-lg dark:text-zinc-50">
    Antonio<span class="text-transparent bg-clip-text bg-brand-gradient">.dev</span>
  </h2>
</a>
```

其餘（HeaderLink、PlaygroundDropdown、LanguageToggle、ThemeToggle 與排版結構）不動。

- [ ] **Step 2.8: Build＋目視驗證**

```bash
pnpm build && pnpm preview
```

開 http://localhost:4321/posts 確認：深色為預設、header 毛玻璃、footer 有 RSS 連結、無報錯。

- [ ] **Step 2.9: Commit**

```bash
git add -A
git commit -m "feat: design tokens, dark-first default, BentoCard, new header/footer shell"
```

---

### Task 3: 首頁改版（Dark Bento）

**Files:**
- Modify: `src/i18n/translations.ts`
- Rewrite: `src/pages/index.astro`
- Rewrite: `src/pages/en/index.astro`

- [ ] **Step 3.1: `translations.ts` 兩個 locale 各加 `home` 區塊**

`zh` 物件內（與 `about`、`blog` 同層）加：

```ts
home: {
  heroTitle: '前端工程筆記',
  intro: 'Antonio H. · 前端工程師。記錄 React、TypeScript、Three.js / Shader，與團隊導入 AI 開發工作流的實戰心得。',
  playgroundLabel: 'PLAYGROUND',
  playgroundCta: '互動程式實驗場',
  latestPosts: '最新文章',
  viewAll: '全部文章'
},
```

`en` 物件內加：

```ts
home: {
  heroTitle: 'Frontend Engineering Notes',
  intro: 'Antonio H. · Frontend engineer. Notes on React, TypeScript, Three.js / shaders, and bringing AI workflows to a frontend team.',
  playgroundLabel: 'PLAYGROUND',
  playgroundCta: 'Interactive code playground',
  latestPosts: 'Latest posts',
  viewAll: 'All posts'
},
```

若 translations.ts 用 `as const` 或型別約束導致兩邊 key 必須一致，兩邊都加即滿足。

- [ ] **Step 3.2: 重寫 `src/pages/index.astro`**

```astro
---
import BaseHead from "@/components/BaseHead.astro"
import Header from "@/components/Header.astro"
import Footer from "@/components/Footer.astro"
import Body from "@/components/Body.astro"
import BentoCard from "@/components/BentoCard.astro"
import { SITE_TITLE, SITE_DESCRIPTION, COLOR_MAP } from "@/config"
import { formatDate } from "@/i18n/utils"
import { getTranslations } from "@/i18n/translations"

const locale = "zh"
const t = getTranslations(locale)

const posts = (await Astro.glob('./posts/*.md'))
  .filter((p: any) => p.frontmatter.public)
  .sort(
    (a: any, b: any) => b.frontmatter.createdAt - a.frontmatter.createdAt
  )

const heroPosts = posts.slice(0, 3)
const latestPosts = posts.slice(3, 9)

const tagColor = (tags: string[] = []) =>
  COLOR_MAP[(tags[0] ?? '').toLowerCase()] ?? '#a1a1aa'
---

<!doctype html>
<html lang="zh-TW">
  <head>
    <BaseHead title={SITE_TITLE} description={SITE_DESCRIPTION} />
  </head>
  <Body>
    <Header />
    <main class="pt-[88px] pb-8">
      <div class="mx-auto max-w-5xl px-4">
        <!-- Hero Bento -->
        <section class="grid gap-4 md:grid-cols-3">
          <BentoCard class="md:col-span-2 p-8 md:p-10">
            <h1 class="font-serif text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50">
              {t.home.heroTitle}
            </h1>
            <p class="mt-4 text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.home.intro}
            </p>
          </BentoCard>

          <BentoCard
            href="/playground/vanilla"
            class="p-8 flex flex-col justify-between border-violet-300/50 dark:border-violet-400/30 !bg-gradient-to-br from-cyan-500/10 to-violet-500/10 dark:from-cyan-400/15 dark:to-violet-400/15"
          >
            <div class="text-xs font-bold tracking-[0.25em] text-violet-600 dark:text-violet-300">
              {t.home.playgroundLabel}
            </div>
            <div class="mt-8 font-semibold text-zinc-800 dark:text-zinc-100">
              {t.home.playgroundCta} →
            </div>
          </BentoCard>

          {
            heroPosts.map((post: any) => (
              <BentoCard href={post.url} class="p-6">
                <div class="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                  <span
                    class="inline-block w-2.5 h-2.5 rounded-full"
                    style={`background:${tagColor(post.frontmatter.tags)}`}
                  />
                  <span style={`color:${tagColor(post.frontmatter.tags)}`}>
                    {(post.frontmatter.tags ?? [])[0] ?? 'NOTE'}
                  </span>
                  <span class="text-zinc-400 dark:text-zinc-500 font-normal normal-case">
                    {formatDate(post.frontmatter.createdAt, locale)}
                  </span>
                </div>
                <h3 class="mt-3 font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
                  {post.frontmatter.title}
                </h3>
              </BentoCard>
            ))
          }
        </section>

        <!-- 最新文章流 -->
        <section class="mt-14">
          <h2 class="font-serif text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">
            {t.home.latestPosts}
          </h2>
          <ul class="divide-y divide-zinc-200 dark:divide-white/5">
            {
              latestPosts.map((post: any) => (
                <li>
                  <a
                    href={post.url}
                    class="group flex items-baseline justify-between gap-4 py-4"
                  >
                    <span class="flex items-baseline gap-3 min-w-0">
                      <span
                        class="inline-block w-2 h-2 rounded-full flex-shrink-0 translate-y-[-1px]"
                        style={`background:${tagColor(post.frontmatter.tags)}`}
                      />
                      <span class="truncate text-zinc-700 dark:text-zinc-200 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-brand-gradient transition-colors">
                        {post.frontmatter.title}
                      </span>
                    </span>
                    <span class="flex-shrink-0 text-sm text-zinc-400 dark:text-zinc-500">
                      {formatDate(post.frontmatter.createdAt, locale)}
                    </span>
                  </a>
                </li>
              ))
            }
          </ul>
          <div class="mt-6">
            <a
              href="/posts"
              class="text-sm font-semibold text-violet-600 dark:text-violet-300 hover:underline underline-offset-4"
            >
              {t.home.viewAll} →
            </a>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </Body>
</html>
```

- [ ] **Step 3.3: 重寫 `src/pages/en/index.astro`**

與 Step 3.2 完全相同的結構，僅以下差異：
- `const locale = "en"`、`<html lang="en">`
- glob 路徑：`await Astro.glob('../posts/*.md')`
- 連結加語系前綴：Playground 卡 `href="/en/playground/vanilla"`、viewAll `href="/en/posts"`
- 文章連結 `post.url` 指向 `/posts/...`（單語文章，照舊即可——en 列表本來也是連到中文文章）

- [ ] **Step 3.4: Build＋目視驗證**

```bash
pnpm build && pnpm preview
```

確認 `/` 與 `/en/`：hero 卡、Playground 漸層卡、3 張最新文章卡、文章流與「全部文章 →」都正常；舊的 emoji/HELLO 已消失；亮暗兩種主題都檢查。

- [ ] **Step 3.5: Commit**

```bash
git add -A
git commit -m "feat: dark bento homepage (zh + en)"
```

---

### Task 4: OG 封面圖自動生成

**Files:**
- Modify: `package.json`（deps + scripts）
- Modify: `.gitignore`
- Create: `tools/fetch-og-font.mjs`
- Create: `src/pages/og/[slug].png.ts`

- [ ] **Step 4.1: 安裝依賴**

```bash
pnpm add satori @resvg/resvg-js
```

- [ ] **Step 4.2: 新增 `tools/fetch-og-font.mjs`（字型抓取，build 前自動跑）**

CJK 字型太大不進 git，build 時下載並快取到 `.fonts/`（Vercel build 有網路，本機只會下載一次）：

```js
// 下載 OG 圖渲染用的 CJK 字型（satori 需要 otf/ttf 字型資料）
import fs from 'node:fs'
import path from 'node:path'

const FONT_URL =
  'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Bold.otf'
const dest = path.resolve('.fonts/NotoSansCJKtc-Bold.otf')

if (fs.existsSync(dest)) {
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), { recursive: true })
console.log('Downloading OG font (one-time, ~16MB)...')
const res = await fetch(FONT_URL)
if (!res.ok) {
  console.error(`OG font download failed: HTTP ${res.status}`)
  process.exit(1)
}
fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
console.log(`OG font saved to ${dest}`)
```

- [ ] **Step 4.3: `package.json` scripts 加 pre-hooks、`.gitignore` 加 `.fonts/`**

scripts 增加兩行（pnpm 支援 pre-hooks）：

```json
"predev": "node tools/fetch-og-font.mjs",
"prebuild": "node tools/fetch-og-font.mjs",
```

`.gitignore` 加：

```
# OG image font cache
.fonts/
```

- [ ] **Step 4.4: 新增 `src/pages/og/[slug].png.ts`**

```ts
import type { APIRoute } from 'astro'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import { COLOR_MAP } from '@/config'

const fontPath = path.resolve('.fonts/NotoSansCJKtc-Bold.otf')

export async function getStaticPaths() {
  const modules = import.meta.glob('../posts/*.md', { eager: true }) as Record<
    string,
    any
  >
  return Object.values(modules)
    .filter(p => p.frontmatter.public)
    .map(p => ({
      params: { slug: p.frontmatter.slug },
      props: {
        title: p.frontmatter.title as string,
        tags: (p.frontmatter.tags ?? []) as string[],
        date: new Date(p.frontmatter.createdAt)
      }
    }))
}

export const GET: APIRoute = async ({ props }) => {
  if (!fs.existsSync(fontPath)) {
    throw new Error(
      `OG font missing at ${fontPath} — run \`node tools/fetch-og-font.mjs\` first`
    )
  }
  const fontData = fs.readFileSync(fontPath)
  const { title, tags, date } = props as {
    title: string
    tags: string[]
    date: Date
  }
  const accent = COLOR_MAP[(tags[0] ?? '').toLowerCase()] ?? '#22d3ee'
  const dateText = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'Noto Sans TC'
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      backgroundColor: accent
                    }
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '28px', color: '#a1a1aa' },
                    children: tags.length ? tags.join(' · ') : 'DevLog'
                  }
                }
              ]
            }
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: title.length > 24 ? '60px' : '76px',
                fontWeight: 700,
                lineHeight: 1.3
              },
              children: title
            }
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '28px',
                color: '#71717a'
              },
              children: [
                { type: 'div', props: { children: 'Antonio - DevLog' } },
                { type: 'div', props: { children: dateText } }
              ]
            }
          }
        ]
      }
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Noto Sans TC', data: fontData, weight: 700, style: 'normal' }
      ]
    }
  )

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 }
  })
    .render()
    .asPng()

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' }
  })
}
```

- [ ] **Step 4.5: Build 驗證**

```bash
pnpm build
ls dist/og/ | wc -l                                   # 期望 ≈53（每篇 public 文章一張）
file dist/og/knowledge-keyword-rag.png                # 期望 PNG image data, 1200 x 630
```

並打開其中 2-3 張 PNG 目視確認：深色底、中文標題正常渲染（無豆腐字）、標籤色點正確。

- [ ] **Step 4.6: Commit**

```bash
git add -A
git commit -m "feat: build-time OG image generation with satori (auto cover for all posts)"
```

---

### Task 5: 文章內頁改版（閱讀排版＋TOC＋上下篇＋OG 接線）

**Files:**
- Modify: `src/i18n/translations.ts`（加 `post` 區塊）
- Rewrite: `src/layouts/BlogPost.astro`

- [ ] **Step 5.1: translations 加 `post` 區塊**

zh：

```ts
post: {
  prev: '上一篇',
  next: '下一篇',
  minRead: '分鐘閱讀'
},
```

en：

```ts
post: {
  prev: 'Previous',
  next: 'Next',
  minRead: 'min read'
},
```

- [ ] **Step 5.2: 重寫 `src/layouts/BlogPost.astro`**

要點（完整檔案如下）：
- Props 從 legacy `content` 改用 Astro Markdown layout 標準的 `frontmatter` / `headings` / `rawContent`。
- 封面：手動 hero（frontmatter 非 placeholder 或 `public/hero/<slug>.png`）才在頁內顯示；**沒有手動圖時頁內不放封面**（自動 OG 圖含標題文字，放頁內會跟 H1 重複）。og:image 一律有值：手動圖 → `/og/<slug>.png`。
- 閱讀時間：以去空白字元數 / 400 估算（中文為主）。
- TOC：depth 2-3 的 headings，桌機（xl 以上）右側 sticky，IntersectionObserver 高亮；行動裝置顯示為文頂可收合 `<details>`。
- 上一篇/下一篇：glob 全部文章按 createdAt 排序，以 slug 定位。

```astro
---
import BaseHead from "@/components/BaseHead.astro"
import Header from "@/components/Header.astro"
import Footer from "@/components/Footer.astro"
import Body from "@/components/Body.astro"
import { COLOR_MAP } from "@/config"
import { getLocaleFromPath, formatDate } from "@/i18n/utils"
import { getTranslations } from "@/i18n/translations"
import fs from "node:fs"
import path from "node:path"

const { frontmatter, headings, rawContent } = Astro.props as {
  frontmatter: {
    title: string
    description?: string
    createdAt: number
    updatedAt?: number
    heroImage?: string
    tags?: string[]
    slug: string
  }
  headings: { depth: number; slug: string; text: string }[]
  rawContent: () => string
}

const { title, description = '', heroImage, createdAt, updatedAt, tags = [], slug } = frontmatter

const locale = getLocaleFromPath(Astro.url.pathname)
const t = getTranslations(locale)

// 封面優先序：frontmatter 自訂 → public/hero/<slug>.png →（頁內不顯示，og 用自動生成圖）
const heroFile = path.resolve(`public/hero/${slug}.png`)
const localHero = fs.existsSync(heroFile) ? `/hero/${slug}.png` : null
const customHero =
  (heroImage && heroImage !== '/placeholder-hero.png' ? heroImage : null) ||
  localHero
const ogImage = customHero ?? `/og/${slug}.png`

const articleMeta = {
  publishedTime: new Date(createdAt).toISOString(),
  modifiedTime: updatedAt ? new Date(updatedAt).toISOString() : undefined,
  tags
}

// 閱讀時間：中文為主，以 400 字/分鐘估算
const minutes = Math.max(1, Math.round(rawContent().replace(/\s/g, '').length / 400))

// 上一篇 / 下一篇（依 createdAt 新→舊）
const allPosts = Object.values(
  import.meta.glob('../pages/posts/*.md', { eager: true }) as Record<string, any>
)
  .filter(p => p.frontmatter.public)
  .sort((a, b) => b.frontmatter.createdAt - a.frontmatter.createdAt)
const idx = allPosts.findIndex(p => p.frontmatter.slug === slug)
const newerPost = idx > 0 ? allPosts[idx - 1] : null
const olderPost = idx >= 0 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null

const toc = headings.filter(h => h.depth >= 2 && h.depth <= 3)

const tagColor = (tag: string) => COLOR_MAP[tag.toLowerCase()] ?? '#a1a1aa'

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: articleMeta.publishedTime,
  dateModified: articleMeta.modifiedTime ?? articleMeta.publishedTime,
  author: { '@type': 'Person', name: 'Antonio Hou' },
  image: new URL(ogImage, Astro.site).href
})
---

<!doctype html>
<html lang={locale === 'zh' ? 'zh-TW' : 'en'}>
  <head>
    <BaseHead title={title} description={description} image={ogImage} article={articleMeta} />
    <script type="application/ld+json" set:html={jsonLd} />
  </head>

  <Body>
    <Header />
    <style is:global>
      main article.markdown-content {
        h1, h2, h3, h4, h5 {
          @apply font-bold font-serif my-3 text-zinc-900 dark:text-zinc-50 scroll-mt-24;
        }
        h1 { @apply text-3xl; }
        h2 { @apply text-2xl mt-10; }
        h3 { @apply text-xl mt-8; }
        h4 { @apply text-lg; }
        img { @apply border border-zinc-200 dark:border-white/10 rounded-xl mb-6 w-full; }
        p { @apply mb-6 leading-loose; }
        a { @apply underline underline-offset-2 text-violet-600 dark:text-violet-300 decoration-violet-400/60; }
        table { @apply table-auto border border-zinc-200 dark:border-white/10 rounded-lg; }
        th { @apply border dark:border-white/10 font-bold p-4 pb-3 text-left; }
        td { @apply border border-zinc-200 dark:border-white/10 p-4; }
        hr { @apply border-zinc-200 dark:border-white/10 my-6; }
        blockquote { @apply px-4 my-6 border-l-4 border-l-cyan-400/60 text-zinc-600 dark:text-zinc-400; }
        ul { @apply list-disc list-outside pl-4 mb-4; }
        ol { @apply list-decimal list-outside pl-4 mb-4; }
        pre { @apply rounded-xl p-4 mb-6 overflow-x-auto text-sm; }
        :not(pre) > code { @apply bg-zinc-100 dark:bg-white/10 rounded px-1.5 py-0.5 text-[0.9em] font-mono; }
      }
      .toc-link.active { color: #a78bfa; }
    </style>

    <main class="pt-[88px] pb-8">
      <div class="mx-auto max-w-6xl px-4 xl:grid xl:grid-cols-[1fr_220px] xl:gap-10">
        <article class="markdown-content w-full max-w-[68ch] mx-auto min-w-0">
          {
            customHero && (
              <img
                class="border border-zinc-200 dark:border-white/10 rounded-2xl aspect-[15/6] w-full object-cover mb-8"
                src={customHero}
                alt=""
              />
            )
          }

          <div class="text-sm flex flex-wrap items-center gap-3 text-zinc-400 dark:text-zinc-500">
            <span>{formatDate(createdAt, locale)}</span>
            <span>·</span>
            <span>{minutes} {t.post.minRead}</span>
            {
              tags.map(tag => (
                <span
                  class="text-xs font-bold tracking-wider uppercase"
                  style={`color:${tagColor(tag)}`}
                >
                  {tag}
                </span>
              ))
            }
          </div>
          <h1 class="font-serif text-3xl md:text-4xl my-3 !mt-2 text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <hr class="border-zinc-200 dark:border-white/10 my-6" />

          {
            toc.length > 0 && (
              <details class="xl:hidden mb-6 rounded-xl border border-zinc-200 dark:border-white/10 p-4 text-sm">
                <summary class="cursor-pointer font-semibold">TOC</summary>
                <ul class="mt-2 space-y-1.5 !list-none !pl-0">
                  {toc.map(h => (
                    <li class={h.depth === 3 ? 'pl-4' : ''}>
                      <a class="!no-underline !text-zinc-500 dark:!text-zinc-400 hover:!text-violet-500" href={`#${h.slug}`}>
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )
          }

          <slot />

          <nav class="mt-12 grid sm:grid-cols-2 gap-3 not-prose">
            {
              olderPost ? (
                <a
                  href={olderPost.url}
                  class="!no-underline block rounded-2xl border border-zinc-200 dark:border-white/10 p-4 hover:border-violet-400/50 transition-colors"
                >
                  <div class="text-xs text-zinc-400 dark:text-zinc-500 mb-1">← {t.post.prev}</div>
                  <div class="text-sm font-semibold !text-zinc-700 dark:!text-zinc-200">
                    {olderPost.frontmatter.title}
                  </div>
                </a>
              ) : (
                <span />
              )
            }
            {
              newerPost && (
                <a
                  href={newerPost.url}
                  class="!no-underline block rounded-2xl border border-zinc-200 dark:border-white/10 p-4 text-right hover:border-violet-400/50 transition-colors"
                >
                  <div class="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{t.post.next} →</div>
                  <div class="text-sm font-semibold !text-zinc-700 dark:!text-zinc-200">
                    {newerPost.frontmatter.title}
                  </div>
                </a>
              )
            }
          </nav>
        </article>

        {
          toc.length > 0 && (
            <aside class="hidden xl:block">
              <nav class="sticky top-24 text-sm" id="toc-nav">
                <div class="font-bold text-xs tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
                  TOC
                </div>
                <ul class="space-y-2 border-l border-zinc-200 dark:border-white/10">
                  {toc.map(h => (
                    <li class={h.depth === 3 ? 'pl-7' : 'pl-3'}>
                      <a
                        class="toc-link block text-zinc-500 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-300 leading-snug"
                        href={`#${h.slug}`}
                        data-heading={h.slug}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )
        }
      </div>
    </main>
    <Footer />

    <script is:inline>
      function initToc() {
        const nav = document.getElementById('toc-nav')
        if (!nav) return
        const links = nav.querySelectorAll('.toc-link')
        const headings = [...links]
          .map(l => document.getElementById(l.dataset.heading))
          .filter(Boolean)
        if (!headings.length) return

        const observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              const link = nav.querySelector(
                `[data-heading="${entry.target.id}"]`
              )
              if (!link) return
              if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active'))
                link.classList.add('active')
              }
            })
          },
          { rootMargin: '-80px 0px -70% 0px' }
        )
        headings.forEach(h => observer.observe(h))
      }
      document.addEventListener('astro:page-load', initToc)
    </script>
  </Body>
</html>
```

注意：Task 1 Step 1.7 在舊版 layout 上加的 `articleMeta` 已整合進此重寫版本。

- [ ] **Step 5.3: Build 驗證**

```bash
pnpm build
grep -o 'og:image" content="[^"]*"' dist/posts/knowledge-keyword-rag/index.html
# knowledge-keyword-rag 有手動 hero，期望 .../hero/knowledge-keyword-rag.png
grep -o 'og:image" content="[^"]*"' dist/posts/ts-infer/index.html
# 無手動 hero，期望 .../og/ts-infer.png
grep -c 'application/ld+json' dist/posts/ts-infer/index.html   # 期望 1
```

`pnpm preview` 目視：長文（knowledge-keyword-rag）桌機右側 TOC 捲動高亮、窄視窗 TOC 變 details、上下篇卡片、閱讀時間顯示、亮暗兩主題下中文行距舒適。

- [ ] **Step 5.4: Commit**

```bash
git add -A
git commit -m "feat: editorial post layout with TOC, prev/next nav, reading time, og wiring"
```

---

### Task 6: 文章列表頁（摘要＋搜尋＋年份分隔）

**Files:**
- Modify: `src/i18n/translations.ts`（`blog` 區塊加一個 key）
- Rewrite: `src/pages/posts/index.astro`
- Rewrite: `src/pages/en/posts/index.astro`

- [ ] **Step 6.1: translations `blog` 區塊加 searchPlaceholder**

zh 的 `blog` 物件內加 `searchPlaceholder: '搜尋文章標題…'`，en 加 `searchPlaceholder: 'Search posts…'`。（`writtenWith`/`learnMore` 兩個 key 此時已無人使用，可一併刪除。）

- [ ] **Step 6.2: 重寫 `src/pages/posts/index.astro`**

保留：既有的標籤篩選 script 與 `data-tags` 機制、hero 圖掃描邏輯、`getSlug`。
新增：摘要函式、搜尋框＋script、年份分隔、卡片新樣式。完整檔案：

```astro
---
import BaseHead from "@/components/BaseHead.astro"
import Header from "@/components/Header.astro"
import Footer from "@/components/Footer.astro"
import { SITE_TITLE, SITE_DESCRIPTION, COLOR_MAP } from "@/config"
import Body from "@/components/Body.astro"
import Content from "@/components/Content.astro"
import { getLocaleFromPath, formatDate } from "@/i18n/utils"
import { getTranslations } from "@/i18n/translations"
import fs from "node:fs"
import path from "node:path"

const locale = getLocaleFromPath(Astro.url.pathname)
const t = getTranslations(locale)

// 建置時掃描 public/hero/ 內現有的封面圖，避免逐篇做 fs 檢查
const heroDir = path.resolve("public/hero")
const heroSet = new Set(
  fs.existsSync(heroDir)
    ? fs.readdirSync(heroDir).map(f => f.replace(/\.(png|jpg|jpeg|webp)$/i, ""))
    : []
)
const getSlug = (filePath: string) =>
  filePath.split("/").pop()!.replace(/\.md$/, "")

const posts = (await Astro.glob('../posts/*.md'))
  .filter((p: any) => p.frontmatter.public)
  .sort(
    (a: any, b: any) => b.frontmatter.createdAt - a.frontmatter.createdAt
  )

// 摘要：優先 frontmatter.description，否則取內文第一段（接受引言段，跳過標題/圖/程式碼/表格）
const getExcerpt = (post: any): string => {
  if (post.frontmatter.description) return post.frontmatter.description
  const raw: string = post.rawContent()
  const para = raw
    .split(/\n{2,}/)
    .map(s => s.trim())
    .find(
      s =>
        s &&
        !s.startsWith('#') &&
        !s.startsWith('![') &&
        !s.startsWith('```') &&
        !s.startsWith('|') &&
        !s.startsWith('---')
    )
  if (!para) return ''
  const text = para
    .replace(/^>\s?/gm, '')
    .replace(/[#*`_\[\]]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 80 ? text.slice(0, 80) + '…' : text
}

// 年份分隔：標記每年的第一篇
let lastYear = 0
const rows = posts.map((post: any) => {
  const year = new Date(post.frontmatter.createdAt).getFullYear()
  const isNewYear = year !== lastYear
  lastYear = year
  return { post, year: isNewYear ? year : null }
})

const tags = posts.map((p: any) => p.frontmatter.tags).flat()
const uniqueTags = ['All', ...new Set(tags)]

const getGradientStyle = (tagArray: string[]) => {
  const colors = (tagArray ?? [])
    .map(tag => COLOR_MAP[tag.toLowerCase()])
    .sort()
    .filter(Boolean)
  if (colors.length === 0) {
    return { background: `linear-gradient(135deg, #3f3f46, #18181b)` }
  }
  return { background: `linear-gradient(135deg, ${colors.join(', ')})` }
}
---

<!doctype html>
<html lang={locale === 'zh' ? 'zh-TW' : 'en'}>
  <head>
    <BaseHead title={`Posts - ${SITE_TITLE}`} description={SITE_DESCRIPTION} />
  </head>

  <Body>
    <Header />
    <main class="pt-[72px]">
      <Content>
        {/* 搜尋 + 標籤篩選 */}
        <section class="mb-8 space-y-4">
          <input
            id="blogSearch"
            type="search"
            placeholder={t.blog.searchPlaceholder}
            class="w-full sm:max-w-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2 text-sm outline-none focus:border-violet-400/60 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
          <div
            class="flex flex-wrap gap-2"
            id="tags"
            data-tags={uniqueTags.join(',')}
          >
            {
              uniqueTags.map(tag => (
                <button
                  data-type={tag}
                  id="blogFilter"
                  class="text-sm border border-zinc-300 dark:border-white/15 text-zinc-600 dark:text-zinc-400 rounded-full px-3 py-0.5 transition-colors"
                >
                  {tag === 'All' ? t.blog.all : tag}
                </button>
              ))
            }
          </div>
        </section>

        {/* 文章列表 */}
        <section>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {
              rows.map(({ post, year }: any) => {
                const tagClasses = post.frontmatter.tags?.join(' ') || ''
                const slug = getSlug(post.file)
                const hasHero = heroSet.has(slug)
                return (
                  <>
                    {year && (
                      <li class="col-span-full flex items-center gap-3 mt-4 first:mt-0">
                        <span class="font-serif text-xl font-bold text-zinc-400 dark:text-zinc-600">
                          {year}
                        </span>
                        <span class="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                      </li>
                    )}
                    <li class={tagClasses} data-post-title={post.frontmatter.title}>
                      <a href={post.url} class="group block rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                        <div
                          class="relative w-full h-[150px] overflow-hidden"
                          style={getGradientStyle(post.frontmatter.tags || [])}
                        >
                          {hasHero && (
                            <img
                              src={`/hero/${slug}.png`}
                              alt=""
                              loading="lazy"
                              class="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          <h2
                            class="absolute inset-x-0 bottom-0 p-3 text-white font-bold leading-snug"
                            style="text-shadow:0 1px 3px rgba(0,0,0,0.5);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden"
                          >
                            {post.frontmatter.title}
                          </h2>
                        </div>
                        <div class="p-3">
                          <div class="text-xs text-zinc-400 dark:text-zinc-500">
                            {formatDate(post.frontmatter.createdAt, locale)}
                          </div>
                          {getExcerpt(post) && (
                            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                              {getExcerpt(post)}
                            </p>
                          )}
                        </div>
                      </a>
                    </li>
                  </>
                )
              })
            }
          </ul>
        </section>
      </Content>
    </main>
    <Footer />

    <style is:global>
      .hidden-by-search {
        display: none !important;
      }
    </style>

    <script is:inline>
      function initBlogFilter() {
        const input = document.querySelectorAll('#blogFilter')
        if (!input.length) return

        function hideBlogs(evt) {
          let selectedTag = evt.currentTarget.getAttribute('data-type')
          let tagElement = document.getElementById('tags')
          let tags = tagElement.dataset.tags
          tags = tags.split(',')
          tags.splice(tags.indexOf(selectedTag), 1)

          if (selectedTag === 'All') {
            history.pushState({ tag: selectedTag }, '', window.location.pathname)
          } else {
            history.pushState(
              { tag: selectedTag },
              '',
              `?c=${selectedTag.toLowerCase()}`
            )
          }

          input.forEach(e => {
            const active = e.getAttribute('data-type') === selectedTag
            e.style.background = active ? '#7c3aed' : 'transparent'
            e.style.color = active ? '#ffffff' : ''
            e.style.borderColor = active ? '#7c3aed' : ''
          })

          let elementsToShow = document.getElementsByClassName(selectedTag)
          for (let i = 0; i < elementsToShow.length; i++) {
            elementsToShow[i].style.display = 'block'
          }

          if (selectedTag !== 'All') {
            tags.forEach(t => {
              const elementsToHide = document.getElementsByClassName(t)
              for (let i = 0; i < elementsToHide.length; i++) {
                elementsToHide[i].style.display = 'none'
              }
            })
          }

          const elementsToHide = document.getElementsByClassName(selectedTag)
          for (let i = 0; i < elementsToHide.length; i++) {
            elementsToHide[i].style.display = 'block'
          }

          if (selectedTag === 'All') {
            tags.forEach(t => {
              const elementsToHide = document.getElementsByClassName(t)
              for (let i = 0; i < elementsToHide.length; i++) {
                elementsToHide[i].style.display = 'block'
              }
            })
          }
        }

        input.forEach(e => {
          e.addEventListener('click', hideBlogs)
        })
      }

      function initBlogSearch() {
        const search = document.getElementById('blogSearch')
        if (!search) return
        search.addEventListener('input', () => {
          const q = search.value.trim().toLowerCase()
          document.querySelectorAll('[data-post-title]').forEach(li => {
            const hit = li
              .getAttribute('data-post-title')
              .toLowerCase()
              .includes(q)
            li.classList.toggle('hidden-by-search', !(q === '' || hit))
          })
        })
      }

      document.addEventListener('astro:page-load', () => {
        initBlogFilter()
        initBlogSearch()
      })
    </script>
  </Body>
</html>
```

（與舊版的差異：篩選 active 色由 `#4f46e5` 改 `#7c3aed` 配新品牌色；其餘篩選邏輯一字不改。）

- [ ] **Step 6.3: 重寫 `src/pages/en/posts/index.astro`**

與 Step 6.2 完全相同，僅 glob 路徑差異：`await Astro.glob('../../posts/*.md')`（en/posts 比 posts 深一層）。其餘 i18n 由 `getLocaleFromPath` 自動處理。

- [ ] **Step 6.4: Build＋目視驗證**

```bash
pnpm build && pnpm preview
```

`/posts`：搜尋框輸入「shader」只剩 shader 相關文章；點標籤 `React` 篩選正常、再點 All 恢復；年份分隔線正確（2026 在最上）；每張卡有摘要。`/en/posts` 同樣檢查。

- [ ] **Step 6.5: Commit**

```bash
git add -A
git commit -m "feat: posts index with search, excerpts, year dividers (zh + en)"
```

---

### Task 7: About 頁改版＋履歷檔名修正

**Files:**
- Rename: `public/Antonio_Hou_260228 .pdf` → `public/Antonio_Hou_260228.pdf`
- Modify: `src/config/about.ts`（PDF_PATH）
- Modify: `src/pages/about/index.astro`、`src/pages/en/about/index.astro`
- Modify: `src/components/SectionTitle.astro`、`SkillTag.astro`、`WorkExperience.astro`、`EducationCard.astro`、`ProjectLink.astro`

- [ ] **Step 7.1: 履歷改名**

```bash
git mv "public/Antonio_Hou_260228 .pdf" public/Antonio_Hou_260228.pdf
```

讀 `src/config/about.ts`，把 `PDF_PATH` 的值改為 `/Antonio_Hou_260228.pdf`（注意原值含空格／%20，依實際內容修正）。

- [ ] **Step 7.2: 子元件換新 token（精確替換）**

| 檔案 | 舊 | 新 |
|---|---|---|
| SectionTitle.astro | `text-2xl font-bold mb-6 dark:text-white text-zinc-800 border-b border-zinc-200 dark:border-zinc-700 pb-2` | `font-serif text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50 border-b border-zinc-200 dark:border-white/10 pb-2` |
| SkillTag.astro（primary） | `bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300` | `bg-violet-100 dark:bg-violet-400/15 text-violet-700 dark:text-violet-300` |
| SkillTag.astro（secondary） | `bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300` | `bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300` |
| WorkExperience.astro | `border-l-2 border-indigo-500 pl-6` | `border-l-2 border-violet-400/70 pl-6` |
| EducationCard.astro | `border-l-2 border-indigo-500 pl-6` | `border-l-2 border-violet-400/70 pl-6` |
| ProjectLink.astro | `text-indigo-600 dark:text-indigo-400` | `text-violet-600 dark:text-violet-300` |

- [ ] **Step 7.3: About 頁面殼層改版（zh 與 en 同步操作）**

兩個 about/index.astro 做相同修改：

1. `main` class：`pt-[64px]` → `pt-[72px]`。
2. import 區加 `import BentoCard from "@/components/BentoCard.astro"`。
3. 每個 `<section class="mb-12">` 改為用 BentoCard 包裹內容：`<section class="mb-6"><BentoCard class="p-6 md:p-8"> ...原內容... </BentoCard></section>`（基本介紹那個 section 也照做）。
4. 基本介紹區：h1 加 `font-serif`；subtitle 的 `text-indigo-600 dark:text-indigo-400` → `text-transparent bg-clip-text bg-brand-gradient`；頭像 border `border-indigo-300 dark:border-indigo-600` → `border-violet-300/60 dark:border-violet-400/40`；下載按鈕 `bg-indigo-600 hover:bg-indigo-700` → `bg-violet-600 hover:bg-violet-500`。

- [ ] **Step 7.4: About 頁加 Person JSON-LD（zh 與 en 都加）**

兩個 about/index.astro 的 frontmatter 加：

```ts
const personJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Antonio Hou',
  jobTitle: 'Frontend Developer',
  url: 'https://antonio-blog-one.vercel.app/about'
})
```

`<head>` 內 BaseHead 之後加：

```astro
<script type="application/ld+json" set:html={personJsonLd} />
```

- [ ] **Step 7.5: Build＋目視驗證＋確認履歷可下載**

```bash
pnpm build && pnpm preview
curl -sI http://localhost:4321/Antonio_Hou_260228.pdf | head -1   # 期望 HTTP 200
```

目視 `/about` 與 `/en/about`：卡片化排版、亮暗主題、下載按鈕。

- [ ] **Step 7.6: Commit**

```bash
git add -A
git commit -m "feat: bento-style about page, person json-ld, fix resume filename"
```

---

### Task 8: Playground＋404＋最終驗收

**Files:**
- Modify: `src/pages/playground/vanilla/index.astro`、`react/index.astro`、`[id].astro` ×2、en 對應 4 檔（共 8 檔，依實際存在為準）
- Modify: `src/components/PlaygroundCard.astro`
- Rewrite: `src/pages/404.astro`
- Modify: `src/i18n/translations.ts`（404 文案）

- [ ] **Step 8.1: Playground 列表與卡片換 token**

讀 `src/components/PlaygroundCard.astro` 與各 playground 頁面，套用同一張映射表（與 Task 7 相同原則）：

| 舊 pattern | 新 |
|---|---|
| `bg-white dark:bg-zinc-800/50`（卡片底） | `bg-white dark:bg-white/[0.04]` |
| `border-slate-200 dark:border-zinc-700`（各種邊框） | `border-zinc-200 dark:border-white/10` |
| `indigo-` 系強調色 | `violet-` 系（同 Task 7 映射） |
| 頁面標題 `font-mplus` / 無字體 class | 加 `font-serif` |
| `pt-[64px]` | `pt-[72px]` |

CodePlayground.tsx / ReactCodePlayground.tsx（Monaco 與分割面板）**功能與內部樣式不動**，只在其外層容器（playground [id].astro 頁面裡）套上述邊框/底色映射。

- [ ] **Step 8.2: translations 加 404 文案**

zh：

```ts
notFound: {
  title: '找不到這個頁面',
  desc: '它可能被移走了，或是網址打錯了。',
  home: '回首頁',
  posts: '看文章'
},
```

en：

```ts
notFound: {
  title: 'Page not found',
  desc: 'It may have moved, or the URL is wrong.',
  home: 'Back home',
  posts: 'Browse posts'
},
```

- [ ] **Step 8.3: 重寫 `src/pages/404.astro`**

```astro
---
import BaseHead from "@/components/BaseHead.astro"
import Header from "@/components/Header.astro"
import Footer from "@/components/Footer.astro"
import Body from "@/components/Body.astro"
import { SITE_TITLE, SITE_DESCRIPTION } from "@/config"
import { getLocaleFromPath } from "@/i18n/utils"
import { defaultLocale, getTranslations } from "@/i18n/translations"

const locale = getLocaleFromPath(Astro.url.pathname)
const t = getTranslations(locale)

const homePath = locale === defaultLocale ? '/' : `/${locale}/`
const postsPath = locale === defaultLocale ? '/posts' : `/${locale}/posts`
---

<!doctype html>
<html lang={locale === 'zh' ? 'zh-TW' : 'en'}>
  <head>
    <BaseHead title={`404 - ${SITE_TITLE}`} description={SITE_DESCRIPTION} />
  </head>
  <Body>
    <Header />
    <main class="pt-[72px]">
      <div class="mx-auto max-w-5xl px-4 py-24 text-center">
        <div class="font-serif text-7xl font-bold text-transparent bg-clip-text bg-brand-gradient">
          404
        </div>
        <h1 class="font-serif text-2xl font-bold mt-4 text-zinc-900 dark:text-zinc-50">
          {t.notFound.title}
        </h1>
        <p class="mt-2 text-zinc-500 dark:text-zinc-400">{t.notFound.desc}</p>
        <div class="mt-8 flex justify-center gap-4">
          <a
            href={homePath}
            class="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {t.notFound.home}
          </a>
          <a
            href={postsPath}
            class="rounded-xl border border-zinc-300 dark:border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:border-violet-400/60 transition-colors"
          >
            {t.notFound.posts}
          </a>
        </div>
      </div>
    </main>
    <Footer />
  </Body>
</html>
```

- [ ] **Step 8.4: 全站最終驗收**

```bash
pnpm build && pnpm preview
```

逐項檢查（亮＋暗各跑一輪）：
1. `/`、`/en/`：bento 首頁、語言切換、主題切換
2. `/posts`：標籤篩選、搜尋、年份、卡片 hover
3. 任一長文：TOC 高亮、上下篇、程式碼區塊、表格、圖片
4. `/about`：卡片排版、履歷下載
5. `/playground/vanilla`、`/playground/react`：列表＋打開一個 playground，Monaco 編輯與預覽功能正常
6. `/en/posts/knowledge-keyword-rag` redirect 到 `/posts/knowledge-keyword-rag`
7. 隨便打錯網址 → 新 404
8. `dist/rss.xml`、`dist/robots.txt`、`dist/sitemap-index.xml`、`dist/og/*.png` 都存在且內容正確

- [ ] **Step 8.5: Commit＋部署**

```bash
git add -A
git commit -m "feat: playground restyle, new 404, final polish"
git push
```

push 後 Vercel 自動部署，部署完成後線上驗證：

```bash
curl -s https://antonio-blog-one.vercel.app/sitemap-index.xml | grep -o 'antonio-blog-one' | head -1
curl -sI https://antonio-blog-one.vercel.app/rss.xml | head -1
curl -sI https://antonio-blog-one.vercel.app/og/ts-infer.png | head -1
```

三項都正確即完成。提醒使用者到 Google Search Console 重新提交 sitemap。
