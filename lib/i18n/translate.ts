import { dict } from './dictionary'
import { defaultLocale, type Locale } from './config'

function resolve(obj: unknown, key: string): string | undefined {
  const val = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
  return typeof val === 'string' ? val : undefined
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let out = resolve(dict[locale], key) ?? resolve(dict[defaultLocale], key) ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return out
}

export type TFunc = (key: string, vars?: Record<string, string | number>) => string
