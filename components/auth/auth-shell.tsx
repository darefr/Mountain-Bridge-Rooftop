import Image from 'next/image'
import Link from 'next/link'
import { Mountain } from 'lucide-react'
import { site } from '@/lib/site'
import type { ReactNode } from 'react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-28">
      <Image
        src="/images/hero-lodge-night.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />

      <div className="glass-strong relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
            <Mountain className="size-5 text-primary" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-medium tracking-wide text-foreground">
              Mountain Bridge
            </span>
            <span className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
              {site.location.split(',')[0]} · Annapurna
            </span>
          </span>
        </Link>

        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-light text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </section>
  )
}

export const authField =
  'w-full rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

export const authLabel =
  'flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground'
