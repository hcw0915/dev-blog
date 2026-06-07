import type { Locale } from "./translations"
import { defaultLocale, locales } from "./translations"

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale
  }
  
  return defaultLocale
}

export function getLocalizedPath(pathname: string, locale: Locale): string {
  const segments = pathname.split('/').filter(Boolean)
  const currentLocale = getLocaleFromPath(pathname)
  
  // Remove current locale if present
  if (locales.includes(segments[0] as Locale)) {
    segments.shift()
  }
  
  // Add new locale
  if (locale === defaultLocale) {
    return '/' + segments.join('/')
  }
  
  return '/' + locale + '/' + segments.join('/')
}

export function formatDate(date: Date | string, locale: Locale): string {
  const d = new Date(date)

  if (locale === 'zh') {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(d)
}

export function getPathWithoutLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  
  if (locales.includes(segments[0] as Locale)) {
    segments.shift()
  }
  
  return '/' + segments.join('/')
}
