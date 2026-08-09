import Image from 'next/image'
import type { Metadata } from 'next'
import { Check, Tag, ArrowRight, BedDouble, UtensilsCrossed, Compass } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { CtaSection } from '@/components/cta-section'
import { FaqAccordion } from '@/components/faq-accordion'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'
import { WishlistButton } from '@/components/wishlist-button'
import { offers as offerFallback } from '@/lib/data'
import { db } from '@/lib/db/store'
import { getPublicFaqs } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Offers & Packages',
  description:
    'Seasonal stay, dining and experience packages at Hotel Mountain Bridge, Pisang — from acclimatization retreats to rooftop romance.',
}

const packageTypes = [
  { icon: BedDouble, title: 'Stay packages', desc: 'Multi-night rates with breakfast and late checkout.' },
  { icon: UtensilsCrossed, title: 'Dining packages', desc: 'Private rooftop dinners and set feasts for groups.' },
  { icon: Compass, title: 'Experience packages', desc: 'Guided hikes, viewpoints and acclimatization support.' },
]

export default function OffersPage() {
  const activeOffers = db.offers.filter((o) => o.active)
  const offers = activeOffers.length ? activeOffers : offerFallback
  const faqs = getPublicFaqs().map((f) => ({ q: f.question, a: f.answer }))
  const [featured, ...rest] = offers

  return (
    <>
      <PageHero
        image="/images/offers-hero.png"
        alt="A cosy terrace at sunset"
        eyebrow="Offers"
        title="Stay a little longer"
        description="Thoughtfully crafted packages that pair restful nights with the very best of the mountains — and gentle savings, too."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Offers' }]}
      />

      {/* Featured offer */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-10 overflow-hidden rounded-3xl border border-border/60 bg-card/40 lg:grid-cols-2">
          <div className="relative min-h-72 lg:min-h-full">
            <Image
              src={featured.image || '/placeholder.svg'}
              alt={featured.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <span className="glass absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-foreground">
              <Tag className="size-3.5 text-primary" /> {featured.tag}
            </span>
          </div>
          <div className="flex flex-col justify-center gap-6 p-8 sm:p-12">
            <div className="flex flex-col gap-3">
              <span className="eyebrow">Featured offer</span>
              <h2 className="font-serif text-3xl font-light text-foreground sm:text-4xl">
                {featured.title}
              </h2>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {featured.desc}
              </p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {featured.includes.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/90">
                  <Check className="size-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-5">
              <span className="font-serif text-3xl text-gradient-gold">
                {featured.price}
              </span>
              <LuxLink href="/rooms#book" variant="luxury" size="lg">
                Book this offer <ArrowRight className="size-4" />
              </LuxLink>
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal offers */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Seasonal offers"
            title="More ways to stay"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {rest.map((o, i) => (
              <Reveal key={o.title} delay={i * 0.1} y={40}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/40">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={o.image || '/placeholder.svg'}
                      alt={o.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-xs text-foreground">
                      {o.tag}
                    </span>
                    <WishlistButton
                      kind="offer"
                      refId={o.title}
                      title={o.title}
                      image={o.image}
                      href="/offers"
                      meta={o.price}
                      className="absolute right-4 top-4"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <h3 className="font-serif text-2xl text-foreground">{o.title}</h3>
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {o.desc}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {o.includes.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                          <Check className="size-4 shrink-0 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
                      <span className="font-serif text-xl text-primary">{o.price}</span>
                      <LuxLink href="/rooms#book" variant="outline" size="sm" shimmer={false}>
                        Book
                      </LuxLink>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Package types */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Tailored to you"
          title="Build your perfect stay"
          align="center"
          className="mx-auto mb-14 max-w-2xl"
        />
        <Stagger className="grid gap-5 md:grid-cols-3">
          {packageTypes.map((p) => (
            <StaggerItem key={p.title}>
              <div className="glass h-full rounded-3xl p-7">
                <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <p.icon className="size-5" />
                </span>
                <h3 className="font-serif text-xl text-foreground">{p.title}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Terms */}
      <section className="border-t border-border/50 bg-card/30 py-16">
        <div className="container-luxe">
          <Reveal>
            <div className="glass rounded-3xl p-8">
              <h3 className="mb-3 font-serif text-xl text-foreground">
                Terms & conditions
              </h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Offers are subject to availability and season, and cannot be
                combined unless stated. Prices are indicative in USD and confirmed
                at the time of booking. Free cancellation applies on most
                packages — please contact us for full details. We reserve the
                right to amend offers at any time.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading eyebrow="Offer questions" title="Good to know" />
          <FaqAccordion items={faqs.slice(0, 5)} />
        </div>
      </section>

      <CtaSection
        title="Ready to claim your offer?"
        description="Message us your dates and the package you love, and we'll lock in your Himalayan escape."
        image="/images/rooftop-dining.png"
        primaryLabel="Book an Offer"
        primaryHref="/rooms#book"
      />
    </>
  )
}
