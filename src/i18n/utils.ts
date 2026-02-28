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

export function getPathWithoutLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  
  if (locales.includes(segments[0] as Locale)) {
    segments.shift()
  }
  
  return '/' + segments.join('/')
}
