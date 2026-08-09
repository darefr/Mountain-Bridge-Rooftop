'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { AnimatePresence, motion } from 'motion/react'
import {
  Menu,
  X,
  ChevronDown,
  Phone,
  MessageCircle,
  Mountain,
  Sparkles,
  User,
  LayoutDashboard,
} from 'lucide-react'
import { navItems, site } from '@/lib/site'
import { LuxLink } from '@/components/ui/lux-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth/use-auth'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()
  const { user } = useAuth()
  const { data: logoData } = useSWR<{ logo: string | null }>(
    '/api/site-logo',
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false },
  )
  const logo = logoData?.logo
  const label = (tKey: string | undefined, fallback: string) =>
    tKey ? t(tKey) : fallback

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setOpen(null)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-4 transition-all duration-500 sm:px-8 lg:px-12',
          scrolled ? 'py-2.5' : 'py-4',
        )}
      >
        {/* logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label={`${site.name} home`}
        >
          <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-primary/15 ring-1 ring-primary/30 transition-colors group-hover:bg-primary/25">
            {logo ? (
              // Admin-uploaded logo may be a data URL, which next/image rejects.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo || '/placeholder.svg'} alt={`${site.name} logo`} className="size-full object-cover" />
            ) : (
              <Mountain className="size-4.5 text-primary" />
            )}
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-base font-medium tracking-wide text-foreground">
              Mountain Bridge
            </span>
            <span className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
              Pisang · Annapurna
            </span>
          </span>
        </Link>

        {/* desktop nav */}
        <nav
          className={cn(
            'glass hidden items-center gap-1 rounded-full px-2 py-1.5 transition-all duration-500 lg:flex',
            scrolled && 'shadow-xl',
          )}
          onMouseLeave={() => setOpen(null)}
        >
          {navItems.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpen(item.label)}
              >
                <button
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3.5 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground',
                    open === item.label && 'text-foreground',
                  )}
                  aria-expanded={open === item.label}
                >
                  {label(item.tKey, item.label)}
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform',
                      open === item.label && 'rotate-180',
                    )}
                  />
                </button>
                <AnimatePresence>
                  {open === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3"
                    >
                      <div className="glass-strong overflow-hidden rounded-2xl p-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="group flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/10"
                          >
                            <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                              {label(child.tKey, child.label)}
                            </span>
                            {child.desc && (
                              <span className="text-xs text-muted-foreground">
                                {child.desc}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground',
                  pathname === item.href && 'text-primary',
                )}
              >
                {label(item.tKey, item.label)}
              </Link>
            ),
          )}
        </nav>

        {/* desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <a
            href={site.phoneHref}
            className="glass grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:text-primary"
            aria-label="Call the hotel"
          >
            <Phone className="size-4" />
          </a>
          {user ? (
            <Link
              href={user.role === 'admin' || user.role === 'staff' ? '/admin' : '/account'}
              className="glass grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:text-primary"
              aria-label={t('common.myAccount')}
            >
              {user.role === 'admin' || user.role === 'staff' ? (
                <LayoutDashboard className="size-4" />
              ) : (
                <User className="size-4" />
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="glass grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:text-primary"
              aria-label={t('common.signIn')}
            >
              <User className="size-4" />
            </Link>
          )}
          <LuxLink href="/book" variant="luxury" size="sm">
            <Sparkles className="size-4" />
            {t('common.bookNow')}
          </LuxLink>
        </div>

        {/* mobile actions: Sign In next to the hamburger trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={
              user
                ? user.role === 'admin' || user.role === 'staff'
                  ? '/admin'
                  : '/account'
                : '/login'
            }
            className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm text-foreground/90 transition-colors hover:text-primary"
            aria-label={user ? t('common.myAccount') : t('common.signIn')}
          >
            {user && (user.role === 'admin' || user.role === 'staff') ? (
              <LayoutDashboard className="size-4" />
            ) : (
              <User className="size-4" />
            )}
            <span className="whitespace-nowrap">
              {user ? t('common.myAccount') : t('common.signIn')}
            </span>
          </Link>

          {/* mobile trigger */}
          <button
            className="glass grid size-11 shrink-0 place-items-center rounded-full text-foreground"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [section, setSection] = useState<string | null>(null)
  const { t } = useI18n()
  const label = (tKey: string | undefined, fallback: string) =>
    tKey ? t(tKey) : fallback

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 top-0 z-40 flex flex-col overflow-y-auto bg-background/95 px-5 pb-10 pt-24 backdrop-blur-2xl lg:hidden"
        >
          <nav className="flex flex-col gap-1">
            {navItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="border-b border-border/50"
              >
                {item.children ? (
                  <>
                    <button
                      onClick={() =>
                        setSection(section === item.label ? null : item.label)
                      }
                      className="flex w-full items-center justify-between py-4 font-serif text-2xl text-foreground"
                    >
                      {label(item.tKey, item.label)}
                      <ChevronDown
                        className={cn(
                          'size-5 text-primary transition-transform',
                          section === item.label && 'rotate-180',
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {section === item.label && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 pb-3 pl-3">
                            {item.children.map((child) => (
                              <Link
                                key={child.label}
                                href={child.href}
                                onClick={onClose}
                                className="py-2 text-base text-muted-foreground transition-colors hover:text-primary"
                              >
                                {label(child.tKey, child.label)}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={onClose}
                    className="block py-4 font-serif text-2xl text-foreground"
                  >
                    {label(item.tKey, item.label)}
                  </Link>
                )}
              </motion.div>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
            <LuxLink href="/book" variant="luxury" size="lg" onClick={onClose}>
              <Sparkles className="size-4" />
              {t('common.bookYourStay')}
            </LuxLink>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={site.phoneHref}
                className="glass flex items-center justify-center gap-2 rounded-full py-3 text-sm text-foreground"
              >
                <Phone className="size-4" /> {t('common.call')}
              </a>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="glass flex items-center justify-center gap-2 rounded-full py-3 text-sm text-foreground"
              >
                <MessageCircle className="size-4" /> {t('common.whatsapp')}
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
