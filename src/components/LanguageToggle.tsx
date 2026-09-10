import React from "react"
import { getTranslations } from "@/i18n/translations"
import type { Locale } from "@/i18n/translations"

const locales = [
  { code: "zh", label: "中" },
  { code: "en", label: "EN" }
]

interface LanguageToggleProps {
  locale?: Locale
}

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

    // 生成新路径
    const newPath = newLocale === "zh" ? basePath : `/en${basePath}`

    window.location.href = newPath
  }

  return (
    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white/60 p-0.5 dark:border-white/10 dark:bg-white/[0.04]">
      {locales.map(item => {
        const checked = item.code === locale
        return (
          <button
            key={item.code}
            className={`${
              checked
                ? "bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/10 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            } cursor-pointer rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors`}
            onClick={toggleLocale}
            aria-label={`${translations.aria.switchLanguage} ${item.label}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
