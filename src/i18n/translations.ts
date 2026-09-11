export type Locale = 'zh' | 'en'

export const defaultLocale: Locale = 'zh'
export const locales: Locale[] = ['zh', 'en']

export const translations = {
  zh: {
    // About page
    about: {
      title: 'Antonio Hou',
      subtitle: '前端工程師',
      intro: '化學材料工程系畢業，自學轉職前端，2022 年 12 月開始前端工程師生涯，目前在 Brilliant Gaming 擔任中高階前端工程師。工作重心是 Next.js 服務端渲染、首屏效能與多語系 SEO，也負責活動 SDK 與嵌入式 UI 的樣式隔離。工作之外研究 Three.js 與 Shader，並在團隊裡推動 AI 輔助開發流程。',
      downloadResume: '下載履歷 PDF',
      contact: '聯絡方式',
      skills: '技能',
      familiarTech: '較熟悉技術',
      experiencedTech: '具開發經驗',
      workExperience: '工作經驗',
      languages: '語言能力',
      scanQRCode: '掃描二維碼訪問',
      highlightsTitle: '成果',
      highlights: [
        { value: '3+', label: '年前端開發經驗', note: '2022 年 12 月起' },
        { value: '−65%', label: 'webpack 建置時間', note: '187 秒降到 66 秒' },
        { value: '+42%', label: '頁面圖片載入速度', note: '圖片策略優化' },
        { value: '0 → 1', label: '多環境網站平台', note: 'Next.js 15 SSR' }
      ],
      links: {
        github: 'GitHub',
        email: 'Email',
        qr: '顯示 QR code',
        caseStudy: '看案例',
        source: '原始碼',
        article: '讀文章'
      },
      // Work experience
      work: {
        brilliantGaming: {
          company: 'Brilliant Gaming (Armenia)',
          title: 'Mid–Sr. Frontend Developer',
          period: 'May 2025 - Present',
          responsibilities: [
            'Solidjs 網站開發，組件整合與溝通建議 (舊專案)',
            'Next.js 15 包網開發 (Server Side Render) (新專案)',
            '參與 0 - 1 專案基礎建設，多環境設定建立不同盤口包網',
            '基礎組件設計管理，美術團隊溝通與管理組件規格',
            '首屏資源效能優化手段 (服務端渲染，動態導入等)',
            '動態 SEO 建立，配合多語系建立對應 sitemap 與頁面標籤',
            '活動類型私有包開發，SDK 導出與 iframe 方案處理'
          ]
        },
        yingtong: {
          company: '盈通管理顧問有限公司',
          title: 'Mid. Frontend Developer',
          period: 'Dec 2024 - May 2025',
          responsibilities: [
            'React 16 (class + function) Next 12，進行官網/ 後台維護作業',
            'webpack 優化 (打包時間從 187s 減少至 66s)'
          ]
        },
        worldEntertainment: {
          company: 'World Entertainment (Fly Asian)',
          title: 'Jr. Frontend Developer',
          period: 'Oct 2023 - Oct 2024',
          responsibilities: [
            '主要負責遊戲開發 / 官網迭代 / 平台維護，私有包維護(包含 百家樂/番攤/輪盤/彩球)',
            '圖片優化，提昇網頁圖片載入速度 42%',
            '編寫 自定義 Eslint 規則，確保專案風格',
            '透過 SVG style-components Tailwind 建立 web/h5 遊戲介面',
            'CDD 組件驅動開發，提供其他開發者使用',
            'Pixel perfect UI 高完成度',
            '重構原生 JS 專案，Next + payload 3 官網製作/ CMS 製作'
          ]
        },
        heling: {
          company: '合凌科技',
          title: 'Jr. Frontend Developer',
          period: 'Dec 2022 - Aug 2023',
          responsibilities: [
            'Three js 智慧廠區專案維護',
            '建立專案版控制度 (git)',
            '引入 zustand 替換 useContext 帶來的渲染效能問題',
            '撰寫專案文件與彙整',
            '配合 React-hook-form 開發硬體控制系統'
          ]
        }
      },
      // Projects
      projectsTitle: '作品與案例',
      projects: {
        thisSite: {
          title: 'Antonio.dev · 這個網站',
          description: 'Astro 打造的作品集與技術部落格：CodeSandbox 式多檔案 playground、依 WCAG 對比度自動配色的生成式縮圖、WebGL shader 首頁，在 Inkdrop 寫筆記就自動發佈。',
          tags: ['Astro', 'React', 'WebGL', 'Monaco']
        },
        embeddedUi: {
          title: 'Embedded UI 的 CSS 隔離',
          description: '主站引用 IIFE bundle 元件時，Tailwind 樣式缺失與互相覆蓋的排查，比較加前綴、Shadow DOM、調整插入順序三種方案後的取捨。',
          tags: ['Tailwind', 'Shadow DOM', 'IIFE']
        },
        visualTesting: {
          title: '視覺回歸測試實作',
          description: '用 Cypress 搭配 Percy 做截圖比對，整合 Storybook 與 GitHub Actions，是前端測試指南第五章的配套專案。',
          tags: ['Cypress', 'Percy', 'Storybook', 'GitHub Actions']
        },
        knowledge: {
          title: '團隊 AI 知識庫：Keyword RAG',
          description: '為團隊導入 AI 設計的知識系統，解決跨對話、跨成員、跨 agent 反覆說明背景的問題。以 governance、agents、skills、knowledge 四層組織，知識依時效分成模組、運行鏈路、bug、決策、事件五類；靠命名約定與關鍵字檢索讓 agent 先查資料再回答，並用校驗器守住格式與交叉引用。',
          tags: ['Keyword RAG', 'AI Agents', 'Skills', 'Governance']
        }
      },
      // Languages
      languageList: {
        chinese: '中文：母語者',
        cantonese: '粵語：初階',
        english: '英文：多益 765 分'
      },
      // Education
      educationTitle: '教育背景',
      education: {
        degree: '化學暨材料工程學士',
        school: '國防大學理工學院化學暨材料工程學系',
        period: '2011 - 2015'
      }
    },
    // Playground
    playground: {
      title: '遊戲場',
      vanilla: 'Vanilla',
      react: 'React',
      edit: '編輯',
      preview: '預覽',
      openInNewWindow: '在新視窗開啟',
      refresh: '重新整理',
      errorMessage: '發生錯誤，請重新整理頁面。',
      files: 'FILES',
      reset: '還原',
      resetConfirm: '放棄所有修改，還原成原始檔案？',
      clear: '清除',
      consoleEmpty: '這裡會顯示 console.log 與錯誤',
      noFileOpen: '從左邊選一個檔案',
      save: '儲存',
      draftSaved: '已自動儲存',
      draftClean: '未修改',
      draftHint: '修改會自動存在這個分頁（重新整理還在，關掉分頁就回到原始範例）；檔名變黃並標 M 代表跟原始檔不同，按「還原」可回到原始版本',
      newFile: '新增檔案（可含資料夾，如 src/utils.ts）',
      format: '格式化',
      formatting: '格式化中…',
      formatHint: '用 Prettier 格式化目前檔案（⇧⌥F）；⌘S 儲存前也會自動格式化',
      deleteConfirm: '刪除 {name}？',
      invalidName: '檔名不合法：用相對路徑，不能有 .. 或空段',
      nameExists: '已經有這個檔案',
      backToList: '← 返回列表',
      vanillaTitle: 'Vanilla Playground',
      vanillaIntro: 'HTML、CSS 與 JavaScript 的多檔案範例。點任一張卡進入編輯，改動即時預覽。',
      reactTitle: 'React Playground',
      reactIntro: '多檔案 React 專案：元件拆檔、相對 import、CSS import，支援從 esm.sh 載入外部套件。',
      empty: '暫無範例',
      notFound: '找不到這個 playground'
    },
    // Home page
    home: {
      heroTitle: '前端工程筆記',
      intro: 'Antonio H. · 前端工程師。記錄 React、TypeScript、Three.js / Shader，與團隊導入 AI 開發工作流的實戰心得。',
      featured: '精選',
      moreLabel: '更多文章',
      topicsLabel: '主題',
      statPosts: '篇文章',
      statTopics: '個主題',
      shaderCredit: '這片背景是一個 shader',
      shaderOpen: '在 playground 打開',
      playgroundLabel: 'PLAYGROUND',
      playgroundCta: '互動程式實驗場',
      latestPosts: '最新文章',
      viewAll: '全部文章',
      ctaAbout: '關於我',
      ctaResume: '履歷'
    },
    // Blog list page
    blog: {
      all: '全部',
      searchPlaceholder: '搜尋文章標題…',
      filterHint: '可複選，符合任一標籤即顯示',
      clearFilter: '清除篩選',
      empty: '沒有符合的文章'
    },
    // QR modal
    qr: {
      loading: '載入中...'
    },
    // Navigation
    nav: {
      about: '關於',
      blog: '部落格'
    },
    // Accessibility labels
    aria: {
      closeModal: '關閉',
      playgroundMenu: '遊戲場選單',
      menu: '選單',
      switchLanguage: '切換語言',
      toggleTheme: '切換主題'
    },
    // 404 page
    notFound: {
      title: '找不到這個頁面',
      desc: '它可能被移走了，或是網址打錯了。',
      home: '回首頁',
      posts: '看文章'
    },
    // Post
    post: {
      prev: '上一篇',
      next: '下一篇',
      minRead: '分鐘閱讀',
      series: '系列',
      seriesPrev: '系列上一篇',
      seriesNext: '系列下一篇',
      copy: '複製',
      copied: '已複製'
    },
    // Site search
    search: {
      open: '搜尋文章',
      button: '搜尋',
      placeholder: '搜尋文章內容…',
      hint: '輸入關鍵字搜尋全部文章的內容',
      empty: '找不到符合的文章',
      unavailable: '搜尋索引載入失敗，請重新整理再試一次'
    }
  },
  en: {
    // About page
    about: {
      title: 'Antonio Hou',
      subtitle: 'Frontend Engineer',
      intro: 'I studied chemical engineering, taught myself frontend development, and have worked as a frontend engineer since December 2022. I am now a mid–senior frontend engineer at Brilliant Gaming, focused on Next.js server-side rendering, first-load performance, and multilingual SEO, plus SDKs and style isolation for embedded UIs. Outside work I explore Three.js and shaders, and I bring AI-assisted workflows to my team.',
      downloadResume: 'Download Resume PDF',
      contact: 'Contact',
      skills: 'Skills',
      familiarTech: 'Familiar Technologies',
      experiencedTech: 'Development Experience',
      workExperience: 'Work Experience',
      languages: 'Languages',
      scanQRCode: 'Scan QR Code to Visit',
      highlightsTitle: 'Highlights',
      highlights: [
        { value: '3+', label: 'years in frontend', note: 'since December 2022' },
        { value: '−65%', label: 'webpack build time', note: '187s down to 66s' },
        { value: '+42%', label: 'page image load speed', note: 'image optimization' },
        { value: '0 → 1', label: 'multi-environment web platform', note: 'Next.js 15 SSR' }
      ],
      links: {
        github: 'GitHub',
        email: 'Email',
        qr: 'Show QR code',
        caseStudy: 'Read case study',
        source: 'Source',
        article: 'Read article'
      },
      // Work experience
      work: {
        brilliantGaming: {
          company: 'Brilliant Gaming (Armenia)',
          title: 'Mid–Sr. Frontend Developer',
          period: 'May 2025 - Present',
          responsibilities: [
            'Maintained a SolidJS site, handling component integration and technical recommendations (legacy project)',
            'Built a white-label web platform on Next.js 15 with server-side rendering (new project)',
            'Set up 0-to-1 project infrastructure with multi-environment configs for multiple brands',
            'Owned base component design and specs, working directly with the art team',
            'Improved first-load performance with server-side rendering and dynamic imports',
            'Implemented dynamic SEO with per-locale sitemaps and meta tags',
            'Built private campaign packages shipped as SDKs, including iframe-based integration'
          ]
        },
        yingtong: {
          company: 'Yingtong Management Consulting Co., Ltd.',
          title: 'Mid. Frontend Developer',
          period: 'Dec 2024 - May 2025',
          responsibilities: [
            'Maintained the marketing site and admin dashboard on React 16 (class and function components) and Next 12',
            'Optimized webpack builds, cutting build time from 187s to 66s'
          ]
        },
        worldEntertainment: {
          company: 'World Entertainment (Fly Asian)',
          title: 'Jr. Frontend Developer',
          period: 'Oct 2023 - Oct 2024',
          responsibilities: [
            'Developed games, iterated on the marketing site, and maintained the platform and private packages (baccarat, fan-tan, roulette, lottery)',
            'Optimized images, improving page image load speed by 42%',
            'Wrote custom ESLint rules to enforce project conventions',
            'Built web and mobile game UIs with SVG, styled-components, and Tailwind',
            'Practiced component-driven development, publishing components for other developers',
            'Delivered pixel-perfect UI implementations',
            'Rebuilt a vanilla JS project as a Next.js and Payload 3 marketing site with CMS'
          ]
        },
        heling: {
          company: 'Heling Technology',
          title: 'Jr. Frontend Developer',
          period: 'Dec 2022 - Aug 2023',
          responsibilities: [
            'Maintained a Three.js smart-factory project',
            'Introduced Git-based version control to the project',
            'Replaced useContext with Zustand to fix re-render performance issues',
            'Wrote and organized project documentation',
            'Built a hardware control system UI with React Hook Form'
          ]
        }
      },
      // Projects
      projectsTitle: 'Work & Case Studies',
      projects: {
        thisSite: {
          title: 'Antonio.dev · this site',
          description: 'Portfolio and tech blog built with Astro: a CodeSandbox-style multi-file playground, generative thumbnails colored with WCAG contrast math, a WebGL shader hero, and posts that publish straight from Inkdrop notes.',
          tags: ['Astro', 'React', 'WebGL', 'Monaco']
        },
        embeddedUi: {
          title: 'CSS isolation for embedded UI',
          description: 'Debugging missing and overridden Tailwind styles when the main site loads components from an IIFE bundle, then weighing prefixing, Shadow DOM, and injection order.',
          tags: ['Tailwind', 'Shadow DOM', 'IIFE']
        },
        visualTesting: {
          title: 'Visual regression testing',
          description: 'Screenshot diffing with Cypress and Percy, integrated with Storybook and GitHub Actions. Companion project to chapter 5 of my frontend testing series.',
          tags: ['Cypress', 'Percy', 'Storybook', 'GitHub Actions']
        },
        knowledge: {
          title: 'Team AI knowledge base with keyword RAG',
          description: 'A knowledge system for bringing AI into a team, so context no longer has to be re-explained across conversations, teammates, and agents. It is organized into governance, agents, skills, and knowledge layers, with knowledge split by lifespan into modules, runtime flows, bugs, decisions, and events. Naming conventions and keyword search let agents look things up before answering, and a validator enforces format and cross-references.',
          tags: ['Keyword RAG', 'AI Agents', 'Skills', 'Governance']
        }
      },
      // Languages
      languageList: {
        chinese: 'Chinese: Native',
        cantonese: 'Cantonese: Beginner',
        english: 'English: TOEIC 765'
      },
      // Education
      educationTitle: 'Education',
      education: {
        degree: 'Bachelor of Chemical and Materials Engineering',
        school: 'National Defense University, College of Engineering, Department of Chemical and Materials Engineering',
        period: '2011 - 2015'
      }
    },
    // Playground
    playground: {
      title: 'Playground',
      vanilla: 'Vanilla',
      react: 'React',
      edit: 'Edit',
      preview: 'Preview',
      openInNewWindow: 'Open in new window',
      refresh: 'Refresh',
      errorMessage: 'Something went wrong. Please refresh the page.',
      files: 'FILES',
      reset: 'Reset',
      resetConfirm: 'Discard all changes and restore the original files?',
      clear: 'Clear',
      consoleEmpty: 'console.log output and errors show up here',
      noFileOpen: 'Pick a file on the left',
      save: 'Save',
      draftSaved: 'Auto-saved',
      draftClean: 'Unchanged',
      draftHint: 'Edits auto-save for this tab (survive refresh, gone when the tab closes); a yellow name with M means it differs from the original — use Reset to restore',
      newFile: 'New file (folders allowed, e.g. src/utils.ts)',
      format: 'Format',
      formatting: 'Formatting…',
      formatHint: 'Format the current file with Prettier (⇧⌥F); ⌘S also formats before saving',
      deleteConfirm: 'Delete {name}?',
      invalidName: 'Invalid name: use a relative path without .. or empty segments',
      nameExists: 'A file with that name already exists',
      backToList: '← Back to list',
      vanillaTitle: 'Vanilla Playground',
      vanillaIntro: 'Multi-file HTML, CSS and JavaScript examples. Open any card to edit with live preview.',
      reactTitle: 'React Playground',
      reactIntro: 'Multi-file React projects: split components, relative imports, CSS imports, and external packages from esm.sh.',
      empty: 'No examples yet',
      notFound: 'Playground not found'
    },
    // Home page
    home: {
      heroTitle: 'Frontend Engineering Notes',
      intro: 'Antonio H. · Frontend engineer. Notes on React, TypeScript, Three.js / shaders, and bringing AI workflows to a frontend team.',
      featured: 'Featured',
      moreLabel: 'More posts',
      topicsLabel: 'Topics',
      statPosts: 'posts',
      statTopics: 'topics',
      shaderCredit: 'This background is a shader',
      shaderOpen: 'open it in the playground',
      playgroundLabel: 'PLAYGROUND',
      playgroundCta: 'Interactive code playground',
      latestPosts: 'Latest posts',
      viewAll: 'All posts',
      ctaAbout: 'About me',
      ctaResume: 'Resume'
    },
    // Blog list page
    blog: {
      all: 'All',
      searchPlaceholder: 'Search posts…',
      filterHint: 'Multi-select — matches any selected tag',
      clearFilter: 'Clear filters',
      empty: 'No matching posts'
    },
    // QR modal
    qr: {
      loading: 'Loading...'
    },
    // Navigation
    nav: {
      about: 'About',
      blog: 'Blog'
    },
    // Accessibility labels
    aria: {
      closeModal: 'Close',
      playgroundMenu: 'Playground menu',
      menu: 'Menu',
      switchLanguage: 'Switch language',
      toggleTheme: 'Toggle theme'
    },
    // 404 page
    notFound: {
      title: 'Page not found',
      desc: 'It may have moved, or the URL is wrong.',
      home: 'Back home',
      posts: 'Browse posts'
    },
    // Post
    post: {
      prev: 'Previous',
      next: 'Next',
      minRead: 'min read',
      series: 'Series',
      seriesPrev: 'Previous in series',
      seriesNext: 'Next in series',
      copy: 'Copy',
      copied: 'Copied'
    },
    // Site search
    search: {
      open: 'Search posts',
      button: 'Search',
      placeholder: 'Search post content…',
      hint: 'Type to search the full text of every post',
      empty: 'No matching posts',
      unavailable: 'Could not load the search index. Please refresh and try again.'
    }
  }
} as const

export function getTranslations(locale: Locale) {
  return translations[locale]
}
