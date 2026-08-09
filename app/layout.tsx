import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AiConcierge } from '@/components/ai-concierge'
import { FloatingActions } from '@/components/floating-actions'
import { PageTransition } from '@/components/page-transition'
import { Providers } from '@/components/providers'
import { getLocale } from '@/lib/i18n/server'
import { getSettings } from '@/lib/content'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

export function generateMetadata(): Metadata {
  const s = getSettings()
  const seo = s.seo
  const shortName = s.shortName || 'Hotel Mountain Bridge'
  const ogImage = seo.ogImage || s.hero.image || '/images/hero-lodge-night.png'
  return {
    metadataBase: s.websiteUrl ? new URL(s.websiteUrl) : undefined,
    title: {
      default: seo.metaTitle || s.websiteTitle,
      template: `%s · ${shortName}`,
    },
    description: seo.metaDescription || s.description,
    keywords: (seo.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
    alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    openGraph: {
      title: seo.ogTitle || seo.metaTitle || s.websiteTitle,
      description: seo.ogDescription || seo.metaDescription || s.description,
      images: [ogImage],
      type: 'website',
      url: seo.canonicalUrl || s.websiteUrl || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || seo.metaTitle || s.websiteTitle,
      description: seo.ogDescription || seo.metaDescription || s.description,
      images: [seo.twitterImage || ogImage],
    },
    generator: 'v0.app',
  }
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1a1d24',
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <Providers locale={locale}>
          <SiteHeader />
          <PageTransition>
            <main id="main">{children}</main>
          </PageTransition>
          <SiteFooter />
          <AiConcierge />
          <FloatingActions />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
