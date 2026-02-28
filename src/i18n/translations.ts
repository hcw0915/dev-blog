export type Locale = 'zh' | 'en'

export const defaultLocale: Locale = 'zh'
export const locales: Locale[] = ['zh', 'en']

export const translations = {
  zh: {
    // About page
    about: {
      title: 'Antonio Hou',
      subtitle: 'Frontend Developer',
      intro: '自學開始，2022.12 開始前端工程師生涯，熟悉 React 生態，具備前端工程化的認知與部分優化實踐。對於新知識與內容充滿好奇，且具備主動探索慾望。',
      downloadResume: '下載履歷 PDF',
      contact: '聯絡方式',
      skills: '技能',
      familiarTech: '較熟悉技術',
      experiencedTech: '具開發經驗',
      workExperience: '工作經驗',
      projects: '專案連結',
      languages: '語言能力',
      education: '教育背景',
      scanQRCode: '掃描二維碼訪問',
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
      projectsTitle: '專案連結',
      projects: {
        blog: {
          title: '個人技術部落格',
          description: '使用 Astro、React 和 Tailwind CSS 建立的技術部落格，記錄學習筆記和開發心得。'
        },
        wegames: {
          title: 'WeGames',
          description: '遊戲平台專案'
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
    }
  },
  en: {
    // About page
    about: {
      title: 'Antonio Hou',
      subtitle: 'Frontend Developer',
      intro: 'Started self-learning and began my career as a frontend developer in December 2022. Familiar with the React ecosystem, I have knowledge of frontend engineering and some optimization practices. I am curious about new knowledge and content, and have the initiative to explore.',
      downloadResume: 'Download Resume PDF',
      contact: 'Contact',
      skills: 'Skills',
      familiarTech: 'Familiar Technologies',
      experiencedTech: 'Development Experience',
      workExperience: 'Work Experience',
      projects: 'Projects',
      languages: 'Languages',
      education: 'Education',
      scanQRCode: 'Scan QR Code to Visit',
      // Work experience
      work: {
        brilliantGaming: {
          company: 'Brilliant Gaming (Armenia)',
          title: 'Mid–Sr. Frontend Developer',
          period: 'May 2025 - Present',
          responsibilities: [
            'Solidjs website development, component integration and communication suggestions (legacy project)',
            'Next.js 15 package network development (Server Side Render) (new project)',
            'Participated in 0-1 project infrastructure, multi-environment setup for different betting networks',
            'Basic component design management, communication with art team and component specification management',
            'First screen resource performance optimization (server-side rendering, dynamic imports, etc.)',
            'Dynamic SEO setup, creating corresponding sitemap and page tags for multi-language support',
            'Event-type private package development, SDK export and iframe solution handling'
          ]
        },
        yingtong: {
          company: 'Yingtong Management Consulting Co., Ltd.',
          title: 'Mid. Frontend Developer',
          period: 'Dec 2024 - May 2025',
          responsibilities: [
            'React 16 (class + function) Next 12, maintaining official website/backend',
            'webpack optimization (build time reduced from 187s to 66s)'
          ]
        },
        worldEntertainment: {
          company: 'World Entertainment (Fly Asian)',
          title: 'Jr. Frontend Developer',
          period: 'Oct 2023 - Oct 2024',
          responsibilities: [
            'Mainly responsible for game development / website iteration / platform maintenance, private package maintenance (including Baccarat/Fantan/Roulette/Lottery)',
            'Image optimization, improved webpage image loading speed by 42%',
            'Wrote custom ESLint rules to ensure project style',
            'Built web/h5 game interfaces using SVG, styled-components, and Tailwind',
            'CDD component-driven development, providing components for other developers',
            'Pixel perfect UI with high completion',
            'Refactored native JS project, Next + Payload 3 official website/CMS development'
          ]
        },
        heling: {
          company: 'Heling Technology',
          title: 'Jr. Frontend Developer',
          period: 'Dec 2022 - Aug 2023',
          responsibilities: [
            'Three.js smart factory project maintenance',
            'Established project version control system (git)',
            'Introduced Zustand to replace useContext rendering performance issues',
            'Wrote project documentation and summaries',
            'Developed hardware control system with React-hook-form'
          ]
        }
      },
      // Projects
      projectsTitle: 'Projects',
      projects: {
        blog: {
          title: 'Personal Tech Blog',
          description: 'A technical blog built with Astro, React, and Tailwind CSS, documenting learning notes and development insights.'
        },
        wegames: {
          title: 'WeGames',
          description: 'Gaming Platform Project'
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
    }
  }
} as const

export function getTranslations(locale: Locale) {
  return translations[locale]
}
