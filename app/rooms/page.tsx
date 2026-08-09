import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Check,
  Wifi,
  ShowerHead,
  Flame,
  Coffee,
  Mountain,
  BatteryCharging,
  Leaf,
  Star,
  ArrowRight,
} from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { RoomCard } from '@/components/room-card'
import { CtaSection } from '@/components/cta-section'
import { FaqAccordion } from '@/components/faq-accordion'
import { BookingWidget } from '@/components/booking-widget'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'
import { rooms as roomFallback } from '@/lib/data'
import { db } from '@/lib/db/store'
import { getPublicFaqs } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rooms & Suites',
  description:
    'Boutique mountain-view rooms and suites at Hotel Mountain Bridge, Pisang — from cosy Valley View rooms to the panoramic Summit Suite.',
}

// Rooms from the admin-editable store, mapped to the RoomCard display shape.
function buildRooms() {
  const active = db.rooms.filter((r) => r.active !== false)
  const src = active.length ? active : roomFallback.map((r) => ({ ...r, priceUSD: 0, maxGuests: 2, active: true }))
  return src.map((r: any) => {
    const fb = roomFallback.find((x) => x.slug === r.slug)
    return {
      slug: r.slug,
      name: r.name,
      image: r.image,
      blurb: r.description || fb?.blurb || '',
      price: typeof r.priceUSD === 'number' && r.priceUSD > 0 ? `from $${r.priceUSD}` : fb?.price ?? '',
      size: fb?.size ?? '',
      guests: r.maxGuests ? `${r.maxGuests} guests` : fb?.guests ?? '',
      bed: fb?.bed ?? '',
      features: (r.amenities && r.amenities.length ? r.amenities : fb?.features ?? []).slice(0, 4),
    }
  })
}

const amenities = [
  { icon: Mountain, label: 'Mountain-view windows' },
  { icon: ShowerHead, label: 'Hot showers' },
  { icon: Flame, label: 'Heated common areas' },
  { icon: Wifi, label: 'Wi-Fi access' },
  { icon: BatteryCharging, label: 'Device charging' },
  { icon: Coffee, label: 'All-day tea & coffee' },
  { icon: Leaf, label: 'Warm wool bedding' },
  { icon: Star, label: 'Daily housekeeping' },
]

const comparison = [
  { feature: 'Guests', valley: '2', deluxe: '2–3', suite: '2–4' },
  { feature: 'Size', valley: '18 m²', deluxe: '26 m²', suite: '38 m²' },
  { feature: 'View', valley: 'Valley', deluxe: 'Panoramic', suite: 'Wraparound' },
  { feature: 'Ensuite bath', valley: 'Shared/Private', deluxe: 'Private', suite: 'Private + tub' },
  { feature: 'Wood stove', valley: '—', deluxe: '—', suite: 'Yes' },
  { feature: 'Private terrace', valley: '—', deluxe: '—', suite: 'Yes' },
  { feature: 'From', valley: '$38', deluxe: '$58', suite: '$88' },
]

export default function RoomsPage() {
  const rooms = buildRooms()
  const faqs = getPublicFaqs().map((f) => ({ q: f.question, a: f.answer }))
  return (
    <>
      <PageHero
        image="/images/rooms-hero.png"
        alt="A boutique room with a Himalayan view"
        eyebrow="Stay with us"
        title="Rooms that frame the mountains"
        description="Rest well between trekking days in warm, thoughtfully designed rooms — every one with a window onto the Annapurna range."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Rooms' }]}
      >
        <LuxLink href="#rooms" variant="luxury" size="lg">
          Browse rooms
        </LuxLink>
      </PageHero>

      {/* Intro */}
      <section className="container-luxe grid gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        <SectionHeading
          eyebrow="Comfort at altitude"
          title="Designed for deep mountain rest"
          description="At 3,300m, a good night's sleep is everything. Our rooms pair natural timber and stone with warm bedding, hot water and the quiet that only the high Himalaya can offer."
        />
        <Reveal delay={0.1}>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Whether you are acclimatizing before the Thorong La pass or simply
            savouring the stillness, you will find a calm, cosy retreat here —
            with the peaks always just beyond the glass.
          </p>
        </Reveal>
      </section>

      {/* Room categories */}
      <section id="rooms" className="container-luxe pb-20 sm:pb-28">
        <SectionHeading
          eyebrow="Room categories"
          title="Find your perfect room"
          align="center"
          className="mx-auto mb-14 max-w-2xl"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {rooms.map((room, i) => (
            <Reveal key={room.slug} delay={i * 0.1} y={40}>
              <RoomCard room={room} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured room */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/room-suite.png"
                alt="The Summit Suite"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-xs text-foreground">
                Featured · Summit Suite
              </span>
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="The signature stay"
              title="The Summit Suite"
              description="Our top-floor suite is the finest room on the property — wraparound windows, a glowing wood stove and a private terrace that opens onto the full Annapurna panorama."
            />
            <Stagger className="grid grid-cols-2 gap-3">
              {['Wraparound peak views', 'Private terrace', 'Wood stove', 'Soaking tub', 'King + daybed', 'Sunrise wake-up'].map(
                (f) => (
                  <StaggerItem key={f}>
                    <div className="flex items-center gap-2 text-sm text-foreground/90">
                      <Check className="size-4 shrink-0 text-primary" />
                      {f}
                    </div>
                  </StaggerItem>
                ),
              )}
            </Stagger>
            <Reveal delay={0.2}>
              <LuxLink href="#book" variant="luxury" size="lg">
                Reserve the suite <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Compare"
          title="Choose what suits your journey"
          align="center"
          className="mx-auto mb-12 max-w-2xl"
        />
        <Reveal>
          <div className="overflow-x-auto rounded-3xl border border-border/60">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-card/40">
                  <th className="p-4 font-medium text-muted-foreground">Feature</th>
                  <th className="p-4 font-serif text-base text-foreground">Valley View</th>
                  <th className="p-4 font-serif text-base text-foreground">Bridge Deluxe</th>
                  <th className="p-4 font-serif text-base text-primary">Summit Suite</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 ? 'bg-card/20' : ''}
                  >
                    <td className="p-4 font-medium text-foreground">{row.feature}</td>
                    <td className="p-4 text-muted-foreground">{row.valley}</td>
                    <td className="p-4 text-muted-foreground">{row.deluxe}</td>
                    <td className="p-4 text-foreground">{row.suite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* Amenities */}
      <section id="amenities" className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Amenities"
            title="Every comfort, thoughtfully provided"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {amenities.map((a) => (
              <StaggerItem key={a.label}>
                <div className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
                  <span className="grid size-11 place-items-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
                    <a.icon className="size-5" />
                  </span>
                  <span className="text-sm text-foreground">{a.label}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Experiences */}
      <section id="experiences" className="container-luxe py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/lounge.png"
                alt="The fireside lounge"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <SectionHeading
            eyebrow="The room experience"
            title="Wake to the peaks, unwind by the fire"
            description="Draw the curtains to a sunrise on Annapurna II, warm up in the communal lounge after the trail, and drift off under wool blankets to complete mountain silence. Small rituals that make a big difference at altitude."
          />
        </div>
      </section>

      {/* Booking */}
      <section id="book" className="border-t border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Reserve"
            title="Check availability for your dates"
            align="center"
            className="mx-auto mb-10 max-w-2xl"
          />
          <Reveal>
            <BookingWidget className="mx-auto max-w-4xl" />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            eyebrow="Room questions"
            title="Before you book"
          />
          <FaqAccordion items={faqs.slice(0, 5)} />
        </div>
      </section>

      <CtaSection
        title="Reserve your mountain room"
        description="Message us your dates and we'll confirm the perfect room with a view for your Annapurna adventure."
        image="/images/room-deluxe.png"
      />
    </>
  )
}
