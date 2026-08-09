import Image from 'next/image'
import type { Metadata } from 'next'
import { Clock, Leaf, Flame, Wheat, ArrowRight, Star } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { CtaSection } from '@/components/cta-section'
import { FaqAccordion } from '@/components/faq-accordion'
import { ReservationForm } from '@/components/reservation-form'
import { Testimonials } from '@/components/testimonials'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'
import { menu as menuFallback } from '@/lib/data'
import { db } from '@/lib/db/store'
import { getSettings, getPublicFaqs } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rooftop Restaurant',
  description:
    'Panoramic Himalayan dining at Hotel Mountain Bridge, Pisang. Nepali classics, wood-fired plates and warming drinks with a view of the Annapurna peaks.',
}

function buildMenu() {
  const available = db.menuItems.filter((m) => m.available)
  if (!available.length) return menuFallback
  const groups: Record<string, { name: string; desc: string; price: string; tag?: string }[]> = {}
  for (const m of available) {
    ;(groups[m.category] ??= []).push({ name: m.name, desc: m.desc, price: `$${m.priceUSD}`, tag: m.featured ? m.offer || 'Featured' : m.offer })
  }
  return Object.entries(groups).map(([title, items]) => ({ title, items }))
}

const signatures = [
  { name: 'Dal Bhat Power', img: '/images/dish-dalbhat.png', desc: 'The trekker’s fuel — rice, lentils, curry and pickle, refillable.' },
  { name: 'Steamed Momos', img: '/images/dish-momos.png', desc: 'Hand-folded dumplings with fiery tomato achar.' },
  { name: 'Wood-fired Pizza', img: '/images/dish-pizza.png', desc: 'Charred, blistered crust straight from the clay oven.' },
]

const philosophy = [
  { icon: Leaf, title: 'Local & seasonal', desc: 'Vegetables, apples and yak cheese sourced from Manang’s highland farms.' },
  { icon: Flame, title: 'Cooked with care', desc: 'Slow-simmered dal and a wood-fired oven that warms the whole terrace.' },
  { icon: Wheat, title: 'For every diet', desc: 'Generous vegetarian and vegan plates, always available.' },
]

export default function RestaurantPage() {
  const rest = getSettings().restaurant
  const menu = buildMenu()
  const faqs = getPublicFaqs().map((f) => ({ q: f.question, a: f.answer }))
  return (
    <>
      <PageHero
        image={rest.image || '/images/restaurant-hero.png'}
        alt="The rooftop restaurant at golden hour"
        eyebrow={rest.name || 'The Rooftop Restaurant'}
        title="Dining above the clouds"
        description={rest.description || 'Warm plates, warmer company and a 360° view of the Annapurna range — our rooftop is where every mountain day begins and ends.'}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Restaurant' }]}
      >
        <div className="flex flex-wrap gap-3">
          <LuxLink href="/menu" variant="luxury" size="lg">
            View the Menu
          </LuxLink>
          <LuxLink href="#reserve" variant="glass" size="lg" shimmer={false}>
            Reserve a Table
          </LuxLink>
        </div>
      </PageHero>

      {/* Story */}
      <section className="container-luxe grid gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        <SectionHeading
          eyebrow="Our story"
          title="The heart of the house"
          description="For years the rooftop has been the gathering place of Pisang — where trekkers from every nation share a table, swap trail tales and watch the peaks turn from gold to rose to indigo."
        />
        <Reveal delay={0.1}>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            We cook the food that mountains demand: hearty, honest and made to
            restore. From the first pot of masala chai at dawn to the last slice
            of wood-fired pizza under the stars, every plate is served with the
            warmth this family is known for.
          </p>
        </Reveal>
      </section>

      {/* Philosophy */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Culinary philosophy"
            title="Simple food, done beautifully"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <Stagger className="grid gap-5 md:grid-cols-3">
            {philosophy.map((p) => (
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
        </div>
      </section>

      {/* Signature dishes */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Signature dishes"
          title="Plates worth the climb"
          align="center"
          className="mx-auto mb-14 max-w-2xl"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {signatures.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.1} y={40}>
              <article className="group overflow-hidden rounded-3xl border border-border/60 bg-card/40">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={s.img || '/placeholder.svg'}
                    alt={s.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl text-foreground">{s.name}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Menu preview */}
      <section id="menu" className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading eyebrow="On the menu" title="A taste of the rooftop" />
            <Reveal>
              <LuxLink href="/menu" variant="outline" shimmer={false}>
                Full menu <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {menu.slice(0, 2).map((cat) => (
              <Reveal key={cat.title}>
                <div className="flex flex-col gap-5">
                  <h3 className="flex items-center gap-3 font-serif text-2xl text-foreground">
                    <span className="h-px w-6 bg-primary/70" /> {cat.title}
                  </h3>
                  <ul className="flex flex-col gap-4">
                    {cat.items.map((item) => (
                      <li key={item.name} className="flex items-baseline gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{item.name}</span>
                            {item.tag && (
                              <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[0.65rem] text-primary">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
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
        </div>
      </section>

      {/* Atmosphere */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/rooftop-dining.png"
                alt="Rooftop dining at dusk"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div className="flex flex-col justify-center gap-6">
            <SectionHeading
              eyebrow="The atmosphere"
              title="A table with the finest view in Pisang"
              description="Bundle up under a blanket, order something warm, and let the mountains put on their evening show. Sunset is our busiest — and most beautiful — hour."
            />
            <Reveal delay={0.1}>
              <div className="glass flex items-center gap-4 rounded-2xl p-5">
                <Clock className="size-6 shrink-0 text-primary" />
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-foreground">Opening hours</span>
                  <span className="text-muted-foreground">
                    {rest.hours || 'Breakfast 6:30am · All-day dining until 9:30pm'}
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Guest words"
            title="They came for the view, stayed for the food"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <Testimonials limit={3} />
        </div>
      </section>

      {/* Reservation */}
      <section id="reserve" className="container-luxe py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Reserve a table"
              title="Book your window seat"
              description="Sunset tables fill fast in high season. Send us your details and we'll hold the best seat in the house for you."
            />
            <Reveal delay={0.1}>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                {['Priority sunset seating', 'Group & celebration tables', 'Dietary needs catered', 'Free for hotel guests'].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Star className="size-4 shrink-0 fill-primary text-primary" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.1} y={30}>
            <ReservationForm />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading eyebrow="Dining questions" title="Good to know" />
          <FaqAccordion items={faqs.slice(0, 5)} />
        </div>
      </section>

      <CtaSection
        title="Join us on the rooftop"
        description="Whether you're staying the night or just passing through, a warm meal and a world-class view are always waiting."
        image="/images/breakfast-view.png"
        primaryLabel="Reserve a Table"
        primaryHref="#reserve"
      />
    </>
  )
}
