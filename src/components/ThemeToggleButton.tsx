import React from 'react'
import { IoSunny, IoMoon } from 'react-icons/io5'
import { getTranslations } from '@/i18n/translations'
import type { Locale } from '@/i18n/translations'

interface ThemeToggleProps {
  locale?: Locale
}

export default function ThemeToggle({ locale = 'zh' }: ThemeToggleProps) {
  const translations = getTranslations(locale)

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  // 高亮完全由 html.dark 透過 CSS 決定（BaseHead 的阻塞式 script 在繪製前已設好），
  // 不依賴 React state，因此 SSR/hydration 一致、換頁也不會閃。
  const base = 'cursor-pointer rounded-full p-1.5 text-[15px] transition-colors'

  return (
    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white/60 p-0.5 dark:border-white/10 dark:bg-white/[0.04]">
      <button
        onClick={toggleTheme}
        aria-label={translations.aria.toggleTheme}
        className={`${base} bg-zinc-900/[0.06] text-zinc-900 dark:bg-transparent dark:text-zinc-500 dark:hover:text-zinc-300`}
      >
        <IoSunny />
      </button>
      <button
        onClick={toggleTheme}
        aria-label={translations.aria.toggleTheme}
        className={`${base} text-zinc-400 hover:text-zinc-700 dark:bg-white/10 dark:text-zinc-100`}
      >
        <IoMoon />
      </button>
    </div>
  )
}
