import React from "react"
import { getTranslations } from "@/i18n/translations"
import type { Locale } from "@/i18n/translations"

const locales = [
  { code: "zh", label: "中" },
  { code: "en", label: "EN" }
] as const

interface LanguageToggleProps {
  locale?: Locale
}

/**
 * 分段切換：跟 ThemeToggle 同一個結構（h-8、等寬按鈕、一顆會滑的高亮底），兩顆才會等高、
 * 切換時高亮是滑過去而不是跳過去。
 */
export default function LanguageToggle({ locale = "zh" }: LanguageToggleProps) {
  const translations = getTranslations(locale)

  const toggleLocale = () => {
    const newLocale = locale === "zh" ? "en" : "zh"
    const currentPath = window.location.pathname

    // 獲取基礎路徑（移除語言前綴）
    let basePath = currentPath
    if (currentPath.startsWith("/en/")) {
      basePath = currentPath.replace("/en", "")
    }
    if (basePath === "/en") {
      basePath = "/"
    }

    window.location.href = newLocale === "zh" ? basePath : `/en${basePath}`
  }

  const activeIndex = locale === "en" ? 1 : 0

  return (
    <div className="relative inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white/60 p-0.5 dark:border-white/10 dark:bg-white/[0.04]">
      <span
        aria-hidden="true"
        className="absolute left-0.5 top-0.5 h-[26px] w-9 rounded-full bg-zinc-900/[0.06] transition-transform duration-300 ease-out dark:bg-white/10"
        style={{ transform: `translateX(${activeIndex * 36}px)` }}
      />
      {locales.map(item => {
        const checked = item.code === locale
        return (
          <button
            key={item.code}
            type="button"
            className={`relative z-10 h-[26px] w-9 rounded-full text-[13px] font-medium transition-colors ${
              checked
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
            onClick={toggleLocale}
            aria-pressed={checked}
            aria-label={`${translations.aria.switchLanguage} ${item.label}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
