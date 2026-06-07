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
    <div className="inline-flex items-center p-[1px] rounded-3xl bg-slate-300 dark:bg-zinc-600">
      {locales.map(item => {
        const checked = item.code === locale
        return (
          <button
            key={item.code}
            className={`${
              checked ? "bg-white text-black dark:bg-zinc-800 dark:text-white" : ""
            } cursor-pointer rounded-3xl px-3 py-1.5 text-sm font-medium transition-colors`}
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
