import Image from 'next/image'
import type { Metadata } from 'next'
import {
  HeartHandshake,
  Leaf,
  Mountain,
  Sparkles,
  MapPin,
  Star,
} from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { CtaSection } from '@/components/cta-section'
import { Testimonials } from '@/components/testimonials'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Our Story',
  description:
    'The story of Hotel Mountain Bridge — a family-run boutique lodge and rooftop restaurant in Pisang, born from a love of the Himalaya and its travellers.',
}

const values = [
  { icon: HeartHandshake, title: 'Genuine hospitality', desc: 'We welcome every guest as family — the way the mountains have always taught us.' },
  { icon: Leaf, title: 'Rooted in place', desc: 'Local ingredients, local guides, and respect for the land and its people.' },
  { icon: Mountain, title: 'Made for the trail', desc: 'Everything we do is shaped by the needs of trekkers at altitude.' },
  { icon: Sparkles, title: 'Quiet luxury', desc: 'Comfort and care, without losing the raw magic of the high Himalaya.' },
]

const timeline = [
  { year: '2012', title: 'A dream on the trail', desc: 'A local family opens a small teahouse to welcome weary trekkers passing through Pisang.' },
  { year: '2016', title: 'The rooftop is born', desc: 'The terrace becomes a restaurant, quickly known for the best dal bhat — and views — on the circuit.' },
  { year: '2020', title: 'Rooms with a view', desc: 'Boutique rooms are added, each one framing the peaks, turning a stop into a stay.' },
  { year: 'Today', title: 'A perfect 5.0', desc: 'Now a beloved landmark on the Annapurna Circuit, rated five stars by travellers worldwide.' },
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        image="/images/about-hero.png"
        alt="The host family on the lodge terrace"
        eyebrow="Our story"
        title="Born of the mountains"
        description="Hotel Mountain Bridge is a family's love letter to the Himalaya and everyone who journeys through it — built on warmth, good food and a view that never grows old."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />

      {/* Story */}
      <section className="container-luxe grid gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="The beginning"
            title="A small light on a great trail"
            description="What began as a modest teahouse for passing trekkers has grown, one warm welcome at a time, into a boutique lodge that travellers plan their journeys around."
          />
          <Reveal delay={0.15}>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              We are a family who has lived in these mountains for generations.
              We know the cold of the trail and the comfort of a hot meal at the
              end of it. That knowledge shapes everything — from the wool on your
              bed to the refills of dal bhat on your plate.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1} y={40}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src="/images/village-pisang.png"
              alt="Upper Pisang village"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* Himalayan connection */}
      <section className="relative overflow-hidden border-y border-border/50 py-24 sm:py-32">
        <Image
          src="/images/annapurna-peaks.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-background/75" />
        <div className="container-luxe relative z-10 mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-balance font-serif text-2xl font-light leading-relaxed text-foreground sm:text-4xl">
              “Up here, hospitality isn't a service — it's survival, shared. We
              open our doors because the mountains taught us to.”
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-primary">
              The Mountain Bridge family
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="What we believe"
          title="Our philosophy"
          align="center"
          className="mx-auto mb-14 max-w-2xl"
        />
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <div className="glass h-full rounded-3xl p-7">
                <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <v.icon className="size-5" />
                </span>
                <h3 className="font-serif text-xl text-foreground">{v.title}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Timeline */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Our journey"
            title="A story written on the trail"
            align="center"
            className="mx-auto mb-16 max-w-2xl"
          />
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute left-4 top-0 h-full w-px bg-border/60 sm:left-1/2" aria-hidden />
            <div className="flex flex-col gap-10">
              {timeline.map((t, i) => (
                <Reveal key={t.year} delay={i * 0.08}>
                  <div
                    className={`relative flex flex-col gap-2 pl-12 sm:w-1/2 sm:pl-0 ${
                      i % 2 ? 'sm:ml-auto sm:pl-12' : 'sm:pr-12 sm:text-right'
                    }`}
                  >
                    <span
                      className={`absolute left-2.5 top-1.5 size-3 rounded-full bg-primary ring-4 ring-background sm:left-auto ${
                        i % 2 ? 'sm:-left-1.5' : 'sm:-right-1.5'
                      }`}
                      aria-hidden
                    />
                    <span className="font-serif text-2xl text-gradient-gold">
                      {t.year}
                    </span>
                    <h3 className="font-serif text-xl text-foreground">
                      {t.title}
                    </h3>
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {t.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <SectionHeading
            eyebrow="Where we are"
            title="At the heart of the Annapurna Circuit"
            description={`You'll find us in ${site.location}, perched at ${site.altitude} on one of the world's greatest treks — a warm light between Chame and Manang.`}
          />
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60">
              <iframe
                title="Map of Pisang, Nepal"
                src={site.mapsEmbed}
                className="absolute inset-0 h-full w-full grayscale-[0.3] contrast-110"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Guest words"
            title="The warmth guests remember"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <Testimonials limit={3} />
        </div>
      </section>

      <CtaSection
        title="Come be part of our story"
        description="Every guest adds a chapter. We'd love for the next one to be yours."
        image="/images/about-hero.png"
      />
    </>
  )
}
