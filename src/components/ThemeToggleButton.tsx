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
  const base = 'cursor-pointer rounded-3xl p-2 transition-colors'

  return (
    <div className="inline-flex items-center p-[1px] rounded-3xl bg-slate-300 dark:bg-zinc-600">
      <button
        onClick={toggleTheme}
        aria-label={translations.aria.toggleTheme}
        className={`${base} bg-white text-black dark:bg-transparent dark:text-white`}
      >
        <IoSunny />
      </button>
      <button
        onClick={toggleTheme}
        aria-label={translations.aria.toggleTheme}
        className={`${base} text-black dark:bg-white dark:text-black`}
      >
        <IoMoon />
      </button>
    </div>
  )
}
