'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, defaultLocale, type Locale } from './config'
import { translate, type TFunc } from './translate'

type I18nValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: TFunc
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l)
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      document.documentElement.lang = l
      // Re-render server components in the new language.
      router.refresh()
    },
    [router],
  )

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t: (key, vars) => translate(locale, key, vars) }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Safe fallback if used outside provider (e.g. isolated tests).
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key, vars) => translate(defaultLocale, key, vars),
    }
  }
  return ctx
}
