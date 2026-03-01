import React, { useEffect, useState, useRef } from "react"
import { IoChevronDown } from "react-icons/io5"
import { getTranslations } from "@/i18n/translations"
import type { Locale } from "@/i18n/translations"

export default function PlaygroundDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [locale, setLocale] = useState<Locale>("zh")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
    // 獲取當前語言
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname
      const isEn = currentPath.startsWith("/en/")
      setLocale(isEn ? "en" : "zh")
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, isMounted])

  const translations = getTranslations(locale)

  if (!isMounted) {
    return (
      <div className="relative">
        <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          {translations.playground.title}
          <IoChevronDown className="text-xs" />
        </button>
      </div>
    )
  }

  // 獲取當前路徑和語言
  const currentPath = window.location.pathname
  const isEn = currentPath.startsWith("/en/")
  const basePath = isEn ? "/en" : ""

  const menuItems = [
    { label: translations.playground.vanilla, href: `${basePath}/playground/vanilla` },
    { label: translations.playground.react, href: `${basePath}/playground/react` }
  ]

  // 檢查當前是否在 playground 頁面
  const isPlaygroundActive = currentPath.includes("/playground/")

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${
          isPlaygroundActive
            ? "font-bold underline text-indigo-600 dark:text-indigo-400"
            : "text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        }`}
        aria-label={translations.aria.playgroundMenu}
        aria-expanded={isOpen}
      >
        {translations.playground.title}
        <IoChevronDown
          className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {menuItems.map((item) => {
            const isActive = currentPath === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
