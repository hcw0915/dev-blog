import React, { useEffect, useState } from "react"
import { getTranslations } from "@/i18n/translations"
import type { Locale } from "@/i18n/translations"

const locales = [
  { code: "zh", label: "中" },
  { code: "en", label: "EN" }
]

export default function LanguageToggle() {
  const [isMounted, setIsMounted] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    if (import.meta.env.SSR) {
      return "zh"
    }
    const path = window.location.pathname
    if (path.startsWith("/en/")) {
      return "en"
    }
    return "zh"
  })
  
  const translations = getTranslations(currentLocale)

  const toggleLocale = () => {
    const newLocale = currentLocale === "zh" ? "en" : "zh"
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

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted ? (
    <div className="inline-flex items-center p-[1px] rounded-3xl bg-slate-300 dark:bg-zinc-600">
      {locales.map(locale => {
        const checked = locale.code === currentLocale
        return (
          <button
            key={locale.code}
            className={`${
              checked ? "bg-white text-black dark:bg-zinc-800 dark:text-white" : ""
            } cursor-pointer rounded-3xl px-3 py-1.5 text-sm font-medium transition-colors`}
            onClick={toggleLocale}
            aria-label={`${translations.aria.switchLanguage} ${locale.label}`}
          >
            {locale.label}
          </button>
        )
      })}
    </div>
  ) : (
    <div className="inline-flex items-center p-[1px] rounded-3xl bg-slate-300 dark:bg-zinc-600">
      <div className="rounded-3xl px-3 py-1.5 text-sm font-medium">中文</div>
    </div>
  )
}
