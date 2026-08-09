'use client'

import { Globe } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  return (
    <div
      className={cn(
        'glass flex items-center gap-0.5 rounded-full p-0.5 text-xs',
        className,
      )}
      role="group"
      aria-label="Select language"
    >
      <Globe className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden />
      {locales.map((l: Locale) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'rounded-full px-2.5 py-1 font-medium transition-colors',
            locale === l
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:text-foreground',
          )}
        >
          {l === 'en' ? 'EN' : 'ने'}
          <span className="sr-only"> — {localeNames[l]}</span>
        </button>
      ))}
    </div>
  )
}
