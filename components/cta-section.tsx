import Image from 'next/image'
import { LuxLink } from '@/components/ui/lux-button'
import { Reveal } from '@/components/motion'
import { ArrowRight, Phone } from 'lucide-react'
import { site } from '@/lib/site'

export function CtaSection({
  title = 'Your Himalayan escape awaits',
  description = 'Reserve a room with a view of the peaks, or a table on the rooftop. Our team will craft the perfect mountain stay for you.',
  image = '/images/rooftop-dining.png',
  primaryLabel = 'Book Your Stay',
  primaryHref = '/rooms',
}: {
  title?: string
  description?: string
  image?: string
  primaryLabel?: string
  primaryHref?: string
}) {
  return (
    <section className="container-luxe py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-3xl">
        <Image
          src={image || '/placeholder.svg'}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
        <div className="relative z-10 flex max-w-xl flex-col gap-6 px-6 py-16 sm:px-14 sm:py-24">
          <Reveal>
            <h2 className="text-balance font-serif text-3xl font-light leading-tight text-foreground sm:text-5xl">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-pretty leading-relaxed text-foreground/80">
              {description}
            </p>
          </Reveal>
          <Reveal delay={0.16} className="flex flex-wrap gap-3">
            <LuxLink href={primaryHref} variant="luxury" size="lg">
              {primaryLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </LuxLink>
            <LuxLink href={site.phoneHref} variant="glass" size="lg" shimmer={false}>
              <Phone className="size-4" />
              {site.phone}
            </LuxLink>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
