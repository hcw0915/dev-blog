import React, { useEffect, useState } from "react"

const locales = [
  { code: "zh", label: "中" },
  { code: "en", label: "EN" }
]

export default function LanguageToggle() {
  const [isMounted, setIsMounted] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<string>(() => {
    if (import.meta.env.SSR) {
      return "zh"
    }
    const path = window.location.pathname
    if (path.startsWith("/en/")) {
      return "en"
    }
    return "zh"
  })

  const toggleLocale = () => {
    const newLocale = currentLocale === "zh" ? "en" : "zh"
    const currentPath = window.location.pathname

    // 获取基础路径（移除语言前缀）
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
            aria-label={`Switch to ${locale.label}`}
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
