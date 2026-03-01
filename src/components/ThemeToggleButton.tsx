import React, { useEffect, useState } from 'react'
import { IoSunny, IoMoon } from 'react-icons/io5'
import { getTranslations } from '@/i18n/translations'
import type { Locale } from '@/i18n/translations'

const themes = ['light', 'dark']

export default function ThemeToggle() {
  const [isMounted, setIsMounted] = useState(false)
  const [locale, setLocale] = useState<Locale>('zh')
  const [theme, setTheme] = useState(() => {
    if (import.meta.env.SSR) {
      return undefined
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme')
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })
  const toggleTheme = () => {
    const t = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', t)
    setTheme(t)
  }

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
    }
  }, [theme])

  useEffect(() => {
    setIsMounted(true)
    // 獲取當前語言
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isEn = currentPath.startsWith('/en/')
      setLocale(isEn ? 'en' : 'zh')
    }
  }, [])

  const translations = getTranslations(locale)

  return isMounted ? (
    <div className="inline-flex items-center p-[1px] rounded-3xl bg-slate-300 dark:bg-zinc-600">
      {themes.map(t => {
        const checked = t === theme
        return (
          <button
            key={t}
            className={`${
              checked ? 'bg-white text-black' : ''
            } cursor-pointer rounded-3xl p-2`}
            onClick={toggleTheme}
            aria-label={translations.aria.toggleTheme}
          >
            {t === 'light' ? <IoSunny /> : <IoMoon />}
          </button>
        )
      })}
    </div>
  ) : (
    <div />
  )
}
