import React, { useEffect, useState, useRef } from "react"
import { IoChevronDown } from "react-icons/io5"
import { getTranslations } from "@/i18n/translations"
import type { Locale } from "@/i18n/translations"

interface PlaygroundDropdownProps {
  locale?: Locale
}

export default function PlaygroundDropdown({ locale = "zh" }: PlaygroundDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
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
        <button className="inline-flex items-center gap-1 px-3 py-1.5 text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
          {translations.playground.title}
          <IoChevronDown className="text-xs" />
        </button>
      </div>
    )
  }

  // 語言由 server 傳入，路徑僅用於高亮當前項目
  const currentPath = window.location.pathname
  const basePath = locale === "en" ? "/en" : ""

  const menuItems = [
    { label: translations.playground.vanilla, href: `${basePath}/playground/vanilla` }
  ]

  // 檢查當前是否在 playground 頁面
  const isPlaygroundActive = currentPath.includes("/playground/")

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-base font-medium transition-colors ${
          isPlaygroundActive
            ? "font-bold underline text-violet-600 dark:text-violet-300"
            : "text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300"
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
                    ? "bg-violet-50 dark:bg-violet-400/15 text-violet-600 dark:text-violet-300 font-semibold"
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
