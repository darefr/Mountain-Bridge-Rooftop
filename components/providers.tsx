'use client'

import { SWRConfig } from 'swr'
import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/config'

export function Providers({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      themes={['light', 'dark']}
      disableTransitionOnChange
    >
      <SWRConfig value={{ revalidateOnFocus: false }}>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </SWRConfig>
    </ThemeProvider>
  )
}
