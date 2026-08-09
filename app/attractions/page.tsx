import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Mountain,
  Compass,
  Footprints,
  Clock,
  TrendingUp,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { CtaSection } from '@/components/cta-section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'
import { attractions } from '@/lib/data'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Attractions & Things to Do',
  description:
    'Discover the Annapurna Circuit around Pisang — Upper Pisang, Ice Lake, viewpoints and trekking routes, all from Hotel Mountain Bridge.',
}

const info = [
  { icon: Mountain, label: 'Altitude', value: '3,300 m' },
  { icon: Footprints, label: 'On the circuit', value: 'Chame ↔ Manang' },
  { icon: Clock, label: 'Best season', value: 'Mar–May · Sep–Nov' },
  { icon: Compass, label: 'Region', value: 'Manang, Nepal' },
]

const itineraries = [
  {
    days: 'Day 1',
    title: 'Arrive & acclimatize',
    desc: 'Settle in, stroll Lower Pisang and rest with tea on the rooftop as the peaks glow at sunset.',
  },
  {
    days: 'Day 2',
    title: 'Upper Pisang & the gompa',
    desc: 'Climb to the traditional stone village and monastery for panoramic valley views, then return for lunch.',
  },
  {
    days: 'Day 3',
    title: 'Ice Lake challenge',
    desc: 'A demanding full-day acclimatization hike to the turquoise glacial lake above 4,600m.',
  },
  {
    days: 'Day 4',
    title: 'Onward to Manang',
    desc: 'Continue the circuit well-rested, with a packed trail lunch from our kitchen.',
  },
]

export default function AttractionsPage() {
  return (
    <>
      <PageHero
        image="/images/village-pisang.png"
        alt="Upper Pisang village and monastery"
        eyebrow="Explore"
        title="The Annapurna, at your doorstep"
        description="Pisang is a gateway to some of the finest trekking on earth. From gentle village walks to high glacial lakes, adventure begins the moment you step outside."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Attractions' }]}
      >
        <LuxLink href="#itineraries" variant="luxury" size="lg">
          Suggested itineraries
        </LuxLink>
      </PageHero>

      {/* Intro + info */}
      <section className="container-luxe grid gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        <SectionHeading
          eyebrow="Introduction"
          title="A perfect base on the circuit"
          description="Sitting at the midpoint of the Annapurna Circuit, Pisang splits into the traditional stone village of Upper Pisang and the trail-side Lower Pisang. It's the ideal place to acclimatize before the higher passes ahead."
        />
        <Stagger className="grid grid-cols-2 gap-4">
          {info.map((it) => (
            <StaggerItem key={it.label}>
              <div className="glass flex flex-col gap-2 rounded-2xl p-5">
                <it.icon className="size-5 text-primary" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {it.label}
                </span>
                <span className="font-serif text-lg text-foreground">
                  {it.value}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Nearby destinations */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Nearby destinations"
            title="Where the trails lead"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {attractions.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.08} y={40}>
                <article className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-3xl">
                  <Image
                    src={a.image || '/placeholder.svg'}
                    alt={a.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <div className="relative z-10 flex flex-col gap-2 p-6">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="rounded-full bg-primary/15 px-2.5 py-1 text-primary">
                        {a.category}
                      </span>
                      <span className="flex items-center gap-1 text-foreground/80">
                        <Clock className="size-3.5" /> {a.distance}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-foreground">
                      {a.title}
                    </h3>
                    <p className="max-w-md text-pretty text-sm leading-relaxed text-foreground/80">
                      {a.desc}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Itineraries */}
      <section id="itineraries" className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Suggested itineraries"
          title="Make the most of your days"
          description="A gentle, well-paced plan that puts acclimatization first — the smart way to enjoy the circuit."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {itineraries.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.08} y={30}>
              <div className="glass relative h-full rounded-3xl p-6">
                <span className="eyebrow mb-3">{it.days}</span>
                <h3 className="font-serif text-xl text-foreground">
                  {it.title}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {it.desc}
                </p>
                {i < itineraries.length - 1 && (
                  <ArrowRight className="mt-4 hidden size-5 text-primary lg:block" />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Travel info */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <SectionHeading
            eyebrow="Travel information"
            title="Getting to Pisang"
            description="Most trekkers reach Pisang on foot from Chame, or by jeep along the Besisahar–Manang road. Flights to Hongde (Humde) near Manang are seasonal. We're happy to help arrange transfers and guides."
          />
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60">
              <iframe
                title="Map of Pisang region"
                src={site.mapsEmbed}
                className="absolute inset-0 h-full w-full grayscale-[0.3] contrast-110"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Difficulty note */}
      <section className="container-luxe py-20 sm:py-28">
        <Reveal>
          <div className="glass flex flex-col items-start gap-4 rounded-3xl p-8 sm:flex-row sm:items-center sm:gap-8">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <TrendingUp className="size-6" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-serif text-2xl text-foreground">
                Trek smart, rest well
              </h3>
              <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                Altitude is real up here. Ascend slowly, hydrate, and take a rest
                day in Pisang before pushing toward Manang and the Thorong La
                pass. Our team keeps an eye on every guest and can advise if you
                feel unwell.
              </p>
            </div>
            <LuxLink href="/contact" variant="outline" shimmer={false} className="shrink-0">
              <MapPin className="size-4" /> Ask us
            </LuxLink>
          </div>
        </Reveal>
      </section>

      <CtaSection
        title="Base yourself at Mountain Bridge"
        description="The best adventures start with a good night's sleep and a hearty breakfast. Let us be your home on the circuit."
        image="/images/trekkers.png"
      />
    </>
  )
}
