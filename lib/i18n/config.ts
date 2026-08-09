export const locales = ['en', 'ne'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const LOCALE_COOKIE = 'mb_locale'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ne: 'नेपाली',
}
