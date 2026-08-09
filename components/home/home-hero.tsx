'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { Star, MapPin, ChevronDown } from 'lucide-react'
import { site } from '@/lib/site'
import { LuxLink } from '@/components/ui/lux-button'
import { BookingWidget } from '@/components/booking-widget'
import { TextReveal } from '@/components/motion'

export type HeroContent = {
  title?: string
  subtitle?: string
  description?: string
  image?: string
  ctaText?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
}

export function HomeHero({ hero }: { hero?: HeroContent }) {
  const reduce = useReducedMotion()

  const image = hero?.image || '/images/hero-lodge-night.png'
  const description =
    hero?.description ||
    'A boutique retreat and rooftop restaurant in Pisang — warm rooms, panoramic Himalayan dining and genuine mountain hospitality on the Annapurna Circuit.'
  const ctaText = hero?.ctaText || 'Explore Rooms'
  const ctaLink = hero?.ctaLink || '/rooms'
  const secondaryCtaText = hero?.secondaryCtaText || 'The Rooftop Restaurant'
  const secondaryCtaLink = hero?.secondaryCtaLink || '/restaurant'
  // Use the animated split headline only for the default title; a custom title
  // renders as a single balanced line so admin edits show verbatim.
  const customTitle = hero?.title?.trim()

  return (
    <section className="hero-vignette relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden pb-8 pt-28">
      <motion.div
        initial={reduce ? false : { scale: 1.12 }}
        animate={reduce ? undefined : { scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src={image || '/placeholder.svg'}
          alt="Hotel Mountain Bridge at twilight beneath the Annapurna peaks"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/50" />

      <div className="container-luxe relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-5">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex flex-wrap items-center gap-4 text-sm text-foreground/80"
          >
            <span className="flex items-center gap-1.5">
              <span className="flex text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-primary" />
                ))}
              </span>
              {site.rating.toFixed(1)} · {site.reviewsCount} reviews
            </span>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              Pisang · {site.altitude} · Annapurna Circuit
            </span>
          </motion.div>

          <h1 className="max-w-4xl text-balance font-serif text-5xl font-light leading-[0.98] text-foreground sm:text-7xl lg:text-8xl">
            {customTitle ? (
              <TextReveal text={customTitle} delay={0.15} />
            ) : (
              <>
                <TextReveal text="Where the mountains" delay={0.15} />
                <span className="block text-gradient-gold">
                  <TextReveal text="meet the sky" delay={0.4} />
                </span>
              </>
            )}
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="max-w-xl text-pretty text-base leading-relaxed text-foreground/80 sm:text-lg"
          >
            {description}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="flex flex-wrap gap-3"
          >
            <LuxLink href={ctaLink} variant="luxury" size="lg">
              {ctaText}
            </LuxLink>
            <LuxLink href={secondaryCtaLink} variant="glass" size="lg" shimmer={false}>
              {secondaryCtaText}
            </LuxLink>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <BookingWidget />
        </motion.div>
      </div>

      {!reduce && (
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 text-foreground/50 lg:block"
        >
          <ChevronDown className="size-6" />
        </motion.div>
      )}
    </section>
  )
}
