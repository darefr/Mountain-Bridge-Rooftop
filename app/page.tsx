import Image from 'next/image'
import Link from 'next/link'
import {
  Mountain,
  UtensilsCrossed,
  Flame,
  Wifi,
  HeartHandshake,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Star,
  BedDouble,
  ShowerHead,
  Footprints,
  Coffee,
  CheckCircle2,
  Users,
  Maximize,
  Compass,
  Camera,
  Sunrise,
  Clock,
  Navigation,
} from 'lucide-react'
import { HomeHero } from '@/components/home/home-hero'
import { SectionHeading } from '@/components/section-heading'
import { Testimonials } from '@/components/testimonials'
import { FaqAccordion } from '@/components/faq-accordion'
import { ParallaxImage } from '@/components/home/parallax-image'
import { ConciergeCta } from '@/components/home/concierge-cta'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'
import {
  rooms as roomFallback,
  menu as menuFallback,
  offers as offerFallback,
  attractions,
} from '@/lib/data'
import { site } from '@/lib/site'
import { getSettings, getPublicFaqs, getPublicGallery } from '@/lib/content'
import { db } from '@/lib/db/store'

export const dynamic = 'force-dynamic'

const stats = [
  { value: '3,300 m', label: 'Altitude in the clouds' },
  { value: '5.0', label: 'Guest rating' },
  { value: '360°', label: 'Rooftop mountain views' },
  { value: '12 yrs', label: 'Welcoming trekkers' },
]

const highlights = [
  { icon: Mountain, title: 'Mountain Views', desc: 'Every room and the rooftop frame the Annapurna peaks — from Annapurna II to Pisang Peak.' },
  { icon: UtensilsCrossed, title: 'Rooftop Dining', desc: 'Nepali classics and wood-fired plates served beneath open Himalayan skies.' },
  { icon: BedDouble, title: 'Comfortable Rooms', desc: 'Warm bedding, quiet nights and space to recover between trekking days.' },
  { icon: ShowerHead, title: 'Hot Showers', desc: 'A hot shower after the trail — one of the small comforts that matters most at altitude.' },
  { icon: Wifi, title: 'Wi-Fi & Charging', desc: 'Stay connected in the common areas with charging points for all your devices.' },
  { icon: Footprints, title: 'Trekking Support', desc: 'Trusted local guides, porters and honest advice for the road toward Manang.' },
  { icon: Coffee, title: 'Breakfast', desc: 'Fuel up from 6:30am with porridge, eggs, Tibetan bread and hot Masala Chai.' },
  { icon: HeartHandshake, title: 'Warm Hospitality', desc: 'A family who knows the mountains, welcoming every guest like an old friend.' },
]

const reasons = [
  'An ideal overnight and acclimatization stop between Chame and Manang',
  'Rooftop restaurant with 360° mountain views on site',
  'Comfortable, quiet rooms to recover after a day on the trail',
  'Genuine local hospitality from a family who lives in Pisang',
  'Right on the Annapurna Circuit trekking route',
  'Trusted guides, porters and jeep transfers arranged for you',
  'Hot showers, Wi-Fi and hearty meals at 3,300 m',
]

const trekkerInfo = [
  { icon: Mountain, title: 'Acclimatize gently', desc: 'Pisang is a natural place to pause and adjust before higher ground. Ascend slowly and take a rest day if you can.' },
  { icon: BedDouble, title: 'Rest & recover', desc: 'Quiet, warm rooms help you sleep well at altitude, so you set off recharged for the next stage.' },
  { icon: UtensilsCrossed, title: 'Eat well', desc: 'Refillable Dal Bhat, soups and warm drinks keep your energy up for long days on the circuit.' },
  { icon: ShowerHead, title: 'Hot showers', desc: 'Warm up and freshen up after the trail — a simple comfort that makes a real difference up here.' },
  { icon: Compass, title: 'Local know-how', desc: 'Ask our team about trail conditions, viewpoints and day hikes to Ice Lake or Upper Pisang.' },
  { icon: Sunrise, title: 'Catch the light', desc: 'Sunrise and sunset set the peaks glowing — the rooftop is the perfect place to watch, tea in hand.' },
]

// Match a dish name to one of the real dish photos in /public/images.
function dishImage(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('momo')) return '/images/dish-momos.png'
  if (n.includes('pizza')) return '/images/dish-pizza.png'
  if (n.includes('dal') || n.includes('bhat')) return '/images/dish-dalbhat.png'
  if (/bread|omelette|porridge|breakfast|honey/.test(n)) return '/images/breakfast-view.png'
  return '/images/rooftop-dining.png'
}

export default function HomePage() {
  const settings = getSettings()

  // Rooms from the store (admin-editable), mapped to a display shape and
  // enriched with static display-only fields (size/bed) as a fallback.
  const rooms = db.rooms
    .filter((r) => r.active !== false)
    .map((r) => {
      const fb = roomFallback.find((x) => x.slug === r.slug)
      return {
        slug: r.slug,
        name: r.name,
        image: r.image,
        blurb: r.description || fb?.blurb || '',
        price: `from $${r.priceUSD}`,
        size: fb?.size ?? '',
        guests: `${r.maxGuests} guests`,
        bed: fb?.bed ?? '',
        features: (r.amenities && r.amenities.length ? r.amenities : fb?.features ?? []).slice(0, 4),
      }
    })

  // Offers & FAQs from the store so admin edits appear on the homepage.
  const offers = (db.offers.filter((o) => o.active).length
    ? db.offers.filter((o) => o.active)
    : offerFallback
  ).slice(0, 3)
  const faqs = getPublicFaqs()
    .slice(0, 8)
    .map((f) => ({ q: f.question, a: f.answer }))

  // Signature dishes — curated names, live price/description from the store
  // where available, falling back to the static menu.
  const menuLookup = new Map(db.menuItems.map((m) => [m.name.toLowerCase(), m]))
  const staticMenu = menuFallback.flatMap((c) => c.items)
  const staticLookup = new Map(staticMenu.map((m) => [m.name.toLowerCase(), m]))
  const signatureDishes = [
    'Dal Bhat Power',
    'Steamed Momos',
    'Margherita Pizza',
    'Tibetan Bread & Honey',
  ]
    .map((name) => {
      const rec = menuLookup.get(name.toLowerCase())
      const fb = staticLookup.get(name.toLowerCase())
      const desc = rec?.desc ?? fb?.desc ?? ''
      const price = rec ? `$${rec.priceUSD}` : fb?.price ?? ''
      const tag = rec?.offer ?? fb?.tag
      return { name, desc, price, tag, image: dishImage(name) }
    })
    .filter((d) => d.desc)

  // Gallery preview — enabled CMS images first, falling back to seed images.
  const gallery = getPublicGallery()
    .slice(0, 7)
    .map((g) => ({ src: g.src, alt: g.alt }))
  const galleryPreview = gallery.length
    ? gallery
    : [
        { src: '/images/hero-lodge-night.png', alt: 'The lodge at twilight' },
        { src: '/images/room-suite.png', alt: 'Summit Suite interior' },
        { src: '/images/rooftop-dining.png', alt: 'Rooftop dining at dusk' },
        { src: '/images/annapurna-peaks.png', alt: 'Annapurna peaks at sunrise' },
        { src: '/images/village-pisang.png', alt: 'Upper Pisang village' },
        { src: '/images/breakfast-view.png', alt: 'Breakfast with a view' },
        { src: '/images/lounge.png', alt: 'Lounge with wood stove' },
      ]

  // Legitimate structured data for a lodging business (accurate fields only).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: site.fullName,
    description:
      'Hotel Mountain Bridge & Rooftop Restaurant is a boutique Himalayan hotel in Pisang, Manang, on the Annapurna Circuit — mountain-view rooms and a rooftop restaurant at 3,300 m.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Pisang',
      addressRegion: 'Manang',
      addressCountry: 'NP',
    },
    telephone: site.phone,
    email: site.email,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.rating,
      bestRating: 5,
      reviewCount: 600,
    },
    starRating: { '@type': 'Rating', ratingValue: 5 },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1 · Cinematic hero */}
      <HomeHero hero={settings.hero} />

      {/* 2 · Quick hotel intro */}
      <section className="container-luxe grid gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Welcome to Mountain Bridge"
            title="A premium Himalayan stay in Pisang, Manang"
            description="Perched in Pisang on the legendary Annapurna Circuit, Hotel Mountain Bridge is a boutique lodge and rooftop restaurant built for travellers who want comfort without losing the raw magic of the mountains."
          />
          <Reveal delay={0.15}>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Every room frames a peak. Every meal is made to fuel the trail. And
              every guest is welcomed like family — because up here, at the roof
              of the world, hospitality is everything.
            </p>
          </Reveal>
          <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              'Pisang, Manang',
              'Annapurna Circuit',
              'Himalayan mountain views',
              'Rooftop restaurant',
              'Comfortable rooms',
              'Trekker-friendly hospitality',
            ].map((item) => (
              <StaggerItem key={item}>
                <div className="flex items-center gap-2.5 text-sm text-foreground/90">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  {item}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.2} className="flex flex-wrap gap-3">
            <LuxLink href="/book" variant="luxury" size="md">
              Book Your Stay
              <ArrowRight className="size-4" />
            </LuxLink>
            <LuxLink href="/about" variant="outline" size="md" shimmer={false}>
              Our Story
            </LuxLink>
          </Reveal>
        </div>

        <Reveal delay={0.1} y={40}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src="/images/annapurna-peaks.png"
              alt="Sunrise over the Annapurna range, seen from Hotel Mountain Bridge in Pisang"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="glass-strong absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl px-5 py-4">
              <div className="flex flex-col">
                <span className="font-serif text-lg text-foreground">
                  Annapurna II · 7,937 m
                </span>
                <span className="text-xs text-muted-foreground">
                  Framed from your window
                </span>
              </div>
              <Mountain className="size-6 text-primary" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 3 · Stats band */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="container-luxe grid grid-cols-2 gap-8 py-14 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="text-center">
              <div className="font-serif text-4xl font-light text-gradient-gold sm:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4 · Hotel highlights */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Why guests love it here"
          title="Everything you need at altitude"
          description="Small comforts and big views that make Mountain Bridge the stay trekkers remember long after the circuit."
          align="center"
          className="mx-auto max-w-2xl"
        />
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <StaggerItem key={h.title}>
              <div className="glass group h-full rounded-3xl p-6 transition-colors hover:border-primary/40">
                <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                  <h.icon className="size-5" />
                </span>
                <h3 className="font-serif text-xl text-foreground">{h.title}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {h.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* 5 · Rooms preview */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Stay with us"
              title="Rooms with a view of everything"
              description="Three room styles, all facing the mountains — from a snug valley-view retreat to our dramatic top-floor Summit Suite."
            />
            <Reveal>
              <LuxLink href="/rooms" variant="outline" shimmer={false}>
                All rooms <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <Reveal key={room.slug} delay={i * 0.1} y={40}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/40">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={room.image || '/placeholder.svg'}
                      alt={room.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-foreground">
                      {room.price}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-serif text-2xl text-foreground">{room.name}</h3>
                      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                        {room.blurb}
                      </p>
                    </div>

                    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      {room.size && (
                        <li className="flex items-center gap-1.5">
                          <Maximize className="size-3.5 text-primary" /> {room.size}
                        </li>
                      )}
                      <li className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary" /> {room.guests}
                      </li>
                      {room.bed && (
                        <li className="flex items-center gap-1.5">
                          <BedDouble className="size-3.5 text-primary" /> {room.bed}
                        </li>
                      )}
                    </ul>

                    {room.features.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {room.features.map((f) => (
                          <li
                            key={f}
                            className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-foreground/80"
                          >
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto flex items-center gap-3 border-t border-border/50 pt-4">
                      <LuxLink
                        href="/rooms"
                        variant="outline"
                        size="sm"
                        shimmer={false}
                        className="flex-1"
                      >
                        View Room
                      </LuxLink>
                      <LuxLink href="/book" variant="luxury" size="sm" className="flex-1">
                        Book Now
                      </LuxLink>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6 · Rooftop restaurant */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/restaurant-hero.png"
                alt="The rooftop restaurant at Hotel Mountain Bridge at golden hour"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="The Rooftop Restaurant"
              title="Dining above the clouds"
              description="Our rooftop is the heart of Mountain Bridge — a place to refuel with steaming dal bhat, hand-folded momos and wood-fired pizza while the peaks turn gold at dusk."
            />
            <Stagger className="grid grid-cols-2 gap-4">
              {[
                'Himalayan mountain views',
                'Local Nepalese food',
                'International dishes',
                'Breakfast & dinner',
                'Hot drinks & chai',
                'Cozy, warm atmosphere',
              ].map((f) => (
                <StaggerItem key={f}>
                  <div className="glass flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-foreground">
                    <Star className="size-4 shrink-0 fill-primary text-primary" />
                    {f}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.2} className="flex flex-wrap gap-3">
              <LuxLink href="/menu" variant="luxury">
                View Menu
              </LuxLink>
              <LuxLink href="/restaurant#reserve" variant="outline" shimmer={false}>
                Reserve a Table
              </LuxLink>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7 · Signature dishes */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="From our kitchen"
              title="Signature dishes"
              description="Hearty mountain cooking made to order — from the trekker's beloved Dal Bhat to wood-fired pizza this high in the Himalaya."
            />
            <Reveal>
              <LuxLink href="/menu" variant="outline" shimmer={false}>
                View full menu <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>

          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {signatureDishes.map((dish) => (
              <StaggerItem key={dish.name}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/40">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {dish.tag && (
                      <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium text-foreground">
                        {dish.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-xl text-foreground">{dish.name}</h3>
                      <span className="shrink-0 text-sm font-medium text-primary">
                        {dish.price}
                      </span>
                    </div>
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {dish.desc}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* 8 · Himalayan experience */}
      <section className="relative overflow-hidden">
        <ParallaxImage
          src="/images/annapurna-peaks.png"
          alt="The Annapurna range at sunrise above Pisang on the Annapurna Circuit"
          sizes="100vw"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        <div className="container-luxe relative z-10 flex min-h-[70vh] flex-col justify-end gap-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <SectionHeading
              eyebrow="The Himalayan experience"
              title="Wake up on the Annapurna Circuit"
              description="Pisang sits between Chame and Manang, ringed by some of the most photographed peaks in Nepal. Step outside to trekking routes, ancient villages and viewpoints where sunrise and sunset set the mountains alight."
            />
          </div>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Mountain, label: 'Annapurna II, IV & Pisang Peak' },
              { icon: Footprints, label: 'Trekking routes at the doorstep' },
              { icon: Camera, label: 'Sunrise & sunset photography' },
              { icon: Compass, label: 'Day hikes to Ice Lake & Upper Pisang' },
            ].map((item) => (
              <StaggerItem key={item.label}>
                <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-sm text-foreground">
                  <item.icon className="size-5 shrink-0 text-primary" />
                  {item.label}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.15}>
            <LuxLink href="/attractions" variant="luxury" size="lg">
              Explore the area <ArrowRight className="size-4" />
            </LuxLink>
          </Reveal>
        </div>
      </section>

      {/* 9 · Why stay with us */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Why stay with us"
              title="The most welcome stop on your circuit"
              description="Travellers choose Hotel Mountain Bridge for the simple things done well — comfort, views, good food and honest local care."
            />
            <Stagger className="flex flex-col gap-3">
              {reasons.map((r) => (
                <StaggerItem key={r}>
                  <div className="glass flex items-start gap-3 rounded-2xl px-5 py-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed text-foreground/90">{r}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal y={40}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src="/images/lounge.png"
                alt="The warm communal lounge with a wood stove at Hotel Mountain Bridge"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="glass-strong absolute bottom-4 left-4 right-4 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-primary" />
                  ))}
                </div>
                <p className="mt-2 text-sm text-foreground/90">
                  Rated {site.rating.toFixed(1)} by {site.reviewsCount} guests from around the world.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10 · Offers */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Special offers"
              title="Stay a little longer"
              description="Curated packages that pair restful nights with the best of the mountains."
            />
            <Reveal>
              <LuxLink href="/offers" variant="outline" shimmer={false}>
                All offers <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>

          <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
            {offers.map((o) => (
              <StaggerItem key={o.title}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/40">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={o.image || '/placeholder.svg'}
                      alt={o.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-foreground">
                      {o.tag}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-serif text-2xl text-foreground">{o.title}</h3>
                      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                        {o.desc}
                      </p>
                    </div>
                    {o.includes?.length > 0 && (
                      <ul className="flex flex-col gap-2">
                        {o.includes.slice(0, 4).map((inc) => (
                          <li key={inc} className="flex items-start gap-2 text-xs text-foreground/80">
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            {inc}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
                      <span className="text-sm text-primary">{o.price}</span>
                      <LuxLink href="/book" variant="luxury" size="sm">
                        Book Now
                      </LuxLink>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* 11 · Guest reviews */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Guest words"
          title="Loved by travellers from every corner"
          description="A perfect 5.0 rating, earned one warm welcome at a time."
          align="center"
          className="mx-auto max-w-2xl"
        />
        <div className="mt-14">
          <Testimonials limit={6} />
        </div>
        <Reveal className="mt-10 flex justify-center">
          <LuxLink href="/reviews" variant="outline" shimmer={false}>
            Read all reviews <ArrowRight className="size-4" />
          </LuxLink>
        </Reveal>
      </section>

      {/* 12 · Photo experience */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Photo experience"
              title="A glimpse of Mountain Bridge"
              description="Rooms, rooftop meals and the peaks that surround us — a little of what waits for you in Pisang."
            />
            <Reveal>
              <LuxLink href="/gallery" variant="outline" shimmer={false}>
                Explore full gallery <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>

          <Reveal className="mt-12">
            <div className="columns-2 gap-4 lg:columns-3 [&>*]:mb-4">
              {galleryPreview.map((img, i) => (
                <Link
                  key={`${img.src}-${i}`}
                  href="/gallery"
                  className="group relative block break-inside-avoid overflow-hidden rounded-2xl"
                >
                  <Image
                    src={img.src || '/placeholder.svg'}
                    alt={img.alt}
                    width={640}
                    height={i % 3 === 0 ? 800 : 520}
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-background/0 transition-colors group-hover:bg-background/20" />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 13 · Trekker information */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Good to know"
          title="Trekker information for the Annapurna Circuit"
          description="A few honest pointers to help you rest well and travel smart through Pisang and Manang."
          align="center"
          className="mx-auto max-w-2xl"
        />
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trekkerInfo.map((info) => (
            <StaggerItem key={info.title}>
              <article className="glass group h-full rounded-3xl p-6 transition-colors hover:border-primary/40">
                <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                  <info.icon className="size-5" />
                </span>
                <h3 className="font-serif text-xl text-foreground">{info.title}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {info.desc}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* 14 · Location / Pisang */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Find us"
              title="Hotel Mountain Bridge, Pisang, Manang, Nepal"
              description="We sit right on the Annapurna Circuit in Pisang — an ideal overnight and acclimatization stop between Chame and Manang, reached on foot or by jeep along the Besisahar–Manang road."
            />
            <Reveal delay={0.1}>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="size-4 text-primary" /> {site.location}
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Mountain className="size-4 text-primary" /> Plus code {site.plusCode}
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="size-4 text-primary" /> {site.altitude} on the Annapurna Circuit
                </li>
              </ul>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Nearby
                </span>
                <div className="flex flex-wrap gap-2">
                  {attractions.map((a) => (
                    <span
                      key={a.title}
                      className="rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-foreground/80"
                    >
                      {a.title} · {a.distance}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15} className="flex flex-wrap gap-3">
              <LuxLink href={site.mapsUrl} variant="luxury" size="md">
                <Navigation className="size-4" /> Get Directions
              </LuxLink>
              <LuxLink href="/contact" variant="outline" size="md" shimmer={false}>
                Contact the hotel
              </LuxLink>
            </Reveal>
          </div>
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60">
              <iframe
                title="Map of Pisang, Manang, Nepal"
                src={site.mapsEmbed}
                className="absolute inset-0 h-full w-full grayscale-[0.3] contrast-110"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 15 · FAQ preview */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Good to know"
              title="Questions, answered"
              description="Everything you need to plan a smooth, comfortable stay in Pisang."
            />
            <Reveal delay={0.1}>
              <LuxLink href="/faq" variant="outline" shimmer={false}>
                View all FAQs <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>
          <FaqAccordion items={faqs} />
        </div>
      </section>

      {/* 16 · Final booking CTA */}
      <section className="container-luxe pb-24 sm:pb-32">
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src="/images/hero-lodge-night.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-20 text-center sm:px-14 sm:py-28">
            <Reveal>
              <span className="eyebrow justify-center">Your stay in Pisang</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="max-w-3xl text-balance font-serif text-4xl font-light leading-tight text-foreground sm:text-6xl">
                Your Himalayan stay starts here
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="max-w-xl text-pretty leading-relaxed text-foreground/80">
                Stay, dine and experience Pisang from Hotel Mountain Bridge — mountain-view rooms
                and rooftop dining on the Annapurna Circuit, ready when you are.
              </p>
            </Reveal>
            <Reveal delay={0.18} className="flex flex-wrap justify-center gap-3">
              <LuxLink href="/book" variant="luxury" size="lg">
                Book Your Room
                <ArrowRight className="size-4" />
              </LuxLink>
              <LuxLink href="/restaurant#reserve" variant="glass" size="lg" shimmer={false}>
                Reserve a Table
              </LuxLink>
              <ConciergeCta />
            </Reveal>
            <Reveal delay={0.24}>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-foreground/80 transition-colors hover:text-primary"
              >
                or message us on WhatsApp
                <ArrowUpRight className="size-3.5" />
              </a>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
