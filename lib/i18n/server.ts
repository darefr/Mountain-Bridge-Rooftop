import { cookies } from 'next/headers'
import { LOCALE_COOKIE, defaultLocale, locales, type Locale } from './config'
import { translate, type TFunc } from './translate'

export async function getLocale(): Promise<Locale> {
  const jar = await cookies()
  const val = jar.get(LOCALE_COOKIE)?.value as Locale | undefined
  return val && locales.includes(val) ? val : defaultLocale
}

export async function getT(): Promise<{ locale: Locale; t: TFunc }> {
  const locale = await getLocale()
  return { locale, t: (key, vars) => translate(locale, key, vars) }
}
