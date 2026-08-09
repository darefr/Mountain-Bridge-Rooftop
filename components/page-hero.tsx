import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { TextReveal, FadeIn, Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Crumb = { label: string; href?: string }

export function PageHero({
  image,
  alt,
  eyebrow,
  title,
  description,
  crumbs = [],
  children,
  height = 'tall',
}: {
  image: string
  alt: string
  eyebrow?: string
  title: string
  description?: string
  crumbs?: Crumb[]
  children?: ReactNode
  height?: 'tall' | 'short'
}) {
  return (
    <section
      className={cn(
        'hero-vignette relative flex w-full items-end overflow-hidden',
        height === 'tall'
          ? 'min-h-[78vh] pt-28 pb-16'
          : 'min-h-[58vh] pt-28 pb-14',
      )}
    >
      <Image
        src={image || '/placeholder.svg'}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />

      <div className="container-luxe relative z-10">
        {crumbs.length > 0 && (
          <FadeIn>
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
            >
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="transition-colors hover:text-primary"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground/90">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && (
                    <ChevronRight className="size-3 opacity-60" />
                  )}
                </span>
              ))}
            </nav>
          </FadeIn>
        )}

        {eyebrow && (
          <FadeIn>
            <span className="eyebrow mb-4">
              <span className="h-px w-6 bg-primary/70" aria-hidden />
              {eyebrow}
            </span>
          </FadeIn>
        )}

        <h1 className="max-w-4xl text-balance font-serif text-4xl font-light leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
          <TextReveal text={title} />
        </h1>

        {description && (
          <Reveal delay={0.25} className="mt-6 max-w-2xl">
            <p className="text-pretty text-base leading-relaxed text-foreground/80 sm:text-lg">
              {description}
            </p>
          </Reveal>
        )}

        {children && (
          <Reveal delay={0.35} className="mt-8">
            {children}
          </Reveal>
        )}
      </div>
    </section>
  )
}
