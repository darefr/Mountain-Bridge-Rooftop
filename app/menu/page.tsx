import type { Metadata } from 'next'
import { Leaf, Flame } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { CtaSection } from '@/components/cta-section'
import { Reveal } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'
import { menu as menuFallback } from '@/lib/data'
import { db } from '@/lib/db/store'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'The full menu at Hotel Mountain Bridge rooftop restaurant — Nepali classics, wood-fired plates, breakfasts and warming Himalayan drinks.',
}

// Build the public menu from the admin-managed store, grouped by category.
function buildMenu() {
  const available = db.menuItems.filter((m) => m.available)
  if (!available.length) return menuFallback
  const groups: Record<string, { name: string; desc: string; price: string; tag?: string }[]> = {}
  for (const m of available) {
    ;(groups[m.category] ??= []).push({
      name: m.name,
      desc: m.desc,
      price: `$${m.priceUSD}`,
      tag: m.featured ? m.offer || 'Featured' : m.offer,
    })
  }
  return Object.entries(groups).map(([title, items]) => ({ title, items }))
}

export default function MenuPage() {
  const menu = buildMenu()
  return (
    <>
      <PageHero
        image="/images/dish-dalbhat.png"
        alt="Traditional Nepali dal bhat"
        eyebrow="The Rooftop Restaurant"
        title="Our menu"
        description="Honest mountain cooking to fuel the trail and warm the soul — served with a side of the finest view in Pisang."
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Restaurant', href: '/restaurant' },
          { label: 'Menu' },
        ]}
        height="short"
      />

      <section className="container-luxe py-20 sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <Reveal>
            <span className="eyebrow">
              <span className="h-px w-6 bg-primary/70" /> Freshly prepared daily
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Prices are in USD for reference. All dishes are prepared to order
              at 3,300m — please allow a little extra time, and let us know of
              any dietary needs.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Leaf className="size-3.5 text-success" /> Vegetarian & vegan on request
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="size-3.5 text-primary" /> Wood-fired oven
              </span>
            </div>
          </Reveal>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-x-14 gap-y-16 md:grid-cols-2">
          {menu.map((cat) => (
            <Reveal key={cat.title} y={30}>
              <div className="flex flex-col gap-6">
                <h2 className="flex items-center gap-3 font-serif text-2xl text-foreground sm:text-3xl">
                  <span className="h-px w-8 bg-primary/70" /> {cat.title}
                </h2>
                <ul className="flex flex-col gap-5">
                  {cat.items.map((item) => (
                    <li key={item.name} className="flex items-baseline gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-foreground">{item.name}</span>
                          {item.tag && (
                            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[0.65rem] text-primary">
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                      <span
                        className="h-px flex-1 translate-y-[-4px] border-b border-dashed border-border/60"
                        aria-hidden
                      />
                      <span className="font-serif text-lg text-primary">
                        {item.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 flex justify-center">
          <LuxLink href="/restaurant#reserve" variant="luxury" size="lg">
            Reserve a Table
          </LuxLink>
        </Reveal>
      </section>

      <CtaSection
        title="Hungry for the mountains?"
        description="Book a table on the rooftop and taste why trekkers rate us five stars."
        image="/images/dish-momos.png"
        primaryLabel="Reserve a Table"
        primaryHref="/restaurant#reserve"
      />
    </>
  )
}
