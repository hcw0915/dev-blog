import React from 'react'
import { IoSunny, IoMoon } from 'react-icons/io5'
import { getTranslations } from '@/i18n/translations'
import type { Locale } from '@/i18n/translations'

interface ThemeToggleProps {
  locale?: Locale
}

/**
 * 跟 LanguageToggle 同一個結構（h-8、等寬按鈕、一顆會滑的高亮底）。
 * 高亮位置完全由 html.dark 透過 CSS 決定（BaseHead 的阻塞式 script 在繪製前已設好），
 * 不依賴 React state，因此 SSR/hydration 一致、換頁不會閃；切換時 dark: 變體改變
 * translate，高亮就滑過去。
 */
export default function ThemeToggle({ locale = 'zh' }: ThemeToggleProps) {
  const translations = getTranslations(locale)

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  const btn =
    'relative z-10 flex h-[26px] w-8 items-center justify-center rounded-full text-[15px] transition-colors'

  return (
    <div className="relative inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white/60 p-0.5 dark:border-white/10 dark:bg-white/[0.04]">
      <span
        aria-hidden="true"
        className="absolute left-0.5 top-0.5 h-[26px] w-8 translate-x-0 rounded-full bg-zinc-900/[0.06] transition-transform duration-300 ease-out dark:translate-x-8 dark:bg-white/10"
      />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={translations.aria.toggleTheme}
        className={`${btn} text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300`}
      >
        <IoSunny />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={translations.aria.toggleTheme}
        className={`${btn} text-zinc-400 hover:text-zinc-700 dark:text-zinc-100`}
      >
        <IoMoon />
      </button>
    </div>
  )
}
